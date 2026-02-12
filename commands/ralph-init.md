---
name: ralph-init
description: "Initialize a PRD (Product Requirements Document) for structured ralph-loop execution"
---

# Ralph Init

Initialize a Product Requirements Document (PRD) before starting a ralph loop. This ensures the task has clear requirements, acceptance criteria, and scope before entering the iterative execution cycle.

## Usage

```
/oh-my-claudecode:ralph-init <task description or feature idea>
```

## Workflow

1. **Analyze** the user's task description to understand scope and intent
2. **Generate a PRD** at `.omc/plans/ralph-prd.md` containing:
   - Problem statement and goals
   - Acceptance criteria (testable, specific)
   - Scope boundaries (what's in/out)
   - Technical approach overview
   - Risk factors and mitigations
3. **Present** the PRD to the user for review and approval
4. **Once approved**, the user can start the ralph loop with `/oh-my-claudecode:ralph`

## PRD Template

```markdown
# PRD: <Feature Name>

## Problem Statement
<What problem does this solve?>

## Goals
- <Goal 1>
- <Goal 2>

## Acceptance Criteria
- [ ] <Criterion 1>
- [ ] <Criterion 2>

## Scope
### In Scope
- <Item>

### Out of Scope
- <Item>

## Technical Approach
<High-level approach>

## Risks
- <Risk and mitigation>
```

Use the `analyst` agent (opus) for requirements extraction and the `planner` agent (opus) for approach design.
