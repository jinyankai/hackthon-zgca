from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env", override=True)


class Settings:
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock").lower()
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    deepseek_api_key: str | None = os.getenv("DEEPSEEK_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    anthropic_base_url: str = os.getenv("ANTHROPIC_BASE_URL", "https://api.deepseek.com/anthropic")
    llm_model: str = os.getenv("LLM_MODEL", "deepseek-chat")
    llm_timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "4"))
    conversation_id: str = "demo-room"
    whisper_api_url: str | None = os.getenv("WHISPER_API_URL")
    whisper_model: str = os.getenv("WHISPER_MODEL", "whisper-1")

    # Desktop / Feishu integration
    lark_send_mode: str = os.getenv("LARK_SEND_MODE", "dry_run")  # dry_run | cli
    feishu_cli_path: str = os.getenv("FEISHU_CLI_PATH", "feishu-cli")
    lark_send_timeout: int = int(os.getenv("LARK_SEND_TIMEOUT_SECONDS", "10"))

    @property
    def llm_live_enabled(self) -> bool:
        if self.llm_provider in {"deepseek_anthropic", "anthropic"}:
            return bool(self.deepseek_api_key and self.anthropic_base_url)
        if self.llm_provider == "openai":
            return bool(self.openai_api_key)
        return False


settings = Settings()
