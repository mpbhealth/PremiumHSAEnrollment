# Terms and Conditions section — replication guide

**Authoritative legal text for Premium HSA Enrollment** is exported as `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT` from [`src/constants/termsAndConditionsEnrollment.ts`](../src/constants/termsAndConditionsEnrollment.ts). Update that file when stakeholders change the wording; do not duplicate the full document in this markdown file.

Use this guide to add or mirror a **required** “Terms and Conditions” block on **Step 2** (questionnaire), **below** “Medical Cost Sharing Authorization,” in a project that shares the same wizard shape: `questionnaireAnswers` in storage, `Step2Questionnaire`, `validateStep2`, and `generateEnrollmentPDF`.

## Goals

- Gray legal copy in a **scrollable** region (same visual language as Medical Cost Sharing Authorization).
- **Checkbox** below the scroll area, same layout/position pattern as MCS.
- **Required** before advancing past Step 2.
- Full text included in the **generated enrollment PDF** (questionnaire summary row + full body with page breaks).
- **Mobile-friendly** (`max-height` + `overflow-y-auto`, touch scrolling).
- **No Edge Function change** unless your API explicitly whitelists questionnaire fields (usually `questionnaireAnswers` is passed through as a blob).

---

## Reference implementation (Premium HSA Enrollment)

| Concern | File |
|--------|------|
| Full legal text (single source of truth) | [`src/constants/termsAndConditionsEnrollment.ts`](../src/constants/termsAndConditionsEnrollment.ts) |
| Types + defaults | [`src/hooks/useEnrollmentStorage.ts`](../src/hooks/useEnrollmentStorage.ts) (`QuestionnaireAnswers`, `createDefaultFormData`; includes `termsAndConditionsAccept`) |
| Step 2 UI | [`src/components/Step2Questionnaire.tsx`](../src/components/Step2Questionnaire.tsx) (after Medical Cost Sharing block; scrollable panel + checkbox) |
| Validation + handler typing | [`src/components/EnrollmentWizard.tsx`](../src/components/EnrollmentWizard.tsx) (`validateStep2`, `handleQuestionnaireChange`) |
| PDF | [`src/utils/generateEnrollmentPDF.ts`](../src/utils/generateEnrollmentPDF.ts) (questionnaire YES/NO row + full body via `splitTextToSize` and page breaks) |

---

## 1. Add the legal text constant

Create something like:

`src/constants/termsAndConditionsEnrollment.ts`

- Export a single string, e.g. `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT`.
- Use a **template literal** for the full document (paragraphs separated by newlines).
- This string is used in **both** the React scroll region and the PDF so wording never drifts.

Do **not** duplicate the full text only in the component or only in the PDF.

---

## 2. Extend questionnaire state

In your central form type (e.g. `QuestionnaireAnswers`):

- Add: `termsAndConditionsAccept: boolean`

In defaults (e.g. `createDefaultFormData`):

- Set: `termsAndConditionsAccept: false`

Mirror the same field in any **local** `QuestionnaireAnswers` interface on `Step2Questionnaire` if you duplicate the type there.

---

## 3. Step 2 UI (`Step2Questionnaire`)

**Placement:** Immediately **after** the “Medical Cost Sharing Authorization” block (heading, gray box, checkbox, error), **before** the Signature fieldset.

**Import** the constant:

```ts
import { TERMS_AND_CONDITIONS_ENROLLMENT_TEXT } from '../constants/termsAndConditionsEnrollment';
```

(Adjust the import path to match your folder layout.)

**Pattern (match MCS):**

1. Heading: `Terms and Conditions` with required asterisk (`*`).
2. Outer wrapper (same as MCS):  
   `bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4`
3. **Inner scroll region** (only difference from MCS — long content):
   - `role="region"` and `aria-label="Terms and Conditions full text"` for accessibility.
   - Suggested classes:
     - `text-sm text-gray-700 leading-relaxed whitespace-pre-wrap`
     - `max-h-[min(17.5rem,42vh)] sm:max-h-[min(18rem,40vh)]` — tune to match your MCS block height on common viewports.
     - `overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y`
     - Optional: `[-webkit-overflow-scrolling:touch]` for iOS momentum scroll.
   - Content: `{TERMS_AND_CONDITIONS_ENROLLMENT_TEXT}`

