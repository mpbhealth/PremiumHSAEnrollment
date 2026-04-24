# PDF retained — store enrollment PDFs on enrollment success only (MEC variant)

Use this when a project generates an enrollment / application PDF and you want a copy of the file in your **Supabase Storage** bucket **only when** the upstream enrollment API call **confirms enrollment success**. Every other outcome — `TRANSACTION.SUCCESS=false`, 5xx after the retry loop, network error after retries, non-JSON response, validation failure before submit — results in **no PDF upload** and **no row** in `enrollment_pdfs`.

This document describes the exact pattern used in this repo (Secure HSA Enrollment) so you can copy it into other repos that should only retain PDFs on confirmed enrollment success.

**Reference files in this repo**

| Concern | File |
|--------|------|
| Submit handler that orchestrates retries + success-gated PDF upload | `src/components/EnrollmentWizard.tsx` (`handleSubmit`, `generateAndUploadPDF`) |
| PDF generator (client side) | `src/utils/generateEnrollmentPDF.ts` |
| Edge Function that uploads + records the PDF | `supabase/functions/save-enrollment-pdf/index.ts` |
| Storage bucket migration | `supabase/migrations/20251124151125_create_enrollment_documents_bucket.sql` |
| Metadata table migration | `supabase/migrations/20251119165414_create_enrollment_pdfs_table.sql` |

> **Sister projects:** other projects in this family (e.g. Care+ Enrollment) implement an "always retain — even on failure" pattern. This document is **not** that pattern. The retention guard here is the local boolean `enrollmentSuccess` in `handleSubmit`, set to `true` only when `(transactionSuccess || hasSuccessFlag) && !transactionFailed`, and consulted just before `generateAndUploadPDF(...)`. The Edge Function `save-enrollment-pdf`, the bucket, and the `enrollment_pdfs` table are unchanged from the sister projects — only the client-side gate differs.

---

## TL;DR — the four guarantees (MEC success-only)

1. **PDF generation runs in the browser only after** the enrollment API loop confirms enrollment success. Failures return early and never produce a PDF.
2. The **upload to Storage runs inside the success branch** in its own `try / catch`. The `catch` is empty so a storage failure cannot block the Thank You page.
3. The Edge Function returns `success: true` only based on the **storage upload**, not on any upstream system. (Unchanged from sister projects.)
4. **No row is written** to `enrollment_pdfs` for any non-success outcome. The presence of a row is itself the audit signal that enrollment succeeded.

If your project shows a PDF in the bucket for a failed enrollment, the MEC gate has been bypassed somewhere — most likely the upload was moved out of the success branch.

---

## 1. The bucket and metadata table (one-time setup)

Create a public bucket for the PDFs and a metadata table that maps each PDF back to a customer.

**Bucket** (`enrollment-documents` in this repo):

- `public = true` so a public URL can be returned to the customer for download.
- `allowed_mime_types = ['application/pdf']`.
- `file_size_limit` set explicitly (this repo uses 10 MB / `10485760`).
- Use `INSERT … ON CONFLICT (id) DO UPDATE` so the migration is idempotent.

**Table** (`enrollment_pdfs` in this repo):

- Columns: `id`, `customer_email` (UNIQUE), `sanitized_filename`, `pdf_url`, `storage_path`, `created_at`, `metadata jsonb`.
- RLS enabled, with `SELECT` for `anon, authenticated` and `INSERT/UPDATE` for `service_role`.
- Index on `customer_email` and `created_at`.

`UNIQUE (customer_email)` and `upsert: true` are the right shape for this variant: the only legitimate scenario for a repeated upload is a successful retry for the same applicant, which simply overwrites the previous successful copy.

---

## 2. Edge Function — never make storage depend on upstream

The Edge Function only does **three things**: validate input, upload to Storage, write metadata. It must not call the enrollment API; that is the client's job.

**Required behavior** (see `supabase/functions/save-enrollment-pdf/index.ts`):

