# Promocode system — export guide for similar projects

This document describes how enrollment promocodes work in this codebase pattern (Supabase + PostgREST + optional Edge API validation). **This repository (Premium HSA Enrollment) uses default promo PDID `44036`**, wired via `VITE_DEFAULT_PROMO_PDID` on the client and `DEFAULT_PROMO_PDID` on the Edge function (each falls back to `44036` when unset). When porting to another project, replace that value with your product identifier — it is **not** fixed globally.

---

## 1. What you are implementing

| Piece | Role |
|--------|------|
| **`promocodes` table** | Stores one row per code; each row has a **product scope** string and a **fixed dollar discount**. |
| **Client validation** | User enters a code; app loads the active row, checks **product** against the enrollment’s PDID, then applies **discount** to the initial payment. |
| **Server re-validation** | Enrollment submission repeats the same lookup + product check so discounts cannot be forged client-side. |
| **Pricing helper** | `initial_payment_after_discount = max(0, initial_payment - discount_amount)`. |

This repo scopes **`promocodes.product`** to a **single enrollment identifier: PDID** (numeric product ID). Other projects might store PDID under another name; the **mechanism** is the same: **match DB `product` column to whatever ID represents “this enrollment product”.**

---

## 2. Config you must set per project

Define **one default PDID** used when the form does not yet have a positive PDID:

```text
DEFAULT_PROMO_PDID = <your number>   // e.g. 44036 in Premium HSA Enrollment — change per deployment/product line
```

**Where to wire it (conceptually):**

- **Frontend** — `VITE_DEFAULT_PROMO_PDID` in [`src/utils/promoCodeService.ts`](../src/utils/promoCodeService.ts) (fallback `44036` here).
- **Edge function / API** — `DEFAULT_PROMO_PDID` in [`supabase/functions/enrollment-api-premiumhsa/index.ts`](../supabase/functions/enrollment-api-premiumhsa/index.ts) (fallback `44036` here). Keep this **in sync** with the client.

Never assume `44036` in a **different** codebase unless that **is** your product ID.

---

## 3. Database: `promocodes`

Reference migration shape:

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `code` | **UNIQUE** — each promo string appears once (different codes can share the same `product`). |
| `product` | **Not unique.** Stores the product scope: typically **`"<PDID>"`** as text (e.g. `"44036"` for Premium HSA). See wildcards below. |
| `discount_amount` | Non-negative numeric; dollars subtracted from initial payment. |
| `active` | Boolean; only `active = true` rows participate in validation. |

**RLS:** Policy that allows **anonymous `SELECT`** for rows with `active = true` is typical so the browser can validate without a logged-in user. Inserts/updates remain admin-only.

**Indexes:** Unique on `code`; optional index on `active`.

---

## 4. Product column semantics (`product`)

The enrollment **eligible PDID** is computed as:

```text
effective_pdid = (user_pdid is number && user_pdid > 0) ? user_pdid : DEFAULT_PROMO_PDID
```

A promocode row **matches** the enrollment when:

1. **`product` is empty**, or equals (case-insensitive) **`*`**, **`ALL`**, or **`ANY`** → code applies to any enrollment (wildcard rows).
2. Otherwise **`product`** (normalized) must equal **`String(effective_pdid)`** (normalized).

**Multiple codes per product:** Many rows may use the same **`product`** value (same PDID) with **different** `code` values — that is the normal case (e.g. `100MPOWER` and `livewell` both scoped to `44036`).

**Non-unique `code` (optional migration):** This repo may drop the unique constraint on `code` (see `20260415120000_allow_duplicate_promocodes_code.sql`) so the **same string** could appear on more than one row (e.g. different `product` values). Validation must **load all active rows** matching the typed code, then **pick the first row whose `product` matches** `effective_pdid` (wildcards count as match). Do **not** use `limit(1)` **before** that filter, or a random row can fail product match and look like an “invalid code.”

**User input:** Strip outer parentheses so `(LIVEWELL)` matches a row stored as `livewell` / `LIVEWELL` (`normalizePromoCodeInput` in `promoCodeService.ts`).

---

## 5. Code lookup: case-insensitive + literal string

PostgREST/Supabase: use **`ilike`** on `code` with **normalized** input (trim; strip wrapping `(...)` if present), not `eq` with forced uppercase, so DB casing can differ from user input.

**Critical:** `ilike` treats `%` and `_` as wildcards. **Escape** backslash, percent, and underscore in the user’s input before sending:

```typescript
function escapePromoCodeForILike(trimmed: string): string {
  return trimmed
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
```

**Query pattern:**

