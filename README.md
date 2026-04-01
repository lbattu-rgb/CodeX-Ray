# CodeX-Ray

CodeX-Ray is an algorithm intelligence platform for people who do not just want to run code, but actually understand how it behaves.

Instead of stopping at "this works" or "this is slow," CodeX-Ray tries to answer the deeper questions:

- What is this code doing step by step?
- Why does it scale the way it does?
- Which line is actually causing the bottleneck?
- What changes if I rewrite one part of the algorithm?
- Is one implementation meaningfully better than another?

This project was built to sit in the space between execution visualizers, static analyzers, and performance tooling. The goal is to make algorithm behavior visible, explainable, and interactive in a way that feels more like an X-ray than a debugger.

## Why I Built This

A lot of tools show pieces of the story:

- visualizers show execution
- profilers show hotspots after the fact
- complexity discussions stay theoretical
- AI explanations often sound convincing without grounding

What I wanted instead was one system where the code, the trace, the complexity prediction, the bottlenecks, the growth curve, and the explanation all talk to each other.

CodeX-Ray is my attempt at that.

## What CodeX-Ray Does

At a high level, you paste in Python code and CodeX-Ray can:

- parse the structure of the algorithm
- generate a step-by-step execution trace
- predict time and space complexity
- simulate runtime and memory growth as input size changes
- identify likely bottleneck lines
- surface optimization suggestions
- build a behavioral fingerprint called Complexity DNA
- compare two implementations side by side
- explain the result in plain language

## Core Features

### 1. Structural Analysis

The backend parses Python source into an internal representation that captures:

- functions
- loops
- branches
- function calls
- recursion candidates
- approximate control flow
- line-level dependencies

This gives the rest of the system a structure-aware view of the code instead of treating it like plain text.

### 2. Execution Trace

CodeX-Ray can execute supported snippets in a constrained trace environment and collect:

- line execution order
- stack state
- local variables
- returns
- basic heap summary

The UI then lets you scrub across trace steps while the active executing line is reflected directly in the code editor.

### 3. Complexity Prediction

The project includes a rule-based complexity engine that looks at visible algorithm structure and infers likely time and space complexity for common patterns such as:

- single loops
- nested loops
- sorting
- recursion
- branching recursion
- collection growth

It also returns evidence lines and a confidence score so the result is not just a label with no reasoning behind it.

### 4. Runtime and Memory Simulation

Instead of forcing brute-force benchmarking for every scale question, CodeX-Ray estimates how runtime and memory grow across increasing input sizes.

This makes it easier to see:

- when a solution starts to break down
- whether an implementation scales gracefully
- how different complexity classes diverge visually

### 5. Bottleneck Detection

The app highlights expensive regions and surfaces hotspot lines with reasons tied to the detected structure.

Examples include:

- nested loop pressure
- repeated calls inside loops
- repeated allocation
- sorting cost

### 6. Complexity DNA

One of the more unique ideas in the project is the Complexity DNA panel, which turns algorithm behavior into a fingerprint across dimensions like:

- iteration intensity
- recursion tendency
- memory growth
- lookup efficiency
- allocation frequency
- input sensitivity

The point is to make algorithm behavior feel profile-able instead of hidden.

### 7. Comparison Mode

CodeX-Ray supports comparing two implementations of the same idea so you can inspect:

- predicted complexity
- projected runtime
- projected memory
- hotspot differences
- behavioral profile differences

This is especially useful for learning, optimization, and competition demos.

## Current UI Direction

The frontend is intentionally designed to feel more like a scanning environment than a generic dashboard.

The current experience includes:

- a Monaco-based code editor
- hotspot-aware gutter and line highlighting
- trace-linked active line highlighting
- animated growth graphs
- a data-aware hero summary instead of a decorative landing block
- luminous X-ray inspired styling

The design goal is not just "pretty." It is to make the app feel like it is actively reading and interpreting the code.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Monaco Editor
- D3.js

### Backend

- Python
- FastAPI
- Pydantic
- Python AST

## Architecture Overview

