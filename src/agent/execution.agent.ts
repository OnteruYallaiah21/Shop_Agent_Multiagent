/**
 * ExecutionAgent - Deterministic Action Execution
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This agent executes validated actions via API calls.
 * It does NOT use LLM - all execution is deterministic.
 */

import { BaseAgent } from "@google/adk";
import {
  updateProductPriceTool,
  updateProductDescriptionTool,
  cancelOrderTool,
  updateOrderStatusTool,
} from "../mcp_tools";

/**
 * ==========================================
 * ExecutionAgent - Action Execution Logic
 * ==========================================
 * 
 * This agent:
 * - Maps intent to API endpoint
 * - Calls backend API via tools
 * - Updates JSON data files
 * - Returns execution result
 * 
 * Flow Control: Does NOT control flow, only executes actions
 */

export class ExecutionAgent extends BaseAgent {
  constructor() {
    super({
      name: "execution_agent",
      tools: [
        updateProductPriceTool,
        updateProductDescriptionTool,
        cancelOrderTool,
        updateOrderStatusTool,
      ],
    });
  }

  /**
   * ==========================================
   * Run ExecutionAgent
   * ==========================================
   * 
   * Executes validated actions from ValidationAgent.
   * Only runs if validation passed.
   */
  async run(ctx: any): Promise<any> {
    const { plan, validation } = ctx.input;

    if (!validation || !validation.valid) {
      return {
        success: false,
        data: null,
        error: "Validation failed. Cannot execute action.",
        apiResponse: null,
      };
    }

    const { intent, entities } = plan;

    // Execute based on intent
    switch (intent) {
      case "UPDATE_PRODUCT_PRICE":
        return await this.executePriceUpdate(entities);

      case "UPDATE_PRODUCT_DESCRIPTION":
        return await this.executeDescriptionUpdate(entities);

      case "CANCEL_ORDER":
        return await this.executeOrderCancellation(entities);

      case "UPDATE_ORDER_STATUS":
        return await this.executeOrderStatusUpdate(entities);

      default:
        return {
          success: false,
          data: null,
          error: `Unsupported intent: ${intent}`,
          apiResponse: null,
        };
    }
  }

  /**
   * ==========================================
   * Execute Price Update
   * ==========================================
   */
  private async executePriceUpdate(entities: any): Promise<any> {
    const { sku, newPrice } = entities;

    try {
      const result = await updateProductPriceTool.execute({ sku, price: newPrice });

      return {
        success: true,
        data: {
          sku,
          oldPrice: result.oldPrice,
          newPrice: result.newPrice,
          productName: result.productName,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product price updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update product price",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Description Update
   * ==========================================
   */
  private async executeDescriptionUpdate(entities: any): Promise<any> {
    const { sku, description } = entities;

    try {
      const result = await updateProductDescriptionTool.execute({ sku, description });

      return {
        success: true,
        data: {
          sku,
          description: result.description,
          productName: result.productName,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product description updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update product description",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Order Cancellation
   * ==========================================
   */
  private async executeOrderCancellation(entities: any): Promise<any> {
    const { orderNumber } = entities;

    try {
      const result = await cancelOrderTool.execute({ orderNumber });

      return {
        success: true,
        data: {
          orderNumber,
          status: result.status,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Order cancelled successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to cancel order",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Order Status Update
   * ==========================================
   */
  private async executeOrderStatusUpdate(entities: any): Promise<any> {
    const { orderNumber, status } = entities;

    try {
      const result = await updateOrderStatusTool.execute({ orderNumber, status });

      return {
        success: true,
        data: {
          orderNumber,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Order status updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update order status",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }
}

