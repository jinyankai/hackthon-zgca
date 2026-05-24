from __future__ import annotations


def mock_translate_customer(text: str) -> dict:
    if any(token in text for token in ["废物", "傻", "滚", "垃圾"]):
        return {
            "filteredText": "客户使用了攻击性表达，对处理效率极度不满。",
            "coreRequest": "要求尽快处理当前问题。",
            "emotionLevel": "extreme",
            "emotionScore": 5,
            "riskFlags": ["攻击性表达", "高压会话"],
            "suggestedReplies": [
                {
                    "id": "reply-extreme-1",
                    "tone": "firm",
                    "text": "我会先聚焦处理您的问题，并尽快给出当前可执行的解决步骤。",
                }
            ],
        }

    if any(token in text for token in ["差评", "服务太差", "现在就要退款"]):
        return {
            "filteredText": "客户对服务体验不满，要求退款，并提到差评风险。",
            "coreRequest": "确认退款规则；说明可处理路径；安抚但不承诺。",
            "emotionLevel": "angry",
            "emotionScore": 4,
            "riskFlags": ["退款", "差评"],
            "suggestedReplies": [
                {
                    "id": "reply-refund-1",
                    "tone": "firm",
                    "text": "退款需要根据订单状态和平台规则确认。我会先帮您核实是否符合退款条件，并给您明确答复。",
                }
            ],
        }

    if any(token in text for token in ["送", "半小时", "投诉", "退款"]):
        return {
            "filteredText": "客户对配送延迟非常不满，并提出投诉和退款诉求。",
            "coreRequest": "查询订单进度；说明延迟原因；给出处理方案。",
            "emotionLevel": "angry",
            "emotionScore": 4,
            "riskFlags": ["催单", "投诉", "退款"],
            "suggestedReplies": [
                {
                    "id": "reply-late-1",
                    "tone": "firm",
                    "text": "我先帮您核实订单状态，并尽快给您明确的处理结果。",
                }
            ],
        }

    return {
        "filteredText": "客户提出了需要处理的服务诉求。",
        "coreRequest": "确认客户问题；给出下一步处理方式。",
        "emotionLevel": "mild",
        "emotionScore": 2,
        "riskFlags": [],
        "suggestedReplies": [
            {
                "id": "reply-default-1",
                "tone": "calm",
                "text": "我先帮您核实情况，并尽快给您明确回复。",
            }
        ],
    }


def mock_polish_agent(draft: str, context: str = "") -> dict:
    if "退款要看规则" in draft:
        text = "退款需要根据订单状态和平台规则确认。我会先帮您核实是否符合退款条件，并给您明确答复。"
    elif "别急" in draft or "看一下" in draft:
        text = "我会立即帮您核实订单状态，并尽快给您明确的处理结果。"
    elif "现在处理" in draft:
        text = "我会先聚焦处理您的问题，并尽快给出当前可执行的解决步骤。"
    else:
        text = draft.strip() or "我会先帮您核实情况，并尽快给您明确回复。"

    return {
        "polishedText": text,
        "tone": "firm",
        "changesSummary": "已将口语化表达调整为专业、清晰、不过度承诺的话术。",
        "missingInfo": [],
    }


def detect_malicious(messages: list[dict], risk_flags: list[str], emotion_level: str | None) -> tuple[bool, list[str]]:
    text = "\n".join(str(message.get("text", "")) for message in messages)
    evidence = []
    for token in ["废物", "傻", "滚", "垃圾", "攻击", "辱骂"]:
        if token in text:
            evidence.append(token)
    for flag in risk_flags:
        if flag in {"攻击性表达", "高压会话", "辱骂", "恶意攻击"}:
            evidence.append(flag)
    malicious = emotion_level == "extreme" or bool(evidence)
    return malicious, list(dict.fromkeys(evidence))


def mock_summarize_conversation(messages: list[dict], latest_translated: dict | None = None) -> dict:
    latest_translated = latest_translated or {}
    malicious, evidence = detect_malicious(
        messages,
        latest_translated.get("riskFlags") or latest_translated.get("risk_flags") or [],
        latest_translated.get("emotionLevel") or latest_translated.get("emotion_level"),
    )

    return {
        "summary": "本轮对话围绕配送延迟、退款或投诉风险展开，服务者已以专业方式回应并尝试推进核实处理。",
        "customerRequest": latest_translated.get("coreRequest") or "确认客户问题并给出下一步处理方式。",
        "handledResult": "已向客户表达会核实情况并给出明确处理结果，未自动承诺退款、赔偿或具体送达时间。",
        "emotionReview": "客户情绪较高，服务者完成了情绪隔离和专业回应。",
        "maliciousDetected": malicious,
        "maliciousEvidence": evidence,
        "supportMessage": (
            "这次沟通中出现了明显攻击性表达。请记住，对方的恶意不是你的个人责任；你已经在边界内完成了专业处理。"
            if malicious
            else "本轮沟通已经结束，你保持了清晰、克制和专业。可以短暂调整呼吸，再进入下一轮服务。"
        ),
        "recoveryTips": (
            ["离开屏幕30秒", "喝水并放松肩颈", "必要时请求同事接力"]
            if malicious
            else ["记录处理要点", "短暂复位", "继续下一单"]
        ),
    }
