from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx

from app.config import settings
from app.mocks.fallback import detect_malicious, mock_polish_agent, mock_summarize_conversation, mock_translate_customer
from app.schemas.conversation import ConversationSummary, PolishedReply, TranslatedMessage

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


def _normalize_summary(data: dict, messages: list[dict], latest_translated: dict | None, source: str) -> ConversationSummary:
    latest_translated = latest_translated or {}
    local_malicious, local_evidence = detect_malicious(
        messages,
        latest_translated.get("riskFlags") or latest_translated.get("risk_flags") or [],
        latest_translated.get("emotionLevel") or latest_translated.get("emotion_level"),
    )
    model_evidence = data.get("maliciousEvidence") or data.get("malicious_evidence") or []
    malicious_detected = bool(data.get("maliciousDetected") or data.get("malicious_detected") or local_malicious)
    evidence = list(dict.fromkeys([*model_evidence, *local_evidence]))

    return ConversationSummary(
        id=f"summary-{uuid4().hex[:8]}",
        createdAt=datetime.now(timezone.utc).isoformat(),
        summary=data.get("summary") or "本轮对话已结束，系统已完成要点梳理。",
        customerRequest=data.get("customerRequest") or data.get("customer_request") or latest_translated.get("coreRequest") or "确认客户问题并给出下一步处理方式。",
        handledResult=data.get("handledResult") or data.get("handled_result") or "已向客户给出专业回应，并保留服务者最终确认权。",
        emotionReview=data.get("emotionReview") or data.get("emotion_review") or "客户存在情绪压力，服务者保持了专业回应。",
        maliciousDetected=malicious_detected,
        maliciousEvidence=evidence,
        supportMessage=data.get("supportMessage") or data.get("support_message") or _default_support_message(malicious_detected),
        recoveryTips=data.get("recoveryTips") or data.get("recovery_tips") or _default_recovery_tips(malicious_detected),
        source=source,
    )


def _default_support_message(malicious_detected: bool) -> str:
    if malicious_detected:
        return "这次沟通中出现了明显攻击性表达。对方的恶意不是你的个人责任，你已经在边界内完成了专业处理。"
    return "本轮沟通已经结束，你保持了清晰、克制和专业。可以短暂调整呼吸，再进入下一轮服务。"


def _default_recovery_tips(malicious_detected: bool) -> list[str]:
    if malicious_detected:
        return ["离开屏幕30秒", "喝水并放松肩颈", "必要时请求同事接力"]
    return ["记录处理要点", "短暂复位", "继续下一单"]


from app.services.style_presets import get_style_instruction


def _get_adaptive_instruction(battery: int) -> str:
    if battery > 70:
        return ""
    if battery > 40:
        return "\n\n【自适应保护】当前服务者情绪电量偏低（{battery}%），请将翻译结果进一步温和化：减少负面词汇，多用缓冲语气，语调更加轻柔体贴。".format(battery=battery)
    return "\n\n【高压保护模式】当前服务者情绪电量极低（{battery}%），请用最温柔、最具安抚感的方式转述客户意图。完全过滤攻击性内容，只保留核心诉求，用关怀的语气表达。如同一位贴心的朋友在帮忙转达。".format(battery=battery)


async def translate_customer(text: str, input_mode: str, context: str, message_id: str, style: str = "professional", char_name: str = "", battery: int = 100) -> TranslatedMessage:
    base_prompt = (PROMPT_DIR / "downlink.md").read_text(encoding="utf-8")
    style_instruction = get_style_instruction(style, char_name)
    adaptive_instruction = _get_adaptive_instruction(battery)
    system_prompt = f"{base_prompt}\n\n{style_instruction}{adaptive_instruction}"
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


async def summarize_conversation(messages: list[dict], latest_translated: dict | None, emotion_status: dict) -> ConversationSummary:
    system_prompt = (PROMPT_DIR / "summary.md").read_text(encoding="utf-8")
    user_prompt = json.dumps(
        {
            "messages": messages,
            "latest_translated": latest_translated,
            "emotion_status": emotion_status,
        },
        ensure_ascii=False,
    )

    try:
        data = await _json_chat(system_prompt, user_prompt)
        return _normalize_summary(data, messages, latest_translated, "llm")
    except Exception:
        data = mock_summarize_conversation(messages, latest_translated)
        return _normalize_summary(data, messages, latest_translated, "mock")