- Normalize: `trim` + optional outer parentheses strip (`normalizePromoCodeInput`).
- `from('promocodes').select('code, product, discount_amount')`
- `.ilike('code', escapePromoCodeForILike(normalizedInput))`
- `.eq('active', true)`
- **Do not** `limit(1)` before product filtering if `code` may not be unique in the database.
- From the returned rows, **choose the first** where `product` matches `effective_pdid` (Section 4).

If no row matches the code, or no returned row matches **`product`** → **invalid code**.

---

## 6. Client-side validation flow

1. Normalize input (trim, strip outer parentheses).
2. Run the query above (all matching active rows).
3. If no rows match code → error.
4. Pick the **first row** whose `product` matches `effective_pdid` (Section 4); if none → error.
5. On success, persist **`AppliedPromo`**: `{ code, product, discountAmount }` from that row.

**UI:** Do not force uppercase on every keystroke if you rely on `ilike`; trimming / parenthesis strip is enough.

---

## 7. Applying the discount

```typescript
function applyPromoDiscount(initialPayment: number, appliedPromo: AppliedPromo | null): number {
  if (!appliedPromo) return initialPayment;
  return Math.max(0, initialPayment - appliedPromo.discountAmount);
}
```

Use the same helper anywhere the enrollment fee is shown (summary, payment step, PDF, etc.).

---

## 8. Server-side (Edge function / API) parity

When the client submits enrollment:

1. If `promoCode` is non-empty, repeat the **same** `promocodes` query + **same** `escapePromoCodeForILike` + **same** `effective_pdid` / product match (using **the same `DEFAULT_PROMO_PDID`** as the client).
2. If the match succeeds, recompute enrollment fee: **`max(0, base_fee - discount_amount)`** — do **not** trust client-sent dollar amounts for the promo discount.

Duplicate `escapePromoCodeForILike` in the Edge bundle if needed (no shared package), but keep logic **byte-identical**.

---

## 9. Admin data entry cheat sheet

| Goal | Set `product` to |
|------|---------------------|
| Code valid only for PDID **12345** | `12345` (string) |
| Code valid for **any** product line | `*` or `ALL` or `ANY`, or leave empty per your wildcard implementation |

Use **distinct `code` values** when possible. If your migration allows duplicate `code` strings, ensure validation picks the row by **product** match (Section 4).

---

## 10. Checklist when copying to another repo

- [ ] Create `promocodes` table + RLS + indexes (or equivalent).
- [ ] Set **`DEFAULT_PROMO_PDID`** (and document it for admins creating rows).
- [ ] Implement **`escapePromoCodeForILike`** + **`ilike`** lookup + **product match over all matching rows** (no premature `limit(1)` if `code` is not unique).
- [ ] Implement **wildcard + PDID** matching for `product`.
- [ ] Wire **`validatePromoCode`** (or equivalent) with **`pdid`** from enrollment state.
- [ ] Implement **`applyPromoDiscount`** (or equivalent) with **`Math.max(0, …)`**.
- [ ] Mirror promo validation + fee math on **submit** server-side.
- [ ] Smoke-test: unknown code, inactive row, wrong PDID row, wildcard row, multiple codes same PDID.

---

## 11. Prompt snippet for AI-assisted ports

Paste something like this when asking an AI to implement the same system in another codebase:

```text
Implement promocode validation per docs/promocode.md pattern:
- Supabase table promocodes (code unique, product text, discount_amount, active).
- Lookup: trim input, escape % _ \ for ilike, filter active=true, limit 1.
- Product match: wildcards empty/* /ALL/ANY = any; else product must equal String(effective_pdid).
- effective_pdid = user pdid if > 0 else DEFAULT_PROMO_PDID.
- Use this DEFAULT_PROMO_PDID for this project: <PUT YOUR NUMBER HERE>
- Client applies max(0, initial - discount); server recomputes on submit.
- Do not hardcode 44036 unless that is our PDID.
```

(Replace the last line with your real default PDID or “read from env `VITE_DEFAULT_PROMO_PDID`”.)

---

## 12. Reference locations in this repository

| Area | Path |
|------|------|
| This guide | `docs/promocode.md` |
| Client service | `src/utils/promoCodeService.ts` |
| UI apply | `src/components/EnrollmentSummary.tsx` |
| Edge validation | `supabase/functions/enrollment-api-premiumhsa/index.ts` |
| Migration | `supabase/migrations/20260123163522_create_promocodes_table.sql` |

Promo **default PDID** for this app is **`44036`** (see `DEFAULT_PROMO_PDID` / `VITE_DEFAULT_PROMO_PDID`). Other Care+/enrollment codebases may use different IDs; keep **client and Edge** defaults aligned per deployment.

---

*Last aligned: Premium HSA — PDID-only product matching, ilike + escape, server parity.*
