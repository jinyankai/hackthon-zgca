from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class WsEvent(BaseModel):
    type: str
    payload: dict[str, Any] = {}
    timestamp: str | None = None
