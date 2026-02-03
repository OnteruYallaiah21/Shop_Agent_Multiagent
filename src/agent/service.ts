/**
 * Agent Service - Main Entry Point
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This is the main service that handles agent requests.
 * It manages sessions, runs workflows, and handles HITL.
 */

import { Runner, InMemorySessionService, Event, stringifyContent } from "@google/adk";
import { AdminWorkflowAgent } from "./admin.workflow";
import { UniversalState } from "./types/universal.state";

/**
 * ==========================================
 * Agent Service - Main Controller
 * ==========================================
 * 
 * This service:
 * - Manages sessions with workflow IDs
 * - Runs SequentialAgent workflow
 * - Handles HITL confirmations
 * - Returns responses to UI
 */

export class AgentService {
  private sessionService: InMemorySessionService;
  private runner: Runner;
  private workflowAgent: AdminWorkflowAgent;

  constructor() {
    this.sessionService = new InMemorySessionService();
    this.workflowAgent = new AdminWorkflowAgent();
    this.runner = new Runner({
      agent: this.workflowAgent,
      appName: "shop_agent",
      sessionService: this.sessionService,
    });
  }

  /**
   * ==========================================
   * Handle Chat Request
   * ==========================================
   * 
   * Main entry point for chat requests.
   * Creates or retrieves session and runs workflow.
   * 
   * Flow: Chatbot -> AgentService -> SequentialAgent -> PlannerAgent -> ValidationAgent -> ExecutionAgent -> ExplanationAgent
   */
  async handleChatRequest(message: string, sessionId: string): Promise<any> {
    try {
      // Get or create session
      let session = await this.sessionService.getSession({
        appName: "shop_agent",
        userId: "admin",
        sessionId,
      });
      if (!session) {
        session = await this.sessionService.createSession({
          appName: "shop_agent",
          userId: "admin",
          sessionId,
        });
      }

      // Create context for workflow agent
      const ctx = {
        session: session,
        state: session.state || {},
        input: {
          message: message,
        },
      };

      // Run workflow agent directly (SequentialAgent controls flow)
      const result = await this.workflowAgent.run(ctx);

      // Check if confirmation is needed
      if (result.requiresConfirmation) {
        return {
          message: result.message || "Please confirm this action.",
          requiresConfirmation: true,
          workflowId: result.universalState?.inputSchema.workflowId,
          universalState: result.universalState,
        };
      }

      // Return success response
      return {
        message: result.message || "I apologize, but I couldn't process your request.",
        requiresConfirmation: false,
        workflowId: result.universalState?.inputSchema.workflowId,
        universalState: result.universalState,
      };
    } catch (error: any) {
      console.error("[AgentService] Error handling chat request:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message || "An unexpected error occurred";
      const errorStr = String(error.message || error).toLowerCase();
      
      // Check if it's an API key error (catch various error message formats)
      if (errorStr.includes("api key") || 
          errorStr.includes("groq_api_key") || 
          errorStr.includes("gemini_api_key") ||
          errorStr.includes("google_genai_api_key") ||
          errorStr.includes("no llm provider") ||
          errorStr.includes("both groq and gemini failed") ||
          errorStr.includes("gemini failed and groq is not available")) {
        errorMessage = `🔑 **API Key Required**\n\n` +
          `StorePilot needs an LLM API key to work.\n\n` +
          `**Quick Setup (Groq - Free tier):**\n` +
          `1. Get key: https://console.groq.com/keys\n` +
          `2. Terminal: export GROQ_API_KEY=your_key\n` +
          `3. Restart: npm run dev\n\n` +
          `**Or Gemini:**\n` +
          `1. Get key: https://aistudio.google.com/apikey\n` +
          `2. Terminal: export GEMINI_API_KEY=your_key\n` +
          `3. Restart: npm run dev`;
      }
      
      return {
        message: errorMessage,
        requiresConfirmation: false,
        error: true,
      };
    }
  }

  /**
   * ==========================================
   * Handle Confirmation
   * ==========================================
   * 
   * Handles user confirmation for HITL.
   * Resumes workflow from where it paused.
   */
  async handleConfirmation(workflowId: string, sessionId: string, confirmed: boolean): Promise<any> {
    try {
      // Get session
      const session = await this.sessionService.getSession({
        appName: "shop_agent",
        userId: "admin",
        sessionId,
      });
      if (!session) {
        throw new Error("Session not found");
      }

      // Get universal state
      const universalState = session.state?.universalState as UniversalState | undefined;
      if (!universalState) {
        throw new Error("Workflow state not found");
      }

      if (!confirmed) {
        // User rejected - update state
        universalState.state.workflowStatus = "COMPLETED";
        universalState.state.currentStep = "COMPLETED";
        universalState.metrics.success = false;

        return {
          message: "Action cancelled by user.",
          universalState,
        };
      }

      // Resume workflow
      const result = await this.workflowAgent.resumeAfterConfirmation(
        {
          session,
          state: session.state,
        },
        universalState
      );

      return result;
    } catch (error: any) {
      console.error("Error handling confirmation:", error);
      return {
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * ==========================================
   * Build Confirmation Message
   * ==========================================
   */
  private buildConfirmationMessage(universalState: UniversalState): string {
    const pendingAction = universalState.state.pendingAction;
    if (!pendingAction) return "Please confirm this action.";

    if (pendingAction.riskFlag === "PRICE_OUTLIER") {
      return `This is a large price change (from $${pendingAction.originalValue} → $${pendingAction.requestedValue}). Please confirm.`;
    }

    return `Please confirm: ${pendingAction.intent}`;
  }
}

// Export singleton instance
export const agentService = new AgentService();

