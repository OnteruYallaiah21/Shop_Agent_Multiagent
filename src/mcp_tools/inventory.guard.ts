/**
 * Inventory Guard - Inventory Level and Stock Validation
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard validates inventory levels, stock availability, and inventory policies.
 * Prevents operations that would result in negative inventory or violate inventory policies.
 */

// ============================================================================
// Inventory Guard Logic Start Here
// ============================================================================

export interface InventoryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskFlag?: string;
  availableQuantity?: number;
  requestedQuantity?: number;
}

export interface InventoryLevel {
  id: string;
  variantId: string;
  locationId: string;
  available: number;
  reserved: number;
  committed: number;
  onHand: number;
  incoming: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  inventoryPolicy: 'deny' | 'continue';
  trackInventory: boolean;
  updatedAt: string;
}

/**
 * Validates if sufficient inventory is available for a quantity request
 */
export function validateInventoryAvailability(
  variantId: string,
  requestedQuantity: number,
  inventoryLevels: InventoryLevel[]
): InventoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find inventory levels for this variant
  const variantInventory = inventoryLevels.filter(inv => inv.variantId === variantId);

  if (variantInventory.length === 0) {
    return {
      valid: false,
      errors: [`No inventory found for variant ${variantId}`],
      warnings: [],
      riskFlag: 'INVENTORY_NOT_FOUND',
      requestedQuantity,
    };
  }

  // Calculate total available across all locations
  const totalAvailable = variantInventory.reduce((sum, inv) => sum + inv.available, 0);

  // Check if inventory tracking is enabled
  const hasTracking = variantInventory.some(inv => inv.trackInventory);
  if (!hasTracking) {
    // If tracking is disabled, allow the operation
    return {
      valid: true,
      errors: [],
      warnings: ['Inventory tracking is disabled for this variant'],
      availableQuantity: totalAvailable,
      requestedQuantity,
    };
  }

  // Check inventory policy
  const hasDenyPolicy = variantInventory.some(inv => inv.inventoryPolicy === 'deny');
  
  if (hasDenyPolicy && requestedQuantity > totalAvailable) {
    errors.push(
      `Insufficient inventory. Available: ${totalAvailable}, Requested: ${requestedQuantity}`
    );
  }

  // Check safety stock
  for (const inv of variantInventory) {
    if (inv.available - requestedQuantity < inv.safetyStock) {
      warnings.push(
        `Inventory at location ${inv.locationId} will fall below safety stock (${inv.safetyStock}) after this operation`
      );
    }
  }

  // Check reorder point
  for (const inv of variantInventory) {
    if (inv.available - requestedQuantity <= inv.reorderPoint && inv.available > inv.reorderPoint) {
      warnings.push(
        `Inventory at location ${inv.locationId} will reach reorder point (${inv.reorderPoint})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'INSUFFICIENT_INVENTORY' : undefined,
    availableQuantity: totalAvailable,
    requestedQuantity,
  };
}

/**
 * Validates inventory adjustment (increase/decrease stock)
 */
export function validateInventoryAdjustment(
  variantId: string,
  adjustmentQuantity: number,
  inventoryLevels: InventoryLevel[]
): InventoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find inventory levels for this variant
  const variantInventory = inventoryLevels.filter(inv => inv.variantId === variantId);

  if (variantInventory.length === 0) {
    return {
      valid: false,
      errors: [`No inventory found for variant ${variantId}`],
      warnings: [],
      riskFlag: 'INVENTORY_NOT_FOUND',
    };
  }

  // Calculate new on-hand quantity after adjustment
  for (const inv of variantInventory) {
    const newOnHand = inv.onHand + adjustmentQuantity;

    // Cannot have negative inventory
    if (newOnHand < 0) {
      errors.push(
        `Adjustment would result in negative inventory at location ${inv.locationId}. ` +
        `Current: ${inv.onHand}, Adjustment: ${adjustmentQuantity}`
      );
    }

    // Warn if adjustment is very large
    if (Math.abs(adjustmentQuantity) > 1000) {
      warnings.push(`Large inventory adjustment detected: ${adjustmentQuantity} units`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskFlag: errors.length > 0 ? 'INVALID_INVENTORY_ADJUSTMENT' : undefined,
  };
}

/**
 * Validates if inventory can be reserved for an order
 */
export function validateInventoryReservation(
  variantId: string,
  quantity: number,
  inventoryLevels: InventoryLevel[]
): InventoryValidationResult {
  const errors: string[] = [];

  const variantInventory = inventoryLevels.filter(inv => inv.variantId === variantId);

  if (variantInventory.length === 0) {
    return {
      valid: false,
      errors: [`No inventory found for variant ${variantId}`],
      warnings: [],
      riskFlag: 'INVENTORY_NOT_FOUND',
      requestedQuantity: quantity,
    };
  }

  // Check if we can reserve the quantity
  const totalAvailable = variantInventory.reduce((sum, inv) => sum + inv.available, 0);

  if (quantity > totalAvailable) {
    errors.push(
      `Cannot reserve ${quantity} units. Only ${totalAvailable} units available.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    riskFlag: errors.length > 0 ? 'INSUFFICIENT_INVENTORY' : undefined,
    availableQuantity: totalAvailable,
    requestedQuantity: quantity,
  };
}

// ============================================================================
// Inventory Guard Logic End Here
// ============================================================================


