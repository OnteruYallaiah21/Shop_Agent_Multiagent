/**
 * ExecutionAgent - Deterministic Action Execution
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This agent executes validated actions via API calls.
 * It does NOT use LLM - all execution is deterministic.
 */

import { BaseAgent, InvocationContext } from "@google/adk";
import {
  // Product update functions
  updateProductPrice,
  updateProductDescription,
  updateProductName,
  updateProductStatus,
  updateProductTags,
  updateVariantCompareAtPrice,
  updateVariantCostPrice,
  archiveProduct,
  unarchiveProduct,
  getAllProducts,
  // Order update functions
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  addOrderNote,
  updateOrderShippingAddress,
  updateOrderBillingAddress,
  archiveOrder,
  unarchiveOrder,
  // Promotion functions
  getAllPromotions,
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
    });
  }

  /**
   * ==========================================
   * Required BaseAgent Implementation
   * ==========================================
   */
  async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<any, void, void> {
    const result = await this.run(ctx);
    yield result;
  }

  async *runLiveImpl(ctx: InvocationContext): AsyncGenerator<any, void, void> {
    const result = await this.run(ctx);
    yield result;
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
      // Product update operations
      case "UPDATE_PRODUCT_PRICE":
        return await this.executePriceUpdate(entities);

      case "UPDATE_PRODUCT_DESCRIPTION":
        return await this.executeDescriptionUpdate(entities);

      case "UPDATE_PRODUCT_NAME":
        return await this.executeProductNameUpdate(entities);

      case "UPDATE_PRODUCT_STATUS":
        return await this.executeProductStatusUpdate(entities);

      case "UPDATE_PRODUCT_TAGS":
        return await this.executeProductTagsUpdate(entities);

      case "UPDATE_VARIANT_COMPARE_AT_PRICE":
        return await this.executeVariantCompareAtPriceUpdate(entities);

      case "UPDATE_VARIANT_COST_PRICE":
        return await this.executeVariantCostPriceUpdate(entities);

      case "ARCHIVE_PRODUCT":
        return await this.executeArchiveProduct(entities);

      case "UNARCHIVE_PRODUCT":
        return await this.executeUnarchiveProduct(entities);

      // Order operations
      case "CANCEL_ORDER":
        return await this.executeOrderCancellation(entities);

      case "UPDATE_ORDER_STATUS":
        return await this.executeOrderStatusUpdate(entities);

      case "UPDATE_ORDER_SHIPPING_ADDRESS":
        return await this.executeOrderShippingAddressUpdate(entities);

      case "UPDATE_ORDER_BILLING_ADDRESS":
        return await this.executeOrderBillingAddressUpdate(entities);

      case "ADD_ORDER_NOTE":
        return await this.executeAddOrderNote(entities);

      case "ARCHIVE_ORDER":
        return await this.executeArchiveOrder(entities);

      case "UNARCHIVE_ORDER":
        return await this.executeUnarchiveOrder(entities);

      // List operations (read-only)
      case "LIST_PRODUCTS":
        return await this.executeListProducts(entities, ctx);

      case "LIST_ORDERS":
        return await this.executeListOrders(entities, ctx);

      case "LIST_PROMOTIONS":
        return await this.executeListPromotions(entities, ctx);

      case "SHOW_PRODUCT_INFO":
      case "SHOW_ORDER_INFO":
        // These are read-only operations, handled by PlannerAgent via tools
        return {
          success: true,
          data: { message: "Information retrieved by PlannerAgent" },
          error: null,
          apiResponse: null,
        };

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
      const result = updateProductPrice({ sku, newPrice });

      return {
        success: true,
        data: {
          sku,
          oldPrice: result.oldPrice,
          newPrice: result.newPrice,
          productName: result.product?.name || "Unknown",
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
      const result = updateProductDescription({ sku, newDescription: description });

      return {
        success: true,
        data: {
          sku,
          description: result.newDescription || result.oldDescription || "",
          productName: result.product?.name || "Unknown",
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
      const result = cancelOrder({ orderNumber });

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
      const result = updateOrderStatus({ orderNumber, newStatus: status });

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

  /**
   * ==========================================
   * Execute List Products
   * ==========================================
   * 
   * Lists all products in the system.
   * This is a read-only operation that retrieves product information.
   * 
   * If PlannerAgent already called getAllProductsTool, use that result.
   * Otherwise, call getAllProducts directly.
   */
  private async executeListProducts(entities: any, ctx?: any): Promise<any> {
    console.log(`[ExecutionAgent] executeListProducts called`);
    console.log(`[ExecutionAgent] entities:`, JSON.stringify(entities));
    console.log(`[ExecutionAgent] ctx.state keys:`, ctx?.state ? Object.keys(ctx.state) : 'no ctx.state');
    
    // Check if PlannerAgent already called getAllProductsTool and we have the result
    const toolResults = ctx?.state?.universalState?.state?.toolResults || [];
    console.log(`[ExecutionAgent] toolResults count: ${toolResults.length}`);
    if (toolResults.length > 0) {
      console.log(`[ExecutionAgent] toolResults names:`, toolResults.map((tr: any) => tr.name));
    }
    
    // Try multiple possible tool name variations
    const getAllProductsResult = toolResults.find((tr: any) => 
      tr.name === 'get_all_products' || 
      tr.name === 'getAllProductsTool' ||
      tr.name === 'get_all_products_tool' ||
      tr.name?.toLowerCase().includes('get_all_products') ||
      tr.name?.toLowerCase().includes('getallproducts')
    );
    
    if (getAllProductsResult && getAllProductsResult.response) {
      console.log(`[ExecutionAgent] ✅ Found tool result for: ${getAllProductsResult.name}`);
      console.log(`[ExecutionAgent] Tool response type: ${typeof getAllProductsResult.response}`);
      
      // Parse the tool response (might be string or object)
      let productsData: any;
      if (typeof getAllProductsResult.response === 'string') {
        try {
          productsData = JSON.parse(getAllProductsResult.response);
          console.log(`[ExecutionAgent] Parsed JSON string response`);
        } catch (e) {
          console.warn(`[ExecutionAgent] Failed to parse JSON, using raw string`);
          productsData = getAllProductsResult.response;
        }
      } else {
        productsData = getAllProductsResult.response;
        console.log(`[ExecutionAgent] Using object response directly`);
      }
      
      console.log(`[ExecutionAgent] productsData keys:`, productsData ? Object.keys(productsData) : 'null');
      
      // Handle different response formats - be very explicit
      let products: any[] = [];
      let total = 0;
      
      if (productsData.products && Array.isArray(productsData.products)) {
        products = productsData.products;
        total = productsData.total || products.length;
        console.log(`[ExecutionAgent] ✅ Found products array: ${products.length} items`);
      } else if (productsData.data && Array.isArray(productsData.data)) {
        products = productsData.data;
        total = products.length;
        console.log(`[ExecutionAgent] ✅ Found products in data array: ${products.length} items`);
      } else if (Array.isArray(productsData)) {
        products = productsData;
        total = products.length;
        console.log(`[ExecutionAgent] ✅ Response is direct array: ${products.length} items`);
      } else {
        console.warn(`[ExecutionAgent] ⚠️ Could not extract products array from:`, JSON.stringify(productsData).substring(0, 500));
      }
      
      if (products.length === 0) {
        console.error(`[ExecutionAgent] ❌ No products extracted! Full productsData:`, JSON.stringify(productsData).substring(0, 1000));
      } else {
        console.log(`[ExecutionAgent] ✅ Successfully extracted ${products.length} products (total: ${total})`);
        console.log(`[ExecutionAgent] First product:`, JSON.stringify(products[0]).substring(0, 200));
      }
      
      return {
        success: true,
        data: {
          products: products,
          total: total,
          limit: productsData.limit,
          offset: productsData.offset || 0,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${products.length} products (from PlannerAgent tool call)`,
        },
      };
    }

    // Fallback: Call getAllProducts directly if tool result not available
    console.log('[ExecutionAgent] ⚠️ No tool result found, calling getAllProducts directly');
    // Extract pagination parameters if provided
    const limit = entities.limit ? parseInt(entities.limit) : undefined;
    const offset = entities.offset ? parseInt(entities.offset) : undefined;

    try {
      // Call the getAllProducts function directly
      const result = getAllProducts({ limit, offset });
      
      console.log(`[ExecutionAgent] getAllProducts result: status=${result.status}, products count=${result.products?.length || 0}, total=${result.total || 0}`);

      if (result.status === "error") {
        console.error(`[ExecutionAgent] ❌ Error from getAllProducts: ${result.error_message}`);
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to retrieve products",
          apiResponse: null,
        };
      }

      if (!result.products || result.products.length === 0) {
        console.error(`[ExecutionAgent] ❌ No products returned from getAllProducts!`);
        console.error(`[ExecutionAgent] Result:`, JSON.stringify(result).substring(0, 500));
      } else {
        console.log(`[ExecutionAgent] ✅ Successfully retrieved ${result.products.length} products from getAllProducts`);
      }

      return {
        success: true,
        data: {
          products: result.products || [],
          total: result.total || 0,
          limit: result.limit,
          offset: result.offset,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${result.products?.length || 0} products`,
        },
      };
    } catch (error: any) {
      console.error(`[ExecutionAgent] ❌ Exception in getAllProducts:`, error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to retrieve products",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute List Orders
   * ==========================================
   * 
   * Lists all orders in the system.
   * This is a read-only operation that retrieves order information.
   * 
   * If PlannerAgent already called getAllOrdersTool, use that result.
   * Otherwise, call getAllOrders directly.
   */
  private async executeListOrders(entities: any, ctx?: any): Promise<any> {
    // Check if PlannerAgent already called getAllOrdersTool and we have the result
    const toolResults = ctx?.state?.universalState?.state?.toolResults || [];
    const getAllOrdersResult = toolResults.find((tr: any) => tr.name === 'get_all_orders');
    
    if (getAllOrdersResult && getAllOrdersResult.response) {
      console.log('[ExecutionAgent] Using order data from PlannerAgent tool call');
      // Parse the tool response (might be string or object)
      let ordersData: any;
      if (typeof getAllOrdersResult.response === 'string') {
        try {
          ordersData = JSON.parse(getAllOrdersResult.response);
        } catch {
          ordersData = getAllOrdersResult.response;
        }
      } else {
        ordersData = getAllOrdersResult.response;
      }
      
      // Handle different response formats
      const orders = ordersData.orders || ordersData.data?.orders || (Array.isArray(ordersData) ? ordersData : []);
      const total = ordersData.total || orders.length;
      
      return {
        success: true,
        data: {
          orders: orders,
          total: total,
          limit: ordersData.limit,
          offset: ordersData.offset || 0,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${orders.length} orders (from PlannerAgent tool call)`,
        },
      };
    }

    // Fallback: Call getAllOrders directly if tool result not available
    console.log('[ExecutionAgent] Calling getAllOrders directly (no tool result found)');
    // Extract pagination parameters if provided
    const limit = entities.limit ? parseInt(entities.limit) : undefined;
    const offset = entities.offset ? parseInt(entities.offset) : undefined;

    try {
      // Call the getAllOrders function directly
      const result = getAllOrders({ limit, offset });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to retrieve orders",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orders: result.orders || [],
          total: result.total || 0,
          limit: result.limit,
          offset: result.offset,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${result.orders?.length || 0} orders`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to retrieve orders",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute List Promotions
   * ==========================================
   * 
   * Lists all promotions in the system.
   * This is a read-only operation that retrieves promotion information.
   * 
   * If PlannerAgent already called getAllPromotionsTool, use that result.
   * Otherwise, call getAllPromotions directly.
   */
  private async executeListPromotions(entities: any, ctx?: any): Promise<any> {
    // Check if PlannerAgent already called getAllPromotionsTool and we have the result
    const toolResults = ctx?.state?.universalState?.state?.toolResults || [];
    const getAllPromotionsResult = toolResults.find((tr: any) => tr.name === 'get_all_promotions');
    
    if (getAllPromotionsResult && getAllPromotionsResult.response) {
      console.log('[ExecutionAgent] Using promotion data from PlannerAgent tool call');
      // Parse the tool response (might be string or object)
      let promotionsData: any;
      if (typeof getAllPromotionsResult.response === 'string') {
        try {
          promotionsData = JSON.parse(getAllPromotionsResult.response);
        } catch {
          promotionsData = getAllPromotionsResult.response;
        }
      } else {
        promotionsData = getAllPromotionsResult.response;
      }
      
      // Handle different response formats
      const promotions = promotionsData.promotions || promotionsData.data?.promotions || (Array.isArray(promotionsData) ? promotionsData : []);
      const total = promotionsData.total || promotions.length;
      
      return {
        success: true,
        data: {
          promotions: promotions,
          total: total,
          limit: promotionsData.limit,
          offset: promotionsData.offset || 0,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${promotions.length} promotions (from PlannerAgent tool call)`,
        },
      };
    }

    // Fallback: Call getAllPromotions directly if tool result not available
    console.log('[ExecutionAgent] Calling getAllPromotions directly (no tool result found)');
    // Extract pagination parameters if provided
    const limit = entities.limit ? parseInt(entities.limit) : undefined;
    const offset = entities.offset ? parseInt(entities.offset) : undefined;

    try {
      // Call the getAllPromotions function directly
      const result = getAllPromotions({ limit, offset });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to retrieve promotions",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          promotions: result.promotions || [],
          total: result.total || 0,
          limit: result.limit,
          offset: result.offset,
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: `Retrieved ${result.promotions?.length || 0} promotions`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to retrieve promotions",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Product Name Update
   * ==========================================
   */
  private async executeProductNameUpdate(entities: any): Promise<any> {
    const { sku, newName } = entities;

    try {
      const result = updateProductName({ sku, newName });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update product name",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldName: result.oldName,
          newName: result.newName,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product name updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update product name",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Product Status Update
   * ==========================================
   */
  private async executeProductStatusUpdate(entities: any): Promise<any> {
    const { sku, newStatus } = entities;

    try {
      const result = updateProductStatus({ sku, newStatus });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update product status",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product status updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update product status",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Product Tags Update
   * ==========================================
   */
  private async executeProductTagsUpdate(entities: any): Promise<any> {
    const { sku, tags } = entities;

    try {
      const result = updateProductTags({ sku, tags });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update product tags",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldTags: result.oldTags,
          newTags: result.newTags,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product tags updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update product tags",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Variant Compare At Price Update
   * ==========================================
   */
  private async executeVariantCompareAtPriceUpdate(entities: any): Promise<any> {
    const { sku, compareAtPrice } = entities;

    try {
      const result = updateVariantCompareAtPrice({ sku, compareAtPrice });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update variant compareAtPrice",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldCompareAtPrice: result.oldCompareAtPrice,
          newCompareAtPrice: result.newCompareAtPrice,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Variant compareAtPrice updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update variant compareAtPrice",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Variant Cost Price Update
   * ==========================================
   */
  private async executeVariantCostPriceUpdate(entities: any): Promise<any> {
    const { sku, costPrice } = entities;

    try {
      const result = updateVariantCostPrice({ sku, costPrice });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update variant costPrice",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldCostPrice: result.oldCostPrice,
          newCostPrice: result.newCostPrice,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Variant costPrice updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update variant costPrice",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Order Shipping Address Update
   * ==========================================
   */
  private async executeOrderShippingAddressUpdate(entities: any): Promise<any> {
    const { orderNumber, shippingAddress } = entities;

    try {
      const result = updateOrderShippingAddress({ orderNumber, shippingAddress });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update shipping address",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orderNumber,
          shippingAddress: result.order?.shippingAddress,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Shipping address updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update shipping address",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Order Billing Address Update
   * ==========================================
   */
  private async executeOrderBillingAddressUpdate(entities: any): Promise<any> {
    const { orderNumber, billingAddress } = entities;

    try {
      const result = updateOrderBillingAddress({ orderNumber, billingAddress });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to update billing address",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orderNumber,
          billingAddress: result.order?.billingAddress,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Billing address updated successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update billing address",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Add Order Note
   * ==========================================
   */
  private async executeAddOrderNote(entities: any): Promise<any> {
    const { orderNumber, content, isPrivate } = entities;

    try {
      const result = addOrderNote({ orderNumber, content, isPrivate });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to add order note",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orderNumber,
          note: result.note,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Order note added successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to add order note",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Archive Product
   * ==========================================
   * 
   * Archives a product (SAFE replacement for delete).
   * Preserves all data for audit trail.
   */
  private async executeArchiveProduct(entities: any): Promise<any> {
    const { sku } = entities;

    try {
      const result = archiveProduct({ sku });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to archive product",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product archived successfully. Data preserved for audit trail.",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to archive product",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Unarchive Product
   * ==========================================
   * 
   * Unarchives a product (restores from archive).
   */
  private async executeUnarchiveProduct(entities: any): Promise<any> {
    const { sku, targetStatus } = entities;

    try {
      const result = unarchiveProduct({ sku, targetStatus });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to unarchive product",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          sku,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          productName: result.product?.name || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Product unarchived successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to unarchive product",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Archive Order
   * ==========================================
   * 
   * Archives an order (SAFE replacement for delete).
   * Preserves all data for audit trail and legal compliance.
   */
  private async executeArchiveOrder(entities: any): Promise<any> {
    const { orderNumber } = entities;

    try {
      const result = archiveOrder({ orderNumber });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to archive order",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orderNumber,
          order: result.order,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Order archived successfully. Data preserved for audit trail and legal compliance.",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to archive order",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * ==========================================
   * Execute Unarchive Order
   * ==========================================
   * 
   * Unarchives an order (restores from archive).
   */
  private async executeUnarchiveOrder(entities: any): Promise<any> {
    const { orderNumber } = entities;

    try {
      const result = unarchiveOrder({ orderNumber });

      if (result.status === "error") {
        return {
          success: false,
          data: null,
          error: result.error_message || "Failed to unarchive order",
          apiResponse: null,
        };
      }

      return {
        success: true,
        data: {
          orderNumber,
          order: result.order,
          updatedAt: new Date().toISOString(),
        },
        error: null,
        apiResponse: {
          statusCode: 200,
          message: "Order unarchived successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || "Failed to unarchive order",
        apiResponse: {
          statusCode: 500,
          message: error.message || "Internal server error",
        },
      };
    }
  }
}

