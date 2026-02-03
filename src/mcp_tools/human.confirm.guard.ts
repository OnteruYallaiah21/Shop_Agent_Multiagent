/**
 * Human Confirm Guard - Human-in-the-Loop (HITL) Confirmation Logic
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard manages human confirmation requirements for high-risk operations.
 * Determines when to pause workflow and request human approval.
 */

// ============================================================================
// Human Confirm Guard Logic Start Here
// ============================================================================

export interface ConfirmationRequest {
  requiresConfirmation: boolean;
  riskFlag: string;
  reason: string;
  originalValue?: any;
  requestedValue?: any;
  confirmationMessage: string;
}

export interface ConfirmationState {
  pending: boolean;
  riskFlag?: string;
  intent?: string;
  entity?: any;
  originalValue?: any;
  requestedValue?: any;
  timestamp?: string;
}

/**
 * Thresholds for triggering human confirmation
 */
const CONFIRMATION_THRESHOLDS = {
  INTENT_CONFIDENCE: 0.75,
  PRICE_DEVIATION_PERCENT: 40,
  RISK_SCORE: 0.6,
};

/**
 * Checks if intent confidence is too low (requires confirmation)
 */
export function checkIntentConfidence(confidence: number): ConfirmationRequest {
  const requiresConfirmation = confidence < CONFIRMATION_THRESHOLDS.INTENT_CONFIDENCE;

  return {
    requiresConfirmation,
    riskFlag: requiresConfirmation ? 'LOW_CONFIDENCE' : '',
    reason: requiresConfirmation
      ? `Intent confidence (${(confidence * 100).toFixed(1)}%) is below threshold (${(CONFIRMATION_THRESHOLDS.INTENT_CONFIDENCE * 100)}%)`
      : '',
    confirmationMessage: requiresConfirmation
      ? `⚠️ Low confidence detected (${(confidence * 100).toFixed(1)}%). Please confirm your intent.`
      : '',
  };
}

/**
 * Checks if entity extraction is incomplete (requires confirmation)
 */
export function checkEntityCompleteness(
  intent: string,
  requiredEntities: string[],
  extractedEntities: Record<string, any>
): ConfirmationRequest {
  const missingEntities: string[] = [];
  const ambiguousEntities: string[] = [];

  for (const entity of requiredEntities) {
    const value = extractedEntities[entity];
    if (value === null || value === undefined || value === '') {
      missingEntities.push(entity);
    } else if (typeof value === 'string' && value.toLowerCase() === 'ambiguous') {
      ambiguousEntities.push(entity);
    }
  }

  const requiresConfirmation = missingEntities.length > 0 || ambiguousEntities.length > 0;

  let reason = '';
  if (missingEntities.length > 0) {
    reason += `Missing entities: ${missingEntities.join(', ')}. `;
  }
  if (ambiguousEntities.length > 0) {
    reason += `Ambiguous entities: ${ambiguousEntities.join(', ')}.`;
  }

  return {
    requiresConfirmation,
    riskFlag: requiresConfirmation ? 'INCOMPLETE_ENTITIES' : '',
    reason: reason.trim(),
    confirmationMessage: requiresConfirmation
      ? `⚠️ Unable to extract all required information. ${reason}Please provide more details.`
      : '',
  };
}

/**
 * Checks if price change requires confirmation (price outlier)
 */
export function checkPriceChangeConfirmation(
  oldPrice: number,
  newPrice: number,
  sku: string
): ConfirmationRequest {
  const deviationPercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  const requiresConfirmation = deviationPercent > CONFIRMATION_THRESHOLDS.PRICE_DEVIATION_PERCENT;

  const isIncrease = newPrice > oldPrice;
  const changeType = isIncrease ? 'increase' : 'drop';

  return {
    requiresConfirmation,
    riskFlag: requiresConfirmation ? 'PRICE_OUTLIER' : '',
    reason: requiresConfirmation
      ? `Price deviation (${deviationPercent.toFixed(2)}%) exceeds threshold (${CONFIRMATION_THRESHOLDS.PRICE_DEVIATION_PERCENT}%)`
      : '',
    originalValue: oldPrice,
    requestedValue: newPrice,
    confirmationMessage: requiresConfirmation
      ? `⚠️ This is a large price change (from $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)}, ${deviationPercent.toFixed(2)}% ${changeType}).

Please confirm:
"CONFIRM price change for ${sku} to $${newPrice.toFixed(2)}"`
      : '',
  };
}

