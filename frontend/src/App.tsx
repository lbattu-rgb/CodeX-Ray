import { useEffect, useMemo, useState } from "react";
import { analyzeSource, compareSources, fetchExamples } from "./lib/api";
import type { AnalysisResult, CompareResult, ExampleSnippet, InputConfig } from "./lib/types";
import { CodePanel } from "./components/CodePanel";
import { DnaPanel } from "./components/DnaPanel";
import { HotspotList, ExplanationPanel, SuggestionList } from "./components/InsightPanels";
import { MetricCard } from "./components/MetricCard";
import { SimulationDeck } from "./components/SimulationChart";
import { TraceTimeline } from "./components/TraceTimeline";

const FALLBACK_EXAMPLES: Record<string, ExampleSnippet> = {
  two_sum_naive: {
    title: "Two Sum (Nested Loops)",
    description: "A deliberately quadratic implementation for hotspot detection.",
    source: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`,
    entry_function: "two_sum",
    args: [[2, 7, 11, 15], 9],
  },
  two_sum_hash: {
    title: "Two Sum (Hash Map)",
    description: "An optimized implementation to compare against the naive version.",
    source: `def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return []
`,
    entry_function: "two_sum",
    args: [[2, 7, 11, 15], 9],
  },
};

function buildDefaultConfig(example: ExampleSnippet): InputConfig {
  return {
    args: example.args,
    kwargs: {},
    input_size: 10,
    scenario: "custom",
  };
}

function jsonPreview(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function deltaText(previous: AnalysisResult | null, current: AnalysisResult | null): string {
  if (!previous || !current) {
    return "Analyze code, change it, and re-run to unlock counterfactual deltas.";
  }
  const currentRuntime = current.simulation.runtime_estimated_ms[current.simulation.runtime_estimated_ms.length - 1] ?? 0;
  const previousRuntime =
    previous.simulation.runtime_estimated_ms[previous.simulation.runtime_estimated_ms.length - 1] ?? 0;
  const runtimeDelta = currentRuntime - previousRuntime;
  return `Time complexity moved from ${previous.complexity.time} to ${current.complexity.time}. Projected large-n runtime changed by ${runtimeDelta.toFixed(2)}ms.`;
}

export default function App() {
  const [examples, setExamples] = useState<Record<string, ExampleSnippet>>(FALLBACK_EXAMPLES);
  const [selectedExample, setSelectedExample] = useState("two_sum_naive");
  const [source, setSource] = useState(FALLBACK_EXAMPLES.two_sum_naive.source);
  const [compareSource, setCompareSource] = useState(FALLBACK_EXAMPLES.two_sum_hash.source);
  const [entryFunction, setEntryFunction] = useState(FALLBACK_EXAMPLES.two_sum_naive.entry_function);
  const [compareEntryFunction, setCompareEntryFunction] = useState(FALLBACK_EXAMPLES.two_sum_hash.entry_function);
  const [argsText, setArgsText] = useState(jsonPreview(FALLBACK_EXAMPLES.two_sum_naive.args));
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<AnalysisResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanationMode, setExplanationMode] = useState<"concise" | "teaching">("teaching");
  const [traceIndex, setTraceIndex] = useState(0);

  useEffect(() => {
    void fetchExamples()
      .then((incoming) => setExamples(incoming))
      .catch(() => undefined);
  }, []);

  const inputConfig = useMemo<InputConfig>(() => {
    try {
      const parsed = JSON.parse(argsText);
      return {
        args: Array.isArray(parsed) ? parsed : [parsed],
        kwargs: {},
        input_size: 10,
        scenario: "custom",
      };
    } catch {
      return buildDefaultConfig(FALLBACK_EXAMPLES.two_sum_naive);
    }
  }, [argsText]);

  function applyExample(key: string) {
    const example = examples[key];
    setSelectedExample(key);
    setSource(example.source);
    setEntryFunction(example.entry_function);
    setArgsText(jsonPreview(example.args));
  }

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSource(source, entryFunction, inputConfig);
      setPreviousAnalysis(analysis);
      setAnalysis(result);
      setCompareResult(null);
      setTraceIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runComparison() {
    setLoading(true);
    setError(null);
    try {
      const result = await compareSources(source, compareSource, entryFunction, compareEntryFunction, inputConfig);
      setCompareResult(result);
      setTraceIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  const displayAnalysis = compareMode && compareResult ? compareResult.left : analysis;
  const highlightedPrimaryLines = displayAnalysis?.hotspots.map((item) => item.line) ?? [];
  const highlightedCompareLines = compareResult?.right.hotspots.map((item) => item.line) ?? [];
  const activePrimaryLine =
    displayAnalysis?.trace_preview.events[Math.min(traceIndex, Math.max((displayAnalysis?.trace_preview.events.length ?? 1) - 1, 0))]?.line ??
    null;
  const activeCompareLine =
    compareResult?.right.trace_preview.events[
      Math.min(traceIndex, Math.max((compareResult?.right.trace_preview.events.length ?? 1) - 1, 0))
    ]?.line ?? null;
  const heroHotspotLines = displayAnalysis?.hotspots.slice(0, 4).map((item) => item.line) ?? [];
  const heroTraceSteps = displayAnalysis?.trace_preview.events.length ?? 0;
  const heroNodeCount = displayAnalysis?.nodes.length ?? 0;

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Algorithm Observatory</p>
          <h1>CodeX-Ray</h1>
          <p className="hero-copy">
            See, predict, and reshape algorithm behavior with trace playback, growth simulation, bottleneck heatmaps,
            counterfactual diffs, and comparison-native analysis.
          </p>
          <div className="hero-scan-summary">
            <div className="hero-summary-card">
              <p className="eyebrow">Live X-Ray</p>
              <h2>{displayAnalysis ? displayAnalysis.complexity.time : "Waiting for analysis"}</h2>
              <p className="hero-summary-copy">
                {displayAnalysis
                  ? `Predicted ${displayAnalysis.complexity.time} time with ${Math.round(displayAnalysis.complexity.confidence * 100)}% confidence.`
                  : "Run an analysis to surface complexity, hotspots, and behavioral fingerprints."}
              </p>
              <div className="hero-metric-row">
                <div className="hero-metric">
                  <span>Hotspots</span>
                  <strong>{displayAnalysis?.hotspots.length ?? 0}</strong>
                </div>
                <div className="hero-metric">
                  <span>Trace steps</span>
                  <strong>{heroTraceSteps}</strong>
                </div>
                <div className="hero-metric">
                  <span>Analysis nodes</span>
                  <strong>{heroNodeCount}</strong>
                </div>
              </div>
            </div>
            <div className="hero-scan-chamber" aria-hidden="true">
              <div className="scan-grid" />
              <div className="scan-head">
                <div>
                  <p className="eyebrow">Hotspot Snapshot</p>
                  <h3>Dominant Pressure Lines</h3>
                </div>
                <div className="scan-chip-row">
                  <span className="scan-chip">Trace</span>
                  <span className="scan-chip">Growth</span>
                </div>
              </div>
              <div className="scan-bars">
                {heroHotspotLines.length ? (
                  heroHotspotLines.map((line, index) => (
                    <div
                      key={`hero-hotspot-${line}`}
                      className={`scan-stack-line tone-${index + 1}`}
                      style={{ width: `${84 - index * 12}%` }}
                    >
                      <span>Line {line}</span>
                      <strong>{["Critical", "High", "Medium", "Watch"][index] ?? "Watch"}</strong>
                    </div>
                  ))
                ) : (
                  <div className="scan-stack-line tone-1" style={{ width: "72%" }}>
                    <span>No hotspots yet</span>
                    <strong>Standby</strong>
                  </div>
                )}
              </div>
              <div className="scan-footer">
                <div className="scan-footer-metric">
                  <span>Space</span>
                  <strong>{displayAnalysis?.complexity.space ?? "--"}</strong>
                </div>
                <div className="scan-footer-metric">
                  <span>Trace</span>
                  <strong>{heroTraceSteps}</strong>
                </div>
                <div className="scan-footer-metric">
                  <span>Hotspots</span>
                  <strong>{displayAnalysis?.hotspots.length ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-controls">
          <label className="input-stack">
            <span>Example gallery</span>
            <select value={selectedExample} onChange={(event) => applyExample(event.target.value)}>
              {Object.entries(examples).map(([key, example]) => (
                <option key={key} value={key}>
                  {example.title}
                </option>
              ))}
            </select>
          </label>
          <label className="input-stack wide">
            <span>Function args (JSON array)</span>
            <textarea value={argsText} onChange={(event) => setArgsText(event.target.value)} />
          </label>
          <div className="toggle-strip">
            <button className={!compareMode ? "active" : ""} onClick={() => setCompareMode(false)}>
              Single analysis
            </button>
            <button className={compareMode ? "active" : ""} onClick={() => setCompareMode(true)}>
              Compare mode
            </button>
          </div>
          <div className="action-row">
            <button className="primary-button" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
            {compareMode ? (
              <button className="secondary-button" onClick={runComparison} disabled={loading}>
                {loading ? "Comparing..." : "Compare"}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="workspace">
        <div className={compareMode ? "editor-grid compare" : "editor-grid"}>
          <CodePanel
            title="Primary implementation"
            source={source}
            entryFunction={entryFunction}
            highlightedLines={highlightedPrimaryLines}
            activeLine={activePrimaryLine}
            onSourceChange={setSource}
            onEntryFunctionChange={setEntryFunction}
          />
          {compareMode ? (
            <CodePanel
              title="Comparison implementation"
              source={compareSource}
              entryFunction={compareEntryFunction}
              highlightedLines={highlightedCompareLines}
              activeLine={activeCompareLine}
              onSourceChange={setCompareSource}
              onEntryFunctionChange={setCompareEntryFunction}
            />
          ) : null}
        </div>

        <section className="summary-strip">
          <MetricCard
            label="Predicted Time"
            value={displayAnalysis?.complexity.time ?? "--"}
            helper="Structure-based asymptotic estimate"
            accent="warm"
          />
          <MetricCard
            label="Predicted Space"
            value={displayAnalysis?.complexity.space ?? "--"}
            helper="Estimated auxiliary growth"
            accent="cool"
          />
          <MetricCard
            label="Confidence"
            value={displayAnalysis ? `${Math.round(displayAnalysis.complexity.confidence * 100)}%` : "--"}
            helper="How strongly the visible structure supports the estimate"
          />
          <MetricCard
            label="Counterfactual Delta"
            value={
              analysis && previousAnalysis && analysis.complexity.time !== previousAnalysis.complexity.time
                ? `${previousAnalysis.complexity.time} -> ${analysis.complexity.time}`
                : "Stand by"
            }
            helper="Re-run after edits to reveal causal shifts"
          />
        </section>

        {compareMode && compareResult ? (
          <section className="panel compare-summary">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Comparison-native</p>
                <h2>Implementation Verdict</h2>
              </div>
            </div>
            <p className="explanation-copy">{compareResult.summary}</p>
          </section>
        ) : null}

        <div className="content-grid">
          <div className="center-column">
            <TraceTimeline
              events={displayAnalysis?.trace_preview.events ?? []}
              result={displayAnalysis?.trace_preview.result}
              truncated={displayAnalysis?.trace_preview.truncated ?? false}
              currentIndex={traceIndex}
              onIndexChange={setTraceIndex}
            />
            {displayAnalysis ? <SimulationDeck simulation={displayAnalysis.simulation} /> : null}
            <section className="panel">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow">Counterfactuals</p>
                  <h3>What Changed?</h3>
                </div>
              </div>
              <p className="explanation-copy">{deltaText(previousAnalysis, analysis)}</p>
            </section>
          </div>

          <aside className="right-column">
            {displayAnalysis ? (
              <>
                <ExplanationPanel
                  concise={displayAnalysis.explanations.concise}
                  teaching={displayAnalysis.explanations.teaching}
                  mode={explanationMode}
                  onModeChange={setExplanationMode}
                />
                <DnaPanel dna={displayAnalysis.dna} />
                <HotspotList hotspots={displayAnalysis.hotspots} />
                <SuggestionList suggestions={displayAnalysis.suggestions} />
              </>
            ) : (
              <section className="panel">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">Ready</p>
                    <h3>Analyze Your Code</h3>
                  </div>
                </div>
                <p className="explanation-copy">
                  Paste Python code, set an entry function, then run analysis to unlock execution trace, complexity
                  prediction, hotspots, simulation curves, and behavioral DNA.
                </p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
