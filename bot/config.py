from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import tomllib


class ConfigError(RuntimeError):
    """Raised when configuration cannot be loaded or validated."""


@dataclass(frozen=True)
class Config:
    token: str
    feeds: Dict[str, str]
    info_groups: List[int]
    reminder_groups: List[int]
    admin_forward_chat: int
    reminder_template: str
    no_events_text: str
    day_names: List[str]
    state_path: Path


DEFAULT_DAY_NAMES = ["(ПН)", "(ВТ)", "(СР)", "(ЧТ)", "(ПТ)", "(СБ)", "(ВС)"]
DEFAULT_REMINDER_TEMPLATE = "Напоминание, красавчики: {km_today}"
DEFAULT_NO_EVENTS_TEXT = "Нет КМов, отдыхайте друзья"
DEFAULT_STATE_PATH = Path("data/state.json")


def load_config() -> Config:
    config_path = Path(os.getenv("ASTERIOS_CONFIG_PATH", "config.toml"))
    if not config_path.exists():
        raise ConfigError(
            "Не найден файл конфигурации. Создайте его по примеру config.example.toml"
        )

    with config_path.open("rb") as fh:
        raw = tomllib.load(fh)

    telegram_section = _require_section(raw, "telegram")
    token_env = telegram_section.get("token_env", "TELEGRAM_TOKEN")
    token = os.getenv(token_env)
    if not token:
        raise ConfigError(
            f"Не найден токен Telegram. Установите переменную окружения {token_env}."
        )

    chats_section = _require_section(raw, "chats")
    info_groups = _require_int_list(chats_section, "info_groups")
    reminder_groups = _require_int_list(chats_section, "reminder_groups")
    admin_forward_chat = _require_int(chats_section, "admin_forward_chat")

    feeds_section = _require_section(raw, "feeds")
    feeds = _require_str_dict(feeds_section, ["boss", "siege", "tw"])

    notifications = raw.get("notifications", {})
    reminder_template = notifications.get("reminder_template", DEFAULT_REMINDER_TEMPLATE)
    no_events_text = notifications.get("no_events_text", DEFAULT_NO_EVENTS_TEXT)
    day_names = notifications.get("day_names", DEFAULT_DAY_NAMES)
    if len(day_names) != 7:
        raise ConfigError("В секции notifications.day_names должно быть ровно 7 значений.")

    storage_section = raw.get("storage", {})
    state_path = Path(storage_section.get("state_path", DEFAULT_STATE_PATH))
    state_path.parent.mkdir(parents=True, exist_ok=True)

    return Config(
        token=token,
        feeds=feeds,
        info_groups=info_groups,
        reminder_groups=reminder_groups,
        admin_forward_chat=admin_forward_chat,
        reminder_template=reminder_template,
        no_events_text=no_events_text,
        day_names=list(day_names),
        state_path=state_path,
    )


def _require_section(root: Dict[str, Any], name: str) -> Dict[str, Any]:
    if name not in root or not isinstance(root[name], dict):
        raise ConfigError(f"Ожидалась секция '{name}' в config.toml")
    return root[name]


def _require_int(section: Dict[str, Any], key: str) -> int:
    value = section.get(key)
    if not isinstance(value, int):
        raise ConfigError(f"Параметр '{key}' должен быть целым числом")
    return value


def _require_int_list(section: Dict[str, Any], key: str) -> List[int]:
    value = section.get(key)
    if not isinstance(value, list) or not all(isinstance(item, int) for item in value):
        raise ConfigError(f"Параметр '{key}' должен быть списком целых чисел")
    return list(value)


def _require_str_dict(section: Dict[str, Any], required_keys: List[str]) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for key in required_keys:
        value = section.get(key)
        if not isinstance(value, str) or not value:
            raise ConfigError(f"Ключ '{key}' должен быть непустой строкой")
        result[key] = value
    return result
