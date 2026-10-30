# Calling the API tests from a service repo

`api-tests.yml` is a `workflow_call` workflow. A service repo can run it on its PRs and make it a required check
(shift-left gate):

```yaml
# <service-repo>/.github/workflows/api-gate.yml
name: api-gate
on: pull_request
permissions:
  contents: read
jobs:
  api-tests:
    uses: <owner>/playwright-api-template/.github/workflows/api-tests.yml@main # pin a tag or SHA for stability
    with:
      tests-repository: <owner>/playwright-api-template
      tests-ref: main
      playwright-args: --grep @smoke # or --project=<target>, or an impact-select grep
      static-checks: false
      test-env: e1
      environment: qa-e1
    secrets: inherit # or pass CA_BUNDLE explicitly
```

- Make **`api-tests / merge`** (or a gate job of your own that `needs:` it) a required check on the service repo.
- On GitHub Enterprise, the tests repo must allow access from callers (Settings → Actions → General → Access) when
  it is internal or private. Secrets resolve in the caller's environment, so define them in the service repo or org.
- Results: the `allure-results` artifact on the caller's run and the counts in its job summary.