- Accept `multipart/form-data` with `pdf` (File) and `email` (string) and an optional `metadata` (JSON string).
- 400 if `pdf` or `email` are missing, or the file exceeds the limit.
- Upload to the bucket with `upsert: true`.
- Get the public URL via `supabase.storage.from(bucket).getPublicUrl(path)`.
- Upsert the metadata row keyed by `customer_email`.
- Return `{ success: true, pdfUrl, storagePath, filename }` based on the **upload** result. Do **not** flip to `success: false` if the metadata write fails — the file is the source of truth; log the DB error and continue.
- On any thrown exception, return `{ success: false, error, message }` with status 500.

**Headers**: `Access-Control-Allow-Origin`, `-Methods`, `-Headers` for CORS, plus reply to `OPTIONS` with `200`.

**Auth**: use `SUPABASE_SERVICE_ROLE_KEY` from environment so the upload bypasses RLS.

The Edge Function is identical to the always-retain variant. The MEC gate lives **only** in the client.

---

## 3. Client orchestration — the order matters

In your submit handler, do this **in order**:

1. Validate the form. If invalid, return — no PDF is created and nothing is uploaded.
2. Build the request payload, optionally encrypt sensitive fields.
3. POST to the enrollment API in a **retry loop** (this repo uses up to 3 attempts with exponential back-off on 5xx / network errors).
4. On a JSON response, compute three flags from the body:
   - `transactionFailed` (`TRANSACTION.SUCCESS === false | "false"`)
   - `transactionSuccess` (`!transactionFailed && TRANSACTION.SUCCESS === true | "true"`)
   - `hasSuccessFlag` (`!transactionFailed && data.success === true && data.SUCCESS === "true"`)
5. Compute the explicit MEC retention guard:
   `enrollmentSuccess = (transactionSuccess || hasSuccessFlag) && !transactionFailed`.
6. If `!enrollmentSuccess`: `setResponse(data)`, `clearFormDataOnly()`, `setLoading(false)`, **return**. **No PDF generation, no upload, no metadata row.**
7. On `enrollmentSuccess`: extract `memberId`, then call `generateAndUploadPDF(memberId)` wrapped in its own `try / catch` with an empty catch. Then render Thank You, `clearStorage()`, fire-and-forget the advisor notification.

This is the critical structural rule for MEC: the upload happens **inside** the success branch, in its own `try / catch`, **after** any side-effects that need the response data and **before** `clearStorage()` so the in-memory `formData` is still populated when the PDF is generated.

```ts
const transactionFailed =
  data.data?.TRANSACTION?.SUCCESS === false ||
  data.data?.TRANSACTION?.SUCCESS === "false";
const transactionSuccess =
  !transactionFailed &&
  (data.data?.TRANSACTION?.SUCCESS === true ||
    data.data?.TRANSACTION?.SUCCESS === "true");
const hasSuccessFlag =
  !transactionFailed &&
  data.success === true &&
  data.data?.SUCCESS === "true";

// MEC variant retention guard.
const enrollmentSuccess =
  (transactionSuccess || hasSuccessFlag) && !transactionFailed;

if (!enrollmentSuccess) {
  setResponse(data);
  clearFormDataOnly();
  setLoading(false);
  return;
}

const extractedMemberId = data.data?.MEMBER?.ID?.toString() || null;
setMemberId(extractedMemberId);

try {
  await generateAndUploadPDF(extractedMemberId);
} catch {
  // Intentionally swallow: never block the success UI on a storage failure.
}

setShowThankYou(true);
clearStorage();
setLoading(false);
sendAdvisorNotification(agentParam).catch(() => {});
return;
```

The empty `catch {}` is intentional and important — it guarantees that a failure to talk to the Edge Function or to Storage cannot crash the Thank You page on an otherwise successful enrollment.

---

## 4. `generateAndUploadPDF` — what to put inside

In this repo this function lives in `src/components/EnrollmentWizard.tsx`. Replicate it as:

