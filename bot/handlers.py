from __future__ import annotations

import logging
import random

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from .config import Config
from .schedule import build_schedule
from .state import BotState
from .utils import esc_md

logger = logging.getLogger(__name__)


def _get_config(context: ContextTypes.DEFAULT_TYPE) -> Config:
    return context.application.bot_data["config"]


def _get_state(context: ContextTypes.DEFAULT_TYPE) -> BotState:
    return context.application.bot_data["state"]


def _get_timezone(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["tz"]


def _get_jokes(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data.get("jokes", [])


def _get_refresh(context: ContextTypes.DEFAULT_TYPE):
    return context.application.bot_data["refresh_feeds_func"]


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    greeting = (
        "*Тебя приветствует чат-бот, который отслеживает КМы для пачки Болгары ТМ Emperes клана.*\n"
        "Для получения информации о КМах используй команду /sbor"
    )
    await update.message.reply_text(greeting, parse_mode=ParseMode.MARKDOWN_V2)


async def sbor_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    config = _get_config(context)
    state = _get_state(context)
    tz = _get_timezone(context)
    schedule = build_schedule(state, config, tz, 30) if _feeds_ready(state) else None
    if schedule is None:
        await refresh_if_needed(context)
        schedule = build_schedule(state, config, tz, 30)
    if schedule:
        await update.message.reply_text(schedule, parse_mode=ParseMode.MARKDOWN_V2)
    else:
        await update.message.reply_text("Не удалось получить расписание. Попробуйте позже.")


def _feeds_ready(state: BotState) -> bool:
    return bool(state.feed_boss and state.feed_siege and state.feed_tw)


async def refresh_if_needed(context: ContextTypes.DEFAULT_TYPE) -> None:
    await _get_refresh(context)()


async def joke_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    jokes = _get_jokes(context)
    if jokes:
        await update.message.reply_text(random.choice(jokes))
    else:
        await update.message.reply_text("Анекдоты временно недоступны.")


async def adminsend_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    context.user_data["admin_mode"] = True
    await update.message.reply_text(
        "Режим отправки: пришлите текст, я перешлю его в группу Болгары."
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.message
    if message is None or not message.text:
        return
    if not context.user_data.get("admin_mode"):
        return
    context.user_data["admin_mode"] = False
    config = _get_config(context)
    state = _get_state(context)
    try:
        await context.bot.send_message(
            chat_id=config.admin_forward_chat,
            text=esc_md(message.text),
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        await message.reply_text("✅ Отправлено в группу.")
    except Exception as exc:  # noqa: BLE001
        logger.exception("Не получилось переслать сообщение из чата %s", message.chat_id)
        state.delivery_failures.append(f"admin:{exc}")
        await message.reply_text("❌ Не удалось отправить.")
