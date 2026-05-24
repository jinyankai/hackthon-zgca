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
