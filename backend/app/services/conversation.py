from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.config import settings
from app.schemas.conversation import ConversationState, InputMode, Message, PolishedReply, TranslatedMessage
from app.services.emotion import make_initial_emotion_status


class ConversationStore:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> ConversationState:
        self.state = ConversationState(
            conversationId=settings.conversation_id,
            messages=[],
            latestTranslated=None,
            latestPolished=None,
            emotionStatus=make_initial_emotion_status(),
        )
        return self.state

    def add_customer_message(self, text: str, input_mode: InputMode = "text") -> Message:
        message = Message(
            id=f"msg-{uuid4().hex[:8]}",
            conversationId=self.state.conversationId,
            sender="customer",
            text=text,
            createdAt=datetime.now(timezone.utc).isoformat(),
            inputMode=input_mode,
        )
        self.state.messages.append(message)
        return message

    def add_agent_message(self, text: str) -> Message:
        message = Message(
            id=f"msg-{uuid4().hex[:8]}",
            conversationId=self.state.conversationId,
            sender="agent",
            text=text,
            createdAt=datetime.now(timezone.utc).isoformat(),
            inputMode="text",
            approved=True,
        )
        self.state.messages.append(message)
        return message

    def set_translated(self, translated: TranslatedMessage) -> None:
        self.state.latestTranslated = translated

    def set_polished(self, polished: PolishedReply | None) -> None:
        self.state.latestPolished = polished

    def to_context(self) -> str:
        recent = self.state.messages[-6:]
        if not recent:
            return "暂无历史消息。"
        return "\n".join(f"{item.sender}: {item.text}" for item in recent)

    def to_dict(self) -> dict:
        return self.state.model_dump()


store = ConversationStore()
