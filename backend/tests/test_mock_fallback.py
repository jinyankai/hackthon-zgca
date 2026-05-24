import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.mocks.fallback import mock_polish_agent, mock_translate_customer


class MockFallbackTest(unittest.TestCase):
    def test_late_order_scenario_matches_demo_contract(self):
        result = mock_translate_customer("你们到底会不会送？半小时了还没到！再不来我就投诉退款！")
        self.assertEqual("客户对配送延迟非常不满，并提出投诉和退款诉求。", result["filteredText"])
        self.assertEqual("angry", result["emotionLevel"])
        self.assertIn("退款", result["riskFlags"])

    def test_refund_draft_is_polished_without_overpromising(self):
        result = mock_polish_agent("退款要看规则，不是我说退就退。")
        self.assertIn("根据订单状态和平台规则确认", result["polishedText"])


if __name__ == "__main__":
    unittest.main()
