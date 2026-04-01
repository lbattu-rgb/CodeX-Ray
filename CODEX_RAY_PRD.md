# CodeX-Ray PRD

## 1. Document Control

- Product: CodeX-Ray
- Version: 1.0
- Date: 2026-03-31
- Status: Build-ready PRD for MVP + competition-grade v2
- Intended audience: Codex, engineers, designers, judges, technical mentors
- Primary goal: Build a code intelligence system that explains, predicts, simulates, and compares algorithm behavior in a way existing execution visualizers and static analyzers do not

## 2. Executive Summary

CodeX-Ray is an interactive code intelligence platform for algorithm understanding. A user pastes code and immediately gets:

- structural decomposition of the algorithm
- step-by-step execution playback
- predicted time and space complexity before large-scale execution
- runtime and memory growth simulation across input sizes
- code-region bottleneck attribution
- counterfactual analysis when code is changed
- side-by-side comparison across implementations
- teaching-oriented explanations tied to actual program behavior

The product is intentionally positioned beyond a basic visualizer. Existing tools like Python Tutor focus on execution tracing, while complexity tools and linters focus on static metrics or style. CodeX-Ray combines static analysis, trace generation, growth modeling, optimization guidance, and human-readable explanation in one workflow.

## 3. Product Vision

Create the first developer-facing system that makes algorithm behavior feel observable, predictable, and editable in real time.

The user should not only ask:

- "What does this code do?"

They should also be able to ask:

- "Why does it behave this way?"
- "What happens when input size grows?"
- "Which line causes the blow-up?"
- "How would this change if I rewrote one line?"
- "Is this implementation better than my alternative?"

## 4. Product Thesis

Developers do not struggle only because code is hard to read. They struggle because algorithm behavior exists across multiple invisible layers:

- syntax
- control flow
- state transitions
- asymptotic growth
- memory growth
- bottleneck dominance
- implementation tradeoffs

Most tools expose one layer at a time. CodeX-Ray exposes all of them together in a coherent, interactive model.

## 5. Problem Statement

### Current user pain

- Students can trace simple code but cannot connect trace behavior to asymptotic complexity.
- Developers can benchmark code, but benchmarks are expensive, input-sensitive, and often too late.
- Static analyzers flag patterns, but usually do not teach the user how algorithm structure maps to runtime growth.
- Visualizers show execution, but usually not scalability, optimization, or "what-if" consequences.
- Performance tools surface hotspots after execution, not predictive growth before scaling.

### Core problem

There is no widely accessible tool that unifies:

- code structure understanding
- execution explanation
- asymptotic prediction
- growth simulation
- counterfactual reasoning
- comparative optimization

## 6. Opportunity and Differentiation

CodeX-Ray will compete in an adjacent space with:

- execution visualizers
- static analysis tools
- profiling tools
- educational algorithm demos
- AI code explanation tools

### Market gap

Those categories are usually separated. CodeX-Ray fills the gap between:

- "show me the steps"
- "estimate how it scales"
- "show me the costly part"
- "explain why"
- "let me compare alternatives"

### Key differentiators

- Predictive, not just reactive: estimate complexity and growth before brute-force scale testing
- Counterfactual, not just descriptive: recompute impact after small code edits
- Behavioral fingerprinting: represent algorithms with a reusable "Complexity DNA" profile
- Unified teaching layer: explanations anchored to trace, structure, and growth curves
- Comparison-native: first-class support for comparing multiple implementations of the same task

## 7. Target Users

### Primary users

- CS students learning algorithms and data structures
- interview candidates preparing for technical coding rounds
- early-career developers trying to understand code performance
- educators teaching algorithmic reasoning

### Secondary users

- software engineers investigating performance regressions
- technical content creators making demos
- coding bootcamp instructors
- hackathon and competition judges evaluating algorithmic insight tools

### Tertiary users

- AI-assisted coding users who want to verify generated code
- recruiters or mentors assessing code quality and complexity understanding

## 8. User Personas

### Persona A: Student Sam

- Goal: Understand why nested loops are slow and how recursion behaves
- Pain: Can follow syntax but cannot connect it to Big-O or memory growth
- Desired outcome: A visual and explanatory system that teaches algorithm behavior

### Persona B: Builder Bri

- Goal: Compare two implementations quickly
- Pain: Benchmarks are noisy and code review feedback is vague
- Desired outcome: Side-by-side comparison with bottleneck explanation

### Persona C: Instructor Isha

