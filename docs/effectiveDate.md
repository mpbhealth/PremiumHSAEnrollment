# Membership effective date dropdown (`effectiveDate`)

Reusable summary of **how** the enrollment app builds the **Membership Start Date** (`effectiveDate`) dropdown and **when** the options jump to the “later” set. Copy this behavior into another app when you want the **same rollover rule** anchored to Eastern time.

---

## Business rule

- **Timezone:** Interpret “today” and the **day-of-month cutoff** using **`America/New_York`** (automatic **EST ↔ EDT** transitions). Avoid a fixed `UTC-5` offset; it will be wrong half the year after DST ends.

- **Cutoff (“Option B”)**  
  - **Early schedule:** Applies for the **entire** Eastern calendar day **1 … 20** (including **through 11:59:59.999 PM** on that day’s midnight-to-midnight window in Eastern).  
  - **Late schedule:** Applies from **the first instant of Eastern calendar day 21** through the rest of that month.

  So the dropdown switches when the Eastern **date rolls from the 20th to the 21st**, not according to each user’s laptop local timezone.

- **Semantics** (equivalent legacy behavior used before timezone work):
  - **Early (`day ≤ 20` in Eastern):** The **first** selectable effective date is the **1st** of the **month after** the current Eastern month.
  - **Late (`day > 20` in Eastern):** The **first** selectable effective date is the **1st** of the calendar month **two months after** the current Eastern month (“skip” one extra month versus early).

---

## Dropdown shape (this repo)

- **Count:** Three options, consecutive calendar months starting at “first selectable month”.
- **`value` format:** `MM/DD/YYYY` with **day fixed to `01`** (membership billed / effective on the **first** of each month shown).
- **`display` format:** Friendly US string (long month name, day `1`, year), consistent with **`value`** (see Implementation notes).

---

## Implementation notes (recommended)

### 1. Eastern calendar primitives

Implement two reads from **`Intl`** with **`timeZone: 'America/New_York'`**:

1. **`easternYear` + `easternMonth`** (calendar month — use `formatToParts` for `year` and `numeric` `month`; convert month to zero-based if you emulate `Date` month indices).

2. **`easternDayOfMonth`** (`day: 'numeric'`) → integer **1 … 31**.

Do **not** use `today.getDate()` alone for policy; it is **browser local**.

### 2. Branch flag

```
useLateBracket = easternDayOfMonth > 20
```

- **Early** when `≤ 20` (full day **20** includes up through end-of-day Eastern on the 20th).
- **Late** when **`≥ 21`**.

### 3. Anchor the month math on Eastern calendar

Starting from **`(anchorYear, anchorMonth0)`** in Eastern:

```
addMonths = useLateBracket ? 2 : 1
(startYear, startMonth0) = anchor + addMonths  // normalized with year rollover
firstOptionMonth = clamp year/month arithmetic
second option = start + 1 month, third = start + 2 months (always first-of-month)
```

December + 2 must land in February of **next calendar year**. Use explicit month rollover (add/subtract **12**) or a well-tested calendar library (**Luxon**, **Temporal**, **`date-fns-tz`**).

### 4. Stable display vs stored `value`

To keep **`January 1, 2027`** formatting aligned with **`01/01/2027`** for every browser locale:

- Build each option as **`Date.UTC(year, month0, 1)`** or equivalent “pure calendar” arithmetic.
- When formatting **`display`** with **`toLocaleDateString`**, pass **`timeZone: 'UTC'`** so the label does not drift for users in UTC+/- timezones.

The **policy** timezone is **`America/New_York`** only for **what “today” and “cutoff day” mean** — the **labeled** first-of-month is a **neutral calendar** date encoded in **`value`**.

---

## Where it runs (this repo)

| Location | Role |
|----------|------|
| `src/utils/dateCalculations.ts` | `calculateEffectiveDates()` — rollover + option list |
| `src/hooks/useEnrollmentStorage.ts` | Default **`effectiveDate`** = first returned option |
| `src/components/Step2AddressInfo.tsx` | Renders dropdown from `calculateEffectiveDates()` |

Downstream payloads (PDF, edge functions) receive the chosen **`MM/01/YYYY`** string unchanged.

---

## Checklist — port to another stack

- [ ] Use **`America/New_York`** (or organizational equivalent) for **cutoff**, not **`getDate()` in local TZ**.
- [ ] **`useLate`** iff Eastern **day-of-month `> 20`** (early includes all of Eastern day **20**).
- [ ] Anchor **year/month offsets** off **Eastern** calendar month/year, same as rollover.
- [ ] Produce **three** consecutive first-of-month choices after computing **start**.
- [ ] Persist **`MM/01/YYYY`** (or ISO if your API insists) consistently with labels.
- [ ] Optionally recompute options when **`Date.now()` crosses Eastern midnight** (e.g. long-lived tabs) via interval or revisiting route focus — not required here but useful in portals open overnight.

---

## Related operational text (different concept)

Cancellation / billing copy elsewhere may cite **deadlines “on the 20th … Eastern”** for **portal forms**. That wording is **not** automatically wired to `calculateEffectiveDates()`; confirm with compliance before assuming one rule matches the other everywhere.
