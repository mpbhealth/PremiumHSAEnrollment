# Terms and Conditions section — replication guide (layout + behavior)

This document is the **canonical spec** for reproducing the Premium HSA Enrollment **Terms and Conditions** experience in a similar project. An implementer (or AI) should follow it **literally** so layout, typography, paragraph structure, bold rules, scroll behavior, PDF output, and validation match.

**Legal wording** lives only in [`src/constants/termsAndConditionsEnrollment.ts`](../src/constants/termsAndConditionsEnrollment.ts) (template literal). Do **not** duplicate the full legal text in this markdown file. When replicating to another repo, **paste your project’s approved text** into the same structure (paragraphs separated by blank lines only).

---

## Goals

- Gray legal copy in a **scrollable** region (same shell as Medical Cost Sharing Authorization).
- **Structured paragraphs**: one `<p>` per source paragraph; **tight** vertical rhythm (`leading-snug`, `mb-2` between paragraphs only — **not** `leading-relaxed`, **not** `whitespace-pre-wrap` on the whole document).
- **Semantic emphasis** (bold) on headings and lead-ins **without changing any words** — see [Bold and paragraph rules](#bold-and-paragraph-rules-must-match-exactly).
- **Checkbox** below the scroll area; **required** before advancing Step 2.
- **PDF**: same paragraph boundaries and **same bold rules** as the web UI, with wrapping and page breaks.
- **No Edge Function change** unless the API strips `questionnaireAnswers` keys.

---

## Reference files (Premium HSA Enrollment)

| Concern | File |
|--------|------|
| Legal text + paragraph split + plain export | [`src/constants/termsAndConditionsEnrollment.ts`](../src/constants/termsAndConditionsEnrollment.ts) |
| **Formatted layout (React)** | [`src/components/TermsAndConditionsFormatted.tsx`](../src/components/TermsAndConditionsFormatted.tsx) |
| Step 2 shell (heading, gray box, scroll, checkbox) | [`src/components/Step2Questionnaire.tsx`](../src/components/Step2Questionnaire.tsx) |
| Types + defaults | [`src/hooks/useEnrollmentStorage.ts`](../src/hooks/useEnrollmentStorage.ts) (`termsAndConditionsAccept`) |
| Validation | [`src/components/EnrollmentWizard.tsx`](../src/components/EnrollmentWizard.tsx) (`validateStep2`) |
| PDF table row + terms body | [`src/utils/generateEnrollmentPDF.ts`](../src/utils/generateEnrollmentPDF.ts) (`appendTermsBlocksToPdf`) |

---

## 1. Constants: raw text → paragraphs → plain string

Create `src/constants/termsAndConditionsEnrollment.ts`:

1. **`TERMS_AND_CONDITIONS_RAW`** — single template literal. **Paragraphs in the source are separated by one blank line** (i.e. `\n\n` between blocks). Do not use extra blank lines inside a paragraph.
2. **Derive paragraphs** (wording unchanged; only split/trim edges):

```ts
export const TERMS_AND_CONDITIONS_PARAGRAPHS: readonly string[] = TERMS_AND_CONDITIONS_RAW.trim()
  .split(/\n\n+/)
  .map((p) => p.trim());
```

3. **Plain export** (one newline between paragraphs — no blank lines):

```ts
export const TERMS_AND_CONDITIONS_ENROLLMENT_TEXT = TERMS_AND_CONDITIONS_PARAGRAPHS.join('\n');
```

Use `TERMS_AND_CONDITIONS_PARAGRAPHS` for UI and PDF formatting. Use `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT` only if something needs a single string (e.g. logging).

---

## 2. Bold and paragraph rules (must match exactly)

Apply to **each paragraph string** in order below. **Do not** trim or alter the string except where a rule explicitly uses `.slice()` on a known prefix. **Evaluation order matters** — use this sequence in both React and PDF.

### 2a. Full-paragraph semibold (exact string match)

Maintain a `Set` of paragraphs that render **entirely** as semibold / bold. In this repo they are:

- `Authorization to debit or withdraw funds.`
- `PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THIS WEBSITE.`
- `10DLC Messaging Disclaimer`

When porting to another product, **update this set** to match that product’s standalone title lines (exact full paragraph text as it appears after the `split`).

### 2b. Short colon headings

If **not** matched by §2a, and **all** of:

- `text.endsWith(':')`
- `text.length <= 120`
- `!text.includes('. ')` (excludes most body sentences that contain `". "`)

→ render **entire paragraph** semibold / bold (e.g. `Refund Policy:`, `Billing error:`, `Important:`).

### 2c. “For example:” lead-in

If `text.startsWith('For example:')`:

- Render **`For example:`** as semibold / bold.
- Append **`text.slice('For example:'.length)`** immediately after (no `trim()` — preserves exact spacing).

### 2d. Numbered sections `1.`–`19.` (not `11A.`)

Regex (same in JS):

```txt
/^(\d{1,2}\.\s[^.]+\.)([\s\S]*)$/
```

- Group **1**: semibold / bold (ends at first `….` after the section title).
- Group **2**: normal body — **concatenated with no extra space** (group 2 already includes any space after the title period).

### 2e. Section `11A.`

If `text.startsWith('11A.')`:

- Semibold / bold: **`11A.`** only (four characters: `1`, `1`, `A`, `.`).
- Remainder: **`text.slice(4)`** — preserves the space after `11A.` when present.

### 2f. Default

Otherwise: one paragraph, normal weight, `text-gray-700`.

---

## 3. React: `TermsAndConditionsFormatted` (copy this layout)

**Per-paragraph wrapper** — every paragraph uses the same base classes:

- `mb-2 last:mb-0 text-sm leading-snug`

**With semibold heading** (§2a, §2b): add `font-semibold text-gray-900` on the `<p>`.

**With mixed body** (§2c–§2e): `<p>` gets `text-gray-700`; semibold spans use `font-semibold text-gray-900`.

**Component**: map `TERMS_AND_CONDITIONS_PARAGRAPHS` to `TermsParagraph` with `key={index}`.

**Reference implementation** (keep in sync when editing):

```tsx
import { TERMS_AND_CONDITIONS_PARAGRAPHS } from '../constants/termsAndConditionsEnrollment';

const FULL_BOLD_EXACT = new Set([
  'Authorization to debit or withdraw funds.',
  'PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THIS WEBSITE.',
  '10DLC Messaging Disclaimer',
]);

function isShortColonHeading(text: string): boolean {
  if (!text.endsWith(':')) return false;
  if (text.length > 120) return false;
  if (text.includes('. ')) return false;
  return true;
}

function TermsParagraph({ text }: { text: string }) {
  const pClass = 'mb-2 last:mb-0 text-sm leading-snug';

  if (FULL_BOLD_EXACT.has(text)) {
    return <p className={`${pClass} font-semibold text-gray-900`}>{text}</p>;
  }

  if (isShortColonHeading(text)) {
    return <p className={`${pClass} font-semibold text-gray-900`}>{text}</p>;
  }

  if (text.startsWith('For example:')) {
    const rest = text.slice('For example:'.length);
    return (
      <p className={`${pClass} text-gray-700`}>
        <span className="font-semibold text-gray-900">For example:</span>
        {rest}
      </p>
    );
  }

  const numbered = text.match(/^(\d{1,2}\.\s[^.]+\.)([\s\S]*)$/);
  if (numbered) {
    return (
      <p className={`${pClass} text-gray-700`}>
        <span className="font-semibold text-gray-900">{numbered[1]}</span>
        {numbered[2]}
      </p>
    );
  }

  if (text.startsWith('11A.')) {
    return (
      <p className={`${pClass} text-gray-700`}>
        <span className="font-semibold text-gray-900">11A.</span>
        {text.slice(4)}
      </p>
    );
  }

  return <p className={`${pClass} text-gray-700`}>{text}</p>;
}

export function TermsAndConditionsFormatted() {
  return (
    <>
      {TERMS_AND_CONDITIONS_PARAGRAPHS.map((paragraph, index) => (
        <TermsParagraph key={index} text={paragraph} />
      ))}
    </>
  );
}
```

---

## 4. Step 2 shell (`Step2Questionnaire`) — exact structure

**Placement:** Immediately **after** the Medical Cost Sharing block (through its checkbox + error), **before** the Business Information fieldset (or your project’s next section).

**Imports:**

```ts
import { TermsAndConditionsFormatted } from './TermsAndConditionsFormatted';
```

**JSX pattern** (Tailwind — match class strings):

```tsx
<div className="border-t border-gray-200 pt-6 space-y-4">
  <p className="font-semibold text-gray-900">
    Terms and Conditions
    <span className="text-red-500 ml-1">*</span>
  </p>
  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
    <div
      role="region"
      aria-label="Terms and Conditions full text"
      className="max-h-[min(17.5rem,42vh)] sm:max-h-[min(18rem,40vh)] overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
    >
      <TermsAndConditionsFormatted />
    </div>
  </div>

  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      name="termsAndConditionsAccept"
      checked={answers.termsAndConditionsAccept}
      onChange={(e) => onQuestionnaireChange('termsAndConditionsAccept', e.target.checked)}
      className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
    />
    <span className="text-sm text-gray-700">
      I have read and accept the Terms and Conditions
    </span>
  </label>
  {errors.termsAndConditionsAccept && (
    <p className="mt-2 text-sm text-red-500">{errors.termsAndConditionsAccept}</p>
  )}
</div>
```

**Do not** put `whitespace-pre-wrap` or `leading-relaxed` on the scroll container — formatting comes from per-paragraph classes inside `TermsAndConditionsFormatted`.

---

## 5. Questionnaire state and validation

- Add **`termsAndConditionsAccept: boolean`** to `QuestionnaireAnswers`; default **`false`**.
- **`validateStep2`**: if `!answers.termsAndConditionsAccept`, set  
  `newErrors.termsAndConditionsAccept = 'You must read and accept the Terms and Conditions'`.
- **`onQuestionnaireChange`**: value type must allow **`string | boolean`** for checkbox fields.

---

## 6. PDF (`generateEnrollmentPDF`)

### 6a. Questionnaire table

After the Medical Cost Sharing row, add:

- **Label:** e.g. `Terms and Conditions — Applicant read and accepted the full text presented in the questionnaire`
- **Value:** `YES` / `NO` from `questionnaireAnswers.termsAndConditionsAccept` (missing ⇒ `NO`).

### 6b. Terms body — mirror §2 rules

After a **14 pt bold** title `Terms and Conditions` at `marginX` (e.g. `14`), increment `y` by **10**, then render **`TERMS_AND_CONDITIONS_PARAGRAPHS`** using the **same decision order** as §2:

- For each paragraph, use **`doc.setFontSize(9)`** and **`helvetica` bold or normal** per rule.
- Wrap with **`doc.splitTextToSize(text, maxWidth)`** where **`maxWidth = pageWidth - 28`** (when `marginX = 14`).
- **Line height `4.5`**, **`bottomMargin` ~`22`** for page breaks; **`y = 20`** after `addPage()`.
- For **`For example:`**, render bold block then normal block using **`para.slice('For example:'.length)`** (no trim).
- For **numbered** paragraphs, **`appendWrapped(numbered[1], true)`** then **`appendWrapped(numbered[2], false)`**.
- For **`11A.`**, **`appendWrapped('11A.', true)`** then **`appendWrapped(para.slice(4), false)`**.

Reference: function **`appendTermsBlocksToPdf`** in [`generateEnrollmentPDF.ts`](../src/utils/generateEnrollmentPDF.ts).

---

## 7. Edge Functions / API

Usually **no** change. Deploy only if the backend drops unknown `questionnaireAnswers` keys.

---

## 8. Replication checklist

- [ ] `TERMS_AND_CONDITIONS_RAW` + `TERMS_AND_CONDITIONS_PARAGRAPHS` + `TERMS_AND_CONDITIONS_ENROLLMENT_TEXT` as in §1.
- [ ] `TermsAndConditionsFormatted` (or equivalent) matches §2–§3 **including evaluation order**.
- [ ] `FULL_BOLD_EXACT` updated for the target product if standalone titles differ.
- [ ] Step 2 shell matches §4 (classes, structure, `name="termsAndConditionsAccept"`).
- [ ] `termsAndConditionsAccept` in types/defaults; `validateStep2` + handler typing.
- [ ] PDF: table row + `appendTermsBlocksToPdf` (or equivalent) per §6b.
- [ ] Manual test: mobile scroll; blocked submit until checked; PDF matches web emphasis and full text.

---

## 9. One-paragraph PR blurb

> Add required Terms and Conditions below Medical Cost Sharing: legal text as `TERMS_AND_CONDITIONS_RAW` split into `TERMS_AND_CONDITIONS_PARAGRAPHS`; `TermsAndConditionsFormatted` with tight `leading-snug` / `mb-2` paragraphs and deterministic bold rules (exact titles, short colon lines, `For example:`, numbered `N. …`, `11A.`); Step 2 gray scroll shell and checkbox; PDF mirrors the same rules via `appendTermsBlocksToPdf`. No Edge Function change unless questionnaire fields are filtered.