- Goal: Demonstrate execution, complexity, and tradeoffs live in class
- Pain: Needs multiple disconnected tools
- Desired outcome: One polished platform for live demos and teaching

## 9. Product Goals

### Primary goals

- Make algorithm behavior visible
- Make algorithm growth predictable
- Make optimization suggestions actionable
- Make learning intuitive and interactive

### Secondary goals

- Provide competition-grade presentation quality
- Support future multi-language expansion
- Create a strong foundation for AI-assisted explanations

### Non-goals for initial release

- Full production-grade support for arbitrary Python packages
- Exact runtime prediction under every hardware environment
- Deep symbolic theorem proving for all user-written programs
- General-purpose IDE replacement

## 10. Product Principles

- Explanation must always map back to evidence in the code
- Visuals must reveal behavior, not distract from it
- Estimates must show confidence and uncertainty
- Teaching and debugging are equally important
- Every advanced insight should still be understandable to a student

## 11. Core User Stories

### Understanding

- As a student, I want to paste code and see state changes line by line so I can understand execution.
- As a student, I want to see stack and heap changes so I can understand memory behavior.
- As a user, I want recursion visualized as a branching structure so I can understand call expansion.

### Prediction

- As a developer, I want the system to predict time and space complexity so I can assess scale risk before benchmarking.
- As a user, I want the system to explain why it predicted a certain complexity so I can trust the result.

### Optimization

- As a developer, I want slow regions highlighted so I can focus my optimization effort.
- As a user, I want concrete inefficiency suggestions so I can improve the code.

### Simulation

- As a user, I want to change input size and watch runtime and memory estimates update so I can understand scalability.
- As a user, I want simulation at large sizes without fully executing giant inputs so I can see projected growth quickly.

### Comparison

- As a user, I want to compare two implementations side by side so I can choose the better algorithm.

### Counterfactuals

- As a user, I want to modify one line and instantly see how complexity and bottlenecks change so I can learn causality.

## 12. Product Scope Overview

### MVP

- Python code input
- AST parsing
- CFG extraction
- controlled execution tracing
- variable/state visualization
- basic complexity inference
- runtime and memory growth simulation
- bottleneck heatmap
- explanation panel

### Competition-grade v2

- Counterfactual mode
- Complexity DNA profiler
- side-by-side comparison workspace
- inefficiency detector with rewrite suggestions
- confidence scoring and ambiguity handling
- richer D3 animations
- optional AI explanation refinement

### Future scope

- multiple languages
- VS Code extension
- collaboration and shared links
- classroom mode
- automatic test input generation

## 13. Functional Requirements

## 13.1 Code Input and Session Management

### Description

The user can paste, edit, and run code within an embedded editor.

### Requirements

- Support plain Python code input in MVP
- Provide sample snippets for common algorithm classes
- Preserve editor state during analysis interactions
- Allow named sessions stored client-side or server-side
- Allow users to select an entry function for analysis
- Allow users to provide function arguments or choose generated sample inputs

### Acceptance criteria

- A user can paste valid Python code and start analysis in under 2 interactions
- A user can modify code without losing previous insights until the next recompute

## 13.2 Parsing and Structural Decomposition Engine

### Description

The backend parses code into a normalized internal representation that powers all downstream features.

### Inputs

- Python source code

### Outputs

- AST
- function inventory
- loops inventory
- recursion candidates
- branch nodes
- variable declarations and mutations
- call graph
- control flow graph
- data dependency map

### Requirements

- Use Python AST parsing for syntactic structure
- Normalize loops, conditionals, function definitions, and returns into analyzable nodes
- Detect direct recursion and likely indirect recursion when feasible
- Identify operations with likely non-constant cost such as membership checks on lists, repeated slicing, nested iteration, sorting, and repeated function calls inside loops
- Assign stable node IDs for frontend synchronization

### Acceptance criteria

- For supported Python snippets, the parser returns a structured JSON analysis document
- Every displayed visual element can be traced back to a source line and node ID

## 13.3 Controlled Execution Trace Engine

### Description

The system executes code in a sandboxed, instrumented environment to generate a step-by-step trace for supported snippets.

### Requirements

- Capture line execution order
- Capture variable values after each step
- Capture stack frame creation and teardown
- Capture function call and return events
- Capture array/list mutations
- Capture branch decisions and loop iterations
- Support playback controls: play, pause, next, previous, jump-to-step

### Constraints

- Disallow unsafe imports and system calls in MVP
- Limit runtime, recursion depth, and memory during tracing
- Show a graceful fallback if execution exceeds limits

