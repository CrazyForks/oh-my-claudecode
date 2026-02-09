---
description: DEPRECATED - Use /team instead. Routes to team mode.
aliases: [up, ultraauto, parallelauto]
---

# Ultrapilot Command (DEPRECATED)

> **DEPRECATED:** `/ultrapilot` has been consolidated into `/team`. This command now routes to team mode.
> For parallel multi-agent work, use `/oh-my-claudecode:team` with `run_in_background` for parallel spawning.

[ULTRAPILOT MODE DEPRECATED - ROUTING TO TEAM]

## User's Request

{{ARGUMENTS}}

## Execution

Invoke the team skill to execute this request:

```
Skill: oh-my-claudecode:team
Arguments: {{ARGUMENTS}}
```

The team skill provides the same parallel execution capabilities using Claude Code's native TeamCreate, TaskCreate, and SendMessage tools.
