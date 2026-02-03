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
import { DEFAULT_GEMINI_MODEL } from "./config/gemini.config";

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
      model: DEFAULT_GEMINI_MODEL, // Gemini 2.5 Flash
      instruction: prompt,
    });
  }

  /**
   * ==========================================
   * ExplanationAgent - LlmAgent Usage
   * ==========================================
   * 
   * This agent extends LlmAgent from ADK.
   * The instruction prompt guides the LLM to generate explanations.
   * 
   * The workflow calls runAsync() which returns an AsyncGenerator.
   * The workflow collects the generated text from events.
   * 
   * Uses Gemini 2.5 Flash for generating explanations.
   */
  // All explanation logic is handled by the instruction prompt
  // The LLM generates natural language based on the context provided
  // The workflow passes the universal state context in the input message
}

