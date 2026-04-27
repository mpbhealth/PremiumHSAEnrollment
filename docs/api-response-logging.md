# API response logging — co-locate the upstream JSON response with the request payload

Use this when a project already audit-logs the **outbound** enrollment payload to a Supabase table (e.g. `<LOG_TABLE>`) and you also want the **inbound** response body from the external enrollment API stored on the same row, so request and response are trivially correlated by primary key.

This document describes the exact pattern used in this repo (Premium HSA Enrollment) so you can copy it into other repos that have an analogous log table and Edge Function.

**Reference files in this repo**

| Concern | File |
|---------|------|
| Migration that adds the `response` column to the existing log table | `supabase/migrations/20260420120000_add_response_to_premiumhsa_log.sql` |
| Edge Function that calls the upstream API and writes the log row | `supabase/functions/enrollment-api-premiumhsa/index.ts` (lines 745–758) |
| Pre-existing log table create migration (added earlier) | `supabase/migrations/20260216120000_create_securehsa_log_table.sql` |

> **Sister projects:** the log table name, the Edge Function folder name, and the column-comment wording will differ per project. The shape of the change is identical: one additive `ALTER TABLE … ADD COLUMN IF NOT EXISTS response text`, plus a one-key edit to the `INSERT` payload inside the Edge Function.

---

## TL;DR — the four guarantees

1. **Schema is additive and idempotent.** `ADD COLUMN IF NOT EXISTS response text` — re-running the migration is a no-op, and the column is **nullable** so historical rows stay valid.
2. **One row per submission, not two.** The same `INSERT` that captures the outbound `log` also captures the inbound `response` — there is **never** a separate "response row" written later. Pairing happens by primary key, not by timestamp guessing.
3. **Logging cannot break enrollment.** The `INSERT` is wrapped in `try / catch` and a non-zero `logError` is logged to `console.error` but never thrown. The Edge Function still returns the upstream response to the client.
4. **Stored as `text`, not `jsonb`.** The column is plain `text` so the row preserves the exact bytes the upstream returned, including any non-conforming JSON the upstream might emit. Cast at read-time (`response::jsonb`) when you need to query inside it.

---

## 1. The migration (one-time, additive)

Create a new migration file. Use a current UTC timestamp as the prefix and name it after the **target log table** in your project.

`supabase/migrations/<YYYYMMDDHHMMSS>_add_response_to_<log_table>.sql`:

```sql
/*
  # <LOG_TABLE> — store external API JSON response

  `response` holds the JSON body returned from the enrollment API
  (e.g. SUCCESS, MESSAGES, MEMBER.ID).
*/

ALTER TABLE public."<LOG_TABLE>"
  ADD COLUMN IF NOT EXISTS response text;

COMMENT ON COLUMN public."<LOG_TABLE>".response IS
  'JSON string of external API response (SUCCESS, MESSAGES, etc.)';
```

Notes:

