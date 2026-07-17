# ADG Unified Hybrid Agent Workspace — Local Demo

A runnable local demo of a single **Interaction Card** workspace for a hybrid
(physical + virtual) government/enterprise service desk, with role-based
login (Agent vs Manager), approval workflows, and audit logging. All
customer data (Emirates ID, contact details, full timeline including
sensitive events) is shown in full to every role — there is no data masking.

Everything runs locally against an in-memory mock backend — there are no
external calls. All "connectors" (ServiceNow, M365, CRM, Sprinklr, Core
Applications, Kiosk, Queue, Approvals, Audit) are mocked modules with a
pluggable, swappable shape (`lib/connectors/*.ts`), so a real integration can
replace any one of them without touching the UI or API routes.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- API routes (`app/api/**`) backed by an in-memory data store (`lib/store.ts`)
  that resets to the seed data every time the dev server restarts

## Install & Run

```bash
cd adg-hybrid-agent-workspace
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build check:

```bash
npm run build
npm start
```

> Data is in-memory only. Restarting the server resets everything back to
> the seed data described below.

## Login

No passwords — pick a user on the login screen:

| Name | ID | Role |
|---|---|---|
| Mohamed Ali | AG-001 | Agent |
| Sara Al Mazrouei | AG-002 | Agent |
| Khalifa Aldhaheri | MGR-001 | Manager |

Login is a two-step "PIN" flow: pick an agent profile from the dropdown,
enter the security PIN (a fixed simulation PIN — shown right on the screen),
then **Authenticate Session**. No real credentials are checked.

The top-right user menu shows name, role, and presence.

## Where things live

```
lib/types.ts                 All shared TypeScript data models
lib/seed.ts                  Seed data (customers, interactions, timeline, core apps, approvals, audit)
lib/store.ts                 In-memory "database" + all state-mutating business logic + audit logging
lib/view.ts                  Thin pass-through shaping of Customer/TimelineEvent for API responses
lib/copilotEngine.ts          Local rule-based AI Copilot (summary / eligibility / pending / next steps)
lib/connectors/*.ts           Mocked ServiceNow / M365 / CRM / Sprinklr / CoreApp / Kiosk / Queue / Approvals / Audit
app/api/**                    Route handlers — every mutation writes an AuditLogEntry
app/(pages)                   Login, Interactions list, Interaction Card, Kiosk, Queue, Appointments, Manager Dashboard
components/interaction-card/  Interaction Card UI: header, session controls, timeline, action bar, copilot, approvals
components/manager/           Manager Dashboard tabs
```

### Data visibility

There is no masking: Agents and Managers both see full Emirates ID, UID,
phone, email, and every timeline event (including ones flagged
`sensitivity: "SENSITIVE"` in the seed data — that field is retained purely
as classification metadata, it no longer hides anything).

### Audit logging

Every mutating action (`lib/store.ts`) writes an `AuditLogEntry` with
`before`/`after` snapshots where relevant: kiosk check-ins, token
call/start/complete, interaction status changes, approval requests and
decisions (plus the resulting Interaction/CoreApplication change), reassigns,
priority overrides, and force-calls. All of this is browsable in
**Manager Dashboard → Audit Log** with filters (actor, date range, action
type, entity type, severity) and an expandable before/after JSON diff per
entry.

## Seed data snapshot

- 3 customers (Ahmed Al Falasi, Fatima Al Suwaidi, Rashid Al Nuaimi), each
  with 10–12 timeline events across all event types, including at least 2
  events per customer marked `sensitivity: "SENSITIVE"`.
- 8 interactions spanning every status (`BOOKED`, `ARRIVED`, `CALLED`,
  `IN_SERVICE`, `COMPLETED`, `NO_SHOW`, `CANCELLED`) split across both agents,
  including one virtual appointment and one resolved complaint.
- 4 core applications, including one with missing/invalid documents
  (Fatima's Address Update) and one blocked on eligibility (Rashid's Sponsor
  Transfer).
- 5 approval requests: 3 pending, 1 approved, 1 rejected, covering all 5
  approval types agents can request.
- 18 pre-seeded audit log entries covering system events and approval
  decisions (including two illustrative `SECURITY`-severity entries), so the
  Audit Log filters/diff viewer have something to show immediately on first
  load.

## Demo scripts

### Scenario A — Physical appointment → doc waiver → approve → complete

1. Log in as **Mohamed Ali** (Agent).
2. Go to **Appointments**, book a new physical appointment for a customer for
   "now" (or use the existing seed data — Fatima Al Suwaidi's walk-in
   INT-002 already has a pending Document Waiver request).
3. Go to **Kiosk**, scan Fatima's Emirates ID (`784-1990-7654321-2`) — this
   matches/creates the check-in and issues a queue token.
4. Go to **Queue**, "Call Next" her token to a counter, then open the
   Interaction Card (link from the Queue or Interactions list) and click
   **Start Service**.
5. On the Interaction Card, open **Approval Requests** and note the existing
   *Document Waiver* request (or submit a new one) — a Utility Bill waiver
   with a reason and expiry.
6. Log out, log in as **Khalifa Aldhaheri** (Manager). Go to
   **Manager Dashboard → Approvals Inbox**, approve the Document Waiver
   request with a note.
7. Go to **Manager Dashboard → Audit Log**, find the `APPROVAL_DECIDED` and
   `APPLIED_DOCUMENT_WAIVER` entries, and expand **Show before/after diff** —
   you'll see the Utility Bill requirement flip from `MISSING` to
   `RECEIVED (waived)`.
8. Log back in as Mohamed/Sara (whichever agent owns the interaction), open
   the Interaction Card, and click **Close Interaction**.

### Scenario B — Virtual appointment → eligibility exception → reject → follow-up

1. Log in as **Mohamed Ali** (Agent).
2. Open Interaction **INT-003** (Rashid Al Nuaimi, Visa Status Inquiry,
   Virtual) from the Interactions list.
3. In **Session Controls**, click **Join virtual session** (opens the mock
   join URL), then **Start Service**.
4. Note the pre-seeded *Exception Eligibility* approval request (already
   rejected in seed data) — or submit a new one via **+ Request Approval**
   citing the expired sponsor visa.
5. Log in as **Khalifa Aldhaheri** (Manager) → **Approvals Inbox** → reject
   the request with a note (e.g. "Sponsor visa must be renewed first").
6. Check **Audit Log** — the `APPROVAL_DECIDED` entry is tagged `RISK`
   severity for a rejection.
7. Back as the agent, use the bottom **Action Bar → Schedule Follow-up** to
   book a follow-up appointment, then **Close Interaction**.

### Scenario C — Walk-in → priority override → approve → serve

1. Log in as **Sara Al Mazrouei** (Agent).
2. Go to **Kiosk**, scan an Emirates ID with no upcoming appointment (e.g.
   Ahmed Al Falasi, `784-1985-1234567-1`) — this creates a new **WALKIN**
   interaction with a fresh queue token (no matching appointment found).
3. Go to **Queue**, **Call Next** the new token to a counter, then open the
   interaction and click **Start Service**.
4. On the Interaction Card, submit a **Priority Override** request (e.g.
   MEDIUM → HIGH) with a justification.
5. Log in as **Khalifa Aldhaheri** (Manager) → **Approvals Inbox** → approve
   it. The interaction's priority updates immediately (see it reflected on
   the Interactions list / Interaction Card header).
6. **Audit Log** shows `APPROVAL_DECIDED` + `APPLIED_PRIORITY_OVERRIDE` with
   the before/after priority diff.
7. Back as the agent, **Close Interaction**.

### Manager script

1. Log in as **Khalifa Aldhaheri** (Manager).
2. **Manager Dashboard → Live Queue** — see everyone currently
   waiting/called/in service across both agents; try **Force-call** on a
   waiting customer to a specific counter/agent (this is a `RISK`-severity
   audited action).
3. **SLA Overview** — SLA remaining by status and by agent, with breach
   counts highlighted.
4. **Agent Workload** — assigned/active/in-service/completed counts per
   agent.
5. **Reassign** — reassign an open interaction to the other agent, and try
   overriding its priority directly (a manager can do this without going
   through the approval workflow that agents use).
6. **Approvals Inbox** — approve/reject the remaining pending requests with
   notes.
7. **Audit Log** — filter by actor, action type, entity type, severity, and
   date range; expand **Show before/after diff** on a few entries.
8. **Reports** — counts by channel (physical/virtual), by type
   (appointment/walk-in), and by status.

## Notes on scope

This is a demo, not a production system:

- The in-memory store resets on every server restart (by design, for a
  repeatable demo).
- Authentication is a user picker with no passwords — the "logged in user"
  is sent as an `x-user-id` header on every API call, and role-based
  authorization is enforced server-side in each route handler.
- SLA countdown timers tick client-side for visual effect but the
  underlying `slaSecondsRemaining` value is only persisted at seed time.
