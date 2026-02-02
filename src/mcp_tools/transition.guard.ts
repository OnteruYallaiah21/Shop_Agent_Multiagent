/**
 * Transition Guard - Order Status Transition Rules
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This guard enforces valid order status transitions based on business rules.
 * Prevents invalid state changes (e.g., cannot cancel shipped orders).
 */

// ============================================================================
// Transition Guard Logic Start Here
// ============================================================================

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'on_hold'
  | 'shipped'
  | 'partially_shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface TransitionResult {
  valid: boolean;
  allowed: boolean;
  errors: string[];
  riskFlag?: string;
  message?: string;
}

/**
 * Valid order status transitions matrix
 * 
 * Valid transitions:
 * - pending → shipped
 * - pending → cancelled
 * - shipped → delivered
 * 
 * Cannot cancel shipped orders.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'shipped', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['on_hold', 'shipped', 'cancelled'],
  on_hold: ['processing', 'shipped', 'cancelled'],
  shipped: ['partially_shipped', 'delivered'],
  partially_shipped: ['shipped', 'delivered'],
  delivered: ['completed'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
  partially_refunded: ['refunded'],
};

/**
 * Checks if a status transition is valid
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): TransitionResult {
  const errors: string[] = [];

  // Check if transition is allowed
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  const isAllowed = allowedTransitions.includes(newStatus);

  if (!isAllowed) {
    errors.push(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Valid transitions from ${currentStatus}: ${allowedTransitions.join(', ') || 'none'}`
    );
  }

  // Special rule: Cannot cancel shipped orders
  if (newStatus === 'cancelled' && (currentStatus === 'shipped' || currentStatus === 'delivered' || currentStatus === 'completed')) {
    errors.push(
      `Cannot cancel order. Order has already been ${currentStatus} and cannot be cancelled.`
    );
  }

  // Special rule: Cannot cancel already cancelled orders
  if (newStatus === 'cancelled' && currentStatus === 'cancelled') {
    errors.push('Order is already cancelled');
  }

  // Special rule: Cannot change terminal states
  const terminalStates: OrderStatus[] = ['completed', 'cancelled', 'refunded'];
  if (terminalStates.includes(currentStatus) && currentStatus !== newStatus) {
    errors.push(`Cannot change status from terminal state: ${currentStatus}`);
  }

  return {
    valid: errors.length === 0,
    allowed: isAllowed && errors.length === 0,
    errors,
    riskFlag: errors.length > 0 ? 'INVALID_TRANSITION' : undefined,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Validates order cancellation with business rules
 */
export function validateOrderCancellation(
  currentStatus: OrderStatus,
  paymentStatus?: string,
  fulfillmentStatus?: string
): TransitionResult {
  const errors: string[] = [];

  // Check if order can be cancelled
  const cancellationResult = validateStatusTransition(currentStatus, 'cancelled');

  if (!cancellationResult.allowed) {
    return {
      valid: false,
      allowed: false,
      errors: cancellationResult.errors,
      riskFlag: 'CANNOT_CANCEL_SHIPPED',
      message: cancellationResult.message,
    };
  }

  // Additional checks based on payment and fulfillment status
  if (paymentStatus === 'paid' || paymentStatus === 'authorized') {
    errors.push('Order has been paid. Cancellation may require refund processing.');
  }

  if (fulfillmentStatus === 'fulfilled' || fulfillmentStatus === 'partially_fulfilled') {
    errors.push('Order has been fulfilled. Cannot cancel fulfilled orders.');
  }

  return {
    valid: errors.length === 0,
    allowed: cancellationResult.allowed && errors.length === 0,
    errors: errors.length > 0 ? errors : [],
    riskFlag: errors.length > 0 ? 'CANCELLATION_REQUIRES_REFUND' : undefined,
  };
}

/**
 * Validates order status change based on payment status
 */
export function validateOrderStatusWithPayment(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  paymentStatus: string
): TransitionResult {
  const errors: string[] = [];

  // Cannot mark as shipped if not paid
  if (newStatus === 'shipped' && paymentStatus !== 'paid' && paymentStatus !== 'authorized') {
    errors.push('Cannot ship order that has not been paid');
  }

  // Cannot mark as delivered if not shipped
  if (newStatus === 'delivered' && currentStatus !== 'shipped' && currentStatus !== 'partially_shipped') {
    errors.push('Cannot mark order as delivered if it has not been shipped');
  }

  // Basic transition validation
  const transitionResult = validateStatusTransition(currentStatus, newStatus);

  return {
    valid: transitionResult.valid && errors.length === 0,
    allowed: transitionResult.allowed && errors.length === 0,
    errors: [...transitionResult.errors, ...errors],
    riskFlag: errors.length > 0 ? 'INVALID_STATUS_WITH_PAYMENT' : transitionResult.riskFlag,
    message: errors.length > 0 ? errors[0] : transitionResult.message,
  };
}

/**
 * Gets human-readable error message for invalid transition
 */
export function getTransitionErrorMessage(
  orderNumber: string,
  currentStatus: OrderStatus,
  requestedStatus: OrderStatus
): string {
  const transitionResult = validateStatusTransition(currentStatus, requestedStatus);

  if (transitionResult.valid) {
    return '';
  }

  if (requestedStatus === 'cancelled' && (currentStatus === 'shipped' || currentStatus === 'delivered')) {
    return `❌ Error: Cannot cancel order ${orderNumber}. This order has already been ${currentStatus} and cannot be cancelled.`;
  }

  return `❌ Error: Invalid status transition for order ${orderNumber}. Cannot change from ${currentStatus} to ${requestedStatus}.`;
}

// ============================================================================
// Transition Guard Logic End Here
// ============================================================================

