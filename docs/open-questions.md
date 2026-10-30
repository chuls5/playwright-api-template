# Questions to ask before testing a new banking / money-movement API platform

A generic checklist. Copy it into your own notes for the platform you're joining and answer it there; don't commit platform-specific answers to a public repo. Get the starred (★) questions answered first. Section 11 is the exact inventory the coverage model needs. Everything else can wait for the next few days.

## 1. Access, tooling, and where the code can live

1. ★ Where can the test code live (company GitHub/GitLab org, team, repo name)? May any of it live outside the company? Who creates the repo and who approves it?
2. ★ Are AI coding agents approved? Which tools, models and plans, and is there a data policy on what can be pasted (specs, payloads, logs)?
3. Is npm installed through a proxy registry (Artifactory or Nexus)? Are `@playwright/test`, `allure-playwright`, `zod`, `dotenv`, `eslint` and `prettier` approved packages?
4. Does the corporate network re-sign TLS? If so, where is the root CA bundle (needed for `NODE_EXTRA_CA_CERTS`)? Is there an HTTP proxy or VPN needed to reach QA from a laptop and from CI?
5. Which Node version is allowed or standard on laptops and on CI agents?

## 2. Scope (what this project owns)

6. ★ What is the full list of API operations owned by the team? Which are in scope for this project, and in what priority order?
7. ★ Who are the stakeholders, and what does "done" mean to them: a coverage %, a gate on dev PRs, a nightly regression, sign-off evidence?
8. Which functions change most often or break most? Those set the order we test in after the simplest first.
9. Are there existing manual or automated test cases we should map to, so we don't duplicate them and can show traceability (issue or test-management IDs)?
10. Is the goal to replace an existing API suite eventually, or to run alongside it?

## 3. Contracts and discovery

11. ★ Where do the OpenAPI schemas (or other contracts) for our operations live (repo, branch, path)? Can I clone that repo, and are the schemas kept current with the service code?
12. How are function versions retired (`.v1` to `.v2`, variants of the same operation)? Do both stay live, and do we test both?
13. Is there a list of the downstream systems each operation calls (core banking processor, fraud/risk engine, KYC vendor, payment rails, partners)? That's the backbone of the dependency graph.
14. Who do we ask when a schema and its behavior disagree (developer, API owner, platform team)?

## 4. Auth and identity

15. ★ How do we get our own service integration IDs and secrets for each domain (e.g. core, onboarding, limits, payments, servicing)? Who issues them, and can they be scoped to test-only?
16. ★ How do we get dedicated test users for each role (e.g. PRIMARY, JOINT_OWNER, POWER_OF_ATTORNEY, VIEW_ONLY, ADMIN), isolated from other teams?
17. What is the service token TTL and timestamp skew tolerance (identity team)? Are there rate limits on the token or login endpoints?
18. Is there a fixed test OTP, and is it the same in every lower environment? Will it ever be turned off?
19. Where do secrets go in CI (credential IDs or a secrets vault)? Is there a rule against `.env` files on laptops?

## 5. Environments and test data

20. ★ Which environments can we test (dev, QA, UAT, sandbox)? Which one is the gate, how stable is it, and is it shared with other teams?
21. ★ Do transfers and wires in test environments ever leave the company (real ACH or wire networks, processor test vs live)? What prevents a test from moving real money?
22. Is there a quota or purge policy for onboarding applications and synthetic customers? How long does test data live?
23. Is there an approved synthetic data standard (SSN ranges, names, addresses, test card BINs)? Is there a test-data management tool, who owns it, and is there an API for it?
24. Can we run cleanup (`deleteApp`, account close), or is cleanup owned by a platform job?
25. Can we keep a pool of long-lived, pre-onboarded customers (pre-seeded identities kept in config)? Who maintains it?

## 6. Banking rules (expected results)

26. ★ What is the intended permissions matrix for POWER_OF_ATTORNEY and JOINT_OWNER? Are existing tests for the less common roles actually running? Who is the product owner who can confirm it?
27. What are the daily, weekly and monthly limits per product and channel, and per role? Is there a limits source of truth beyond a limits-read operation?
28. What are the cut-off times, business-day and holiday rules, and settlement timing for each transfer type? When is a transfer "done" (accepted, pending, posted)?
29. Which calls trigger fraud or risk decisions? Can a test get stuck in review, and is there a way to force an approve or decline outcome in QA?
30. Which create calls must be idempotent, and what does the server do on a replayed key with a different body?