### Acceptance criteria

- The user can scrub through execution step-by-step
- Variable state updates are synchronized with executed lines
- Stack visualization reflects current call frames accurately

## 13.4 State and Memory Visualization

### Description

The UI visualizes program state, including variables, arrays, stack frames, and estimated heap growth.

### Requirements

- Variables display name, type, and current value
- Arrays display indexed cells and changed elements between steps
- Stack frames display function name, arguments, locals, and return value when complete
- Heap view displays object groups and reference relationships when feasible
- Memory growth chart displays estimated trend over input size

### Design goals

- Make mutations obvious
- Make recursion intuitive
- Avoid clutter for simple programs

### Acceptance criteria

- A user can identify where a variable changed
- A user can distinguish stack growth from collection/object growth

## 13.5 Complexity Prediction Engine

### Description

The system predicts asymptotic time and space complexity using rule-based structural analysis plus heuristic reasoning.

### Requirements

- Infer common complexity classes including O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n), and selected recurrence patterns
- Detect common patterns:
  - single linear loops
  - nested loops
  - divide-and-conquer recursion
  - branching recursion
  - repeated expensive operations inside loops
  - sorting calls
  - dictionary/set lookups
- Produce:
  - predicted time complexity
  - predicted space complexity
  - confidence score
  - evidence lines
  - explanation text

### Important requirement

The engine must clearly separate:

- structure-based asymptotic prediction
- measured trace cost on the given sample input
- simulated projected runtime growth

### Acceptance criteria

- A user receives a complexity estimate with supporting reasons
- Low-confidence or ambiguous cases are explicitly labeled as such

## 13.6 Runtime and Memory Simulation Engine

### Description

The system projects how runtime and memory usage grow as input size changes without requiring the user to execute massive inputs directly.

### Inputs

- complexity signals
- trace-derived operation counts
- configurable input size range

### Outputs

- projected runtime curve
- projected memory curve
- derived operation count table
- trend annotations

### Requirements

- Support logarithmic and linear input scale views
- Allow user slider input for n
- Recompute projected values on code change
- Display whether values are:
  - measured
  - estimated
  - extrapolated

### Acceptance criteria

- Changing the input size updates the graph and summary numbers
- The system differentiates between simulated estimates and actual executed timings

## 13.7 Bottleneck Detection and Attribution

### Description

The product should identify the most expensive code regions and explain their contribution.

### Requirements

- Assign cost weight to analyzable nodes
- Aggregate cost by line, block, function, and call path
- Visually highlight expensive regions in the editor
- Provide ranked hotspot list
- Explain why a line is expensive:
  - nested iteration
  - repeated lookup
  - repeated allocation
  - recursion branching
  - repeated sorting

### Acceptance criteria

- A user can see the top bottleneck lines and why they dominate
- Hotspots are visible both in the editor and the insight panel

## 13.8 Counterfactual Analysis Mode

### Description

This is a flagship differentiator. The user edits code and instantly sees how the algorithm’s predicted behavior changes.

### Core behavior

- Detect meaningful code edits
- Recompute structure, complexity, simulation, and hotspots
- Show before vs after deltas

### Example scenarios

- replace list membership with set membership
- change one nested loop bound
- swap recursion for iteration
- move sorting inside or outside a loop

### Required outputs

- complexity delta
- projected runtime delta
- projected memory delta
- hotspot changes
- explanation of causal difference

### Acceptance criteria

- A small source edit triggers a visible diff in at least one insight layer when behavior changed
- Users can understand which edit caused which predicted outcome

## 13.9 Complexity DNA Profiler

### Description

Represent algorithm behavior using a standardized behavioral fingerprint.

### Proposed DNA dimensions

- iteration intensity
- recursion depth tendency
- branching factor
- memory growth pattern
- lookup efficiency
- allocation frequency
- mutation intensity
- parallelization potential
- input sensitivity

### Output format

- radar chart or compact profile card
- textual labels like low, medium, high
- short explanation for each dimension

### Purpose

- Give users a memorable identity for an algorithm
- Enable comparison between implementations
- Make the product feel conceptually unique

### Acceptance criteria

- Every supported snippet produces a readable DNA profile
- The profile changes when algorithm structure meaningfully changes

## 13.10 Inefficiency Detection and Optimization Suggestions

### Description

Identify common anti-patterns and provide concrete recommendations.

### Detection examples

