/**
 * Gemini Configuration
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Configuration for Google Gemini API.
 */

// Ensure environment variables are loaded
import 'dotenv/config';

/**
 * ==========================================
 * Gemini Configuration
 * ==========================================
 * 
 * API Key for Google Gemini API.
 * ADK uses @google/genai which looks for:
 * - GOOGLE_GENAI_API_KEY (preferred)
 * - GEMINI_API_KEY (fallback)
 */
export const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "";

/**
 * Default Gemini model to use
 */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Gemini API Base URL
 */
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * ==========================================
 * Get Gemini Model Configuration
 * ==========================================
 * 
 * Returns null if API key is not set (Gemini is optional when Groq is primary).
 */
export function getGeminiModelConfig() {
  if (!GEMINI_API_KEY) {
    // Return null instead of throwing - Gemini is optional when Groq is primary
    return null;
  }

  return {
    model: DEFAULT_GEMINI_MODEL,
    apiKey: GEMINI_API_KEY,
    baseURL: GEMINI_BASE_URL,
  };
}

/**
 * ==========================================
 * Check if Gemini is Available
 * ==========================================
 */
export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}

