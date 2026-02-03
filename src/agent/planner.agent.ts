/**
 * PlannerAgent - LLM Agent for Intent Extraction
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This agent uses LLM to extract intent and entities from natural language.
 * It is the ONLY agent that interprets user input.
 */

import { LlmAgent } from "@google/adk";
import { Schema, Type } from "@google/genai";
import { promptRegistry } from "../prompts";
import { DEFAULT_GEMINI_MODEL, getGeminiModelConfig, isGeminiAvailable } from "./config/gemini.config";
import { isGroqAvailable, DEFAULT_GROQ_MODEL } from "./config/groq.config";
import {
  // Order query tools
  getOrderByOrderNumberTool,
  getOrderByIdTool,
  getAllOrdersTool,
  getOrdersByStatusTool,
  getOrdersByCustomerIdTool,
  getOrdersByCustomerEmailTool,
  getOrdersByPaymentStatusTool,
  getOrdersByFulfillmentStatusTool,
  getOrdersByDateRangeTool,
  searchOrdersTool,
  getOrderNotesTool,
  getOrderShipmentsTool,
  getOrderRefundsTool,
  getOrderTransactionsTool,
  // Order update tools
  updateOrderShippingAddressTool,
  updateOrderBillingAddressTool,
  addOrderNoteTool,
  archiveOrderTool,
  unarchiveOrderTool,
  // Product query tools
  getProductBySkuTool,
  getProductByIdTool,
  getAllProductsTool,
  getProductsByStatusTool,
  getProductsByCategoryTool,
  getProductsByVendorTool,
  getProductsByBrandTool,
  getProductsByTagsTool,
  searchProductsTool,
  getProductsByPriceRangeTool,
  // Product update tools
  updateProductNameTool,
  updateProductStatusTool,
  updateProductTagsTool,
  updateVariantCompareAtPriceTool,
  updateVariantCostPriceTool,
  archiveProductTool,
  unarchiveProductTool,
  // Promotion tools
  getPromotionByIdTool,
  getAllPromotionsTool,
} from "../mcp_tools";

/**
 * ==========================================
 * PlannerAgent - Intent Extraction Logic
 * ==========================================
 * 
 * This agent:
 * - Uses LLM to understand natural language
 * - Extracts intent (UPDATE_PRODUCT_PRICE, CANCEL_ORDER, etc.)
 * - Extracts entities (sku, orderNumber, price, etc.)
 * - Returns structured output with confidence score
 * 
 * Flow Control: Does NOT control flow, only extracts meaning
 */

/**
 * Structured Output Schema for PlannerAgent
 * 
 * Note: ADK requires OBJECT properties to be non-empty.
 * All entity fields are optional but must be defined.
 */
const PlannerOutputSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        // Product update intents
        "UPDATE_PRODUCT_PRICE",
        "UPDATE_PRODUCT_DESCRIPTION",
        "UPDATE_PRODUCT_NAME",
        "UPDATE_PRODUCT_STATUS",
        "UPDATE_PRODUCT_TAGS",
        "UPDATE_VARIANT_COMPARE_AT_PRICE",
        "UPDATE_VARIANT_COST_PRICE",
        "ARCHIVE_PRODUCT",
        "UNARCHIVE_PRODUCT",
        // Order update intents
        "CANCEL_ORDER",
        "UPDATE_ORDER_STATUS",
        "UPDATE_ORDER_SHIPPING_ADDRESS",
        "UPDATE_ORDER_BILLING_ADDRESS",
        "ADD_ORDER_NOTE",
        "ARCHIVE_ORDER",
        "UNARCHIVE_ORDER",
        // Query intents
        "SHOW_PRODUCT_INFO",
        "SHOW_ORDER_INFO",
        "LIST_PRODUCTS",
        "LIST_ORDERS",
        "LIST_PROMOTIONS",
        // Other intents
        "UPDATE_PROMOTION_STATUS",
        "GET_INVENTORY_LEVEL",
        "QUESTION_ABOUT_SESSION",
        // NOTE: DELETE_PRODUCT and DELETE_ORDER are EXPLICITLY FORBIDDEN
        // If user asks to delete, use ARCHIVE_PRODUCT or ARCHIVE_ORDER instead
      ],
    },
    entities: {
      type: Type.OBJECT,
      properties: {
        // Product-related entities
        sku: { type: Type.STRING },
        newPrice: { type: Type.NUMBER },
        oldPrice: { type: Type.NUMBER },
        description: { type: Type.STRING },
        productName: { type: Type.STRING },
        // Order-related entities
        orderNumber: { type: Type.STRING },
        orderId: { type: Type.STRING },
        status: { type: Type.STRING },
        // Promotion-related entities
        promotionId: { type: Type.STRING },
        promotionCode: { type: Type.STRING },
        // Inventory-related entities
        quantity: { type: Type.NUMBER },
        location: { type: Type.STRING },
        // Session-related entities
        sessionId: { type: Type.STRING },
        question: { type: Type.STRING },
      },
      // All entity fields are optional - LLM will only include relevant ones
    },
    confidence: {
      type: Type.NUMBER,
      minimum: 0,
      maximum: 1,
    },
  },
  required: ["intent", "entities", "confidence"],
};

