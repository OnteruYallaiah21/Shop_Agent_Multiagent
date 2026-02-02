/**
 * Price Guard - Outlier Detection
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard detects significant price deviations that require human confirmation.
 * Implements the 40% threshold rule for price changes.
 */

// ============================================================================
// Price Guard Logic Start Here
// ============================================================================

export interface PriceOutlierResult {
  isOutlier: boolean;
  deviationPercent: number;
  oldPrice: number;
  newPrice: number;
  requiresConfirmation: boolean;
  riskFlag?: string;
  message?: string;
}

/**
 * Calculates price deviation percentage
 */
export function calculatePriceDeviation(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) {
    return newPrice > 0 ? 100 : 0;
  }
  return Math.abs((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Checks if price change exceeds the threshold (40%)
 * 
 * Rule: If |newPrice - oldPrice| / oldPrice > 40% → Require confirmation
 */
export function checkPriceOutlier(
  oldPrice: number,
  newPrice: number,
  threshold: number = 40
): PriceOutlierResult {
  const deviationPercent = calculatePriceDeviation(oldPrice, newPrice);
  const isOutlier = deviationPercent > threshold;

  const isIncrease = newPrice > oldPrice;
  const changeType = isIncrease ? 'increase' : 'decrease';
  const changeAmount = Math.abs(newPrice - oldPrice);

  let message: string | undefined;
  if (isOutlier) {
    message = `Large price ${changeType} detected: ${deviationPercent.toFixed(2)}% ($${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)})`;
  }

  return {
    isOutlier,
    deviationPercent,
    oldPrice,
    newPrice,
    requiresConfirmation: isOutlier,
    riskFlag: isOutlier ? 'PRICE_OUTLIER' : undefined,
    message,
  };
}

/**
 * Validates price change with outlier detection
 * 
 * Example:
 * Old price = 890
 * New price = 67
 * Deviation = 92% → BLOCK + Ask confirmation
 */
export function validatePriceChange(
  oldPrice: number,
  newPrice: number,
  threshold: number = 40
): PriceOutlierResult {
  // First check basic validation
  if (newPrice < 0) {
    return {
      isOutlier: false,
      deviationPercent: 0,
      oldPrice,
      newPrice,
      requiresConfirmation: false,
      riskFlag: 'INVALID_PRICE',
      message: 'Price cannot be negative',
    };
  }

  // Check for outlier
  return checkPriceOutlier(oldPrice, newPrice, threshold);
}

/**
 * Gets human-readable confirmation message for price outlier
 */
export function getPriceOutlierConfirmationMessage(
  sku: string,
  oldPrice: number,
  newPrice: number,
  deviationPercent: number
): string {
  const isIncrease = newPrice > oldPrice;
  const changeType = isIncrease ? 'increase' : 'drop';
  
  return `⚠️ This is a large price change (from $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)}, ${deviationPercent.toFixed(2)}% ${changeType}).

Please confirm:
"CONFIRM price change for ${sku} to $${newPrice.toFixed(2)}"`;
}

// ============================================================================
// Price Guard Logic End Here
// ============================================================================