1. Build the PDF blob from the in-memory `formData` (e.g. via `jsPDF` / your existing generator).
2. Build a `FormData` with:
   - `pdf` → `Blob` named `enrollment.pdf`.
   - `email` → `formData.email` (the only key you'll need to find this PDF later).
   - `metadata` → `JSON.stringify({ firstName, lastName, benefitId, enrollmentDate: new Date().toISOString(), enrollmentMemberId })`.
     - Include `enrollmentMemberId` for traceability — it is always non-null inside this branch by construction.
     - **Do not** include an `outcome: 'success' | 'failure'` field. In this variant we only ever upload on success, so there is nothing to disambiguate. Adding it would invite the wrong mental model.
3. `fetch(pdfApiUrl, { method: 'POST', headers: { Authorization: Bearer …, 'Cache-Control': 'no-cache, no-store' }, cache: 'no-store', body: formDataUpload })`.
4. Validate the response is JSON before parsing (to detect HTML error pages from gateways).
5. If `pdfResult.success && pdfResult.pdfUrl`:
   - Save the URL into UI state (e.g. `setPdfUrl(pdfResult.pdfUrl)`).
   - Call any downstream system that needs the PDF URL (e.g. `sendPdfToGateway(enrollmentMemberId, pdfResult.pdfUrl)`). The `enrollmentMemberId` is guaranteed non-null here.
6. Otherwise throw — the **outer `try / catch` in `handleSubmit`** will swallow it.

---

## 5. Outcome matrix (MEC success-only)

| Enrollment API result | PDF generated | Uploaded to bucket | Metadata row written | UI shown |
|------------------------|----------------|---------------------|----------------------|----------|
| 200 + confirmed success | yes | yes | yes (upsert by email) | Thank You + download link |
| 400 with explicit failure flag | **no** | **no** | **no** | Error UI |
| 5xx after retries | **no** | **no** | **no** | Error UI |
| Network / timeout after retries | **no** | **no** | **no** | Error UI |
| Ambiguous / non-JSON response | **no** | **no** | **no** | Error UI |
| Edge Function rejects file (>10 MB, missing fields, non-PDF) | yes | **no** | **no** | Thank You still shown (catch is empty); no download link |
| `validateStep…()` failed before submit | no | no | no | Inline form errors |

If your replication shows a PDF in the bucket on any of the failure rows, the MEC gate has been bypassed (the upload was moved out of the success branch, the gate boolean was relaxed, or a separate code path is calling `save-enrollment-pdf`).

---

## 6. Replication checklist (MEC success-only)

Use this on every project you touch.

- [ ] Bucket exists with the right name, `public: true`, MIME `application/pdf`, file size limit set, idempotent migration.
- [ ] Metadata table exists with **RLS enabled** and the **service role** can write. `UNIQUE (customer_email)` is in place.
- [ ] Edge Function exists, requires `pdf` + `email`, validates size, uploads first, then writes metadata, returns `success` based on upload only.
- [ ] Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` from env.
- [ ] In `handleSubmit`:
  - [ ] Explicit boolean `enrollmentSuccess = (transactionSuccess || hasSuccessFlag) && !transactionFailed` is computed from the JSON response.
  - [ ] PDF generation **and** upload happen **only** inside the `if (enrollmentSuccess)` branch.
  - [ ] Upload call is wrapped in **its own `try / catch`**, with an empty catch (or just logging), so a storage failure cannot crash the Thank You page.
  - [ ] `setShowThankYou(true)` and side-effects that need the PDF URL (e.g. gateway, advisor email) live **after** the upload so they observe the latest UI state.
- [ ] No code path outside `handleSubmit` calls `save-enrollment-pdf` directly (which would bypass the gate).
- [ ] Manual test:
  - [ ] Submit successfully → check the bucket has the PDF, the row exists in `enrollment_pdfs`, the Thank You page renders, download link works.
  - [ ] Force a 200 + `TRANSACTION.SUCCESS = "false"` → check the bucket has **no** PDF for this email, no row in `enrollment_pdfs`, user sees the error UI.
  - [ ] Force a 500 from the enrollment API after the retry loop exhausts → check the bucket has **no** PDF for this email, no row, user sees the error UI.
  - [ ] Force a network failure (offline, then submit) → after retries exhaust, check the bucket has **no** PDF for this email, no row, user sees the error UI.

---

## 7. Common reasons projects bypass the MEC gate

These are the bugs that cause failed-enrollment PDFs to show up in the bucket. Audit for each one.

1. **Upload moved out of the success branch** ("just to be safe"). Move it back in. The gate boolean is the source of truth.
2. **The success boolean is relaxed** (e.g. `if (res.ok)` instead of the explicit `enrollmentSuccess`). Always compute `(transactionSuccess || hasSuccessFlag) && !transactionFailed` and gate on that.
3. **A second call site to `save-enrollment-pdf`** (e.g. a "Download my PDF" button on the error UI). Don't add one — by definition the email has no successful enrollment to retain.
4. **The Edge Function calls the enrollment API itself.** This couples Storage to enrollment in the wrong direction. Keep it: client calls enrollment, then (only on success) client calls `save-enrollment-pdf`.
5. **Edge Function returns `success: false` when the metadata table write fails.** Decouple: the file is what matters; the row is just an index.
6. **Edge Function silently 404s** because the function name is wrong in `${supabaseUrl}/functions/v1/<name>`. Confirm the function deployed and the path matches.
7. **Bucket disallows the MIME type or rejects the file size.** Check the migration matches what your generator produces. PDFs generated client-side with a lot of base64 images can blow past 10 MB.
8. **CORS preflight fails**, so the browser never POSTs. Reply to `OPTIONS` with `200` and the standard `Access-Control-Allow-*` headers.
9. **Anonymous key missing `Authorization` header.** Even with `verify_jwt = false`, you usually still need `apikey` and `Authorization: Bearer <anon>` in the client `fetch`.
10. **PDF generator throws** for some edge case (e.g. missing `dob`). Generation runs before upload inside the success branch, so a generator throw is caught by the same outer `try / catch` and the user still sees the Thank You page (no PDF link). Add a `try / catch` around generation that produces a stub PDF or at least logs and re-throws into the outer `catch`.
11. **`clearStorage()` runs before `await generateAndUploadPDF(...)` resolves.** Make sure the `await` completes **before** `clearStorage()` clears the in-memory `formData` the generator depends on.

---

## 8. Optional hardening

These are not required but help in operations.

- **Retry the Edge Function call** with the same exponential back-off you use for the enrollment call (1 → 2 → 4 s, max ~5 s). Because we use `upsert: true` on a stable `enrollments/<sanitized_email>.pdf` path, a retried upload is idempotent.
- **Defer the upload to a background queue** (e.g. enqueue a job) if you want the user's success screen to render even faster. Keep the synchronous upload as a fallback so a queue outage still preserves the PDF for the successful enrollment.
- **Log a structured event** on each branch (`pdf.uploaded.success`, `pdf.upload_failed_after_success`) so you can alert when storage failures begin to outpace successful uploads.

---

## 9. Replication summary (one paragraph you can paste in a PR)

> After the enrollment API retry loop returns a JSON response, compute an explicit `enrollmentSuccess = (transactionSuccess || hasSuccessFlag) && !transactionFailed` boolean. **Only when it is true**, generate the PDF in the browser and call `generateAndUploadPDF(memberId)` in its own `try / catch` (empty catch). The Edge Function `save-enrollment-pdf` validates the file, uploads to the `enrollment-documents` bucket with `upsert: true`, upserts a row in `enrollment_pdfs` keyed by `customer_email`, and returns `{ success, pdfUrl }` based on the upload only. Any non-success enrollment outcome (`TRANSACTION.SUCCESS=false`, 5xx after retries, network failure, ambiguous response, or validation failure before submit) returns early and produces no PDF and no row.