export class PlannerAgent extends LlmAgent {
  constructor() {
    const prompt = promptRegistry.getActivePrompt("planner") || "";
    
    // Get Gemini configuration (optional - only used as fallback when Groq is not available)
    const geminiConfig = getGeminiModelConfig();
    
    // If Gemini is not available, use a default model name (will be handled by workflow)
    // The workflow will use Groq as primary, so this is just for ADK initialization
    // Use a placeholder model name if Gemini config is not available
    const modelName = geminiConfig ? geminiConfig.model : DEFAULT_GEMINI_MODEL;
    
    if (!geminiConfig) {
      console.warn("[PlannerAgent] Gemini API key not set. Groq will be used as primary LLM.");
    }

    // ==========================================
    // ADK Constraint Workaround
    // ==========================================
    // ADK does not allow tools + outputSchema together.
    // Solution: Use tools WITHOUT outputSchema, then manually parse and structure the output.
    // This allows PlannerAgent to:
    // 1. Call tools to gather information (e.g., verify SKU exists)
    // 2. Extract intent and entities from natural language
    // 3. Return structured output (manually parsed from LLM response)
    
    // Enhanced prompt that instructs LLM to use tools and return structured JSON
    const enhancedPrompt = `${prompt}

🚫 CRITICAL SAFETY RULE - DELETE OPERATIONS ARE FORBIDDEN:
DELETE operations are DANGEROUS and NOT ALLOWED in this system.
- NEVER extract intent as DELETE_PRODUCT, DELETE_ORDER, or any DELETE operation
- If user asks to "delete" something, interpret it as ARCHIVE instead
- Use archiveProductTool or archiveOrderTool for safe removal
- Archive preserves all data for audit trail and compliance
- Archive operations are reversible (can unarchive later)

IMPORTANT: You have access to comprehensive tools to gather information and perform operations:

ORDER QUERY TOOLS:
- getOrderByOrderNumberTool: Get order by order number (e.g., ORD-1001)
- getOrderByIdTool: Get order by ID
- getAllOrdersTool: Get ALL orders (use for "what orders do you have", "list orders", etc.)
- getOrdersByStatusTool: Filter orders by status (pending, shipped, cancelled, etc.)
- getOrdersByCustomerIdTool: Find orders by customer ID
- getOrdersByCustomerEmailTool: Find orders by customer email
- getOrdersByPaymentStatusTool: Filter by payment status (paid, pending, refunded, etc.)
- getOrdersByFulfillmentStatusTool: Filter by fulfillment status (fulfilled, unfulfilled, etc.)
- getOrdersByDateRangeTool: Find orders within date range
- searchOrdersTool: Search orders by order number, email, or customer name
- getOrderNotesTool: Get all notes for an order
- getOrderShipmentsTool: Get all shipments for an order
- getOrderRefundsTool: Get all refunds for an order
- getOrderTransactionsTool: Get all payment transactions for an order

ORDER UPDATE TOOLS:
- updateOrderShippingAddressTool: Update shipping address
- updateOrderBillingAddressTool: Update billing address
- addOrderNoteTool: Add a note to an order
- archiveOrderTool: Archive an order (SAFE replacement for delete - preserves data)
- unarchiveOrderTool: Unarchive an order (restore from archive)

PRODUCT QUERY TOOLS:
- getProductBySkuTool: Get product by SKU (e.g., HP-BLK-001)
- getProductByIdTool: Get product by ID
- getAllProductsTool: Get ALL products (use for "what products do you have", "list products", etc.)
- getProductsByStatusTool: Filter by status (active, draft, archived, discontinued)
- getProductsByCategoryTool: Find products in a category
- getProductsByVendorTool: Find products from a vendor
- getProductsByBrandTool: Find products from a brand
- getProductsByTagsTool: Find products with specific tags
- searchProductsTool: Search products by name or description
- getProductsByPriceRangeTool: Find products within price range

PRODUCT UPDATE TOOLS:
- updateProductNameTool: Update product name
- updateProductStatusTool: Update product status
- updateProductTagsTool: Update product tags
- updateVariantCompareAtPriceTool: Update variant compareAtPrice
- updateVariantCostPriceTool: Update variant costPrice
- archiveProductTool: Archive a product (SAFE replacement for delete - preserves data)
- unarchiveProductTool: Unarchive a product (restore from archive)

PROMOTION TOOLS:
- getPromotionByIdTool: Get promotion by ID
- getAllPromotionsTool: Get ALL promotions (use for "what promotions do you have", etc.)

Use these tools to verify information before extracting intent and entities.
For queries like "what products do you have" or "show me all products", use getAllProductsTool and set intent to "LIST_PRODUCTS".
For queries like "what orders do you have" or "show me all orders", use getAllOrdersTool and set intent to "LIST_ORDERS".
For queries like "what promotions do you have" or "show me all promotions", use getAllPromotionsTool and set intent to "LIST_PROMOTIONS".
For general queries like "what do you have", you can use multiple tools to show products, orders, and promotions.

🚫 DELETE OPERATION HANDLING:
If user asks to "delete" a product or order:
1. DO NOT extract intent as DELETE_PRODUCT or DELETE_ORDER
2. Extract intent as ARCHIVE_PRODUCT or ARCHIVE_ORDER instead
3. Use archiveProductTool or archiveOrderTool
4. Explain to user that delete is dangerous, archive is safer and reversible

After gathering information, return your response as a JSON object with this exact structure:
{
  "intent": "UPDATE_PRODUCT_PRICE" | "CANCEL_ORDER" | etc.,
  "entities": {
    "sku": "string" (if applicable),
    "orderNumber": "string" (if applicable),
    "newPrice": number (if applicable),
    // ... other relevant entities
  },
  "confidence": 0.0-1.0
}`;

    super({
      name: "planner_agent",
      model: modelName, // Gemini 2.5 Flash (gemini-2.5-flash) or fallback model name
      instruction: enhancedPrompt,
      // Note: We cannot use outputSchema here because we need tools
      // Instead, we'll manually parse the LLM response in runPlannerAgent
      tools: [
        // Order query tools
        getOrderByOrderNumberTool,
        getOrderByIdTool,
        getAllOrdersTool,
        getOrdersByStatusTool,
        getOrdersByCustomerIdTool,
        getOrdersByCustomerEmailTool,
        getOrdersByPaymentStatusTool,
        getOrdersByFulfillmentStatusTool,
        getOrdersByDateRangeTool,
        searchOrdersTool,
        getOrderNotesTool,
        getOrderShipmentsTool,
        getOrderRefundsTool,
        getOrderTransactionsTool,
        // Order update tools
        updateOrderShippingAddressTool,
        updateOrderBillingAddressTool,
        addOrderNoteTool,
        archiveOrderTool,
        unarchiveOrderTool,
        // Product query tools
        getProductBySkuTool,
        getProductByIdTool,
        getAllProductsTool,
        getProductsByStatusTool,
        getProductsByCategoryTool,
        getProductsByVendorTool,
        getProductsByBrandTool,
        getProductsByTagsTool,
        searchProductsTool,
        getProductsByPriceRangeTool,
        // Product update tools
        updateProductNameTool,
        updateProductStatusTool,
        updateProductTagsTool,
        updateVariantCompareAtPriceTool,
        updateVariantCostPriceTool,
        archiveProductTool,
        unarchiveProductTool,
        // Promotion tools
        getPromotionByIdTool,
        getAllPromotionsTool,
      ],
      // Note: ADK uses @google/genai which automatically picks up GOOGLE_GENAI_API_KEY
      // or GEMINI_API_KEY from environment variables
      // Set GEMINI_API_KEY environment variable before running the service
    });
  }

  /**
   * ==========================================
   * Extract Plan from Context
   * ==========================================
   * 
   * Helper method to extract plan from session state.
   * The plan is stored in ctx.state.plan by ADK after LLM call.
   */
  static extractPlanFromContext(ctx: any): any {
    // ADK stores output in session state using outputKey
    const plan = ctx.state?.plan || ctx.state?.universalState?.state?.plan;
    
    if (!plan) {
      throw new Error("Plan not found in context. LLM call may have failed.");
    }

    return {
      intent: plan.intent,
      entities: plan.entities || {},
      confidence: plan.confidence || 0.0,
      timestamp: new Date().toISOString(),
    };
  }
}

