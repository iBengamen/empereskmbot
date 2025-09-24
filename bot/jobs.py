from __future__ import annotations

import logging
from datetime import datetime

from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from .schedule import build_schedule
from .state import BotState
from .utils import esc_md, send_to_chats

logger = logging.getLogger(__name__)


def _get_state(context: ContextTypes.DEFAULT_TYPE) -> BotState:
    return context.application.bot_data["state"]


def _get_config(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["config"]


def _get_timezone(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["tz"]


def _get_state_store(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["state_store"]


def _get_refresh(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["refresh_feeds_func"]


async def job_refresh_feeds(context: ContextTypes.DEFAULT_TYPE) -> None:
    await _get_refresh(context)()


async def job_show_info(context: ContextTypes.DEFAULT_TYPE) -> None:
    config = _get_config(context)
    state = _get_state(context)
    tz = _get_timezone(context)
    state_store = _get_state_store(context)
    schedule = build_schedule(state, config, tz, 7)
    if not schedule:
        logger.info("Нет событий для рассылки расписания")
        state_store.save(state)
        return
    await send_to_chats(context.bot, config.info_groups, schedule, state=state)
    state_store.save(state)


async def job_reminder_broadcast(context: ContextTypes.DEFAULT_TYPE) -> None:
    config = _get_config(context)
    state = _get_state(context)
    tz = _get_timezone(context)
    state_store = _get_state_store(context)
    if state.km_today is None:
        schedule = build_schedule(state, config, tz, 7)
        if schedule is None:
            state_store.save(state)
            return
    reminder_text = config.reminder_template.format(
        km_today=state.km_today or config.no_events_text
    )
    msg = esc_md(reminder_text)
    await context.bot.send_message(
        chat_id=config.admin_forward_chat, text=msg, parse_mode=ParseMode.MARKDOWN_V2
    )
    await send_to_chats(context.bot, config.reminder_groups, msg, state=state)
    state_store.save(state)


async def job_tick_attention(context: ContextTypes.DEFAULT_TYPE) -> None:
    state = _get_state(context)
    config = _get_config(context)
    state_store = _get_state_store(context)
    now = datetime.now(_get_timezone(context))
    changed = False
    for reminder in state.attention:
        if reminder.fired or now < reminder.fire_at:
            continue
        reminder.fired = True
        changed = True
        txt = esc_md(reminder.text)
        await send_to_chats(
            context.bot,
            config.info_groups,
            f"*{esc_md('Напоминание')}*\n{txt}",
            state=state,
        )
    if changed:
        state_store.save(state)
