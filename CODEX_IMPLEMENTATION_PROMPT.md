# Codex Implementation Prompt for CodeX-Ray

Build CodeX-Ray as a polished full-stack web application using the PRD at [CODEX_RAY_PRD.md](/Users/likhithabattu/Documents/Personal Projects/CodeX-Ray/CODEX_RAY_PRD.md) as the source of truth.

## Your role

Act as the lead engineer for this product. Do not treat this as a toy demo. Treat it as a startup-quality prototype intended for judges, users, and future extension.

## Product intent

CodeX-Ray must feel meaningfully different from a basic execution visualizer. The product should combine:

- structural code analysis
- step-by-step execution tracing
- complexity prediction
- runtime and memory growth simulation
- bottleneck detection
- counterfactual analysis
- implementation comparison
- teacher-quality explanation

## Build priorities

Follow this order unless a dependency forces a better sequence:

1. Initialize a clean monorepo or two-folder layout with `frontend/` and `backend/`
2. Build the Python backend analysis pipeline and normalized API contracts
3. Build the React frontend editor and analysis dashboard
4. Implement execution tracing and playback UI
5. Add complexity prediction and simulation graphs
6. Add bottleneck heatmap and suggestion system
7. Add counterfactual mode
8. Add side-by-side comparison mode
9. Add Complexity DNA visualization
10. Polish the UX for demo quality

## Technical requirements

- Frontend: React + TypeScript + Vite
- Visualization: D3.js where custom visuals matter
- Editor: Monaco or CodeMirror
- Backend: Python + FastAPI
- Analysis basis: Python AST parsing for MVP
- Use clear modular architecture
- Use strong API schemas
- Keep the codebase readable and extensible

## Important product requirements

- Every insight shown in the UI must map back to code lines or structured evidence
- Distinguish clearly between actual trace data and projected estimates
- Show confidence where analysis may be uncertain
- Use progressive disclosure so the interface stays understandable
- Optimize for a polished demo experience, not just raw technical correctness

## Initial deliverable

First, scaffold the full app and deliver a working vertical slice with:

- Python code editor
- backend AST analysis endpoint
- structured analysis JSON response
- frontend analysis panel
- placeholder visualization regions for trace, graphs, and insights

Then continue iteratively toward the full PRD.

## Workflow requirements

- Read the PRD before making architectural decisions
- Keep a `docs/` folder for architecture notes and assumptions
- If you need to narrow scope temporarily, preserve the PRD-aligned architecture so later features fit naturally
- Prefer implementing reusable primitives over one-off hacks

## UX direction

- Make the product feel intentional and competition-ready
- Avoid generic dashboard styling
- Use motion meaningfully for loops, recursion, and state transitions
- The interface should feel like an algorithm observatory, not a CRUD app

## Success condition

When someone uses the app, they should immediately understand that this product does more than show execution. It should visibly predict growth, explain bottlenecks, and reveal how code changes alter behavior.
