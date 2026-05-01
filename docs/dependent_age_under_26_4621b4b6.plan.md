---
name: Dependent age under 26
overview: "Enforce that **Child** dependents must be under age 26 (from DOB using existing `calculateAgeFromDOB`). **Spouse** dependents keep the current rule: **18 or older**, no upper age cap. Update Step 1 validation and mirror checks server-side so submissions cannot bypass the UI."
todos:
  - id: wizard-validation
    content: "Extend validateStep1: Child age >= 26 error; keep Spouse age < 18"
    status: completed
  - id: api-validation
    content: Mirror Child/Spouse DOB rules in enrollment-api-premiumhsa before external submit
    status: completed
  - id: manual-check
    content: Smoke-test Step 1 + API error path for blocked ages
    status: completed
isProject: false
---

# Dependent age: Child under 26, Spouse 18+

## Implementation (this repo)

In [`src/components/EnrollmentWizard.tsx`](src/components/EnrollmentWizard.tsx), **`validateStep1`** uses [`calculateAgeFromDOB`](src/utils/pricingLogic.ts) for dependents:

| Relationship | Rule |
|--------------|------|
| Child | `age !== null && age >= 26` → **Child dependents must be under 26 years of age** |
| Spouse | `age !== null && age < 18` → **Must be 18 years or older to enroll** (unchanged) |

Server parity: [`supabase/functions/enrollment-api-premiumhsa/index.ts`](supabase/functions/enrollment-api-premiumhsa/index.ts) — `calculateAgeFromDobMmDdYyyy` + validation loop after benefit ID check (400 JSON on failure).

## Edge case

Integer age **25** passes for a child; on 26th birthday, age **26** fails (“under 26”).

## Out of scope

Primary subscriber 18+ rule, pricing / `getAgeRange`, marketing copy.

## Verification

- Step 1: Child DOB → age 25 OK; age 26 blocked.
- Spouse age 17 blocked; 18+ passes (including 26+).
- API: same rules if payload bypasses UI.
