/**
 * Ollama Connection Verification
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Utility to verify Ollama is running and accessible.
 */

import { OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from "../config/ollama.config";

/**
 * ==========================================
 * Verify Ollama Connection
 * ==========================================
 * 
 * Checks if Ollama is running and the model is available.
 */
export async function verifyOllamaConnection(): Promise<{
  connected: boolean;
  modelAvailable: boolean;
  error?: string;
}> {
  try {
    // Check if Ollama API is accessible
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    
    if (!response.ok) {
      return {
        connected: false,
        modelAvailable: false,
        error: `Ollama API not accessible: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json() as { models?: Array<{ name: string }> };
    const models = data.models || [];
    const modelNames = models.map((m) => m.name);

    // Check if our model is available
    const modelAvailable = modelNames.some((name: string) => 
      name.includes(DEFAULT_OLLAMA_MODEL) || 
      name.includes("qwen3-coder") ||
      name.includes("qwen2.5-coder")
    );

    return {
      connected: true,
      modelAvailable,
      error: modelAvailable ? undefined : `Model ${DEFAULT_OLLAMA_MODEL} not found. Available models: ${modelNames.join(", ")}`,
    };
  } catch (error: any) {
    return {
      connected: false,
      modelAvailable: false,
      error: `Cannot connect to Ollama at ${OLLAMA_BASE_URL}: ${error.message}`,
    };
  }
}

/**
 * ==========================================
 * Test Ollama Generation
 * ==========================================
 * 
 * Tests if Ollama can generate text.
 */
export async function testOllamaGeneration(): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_OLLAMA_MODEL,
        prompt: "Say hello",
        stream: false,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Ollama API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json() as { response?: string };
    return {
      success: true,
      response: data.response || "No response",
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error testing Ollama: ${error.message}`,
    };
  }
}

