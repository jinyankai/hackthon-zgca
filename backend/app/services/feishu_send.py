from __future__ import annotations

import asyncio
import json
import uuid

from app.config import settings


class FeishuSendResult:
    def __init__(self, success: bool, message_id: str | None = None, error: str | None = None) -> None:
        self.success = success
        self.message_id = message_id
        self.error = error

    def to_dict(self) -> dict:
        return {"success": self.success, "messageId": self.message_id, "error": self.error}


async def send_to_feishu(text: str, target_type: str, target_id: str) -> FeishuSendResult:
    if settings.lark_send_mode == "dry_run":
        return FeishuSendResult(success=True, message_id=f"dry-{uuid.uuid4().hex[:8]}")

    if not target_id:
        return FeishuSendResult(success=False, error="未指定发送目标")

    content = json.dumps({"text": text}, ensure_ascii=False)

    if target_type == "chat_id":
        receive_id_type = "chat_id"
    elif target_type == "user_id":
        receive_id_type = "open_id"
    else:
        return FeishuSendResult(success=False, error=f"不支持的目标类型: {target_type}")

    params = json.dumps({
        "params": {"receive_id_type": receive_id_type},
        "data": {
            "receive_id": target_id,
            "msg_type": "text",
            "content": content,
            "uuid": uuid.uuid4().hex,
        },
    }, ensure_ascii=False)

    cmd = [settings.feishu_cli_path, "exec", "im.v1.message.create", "--params", params]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.lark_send_timeout)

        if proc.returncode != 0:
            err_text = stderr.decode("utf-8", errors="replace").strip() or "feishu-cli 返回非零退出码"
            return FeishuSendResult(success=False, error=err_text)

        result = json.loads(stdout.decode("utf-8"))
        msg_id = result.get("data", {}).get("message_id") or result.get("message_id")
        return FeishuSendResult(success=True, message_id=msg_id)

    except asyncio.TimeoutError:
        return FeishuSendResult(success=False, error="飞书发送超时")
    except Exception as e:
        return FeishuSendResult(success=False, error=str(e))
