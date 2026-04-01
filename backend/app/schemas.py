from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class InputConfig(BaseModel):
    args: list[Any] = Field(default_factory=list)
    kwargs: dict[str, Any] = Field(default_factory=dict)
    input_size: int = 10
    scenario: Literal["custom", "sorted", "reverse_sorted", "random", "repeated", "worst_case"] = "custom"


class AnalyzeRequest(BaseModel):
    source: str
    language: str = "python"
    entry_function: str | None = None
    input_config: InputConfig = Field(default_factory=InputConfig)
    session_name: str | None = None


class TraceRequest(BaseModel):
    source: str
    entry_function: str | None = None
    input_config: InputConfig = Field(default_factory=InputConfig)


class SimulateRequest(BaseModel):
    analysis: dict[str, Any]
    min_n: int = 10
    max_n: int = 10000
    points: int = 6


class CompareRequest(BaseModel):
    left: AnalyzeRequest
    right: AnalyzeRequest

