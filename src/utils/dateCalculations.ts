export interface EffectiveDateOption {
  display: string;
  value: string;
}

export function calculateEffectiveDates(): EffectiveDateOption[] {
  const today = new Date();
  const currentDay = today.getDate();

  let startMonth: Date;

  if (currentDay < 20) {
    startMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else {
    startMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  }

  const dates: EffectiveDateOption[] = [];

  for (let i = 0; i < 3; i++) {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);

    const displayFormat = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = '01';
    const year = date.getFullYear();
    const valueFormat = `${month}/${day}/${year}`;

    dates.push({
      display: displayFormat,
      value: valueFormat,
    });
  }

  return dates;
}
