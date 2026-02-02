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
 */
const PlannerOutputSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        "UPDATE_PRODUCT_PRICE",
        "UPDATE_PRODUCT_DESCRIPTION",
        "CANCEL_ORDER",
        "UPDATE_ORDER_STATUS",
        "SHOW_PRODUCT_INFO",
        "SHOW_ORDER_INFO",
        "UPDATE_PROMOTION_STATUS",
        "GET_INVENTORY_LEVEL",
        "QUESTION_ABOUT_SESSION",
      ],
    },
    entities: {
      type: Type.OBJECT,
      properties: {
        sku: { type: Type.STRING, optional: true },
        orderNumber: { type: Type.STRING, optional: true },
        newPrice: { type: Type.NUMBER, optional: true },
        status: { type: Type.STRING, optional: true },
        description: { type: Type.STRING, optional: true },
        promotionId: { type: Type.STRING, optional: true },
      },
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

    super({
      name: "planner_agent",
      model: "qwen3-coder:30b", // Local Ollama model
      instruction: prompt,
      outputSchema: PlannerOutputSchema,
      outputKey: "plan",
    });
  }

  /**
   * ==========================================
   * Run PlannerAgent
   * ==========================================
   * 
   * Extracts intent and entities from user message.
   * Returns structured output that flows to ValidationAgent.
   */
  async run(ctx: any): Promise<any> {
    const message = ctx.input.message;

    if (!message || typeof message !== "string") {
      throw new Error("Invalid input: message is required");
    }

    // Call LLM with structured output
    const result = await super.run(ctx);

    // Validate and return structured output
    return {
      intent: result.intent,
      entities: result.entities || {},
      confidence: result.confidence || 0.0,
      timestamp: new Date().toISOString(),
    };
  }
}

