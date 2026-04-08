import { supabase } from '../lib/supabaseClient';
import { AppliedPromo } from '../hooks/useEnrollmentStorage';

export interface PromoCodeValidationResult {
  success: boolean;
  promo?: AppliedPromo;
  error?: string;
}

export async function validatePromoCode(
  code: string
): Promise<PromoCodeValidationResult> {
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'Please enter a promo code',
    };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const { data, error } = await supabase
      .from('promocodes')
      .select('code, product, discount_amount')
      .eq('code', normalizedCode)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Error validating promo code:', error);
      return {
        success: false,
        error: 'Error validating promo code. Please try again.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Invalid promo code',
      };
    }

    return {
      success: true,
      promo: {
        code: data.code,
        product: data.product,
        discountAmount: parseFloat(data.discount_amount),
      },
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

export function applyPromoDiscount(
  initialPayment: number,
  appliedPromo: AppliedPromo | null
): number {
  if (!appliedPromo) {
    return initialPayment;
  }

  const discountedAmount = initialPayment - appliedPromo.discountAmount;
  return Math.max(0, discountedAmount);
}
