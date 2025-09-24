from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, List, Optional

from zoneinfo import ZoneInfo


@dataclass
class Reminder:
    text: str
    fire_at: datetime
    fired: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "fire_at": self.fire_at.isoformat(),
            "fired": self.fired,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Reminder":
        fire_at = datetime.fromisoformat(data["fire_at"])
        return cls(text=data["text"], fire_at=fire_at, fired=data.get("fired", False))


@dataclass
class BotState:
    feed_boss: Optional[Any] = None
    feed_siege: Optional[Any] = None
    feed_tw: Optional[Any] = None
    attention: List[Reminder] = field(default_factory=list)
    km_today: Optional[str] = None
    delivery_failures: List[str] = field(default_factory=list)

    def reset_feeds(self) -> None:
        self.feed_boss = None
        self.feed_siege = None
        self.feed_tw = None

    def to_persisted_dict(self) -> dict[str, Any]:
        return {
            "attention": [reminder.to_dict() for reminder in self.attention],
            "km_today": self.km_today,
        }

    def load_persisted(self, data: dict[str, Any], tz: ZoneInfo) -> None:
        reminders = []
        for item in data.get("attention", []):
            reminder = Reminder.from_dict(item)
            if reminder.fire_at.tzinfo is None:
                reminder = Reminder(
                    text=reminder.text,
                    fire_at=reminder.fire_at.replace(tzinfo=tz),
                    fired=reminder.fired,
                )
            reminders.append(reminder)
        self.attention = reminders
        self.km_today = data.get("km_today")


class StateStore:
    def __init__(self, path: Path, tz: ZoneInfo) -> None:
        self._path = path
        self._tz = tz

    def load(self) -> BotState:
        state = BotState()
        if not self._path.exists():
            return state
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            return state
        if isinstance(raw, dict):
            state.load_persisted(raw, self._tz)
        return state

    def save(self, state: BotState) -> None:
        data = state.to_persisted_dict()
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
