# CodeX-Ray

CodeX-Ray is an algorithm intelligence workspace for visualizing execution, predicting complexity, projecting scale, surfacing bottlenecks, and comparing implementations.

## What is included

- `backend/`: FastAPI backend with AST-based analysis, trace generation, simulation, comparison, DNA profiling, and optimization suggestions
- `frontend/`: React + TypeScript + Vite frontend scaffold for the observatory-style UI
- `docs/`: architecture notes
- `shared/`: reserved for future shared contracts

## Backend quick start

```bash
cd /Users/likhithabattu/Documents/Personal\ Projects/CodeX-Ray/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend base URL: `http://localhost:8000`

Key endpoints:

- `GET /health`
- `GET /examples`
- `POST /analyze`
- `POST /trace`
- `POST /simulate`
- `POST /compare`

## Frontend quick start

```bash
cd /Users/likhithabattu/Documents/Personal\ Projects/CodeX-Ray/frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Current status

Implemented:

- backend structural analysis
- complexity inference
- hotspot scoring
- simulation
- trace preview
- suggestions
- DNA profile
- comparison summary
- React frontend workspace with analysis, trace, simulation, counterfactual summary, and compare mode UI

Next recommended upgrades:

- integrate Monaco or CodeMirror
- enrich CFG visualization
- improve runtime calibration with measured microbenchmarks
- animate recursion trees and loop timelines
- make compare mode show fully parallel insight columns

## Verification

Validated during this build session:

- Python unit test: `PYTHONPATH=backend backend/.venv/bin/python -m unittest discover -s backend/tests -v`
- Backend import and FastAPI startup
- `GET /health` returned `{"status":"ok"}`
- `POST /analyze` returned a full analysis payload for a sample snippet
- Frontend dependency install completed
- Frontend dev server started successfully on `http://127.0.0.1:5173`
- Frontend production build completed successfully with `npm run build`
