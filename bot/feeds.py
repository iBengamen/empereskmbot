from __future__ import annotations

import asyncio
import logging
from typing import Dict
from urllib import request

import feedparser
from feedparser import FeedParserDict


DEFAULT_TIMEOUT = 15
DEFAULT_RETRIES = 3


async def refresh_feeds(feed_urls: Dict[str, str]) -> Dict[str, FeedParserDict | None]:
    tasks = [
        _fetch_and_parse(name, url, DEFAULT_RETRIES, DEFAULT_TIMEOUT)
        for name, url in feed_urls.items()
    ]
    results = await asyncio.gather(*tasks)
    return dict(zip(feed_urls.keys(), results, strict=True))


async def _fetch_and_parse(name: str, url: str, retries: int, timeout: int) -> FeedParserDict | None:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            logging.debug("Fetching %s feed (attempt %s)", name, attempt)
            data = await asyncio.to_thread(_download, url, timeout)
            parsed = feedparser.parse(data)
            if getattr(parsed, "bozo", 0):
                logging.warning(
                    "Feed %s reported problems: %s",
                    name,
                    getattr(parsed, "bozo_exception", "unknown"),
                )
            return parsed
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logging.warning("Failed to fetch %s feed: %s", name, exc, exc_info=True)
            await asyncio.sleep(min(2 ** attempt, 5))
    logging.error("Giving up on feed %s: %s", name, last_error)
    return None


def _download(url: str, timeout: int) -> bytes:
    with request.urlopen(url, timeout=timeout) as response:
        return response.read()
