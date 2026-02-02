/**
 * PolicyEngine - Human-in-the-Loop Decision Engine
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This engine decides when to pause workflow for human confirmation.
 * It does NOT use LLM - all decisions are deterministic.
 */

import { UniversalState } from "./types/universal.state";

/**
 * ==========================================
 * PolicyEngine - HITL Decision Logic
 * ==========================================
 * 
 * This engine:
 * - Evaluates validation results
 * - Decides if HITL is needed
 * - Returns policy outcome (CONTINUE or CONFIRM)
 * 
 * Flow Control: This is the ONLY component that can pause workflow
 */

export type PolicyOutcome = "CONTINUE" | "CONFIRM";

export interface PolicyDecision {
  outcome: PolicyOutcome;
  message?: string;
  reason?: string;
}

export class PolicyEngine {
  /**
   * ==========================================
   * Evaluate Policy
   * ==========================================
   * 
   * Evaluates universal state and decides if HITL is needed.
   * Returns policy decision.
   */
  async evaluate(universalState: UniversalState): Promise<PolicyDecision> {
    const validation = universalState.state.validation;
    const plan = universalState.state.plan;

    // Check if validation requires confirmation
    if (validation?.requiresConfirmation) {
      return {
        outcome: "CONFIRM",
        message: this.buildConfirmationMessage(validation, plan),
        reason: validation.riskFlag || "High-risk operation detected",
      };
    }

    // Check intent confidence
    if (plan?.confidence && plan.confidence < 0.75) {
      return {
        outcome: "CONFIRM",
        message: `Intent confidence is low (${(plan.confidence * 100).toFixed(0)}%). Please confirm: "${plan.intent}"`,
        reason: "Low intent confidence",
      };
    }

    // Check for high-risk operations
    if (this.isHighRiskOperation(plan?.intent)) {
      return {
        outcome: "CONFIRM",
        message: this.buildHighRiskConfirmationMessage(plan),
        reason: "High-risk operation",
      };
    }

    // Continue execution
    return {
      outcome: "CONTINUE",
    };
  }

  /**
   * ==========================================
   * Build Confirmation Message
   * ==========================================
   */
  private buildConfirmationMessage(validation: any, plan: any): string {
    if (validation.riskFlag === "PRICE_OUTLIER") {
      const { oldValue, newValue, deviationPercent } = validation;
      return `⚠️ This is a large price change (from $${oldValue} → $${newValue}, ${deviationPercent?.toFixed(1)}% ${oldValue > newValue ? "drop" : "increase"}).

Please confirm:
'CONFIRM price change for ${plan?.entities?.sku} to $${newValue}'`;
    }

    return `⚠️ This operation requires confirmation. Please review and confirm.`;
  }

  /**
   * ==========================================
   * Build High Risk Confirmation Message
   * ==========================================
   */
  private buildHighRiskConfirmationMessage(plan: any): string {
    const { intent, entities } = plan;

    switch (intent) {
      case "CANCEL_ORDER":
        return `⚠️ You are about to cancel order ${entities?.orderNumber}. This action cannot be undone.

Please confirm:
'CONFIRM cancel order ${entities?.orderNumber}'`;

      default:
        return `⚠️ This is a high-risk operation. Please confirm before proceeding.`;
    }
  }

  /**
   * ==========================================
   * Check if High Risk Operation
   * ==========================================
   */
  private isHighRiskOperation(intent?: string): boolean {
    const highRiskIntents = [
      "CANCEL_ORDER",
      "UPDATE_PRODUCT_PRICE",
      "UPDATE_PROMOTION_STATUS",
    ];

    return intent ? highRiskIntents.includes(intent) : false;
  }
}

