import { useMemo } from "react";
import type { TraceEvent } from "../lib/types";

type TraceTimelineProps = {
  events: TraceEvent[];
  result: unknown;
  truncated: boolean;
  currentIndex: number;
  onIndexChange: (index: number) => void;
};

export function TraceTimeline({ events, result, truncated, currentIndex, onIndexChange }: TraceTimelineProps) {
  const index = Math.min(currentIndex, Math.max(events.length - 1, 0));
  const current = events[index];
  const max = Math.max(events.length - 1, 0);

  const locals = useMemo(() => {
    if (!current || !current.stack.length) {
      return {};
    }
    return current.stack[current.stack.length - 1]?.locals ?? {};
  }, [current]);

  if (!events.length) {
    return (
      <section className="panel">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Execution</p>
            <h3>Trace Timeline</h3>
          </div>
        </div>
        <p className="empty-copy">Run an analysis with an entry function to generate a live execution trace.</p>
      </section>
    );
  }

  return (
    <section className="panel trace-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Execution</p>
          <h3>Trace Timeline</h3>
        </div>
        <span className="pill">
          Step {index + 1}/{events.length}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={index}
        onChange={(event) => onIndexChange(Number(event.target.value))}
      />
      <div className="trace-current">
        <div>
          <p className="mini-label">Current event</p>
          <strong>
            {current.event_type} on line {current.line}
          </strong>
        </div>
        <div>
          <p className="mini-label">Heap estimate</p>
          <strong>{current.heap_summary.estimated_bytes} bytes</strong>
        </div>
      </div>
      <div className="trace-columns">
        <div className="trace-box">
          <p className="mini-label">Locals</p>
          <pre>{JSON.stringify(locals, null, 2)}</pre>
        </div>
        <div className="trace-box">
          <p className="mini-label">Stack</p>
          <pre>{JSON.stringify(current.stack, null, 2)}</pre>
        </div>
      </div>
      <div className="trace-footer">
        <span>Result: {JSON.stringify(result)}</span>
        {truncated ? <span className="warning-chip">Trace truncated</span> : null}
      </div>
    </section>
  );
}
