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
