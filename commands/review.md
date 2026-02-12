---
name: review
description: "Plan review - Critic evaluation of an existing plan or approach"
---

# Review (Plan Review Mode)

Review is an alias for `/oh-my-claudecode:plan --review`. It invokes a Critic agent to evaluate an existing plan, implementation approach, or architectural decision.

## Usage

```
/oh-my-claudecode:review <plan file path or description of approach to review>
```

## Workflow

1. **Read** the target plan or approach (from file path or user description)
2. **Spawn Critic** (opus) to evaluate:
   - Completeness: Are all requirements addressed?
   - Feasibility: Can this be implemented as described?
   - Risks: What could go wrong?
   - Gaps: What's missing?
   - Alternatives: Are there better approaches?
3. **Score** the plan on a 1-10 confidence scale
4. **Present** findings with specific, actionable feedback
5. If the plan scores below 7/10, suggest concrete improvements

## Output Format

```
## Plan Review

**Confidence Score:** X/10

### Strengths
- ...

### Concerns
- ...

### Recommendations
- ...
```
