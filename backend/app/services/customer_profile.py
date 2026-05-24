from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class CustomerProfile:
    high_emotion_count: int = 0
    total_messages: int = 0
    risk_flags: list[str] = field(default_factory=list)
    is_flagged: bool = False
    flagged_at: str | None = None
    last_emotion_level: str = "mild"

    def record(self, emotion_level: str, risk_flags: list[str]) -> None:
        self.total_messages += 1
        self.last_emotion_level = emotion_level

        if emotion_level in ("intense", "severe"):
            self.high_emotion_count += 1

        for flag in risk_flags:
            if flag not in self.risk_flags:
                self.risk_flags.append(flag)

        if self.high_emotion_count >= 3 and not self.is_flagged:
            self.is_flagged = True
            self.flagged_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        return {
            "highEmotionCount": self.high_emotion_count,
            "totalMessages": self.total_messages,
            "riskFlags": self.risk_flags,
            "isFlagged": self.is_flagged,
            "flaggedAt": self.flagged_at,
            "lastEmotionLevel": self.last_emotion_level,
        }


customer_profile = CustomerProfile()
