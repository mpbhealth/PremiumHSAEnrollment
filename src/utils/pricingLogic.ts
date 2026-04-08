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
  iuaLevel: '1000' | '1250' | '2500' | '5000';
  ageRange: '18-29' | '30-49' | '50-64';
  coverageType: 'Member Only' | 'Member + Spouse' | 'Member + Children' | 'Member + Family';
}

export const SECURE_HSA_PRICING: SecureHsaPricing[] = [
  { productId: '10334', price: 326.00, iuaLevel: '1250', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '10334', price: 359.00, iuaLevel: '1250', ageRange: '30-49', coverageType: 'Member Only' },
  { productId: '10334', price: 448.00, iuaLevel: '1250', ageRange: '50-64', coverageType: 'Member Only' },
  { productId: '3279', price: 257.00, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3279', price: 289.00, iuaLevel: '2500', ageRange: '30-49', coverageType: 'Member Only' },
  { productId: '3279', price: 391.00, iuaLevel: '2500', ageRange: '50-64', coverageType: 'Member Only' },
  { productId: '3278', price: 239.00, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member Only' },
  { productId: '3278', price: 266.00, iuaLevel: '5000', ageRange: '30-49', coverageType: 'Member Only' },
  { productId: '3278', price: 320.00, iuaLevel: '5000', ageRange: '50-64', coverageType: 'Member Only' },
  { productId: '10335', price: 576.00, iuaLevel: '1250', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '10335', price: 603.00, iuaLevel: '1250', ageRange: '30-49', coverageType: 'Member + Spouse' },
  { productId: '10335', price: 774.00, iuaLevel: '1250', ageRange: '50-64', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 448.00, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 488.00, iuaLevel: '2500', ageRange: '30-49', coverageType: 'Member + Spouse' },
  { productId: '3285', price: 646.00, iuaLevel: '2500', ageRange: '50-64', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 393.00, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 450.00, iuaLevel: '5000', ageRange: '30-49', coverageType: 'Member + Spouse' },
  { productId: '3286', price: 551.00, iuaLevel: '5000', ageRange: '50-64', coverageType: 'Member + Spouse' },
  { productId: '10336', price: 576.00, iuaLevel: '1250', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '10336', price: 603.00, iuaLevel: '1250', ageRange: '30-49', coverageType: 'Member + Children' },
  { productId: '10336', price: 774.00, iuaLevel: '1250', ageRange: '50-64', coverageType: 'Member + Children' },
  { productId: '3290', price: 448.00, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3290', price: 488.00, iuaLevel: '2500', ageRange: '30-49', coverageType: 'Member + Children' },
  { productId: '3290', price: 646.00, iuaLevel: '2500', ageRange: '50-64', coverageType: 'Member + Children' },
  { productId: '3291', price: 393.00, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Children' },
  { productId: '3291', price: 450.00, iuaLevel: '5000', ageRange: '30-49', coverageType: 'Member + Children' },
  { productId: '3291', price: 551.00, iuaLevel: '5000', ageRange: '50-64', coverageType: 'Member + Children' },
  { productId: '10337', price: 816.00, iuaLevel: '1250', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '10337', price: 817.00, iuaLevel: '1250', ageRange: '30-49', coverageType: 'Member + Family' },
  { productId: '10337', price: 1070.00, iuaLevel: '1250', ageRange: '50-64', coverageType: 'Member + Family' },
  { productId: '3295', price: 642.00, iuaLevel: '2500', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3295', price: 679.00, iuaLevel: '2500', ageRange: '30-49', coverageType: 'Member + Family' },
  { productId: '3295', price: 852.00, iuaLevel: '2500', ageRange: '50-64', coverageType: 'Member + Family' },
  { productId: '3296', price: 564.00, iuaLevel: '5000', ageRange: '18-29', coverageType: 'Member + Family' },
  { productId: '3296', price: 598.00, iuaLevel: '5000', ageRange: '30-49', coverageType: 'Member + Family' },
  { productId: '3296', price: 753.00, iuaLevel: '5000', ageRange: '50-64', coverageType: 'Member + Family' },
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

function getAgeRange(age: number): '18-29' | '30-49' | '50-64' | null {
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 49) return '30-49';
  if (age >= 50 && age <= 64) return '50-64';
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
