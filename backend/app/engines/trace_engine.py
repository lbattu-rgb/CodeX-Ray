from __future__ import annotations

import builtins
import copy
import json
import sys
from types import FrameType
from typing import Any


SAFE_BUILTINS = {
    "abs": builtins.abs,
    "all": builtins.all,
    "any": builtins.any,
    "bool": builtins.bool,
    "dict": builtins.dict,
    "enumerate": builtins.enumerate,
    "float": builtins.float,
    "int": builtins.int,
    "len": builtins.len,
    "list": builtins.list,
    "max": builtins.max,
    "min": builtins.min,
    "print": builtins.print,
    "range": builtins.range,
    "reversed": builtins.reversed,
    "set": builtins.set,
    "sorted": builtins.sorted,
    "str": builtins.str,
    "sum": builtins.sum,
    "tuple": builtins.tuple,
    "zip": builtins.zip,
}


def _safe_jsonable(value: Any) -> Any:
    try:
        json.dumps(value)
        return copy.deepcopy(value)
    except TypeError:
        return repr(value)


def _stack_snapshot(frame: FrameType | None) -> list[dict[str, Any]]:
    stack = []
    current = frame
    while current is not None:
        if current.f_code.co_filename == "<algoscope-user-code>":
            stack.append(
                {
                    "function": current.f_code.co_name,
                    "line": current.f_lineno,
                    "locals": {key: _safe_jsonable(val) for key, val in current.f_locals.items() if not key.startswith("__")},
                }
            )
        current = current.f_back
    stack.reverse()
    return stack


def generate_trace(source: str, entry_function: str | None, args: list[Any], kwargs: dict[str, Any]) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    max_events = 400
    globals_dict: dict[str, Any] = {"__builtins__": SAFE_BUILTINS}
    locals_dict = globals_dict

    compiled = compile(source, "<algoscope-user-code>", "exec")

    def tracer(frame: FrameType, event: str, arg: Any):  # type: ignore[override]
        if frame.f_code.co_filename != "<algoscope-user-code>":
            return tracer
        if len(events) >= max_events:
            raise RuntimeError("Trace limit reached")
        if event in {"call", "line", "return"}:
            events.append(
                {
                    "step": len(events) + 1,
                    "event_type": "line_exec" if event == "line" else event,
                    "line": frame.f_lineno,
                    "stack": _stack_snapshot(frame),
                    "heap_summary": {
                        "objects": sum(len(item["locals"]) for item in _stack_snapshot(frame)),
                        "estimated_bytes": sum(len(repr(value)) for stack_frame in _stack_snapshot(frame) for value in stack_frame["locals"].values()),
                    },
                    "return_value": _safe_jsonable(arg) if event == "return" else None,
                }
            )
        return tracer

    previous_trace = sys.gettrace()
    try:
        sys.settrace(tracer)
        exec(compiled, globals_dict, locals_dict)
        result = None
        if entry_function:
            fn = globals_dict.get(entry_function)
            if not callable(fn):
                raise ValueError(f"Entry function '{entry_function}' was not found in the provided source.")
            result = fn(*args, **kwargs)
    finally:
        sys.settrace(previous_trace)

    return {
        "events": events,
        "result": _safe_jsonable(result),
        "truncated": len(events) >= max_events,
    }
