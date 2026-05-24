from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class SessionStats:
    total_messages: int = 0
    protected_count: int = 0
    blocked_expressions: int = 0
    risk_flags_triggered: list[str] = field(default_factory=list)
    emotion_history: list[dict] = field(default_factory=list)
    high_emotion_count: int = 0
    session_start: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def record_translation(self, emotion_level: str, emotion_score: int, risk_flags: list[str], battery: int) -> None:
        self.total_messages += 1
        self.protected_count += 1

        if emotion_level in ("intense", "severe"):
            self.high_emotion_count += 1
            self.blocked_expressions += 1

        for flag in risk_flags:
            if flag not in self.risk_flags_triggered:
                self.risk_flags_triggered.append(flag)
            self.blocked_expressions += 1

        self.emotion_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "battery": battery,
            "emotionLevel": emotion_level,
            "emotionScore": emotion_score,
        })

    def to_dict(self) -> dict:
        return {
            "totalMessages": self.total_messages,
            "protectedCount": self.protected_count,
            "blockedExpressions": self.blocked_expressions,
            "riskFlagsTriggered": self.risk_flags_triggered,
            "emotionHistory": self.emotion_history,
            "highEmotionCount": self.high_emotion_count,
            "sessionStart": self.session_start,
        }


stats = SessionStats()
