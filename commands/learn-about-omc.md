---
name: learn-about-omc
description: "Learn about your OMC usage patterns and get personalized recommendations"
---

# Learn About OMC

Analyze your oh-my-claudecode usage patterns and provide personalized recommendations for getting more value from the plugin.

## Usage

```
/oh-my-claudecode:learn-about-omc
```

## Workflow

1. **Scan** OMC state and configuration:
   - Read `.omc/project-memory.json` for project context
   - Read `.omc/notepad.md` for session notes
   - Check `.omc/state/` for mode usage history
   - Check `.omc-config.json` for current configuration
2. **Analyze** usage patterns:
   - Which modes are used most frequently?
   - Which agents are spawned most often?
   - Are there underutilized features?
   - What configuration optimizations are available?
3. **Recommend** improvements:
   - Suggest modes/skills the user hasn't tried
   - Recommend configuration tweaks for their workflow
   - Highlight best practices based on their project type
   - Suggest keyboard shortcuts or aliases for common operations
4. **Present** findings in a concise, actionable format

## Output

A personalized report with:
- Current usage summary
- Top 3 recommendations for productivity gains
- Configuration suggestions
- Links to relevant skill documentation