- membership checks in lists inside loops
- duplicate calculations inside loops
- repeated concatenation in quadratic patterns
- unnecessary deep copies
- sorting inside repeated loops
- avoidable recursion overhead

### Suggestion format

- issue title
- affected lines
- why it matters
- estimated impact
- suggested rewrite pattern

### Acceptance criteria

- The product surfaces at least one actionable suggestion for supported inefficient snippets
- Suggestions tie directly to identified evidence

## 13.11 AI Explanation Layer

### Description

The explanation layer translates structural and simulated insights into teacher-quality narrative.

### Requirements

- Explanations must be grounded in analysis outputs, not freeform hallucination
- Explain:
  - what the code is doing
  - why complexity is what it is
  - what bottlenecks dominate
  - how edits changed behavior
  - how two implementations differ
- Provide two verbosity modes:
  - concise
  - teaching

### Acceptance criteria

- Explanations are aligned with the evidence shown elsewhere in the UI
- The teaching mode is understandable to a student with limited background

## 13.12 Multi-Implementation Comparison

### Description

Users can compare two or more implementations of the same task.

### Requirements

- Side-by-side code editors
- Separate trace and analysis pipelines
- Shared input generation
- Comparison panels for:
  - time complexity
  - space complexity
  - runtime projection
  - memory projection
  - bottlenecks
  - DNA profile
- Summary verdict:
  - likely faster at small n
  - likely faster at large n
  - memory-friendlier
  - simpler to reason about

### Acceptance criteria

- A user can compare two snippets in one view
- The system produces a readable decision summary

## 13.13 Input Generation and Scenario Controls

### Description

The user can define or generate inputs for analysis and simulation.

### Requirements

- Manual input editor for function args
- Preset input generators:
  - sorted arrays
  - reverse-sorted arrays
  - random arrays
  - repeated values
  - worst-case patterns where applicable
- Input size slider
- Scenario labels like best case, average case, worst case where feasible

### Acceptance criteria

- A user can switch input scenarios without editing source code
- Charts and traces update accordingly for supported cases

## 14. UX and Interaction Design

## 14.1 Product Layout

### Left panel

- code editor
- code comparison toggle
- line-level heatmap overlay

### Center panel

- execution timeline
- stack and state visualizer
- recursion tree or loop timeline animation

### Right panel

- complexity card
- DNA profile
- bottleneck list
- suggestions
- explanation panel

### Bottom panel

- runtime projection graph
- memory projection graph
- counterfactual delta graph

## 14.2 Key interactions

- Hover line: show node details, local cost, and role
- Click line: pin hotspot explanation
- Drag timeline: scrub execution
- Change n slider: update simulated curves
- Edit code: trigger staged recomputation
- Toggle compare mode: split the workspace side by side
- Toggle explanation verbosity: concise or teaching

## 14.3 Motion and Visual Design Direction

- Loops animate as cyclical passes over indexed data
- Recursion grows as an expanding tree with collapsing returns
- Variables animate on mutation to draw attention
- Hotspots pulse or brighten subtly, not aggressively
- Graph transitions should preserve context during code edits

## 14.4 UX guardrails

- Do not overload the screen by default
- Start with concise summary, allow expansion
- Mark estimates and confidence clearly
- Avoid educational jargon without explanation

## 15. Detailed Screen Specifications

## 15.1 Analyze Screen

### Components

- Editor with syntax highlighting
- Analyze button
- Input configuration drawer
- Example selector
- Validation and parse errors

### Empty state

- Invite user to paste code or load example
- Highlight supported snippet types

## 15.2 Trace Screen

### Components

- current executed line marker
- variable table
- stack frame tower
- array/object visualizer
- play controls

### Behavioral requirement

- The current state must always correspond to the selected trace step

## 15.3 Insights Screen

### Components

- complexity prediction card
- confidence indicator
- hotspots list
- optimization suggestions
- explanation narrative

## 15.4 Simulation Screen

### Components

- runtime graph
- memory graph
- input size slider
- measured vs estimated legend
- best/average/worst case toggle when supported

## 15.5 Compare Screen

### Components

- editor A
- editor B
- synchronized input controls
- comparison summary
- dual graph overlay
- DNA difference view

## 16. System Architecture

## 16.1 High-level architecture

1. Frontend receives source code and user settings
2. Backend parser produces structural representation
3. Trace engine produces controlled execution events
4. Analysis engine infers complexity and hotspots
5. Simulation engine projects growth over input size
6. Explanation engine converts analysis into narrative
7. Frontend renders linked visualizations

