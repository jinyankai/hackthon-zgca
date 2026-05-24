from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

InputMode = Literal["text", "voice", "script"]
EmotionLevel = Literal["calm", "mild", "angry", "extreme"]


class Message(BaseModel):
    id: str
    conversationId: str
    sender: Literal["customer", "agent", "system"]
    text: str
    createdAt: str
    inputMode: InputMode = "text"
    approved: bool = False


class SuggestedReply(BaseModel):
    id: str
    tone: Literal["calm", "firm", "empathetic"]
    text: str


class TranslatedMessage(BaseModel):
    messageId: str
    originalText: str
    filteredText: str
    coreRequest: str
    emotionLevel: EmotionLevel
    emotionScore: int = Field(ge=1, le=5)
    riskFlags: list[str]
    suggestedReplies: list[SuggestedReply]
    originalVisible: bool = True
    approvalNeeded: bool = True
    source: Literal["llm", "mock"] = "mock"


class PolishedReply(BaseModel):
    id: str
    polishedText: str
    tone: Literal["calm", "firm", "empathetic"]
    changesSummary: str
    missingInfo: list[str]
    approvalNeeded: bool = True
    originalVisible: bool = True
    source: Literal["llm", "mock"] = "mock"


class ConversationSummary(BaseModel):
    id: str
    createdAt: str
    summary: str
    customerRequest: str
    handledResult: str
    emotionReview: str
    maliciousDetected: bool
    maliciousEvidence: list[str]
    supportMessage: str
    recoveryTips: list[str]
    source: Literal["llm", "mock"] = "mock"


class EmotionStatus(BaseModel):
    battery: int = Field(ge=0, le=100)
    status: Literal["healthy", "warning", "critical"]
    lastUpdatedAt: str
    restSuggested: bool


class ConversationState(BaseModel):
    conversationId: str
    messages: list[Message]
    latestTranslated: TranslatedMessage | None = None
    latestPolished: PolishedReply | None = None
    emotionStatus: EmotionStatus
    ended: bool = False
    summary: ConversationSummary | None = None
