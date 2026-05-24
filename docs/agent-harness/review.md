# Review Workflow

## Self-Review

- Inspect the diff.
- Check for unrelated edits, missing tests, stale docs, and config drift.
- Run canonical checks or explain why they could not run.

## Agent Review

- For substantial changes, request a review focused on bugs, regressions, missing tests, and safety.
- Address findings with narrow follow-up edits.

## Human Review

- Surface tradeoffs, residual risks, skipped checks, and decisions that require judgment.
- Do not hide uncertainty behind confident prose.

## PR Response Loop

- Read comments.
- Map each actionable comment to a change or explicit non-change rationale.
- Re-run affected checks.
