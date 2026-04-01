from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .examples.snippets import EXAMPLE_SNIPPETS
from .schemas import AnalyzeRequest, CompareRequest, SimulateRequest, TraceRequest
from .services import build_analysis, build_comparison
from .engines.simulation import build_simulation
from .engines.trace_engine import generate_trace


app = FastAPI(title="CodeX-Ray API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/examples")
def examples() -> dict[str, object]:
    return {"examples": EXAMPLE_SNIPPETS}


@app.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, object]:
    if request.language.lower() != "python":
        raise HTTPException(status_code=400, detail="Only Python is supported in the current MVP.")
    return build_analysis(
        source=request.source,
        entry_function=request.entry_function,
        args=request.input_config.args,
        kwargs=request.input_config.kwargs,
    )


@app.post("/trace")
def trace(request: TraceRequest) -> dict[str, object]:
    try:
        return generate_trace(
            request.source,
            request.entry_function,
            request.input_config.args,
            request.input_config.kwargs,
        )
    except Exception as exc:  # pragma: no cover - surfaced as API response
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/simulate")
def simulate(request: SimulateRequest) -> dict[str, object]:
    return build_simulation(request.analysis, request.min_n, request.max_n, request.points)


@app.post("/compare")
def compare(request: CompareRequest) -> dict[str, object]:
    left = build_analysis(
        request.left.source,
        request.left.entry_function,
        request.left.input_config.args,
        request.left.input_config.kwargs,
    )
    right = build_analysis(
        request.right.source,
        request.right.entry_function,
        request.right.input_config.args,
        request.right.input_config.kwargs,
    )
    return build_comparison(left, right)
