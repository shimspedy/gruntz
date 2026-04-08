---
name: gruntz-project-memory
description: "Maintain shared project memory for Gruntz. Use when working on any non-trivial product, UX, architecture, monetization, mission-flow, or training feature so the agent first reads the project memory and then updates it with durable decisions, pitfalls, and current direction before finishing."
---

# Gruntz Project Memory

## When to Use
- Any non-trivial code change in this repo
- Product or UX decisions that change how Gruntz should feel
- Monetization, onboarding, mission flow, workout logging, or program design changes
- Debugging where the root cause or fix should be remembered
- Release, App Store, RevenueCat, or platform configuration changes

## Required Workflow
1. Read `references/project-memory.md` before making meaningful changes.
2. Treat that file as the current durable memory for this repo.
3. After finishing meaningful work, update `references/project-memory.md`.
4. Keep the memory concise, current, and factual. Replace stale guidance instead of only appending.

## What Belongs In Project Memory
- Current product direction and what Gruntz is optimizing for
- Stable architecture choices and why they exist
- Known pitfalls, gotchas, and recurring bugs
- Important workflow rules for future agents
- Store/release/monetization configuration that future agents will need again
- UX rules that should stay consistent across future work

## What Must Not Go In Project Memory
- Secrets, API keys, or tokens
- Temporary logs, stack traces, or one-off command output
- Personal opinions without action value
- Long changelogs or commit-by-commit history

## Update Rules
- Prefer short sections and bullets.
- Write for future agents, not humans reading a postmortem.
- If a previous note is outdated, edit or remove it.
- If a bug was fixed and the prevention rule matters, record the prevention rule.
- If the change is trivial and teaches nothing reusable, do not update memory.

## Minimum Memory Update Checklist
- Does the file still reflect the current product goal?
- Are any old notes now wrong?
- Did this task reveal a rule, dependency, or edge case worth preserving?
- Did any workflow or monetization assumption change?

## Gruntz-Specific Guidance
- Gruntz is a mission-driven tactical training app, not a generic wellness dashboard.
- Bias toward features that help users start, complete, and return to daily missions.
- Prefer simpler game-like progression over noisy health or novelty features.
- For workout UX, completion should reflect real training behavior, not shortcuts.

