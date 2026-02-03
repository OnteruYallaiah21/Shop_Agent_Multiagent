/**
 * Agent Route - Chatbot API Endpoint
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This route handles chatbot requests and connects to the agent service.
 */

import { Router, Request, Response } from "express";
import { agentService } from "../agent/service";
import { sendError, ApiError } from "../utils/errors";
import { verifyOllamaConnection } from "../agent/utils/ollama.verify";

const router = Router();

/**
 * ==========================================
 * GET /agent/health - Check Agent Health
 * ==========================================
 * 
 * Verifies Ollama connection and agent service status.
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const ollamaStatus = await verifyOllamaConnection();
    
    res.json({
      status: ollamaStatus.connected && ollamaStatus.modelAvailable ? "healthy" : "degraded",
      ollama: ollamaStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    sendError(res, ApiError.internal(error.message || "Internal server error"));
  }
});

/**
 * ==========================================
 * POST /agent/chat - Handle Chat Request
 * ==========================================
 * 
 * Main endpoint for chatbot messages.
 * Handles both regular messages and confirmations.
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, sessionId, workflowId, confirmed } = req.body;

    // Basic validation
    if (!message && confirmed === undefined) {
      return sendError(res, ApiError.badRequest(undefined, { message: "Message or confirmation is required" }));
    }

    if (!sessionId) {
      return sendError(res, ApiError.badRequest(undefined, { message: "Session ID is required" }));
    }

    // Handle confirmation
    if (confirmed !== undefined && workflowId) {
      const result = await agentService.handleConfirmation(workflowId, sessionId, confirmed);
      return res.json(result);
    }

    // Handle regular chat message
    if (!message || typeof message !== "string") {
      return sendError(res, ApiError.badRequest(undefined, { message: "Message must be a non-empty string" }));
    }

    const result = await agentService.handleChatRequest(message, sessionId);

    res.json(result);
  } catch (error: any) {
    console.error("Error in agent chat route:", error);
    sendError(res, error instanceof ApiError ? error : ApiError.internal(error.message || "Internal server error"));
  }
});

export default router;

