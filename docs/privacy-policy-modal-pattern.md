# PDF document in a modal (reusable pattern)

Use this when you need to **stop sending users to an external website** for a legal or policy document and instead show a **local PDF in an in-app popup** (modal), with a clear title on the button and in the dialog header.

Works for any document type — privacy policies, guidelines, terms of service, etc.

## What you deliver

1. A PDF in static assets (served as a normal URL, no import bundling required).
2. A button that opens a modal.
3. The modal title (e.g. `Privacy Policy | <Brand>`, `Sedera Guidelines`).
4. The PDF shown inside the modal (typically an `<iframe src="...">`).

## 1. Add the file

- Place the PDF under the **public** folder (Vite/React: `public/assets/`).
- Example path on disk: `public/assets/Your Document Name.pdf`
- The browser URL is **from the site root**: `/assets/Your Document Name.pdf`

**Encode spaces in the URL** so the link is reliable in all environments:

- Correct: `/assets/Your%20Document%20Name.pdf`
- Or build it in code: `` `/assets/${encodeURI('Your Document Name.pdf')}` `` (encodeURI keeps slashes; for a path segment only, `encodeURIComponent` on the filename is also fine)

## 2. Replace an external link with a button

If you currently have:

```tsx
<a href="https://example.com/some-document" target="_blank" rel="noopener noreferrer">
  Document Title
</a>
```

Switch to a **button** with `type="button"` (avoids submitting forms) and `onClick` that sets modal open state to `true`. Keep the same label and visual style as the old link for continuity.

## 3. State and effects (recommended)

- **`modalOpen`** (or a descriptive name like `guidelinesOpen`, `privacyPolicyOpen`) `useState(false)`.
- **Body scroll lock** while open: set `document.body.style.overflow = 'hidden'` in a `useEffect` when open, restore on cleanup.
- **Escape to close**: `useEffect` that listens for `keydown` on `window` and closes when `e.key === 'Escape'`, cleanup on unmount or when closed.

## 4. Modal structure (accessibility)

- **Backdrop**: full-screen, semi-transparent, `onClick` → close. Use `role="presentation"` on the backdrop if it is not interactive beyond closing.
- **Panel**: `onClick` with `e.stopPropagation()` so clicks on the content do not close the panel.
- **Dialog**: `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the heading's `id`.
- **Header**: visible `<h2 id="...">` with the same text as the button (or a slightly fuller title).
- **Close control**: button with `aria-label="Close <document name>"` (e.g. `"Close guidelines"`) and an icon.

## 5. PDF display

- Use an `<iframe title="...">` with a short, human-readable `title` (e.g. "Sedera Guidelines PDF").
- Either give the iframe a **bounded height** (e.g. `min(70vh, 800px)`), or use a **fixed-size dialog** and `h-full w-full` on the iframe so it fills the area below the header (see the **exact 896×722 popup** section at the end of this file).
- Rely on the browser's built-in PDF plugin when available. If the iframe is blank (strict browser settings or mobile quirks), add an optional "Open in new tab" link in the header pointing to the same PDF URL as a fallback.

## 6. Stacking and layout

- Use a high `z-index` (e.g. `z-[100]`) so the modal sits above the rest of the app.
- For flexible modals, `max-h-[90vh]` on the panel and `min-h-0` on the scroll/iframe region helps flex layouts not overflow on small screens.
- For a **fixed 896×722** dialog, use `h-[722px] max-h-[90vh]` and `w-[896px] max-w-[min(896px,calc(100vw-1rem))]` on the card so small viewports still fit.

## 7. Per-project checklist

- [ ] PDF path under `public/` and final URL (with encoding) correct.
- [ ] Button and modal title match product copy.
- [ ] No accidental form submit (`type="button"`).
- [ ] Close: header button, overlay click, Escape.
- [ ] Optional: body scroll lock while open.
- [ ] Commit the PDF; verify size is acceptable for the repo and hosting.

## Example constant

```ts
// Customize the filename to match your PDF
const DOC_PDF = `/assets/${encodeURIComponent('Your Document Name.pdf')}`;
```

This pattern has been used in **PremiumCare Enrollment** (Sedera Guidelines modal on Step 2), **Care+ Enrollment**, and **Direct Enrollment**.

---

## Exact 896×722 popup (drop-in reference)

Use this section to **replicate the same popup** in another project. Implementation source: `src/components/Step2Questionnaire.tsx`.

### Fixed dimensions (Tailwind)

| What | Classes / value |
|------|-----------------|
| **Width** | `w-[896px]` and `max-w-[min(896px,calc(100vw-1rem))]` so narrow phones don't overflow horizontally |
| **Height** | `h-[722px]` and `max-h-[90vh]` so short viewports don't exceed the screen |
| **Dialog shell** | `flex flex-col overflow-hidden rounded-lg bg-white shadow-xl` plus `min-h-0` on the card |
| **Header** | `shrink-0`, `border-b border-gray-200`, `px-4 py-3`, flex row for title + actions |
| **PDF region** | `min-h-0 flex-1 overflow-hidden p-2 sm:p-3` — iframe is `h-full w-full` inside this |

`role="dialog"`, `aria-modal="true"`, and `aria-labelledby="<your-id>"` sit on the **white card** (not the full-screen wrapper).

### PDF file and URL constant

Replace the filename with your own PDF:

```ts
const DOC_PDF = `/assets/${encodeURIComponent('Sedera HealthShare Privacy Policy.pdf')}`;
```

If you rename the file, change both the `public/assets/...` path and the string inside `encodeURIComponent(...)`.

**Dependencies:** [lucide-react](https://lucide.dev/) — `FileText` (opener button), `X` (close), `ExternalLink` ("Open in new tab").

### State + effects (body lock and Escape)

Replace `modalOpen` / `setModalOpen` with a descriptive name for your document (e.g. `guidelinesOpen`, `privacyPolicyOpen`).

```ts
const [modalOpen, setModalOpen] = useState(false);