4. **Checkbox** (same layout as MCS):
   - `type="checkbox"`
   - `name="termsAndConditionsAccept"` — helps `validateStep2` scroll/focus to the field on error.
   - `checked={answers.termsAndConditionsAccept}`
   - `onChange={(e) => onQuestionnaireChange('termsAndConditionsAccept', e.target.checked)}`

5. Label copy (example):  
   `I have read and accept the Terms and Conditions`

6. Error line if `errors.termsAndConditionsAccept` is set.

---

## 4. Validation (`validateStep2` or equivalent)

If `!answers.termsAndConditionsAccept`, set e.g.:

```ts
newErrors.termsAndConditionsAccept = 'You must read and accept the Terms and Conditions';
```

Place it with your other Step 2 required checks (e.g. after Medical Cost Sharing).

---

## 5. Questionnaire change handler typing

If checkboxes use the same handler as text fields, widen the value type:

- From: `(field, value: string) => void`
- To: `(field, value: string | boolean) => void`

Implement by spreading into `questionnaireAnswers` as you already do for other fields. Remove any `as any` on checkbox `checked` once types allow `boolean`.

---

## 6. Generated PDF (`generateEnrollmentPDF`)

### 6a. Questionnaire responses table

In the `questionnaireData` array that feeds `autoTable`, add a row **after** the Medical Cost Sharing row, e.g.:

- **Column 1 (label):** Short description that the applicant confirmed reading and accepting the full terms in the questionnaire.
- **Column 2 (value):** `YES` if `formData.questionnaireAnswers.termsAndConditionsAccept` is true, else `NO`.

Treat a missing field on old drafts as not accepted.

### 6b. Full terms body (multi-page)

After the questionnaire table:

1. Title: `Terms and Conditions` (bold, same style as other section headings).
2. Import `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT`.
3. Render with **wrapped lines** and **page breaks** (see `appendLegalTextPages` in [`generateEnrollmentPDF.ts`](../src/utils/generateEnrollmentPDF.ts)):
   - `doc.setFontSize(9)` (or 8–9 for long legal text).
   - `const lines = doc.splitTextToSize(TERMS_AND_CONDITIONS_ENROLLMENT_TEXT, pageWidth - 2 * marginX);`
   - Loop lines; if `y > pageHeight - bottomMargin`, `doc.addPage()` and reset `y` to your top margin (e.g. `20`).
   - `doc.text(lines[i], marginX, y);` then increment `y` by a fixed line height (e.g. `4.5` pt).

**Remove** any old duplicate “short terms” blurb that only repeated Medical Cost Sharing language if it would now be redundant with the full document.

---

## 7. Edge Functions / API

Usually **no** change: `termsAndConditionsAccept` lives inside `questionnaireAnswers` like other flags.

Deploy or update an Edge Function only if:

- Your backend strips unknown keys from `questionnaireAnswers`, or  
- You persist questionnaire fields individually and need a new column.

---

## 8. Replication checklist

- [ ] `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT` in one constants file.
- [ ] `termsAndConditionsAccept: boolean` in types and defaults (`false`).
- [ ] Step 2: section under MCS; gray box + scroll + checkbox + error.
- [ ] `validateStep2` requires acceptance.
- [ ] `onQuestionnaireChange` accepts `string | boolean`.
- [ ] PDF: table row YES/NO + full text with page breaks.
- [ ] Manual test: mobile scroll; submit blocked until checked; PDF contains full text and YES.

---

## 9. One-paragraph PR blurb

> Add a required Terms and Conditions section on Step 2 below Medical Cost Sharing Authorization: shared legal text in `src/constants/…`, scrollable gray panel and acceptance checkbox, validation in `validateStep2`, and PDF output with a questionnaire YES/NO row plus the full terms rendered across pages using `splitTextToSize` and explicit page breaks. No Edge Function changes unless the API filters questionnaire fields.
