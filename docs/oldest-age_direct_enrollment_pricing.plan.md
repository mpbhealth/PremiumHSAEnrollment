---
name: Oldest-age Direct Enrollment pricing
overview: Centralize pricing age bands on the maximum age derived from the primary applicant’s DOB plus every dependent’s DOB, reusing existing `calculateAgeFromDOB` parsing and eligibility rules—all within `pricingLogic.ts` so `EnrollmentSummary` and `EnrollmentWizard` require no signature changes.
todos:
  - id: helper-max-age
    content: Add household age collection + max age (primary + dependents) in pricingLogic.ts
    status: completed
  - id: wire-direct-enrollment
    content: Use max age in getSecureHsaPricingOptions; keep errors/eligibility unchanged
    status: completed
  - id: verify-build
    content: Run npm run build (and lint if needed)
    status: completed
isProject: false
---

# Use oldest household age for Direct Enrollment quotes

## Current behavior ([`src/utils/pricingLogic.ts`](src/utils/pricingLogic.ts))

`getSecureHsaPricingOptions(memberDOB, dependents)` (direct enrollment / Premium HSA) uses **`pricingAge = Math.max`** over the primary and every dependent with a parseable DOB (see `collectHouseholdAges` in `pricingLogic.ts`). Previously only **`memberDOB`** set the age band.

`getCoverageType(dependents)` already reflects household composition for **which product rows** (`Member Only` vs `Member + Spouse`, etc.). The age band is **`18-29`** vs **`30-64`** in `SECURE_HSA_PRICING`; it must follow the **oldest** household member with a parseable DOB, not only the primary.

Call sites (**no changes needed**):

- [`src/components/EnrollmentSummary.tsx`](src/components/EnrollmentSummary.tsx) — already passes `memberDOB` and `dependents`.
- [`src/components/EnrollmentWizard.tsx`](src/components/EnrollmentWizard.tsx) — passes `formData.dob` and `formData.dependents`.

## Target behavior

1. Build a finite list of **integer ages** via existing [`calculateAgeFromDOB`](src/utils/pricingLogic.ts) for:
   - primary `memberDOB`
   - each `dependent.dob`
2. **Ignore** entries where DOB is missing/unparseable (`null`) so partial forms use **all valid ages present** (if none, same error as before).
3. **`pricingAge = Math.max(...ages)`**.
4. If **no ages** remain (effectively invalid primary DOB): keep current early return (**“Please enter a valid date of birth…”**).
5. Run existing **`getAgeRange(pricingAge)`** and the rest of filtering unchanged (**18–64** gate, **`getCoverageType`**, map to **`SECURE_HSA_PRICING`**).

**Example:** Primary 35, Spouse DOB ⇒ 52, Child 8 → ages `{35,52,8}` → **52** → **`30-64`** tier for that coverage type.

## Implementation steps

1. In [`src/utils/pricingLogic.ts`](src/utils/pricingLogic.ts), add a small internal helper (e.g. **`collectHouseholdAges(primaryDob: string, dependents: Dependent[]): number[]`**) that pushes non-null **`calculateAgeFromDOB`** results for primary then each dependent—or inline if you prefer a single exported **`getPricingAgeForHousehold(primaryDob, dependents): number | null`** returning **`Math.max`** or `null`.
2. At the top of **`getSecureHsaPricingOptions`**, replace single-member **`calculateAgeFromDOB(memberDOB)`** with:
   - `ages = collect...`
   - `if (ages.length === 0)` → unchanged error path
   - `const pricingAge = Math.max(...ages)`
   - **`getAgeRange(pricingAge)`** (and thereafter identical).
3. Add a concise file-level or function JSDoc note: **pricing age band follows oldest enrolled member with a parseable DOB**.

## Edge cases (document in code comment)

- **Dependent without DOB yet:** that person contributes no age → max ignores them until entered (same UI order as entering DOBs step-by-step).
- **Someone 65+ in household:** **`getAgeRange`** already returns **`null`** and **`Coverage is available for members aged 18-64 only.`** applies to the oldest age (**correct tightening** vs using only primary).

## Verification

- **Manual:** Enrollment with younger primary + spouse DOB implying **≥50** confirms IUA dropdown prices match **older** bracket.
- **`npm run build`** (optional **`npm run typecheck`**) passes.

No changes to other pricing helpers in this file unless product later mandates them (out of scope).
