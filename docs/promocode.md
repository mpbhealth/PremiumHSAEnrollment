# Promocode system — porting guide for similar projects

This document describes a **Supabase + PostgREST** promocode pattern (browser validation + optional Edge/API re-validation on submit). You can **copy this file into another repository** and follow the sections below; only **§2 (config)** and **§3 (migrations)** need values/paths specific to your app.

**Design choice:** The `code` column is **not** `UNIQUE`. One product scope (`product`) can have **many different promo strings**, and you may also have **the same string** on more than one row when `product` (or discount) differs. Validation **always** loads **all** active rows that match the typed code, then picks the row whose **`product`** matches the enrollment (see §4). Using `limit(1)` **before** that filter is incorrect when `code` is not unique.

---

## 1. What you are implementing

| Piece | Role |
|--------|------|
| **`promocodes` table** | Each **row** is one promo rule: a **`code`** string, a **`product`** scope, an **`discount_amount`**, and **`active`**. |
| **Client validation** | Normalize input → query by `code` → filter rows by **`product`** vs enrollment ID → apply **discount** to the initial payment. |
| **Server re-validation** | On enrollment submit, repeat the **same** query + **same** product matching. Do **not** trust client-sent discount amounts. |
| **Pricing helper** | `initial_payment_after_discount = max(0, initial_payment - discount_amount)`. |

Map **`promocodes.product`** to whatever single ID represents “this enrollment product” in your app (this reference uses **PDID** as a numeric string, e.g. `"44036"`). The mechanism is the same if you rename the concept.

---

## 2. Config you must set per project

Define **one default product ID** used when the enrollment payload has no positive ID yet:

```text
DEFAULT_PROMO_PDID = <your number>
```

**Wire it in two places (keep them equal):**

- **Frontend** — e.g. `VITE_DEFAULT_PROMO_PDID` (or your bundler’s `import.meta.env` / `process.env` equivalent), read in your promo service with a **numeric fallback** if unset.
- **Edge / API** — e.g. `DEFAULT_PROMO_PDID` or `DEFAULT_ENROLLMENT_PDID` in server secrets, same numeric fallback.

Do **not** copy another project’s numeric literal unless it is **your** product ID.

---

## 3. Database: `promocodes` and **`code` is not UNIQUE**

### 3.1 Column reference

| Column | Notes |
|--------|--------|
| `id` | UUID primary key (recommended). |
| `code` | `text NOT NULL`. **No `UNIQUE` constraint** (see below). |
| `product` | `text NOT NULL`. Product scope: usually **`"<yourProductId>"`**, or wildcards (§4). |
| `discount_amount` | Non-negative numeric; dollars subtracted from initial payment. |
| `active` | Boolean; only `active = true` rows should be returned to anonymous clients (RLS). |
| timestamps | Optional `created_at` / `updated_at`. |

**RLS:** Typical pattern: **`SELECT`** allowed to **anonymous** users only for rows with **`active = true`** (validation without login). `INSERT` / `UPDATE` / `DELETE` — **authenticated** (or service role) only.

**Indexes:** Non-unique index on **`code`** for lookups, e.g. `CREATE INDEX idx_promocodes_code ON promocodes (code);`. Optional index on **`active`**.

### 3.2 Why remove (or avoid) `UNIQUE` on `code`

- **Multiple codes per product:** Many rows can share the same **`product`** with **different** `code` values (e.g. partner campaigns).
- **Same `code`, different `product`:** If you ever need the same display string scoped to different lines, duplicate `code` rows are allowed; the app **disambiguates** with **`product`** vs **`effective_pdid`**.
- **Gotcha:** If you query with **`limit(1)`** before product filtering, PostgREST may return the **wrong** row and the UI shows “invalid code” even when a valid row exists.

### 3.3 Bootstrap migration (greenfield)

Create the table **without** a unique constraint on `code`:

```sql
CREATE TABLE IF NOT EXISTS promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  product text NOT NULL,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promocodes_code ON promocodes (code);
CREATE INDEX IF NOT EXISTS idx_promocodes_active ON promocodes (active);

ALTER TABLE promocodes ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust roles/names to your project)
CREATE POLICY "Anyone can read active promocodes"
  ON promocodes FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can insert promocodes"
  ON promocodes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update promocodes"
  ON promocodes FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete promocodes"
  ON promocodes FOR DELETE TO authenticated
  USING (true);
```

### 3.4 Migration if you already have `UNIQUE` on `code`

If an older migration added **`UNIQUE (code)`** or **`UNIQUE INDEX`** on `code`, **drop** it and replace with a **non-unique** index:

```sql
ALTER TABLE promocodes DROP CONSTRAINT IF EXISTS promocodes_code_key;

DROP INDEX IF EXISTS idx_promocodes_code;

CREATE INDEX IF NOT EXISTS idx_promocodes_code ON promocodes (code);
```

Constraint names may differ (`\d promocodes` in `psql` to list). Adjust `DROP CONSTRAINT` to match your DB.

---

## 4. Product column semantics (`product`)

**Eligible product ID** for the current enrollment:

```text
effective_pdid = (user_id is number && user_id > 0) ? user_id : DEFAULT_PROMO_PDID
```

(Replace `user_id` with your real field name: `pdid`, `productId`, etc.)

A row **matches** the enrollment when:

