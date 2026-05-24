# Quality Gates

## Canonical Local Checks

Run these before claiming completion:

```powershell
python evals/smoke_eval.py
python -m unittest discover -s tests -p "test_*.py"
python -m unittest discover -s backend/tests -p "test_*.py"
npm --prefix frontend run lint
```

The app is demo-first. A valid change should preserve the single-room customer-to-agent-to-customer WebSocket loop and keep mock fallback working without any LLM API key.

## Evidence Rules

- Include exact commands run and whether they passed.
- Include relevant logs, screenshots, traces, or changed files.
- Mark unrun checks and explain the risk.

## Eval Strategy

- Keep at least one fast smoke eval.
- Add task-specific evals for agent workflows, model behavior, research pipelines, or user-facing flows.
