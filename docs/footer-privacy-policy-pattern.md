# Moving the privacy policy into the footer (reusable pattern)

Use this when a **privacy (or legal) PDF modal** is currently opened from a wizard step or inline button, and you want the **trigger next to the copyright line in the site footer** instead—while **keeping the same modal** (896×722 PDF in an iframe, backdrop, Escape, “Open in new tab”).

**PremiumCare reference:** `src/App.tsx` (footer + modal), `src/components/Step2Questionnaire.tsx` (Guidelines-only button; no privacy trigger there).

**Related:** Modal shell and accessibility details are in [privacy-policy-modal-pattern.md](./privacy-policy-modal-pattern.md).

---

## What you deliver

1. **Remove** the privacy-policy opener from the old location (e.g. Step 2 questionnaire).
2. **Add** `privacyPolicyOpen` state and scroll-lock / Escape `useEffect` at the **app shell** level (root `App` or shared layout), not inside a nested step—so the control works on every page that renders that footer.
3. **Render** the same PDF modal **next to the root layout** (often as a sibling after `</footer>`, still inside a fragment wrapping the page).
4. **Footer UI:** place the copyright and the policy control on one row (wrapping on small screens), with styling that matches your muted legal line (see below).

---

## 1. Lift state and modal to the app root

- Define the PDF URL once (encode spaces in the filename):

```ts
const PRIVACY_POLICY_PDF = `/assets/${encodeURIComponent('Your Privacy Policy.pdf')}`;
```

- Add `const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);`
- Reuse the same `useEffect` pattern as in the modal doc: when open, lock `document.body.style.overflow`, listen for `Escape`, restore on cleanup.

**Important:** If your app has **multiple top-level routes** (e.g. `/encrypt` vs main enrollment), either:

- Render the footer + modal only on routes where users should see it, or  
- Duplicate the footer block on those routes, or  
- Extract a `AppShell` component that wraps `{children}` and owns `privacyPolicyOpen` + modal.

---

## 2. Wrap the main layout in a fragment and mount the modal outside the scroll area

Structure:

```tsx
return (
  <>
    <div className="min-h-screen flex flex-col">
      {/* main content */}
      <footer>...</footer>
    </div>

    {privacyPolicyOpen && (
      /* full-screen overlay + dialog card + iframe — same as privacy-policy-modal-pattern.md */
    )}
  </>
);
```

Rendering the modal **outside** the inner `min-h-screen` column avoids z-index / overflow surprises. Use a high `z-index` (e.g. `z-[100]`) on the overlay.

---

## 3. Footer row: copyright + policy control

- Put the **copyright** and **policy** on one flex row with `flex-wrap`, `justify-center` on mobile and `justify-end` on larger breakpoints if your design is right-aligned.
- Use a **`<button type="button">`** for the policy label (not a link to an external URL), with `onClick={() => setPrivacyPolicyOpen(true)}`.
- Optional: a subtle `|` separator between copyright and button on `sm+` (`aria-hidden` on the separator).

**Muted styling (match secondary footer copy):** avoid primary link blue if you want it to look like legal fine print. Example (Tailwind):

```tsx
<button
  type="button"
  onClick={() => setPrivacyPolicyOpen(true)}
  className="text-xs text-gray-500 hover:text-gray-600 hover:underline p-0 m-0 bg-transparent border-0 cursor-pointer font-normal"
>
  Your policy label
</button>
```

Align with an existing line such as “Ensuring privacy and compliance…” by using the same `text-xs` and `text-gray-500` (or your design tokens).

---

## 4. Clean up the old location

- Delete the privacy **button** and the **privacy modal JSX** from the step component.
- If that step had a **combined** `useEffect` for two modals (e.g. guidelines + privacy), narrow the dependency array and Escape handler to **only** the modal that remains there (e.g. guidelines only).
- Remove unused imports (`ExternalLink` / `X`) from the step file if nothing else needs them.

---

## 5. Dependencies

- [lucide-react](https://lucide.dev/) on the **app shell** for the modal: `X`, `ExternalLink` (same as the pattern doc).

---

## Checklist

- [ ] PDF path under `public/` and `encodeURIComponent` filename correct.
- [ ] Privacy opener removed from wizard/step; no duplicate modals.
- [ ] `privacyPolicyOpen` + body scroll lock + Escape live with the footer’s parent layout.
- [ ] Modal markup matches your standard (backdrop click, `stopPropagation` on card, `role="dialog"`, `aria-labelledby`, iframe `title`).
- [ ] Footer button is `type="button"` (no accidental form submit).
- [ ] Multi-route app: footer + modal appear (or are intentionally omitted) on the right routes.
- [ ] Visual: policy control matches copyright / compliance line weight and color if required by design.
