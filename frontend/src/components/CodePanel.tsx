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
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "8dd8ff" },
      { token: "string", foreground: "ffa7de" },
      { token: "number", foreground: "7ef0d6" },
      { token: "comment", foreground: "6683a8" },
      { token: "identifier", foreground: "eef4ff" },
    ],
    colors: {
      "editor.background": "#07111d",
      "editor.foreground": "#eef4ff",
      "editorLineNumber.foreground": "#50698f",
      "editorLineNumber.activeForeground": "#d9e7ff",
      "editorCursor.foreground": "#7ee8ff",
      "editor.selectionBackground": "#1d365966",
      "editor.inactiveSelectionBackground": "#18304f44",
      "editor.lineHighlightBackground": "#0d1a2d88",
      "editorGutter.background": "#07111d",
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