## 7. Non-HTTP and async

31. Do any in-scope journeys need NACHA/ACH/wire file upload, SFTP or message queues? Is there a test hook to inject or read those, or are they out of scope for this team?
32. Are there async results we have to poll (status endpoints, queues, webhooks)? What latency is normal in QA?

## 8. CI, reporting, and the dev quality gate

33. ★ Can we have a CI job, and who sets it up? Do CI agents have Node? Which Allure version is available, and can reports be kept per build?
34. ★ How do we hook into developer PRs ("tell devs before QA")? Can our smoke suite run as a check on their repo's PRs, and who has to approve that?
35. Where do stakeholders look today (CI Allure reports, a test-management tool, wiki pages, issue-tracker dashboards)? Should results also go to a test-management tool?
36. What is the QA environment's request latency and rate limit? That decides workers and shards to hit the 30–60 minute nightly target.

## 9. Process and governance

37. Branching and review rules on the target GitHub org: required reviewers, CODEOWNERS, signed commits, branch protection?
38. Are there audit or compliance rules for test artifacts (SOX, PCI, PII in logs or Allure attachments, retention)?
39. Who besides you will touch this repo: other QA, devs, offshore? That decides how strict the docs and review agent need to be.

## 10. More questions

40. ★ How many failed logins or wrong-OTP attempts lock a test user? Negative auth tests must never lock a shared or persistent account.
41. ★ Are negative and security tests (authz probing, malformed payloads, replayed tokens) allowed in QA, or do they trip SOC or fraud alerts? Who needs to know before we run them?
42. ★ How do we learn what a developer changed (PR diffs, deploy notices, release notes per function)? Test-impact selection depends on it.
43. Can we search server logs by `x-correlation-id` (log search / APM tool)? That cuts triage time a lot.
44. Is there a standard error response format and error-code catalog across the platform's operations? Tests assert on it.
45. What are the valid values for the `x-user-role` and `x-user-id` headers, and what happens when they're missing or wrong?
46. Are feature flags or toggles in QA that change function behavior? How do we read their current state?
47. How often is QA refreshed or redeployed, and is there a release calendar or code-freeze schedule?
48. Is service virtualization (WireMock or similar) used for downstream systems in QA, and can we control it for fault cases?
49. Which issue-tracker project and labels do API defects go into, and what severity rules apply?
50. Is load or performance testing in scope for this team, or owned elsewhere? (Assumed out of scope; functional latency checks only.)
51. Is consumer-driven contract testing (Pact or similar) used anywhere, or only schema checks?
52. Are open-source tools such as Allure 3 approved under the company's open-source policy, or is an older version mandated?
53. What metrics do stakeholders want each week (tests added, coverage per function, pass rate, defects found, run time)?
54. Who reviews and approves test PRs: QA lead, devs, or both?

## 11. Domain inventory (exact inputs for the combination count)

The coverage model counts cases as roles × products × actions, narrowed by rules. Each list below needs an exact, confirmed answer with a source (wiki page, product owner, or code). Lists found only in test code are leads, not answers.

### 11.1 Roles

55. ★ What is the complete, authoritative list of roles (e.g. primary owner, joint owner, power of attorney, view-only, admin, beneficial owner, applicant)? If code has more than one role list and they don't match, which are real roles, which are relationship types, and which exist only in test code?

56. ★ Do the roles differ between consumer and business products? For example, is ADMIN business-only and JOINT_OWNER consumer-only?
57. Can one person hold different roles on different accounts? Can they hold more than one role on the same account?
58. How is each role granted (onboarding, invite, branch or ops action)? Can it be revoked, and does revocation take effect immediately?
59. Are there internal or ops roles (customer service, back office) that call the same functions? Are they in scope?

### 11.2 Products and account types

