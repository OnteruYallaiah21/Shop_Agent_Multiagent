/**
 * Groq Configuration
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Configuration for Groq API (fallback when Gemini fails).
 */

// Ensure environment variables are loaded
import 'dotenv/config';

import { Groq } from 'groq-sdk';

/**
 * ==========================================
 * Groq Configuration
 * ==========================================
 * 
 * API Key for Groq API.
 * Looks for GROQ_API_KEY environment variable.
 */
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

/**
 * Default Groq model to use
 */
export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Groq API Base URL
 */
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * ==========================================
 * Get Groq Client Instance
 * ==========================================
 */
export function getGroqClient(): Groq {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY environment variable is required. " +
      "Set it before starting the service: export GROQ_API_KEY=your_api_key"
    );
  }

  return new Groq({
    apiKey: GROQ_API_KEY,
  });
}

/**
 * ==========================================
 * Get Groq Model Configuration
 * ==========================================
 */
export function getGroqModelConfig() {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY environment variable is required. " +
      "Set it before starting the service: export GROQ_API_KEY=your_api_key"
    );
  }

  return {
    model: DEFAULT_GROQ_MODEL,
    apiKey: GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
  };
}

/**
 * ==========================================
 * Check if Groq is Available
 * ==========================================
 */
export function isGroqAvailable(): boolean {
  return !!GROQ_API_KEY && GROQ_API_KEY.length > 0;
}

