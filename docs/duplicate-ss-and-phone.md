# Duplicate phone and Social Security number (subscriber + dependents)

Use this pattern when **phone** (US-style, 10 digits) and **SSN** (9 digits) must be **unique**:

- Across the **primary subscriber** and **every dependent** (no duplicate between any pair).
- Across **dependents only** when comparing dependent-to-dependent.

You want:

- The **same user-facing messages** and **same comparison rules** on **blur** (dependent fields), **live refresh** when the subscriber’s phone/SSN change, **derived UI** on the subscriber row when dependents exist, and on **submit** (step validation)—so implementations do not drift.

**Direct Enrollment (this repo):** `src/utils/dependentPhoneSsnDuplicateValidation.ts`, `src/components/DependentsAddressSection.tsx` (blur + `localErrors` + subscriber `useEffect`), `src/components/Step2AddressInfo.tsx` (subscriber fields + passing `phone`/`ssn` into dependent section props), `src/components/EnrollmentWizard.tsx` (`validateStep3`).

Pair with **`docs/dependent-email-duplicate-blur-validation-pattern.md`** for dependent email—the flow (blur snapshot, merge order, submit) is deliberately parallel.

---

## Behavior summary

| Moment | What happens |
|--------|----------------|
| User types (dependent phone/SSN) | Clear errors for that field (local + parent) so stale messages disappear while editing. Same idea as email. |
| User leaves dependent phone/SSN (**blur**) | If the value is **complete** (**10-digit** phone after stripping non-digits, **9-digit** SSN) **and** it matches subscriber or another dependent → show the duplicate message under that field. |
| User leaves field (blur) | If incomplete (wrong digit count or empty) → **do not** set duplicate messages; required/length/format stay submit or other rules. |
| Subscriber phone/SSN change (effect) | If a dependent panel is open, **re-run** duplicate checks for that dependent’s email/phone/ssn vs updated subscriber fields (parity with subscriber email refresh in the email doc). |
| Subscriber phone/SSN while dependents exist | **Derive** duplicate messages with `useMemo` (same helpers as submit) merged with wizard `errors` so the subscriber sees immediate feedback once values are complete **and** a dependent matches—with **no blur required** on the subscriber field. Only relevant when there is at least one dependent. |
| **Submit** (e.g. `validateStep`) | After required + digit-count checks pass, call the same helpers: **per dependent** vs subscriber + siblings; **subscriber** vs all dependents **if dependents.length > 0**. Block submit on duplicate. |

---

## Duplicate messages (keep one string per domain)

Reuse the same exported constants everywhere (blur, derived UI, submit):

