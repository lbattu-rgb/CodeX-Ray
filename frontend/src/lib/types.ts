export type InputConfig = {
  args: unknown[];
  kwargs: Record<string, unknown>;
  input_size: number;
  scenario: "custom" | "sorted" | "reverse_sorted" | "random" | "repeated" | "worst_case";
};

export type Complexity = {
  time: string;
  space: string;
  confidence: number;
  evidence_lines: number[];
  explanation: string;
};

export type Hotspot = {
  line: number;
  score: number;
  reason: string;
};

export type Suggestion = {
  title: string;
  line: number;
  why: string;
  impact: string;
  rewrite_hint: string;
};

export type TraceEvent = {
  step: number;
  event_type: string;
  line: number;
  stack: Array<{
    function: string;
    line: number;
    locals: Record<string, unknown>;
  }>;
  heap_summary: {
    objects: number;
    estimated_bytes: number;
  };
  return_value?: unknown;
};

export type SimulationSeries = {
  n_values: number[];
  runtime_estimated_ms: number[];
  memory_estimated_kb: number[];
  classification: string;
};

export type AnalysisResult = {
  session_id: string;
  language: string;
  entry_function?: string | null;
  functions: Array<{ id: string; name: string; line_start: number; line_end: number }>;
  nodes: Array<{ id: string; type: string; line?: number; [key: string]: unknown }>;
  cfg: Array<{ from_line: number; to_line: number; kind: string }>;
  calls: Array<{ line: number; function: string; parent_id?: string | null; in_loop: boolean }>;
  recursion_candidates: Array<{ function: string; line: number; type: string }>;
  data_dependencies: Record<string, string[]>;
  complexity: Complexity;
  hotspots: Hotspot[];
  dna: Record<string, string>;
  suggestions: Suggestion[];
  explanations: {
    concise: string;
    teaching: string;
  };
  simulation: SimulationSeries;
  trace_preview: {
    events: TraceEvent[];
    result: unknown;
    truncated: boolean;
  };
};

export type ExampleSnippet = {
  title: string;
  description: string;
  source: string;
  entry_function: string;
  args: unknown[];
};

export type CompareResult = {
  left: AnalysisResult;
  right: AnalysisResult;
  summary: string;
};