1. **`product`** is empty, or equals (case-insensitive) **`*`**, **`ALL`**, or **`ANY`** → wildcard (any enrollment).
2. Otherwise **`product`** (trim + case-fold for comparison) equals **`String(effective_pdid)`** the same way.

**User input:** Trim; strip redundant outer parentheses, e.g. `(LIVEWELL)` → `LIVEWELL`, before lookup.

---

## 5. Code lookup: case-insensitive literal + escape `ilike` metacharacters

Use **`ilike`** on **`code`** with normalized input (not `eq` + forced uppercase) so database casing can differ from user input.

**Critical:** In SQL, `ilike` treats **`%`** and **`_`** as wildcards. Escape `\`, `%`, and `_` in the user string before sending the pattern:

```typescript
function escapePromoCodeForILike(trimmed: string): string {
  return trimmed
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
```

**Query pattern (Supabase client):**

1. `normalizedInput = normalizePromoCodeInput(userInput)` (trim + strip outer `(...)` ).
2. `pattern = escapePromoCodeForILike(normalizedInput)`.
3. `from('promocodes').select('code, product, discount_amount').ilike('code', pattern).eq('active', true)` — **no** `limit(1)` here if `code` is not unique.
4. From the array of rows, **`find`** the first where `product` matches `effective_pdid` per §4.

If no rows, or none match **`product`** → **invalid code**.

---

## 6. Client-side validation flow

1. Normalize input (trim, outer parentheses).
2. Query all matching **active** rows (§5).
3. If zero rows → error.
4. Pick first row matching **`product`** vs **`effective_pdid`**; if none → error.
5. Persist **`{ code, product, discountAmount }`** from that row for display and submit payload tagging (your shape may vary).

**UI:** Do not force uppercase on every keystroke if you rely on `ilike`.

---

## 7. Applying the discount

```typescript
function applyPromoDiscount(initialPayment: number, appliedPromo: AppliedPromo | null): number {
  if (!appliedPromo) return initialPayment;
  return Math.max(0, initialPayment - appliedPromo.discountAmount);
}
```

Use everywhere the fee is shown (summary, payment step, PDFs).

---

## 8. Server-side parity

On submit, if `promoCode` is non-empty:

1. Repeat the **same** normalization, **same** `escapePromoCodeForILike`, **same** query, **same** row selection by **`product`** (same **`DEFAULT_PROMO_PDID`** as the client).
2. Recompute fee: **`max(0, base_fee - discount_amount)`** from the **database** row — not from the client discount field.

Duplicate small helpers in the server bundle if you have no shared package; keep behavior **identical**.

---

## 9. Admin data entry cheat sheet

| Goal | Set `product` to |
|------|---------------------|
| Code only for product ID **12345** | `12345` (text) |
| Code for **any** product line | `*` or `ALL` or `ANY`, or empty string if your matcher treats blank as wildcard |

Prefer **distinct `code` strings** for clarity. If duplicates exist, validation **must** use **`product`** (§5–6).

---

## 10. Checklist when copying to another repo

- [ ] `promocodes` table: **`code` not UNIQUE**; non-unique index on `code`; RLS for active-only anonymous read.
- [ ] `DEFAULT_PROMO_PDID` (or equivalent) on **client + server**, documented for admins.
- [ ] `normalizePromoCodeInput` + `escapePromoCodeForILike` + **`ilike`** + fetch **all** matching active rows.
- [ ] **`product`** / wildcard matching vs **`effective_pdid`**; **no** premature `limit(1)`.
- [ ] `applyPromoDiscount` with **`Math.max(0, …)`**.
- [ ] Server recomputes discount on submit.
- [ ] Smoke-test: unknown code, inactive row, wrong `product` row, wildcard row, two rows same `code` different `product`, mixed case input.

---

## 11. Prompt snippet for AI-assisted ports

```text
Implement promocode validation per attached promocode.md:
- Table promocodes: code text NOT NULL (no UNIQUE on code), product text NOT NULL, discount_amount, active; index on code (non-unique); RLS SELECT for anonymous on active=true only.
- Optional migration: drop promocodes_code_key / unique index on code if upgrading an old schema.
- Client + server: normalizePromoCodeInput (trim, strip outer parens), escapePromoCodeForILike, ilike on code, eq active=true, NO limit(1) before product filter; pick first row where product matches effective_pdid (wildcards: empty, *, ALL, ANY).
- effective_pdid = user pdid if > 0 else DEFAULT_PROMO_PDID from env (document the env var names you use).
- Discount: max(0, initial - discount_amount); server recomputes on submit; do not trust client discount dollars.
```

---

## 12. Reference implementation (Premium HSA Enrollment)

This repository is one working example. Paths differ in other apps; treat these as **illustration only**:

| Area | Path (this repo) |
|------|-------------------|
| Guide | `docs/promocode.md` |
| Client service | `src/utils/promoCodeService.ts` |
| UI | `src/components/EnrollmentSummary.tsx` |
| Edge function | `supabase/functions/enrollment-api-premiumhsa/index.ts` |
| Create table migration | `supabase/migrations/20260123163522_create_promocodes_table.sql` |
| Drop UNIQUE on `code` | `supabase/migrations/20260415120000_allow_duplicate_promocodes_code.sql` |

Default promo product ID here: **`44036`** (`VITE_DEFAULT_PROMO_PDID` / `DEFAULT_PROMO_PDID`). **Replace** in your fork.

---

*Portable guide: non-unique `code`, multi-row lookup + product disambiguation, ilike + escape, server parity.*
