import type { Hotspot, Suggestion } from "../lib/types";

type HotspotListProps = {
  hotspots: Hotspot[];
};

export function HotspotList({ hotspots }: HotspotListProps) {
  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Bottlenecks</p>
          <h3>Hotspot Heatmap</h3>
        </div>
      </div>
      <div className="list-stack">
        {hotspots.length ? (
          hotspots.map((hotspot) => (
            <article key={`${hotspot.line}-${hotspot.score}`} className="list-card">
              <div>
                <strong>Line {hotspot.line}</strong>
                <p>{hotspot.reason}</p>
              </div>
              <span>{Math.round(hotspot.score * 100)}%</span>
            </article>
          ))
        ) : (
          <p className="empty-copy">No hotspots detected yet.</p>
        )}
      </div>
    </section>
  );
}

type SuggestionListProps = {
  suggestions: Suggestion[];
};

export function SuggestionList({ suggestions }: SuggestionListProps) {
  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Optimization</p>
          <h3>Suggestions</h3>
        </div>
      </div>
      <div className="list-stack">
        {suggestions.length ? (
          suggestions.map((suggestion) => (
            <article key={`${suggestion.title}-${suggestion.line}`} className="list-card narrative">
              <strong>
                {suggestion.title} on line {suggestion.line}
              </strong>
              <p>{suggestion.why}</p>
              <p>{suggestion.impact}</p>
              <code>{suggestion.rewrite_hint}</code>
            </article>
          ))
        ) : (
          <p className="empty-copy">No optimization suggestions surfaced for this snippet.</p>
        )}
      </div>
    </section>
  );
}

type ExplanationPanelProps = {
  concise: string;
  teaching: string;
  mode: "concise" | "teaching";
  onModeChange: (mode: "concise" | "teaching") => void;
};

export function ExplanationPanel({ concise, teaching, mode, onModeChange }: ExplanationPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Reasoning Layer</p>
          <h3>Explanation</h3>
        </div>
        <div className="toggle-row">
          <button className={mode === "concise" ? "active" : ""} onClick={() => onModeChange("concise")}>
            Concise
          </button>
          <button className={mode === "teaching" ? "active" : ""} onClick={() => onModeChange("teaching")}>
            Teaching
          </button>
        </div>
      </div>
      <p className="explanation-copy">{mode === "concise" ? concise : teaching}</p>
    </section>
  );
}
