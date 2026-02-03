/**
 * Root Agent - Entry Point for ADK Web Interface
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This is the root agent exported for ADK devtools web interface.
 * It exports the AdminWorkflowAgent as the root agent.
 */

// Load environment variables first (before importing configs)
import 'dotenv/config';

import { AdminWorkflowAgent } from "./admin.workflow";
import { isGeminiAvailable } from "./config/gemini.config";

/**
 * ==========================================
 * Root Agent Export
 * ==========================================
 * 
 * ADK devtools web interface requires a root agent export.
 * This exports the AdminWorkflowAgent as the root agent.
 * 
 * Note: ADK's LlmAgent only supports Gemini natively, but AdminWorkflowAgent
 * intercepts LLM calls and uses Groq first (when available) to avoid quota limits.
 */
let rootAgent: AdminWorkflowAgent;

try {
  // Check Gemini availability
  const geminiAvailable = isGeminiAvailable();
  
  if (geminiAvailable) {
    console.log(`✅ Gemini 2.5 Flash is available. AdminWorkflowAgent will use Gemini as the LLM.`);
  } else {
    console.error("❌ GEMINI_API_KEY or GOOGLE_GENAI_API_KEY not set.");
    console.error("   Please set: export GEMINI_API_KEY=your_key");
    console.error("   Get key at: https://aistudio.google.com/apikey");
  }
  
  rootAgent = new AdminWorkflowAgent();
  console.log("✅ AdminWorkflowAgent created successfully.");
} catch (error: any) {
  console.error("❌ Failed to create AdminWorkflowAgent:", error.message);
  throw error;
}

export { rootAgent };

