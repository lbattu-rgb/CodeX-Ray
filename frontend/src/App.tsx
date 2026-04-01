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

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
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
      <header className="site-nav">
        <div className="brand-lockup">
          <span className="brand-mark">CX</span>
          <div>
            <strong>CodeX-Ray</strong>
            <p>Algorithm intelligence studio</p>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#story">Story</a>
          <a href="#workspace">Workspace</a>
          <a href="#insights">Insights</a>
        </nav>
      </header>

      <header className="hero reveal-on-scroll is-visible">
        <div className="hero-copy-block">
          <p className="eyebrow">Algorithm Observatory</p>
          <h1>See what your code becomes as it scales.</h1>
          <p className="hero-copy">
            CodeX-Ray turns algorithms into something you can inspect visually: execution, growth, hotspots,
            tradeoffs, and structural behavior all in one place.
          </p>
          <div className="hero-actions">
            <a href="#workspace" className="hero-link primary-link">
              Launch workspace
            </a>
            <a href="#story" className="hero-link secondary-link">
              Explore the concept
            </a>
          </div>
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
        <div className="hero-controls hero-story-card">
          <p className="eyebrow">What makes this different</p>
          <h2>Not a visualizer. Not a profiler. Not a tutor. All three talking to each other.</h2>
          <p className="hero-copy">
            The point of CodeX-Ray is to bridge the gap between code execution, algorithm understanding, and
            performance intuition. It should feel like a product you move through, not a single chart dumped on a page.
          </p>
          <div className="story-stat-grid">
            <article>
              <strong>Trace</strong>
              <span>line-by-line execution with stack state</span>
            </article>
            <article>
              <strong>Growth</strong>
              <span>projected runtime and memory across input sizes</span>
            </article>
            <article>
              <strong>Compare</strong>
              <span>implementation-level tradeoff exploration</span>
            </article>
          </div>
        </div>
      </header>

      <div className="curve-divider reveal-on-scroll" aria-hidden="true">
        <div className="curve-divider-track" />
        <div className="curve-divider-orb orb-left" />
        <div className="curve-divider-orb orb-right" />
      </div>

      <section className="story-section reveal-on-scroll" id="story">
        <div className="section-intro">
          <p className="eyebrow">Experience</p>
          <h2>Built like a site you explore, not a single dashboard you glance at.</h2>
        </div>
        <div className="story-grid">
          <article className="story-card coral-card split-card">
            <div className="story-copy-block">
              <span className="story-kicker">Sectioned flow</span>
              <h3>Move from idea to analysis to explanation.</h3>
              <p>
                The layout is split into a narrative landing section, a working code lab, and a results system so the
                product feels guided instead of flat.
              </p>
            </div>
            <div className="story-visual visual-wave">
              <span className="visual-pill pill-one" />
              <span className="visual-pill pill-two" />
              <span className="visual-curve curve-one" />
            </div>
          </article>
          <article className="story-card aqua-card split-card reverse-card">
            <div className="story-copy-block">
              <span className="story-kicker">Fresh palette</span>
              <h3>Light, vivid, and more inviting.</h3>
              <p>
                The visual direction shifts away from the heavy dark console look and into something brighter, more
                modern, and more memorable.
              </p>
            </div>
            <div className="story-visual visual-columns">
              <span className="visual-column short" />
              <span className="visual-column medium" />
              <span className="visual-column tall" />
              <span className="visual-column medium" />
              <span className="visual-column short" />
            </div>
          </article>
          <article className="story-card sand-card split-card">
            <div className="story-copy-block">
              <span className="story-kicker">Shapes and rhythm</span>
              <h3>Asymmetry, curves, and stronger scroll pacing.</h3>
              <p>
                Cards, callouts, and visual clusters create real movement through the page, which makes the product feel
                much more like a polished website.
              </p>
            </div>
            <div className="story-visual visual-constellation">
              <span className="visual-node node-a" />
              <span className="visual-node node-b" />
              <span className="visual-node node-c" />
              <span className="visual-arc arc-one" />
              <span className="visual-arc arc-two" />
            </div>
          </article>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="curve-divider reveal-on-scroll" aria-hidden="true">
        <div className="curve-divider-track soft-track" />
        <div className="curve-divider-orb orb-center" />
      </div>

      <main className="workspace reveal-on-scroll" id="workspace">
        <section className="section-intro with-panel reveal-on-scroll">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>Paste code, run the X-ray, and inspect what actually matters.</h2>
          </div>
        </section>

        <section className="control-shell reveal-on-scroll">
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
        </section>

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

        <section className="summary-strip reveal-on-scroll">
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

        <section className="section-intro with-panel reveal-on-scroll" id="insights">
          <div>
            <p className="eyebrow">Insights</p>
            <h2>Trace the code, inspect the bottlenecks, and understand the growth curve.</h2>
          </div>
        </section>

        <div className="content-grid reveal-on-scroll">
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

      <div className="curve-divider reveal-on-scroll" aria-hidden="true">
        <div className="curve-divider-track warm-track" />
        <div className="curve-divider-orb orb-left" />
        <div className="curve-divider-orb orb-right" />
      </div>

      <footer className="site-footer reveal-on-scroll">
        <div>
          <p className="eyebrow">CodeX-Ray</p>
          <h3>Algorithm intelligence for people who want more than just “it works.”</h3>
        </div>
        <p>
          Visualize execution. Predict complexity. Compare implementations. Make algorithm behavior feel tangible.
        </p>
      </footer>
    </div>
  );
}