/**
 * Checks if operation is high-risk and requires confirmation
 */
export function checkHighRiskOperation(
  intent: string,
  riskScore?: number
): ConfirmationRequest {
  const highRiskIntents = [
    'UPDATE_PRODUCT_PRICE',
    'ARCHIVE_PRODUCT', // DELETE_PRODUCT is FORBIDDEN - use ARCHIVE_PRODUCT instead
    'REFUND_ORDER',
    'INVENTORY_RESET',
  ];

  const isHighRisk = highRiskIntents.includes(intent);
  const riskScoreHigh = riskScore !== undefined && riskScore > CONFIRMATION_THRESHOLDS.RISK_SCORE;
  const requiresConfirmation = isHighRisk || riskScoreHigh;

  return {
    requiresConfirmation,
    riskFlag: requiresConfirmation ? 'HIGH_RISK_OPERATION' : '',
    reason: requiresConfirmation
      ? isHighRisk
        ? `Operation ${intent} is classified as high-risk`
        : `Risk score (${riskScore}) exceeds threshold (${CONFIRMATION_THRESHOLDS.RISK_SCORE})`
      : '',
    confirmationMessage: requiresConfirmation
      ? `⚠️ This is a high-risk operation. Please confirm before proceeding.`
      : '',
  };
}

/**
 * Determines if human confirmation is required based on multiple factors
 */
export function requiresHumanConfirmation(
  intent: string,
  confidence: number,
  riskFlag?: string,
  riskScore?: number,
  priceChange?: { oldPrice: number; newPrice: number; sku: string },
  entityCompleteness?: { required: string[]; extracted: Record<string, any> }
): ConfirmationRequest {
  // Check intent confidence
  const confidenceCheck = checkIntentConfidence(confidence);
  if (confidenceCheck.requiresConfirmation) {
    return confidenceCheck;
  }

  // Check entity completeness
  if (entityCompleteness) {
    const entityCheck = checkEntityCompleteness(
      intent,
      entityCompleteness.required,
      entityCompleteness.extracted
    );
    if (entityCheck.requiresConfirmation) {
      return entityCheck;
    }
  }

  // Check price outlier
  if (priceChange && intent === 'UPDATE_PRODUCT_PRICE') {
    const priceCheck = checkPriceChangeConfirmation(
      priceChange.oldPrice,
      priceChange.newPrice,
      priceChange.sku
    );
    if (priceCheck.requiresConfirmation) {
      return priceCheck;
    }
  }

  // Check high-risk operations
  const riskCheck = checkHighRiskOperation(intent, riskScore);
  if (riskCheck.requiresConfirmation) {
    return riskCheck;
  }

  // Check specific risk flags
  if (riskFlag === 'PRICE_OUTLIER' && priceChange) {
    return checkPriceChangeConfirmation(
      priceChange.oldPrice,
      priceChange.newPrice,
      priceChange.sku
    );
  }

  return {
    requiresConfirmation: false,
    riskFlag: '',
    reason: '',
    confirmationMessage: '',
  };
}

/**
 * Creates confirmation state for workflow persistence
 */
export function createConfirmationState(
  intent: string,
  entity: any,
  riskFlag: string,
  originalValue?: any,
  requestedValue?: any
): ConfirmationState {
  return {
    pending: true,
    riskFlag,
    intent,
    entity,
    originalValue,
    requestedValue,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates confirmation command from user
 */
export function validateConfirmationCommand(
  userMessage: string,
  expectedIntent: string,
  expectedEntity: any
): boolean {
  const message = userMessage.toLowerCase().trim();

  // Check for CONFIRM keyword
  if (!message.includes('confirm')) {
    return false;
  }

  // Check if intent matches
  if (expectedIntent === 'UPDATE_PRODUCT_PRICE') {
    const skuMatch = expectedEntity.sku && message.includes(expectedEntity.sku.toLowerCase());
    const priceMatch = expectedEntity.newPrice && message.includes(expectedEntity.newPrice.toString());
    return skuMatch || priceMatch;
  }

  if (expectedIntent === 'CANCEL_ORDER') {
    const orderMatch = expectedEntity.orderNumber && message.includes(expectedEntity.orderNumber.toLowerCase());
    return orderMatch;
  }

  return true; // Generic confirmation
}

// ============================================================================
// Human Confirm Guard Logic End Here
// ============================================================================

