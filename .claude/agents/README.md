# agents

| Agent        | Does                                                  | Never                        |
| ------------ | ----------------------------------------------------- | ---------------------------- |
| cartographer | W1: contract → catalog, graph, coverage               | writes tests                 |
| planner      | case table for one op × level                         | writes code                  |
| writer       | plan → spec, runs until green (≤5 tries)              | weakens an assertion to pass |
| triager      | classifies failures, drafts bug                       | edits assertions             |
| reviewer     | reviews a branch against standards + DoD              | approves its own changes     |
| orchestrator | optional: picks next backlog items, one worktree each | merges                       |
