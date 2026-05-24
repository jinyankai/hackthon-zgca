from __future__ import annotations

import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, role: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[role].add(websocket)

    def disconnect(self, role: str, websocket: WebSocket) -> None:
        self._connections[role].discard(websocket)

    async def send_role(self, role: str, event_type: str, payload: dict) -> None:
        message = json.dumps({"type": event_type, "payload": payload}, ensure_ascii=False)
        for websocket in list(self._connections.get(role, [])):
            await websocket.send_text(message)

    async def broadcast(self, event_type: str, payload: dict) -> None:
        message = json.dumps({"type": event_type, "payload": payload}, ensure_ascii=False)
        for sockets in list(self._connections.values()):
            for websocket in list(sockets):
                await websocket.send_text(message)


manager = ConnectionManager()
