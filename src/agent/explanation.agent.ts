/**
 * ExplanationAgent - LLM Agent for Natural Language Explanations
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This agent uses LLM to generate explanations and answer session questions.
 * It is the second LLM agent (after PlannerAgent).
 */

import { LlmAgent } from "@google/adk";
import { promptRegistry } from "../prompts";
import { UniversalState } from "./types/universal.state";

/**
 * ==========================================
 * ExplanationAgent - Explanation Logic
 * ==========================================
 * 
 * This agent:
 * - Generates natural language explanations after actions
 * - Answers questions about session history
 * - Provides context-aware responses
 * 
 * Flow Control: Does NOT control flow, only generates explanations
 */

export class ExplanationAgent extends LlmAgent {
  constructor() {
    const prompt = promptRegistry.getActivePrompt("response") || "";

    super({
      name: "explanation_agent",
      model: "qwen3-coder:30b", // Local Ollama model
      instruction: prompt,
    });
  }

  /**
   * ==========================================
   * Run ExplanationAgent
   * ==========================================
   * 
   * Generates explanation based on execution result or answers session questions.
   */
  async run(ctx: any): Promise<any> {
    const universalState: UniversalState = ctx.input.universalState;

    if (!universalState) {
      return {
        message: "I apologize, but I couldn't process your request.",
        responseType: "error",
      };
    }

    // Check if this is a session history question
    const plan = universalState.state.plan;
    if (plan?.intent === "QUESTION_ABOUT_SESSION") {
      return await this.answerSessionQuestion(universalState);
    }

    // Generate explanation for action
    return await this.generateActionExplanation(universalState);
  }

  /**
   * ==========================================
   * Generate Action Explanation
   * ==========================================
   */
  private async generateActionExplanation(universalState: UniversalState): Promise<any> {
    const execution = universalState.state.execution;
    const validation = universalState.state.validation;
    const plan = universalState.state.plan;

    if (!execution) {
      // No execution yet - might be validation error
      if (validation && !validation.valid) {
        return {
          message: this.formatValidationError(validation),
          responseType: "error",
        };
      }

      return {
        message: "Processing your request...",
        responseType: "success",
      };
    }

    if (execution.success) {
      return {
        message: this.formatSuccessMessage(execution, plan),
        responseType: "success",
      };
    } else {
      return {
        message: this.formatErrorMessage(execution),
        responseType: "error",
      };
    }
  }

  /**
   * ==========================================
   * Answer Session Question
   * ==========================================
   */
  private async answerSessionQuestion(universalState: UniversalState): Promise<any> {
    // Build context from universal state
    const context = this.buildSessionContext(universalState);

    // Use LLM to generate answer
    const prompt = `Based on the following session history, answer the user's question about what happened in this session.

Session History:
${context}

User Question: ${universalState.inputSchema.message}

Provide a clear, natural language answer about what happened in this session.`;

    try {
      // Call LLM (simplified - in real implementation, use proper LLM call)
      const response = await this.generateLLMResponse(prompt);

      return {
        message: response,
        responseType: "success",
      };
    } catch (error: any) {
      return {
        message: "I apologize, but I couldn't retrieve the session history.",
        responseType: "error",
      };
    }
  }

  /**
   * ==========================================
   * Build Session Context
   * ==========================================
   */
  private buildSessionContext(universalState: UniversalState): string {
    const context: string[] = [];

    if (universalState.state.plan) {
      context.push(`Intent: ${universalState.state.plan.intent}`);
      context.push(`Entities: ${JSON.stringify(universalState.state.plan.entities)}`);
    }

    if (universalState.state.execution?.success) {
      context.push(`Action: ${JSON.stringify(universalState.state.execution.data)}`);
    }

    return context.join("\n");
  }

  /**
   * ==========================================
   * Format Success Message
   * ==========================================
   */
  private formatSuccessMessage(execution: any, plan: any): string {
    const { data } = execution;
    const { intent } = plan;

    switch (intent) {
      case "UPDATE_PRODUCT_PRICE":
        return `✅ Successfully updated the price of ${data.productName} (${data.sku}) from $${data.oldPrice} to $${data.newPrice}.`;

      case "CANCEL_ORDER":
        return `✅ Successfully cancelled order ${data.orderNumber}. The order status has been updated to 'cancelled'.`;

      case "UPDATE_ORDER_STATUS":
        return `✅ Successfully updated order ${data.orderNumber} status from '${data.oldStatus}' to '${data.newStatus}'.`;

      case "UPDATE_PRODUCT_DESCRIPTION":
        return `✅ Successfully updated the description for ${data.productName} (${data.sku}).`;

      default:
        return "✅ Action completed successfully.";
    }
  }

  /**
   * ==========================================
   * Format Error Message
   * ==========================================
   */
  private formatErrorMessage(execution: any): string {
    return `❌ Error: ${execution.error || "An error occurred while processing your request."}`;
  }

  /**
   * ==========================================
   * Format Validation Error
   * ==========================================
   */
  private formatValidationError(validation: any): string {
    if (validation.errors && validation.errors.length > 0) {
      return `❌ Error: ${validation.errors.join(", ")}`;
    }
    return "❌ Validation failed. Please check your input and try again.";
  }

  /**
   * ==========================================
   * Generate LLM Response (Placeholder)
   * ==========================================
   * 
   * In real implementation, this would call the LLM properly.
   */
  private async generateLLMResponse(prompt: string): Promise<string> {
    // This is a placeholder - in real implementation, use proper LLM call
    return "Based on the session history, I can see that...";
  }
}

