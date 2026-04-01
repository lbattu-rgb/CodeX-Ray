# Architecture Notes

## Backend

- `app/main.py`: FastAPI entrypoint and routes
- `app/services.py`: orchestration layer that combines structural analysis, complexity inference, trace generation, simulation, and explanations
- `app/engines/parser.py`: AST parsing, function extraction, call inventory, recursion candidate detection, CFG approximation, dependency map
- `app/engines/trace_engine.py`: sandboxed execution tracing using `sys.settrace`
- `app/engines/complexity.py`: rule-based complexity inference
- `app/engines/hotspot.py`: line-level bottleneck scoring
- `app/engines/optimization.py`: anti-pattern suggestions
- `app/engines/dna.py`: behavioral fingerprint generation
- `app/engines/simulation.py`: projected runtime and memory curves
- `app/engines/explanation.py`: deterministic explanation synthesis

## Frontend

- `src/App.tsx`: page-level state and workflow orchestration
- `src/components/CodePanel.tsx`: editable source workspace
- `src/components/TraceTimeline.tsx`: execution timeline viewer
- `src/components/SimulationChart.tsx`: projected runtime and memory charts
- `src/components/DnaPanel.tsx`: behavioral fingerprint display
- `src/components/InsightPanels.tsx`: hotspots, suggestions, and explanation panels
- `src/lib/api.ts`: backend communication
- `src/lib/types.ts`: API-aligned TypeScript contracts

## Design intent

The frontend is designed as an "algorithm observatory" rather than a standard dashboard:

- left/top: code authoring
- center: execution and scale visualization
- right: reasoning and optimization

## Future extension points

- replace the text area with Monaco or CodeMirror
- add a dedicated CFG/DFG canvas
- persist sessions locally
- upgrade compare mode into synchronized dual insight columns
- introduce measured timing calibration to complement symbolic simulation
