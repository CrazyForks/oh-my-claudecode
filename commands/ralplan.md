---
name: ralplan
description: "Consensus planning - iterative Planner/Architect/Critic loop until agreement"
---

# Ralplan (Consensus Planning)

Ralplan is an alias for `/oh-my-claudecode:plan --consensus`. It runs an iterative planning loop where Planner, Architect, and Critic agents collaborate until they reach consensus on the implementation plan.

## Usage

```
/oh-my-claudecode:ralplan <task or feature description>
```

## Workflow

1. **Planner** (opus) creates an initial implementation plan
2. **Architect** (opus) reviews for structural soundness, boundary correctness, and trade-offs
3. **Critic** (opus) challenges assumptions, identifies gaps, and scores confidence
4. If consensus is not reached, iterate: Planner revises based on feedback, Architect and Critic re-evaluate
5. Loop until all three agents agree the plan is sound
6. Present the final consensus plan to the user for approval

## Consensus Criteria

- Architect approves structural design
- Critic confidence score >= 8/10
- No unresolved blockers or open questions
- All agents agree on scope and approach

Write the plan to `.omc/plans/` and use `state_write(mode="ralplan", ...)` for iteration tracking.
