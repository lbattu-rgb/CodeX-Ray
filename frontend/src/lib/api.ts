import type { AnalysisResult, CompareResult, ExampleSnippet, InputConfig } from "./types";

const API_BASE = "http://localhost:8000";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return (await response.json()) as T;
}

export async function fetchExamples(): Promise<Record<string, ExampleSnippet>> {
  const response = await fetch(`${API_BASE}/examples`);
  const data = await readJson<{ examples: Record<string, ExampleSnippet> }>(response);
  return data.examples;
}

export async function analyzeSource(source: string, entryFunction: string, inputConfig: InputConfig): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      language: "python",
      entry_function: entryFunction,
      input_config: inputConfig,
    }),
  });
  return readJson<AnalysisResult>(response);
}

export async function compareSources(
  leftSource: string,
  rightSource: string,
  leftEntryFunction: string,
  rightEntryFunction: string,
  inputConfig: InputConfig,
): Promise<CompareResult> {
  const response = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      left: {
        source: leftSource,
        language: "python",
        entry_function: leftEntryFunction,
        input_config: inputConfig,
      },
      right: {
        source: rightSource,
        language: "python",
        entry_function: rightEntryFunction,
        input_config: inputConfig,
      },
    }),
  });
  return readJson<CompareResult>(response);
}
