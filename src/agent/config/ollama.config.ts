/**
 * Ollama Configuration
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Configuration for local Ollama API connection.
 */

/**
 * ==========================================
 * Ollama Configuration
 * ==========================================
 * 
 * Base URL for local Ollama API server.
 * Ollama runs on port 11434 by default.
 */
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/**
 * Default model to use (can be overridden)
 */
export const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-coder:30b";

/**
 * Alternative smaller model for testing
 */
export const TEST_OLLAMA_MODEL = "qwen2.5-coder:7b";

/**
 * ==========================================
 * Ollama API Endpoints
 * ==========================================
 */
export const OLLAMA_ENDPOINTS = {
  GENERATE: `${OLLAMA_BASE_URL}/api/generate`,
  CHAT: `${OLLAMA_BASE_URL}/api/chat`,
  MODELS: `${OLLAMA_BASE_URL}/api/tags`,
  SHOW: `${OLLAMA_BASE_URL}/api/show`,
};

/**
 * ==========================================
 * Get Ollama Model Configuration
 * ==========================================
 */
export function getOllamaModelConfig() {
  return {
    baseURL: OLLAMA_BASE_URL,
    model: DEFAULT_OLLAMA_MODEL,
    apiKey: undefined, // Ollama doesn't require API key
  };
}

