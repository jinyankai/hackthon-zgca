from __future__ import annotations

import asyncio
import json
from pathlib import Path
from uuid import uuid4

import httpx

from app.config import settings
from app.mocks.fallback import mock_polish_agent, mock_translate_customer
from app.schemas.conversation import PolishedReply, TranslatedMessage

try:
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover
    AsyncOpenAI = None

PROMPT_DIR = Path(__file__).resolve().parents[1] / "prompts"
client = (
    AsyncOpenAI(api_key=settings.openai_api_key)
    if AsyncOpenAI and settings.llm_provider == "openai" and settings.llm_live_enabled
    else None
)


async def _json_chat(system_prompt: str, user_prompt: str) -> dict:
    if settings.llm_provider in {"deepseek_anthropic", "anthropic"}:
        return await _anthropic_json_chat(system_prompt, user_prompt)
    return await _openai_json_chat(system_prompt, user_prompt)


async def _openai_json_chat(system_prompt: str, user_prompt: str) -> dict:
    if client is None:
        raise RuntimeError("OpenAI client unavailable")

    response = await asyncio.wait_for(
        client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        ),
        timeout=settings.llm_timeout_seconds,
    )
    content = response.choices[0].message.content or "{}"
    return _loads_json(content)


async def _anthropic_json_chat(system_prompt: str, user_prompt: str) -> dict:
    if not settings.deepseek_api_key:
        raise RuntimeError("DeepSeek Anthropic API key unavailable")

    url = f"{settings.anthropic_base_url.rstrip('/')}/v1/messages"
    headers = {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": settings.deepseek_api_key,
    }
    payload = {
        "model": settings.llm_model,
        "max_tokens": 1000,
        "temperature": 0.2,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as http:
        response = await http.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    blocks = data.get("content") or []
    text = "".join(block.get("text", "") for block in blocks if block.get("type") == "text")
    return _loads_json(text)


def _loads_json(content: str) -> dict:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(content[start : end + 1])


def _normalize_translation(data: dict, original_text: str, message_id: str, source: str) -> TranslatedMessage:
    suggested = data.get("suggestedReplies") or data.get("suggested_replies") or []
    normalized_replies = []
    for index, reply in enumerate(suggested):
        normalized_replies.append(
            {
                "id": reply.get("id") or f"reply-{index + 1}",
                "tone": reply.get("tone", "firm"),
                "text": reply.get("text", ""),
            }
        )

    return TranslatedMessage(
        messageId=message_id,
        originalText=original_text,
        filteredText=data.get("filteredText") or data.get("filtered_text") or "客户提出了需要处理的服务诉求。",
        coreRequest=data.get("coreRequest") or data.get("core_request") or "确认客户问题并给出下一步处理方式。",
        emotionLevel=data.get("emotionLevel") or data.get("emotion_level") or "mild",
        emotionScore=int(data.get("emotionScore") or data.get("emotion_score") or 2),
        riskFlags=data.get("riskFlags") or data.get("risk_flags") or [],
        suggestedReplies=normalized_replies,
        originalVisible=True,
        approvalNeeded=True,
        source=source,
    )


def _normalize_polish(data: dict, fallback_text: str, source: str) -> PolishedReply:
    return PolishedReply(
        id=f"polished-{uuid4().hex[:8]}",
        polishedText=data.get("polishedText") or data.get("polished_text") or fallback_text,
        tone=data.get("tone", "firm"),
        changesSummary=data.get("changesSummary") or data.get("changes_summary") or "已优化为更专业、清晰的表达。",
        missingInfo=data.get("missingInfo") or data.get("missing_info") or [],
        approvalNeeded=True,
        originalVisible=True,
        source=source,
    )


async def translate_customer(text: str, input_mode: str, context: str, message_id: str) -> TranslatedMessage:
    system_prompt = (PROMPT_DIR / "downlink.md").read_text(encoding="utf-8")
    user_prompt = f"客户原文：{text}\n\n输入方式：{input_mode}\n\n已知上下文：{context}"

    try:
        data = await _json_chat(system_prompt, user_prompt)
        return _normalize_translation(data, text, message_id, "llm")
    except Exception:
        data = mock_translate_customer(text)
        return _normalize_translation(data, text, message_id, "mock")


async def polish_agent(draft: str, context: str) -> PolishedReply:
    system_prompt = (PROMPT_DIR / "uplink.md").read_text(encoding="utf-8")
    user_prompt = f"服务者草稿：{draft}\n\n已知上下文：{context}"

    try:
        data = await _json_chat(system_prompt, user_prompt)
        return _normalize_polish(data, draft, "llm")
    except Exception:
        data = mock_polish_agent(draft, context)
        return _normalize_polish(data, draft, "mock")
