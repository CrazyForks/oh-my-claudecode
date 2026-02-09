---
name: ultrapilot
description: DEPRECATED - Use /oh-my-claudecode:team instead
---

# Ultrapilot Skill (DEPRECATED)

**DEPRECATED**: Ultrapilot has been replaced by `/oh-my-claudecode:team`.

This skill now routes to the team skill for backward compatibility.

## Usage

Instead of:
```
/oh-my-claudecode:ultrapilot <task>
```

Use:
```
/oh-my-claudecode:team N:executor "<task>"
```

Or simply use magic keywords:
- "team 3 agents fix errors"
- "parallel build this feature"

## Routing

This skill is a wrapper that invokes:
```
Skill: oh-my-claudecode:team
```

All functionality previously provided by ultrapilot is now available through the team skill with superior coordination via Claude Code's native team tools.
