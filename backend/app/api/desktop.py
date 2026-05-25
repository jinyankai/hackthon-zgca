from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.feishu_send import send_to_feishu, search_chats as feishu_search_chats
from app.services.llm_service import polish_agent

router = APIRouter(prefix="/desktop")


class PolishSendRequest(BaseModel):
    draft: str
    target_type: str = ""  # chat_id | user_id
    target_id: str = ""
    context: str = ""


class PolishSendResponse(BaseModel):
    polishedText: str
    changesSummary: str
    sent: bool
    messageId: str | None = None
    sendError: str | None = None
    source: str = "mock"


@router.post("/polish-send", response_model=PolishSendResponse)
async def polish_and_send(req: PolishSendRequest) -> PolishSendResponse:
    context = req.context or "无上下文"
    polished = await polish_agent(req.draft, context)

    if not req.target_id or not req.target_type:
        return PolishSendResponse(
            polishedText=polished.polishedText,
            changesSummary=polished.changesSummary,
            sent=False,
            sendError="未绑定发送目标，仅返回优化文本",
            source=polished.source,
        )

    result = await send_to_feishu(polished.polishedText, req.target_type, req.target_id)

    return PolishSendResponse(
        polishedText=polished.polishedText,
        changesSummary=polished.changesSummary,
        sent=result.success,
        messageId=result.message_id,
        sendError=result.error,
        source=polished.source,
    )


@router.get("/lark/chats")
async def lark_chats(query: str = Query(default="", description="搜索关键词")) -> dict:
    return await feishu_search_chats(query)
