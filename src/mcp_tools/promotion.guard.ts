/**
 * Promotion Guard - Promotion Validation and Business Rules
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard validates promotion operations including activation, deactivation,
 * usage limits, date ranges, and eligibility rules.
 */

// ============================================================================
// Promotion Guard Logic Start Here
// ============================================================================

export interface PromotionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskFlag?: string;
  canActivate?: boolean;
  canDeactivate?: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';
  type: 'percentage' | 'fixed_amount' | 'fixed_price' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  target: 'all' | 'specific_products' | 'specific_categories' | 'specific_collections';
  conditions?: Array<{
    type: string;
    value?: number | string | string[];
  }>;
  minimumPurchaseAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  stackable: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  codes?: Array<{
    id: string;
    promotionId: string;
    code: string;
    usageLimit?: number;
    usageLimitPerCustomer?: number;
    usageCount?: number;
    isActive: boolean;
  }>;
  excludeSaleItems?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validates if a promotion can be activated
 */
export function validatePromotionActivation(promotion: Promotion): PromotionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check current status
  if (promotion.status === 'active') {
    errors.push(`Promotion ${promotion.name} is already active`);
  }

  if (promotion.status === 'archived' || promotion.status === 'expired') {
    errors.push(`Cannot activate promotion ${promotion.name}. Status is ${promotion.status}`);
  }

  // Check usage limits
  if (promotion.usageLimit !== undefined && promotion.usageLimit > 0) {
    const currentUsage = promotion.usageCount || 0;
    if (currentUsage >= promotion.usageLimit) {
      errors.push(
        `Promotion ${promotion.name} has reached its usage limit (${promotion.usageLimit})`
      );
    }
  }

  // Check date ranges
  const now = new Date();
  if (promotion.startDate) {
    const startDate = new Date(promotion.startDate);
    if (now < startDate) {
      warnings.push(`Promotion start date is in the future: ${promotion.startDate}`);
    }
  }

  if (promotion.endDate) {
    const endDate = new Date(promotion.endDate);
    if (now > endDate) {
      errors.push(`Promotion end date has passed: ${promotion.endDate}`);
    }
  }

  // Check if promotion codes are active
  if (promotion.codes && promotion.codes.length > 0) {
    const activeCodes = promotion.codes.filter(code => code.isActive);
    if (activeCodes.length === 0) {
      warnings.push('No active promotion codes found');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'CANNOT_ACTIVATE_PROMOTION' : undefined,
    canActivate: errors.length === 0,
  };
}

/**
 * Validates if a promotion can be deactivated
 */
export function validatePromotionDeactivation(promotion: Promotion): PromotionValidationResult {
  const errors: string[] = [];

  if (promotion.status === 'paused' || promotion.status === 'draft') {
    errors.push(`Promotion ${promotion.name} is already ${promotion.status}`);
  }

  if (promotion.status === 'archived' || promotion.status === 'expired') {
    errors.push(`Cannot deactivate promotion ${promotion.name}. Status is ${promotion.status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'CANNOT_DEACTIVATE_PROMOTION' : undefined,
    canDeactivate: errors.length === 0,
  };
}

/**
 * Validates promotion eligibility for an order
 */
export function validatePromotionEligibility(
  promotion: Promotion,
  orderAmount: number,
  orderItems: any[]
): PromotionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if promotion is active
  if (promotion.status !== 'active') {
    errors.push(`Promotion ${promotion.name} is not active (status: ${promotion.status})`);
  }

  // Check minimum purchase amount
  if (promotion.minimumPurchaseAmount !== undefined) {
    if (orderAmount < promotion.minimumPurchaseAmount) {
      errors.push(
        `Order amount ($${orderAmount.toFixed(2)}) does not meet minimum purchase requirement ($${promotion.minimumPurchaseAmount.toFixed(2)})`
      );
    }
  }

  // Check usage limits
  if (promotion.usageLimit !== undefined && promotion.usageLimit > 0) {
    const currentUsage = promotion.usageCount || 0;
    if (currentUsage >= promotion.usageLimit) {
      errors.push(`Promotion has reached its usage limit (${promotion.usageLimit})`);
    }
  }

  // Check date ranges
  const now = new Date();
  if (promotion.startDate) {
    const startDate = new Date(promotion.startDate);
    if (now < startDate) {
      errors.push(`Promotion has not started yet (starts: ${promotion.startDate})`);
    }
  }

  if (promotion.endDate) {
    const endDate = new Date(promotion.endDate);
    if (now > endDate) {
      errors.push(`Promotion has expired (ended: ${promotion.endDate})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'PROMOTION_NOT_ELIGIBLE' : undefined,
  };
}

/**
 * Validates promotion value (discount amount/percentage)
 */
export function validatePromotionValue(
  promotion: Promotion,
  orderAmount: number
): PromotionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate percentage discounts
  if (promotion.type === 'percentage') {
    if (promotion.value < 0 || promotion.value > 100) {
      errors.push(`Invalid percentage value: ${promotion.value}% (must be between 0 and 100)`);
    }

    // Check maximum discount amount
    if (promotion.maximumDiscountAmount !== undefined) {
      const calculatedDiscount = (orderAmount * promotion.value) / 100;
      if (calculatedDiscount > promotion.maximumDiscountAmount) {
        warnings.push(
          `Calculated discount ($${calculatedDiscount.toFixed(2)}) exceeds maximum ($${promotion.maximumDiscountAmount.toFixed(2)})`
        );
      }
    }
  }

  // Validate fixed amount discounts
  if (promotion.type === 'fixed_amount') {
    if (promotion.value < 0) {
      errors.push(`Invalid fixed amount: $${promotion.value} (must be positive)`);
    }

    if (promotion.value > orderAmount) {
      warnings.push(
        `Discount amount ($${promotion.value.toFixed(2)}) exceeds order amount ($${orderAmount.toFixed(2)})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'INVALID_PROMOTION_VALUE' : undefined,
  };
}

// ============================================================================
// Promotion Guard Logic End Here
// ============================================================================


