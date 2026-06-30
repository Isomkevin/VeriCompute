# Working With Multiple Agents

This repo supports seamless handoff between **Claude Code**, **VS Code GitHub Copilot**, **Cursor**, and other agents (e.g. “Google AntiGravity”).

## One shared contract

All agents must follow:

- `AGENT_HANDOFF.md` (handoff rules + constraints)
- `.cursorrules` (project constraints and tech stack)
- `PRD.md`, `ARCHITECTURE.md`, `TASKS.md` (product + architecture + phase plan)
- `CLAUDE.md` (high-level working agreements)

## Per-agent entry points

- **Claude Code**: read `CLAUDE.md` then `AGENT_HANDOFF.md`
- **VS Code Copilot**: read `.github/copilot-instructions.md` (mirrors `AGENT_HANDOFF.md`)
- **Cursor**: uses `.cursor/rules/stellar.mdc` + `.cursor/skills/stellar-builder/`
- **Other agents**: start with `AGENT_HANDOFF.md` and `TASKS.md`

## “Done” means

Before handing off:

- `TASKS.md` reflects what is complete and what’s next
- any new env/config requirements are documented
- anything mocked is labeled as mocked (UI/README)

