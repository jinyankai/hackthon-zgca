from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.schemas.events import WsEvent
from app.services.conversation import store
from app.services.emotion import apply_emotion_hit
from app.services.llm_service import polish_agent, translate_customer
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/demo")
async def demo_ws(websocket: WebSocket, role: str = "viewer") -> None:
    await manager.connect(role, websocket)
    await manager.send_role(role, "sync_state", store.to_dict())

    try:
        while True:
            raw = await websocket.receive_json()
            event = WsEvent.model_validate(raw)

            if event.type == "sync_state":
                await manager.send_role(role, "sync_state", store.to_dict())

            elif event.type == "customer_send":
                text = str(event.payload.get("text", "")).strip()
                input_mode = event.payload.get("inputMode", "text")
                if not text:
                    await manager.send_role(role, "system_alert", {"level": "warning", "message": "客户消息为空，未发送。"})
                    continue

                message = store.add_customer_message(text, input_mode)
                translated = await translate_customer(text, input_mode, store.to_context(), message.id)
                store.set_translated(translated)
                store.set_polished(None)
                store.state.emotionStatus = apply_emotion_hit(store.state.emotionStatus, translated.emotionLevel)

                if translated.source == "mock":
                    await manager.send_role("agent", "system_alert", {"level": "warning", "message": "LLM 不可用或超时，已使用演示 fallback。"})

                await manager.send_role("agent", "customer_translated", translated.model_dump())
                await manager.broadcast("sync_state", store.to_dict())

            elif event.type == "agent_draft":
                draft = str(event.payload.get("text", "")).strip()
                if not draft:
                    await manager.send_role(role, "system_alert", {"level": "warning", "message": "服务者草稿为空。"})
                    continue

                polished = await polish_agent(draft, store.to_context())
                store.set_polished(polished)
                if polished.source == "mock":
                    await manager.send_role("agent", "system_alert", {"level": "warning", "message": "LLM 不可用或超时，已使用话术 fallback。"})
                await manager.send_role("agent", "agent_polished", polished.model_dump())
                await manager.broadcast("sync_state", store.to_dict())

            elif event.type == "agent_approved":
                text = str(event.payload.get("text", "")).strip()
                if not text:
                    await manager.send_role(role, "system_alert", {"level": "warning", "message": "确认发送内容为空。"})
                    continue

                message = store.add_agent_message(text)
                await manager.broadcast("agent_approved", {"text": message.text})
                await manager.broadcast("sync_state", store.to_dict())

    except WebSocketDisconnect:
        manager.disconnect(role, websocket)
