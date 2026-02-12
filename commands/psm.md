---
name: psm
description: "Project Session Manager - isolated dev environments with git worktrees and tmux"
---

# PSM (Project Session Manager Alias)

PSM is a shorthand alias for the **project-session-manager** skill.

Manage isolated development environments using git worktrees and tmux sessions. Each session gets its own worktree branch, tmux window, and isolated working directory.

## Usage

```
/oh-my-claudecode:psm create <session-name>
/oh-my-claudecode:psm list
/oh-my-claudecode:psm switch <session-name>
/oh-my-claudecode:psm delete <session-name>
```

## Execution

Follow the project-session-manager skill workflow. Create worktrees via git, manage tmux sessions, and track session state in `.omc/sessions/`.
