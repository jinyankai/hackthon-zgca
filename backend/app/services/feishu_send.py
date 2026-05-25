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

    if target_type == "chat_id":
        cmd = [settings.lark_cli_path, "im", "+messages-send", "--chat-id", target_id, "--text", text]
    elif target_type == "user_id":
        cmd = [settings.lark_cli_path, "im", "+messages-send", "--user-id", target_id, "--text", text]
    else:
        return FeishuSendResult(success=False, error=f"不支持的目标类型: {target_type}")

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.lark_send_timeout)

        if proc.returncode != 0:
            err_text = stderr.decode("utf-8", errors="replace").strip() or "lark-cli 返回非零退出码"
            return FeishuSendResult(success=False, error=err_text)

        output = stdout.decode("utf-8", errors="replace").strip()
        try:
            result = json.loads(output)
            msg_id = result.get("data", {}).get("message_id") or result.get("message_id")
        except (json.JSONDecodeError, AttributeError):
            msg_id = None

        return FeishuSendResult(success=True, message_id=msg_id)

    except asyncio.TimeoutError:
        return FeishuSendResult(success=False, error="飞书发送超时")
    except Exception as e:
        return FeishuSendResult(success=False, error=str(e))


async def search_chats(query: str = "") -> dict:
    cmd = [settings.lark_cli_path, "im", "+chat-search"]
    if query:
        cmd.extend(["--query", query])

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.lark_send_timeout)

        if proc.returncode != 0:
            err = stderr.decode("utf-8", errors="replace").strip()
            return {"ok": False, "error": err or "lark-cli 返回错误", "chats": []}

        output = stdout.decode("utf-8", errors="replace").strip()
        try:
            data = json.loads(output)
            items = data.get("data", {}).get("items", data.get("items", []))
        except json.JSONDecodeError:
            items = []

        chats = [{"name": item.get("name", ""), "chatId": item.get("chat_id", "")} for item in items]
        return {"ok": True, "chats": chats, "error": None}

    except asyncio.TimeoutError:
        return {"ok": False, "error": "lark-cli 超时", "chats": []}
    except Exception as e:
        return {"ok": False, "error": str(e), "chats": []}