- Quote `"<LOG_TABLE>"` only if your table name uses mixed case (e.g. `"PremiumHsa_log"`). If your table is all-lowercase, drop the quotes.
- The column is **nullable** on purpose — every row that existed before this migration ran will simply have `response = NULL`. Do **not** add a `NOT NULL` constraint or a default; backfilling is unnecessary because the row's `log` column already has the request payload, and there is no response to retroactively reconstruct.
- Keep RLS exactly as the table already has it. The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` so it bypasses RLS for writes; `anon` / `authenticated` typically have no policies (no read access).

---

## 2. The Edge Function change (single `INSERT` payload edit)

Find the place in your Edge Function where the **outbound** payload is sent to the upstream API. Right after you parse the JSON response, write **one** row that captures both sides.

```ts
const response = await fetch(externalApiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${authString}`,
  },
  body: formData.toString(),
});

const responseData = await response.json();

try {
  const { error: logError } = await supabase.from("<LOG_TABLE>").insert({
    date: new Date().toISOString(),
    log: memberJsonString,                 // the outbound request payload
    response: JSON.stringify(responseData) // the inbound response body
  });
  if (logError) {
    console.error("<LOG_TABLE> insert failed:", logError.message);
  }
} catch (logErr) {
  console.error("<LOG_TABLE> insert exception:", logErr);
}

return new Response(
  JSON.stringify({
    success: response.ok,
    status: response.status,
    data: responseData,
  }),
  {
    status: response.ok ? 200 : response.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
);
```

Critical structural rules:

1. The `INSERT` is **between** `await response.json()` and `return new Response(...)`. If you move it before the `await`, you have no response to log; if you move it after the `return`, Deno may not run it (Edge Functions can be torn down once the response is sent — use `EdgeRuntime.waitUntil(...)` if you want async-after-return, but inline-before-return is simpler and is what this pattern uses).
2. Use `JSON.stringify(responseData)` — the column is `text`. If you pass the raw object Supabase will serialise via `JSON.stringify` anyway, but being explicit keeps the type contract obvious to the next reader.
3. The outer `try` and the inner `if (logError)` are **both** required: the outer catches a thrown exception (network error, table missing), the inner catches a returned PostgREST error (RLS denial, column-not-found). Both branches log to `console.error` and **never** throw. The user's enrollment must not depend on the audit write succeeding.
4. **Do not** also `INSERT` a second row for the response somewhere else (e.g. a "response logger" trigger or a follow-up call). One row, one submission, both columns.

---

## 3. Outcome matrix

| Upstream API result | `log` column | `response` column | Edge Function returns |
|---------------------|--------------|-------------------|-----------------------|
| 200 + `SUCCESS = "true"` | request payload | `{"data":{"SUCCESS":"true",...}}` | `{ success: true, status: 200, data }` |
| 200 + `SUCCESS = "false"` (validation rejection) | request payload | `{"data":{"SUCCESS":"false","MESSAGES":...}}` | `{ success: true, status: 200, data }` (HTTP-level success, payload-level failure) |
| 4xx / 5xx with JSON body | request payload | upstream error JSON | `{ success: false, status: <upstream>, data }` |
| Upstream returns non-JSON | (insert is skipped because `response.json()` throws — caught by outer `try` of the function, returns 500) | — | 500 |
| Supabase insert fails (RLS, column missing, etc.) | — | — | upstream response is still returned to the client; the audit row is dropped, error is logged |

The third row is the most important one: even when the upstream rejects the enrollment, the **request payload AND the rejection reason** are persisted on the same row. This is what makes post-mortems possible without grepping logs across services.

---

## 4. Replication checklist

Use this on every project you touch.

- [ ] Identify the existing log table name in the target repo (e.g. `securehsa`, `<project>_log`, `PremiumHsa_log`).
- [ ] Create a new migration `supabase/migrations/<YYYYMMDDHHMMSS>_add_response_to_<log_table>.sql` with `ALTER TABLE … ADD COLUMN IF NOT EXISTS response text`.
- [ ] Add a `COMMENT ON COLUMN` so future devs know what's in the column.
- [ ] Apply the migration locally and on the deployed project (via `supabase db push` or your normal flow).
- [ ] In the Edge Function that calls the upstream enrollment API:
  - [ ] Locate the `await response.json()` line.
  - [ ] Replace the existing `INSERT` (which probably writes only `date` + `log`) with one that also includes `response: JSON.stringify(responseData)`.
  - [ ] Wrap the insert in a `try / catch`; inside, also check the returned `logError`. Both branches must `console.error` and **must not throw**.
- [ ] Confirm there is **no** other code path that inserts into the log table (a separate "response logger" function, a Postgres trigger, a `_response` sister table). If there is, delete it — the whole point is one row per submission.
- [ ] Manual test:
  - [ ] Submit a successful enrollment → `select id, date, response from <LOG_TABLE> order by date desc limit 1;` shows a non-null JSON string with `SUCCESS = "true"`.
  - [ ] Submit an invalid enrollment that the upstream rejects → the row exists, `response` contains the upstream error JSON, and the user still sees the project's normal error UI.
  - [ ] Temporarily rename the table in the Edge Function to a typo (e.g. `<LOG_TABLE>X`) → user-facing flow still completes, `console.error` shows `<LOG_TABLE>X insert failed: ...`, no row written. Revert the typo when done.

---

## 5. Common pitfalls

1. **Adding the column as `NOT NULL`** breaks existing rows. Keep it nullable.
2. **Adding the column as `jsonb`** with no cast — Supabase-js will send a string for `response`, and PostgREST will reject it as not-valid-jsonb if the upstream returned something non-conforming. Use `text` and cast at read time.
3. **Throwing on `logError`** propagates a database failure into the user-facing enrollment response. The user's enrollment succeeded with the upstream — never let your audit table be the reason they see an error. Log and swallow.
4. **Writing the response to a separate table** (e.g. `<log>_responses`) defeats the entire purpose: pairing now requires a JOIN on `(date, customer_email)` which is fragile under retries. One row, one submission, both columns.
5. **Logging after `return new Response(...)`** — the Edge runtime may tear the function down before the insert flushes. Either insert before `return`, or use `EdgeRuntime.waitUntil(supabase.from(...).insert(...))` if you need true post-response logging.
6. **Stringifying twice** — `JSON.stringify(responseData)` once is correct; `JSON.stringify(JSON.stringify(...))` produces a quoted string that you'll have to `JSON.parse` twice when querying.
7. **RLS surprise** — Edge Functions must use `SUPABASE_SERVICE_ROLE_KEY` for the insert to bypass RLS. If you accidentally created the Supabase client with the anon key, every insert silently fails with `logError`. Check `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` is set and used.
8. **Renaming the table without updating the Edge Function** — the migration that creates the table and the one that adds the column may reference different names if the table was renamed mid-project (this repo's create migration says `securehsa`, the active code uses `PremiumHsa_log`). Always grep for every reference before applying the new migration.

---

## 6. Querying the audit log

```sql
-- Latest 20 enrollments with success / failure derived from the response column.
SELECT
  id,
  date,
  (response::jsonb)->'data'->>'SUCCESS' AS upstream_success,
  (response::jsonb)->'data'->'MESSAGES' AS upstream_messages
FROM public."<LOG_TABLE>"
ORDER BY date DESC
LIMIT 20;

-- All failed enrollments in the last 24h with the request that caused them.
SELECT
  id,
  date,
  log,
  response
FROM public."<LOG_TABLE>"
WHERE date >= now() - interval '24 hours'
  AND (response::jsonb)->'data'->>'SUCCESS' = 'false'
ORDER BY date DESC;
```

The `::jsonb` cast is what lets you query inside the column even though it's stored as `text`.

---

## 7. Replication summary (one paragraph you can paste in a PR)

> Add a nullable `response text` column to the existing enrollment audit-log table via an idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migration. In the Edge Function that calls the upstream enrollment API, change the existing `INSERT` (which previously stored only the outbound request payload) to also include `response: JSON.stringify(responseData)` on the same row, between `await response.json()` and the function's `return new Response(...)`. Wrap the insert in `try / catch` and check the returned `logError` — both branches `console.error` but never throw, so an audit-log failure can never break a user's enrollment. The result is one audit row per submission containing both the request and the upstream response, queryable with `response::jsonb` at read time.
