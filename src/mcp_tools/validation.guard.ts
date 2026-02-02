/**
 * Validation Guard - Schema and Value Checks
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard performs deterministic validation checks on entities and business rules.
 * Used by ValidationAgent to ensure data integrity before execution.
 */

// ============================================================================
// Validation Guard Logic Start Here
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskFlag?: string;
  requiresConfirmation?: boolean;
}

export interface EntityValidation {
  exists: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Validates if a SKU exists in the product catalog
 */
export function validateSkuExists(sku: string, products: any[]): EntityValidation {
  const variant = products.find(p => 
    p.variants && p.variants.some((v: any) => v.sku === sku)
  );

  if (!variant) {
    return {
      exists: false,
      isValid: false,
      errors: [`Product with SKU ${sku} not found`],
    };
  }

  return {
    exists: true,
    isValid: true,
    errors: [],
  };
}

/**
 * Validates if an order number exists
 */
export function validateOrderExists(orderNumber: string, orders: any[]): EntityValidation {
  const order = orders.find(o => o.orderNumber === orderNumber);

  if (!order) {
    return {
      exists: false,
      isValid: false,
      errors: [`Order with order number ${orderNumber} not found`],
    };
  }

  return {
    exists: true,
    isValid: true,
    errors: [],
  };
}

/**
 * Validates price value (must be non-negative)
 */
export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (price < 0) {
    errors.push('Price cannot be negative');
  }

  if (price === 0) {
    warnings.push('Price is set to zero');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'INVALID_PRICE' : undefined,
  };
}

/**
 * Validates product description length
 */
export function validateDescription(description: string, maxLength: number = 5000): ValidationResult {
  const errors: string[] = [];

  if (description.length > maxLength) {
    errors.push(`Description cannot exceed ${maxLength} characters`);
  }

  if (description.length === 0) {
    errors.push('Description cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'DESCRIPTION_TOO_LONG' : undefined,
  };
}

/**
 * Validates product slug format
 */
export function validateSlug(slug: string): ValidationResult {
  const errors: string[] = [];

  if (!slug || slug.length === 0) {
    errors.push('Slug cannot be empty');
  }

  // Slug should be lowercase, alphanumeric with hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    errors.push('Slug must be lowercase alphanumeric with hyphens only (e.g., "premium-wireless-headphones")');
  }

  if (slug.length > 255) {
    errors.push('Slug cannot exceed 255 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'INVALID_SLUG' : undefined,
  };
}

/**
 * Validates product variant SKU format
 */
export function validateSkuFormat(sku: string): ValidationResult {
  const errors: string[] = [];

  if (!sku || sku.length === 0) {
    errors.push('SKU cannot be empty');
  }

  if (sku.length > 100) {
    errors.push('SKU cannot exceed 100 characters');
  }

  // SKU should not contain special characters except hyphens and underscores
  const skuPattern = /^[A-Z0-9_-]+$/;
  if (!skuPattern.test(sku)) {
    errors.push('SKU must contain only uppercase letters, numbers, hyphens, and underscores');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'INVALID_SKU_FORMAT' : undefined,
  };
}

/**
 * Validates compare at price (should be higher than regular price)
 */
export function validateCompareAtPrice(price: number, compareAtPrice?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (compareAtPrice !== undefined) {
    if (compareAtPrice < 0) {
      errors.push('Compare at price cannot be negative');
    }

    if (compareAtPrice <= price) {
      warnings.push(
        `Compare at price ($${compareAtPrice.toFixed(2)}) should be higher than regular price ($${price.toFixed(2)})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'INVALID_COMPARE_AT_PRICE' : undefined,
  };
}

/**
 * Validates if product is active
 */
export function validateProductActive(product: any): ValidationResult {
  const errors: string[] = [];

  if (product.status !== 'active') {
    errors.push(`Product is ${product.status} and cannot be modified`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'PRODUCT_INACTIVE' : undefined,
  };
}

/**
 * Validates price against cost price (warning only)
 */
export function validatePriceVsCost(price: number, costPrice?: number): ValidationResult {
  const warnings: string[] = [];

  if (costPrice !== undefined && price < costPrice) {
    warnings.push(`Price ($${price}) is below cost price ($${costPrice})`);
  }

  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Comprehensive validation for product update operations
 */
export function validateProductUpdate(
  sku: string,
  newPrice: number | undefined,
  newDescription: string | undefined,
  products: any[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskFlag: string | undefined;

  // Validate SKU exists
  const skuValidation = validateSkuExists(sku, products);
  if (!skuValidation.exists) {
    return {
      valid: false,
      errors: skuValidation.errors,
      warnings: [],
      riskFlag: 'SKU_NOT_FOUND',
    };
  }

  // Find product
  const product = products.find(p => 
    p.variants && p.variants.some((v: any) => v.sku === sku)
  );
  const variant = product?.variants.find((v: any) => v.sku === sku);

  if (!product || !variant) {
    return {
      valid: false,
      errors: [`Product variant with SKU ${sku} not found`],
      warnings: [],
      riskFlag: 'SKU_NOT_FOUND',
    };
  }

  // Validate product is active
  const activeValidation = validateProductActive(product);
  if (!activeValidation.valid) {
    return activeValidation;
  }

  // Validate price if provided
  if (newPrice !== undefined) {
    const priceValidation = validatePrice(newPrice);
    if (!priceValidation.valid) {
      errors.push(...priceValidation.errors);
      riskFlag = priceValidation.riskFlag;
    }
    warnings.push(...priceValidation.warnings);

    // Check price vs cost
    if (variant.costPrice !== undefined) {
      const costValidation = validatePriceVsCost(newPrice, variant.costPrice);
      warnings.push(...costValidation.warnings);
    }
  }

  // Validate description if provided
  if (newDescription !== undefined) {
    const descValidation = validateDescription(newDescription);
    if (!descValidation.valid) {
      errors.push(...descValidation.errors);
      riskFlag = descValidation.riskFlag;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag,
  };
}

/**
 * Comprehensive validation for order operations
 */
export function validateOrderOperation(
  orderNumber: string,
  orders: any[]
): ValidationResult {
  const errors: string[] = [];

  // Validate order exists
  const orderValidation = validateOrderExists(orderNumber, orders);
  if (!orderValidation.exists) {
    return {
      valid: false,
      errors: orderValidation.errors,
      warnings: [],
      riskFlag: 'ORDER_NOT_FOUND',
    };
  }

  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

// ============================================================================
// Validation Guard Logic End Here
// ============================================================================