## 16.2 Backend modules

### `parser.py`

- parse source into AST
- extract functions, loops, branches, operations
- map AST nodes to source locations

### `cfg_builder.py`

- build control flow graph
- annotate edges with branch and loop semantics

### `trace_engine.py`

- execute code in a constrained environment
- emit event stream for line execution, variable mutation, call, return, and exceptions

### `complexity_engine.py`

- infer asymptotic complexity
- score confidence
- attach evidence

### `simulation_engine.py`

- turn symbolic cost + measured operation counts into projected curves

### `hotspot_engine.py`

- aggregate cost attribution
- produce line/function rankings

### `optimization_engine.py`

- detect common anti-patterns
- produce suggestions with impact rationale

### `dna_engine.py`

- derive fingerprint dimensions from program structure and trace

### `explanation_engine.py`

- build deterministic or LLM-assisted narratives from structured outputs

### `api.py`

- expose analysis endpoints

## 16.3 Frontend modules

### Core stack

- React
- TypeScript
- D3.js for custom animated visualizations
- Monaco or CodeMirror for code editing

### Components

- `CodeEditor`
- `InputConfigurator`
- `ExecutionTimeline`
- `VariableInspector`
- `StackVisualizer`
- `HeapMap`
- `RuntimeChart`
- `MemoryChart`
- `ComplexityCard`
- `DNAPanel`
- `HotspotPanel`
- `SuggestionPanel`
- `ExplanationPanel`
- `CompareWorkspace`

## 16.4 API endpoints

### `POST /analyze`

Input:

- source code
- language
- entry function
- input config

Output:

- normalized analysis document

### `POST /trace`

Input:

- source code
- execution config

Output:

- trace event stream

### `POST /simulate`

Input:

- analysis output
- input range

Output:

- projected runtime and memory series

### `POST /compare`

Input:

- source A
- source B
- shared input config

Output:

- comparative analysis document

## 17. Internal Data Contracts

## 17.1 Analysis Document

```json
{
  "session_id": "string",
  "language": "python",
  "functions": [
    {
      "id": "fn_1",
      "name": "two_sum",
      "line_start": 1,
      "line_end": 12
    }
  ],
  "nodes": [
    {
      "id": "node_12",
      "type": "loop",
      "line": 4,
      "cost_hint": "linear",
      "parent_id": "fn_1"
    }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(n)",
    "confidence": 0.89,
    "evidence_lines": [4, 6]
  },
  "hotspots": [
    {
      "line": 4,
      "score": 0.82,
      "reason": "Loop over input list"
    }
  ],
  "dna": {
    "iteration_intensity": "medium",
    "recursion_depth": "low",
    "memory_growth": "medium",
    "parallelization_potential": "medium"
  },
  "suggestions": [
    {
      "title": "Use hash-based lookup",
      "line": 6,
      "impact": "May reduce repeated membership cost"
    }
  ]
}
```

## 17.2 Trace Event

```json
{
  "step": 17,
  "event_type": "line_exec",
  "line": 8,
  "stack": [
    {
      "function": "two_sum",
      "locals": {
        "i": 3,
        "seen": [2, 5]
      }
    }
  ],
  "heap_summary": {
    "objects": 3,
    "estimated_bytes": 112
  }
}
```

## 17.3 Simulation Series

```json
{
  "n_values": [10, 100, 1000, 10000],
  "runtime_estimated_ms": [0.1, 1.3, 13.8, 145.0],
  "memory_estimated_kb": [4, 18, 170, 1600],
  "classification": "estimated"
}
```

## 18. Accuracy and Confidence Strategy

### Principles

- Never present estimates as guarantees
- Show confidence on complexity and hotspot predictions
- Use explicit tags:
  - exact trace
  - measured sample timing
  - estimated projection
  - low-confidence inference

### Confidence factors

- structural clarity
- unsupported constructs
- dynamic behavior uncertainty
- input dependence
- recursion ambiguity

## 19. Technical Constraints and Safety

### Constraints

- Sandboxed execution only
- No arbitrary file system access for user code
- No arbitrary network calls from user code
- Runtime and recursion limits
- Per-request memory limits

### Unsupported patterns for MVP

- complex metaprogramming
- heavy external library code
- reflection-heavy behavior
- concurrent multiprocessing flows
- async-heavy workflows

### UX requirement

When unsupported patterns are detected, the product should:

- explain the limitation
- continue partial structural analysis when possible
- avoid crashing or returning empty screens

