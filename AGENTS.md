# AGENTS.md

Same rules as `CLAUDE.md` (read it). Tool-agnostic notes:

- Roles are defined in `.claude/agents/*.md`; recipes in `.claude/skills/*/SKILL.md`. Any agent can read them as plain markdown.
- Workflows: `docs/workflows/W1`–`W5`. Each lists inputs, steps and done criteria.
- Verify with commands, not claims: paste the `npx playwright test` summary line and `npm run check` result.