```text
User Code
  -> Parser / Structural Analysis
  -> Complexity Engine
  -> Hotspot Engine
  -> Simulation Engine
  -> Explanation Layer
  -> Frontend Visualization Layer
```

More detailed architecture notes live in [ARCHITECTURE.md](/Users/likhithabattu/Documents/Personal%20Projects/CodeX-Ray/docs/ARCHITECTURE.md).

## Repository Structure

```text
CodeX-Ray/
├── backend/
│   ├── app/
│   │   ├── engines/
│   │   ├── examples/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── services.py
│   ├── requirements.txt
│   └── tests/
├── docs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.ts
├── CODEX_RAY_PRD.md
└── README.md
```

## Running Locally

### 1. Start the backend

```bash
cd "/Users/likhithabattu/Documents/Personal Projects/CodeX-Ray/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on:

`http://127.0.0.1:8000`

### 2. Start the frontend

```bash
cd "/Users/likhithabattu/Documents/Personal Projects/CodeX-Ray/frontend"
npm install
npm run dev
```

Frontend runs on:

`http://localhost:5173`

## Example Snippets To Try

### Two Sum Naive

Good for:

- nested loops
- hotspot highlighting
- comparison against a better implementation

### Two Sum Hash Map

Good for:

- better complexity profile
- compare mode
- optimization story

### Recursive Fibonacci

Good for:

- recursion
- branching behavior
- scaling contrast

### Merge Sort

Good for:

- divide and conquer
- recursion plus merging
- more interesting trace behavior

## API Endpoints

### `GET /health`

Basic backend health check.

### `GET /examples`

Returns bundled demo snippets.

### `POST /analyze`

Runs structural analysis and returns:

- complexity prediction
- hotspots
- DNA
- suggestions
- explanations
- trace preview
- simulation output

### `POST /trace`

Generates a full trace payload for supported snippets.

### `POST /simulate`

Produces runtime and memory projection series from analysis output.

### `POST /compare`

Compares two implementations and returns a summary plus both analyses.

## What’s Implemented Right Now

The current version already includes a strong vertical slice:

- AST-based analysis backend
- complexity inference
- hotspot scoring
- optimization suggestions
- simulation curves
- explanation layer
- compare mode
- trace timeline
- Monaco editor integration
- trace-synced line highlighting
- analysis-aware hero summary

This is not just a mockup. It is a working product foundation.

## What Still Needs Work

There is still a lot of room to push this further.

Highest-value next steps:

- richer recursion tree visualization
- dedicated control-flow / data-flow views
- better measured-vs-estimated performance calibration
- play/pause animated trace playback
- more robust support for advanced Python constructs
- cleaner error handling when the user pastes malformed code
- stronger compare-mode visual storytelling

## Validation

Validated during development:

- backend unit test passes
- FastAPI app imports and runs
- health endpoint responds correctly
- analyze endpoint returns structured payloads
- frontend production build passes
- Monaco editor integration builds successfully

## What Makes This Different

CodeX-Ray is not trying to be only:

- a debugger
- a visualizer
- a profiler
- an AI explainer

It is trying to combine the best parts of those categories into one experience focused on algorithm understanding.

That is the real idea behind the project.

## Future Vision

Long term, I want this to grow into something much bigger:

- multi-language support
- stronger symbolic reasoning
- better educational modes
- classroom / interview prep workflows
- deeper optimization guidance
- VS Code integration

The bigger dream is a system that does for algorithm behavior what an X-ray does for anatomy: reveal the structure underneath what you can already see.

## Notes

The original product direction, feature planning, and implementation framing live in:

- [CODEX_RAY_PRD.md](/Users/likhithabattu/Documents/Personal%20Projects/CodeX-Ray/CODEX_RAY_PRD.md)
- [CODEX_IMPLEMENTATION_PROMPT.md](/Users/likhithabattu/Documents/Personal%20Projects/CodeX-Ray/CODEX_IMPLEMENTATION_PROMPT.md)

If you are looking at this repo as a recruiter, judge, collaborator, or engineer, the most important thing to know is this:

This project is meant to be both technically ambitious and deeply product-driven.
