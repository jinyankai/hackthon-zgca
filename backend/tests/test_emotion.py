import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.emotion import apply_emotion_hit, make_initial_emotion_status


class EmotionBatteryTest(unittest.TestCase):
    def test_angry_message_reduces_battery_by_twelve(self):
        status = apply_emotion_hit(make_initial_emotion_status(), "angry")
        self.assertEqual(88, status.battery)
        self.assertEqual("healthy", status.status)

    def test_extreme_can_trigger_rest_suggestion(self):
        status = make_initial_emotion_status()
        for _ in range(4):
            status = apply_emotion_hit(status, "extreme")
        self.assertTrue(status.restSuggested)
        self.assertIn(status.status, {"warning", "critical"})


if __name__ == "__main__":
    unittest.main()
