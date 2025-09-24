from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional

from telegram.constants import ParseMode
from telegram.error import RetryAfter

from .state import BotState

MDV2_SPECIALS = r"_*[]()~`>#+-=|{}.!\\"


def esc_md(text: str) -> str:
    return "".join(f"\\{ch}" if ch in MDV2_SPECIALS else ch for ch in text)


def mk_time_today(hour: int, minute: int, tz) -> datetime:
    now = datetime.now(tz)
    return datetime(now.year, now.month, now.day, hour, minute, tzinfo=tz)


def load_jokes() -> List[str]:
    base_path = Path(__file__).resolve().parent
    jokes_file = base_path / "resources" / "jokes.txt"
    if not jokes_file.exists():
        logging.warning("Файл с анекдотами не найден: %s", jokes_file)
        return []
    with jokes_file.open(encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip()]


async def send_to_chats(
    bot,
    chat_ids: Iterable[int],
    text: str,
    parse_mode: Optional[ParseMode] = ParseMode.MARKDOWN_V2,
    state: Optional[BotState] = None,
) -> None:
    for chat_id in chat_ids:
        sent = False
        while not sent:
            try:
                await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
                sent = True
                await asyncio.sleep(0.05)
            except RetryAfter as e:
                await asyncio.sleep(e.retry_after + 0.1)
            except Exception as exc:  # noqa: BLE001
                logging.exception("Failed to deliver message to chat %s", chat_id, exc_info=True)
                if state is not None:
                    state.delivery_failures.append(f"{chat_id}:{exc}")
                    if len(state.delivery_failures) > 100:
                        state.delivery_failures[:] = state.delivery_failures[-100:]
                break
