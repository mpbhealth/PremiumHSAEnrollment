import { Dependent } from '../hooks/useEnrollmentStorage';

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
  { productId: '3277', price: 296.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3277', price: 409.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3281', price: 249.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3281', price: 299.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3280', price: 223.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3280', price: 267.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3279', price: 206.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3279', price: 246.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member Only' },
  { productId: '3278', price: 194.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3278', price: 230.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member Only' },
  // Member + Spouse
  { productId: '3282', price: 673.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3282', price: 856.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3283', price: 535.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3283', price: 603.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3284', price: 479.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3284', price: 532.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 429.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 487.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 396.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 461.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Spouse' },
  // Member + Children
  { productId: '3287', price: 599.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3287', price: 783.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3288', price: 481.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3288', price: 558.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3289', price: 433.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3289', price: 497.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3290', price: 387.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3290', price: 454.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Children' },
  { productId: '3291', price: 363.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3291', price: 427.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Children' },
  // Member + Family
  { productId: '3292', price: 988.0, iuaLevel: '500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3292', price: 1225.0, iuaLevel: '500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3293', price: 794.0, iuaLevel: '1000', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3293', price: 877.0, iuaLevel: '1000', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3294', price: 711.0, iuaLevel: '1500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3294', price: 777.0, iuaLevel: '1500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3295', price: 630.0, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3295', price: 712.0, iuaLevel: '2500', ageRange: '30-64', coverageType: 'Member + Family' },
  { productId: '3296', price: 584.0, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3296', price: 670.0, iuaLevel: '5000', ageRange: '30-64', coverageType: 'Member + Family' },
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

export function getSecureHsaPricingOptions(memberDOB: string, dependents: Dependent[]): SecureHsaPricingResult {
  const age = calculateAgeFromDOB(memberDOB);

  if (age === null) {
    return {
      options: [],
      isAvailable: false,
      errorMessage: 'Please enter a valid date of birth to see pricing options.',
      coverageType: 'Member Only',
    };
  }

  const ageRange = getAgeRange(age);

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
