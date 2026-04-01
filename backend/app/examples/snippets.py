EXAMPLE_SNIPPETS = {
    "two_sum_naive": {
        "title": "Two Sum (Nested Loops)",
        "description": "A deliberately quadratic implementation for hotspot detection.",
        "source": """def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
""",
        "entry_function": "two_sum",
        "args": [[2, 7, 11, 15], 9],
    },
    "two_sum_hash": {
        "title": "Two Sum (Hash Map)",
        "description": "An optimized implementation to compare against the naive version.",
        "source": """def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return []
""",
        "entry_function": "two_sum",
        "args": [[2, 7, 11, 15], 9],
    },
    "fibonacci_recursive": {
        "title": "Recursive Fibonacci",
        "description": "Useful for demonstrating recursion trees and exponential growth.",
        "source": """def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
""",
        "entry_function": "fib",
        "args": [6],
    },
}
