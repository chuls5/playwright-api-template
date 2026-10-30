# Workflows

| Id                           | When                                | Owner agent                 | Output                                        |
| ---------------------------- | ----------------------------------- | --------------------------- | --------------------------------------------- |
| [W1](W1-discovery.md)        | New target, or its contract changed | cartographer                | `map/catalog.json`, `graph.md`, `coverage.md` |
| [W2](W2-endpoint-to-spec.md) | Daily loop: one op × one level      | planner → writer → reviewer | spec file + PR                                |
| [W3](W3-impact-run.md)       | A developer changed an API          | triager                     | grep expression + run result                  |
| [W4](W4-chain-journey.md)    | L3/L4 for a path in the graph       | planner → writer            | chain/journey spec                            |
| [W5](W5-calibration.md)      | Tuning skills on public APIs        | you                         | skill/cookbook edits                          |

[definition-of-done.md](definition-of-done.md) applies to every PR.
