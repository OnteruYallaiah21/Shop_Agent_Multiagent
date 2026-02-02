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
import { sendError } from "../utils/errors";

const router = Router();

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
      return sendError(res, 400, "Message or confirmation is required");
    }

    if (!sessionId) {
      return sendError(res, 400, "Session ID is required");
    }

    // Handle confirmation
    if (confirmed !== undefined && workflowId) {
      const result = await agentService.handleConfirmation(workflowId, sessionId, confirmed);
      return res.json(result);
    }

    // Handle regular chat message
    if (!message || typeof message !== "string") {
      return sendError(res, 400, "Message must be a non-empty string");
    }

    const result = await agentService.handleChatRequest(message, sessionId);

    res.json(result);
  } catch (error: any) {
    console.error("Error in agent chat route:", error);
    sendError(res, 500, error.message || "Internal server error");
  }
});

export default router;