## 20. Success Metrics

### Product metrics

- analysis completion rate
- mean session duration
- compare mode usage rate
- counterfactual edit rate
- explanation expand rate

### Learning metrics

- improvement in user quiz accuracy before vs after usage
- reduction in time to identify bottlenecks
- reduction in time to select better implementation between two options

### Technical metrics

- median analysis latency
- median trace generation latency
- frontend frame rate during animation
- error rate by code type

## 21. Milestones and Delivery Plan

## Phase 1: Foundation

- project scaffolding
- editor UI
- parser
- CFG extraction
- basic backend API

### Exit criteria

- Paste Python code and get structural analysis JSON

## Phase 2: Trace Visualizer

- sandbox execution
- trace event generation
- state/stack UI
- step controls

### Exit criteria

- User can play through supported snippets step-by-step

## Phase 3: Predictive Insights

- complexity inference
- hotspot attribution
- explanation panel
- basic runtime and memory simulation

### Exit criteria

- User gets complexity, hotspots, and projected growth curves

## Phase 4: Competition Differentiators

- counterfactual mode
- Complexity DNA
- compare mode
- optimization suggestions

### Exit criteria

- Product demo clearly shows unique value beyond a standard visualizer

## Phase 5: Polish

- visual refinement
- smooth transitions
- better copywriting
- example gallery
- judge-facing demo script

## 22. Testing Strategy

### Unit tests

- AST extraction accuracy
- CFG generation
- complexity rule detection
- hotspot scoring logic
- DNA feature derivation

### Integration tests

- end-to-end analysis for supported snippets
- trace and editor synchronization
- compare mode consistency
- counterfactual diff recomputation

### Benchmark dataset

Include canonical examples:

- linear search
- binary search
- bubble sort
- merge sort
- quicksort
- Fibonacci recursion
- memoized Fibonacci
- BFS
- DFS
- two-sum naive vs hash map

## 23. Demo Narrative for Competitions

### Demo sequence

1. Paste a simple algorithm
2. Show execution trace and variable animation
3. Show predicted complexity and hotspot lines
4. Move input slider to show growth explosion
5. Change one line in counterfactual mode
6. Reveal before/after complexity delta
7. Compare two implementations side by side
8. End on Complexity DNA and teaching explanation

### Desired audience reaction

- "This is not just a visualizer."
- "It predicts scale, explains why, and teaches optimization."

## 24. Risks and Mitigations

### Risk: complexity inference is wrong on tricky code

- Mitigation: show confidence, evidence lines, and ambiguity warnings

### Risk: sandboxed tracing fails on many snippets

- Mitigation: separate static analysis from dynamic trace so partial value remains

### Risk: UI feels overcrowded

- Mitigation: progressive disclosure, tabs, and sensible defaults

### Risk: runtime projections appear misleading

- Mitigation: clearly mark measured vs estimated vs extrapolated

### Risk: AI explanations drift from actual analysis

- Mitigation: generate explanations from structured evidence, not raw code alone

## 25. Future Extensions

- JavaScript, Java, and C++ support
- classroom quiz mode
- shared links for demos
- VS Code extension
- algorithm challenge mode
- "predict complexity before reveal" learning mode
- automated rewrite generation with approval workflow

## 26. Implementation Guidance for Codex

Codex should treat this PRD as a staged execution plan.

### Initial repository recommendation

- `frontend/`
- `backend/`
- `shared/`
- `docs/`

### Recommended backend stack

- Python
- FastAPI
- `ast`
- optional `networkx` for graph modeling
- optional Pydantic for API contracts

### Recommended frontend stack

- React
- TypeScript
- Vite
- D3.js
- CodeMirror or Monaco
- lightweight charting only where D3 is unnecessary

### First build order

1. Stand up backend analysis API
2. Build parser and normalized analysis schema
3. Build editor and analysis results panel
4. Add trace engine and timeline UI
5. Add complexity and simulation
6. Add bottlenecks and explanations
7. Add counterfactual and compare mode
8. Add DNA profiler and polish

## 27. One-Sentence Product Pitch

CodeX-Ray is an algorithm intelligence platform that lets you see, predict, compare, and reshape code behavior before performance problems become invisible bugs.

## 28. Judge-Facing Short Pitch

Most tools either show what code does or measure what already happened. CodeX-Ray does both, then goes further by predicting scalability, identifying bottlenecks, explaining tradeoffs, and showing how tiny code changes reshape algorithm behavior.
