from __future__ import annotations

import os


class Settings:
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock").lower()
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o")
    llm_timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "4"))
    conversation_id: str = "demo-room"

    @property
    def llm_live_enabled(self) -> bool:
        return self.llm_provider != "mock" and bool(self.openai_api_key)


settings = Settings()
