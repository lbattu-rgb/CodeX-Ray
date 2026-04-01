import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

function complexitySeverity(timeComplexity?: string): number {
  if (!timeComplexity) {
    return 0.38;
  }

  if (timeComplexity.includes("2^n") || timeComplexity.includes("n!")) {
    return 1;
  }
  if (timeComplexity.includes("n^2") || timeComplexity.includes("n²")) {
    return 0.82;
  }
  if (timeComplexity.includes("n log n")) {
    return 0.62;
  }
  if (timeComplexity.includes("log n")) {
    return 0.34;
  }
  if (timeComplexity.includes("n")) {
    return 0.5;
  }
  return 0.28;
}

function formatNValue(value: number): string {
  return value.toLocaleString();
}

function buildScaleWarning(analysis: AnalysisResult | null) {
  if (!analysis) {
    return null;
  }

  const runtimes = analysis.simulation.runtime_estimated_ms;
  const nValues = analysis.simulation.n_values;
  if (runtimes.length < 2 || nValues.length !== runtimes.length) {
    return null;
  }

  const topHotspot = analysis.hotspots[0];
  const ratios = runtimes.slice(1).map((value, index) => {
    const previous = Math.max(runtimes[index], 0.0001);
    return value / previous;
  });

  let dangerIndex = ratios.findIndex((ratio, index) => ratio >= 2.6 || runtimes[index + 1] >= 400);
  if (dangerIndex === -1) {
    dangerIndex = ratios.findIndex((ratio) => ratio >= 1.8);
  }
  const triggerIndex = Math.max(1, dangerIndex === -1 ? 1 : dangerIndex + 1);

  let impracticalIndex = runtimes.findIndex((value, index) => index > triggerIndex && value >= 2500);
  if (impracticalIndex === -1) {
    impracticalIndex = runtimes.findIndex((value, index) => index > triggerIndex && value >= 1000);
  }
  if (impracticalIndex === -1) {
    impracticalIndex = runtimes.length - 1;
  }

  const triggerN = nValues[triggerIndex];
  const impracticalN = nValues[impracticalIndex];
  const hotspotText = topHotspot
    ? `Around n=${formatNValue(triggerN)}, line ${topHotspot.line} starts to dominate because ${topHotspot.reason.toLowerCase()}.`
    : `Around n=${formatNValue(triggerN)}, this implementation starts compounding fast.`;
  const impracticalText =
    impracticalIndex > triggerIndex
      ? `Past n=${formatNValue(impracticalN)}, this approach becomes impractical for interactive use.`
      : `By n=${formatNValue(impracticalN)}, this curve is already expensive enough to justify a rewrite.`;

  return {
    annotation: {
      index: triggerIndex,
      label: `Gets risky at n=${formatNValue(triggerN)}`,
      detail: topHotspot
        ? `Line ${topHotspot.line} begins to dominate the run here.`
        : "The runtime curve bends sharply here.",
    },
    hotspotText,
    impracticalText,
  };
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
  const hotspotCount = displayAnalysis?.hotspots.length ?? 0;
  const bottleneckSeverity = complexitySeverity(displayAnalysis?.complexity.time);
  const bottleneckIncomingCount = Math.min(24, Math.max(10, hotspotCount * 4 + 8));
  const bottleneckNeckCount = Math.min(9, Math.max(4, Math.round(10 - bottleneckSeverity * 6)));
  const bottleneckExitCount = Math.min(12, Math.max(4, Math.round(12 - bottleneckSeverity * 5)));
  const bottleneckNeckWidth = `${Math.max(6, 14 - bottleneckSeverity * 7)}%`;
  const bottleneckReleaseWidth = `${Math.max(16, 28 - bottleneckSeverity * 10)}%`;
  const scaleWarning = buildScaleWarning(displayAnalysis);
  const bottleneckShellStyle = {
    "--bottleneck-neck-width": bottleneckNeckWidth,
    "--bottleneck-release-width": bottleneckReleaseWidth,
    "--bottleneck-flow-opacity": `${0.66 + (displayAnalysis?.complexity.confidence ?? 0.4) * 0.24}`,
  } as CSSProperties;

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
          <p className="eyebrow">What this unlocks</p>
          <h2>Run it once. See what is slow. Know what to fix.</h2>
          <p className="hero-copy">
            The point is to make performance feel less fuzzy. You should be able to spot the expensive part, understand
            how it grows, and decide whether a rewrite is actually worth your time.
          </p>
          <div className="story-stat-grid">
            <article>
              <strong>{displayAnalysis?.hotspots[0]?.line ? `Line ${displayAnalysis.hotspots[0].line}` : "Hotspots"}</strong>
              <span>
                {displayAnalysis?.hotspots[0]?.reason ?? "Find the exact region that dominates runtime first."}
              </span>
            </article>
            <article>
              <strong>{displayAnalysis?.complexity.time ?? "Growth risk"}</strong>
              <span>
                {displayAnalysis
                  ? `Current structure suggests ${displayAnalysis.complexity.time} time and ${displayAnalysis.complexity.space} space.`
                  : "Understand how the implementation behaves before scaling it."}
              </span>
            </article>
            <article>
              <strong>{displayAnalysis?.suggestions.length ? "Next move" : "Optimization"}</strong>
              <span>
                {displayAnalysis?.suggestions[0]?.title ??
                  "Get specific rewrite ideas instead of generic “optimize this” advice."}
              </span>
            </article>
          </div>
        </div>
      </header>

      <section className="kinetic-band reveal-on-scroll" aria-hidden="true">
        <div className="kinetic-track">
          <span>TRACE</span>
          <span>REVEAL</span>
          <span>SCALE</span>
          <span>COMPARE</span>
          <span>PRESSURE</span>
          <span>SIMULATE</span>
          <span>TRACE</span>
          <span>REVEAL</span>
          <span>SCALE</span>
          <span>COMPARE</span>
        </div>
      </section>

      <section className="story-drive" id="story">
        <div className="section-intro reveal-on-scroll">
          <p className="eyebrow">Decision layers</p>
          <h2>Before you optimize anything, answer these three questions.</h2>
        </div>

        <div className="chapter-shell">
          <div className="chapter-stage reveal-on-scroll">
            <div className="stage-frame">
              <div className="stage-grid" />
              <div className="stage-glow stage-glow-one" />
              <div className="stage-glow stage-glow-two" />
              <div className="stage-header">
                <div>
                  <p className="eyebrow">Live scan surface</p>
                  <h3>Optimization decision map</h3>
                </div>
                <span className="scan-chip">Interactive</span>
              </div>

              <div className="stage-ribbons">
                <span className="stage-ribbon ribbon-a">
                  {displayAnalysis?.hotspots[0]?.line ? `Pressure at line ${displayAnalysis.hotspots[0].line}` : "Pressure lines"}
                </span>
                <span className="stage-ribbon ribbon-b">
                  {displayAnalysis?.complexity.time ? `${displayAnalysis.complexity.time} growth profile` : "Growth profile"}
                </span>
                <span className="stage-ribbon ribbon-c">
                  {displayAnalysis?.suggestions.length ? "Rewrite opportunities found" : "Rewrite opportunities"}
                </span>
              </div>

              <div className="stage-footer-grid">
                <article>
                  <span>Current read</span>
                  <strong>{displayAnalysis?.complexity.time ?? "Awaiting scan"}</strong>
                </article>
                <article>
                  <span>Trace frames</span>
                  <strong>{heroTraceSteps}</strong>
                </article>
                <article>
                  <span>Pressure lines</span>
                  <strong>{displayAnalysis?.hotspots.length ?? 0}</strong>
                </article>
              </div>
            </div>
          </div>

          <div className="chapter-stack">
            <article className="chapter-card reveal-on-scroll chapter-card-primary">
              <span className="chapter-index">01</span>
              <div className="chapter-copy">
                <p className="chapter-kicker">Where is the pressure?</p>
                <h3>Find the real bottleneck</h3>
                <p>
                  Most of your code is fine. The issue is usually one loop, one lookup, or one repeated operation
                  that&apos;s slowing everything down. Don&apos;t guess, identify the exact line that&apos;s causing the
                  problem.
                </p>
              </div>
            </article>

            <article className="chapter-card reveal-on-scroll chapter-card-secondary">
              <span className="chapter-index">02</span>
              <div className="chapter-copy">
                <p className="chapter-kicker">What happens at scale?</p>
                <h3>Think about scale early</h3>
                <p>
                  Code can look perfectly fine with small inputs. The real test is what happens when your data grows
                  10x or 100x. Always consider how your solution behaves at scale, not just when it&apos;s small.
                </p>
              </div>
            </article>

            <article className="chapter-card reveal-on-scroll chapter-card-tertiary">
              <span className="chapter-index">03</span>
              <div className="chapter-copy">
                <p className="chapter-kicker">What should you change?</p>
                <h3>Make intentional improvements</h3>
                <p>
                  Saying something is &ldquo;slow&rdquo; isn&apos;t enough. You need a clear fix. That could mean changing
                  the data structure, moving where a sort happens, caching repeated work, or sometimes doing nothing at
                  all. Be precise about what you change and why.
                </p>
              </div>
            </article>
          </div>
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
            <p className="section-support-copy">
              A bottleneck is what happens when a lot of work tries to pass through a tiny expensive region. CodeX-Ray
              helps you see where the flow gets squeezed.
            </p>
          </div>
          <div className="bottleneck-visual" aria-hidden="true">
            <div className="bottleneck-glow bottleneck-glow-left" />
            <div className="bottleneck-glow bottleneck-glow-right" />
            <div className="bottleneck-shell" style={bottleneckShellStyle}>
              <div className="bottleneck-flow">
                {Array.from({ length: bottleneckIncomingCount }).map((_, index) => (
                  <span
                    key={`flow-left-${index}`}
                    className={`flow-dot flow-dot-left tone-${(index % 3) + 1}`}
                    style={
                      {
                        "--delay": `${index * 0.28}s`,
                        "--offset": `${(index % 6) * 12}px`,
                      } as CSSProperties
                    }
                  />
                ))}
                {Array.from({ length: bottleneckNeckCount }).map((_, index) => (
                  <span
                    key={`flow-neck-${index}`}
                    className="flow-dot flow-dot-neck"
                    style={
                      {
                        "--delay": `${0.9 + index * 0.32}s`,
                        "--offset": `${(index % 3) * 6}px`,
                      } as CSSProperties
                    }
                  />
                ))}
                {Array.from({ length: bottleneckExitCount }).map((_, index) => (
                  <span
                    key={`flow-right-${index}`}
                    className={`flow-dot flow-dot-right tone-${((index + 1) % 3) + 1}`}
                    style={
                      {
                        "--delay": `${1.4 + index * 0.3}s`,
                        "--offset": `${(index % 4) * 10}px`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
              <div className="bottleneck-shape">
                <div className="shape-wide" />
                <div className="shape-neck" />
                <div className="shape-release" />
              </div>
            </div>
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
            {displayAnalysis ? (
              <>
                <SimulationDeck simulation={displayAnalysis.simulation} runtimeAnnotation={scaleWarning?.annotation} />
                {scaleWarning ? (
                  <section className="panel scale-warning-panel">
                    <div className="panel-header compact">
                      <div>
                        <p className="eyebrow">Why This Gets Bad</p>
                        <h3>Where the curve stops being safe</h3>
                      </div>
                    </div>
                    <div className="scale-warning-copy">
                      <p>{scaleWarning.hotspotText}</p>
                      <p>{scaleWarning.impracticalText}</p>
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}
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
