from datetime import datetime, timedelta
from pathlib import Path

from feedparser import FeedParserDict
from zoneinfo import ZoneInfo

from bot.config import Config
from bot.schedule import ScheduleEvent, build_schedule, prepare_today
from bot.state import BotState


def make_config() -> Config:
    return Config(
        token="test-token",
        feeds={"boss": "", "siege": "", "tw": ""},
        info_groups=[],
        reminder_groups=[],
        admin_forward_chat=0,
        reminder_template="Напоминание: {km_today}",
        no_events_text="Нет КМов",
        day_names=["(ПН)", "(ВТ)", "(СР)", "(ЧТ)", "(ПТ)", "(СБ)", "(ВС)"],
        state_path=Path("data/state.json"),
    )


def test_build_schedule_generates_events():
    tz = ZoneInfo("Europe/Moscow")
    config = make_config()

    base = datetime.now(tz) - timedelta(days=4)
    published = base.timetuple()
    boss_feed = FeedParserDict(entries=[{"title": "Boss Baium was killed", "published_parsed": published}])

    state = BotState(feed_boss=boss_feed, feed_siege=None, feed_tw=None)
    text = build_schedule(state, config, tz, 5)

    assert text is not None
    assert "Баюм" in text
    assert state.km_today and state.km_today.startswith("Баюм")
    assert any(rem.text.startswith("Ждем респ Баюма") for rem in state.attention)


def test_prepare_today_respects_custom_rules():
    tz = ZoneInfo("Europe/Moscow")
    config = make_config()
    today_event = ScheduleEvent(
        date=datetime.now(tz),
        label="Осады, начало 18.00",
        day_label="(ПТ)",
    )
    km_today, reminders = prepare_today([today_event], tz, config)
    assert km_today == "Осады, начало 18.00"
    assert reminders[0].text == "Начинаем сбор на осаду!!!"