useEffect(() => {
  if (!modalOpen) return;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setModalOpen(false);
  };
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', onKeyDown);
  return () => {
    document.body.style.overflow = prevOverflow;
    window.removeEventListener('keydown', onKeyDown);
  };
}, [modalOpen]);
```

### Open button (same label as the dialog title)

```tsx
<button
  type="button"
  onClick={() => setModalOpen(true)}
  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
>
  <FileText className="w-5 h-5" />
  Your Document Title
</button>
```

### Full modal markup (drop-in)

Customize: `DOC_PDF`, `modalOpen` / `setModalOpen`, the `id` and `aria-labelledby` pair, the `<h2>` title text, the iframe `title`, and the `aria-label` on the close button.

```tsx
{modalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
    <div
      role="presentation"
      className="absolute inset-0 bg-black/50"
      onClick={() => setModalOpen(false)}
    />
    <div
      className="relative z-10 flex h-[722px] max-h-[90vh] w-[896px] max-w-[min(896px,calc(100vw-1rem))] min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <h2
          id="doc-modal-title"
          className="pr-2 text-lg font-semibold text-gray-900 sm:text-xl"
        >
          Your Document Title
        </h2>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <a
            href={DOC_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-blue-800 hover:bg-blue-50"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close document"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        <iframe
          title="Your Document Title PDF"
          src={DOC_PDF}
          className="h-full w-full rounded border border-gray-200"
        />
      </div>
    </div>
  </div>
)}
```

### Close behavior (checklist)

- [ ] Backdrop click closes (`role="presentation"` layer).
- [ ] Clicks on the white card do **not** close (`stopPropagation` on the card).
- [ ] `Escape` closes (see effect above).
- [ ] Close button has a descriptive `aria-label` (e.g. `"Close guidelines"`).
- [ ] `type="button"` on open/close buttons so a surrounding `<form>` does not submit by accident.

### Replicating in a non–Tailwind / non-React project

- Outer overlay: `position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 0.5rem 1rem;`
- Backdrop: `position: absolute; inset: 0; background: rgb(0 0 0 / 0.5);`
- Card: `896px` × `722px` (max), `max-width: min(896px, calc(100vw - 1rem))`, `max-height: 90vh`, `display: flex; flex-direction: column; overflow: hidden; border-radius: 0.5rem; background: #fff; box-shadow: ...`
- Iframe container: `flex: 1; min-height: 0; overflow: hidden; padding: ...`
- Iframe: `width: 100%; height: 100%; box-sizing: border-box;` with a light border to match the rounded corners.
