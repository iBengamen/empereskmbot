from __future__ import annotations

import logging
from datetime import time

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from zoneinfo import ZoneInfo

from . import feeds, handlers, jobs
from .config import Config, ConfigError, load_config
from .state import StateStore
from .utils import load_jokes

TZ = ZoneInfo("Europe/Moscow")
REMINDER_SCHEDULE = [(10, 0), (15, 0)]


def create_application() -> Application:
    config = load_config()
    state_store = StateStore(config.state_path, TZ)
    state = state_store.load()
    jokes = load_jokes()

    application = Application.builder().token(config.token).build()

    async def refresh_feeds_func() -> None:
        result = await feeds.refresh_feeds(config.feeds)
        state.feed_boss = result.get("boss")
        state.feed_siege = result.get("siege")
        state.feed_tw = result.get("tw")
        state_store.save(state)

    application.bot_data.update(
        {
            "config": config,
            "state": state,
            "state_store": state_store,
            "tz": TZ,
            "jokes": jokes,
            "refresh_feeds_func": refresh_feeds_func,
        }
    )

    application.add_handler(CommandHandler("start", handlers.start_command))
    application.add_handler(CommandHandler("sbor", handlers.sbor_command))
    application.add_handler(CommandHandler("joke", handlers.joke_command))
    application.add_handler(CommandHandler("adminsend", handlers.adminsend_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.handle_text))

    jq = application.job_queue
    jq.run_daily(jobs.job_refresh_feeds, time(0, 10, tzinfo=TZ))
    jq.run_daily(jobs.job_show_info, time(6, 0, tzinfo=TZ))
    for hour, minute in REMINDER_SCHEDULE:
        jq.run_daily(jobs.job_reminder_broadcast, time(hour, minute, tzinfo=TZ))
    jq.run_repeating(jobs.job_tick_attention, interval=30, first=0)

    application.post_init = _make_post_init(config, jokes)
    return application


def _make_post_init(config: Config, jokes: list[str]):
    async def _post_init(app: Application) -> None:
        await app.bot.set_my_commands(
            [
                ("start", "Начальное приветствие"),
                ("sbor", "Расписание КМ на 30 дней"),
                ("joke", "Травануть анекдот"),
            ]
        )
        if not jokes:
            logging.warning("Список анекдотов пустой")
        await app.bot_data["refresh_feeds_func"]()

    return _post_init


def run() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    try:
        application = create_application()
    except ConfigError as exc:
        logging.error("Не удалось загрузить конфигурацию: %s", exc)
        raise SystemExit(1) from exc
    application.run_polling()
