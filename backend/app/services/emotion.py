from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.conversation import EmotionStatus

DAMAGE = {
    "calm": 0,
    "mild": 5,
    "angry": 12,
    "extreme": 25,
}


def make_initial_emotion_status() -> EmotionStatus:
    return EmotionStatus(
        battery=100,
        status="healthy",
        lastUpdatedAt=datetime.now(timezone.utc).isoformat(),
        restSuggested=False,
    )


def apply_emotion_hit(status: EmotionStatus, emotion_level: str) -> EmotionStatus:
    battery = max(0, status.battery - DAMAGE.get(emotion_level, 5))

    if battery < 20:
        level = "critical"
        rest_suggested = True
    elif battery < 40:
        level = "warning"
        rest_suggested = True
    else:
        level = "healthy"
        rest_suggested = False

    return EmotionStatus(
        battery=battery,
        status=level,
        lastUpdatedAt=datetime.now(timezone.utc).isoformat(),
        restSuggested=rest_suggested,
    )


def recover_battery(status: EmotionStatus, seconds_elapsed: int) -> EmotionStatus:
    recovered = (seconds_elapsed // 60) * 2
    battery = min(100, status.battery + recovered)
    if battery < 20:
        level = "critical"
        rest_suggested = True
    elif battery < 40:
        level = "warning"
        rest_suggested = True
    else:
        level = "healthy"
        rest_suggested = False

    return EmotionStatus(
        battery=battery,
        status=level,
        lastUpdatedAt=datetime.now(timezone.utc).isoformat(),
        restSuggested=rest_suggested,
    )