60. ★ What is the exact list of account products we cover? Typical: consumer checking, business checking, savings / high-yield savings, CD, money market, business savings, sub-accounts.
61. ★ For each product: is it consumer or business? Who can open it? How many can one customer hold? What's the minimum opening deposit? How is it funded at opening? Can it be closed through the API?
62. What business entity types are supported (sole proprietor, LLC, corporation, partnership)? Do they change the onboarding steps or required roles (beneficial owners)?
63. What are the account lifecycle states (pending, open, restricted, frozen, dormant, closed), and which actions does each state block?
64. What onboarding and KYC outcomes are possible (approved, declined, manual review, needs documents)? Can QA force each one?
65. Is USD the only currency? Are there state or jurisdiction restrictions on opening any product?

### 11.3 Actions (what a role can do)

66. ★ What is the complete list of money-movement types? Typical: internal transfer between own accounts, external transfer (linked external bank, account verification), scheduled and recurring transfer, domestic wire, wire return, P2P, ACH, and partner/aggregator transactions. Are international wires, bill pay or checks in scope?
67. ★ For each transfer type: which source and destination products are allowed (for example, can a CD send a wire, or can savings send P2P)?
68. What is the complete list of servicing actions? Typical: add, edit and delete payees; add external bank; view and download statements and tax documents; edit profile; invite and remove users; account holds/restrictions; notes; close account.

### 11.4 Permissions matrix

69. ★ Fill in or point to the official matrix: rows are role × product, columns are actions (view, open, each transfer type, each servicing action, close). Each cell is allowed, denied, or allowed with step-up. Who owns it, and is it written down anywhere other than test code?
70. Which actions need MFA step-up, and does that depend on the amount or the role?
71. What exact error code and status comes back on a permissions denial (403 vs 401 vs a business error)? Is it the same for every function?

### 11.5 Limits and money rules

72. ★ What are the limits for each transfer type × product × role: per transaction, daily, weekly and monthly? Do they differ for business vs consumer, or for new vs established customers?
73. Are limits shared across transfer types (for example, one daily cap for P2P and external transfers together) or kept separate?
74. What are the minimum amounts, maximum amounts and decimal rules? Are fees charged, and are holds placed on deposits?
75. What are the cut-off time, business-day rule and settlement time for each transfer type? Which transfer types can be cancelled, reversed or returned, and until when?

### 11.6 Channels and callers

76. Which channels call these functions (web, mobile, partner API, ops tools)? Does behavior or limits differ by channel or by the `x-user-role` header?

### Fill-in tables (copy to your notes or wiki, or answer inline)

| Role | Consumer or business | Can open | Can move money | Needs step-up for | Source |
| ---- | -------------------- | -------- | -------------- | ----------------- | ------ |
|      |                      |          |                |                   |        |

| Product | Consumer or business | Openable by roles | Max per customer | Min deposit | Closable via API | Source |
| ------- | -------------------- | ----------------- | ---------------- | ----------- | ---------------- | ------ |
|         |                      |                   |                  |             |                  |        |

| Transfer type | From products | To products | Roles allowed | Per txn / daily / weekly / monthly limit | Cut-off | Reversible | Source |
| ------------- | ------------- | ----------- | ------------- | ---------------------------------------- | ------- | ---------- | ------ |
|               |               |             |               |                                          |         |            |        |

| Role × product | View | Open | Transfer types | Servicing actions | Close | Source |
| -------------- | ---- | ---- | -------------- | ----------------- | ----- | ------ |
|                |      |      |                |                   |       |        |

## Blind spots to keep in mind

- **Real money and real networks:** confirm nothing in QA reaches live payment rails before writing any money-movement test.
- **Shared environments:** another team's deploy or data reset will look like our failure. We need an env-health signal per run (the template has one per target via `<target>-setup`).
- **Downstream outages:** A core processor, fraud engine or vendor being down in test will fail our tests. Allure should file those as Environment, so we need their error signatures.
- **Time:** business days, cut-offs, holidays and month-end change results; local vs bank-home vs UTC time zones matter.
- **Version drift:** the schema says one thing, the deployed version another. We need a way to read the deployed version per function.
- **Data leaks in reports:** Allure attachments include request and response bodies; masking must cover every PII field, not just the ones we know today.
- **Ownership:** who fixes a test when a dev intentionally changes behavior? Agree on that before the suite gates PRs.
