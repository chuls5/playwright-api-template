# Legacy Jenkins

Reference only. GitHub Actions is the primary CI (`docs/ci.md`). The Jenkinsfile maps to the workflows as:
SUITE=smoke → `pr.yml`, SUITE=regression → `nightly.yml`, `withCredentials` → environment secrets, agent label → `CI_RUNS_ON`.
To use it, copy it to the repo root and point the Jenkins job at it.
