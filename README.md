# AlgoScope

AlgoScope is a full-stack web app for understanding how Python algorithms behave.

Instead of only telling you whether code works, it helps answer the questions that usually come next:

- Where is the bottleneck?
- How will this scale?
- Which implementation is better?
- What actually changes if I rewrite one part?

The project sits between an execution visualizer, a lightweight performance analysis tool, and a teaching aid. The goal is simple: make algorithm behavior easier to see and easier to explain.

Live site: [AlgoScope on Vercel](https://algoscope-nine.vercel.app)

## What It Does

AlgoScope currently supports:

- structural analysis of Python code using the AST
- step-by-step execution traces for supported snippets
- predicted time and space complexity with confidence
- simulated runtime and memory growth across input sizes
- hotspot detection with line-level reasoning
- optimization suggestions for common inefficient patterns
- a visual algorithm fingerprint called `Complexity DNA`
- side-by-side comparison between implementations
- plain-language explanations tied to the analysis

## Why This Project Exists

A lot of tools only show one part of the story.

- Visualizers show execution, but not how code scales.
- Profilers show hotspots, but only after you run the code.
- Big-O discussions are useful, but often stay abstract.
- AI explanations can sound polished without being grounded.

AlgoScope tries to connect those layers in one place so the code, trace, complexity prediction, growth curve, and suggestions all support the same conclusion.

## Main Features

### 1. Structural analysis

The backend parses Python code into a structured model that captures:

- functions
- loops
- branches
- calls
- recursion candidates
- line-level nodes used across the UI

This lets the app reason about code as structure, not just raw text.

### 2. Execution tracing

Supported snippets can be run in a constrained trace environment that records:

- executed lines
- local state
- stack frames
- returns
- basic heap summaries

The frontend links that trace back to the editor so you can scrub through execution and see the active line directly.

### 3. Complexity prediction

AlgoScope includes a rule-based complexity engine for common patterns such as:

- single loops
- nested loops
- sorting
- recursion
- branching recursion
- collection growth

It also returns evidence lines and a confidence score so the result is more than just a label.

### 4. Runtime and memory simulation

The app estimates how a solution behaves as input size grows. This is useful for seeing:

- where a solution stops being practical
- how two complexity classes diverge
- whether a rewrite actually changes the growth story

### 5. Bottleneck detection

The app surfaces likely expensive regions and explains why they matter.

Examples:

- nested loop pressure
- repeated lookups inside loops
- repeated allocation
- sorting in the wrong place

### 6. Complexity DNA

Complexity DNA is a compact behavioral profile for an algorithm. It summarizes dimensions such as:

- iteration intensity
- recursion tendency
- memory growth
- lookup efficiency
- allocation frequency
- input sensitivity

### 7. Compare mode

Two implementations can be compared side by side across:

- predicted complexity
- projected runtime
- projected memory
- hotspot differences
- explanation and suggestion differences

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

## Architecture

```text
User Code
  -> Parser / Structural Analysis
  -> Complexity Engine
  -> Hotspot Engine
  -> Simulation Engine
  -> Explanation Layer
  -> Frontend Visualization Layer
```

More detailed notes live in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Repository Structure

```text
AlgoScope/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── tests/
├── docs/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── api/
├── shared/
├── ALGOSCOPE_PRD.md
├── ALGOSCOPE_IMPLEMENTATION_PROMPT.md
└── README.md
```

## Running Locally

### 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend:

`http://127.0.0.1:8000`

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

## Good Demo Inputs

### Naive `two_sum`

Useful for:

- nested loops
- clear hotspot detection
- strong `O(n^2)` story

### Hash-map `two_sum`

Useful for:

- comparison mode
- rewrite story
- showing how one design change lowers pressure

### Recursive Fibonacci

Useful for:

- recursion
- branching growth
- “gets bad at n = ...” messaging

### Merge sort

Useful for:

- divide-and-conquer structure
- recursion plus merging
- cleaner scaling than brute-force examples

## Notes

- The current MVP focuses on Python and supported snippet patterns.
- Some dynamic language features and advanced Python constructs are intentionally out of scope for now.
- Complexity prediction is an informed estimate, not a proof, so the UI surfaces confidence where appropriate.

## Documentation

- PRD: [ALGOSCOPE_PRD.md](./ALGOSCOPE_PRD.md)
- Build prompt: [ALGOSCOPE_IMPLEMENTATION_PROMPT.md](./ALGOSCOPE_IMPLEMENTATION_PROMPT.md)
- Architecture notes: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
