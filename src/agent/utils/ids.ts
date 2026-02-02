/**
 * ID Generation Utilities
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Generates unique IDs for workflows and traces.
 */

/**
 * ==========================================
 * Generate Workflow ID
 * ==========================================
 */
export function generateWorkflowId(): string {
  return `SHOP-${Date.now()}`;
}

/**
 * ==========================================
 * Generate Trace ID
 * ==========================================
 */
export function generateTraceId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

