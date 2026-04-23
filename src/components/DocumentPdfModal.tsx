import { X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

export interface DocumentPdfModalProps {
  open: boolean;
  onClose: () => void;
  /** Full URL or path to the PDF (e.g. `/assets/...` or `https://...`) */
  pdfSrc: string;
  /** Visible title in the dialog header (matches open button label) */
  title: string;
  /** Short label for the iframe (accessibility) */
  iframeTitle: string;
  /** e.g. "Close guidelines" */
  closeAriaLabel: string;
  /** id for aria-labelledby — must be unique when multiple modals exist in the DOM */
  titleId: string;
}

export default function DocumentPdfModal({
  open,
  onClose,
  pdfSrc,
  title,
  iframeTitle,
  closeAriaLabel,
  titleId,
}: DocumentPdfModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex h-[722px] max-h-[90vh] w-[896px] max-w-[min(896px,calc(100vw-1rem))] min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <h2
            id={titleId}
            className="pr-2 text-lg font-semibold text-gray-900 sm:text-xl"
          >
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={pdfSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-blue-800 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Open in new tab</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label={closeAriaLabel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
          <iframe
            title={iframeTitle}
            src={pdfSrc}
            className="h-full w-full rounded border border-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
