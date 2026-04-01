import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";
import type * as Monaco from "monaco-editor";

type CodePanelProps = {
  title: string;
  source: string;
  entryFunction: string;
  highlightedLines?: number[];
  activeLine?: number | null;
  onSourceChange: (value: string) => void;
  onEntryFunctionChange: (value: string) => void;
};

function defineTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme("codex-ray-xray", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "3a6ee8" },
      { token: "string", foreground: "d64e97" },
      { token: "number", foreground: "028b7a" },
      { token: "comment", foreground: "89a0bf" },
      { token: "identifier", foreground: "20304c" },
    ],
    colors: {
      "editor.background": "#fffaf6",
      "editor.foreground": "#20304c",
      "editorLineNumber.foreground": "#aab6cd",
      "editorLineNumber.activeForeground": "#3a4f77",
      "editorCursor.foreground": "#2d71ff",
      "editor.selectionBackground": "#dce8ff",
      "editor.inactiveSelectionBackground": "#edf3ff",
      "editor.lineHighlightBackground": "#fff1e7",
      "editorGutter.background": "#fffaf6",
    },
  });
}

export function CodePanel({
  title,
  source,
  entryFunction,
  highlightedLines = [],
  activeLine = null,
  onSourceChange,
  onEntryFunctionChange,
}: CodePanelProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const sortedHighlights = useMemo(
    () => [...new Set(highlightedLines)].sort((left, right) => left - right),
    [highlightedLines],
  );

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    defineTheme(monaco);
    monaco.editor.setTheme("codex-ray-xray");
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      [
        ...sortedHighlights.map((line, index) => ({
          range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
          options: {
            isWholeLine: true,
            className: index === 0 ? "monaco-hotspot-line-primary" : "monaco-hotspot-line",
            glyphMarginClassName: index === 0 ? "monaco-hotspot-glyph-primary" : "monaco-hotspot-glyph",
            linesDecorationsClassName: index === 0 ? "monaco-hotspot-margin-primary" : "monaco-hotspot-margin",
            minimap: {
              color: index === 0 ? "#ff63c2" : "#41d8ff",
              position: 1,
            },
          },
        })),
        ...(activeLine && activeLine > 0 && activeLine <= model.getLineCount()
          ? [
              {
                range: new monaco.Range(activeLine, 1, activeLine, model.getLineMaxColumn(activeLine)),
                options: {
                  isWholeLine: true,
                  className: "monaco-active-trace-line",
                  glyphMarginClassName: "monaco-active-trace-glyph",
                  linesDecorationsClassName: "monaco-active-trace-margin",
                  minimap: {
                    color: "#ffffff",
                    position: 1,
                  },
                },
              },
            ]
          : []),
      ],
    );
  }, [activeLine, sortedHighlights, source]);

  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>Source Workspace</h2>
        </div>
        <label className="input-stack">
          <span>Entry function</span>
          <input value={entryFunction} onChange={(event) => onEntryFunctionChange(event.target.value)} />
        </label>
      </div>
      <div className="editor-shell monaco-shell">
        <Editor
          height="420px"
          defaultLanguage="python"
          language="python"
          value={source}
          onMount={handleMount}
          onChange={(value) => onSourceChange(value ?? "")}
          theme="codex-ray-xray"
          options={{
            minimap: { enabled: true },
            fontSize: 15,
            lineHeight: 24,
            fontFamily: "IBM Plex Mono, SFMono-Regular, monospace",
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            wordWrap: "off",
            roundedSelection: true,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            glyphMargin: true,
            folding: false,
            renderLineHighlight: "all",
            overviewRulerBorder: false,
          }}
        />
      </div>
    </section>
  );
}
