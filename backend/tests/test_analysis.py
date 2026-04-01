import unittest

from app.services import build_analysis


SAMPLE = """def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
"""


class AnalysisTests(unittest.TestCase):
    def test_analysis_detects_quadratic_growth(self) -> None:
        analysis = build_analysis(SAMPLE, "two_sum", [[2, 7, 11, 15], 9], {})
        self.assertEqual(analysis["complexity"]["time"], "O(n^2)")
        self.assertTrue(analysis["hotspots"])
        self.assertTrue(analysis["trace_preview"]["events"])


if __name__ == "__main__":
    unittest.main()