- Phone: **`Your phone number needs to be different from any other phone numbers`**
- SSN: **`Your Social Security number needs to be different from any other Social Security numbers**

---

## Normalization rule

Always compare **`stripDigits(value)`**: `replace(/\D/g, '')` on trimmed input so `(555) 123-4567` and `555-123-4567` collide correctly.

---

## 1. Shared validation helpers

Add one module that exports:

1. **Constants**: `DEPENDENT_PHONE_DUPLICATE_MESSAGE`, `DEPENDENT_SSN_DUPLICATE_MESSAGE`.

2. **Dependent-side** functions (parity with dependent email helper):
   - `getDependentPhoneDuplicateError(phone, dependentIndex, dependents, mainSubscriberPhone)` → duplicate only when current value has **exactly 10** digits after strip.
   - `getDependentSsnDuplicateError(ssn, dependentIndex, dependents, mainSubscriberSsn)` → duplicate only when current value has **exactly 9** digits after strip.

3. **Subscriber-side** checks (needed because duplicates are symmetric—you must block subscriber == dependent even if the mismatch is spotted on primary row):
   - `getPrimarySubscriberPhoneDuplicateError(phone, dependents)` → duplicate if subscriber phone is 10 digits and equals any **complete** dependent phone.
   - `getPrimarySubscriberSsnDuplicateError(ssn, dependents)` → same for 9-digit SSN.

**Rules mirrored from email:**

- Skip “other” dependents at **`dependentIndex`** when comparing dependents.
- Compare subscriber only when their stored phone/SSN has the **correct digit count**.
- Ignore other dependents’ incomplete values (fewer digits); they are not duplicates yet.

---

## 2. Submit validation (wizard / parent)

1. **Subscriber** (when `dependents.length > 0`): after subscriber phone reaches 10 digits, call `getPrimarySubscriberPhoneDuplicateError`; after SSN reaches 9 digits, call `getPrimarySubscriberSsnDuplicateError`; set **`phone`** / **`ssn`** keys on your parent error map.

2. **Each dependent**: after phone length and SSN length pass, call:
   - `getDependentPhoneDuplicateError(dependent.phone, index, formData.dependents, formData.phone)`
   - `getDependentSsnDuplicateError(dependent.ssn, index, formData.dependents, formData.ssn)`  
   Set **`dependent_${index}_phone`** and **`dependent_${index}_ssn`** to match blur keys.

This keeps blur, subscriber UI, and submit aligned.

---

## 3. Blur handlers (dependent UI)

For each dependent **phone** and **SSN** input:

- Add **`onBlur`** beside **`onChange`**.

In each blur handler (same discipline as email):

1. Read from **`event.currentTarget.value`** (DOM authoritative on blur).

2. Build **`dependentsForCheck`** via `dependents.map((d, i) => i === idx ? { ...d, phone | ssn : value } : d)` for the relevant field.

3. Call **`getDependentPhoneDuplicateError`** or **`getDependentSsnDuplicateError`** with subscriber’s current **phone** / **SSN** from props (see §5).

4. Update **local** state keyed **`dependent_${idx}_phone`** / **`dependent_${idx}_ssn`**: assign message or `delete` if `null`.

---

## 4. Subscriber contact changes → refresh open dependent (`useEffect`)

When the subscriber’s **phone** or **SSN** (and **email** if you unify the panel) changes, optionally re-evaluate duplicates for **the selected dependent row**—same rationale as **`dependent-email`** pattern doc §7: the dependent did not blur again, but the subscriber value changed underneath.

Implement by effect dependencies on **`subscriberAddress.phone`** and **`subscriberAddress.ssn`** (and email if bundled), calling the same helpers against the selected dependent’s current values and merging into **`localErrors`**.

Avoid listing full **`dependents`** in the dependency array if you only want subscriber-driven refreshes without re-running every keystroke on another dependent row; match your product decision to the email doc’s lint exception.

---

## 5. What to pass through props

The dependents address/contact section needs **subscriber identifiers** alongside address/email:

Extend your “subscriber blob” passed into the dependents panel to include **`phone`** and **`ssn`** (plain strings matching what the wizard stores), e.g.

```tsx
subscriberAddress={{
  ...,
  email: formData.email,
  phone: formData.phone,
  ssn: formData.ssn,
}}
```

Naming can be `subscriberContact` rather than address-only; clarity matters more than the label.

---

## 6. Subscriber row UI merge

For primary **phone** and **SSN** fields on the enrollment step:

- Compute **derived duplicate** strings with **`useMemo`**: call `getPrimarySubscriberPhoneDuplicateError` / `getPrimarySubscriberSsnDuplicateError` when `dependents.length > 0`.
- **`fieldError`** = `$errors.phone` **or** the derived duplicate message **or** empty string (same pattern for SSN) so:
  - required / length failures from wizard still show after failed submit,
  - duplicates appear as soon as both sides have complete digits,
  - editing clears wizard `errors` via existing `onChange` behavior while derived duplicate may still apply until uniqueness is restored.

---

## 7. Merging parent and local errors

Same as **`dependent-email`**:

- **`merged = { ...parentErrors, ...localErrors }`** (local wins per key).
- On **change** for a field: clear local keys and call **`onClearError('dependent_'+index+'_phone')`** etc.

---

## 8. Invalid dependent indices / scroll (optional UX)

When submit fails on any dependent-exclusive field (including duplicates), pushing **invalid indices** from the wizard helps highlight list items and scroll to **`[data-dependents-section]`**—reuse the same pattern you use for other dependent-field failures.

---

## 9. Checklist for porting to another project

- [ ] One module: messages + **`stripDigits`** + four helpers (dependent phone/ssn ×2, subscriber phone/ssn ×2).
- [ ] Subscriber submit checks when dependents exist **and** digits are complete.
- [ ] Per-dependent submit checks vs subscriber + siblings after length checks pass.
- [ ] **`onBlur`** on dependent phone/SSN using **`currentTarget.value`** + **short-lived dependents array**.
- [ ] Subscriber **phone/ssn (+ email)** in props driving dependent **`useEffect`** refresh for duplicate state.
- [ ] Subscriber-facing inputs: **derived duplicates** merged with wizard errors when dependents exist.
- [ ] Stable error keys **`dependent_${i}_phone`** / **`dependent_${i}_ssn`** aligned between child and parent.

---

## 10. Related files (this repo)

| File | Role |
|------|------|
| `src/utils/dependentPhoneSsnDuplicateValidation.ts` | Messages + normalization + four duplicate helpers |
| `src/components/DependentsAddressSection.tsx` | Phone/SSN blur, local errors, subscriber-field `useEffect` |
| `src/components/Step2AddressInfo.tsx` | Subscriber `phone`/`ssn` duplicates via `useMemo`, passes subscriber phone/ssn to dependents section |
| `src/components/EnrollmentWizard.tsx` | `validateStep3` invokes same helpers |

Copy **rules** (when to return `null`, digit counts, keys, merge order) into any framework; rename props and validators to fit your codebase.
