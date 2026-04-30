import { Dependent } from '../hooks/useEnrollmentStorage';

/** Monthly add-on when subscriber or any dependent uses tobacco (matches API and PDF). */
export const TOBACCO_USE_MONTHLY_FEE = 75;

export interface SecureHsaPricingOption {
  productId: string;
  price: number;
  iuaLevel: string;
  displayText: string;
}

export interface SecureHsaPricingResult {
  options: SecureHsaPricingOption[];
  isAvailable: boolean;
  errorMessage?: string;
  coverageType: string;
}

export interface SecureHsaPricing {
  productId: string;
  price: number;
  iuaLevel: '500' | '1000' | '1500' | '2500' | '5000';
  ageRange: '18-29' | '30-64';
  coverageType: 'Member Only' | 'Member + Spouse' | 'Member + Children' | 'Member + Family';
}

/** Monthly pricing by coverage, IUA, age band, and plan code (benefit id). Age bands: 18–29, 30–64. */
export const SECURE_HSA_PRICING: SecureHsaPricing[] = [
  // Member Only
  { productId: '3277', price: 390.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3277', price: 507.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3281', price: 332.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3281', price: 387.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3280', price: 310.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3280', price: 357.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3279', price: 291.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3279', price: 332.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3278', price: 272.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3278', price: 317.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member Only' },
  // Member + Spouse
  { productId: '3282', price: 849.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3282', price: 1047.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3283', price: 704.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3283', price: 771.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3284', price: 642.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3284', price: 700.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 585.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 650.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 546.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 613.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Spouse' },
  // Member + Children
  { productId: '3287', price: 753.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3287', price: 969.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3288', price: 639.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3288', price: 722.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3289', price: 587.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3289', price: 656.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3290', price: 538.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3290', price: 609.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3291', price: 510.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3291', price: 580.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Children' },
  // Member + Family
  { productId: '3292', price: 1185.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3292', price: 1443.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3293', price: 977.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3293', price: 1050.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3294', price: 887.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3294', price: 959.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3295', price: 804.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3295', price: 888.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3296', price: 753.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3296', price: 842.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Family' },
];

export function calculateAgeFromDOB(dob: string): number | null {
  if (!dob || dob.length !== 10) return null;

  const [month, day, year] = dob.split('/').map(num => parseInt(num, 10));
  if (!month || !day || !year) return null;

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Integer ages from primary and dependents where DOB parses; omit nulls.
 * Dependents without DOB contribute nothing until entered.
 * Someone 65+ includes their age in max → getAgeRange returns null → 18–64 message applies to household.
 */
function collectHouseholdAges(primaryDob: string, dependents: Dependent[]): number[] {
  const ages: number[] = [];
  const primaryAge = calculateAgeFromDOB(primaryDob);
  if (primaryAge !== null) {
    ages.push(primaryAge);
  }
  for (const dep of dependents) {
    const a = calculateAgeFromDOB(dep.dob || '');
    if (a !== null) {
      ages.push(a);
    }
  }
  return ages;
}

function getAgeRange(age: number): '18-29' | '30-64' | null {
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 64) return '30-64';
  return null;
}

export function getCoverageType(dependents: Dependent[]): 'Member Only' | 'Member + Spouse' | 'Member + Children' | 'Member + Family' {
  const spouseCount = dependents.filter(d => d.relationship === 'Spouse').length;
  const childCount = dependents.filter(d => d.relationship === 'Child').length;

  if (spouseCount === 0 && childCount === 0) return 'Member Only';
  if (spouseCount > 0 && childCount === 0) return 'Member + Spouse';
  if (spouseCount === 0 && childCount > 0) return 'Member + Children';
  return 'Member + Family';
}

/** Premium HSA / secure pricing: age band uses the oldest parseable age in the household (primary + dependents). */
export function getSecureHsaPricingOptions(memberDOB: string, dependents: Dependent[]): SecureHsaPricingResult {
  const ages = collectHouseholdAges(memberDOB, dependents);

  if (ages.length === 0) {
    return {
      options: [],
      isAvailable: false,
      errorMessage: 'Please enter a valid date of birth to see pricing options.',
      coverageType: 'Member Only',
    };
  }

  const pricingAge = Math.max(...ages);
  const ageRange = getAgeRange(pricingAge);

  if (!ageRange) {
    return {
      options: [],
      isAvailable: false,
      errorMessage: 'Coverage is available for members aged 18-64 only.',
      coverageType: 'Member Only',
    };
  }

  const coverageType = getCoverageType(dependents);

  const matchingPrices = SECURE_HSA_PRICING.filter(
    p => p.ageRange === ageRange && p.coverageType === coverageType
  );

  if (matchingPrices.length === 0) {
    return {
      options: [],
      isAvailable: false,
      errorMessage: 'No pricing options available for this configuration.',
      coverageType,
    };
  }

  const options: SecureHsaPricingOption[] = matchingPrices.map(p => ({
    productId: p.productId,
    price: p.price,
    iuaLevel: `$${p.iuaLevel}`,
    displayText: `$${p.price.toFixed(2)} per Month for ${coverageType} - $${p.iuaLevel} IUA (${p.productId})`,
  }));

  return {
    options,
    isAvailable: true,
    coverageType,
  };
}
