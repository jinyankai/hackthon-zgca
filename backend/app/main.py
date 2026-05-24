from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.conversation import store
from app.ws.routes import router as ws_router
from app.api.transcribe import router as api_router

app = FastAPI(title="AI Emotion Shield MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(api_router)


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "conversationId": settings.conversation_id,
        "llm": "live" if settings.llm_live_enabled else "mock",
    }


@app.post("/demo/reset")
def reset_demo() -> dict:
    return store.reset().model_dump()
