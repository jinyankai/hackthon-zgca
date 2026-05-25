from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.config import settings
from app.services.feishu_send import send_to_feishu
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
async def search_chats(query: str = Query(default="", description="搜索关键词")) -> dict:
    params = json.dumps({"params": {"page_size": 20}}, ensure_ascii=False)
    cmd = [settings.feishu_cli_path, "exec", "im.v1.chat.list", "--params", params]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.lark_send_timeout)

        if proc.returncode != 0:
            err = stderr.decode("utf-8", errors="replace").strip()
            return {"ok": False, "error": err or "feishu-cli 返回错误", "chats": []}

        data = json.loads(stdout.decode("utf-8"))
        items = data.get("data", {}).get("items", [])

        chats = []
        for item in items:
            name = item.get("name", "")
            chat_id = item.get("chat_id", "")
            if query and query.lower() not in name.lower():
                continue
            chats.append({"name": name, "chatId": chat_id})

        return {"ok": True, "chats": chats, "error": None}

    except asyncio.TimeoutError:
        return {"ok": False, "error": "feishu-cli 超时", "chats": []}
    except Exception as e:
        return {"ok": False, "error": str(e), "chats": []}
