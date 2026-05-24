from __future__ import annotations

from fastapi import APIRouter, File, UploadFile
from app.config import settings
from app.services.stats import stats
from app.services.customer_profile import customer_profile

router = APIRouter(prefix="/api")


@router.get("/stats")
async def get_stats() -> dict:
    return stats.to_dict()


@router.get("/customer-profile")
async def get_customer_profile() -> dict:
    return customer_profile.to_dict()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict:
    """
    Accepts audio blob from frontend, transcribes using OpenAI-compatible Whisper API.
    Falls back to returning an error message if no Whisper endpoint is configured.
    """
    import httpx

    audio_data = await file.read()
    if not audio_data:
        return {"ok": False, "error": "empty audio", "text": ""}

    whisper_url = settings.whisper_api_url
    api_key = settings.openai_api_key or settings.deepseek_api_key or ""

    if not whisper_url:
        return {"ok": False, "error": "no_whisper_endpoint", "text": ""}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                whisper_url,
                headers={"Authorization": f"Bearer {api_key}"},
                files={"file": (file.filename or "audio.webm", audio_data, file.content_type or "audio/webm")},
                data={"model": settings.whisper_model, "language": "zh"},
            )
            resp.raise_for_status()
            result = resp.json()
            return {"ok": True, "text": result.get("text", ""), "error": None}
    except Exception as e:
        return {"ok": False, "error": str(e), "text": ""}
