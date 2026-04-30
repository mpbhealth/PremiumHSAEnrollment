/**
 * Membership effective date options — see docs/effectiveDate.md.
 * Cutoff uses America/New_York; display labels use UTC against calendar-first-of-month.
 */

export interface EffectiveDateOption {
  display: string;
  value: string;
}

function getEasternCalendarParts(d: Date): {
  year: number;
  month0: number;
  dayOfMonth: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(d);
  let year = 0;
  let month = 1;
  let day = 1;
  for (const part of parts) {
    if (part.type === 'year') {
      year = parseInt(part.value, 10);
    }
    if (part.type === 'month') {
      month = parseInt(part.value, 10);
    }
    if (part.type === 'day') {
      day = parseInt(part.value, 10);
    }
  }
  return { year, month0: month - 1, dayOfMonth: day };
}

/** Add whole months to a calendar (year, month0); day anchored to 1st via UTC. */
function addCalendarMonths(
  year: number,
  month0: number,
  delta: number
): { year: number; month0: number } {
  const u = new Date(Date.UTC(year, month0 + delta, 1));
  return { year: u.getUTCFullYear(), month0: u.getUTCMonth() };
}

export function calculateEffectiveDates(): EffectiveDateOption[] {
  const { year, month0, dayOfMonth } = getEasternCalendarParts(new Date());
  const useLateBracket = dayOfMonth > 20;
  const addMonths = useLateBracket ? 2 : 1;
  const start = addCalendarMonths(year, month0, addMonths);

  const dates: EffectiveDateOption[] = [];
  for (let i = 0; i < 3; i++) {
    const { year: y, month0: m } = addCalendarMonths(start.year, start.month0, i);
    const monthStr = String(m + 1).padStart(2, '0');
    const valueFormat = `${monthStr}/01/${y}`;
    const utcMs = Date.UTC(y, m, 1);
    const displayFormat = new Date(utcMs).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    dates.push({
      display: displayFormat,
      value: valueFormat,
    });
  }

  return dates;
}
