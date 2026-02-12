---
name: swarm
description: "N coordinated agents on shared task list (compatibility facade over team)"
---

# Swarm (Team Compatibility Alias)

Swarm is a compatibility alias for the **Team** skill. It uses Claude Code's native team infrastructure (TeamCreate, TaskCreate, SendMessage) instead of the legacy SQLite-based swarm.

## Usage

Treat this exactly like `/oh-my-claudecode:team`. All arguments are passed through to Team mode.

```
/oh-my-claudecode:swarm N:agent-type "task description"
/oh-my-claudecode:swarm "task description"
```

## Execution

Activate Team mode with the user's arguments. Follow the Team skill's staged pipeline:

`team-plan -> team-prd -> team-exec -> team-verify -> team-fix (loop)`

Use `state_write(mode="team", ...)` for state persistence. Spawn teammates via `Task(team_name=..., name=...)`. See the Team skill for full workflow details.
