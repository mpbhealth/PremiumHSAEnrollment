# Dependent email duplicate check on blur (reusable pattern)

Use this when each **dependent** must have an **email distinct** from the **primary subscriber** and from **every other dependent**. You want:

- The same message on **submit** (full form validation) and as soon as the user **leaves** the dependent email field (**blur**) if the value is still a duplicate.
- A **single source of truth** for “is this email a duplicate?” so you do not drift between blur and submit.

**Premium HSA reference:** `src/utils/dependentEmailValidation.ts`, `src/components/DependentsAddressSection.tsx` (blur + local errors), `src/components/EnrollmentWizard.tsx` (submit validation).

---

## Behavior summary

| Moment | What happens |
|--------|----------------|
| User types in email | Clear any prior error for that field (local + parent errors) so messages do not stick after a fix. |
| User leaves the field (blur) | If the value is a valid email **and** it matches the subscriber or another dependent → show duplicate message under the field. |
| User leaves the field (blur) | If the value is empty or not a valid email → **do not** set the duplicate message (required/format stay the concern of submit or separate rules). |
| Submit | Run the same duplicate helper after required + format checks; block submit if duplicate. |

---

## 1. Shared validation helper

Add a small module (e.g. `dependentEmailValidation.ts`) that exports:

1. A **constant** for the user-facing duplicate message (one string app-wide).
2. A **function** `getDependentEmailDuplicateError(email, dependentIndex, dependents, mainSubscriberEmail)` that returns:
   - `null` if the string is empty, fails a simple email regex, or is unique;
   - the duplicate message if the normalized (trim + lowercase) email equals the subscriber or any **other** dependent.

**Rules implemented in Premium HSA:**

- Compare with `mainSubscriberEmail` only when it is non-empty after trim.
- When comparing to other dependents, skip the **current index**; for each other row, compare if that row has a non-empty email.

**Important:** Duplicate detection runs only when the input passes the **basic email format** check. Invalid format is not “duplicate”; handle format in required/submit validation.

---

## 2. Use the same helper on submit

In your wizard or parent validator (e.g. `validateStep` before going to the next step):

1. For each dependent, after `required` and `format` checks pass, call:

   `getDependentEmailDuplicateError(dependent.email, index, formData.dependents, formData.email)` (names may differ).

2. If the result is non-null, set the error on the same key you use in the UI (e.g. `dependent_${index}_email`).

This keeps blur and submit aligned.

---

## 3. Blur handler in the dependent form UI

On the dependent **email** `<input>`:

- Add **`onBlur`** (in addition to `onChange`).

In the blur handler:

1. Read the value from **`event.currentTarget.value`**, not only from React state.  
   **Why:** On blur, parent state from the last `onChange` may not have flushed yet; the DOM value is authoritative.

2. Build a **short-lived copy** of the dependents array for the check: for the **current index**, set `email` to `event.currentTarget.value` so the “current” row matches what the user sees, while other rows still come from state:

   `dependents.map((d, i) => i === index ? { ...d, email: emailValue } : d)`.

3. Call `getDependentEmailDuplicateError(emailValue, index, dependentsForCheck, mainSubscriberEmail)`.

4. Store the result in **local** component state keyed the same as submit errors (e.g. `dependent_${index}_email`): set the message, or `delete` the key if `null`.

---

## 4. Merging “parent” and “local” errors

If the parent (wizard) passes in **`errors` from submit** and the child also keeps **`localErrors` from blur**:

- Merge as: **`{ ...parentErrors, ...localErrors }`** (local after parent) so a blur-set duplicate is not **hidden** by an older parent map that might omit the key, while still allowing the parent to own submit-time errors.
- On **change** for that field: clear **`localErrors`** for the field key and call **`onClearError('dependent_' + index + '_email')`** (or your naming convention) so typing fixes both blur and submit errors.

---

## 5. What you need in props

The dependent form section should receive:

- `dependents` (array, mutable via parent)
- `onUpdateDependent(index, dep)`
- **Subscriber email** (or a `subscriber` object that includes it) for comparison
- `errors` from parent + `onClearError` (optional but recommended)

---

## 6. Checklist for a new project

- [ ] One duplicate message string and one `getDependentEmailDuplicateError` (or equivalent) used everywhere.
- [ ] Submit path: after format validation, run duplicate check per dependent.
- [ ] Blur on dependent email input; use `currentTarget.value` + `dependents` snapshot for current index.
- [ ] Local + parent error merge order: **local overwrites** for the same key.
- [ ] `onChange` clears local + parent error for that field.
- [ ] Keys for errors are **consistent** between child and parent (e.g. `dependent_0_email`).

---

## 7. Optional extensions

- Re-run duplicate checks when the **subscriber email** changes (e.g. `useEffect` on `mainEmail`) to clear or refresh errors without requiring another blur.
- If dependents are listed **without** a selected tab, run blur validation per row or on submit only; the pattern above matches a **single selected** dependent panel.

---

## 8. Related files (this repo)

| File | Role |
|------|------|
| `src/utils/dependentEmailValidation.ts` | Message + `getDependentEmailDuplicateError` |
| `src/components/DependentsAddressSection.tsx` | `handleEmailBlur`, `localErrors`, merge order |
| `src/components/EnrollmentWizard.tsx` | Step validation calling the same helper |

Copy the **ideas** and **key sequences** (helper → submit + blur, DOM value on blur, merge order) into any stack; adjust types and key names to match your app.
