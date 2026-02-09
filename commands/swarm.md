---
description: DEPRECATED - Use /team instead. Routes to team mode.
aliases: [swarm-agents]
---

# Swarm Command (DEPRECATED)

> **DEPRECATED:** `/swarm` has been consolidated into `/team`. This command now routes to team mode.
> For new multi-agent work, use `/oh-my-claudecode:team` which uses native Claude Code coordination.

[SWARM MODE DEPRECATED - ROUTING TO TEAM]

## User's Request

{{ARGUMENTS}}

## Execution

Invoke the team skill to execute this request:

```
Skill: oh-my-claudecode:team
Arguments: {{ARGUMENTS}}
```

The team skill provides the same functionality using Claude Code's native TeamCreate, TaskCreate, and SendMessage tools.
