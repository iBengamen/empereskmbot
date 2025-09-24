from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, time
from typing import Dict, Iterable, List, Optional

from feedparser import FeedParserDict
from zoneinfo import ZoneInfo

from .config import Config
from .state import BotState, Reminder
from .utils import esc_md, mk_time_today

DATE_FMT = "%d.%m.%Y"


@dataclass(frozen=True)
class RespawnRule:
    feed_key: str
    title: str
    offsets: Iterable[int]
    label: str


RESPAWN_RULES: List[RespawnRule] = [
    RespawnRule("boss", "Boss Beleth was killed", [5, 10, 15, 20, 25, 30], "Белеф"),
    RespawnRule("boss", "Boss Baium was killed", [4, 8, 12, 16, 20, 24, 28], "Баюм"),
    RespawnRule("boss", "Boss Antharas was killed", [8, 16, 24], "Антарас"),
    RespawnRule("boss", "Boss Valakas was killed", [8, 16, 24], "Валакас"),
    RespawnRule("siege", "The siege of Rune has ended", [14, 28], "Осады, начало 18.00"),
    RespawnRule("tw", "Territory wars has ended", [14, 28], "Битвы за земли, начало 20.00"),
]


@dataclass(frozen=True)
class ReminderSpec:
    template: str
    hour: int
    minute: int

    def render(self, boss: str) -> str:
        return self.template.format(boss=boss)


REMINDER_RULES: Dict[str, ReminderSpec] = {
    "Осады, начало 18.00": ReminderSpec("Начинаем сбор на осаду!!!", 14, 30),
    "Битвы за земли, начало 20.00": ReminderSpec("Начинаем сбор на ТВ!!!", 16, 30),
}
DEFAULT_REMINDER_RULE = ReminderSpec("Ждем респ {boss}а!!!", 15, 0)


@dataclass(frozen=True)
class ScheduleEvent:
    date: datetime
    label: str
    day_label: str


def build_schedule(state: BotState, config: Config, tz: ZoneInfo, days: int) -> Optional[str]:
    feeds: Dict[str, Optional[FeedParserDict]] = {
        "boss": state.feed_boss,
        "siege": state.feed_siege,
        "tw": state.feed_tw,
    }
    events: List[ScheduleEvent] = []
    for rule in RESPAWN_RULES:
        feed = feeds.get(rule.feed_key)
        if not feed:
            continue
        for entry in getattr(feed, "entries", []):
            if entry.get("title") != rule.title:
                continue
            base_date = _extract_entry_date(entry, tz)
            if base_date is None:
                continue
            for offset in rule.offsets:
                resp_date = (base_date + timedelta(days=offset))
                day_label = config.day_names[(resp_date.weekday() + 1) % 7]
                events.append(
                    ScheduleEvent(
                        date=resp_date,
                        label=rule.label,
                        day_label=day_label,
                    )
                )

    if not events:
        state.attention = []
        state.km_today = config.no_events_text
        return None

    events.sort(key=lambda event: event.date)
    km_today, reminders = prepare_today(events, tz, config)
    state.attention = reminders
    state.km_today = km_today

    limit_date = datetime.now(tz) + timedelta(days=days)
    lines = [
        f"*{esc_md('Расписание по КМ на ближайшие ' + str(days) + ' дней:')}*"
    ]
    for event in events:
        if event.date <= limit_date:
            lines.append(
                f"*{esc_md(event.date.strftime(DATE_FMT))}* _{esc_md(event.day_label + ' ' + event.label)}_"
            )
    lines.append("")
    lines.append(f"*{esc_md('Сегодня в планах:')}*")
    lines.append(esc_md(km_today))
    return "\n".join(lines)


def prepare_today(events: List[ScheduleEvent], tz: ZoneInfo, config: Config) -> tuple[str, List[Reminder]]:
    today = datetime.now(tz).date()
    names: List[str] = []
    reminders: List[Reminder] = []
    seen: set[str] = set()
    for event in events:
        event_date = event.date.date()
        if event_date != today or event.label in seen:
            continue
        seen.add(event.label)
        names.append(event.label)
        spec = REMINDER_RULES.get(event.label, DEFAULT_REMINDER_RULE)
        reminder_time = mk_time_today(spec.hour, spec.minute, tz)
        reminders.append(Reminder(spec.render(event.label), reminder_time))
    km_today = "\n".join(names) if names else config.no_events_text
    return km_today, reminders


def _extract_entry_date(entry: FeedParserDict, tz: ZoneInfo) -> Optional[datetime]:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    return datetime(parsed.tm_year, parsed.tm_mon, parsed.tm_mday, tzinfo=tz)
