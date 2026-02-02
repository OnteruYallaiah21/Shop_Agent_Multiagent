/**
 * ValidationAgent - Deterministic Validation and Guardrails
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This agent validates business rules and checks guardrails.
 * It does NOT use LLM - all logic is deterministic.
 */

import { BaseAgent } from "@google/adk";
import {
  validateSkuExists,
  validateOrderExists,
  validatePrice,
  validateProductActive,
  validatePriceVsCost,
  validateStatusTransition,
  validateOrderCancellation,
  checkPriceOutlier,
  requiresHumanConfirmation,
} from "../mcp_tools";

/**
 * ==========================================
 * ValidationAgent - Guardrails Logic
 * ==========================================
 * 
 * This agent:
 * - Validates entities exist (SKU, orderNumber)
 * - Checks business rules (price >= 0, valid transitions)
 * - Calculates risk flags (PRICE_OUTLIER if deviation > 40%)
 * - Determines if HITL is needed
 * 
 * Flow Control: Does NOT control flow, only validates and flags risks
 */

export class ValidationAgent extends BaseAgent {
  constructor() {
    super({
      name: "validation_agent",
    });
  }

  /**
   * ==========================================
   * Run ValidationAgent
   * ==========================================
   * 
   * Validates plan from PlannerAgent and checks guardrails.
   * Returns validation result with risk flags.
   */
  async run(ctx: any): Promise<any> {
    const plan = ctx.input.plan;

    if (!plan || !plan.intent) {
      return {
        valid: false,
        riskFlag: null,
        errors: ["Invalid plan: intent is required"],
        entityExists: false,
        businessRulesPassed: false,
        requiresConfirmation: false,
      };
    }

    const { intent, entities } = plan;

    // Initialize result
    const result: any = {
      valid: true,
      riskFlag: null,
      errors: [],
      entityExists: true,
      businessRulesPassed: true,
      requiresConfirmation: false,
    };

    // Validate based on intent
    switch (intent) {
      case "UPDATE_PRODUCT_PRICE":
        return await this.validatePriceUpdate(entities, result);

      case "CANCEL_ORDER":
        return await this.validateOrderCancellation(entities, result);

      case "UPDATE_ORDER_STATUS":
        return await this.validateOrderStatusUpdate(entities, result);

      case "UPDATE_PRODUCT_DESCRIPTION":
        return await this.validateDescriptionUpdate(entities, result);

      default:
        return {
          valid: true,
          riskFlag: null,
          errors: [],
          entityExists: true,
          businessRulesPassed: true,
          requiresConfirmation: false,
        };
    }
  }

  /**
   * ==========================================
   * Validate Price Update
   * ==========================================
   */
  private async validatePriceUpdate(entities: any, result: any): Promise<any> {
    const { sku, newPrice } = entities;

    // Check SKU exists
    if (!sku) {
      result.valid = false;
      result.errors.push("SKU is required");
      result.entityExists = false;
      return result;
    }

    const skuValidation = await validateSkuExists(sku);
    if (!skuValidation.valid) {
      result.valid = false;
      result.errors.push(skuValidation.error || "SKU not found");
      result.entityExists = false;
      return result;
    }

    // Check price is valid
    if (newPrice === undefined || newPrice === null) {
      result.valid = false;
      result.errors.push("New price is required");
      result.businessRulesPassed = false;
      return result;
    }

    const priceValidation = validatePrice(newPrice);
    if (!priceValidation.valid) {
      result.valid = false;
      result.errors.push(priceValidation.error || "Invalid price");
      result.businessRulesPassed = false;
      return result;
    }

    // Check product is active
    const activeValidation = await validateProductActive(sku);
    if (!activeValidation.valid) {
      result.valid = false;
      result.errors.push(activeValidation.error || "Product is not active");
      result.businessRulesPassed = false;
      return result;
    }

    // Get current price and check price outlier
    const product = skuValidation.product;
    const oldPrice = product.variants?.[0]?.price || 0;

    const priceOutlierCheck = checkPriceOutlier(oldPrice, newPrice);
    if (priceOutlierCheck.isOutlier) {
      result.riskFlag = "PRICE_OUTLIER";
      result.oldValue = oldPrice;
      result.newValue = newPrice;
      result.deviationPercent = priceOutlierCheck.deviationPercent;
      result.requiresConfirmation = true;
    }

    // Check price vs cost
    const costPrice = product.variants?.[0]?.costPrice || 0;
    if (newPrice < costPrice) {
      result.errors.push(`Warning: New price ($${newPrice}) is below cost price ($${costPrice})`);
    }

    return result;
  }

  /**
   * ==========================================
   * Validate Order Cancellation
   * ==========================================
   */
  private async validateOrderCancellation(entities: any, result: any): Promise<any> {
    const { orderNumber } = entities;

    if (!orderNumber) {
      result.valid = false;
      result.errors.push("Order number is required");
      result.entityExists = false;
      return result;
    }

    const orderValidation = await validateOrderExists(orderNumber);
    if (!orderValidation.valid) {
      result.valid = false;
      result.errors.push(orderValidation.error || "Order not found");
      result.entityExists = false;
      return result;
    }

    const cancellationValidation = validateOrderCancellation(orderValidation.order);
    if (!cancellationValidation.valid) {
      result.valid = false;
      result.errors.push(cancellationValidation.error || "Cannot cancel this order");
      result.businessRulesPassed = false;
      return result;
    }

    return result;
  }

  /**
   * ==========================================
   * Validate Order Status Update
   * ==========================================
   */
  private async validateOrderStatusUpdate(entities: any, result: any): Promise<any> {
    const { orderNumber, status } = entities;

    if (!orderNumber) {
      result.valid = false;
      result.errors.push("Order number is required");
      result.entityExists = false;
      return result;
    }

    if (!status) {
      result.valid = false;
      result.errors.push("New status is required");
      result.businessRulesPassed = false;
      return result;
    }

    const orderValidation = await validateOrderExists(orderNumber);
    if (!orderValidation.valid) {
      result.valid = false;
      result.errors.push(orderValidation.error || "Order not found");
      result.entityExists = false;
      return result;
    }

    const transitionValidation = validateStatusTransition(orderValidation.order.status, status);
    if (!transitionValidation.valid) {
      result.valid = false;
      result.errors.push(transitionValidation.error || "Invalid status transition");
      result.businessRulesPassed = false;
      return result;
    }

    return result;
  }

  /**
   * ==========================================
   * Validate Description Update
   * ==========================================
   */
  private async validateDescriptionUpdate(entities: any, result: any): Promise<any> {
    const { sku, description } = entities;

    if (!sku) {
      result.valid = false;
      result.errors.push("SKU is required");
      result.entityExists = false;
      return result;
    }

    const skuValidation = await validateSkuExists(sku);
    if (!skuValidation.valid) {
      result.valid = false;
      result.errors.push(skuValidation.error || "SKU not found");
      result.entityExists = false;
      return result;
    }

    if (!description || description.trim().length === 0) {
      result.valid = false;
      result.errors.push("Description is required");
      result.businessRulesPassed = false;
      return result;
    }

    return result;
  }
}

