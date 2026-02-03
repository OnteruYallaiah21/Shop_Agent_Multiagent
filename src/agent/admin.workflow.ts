/**
 * Admin Workflow Agent - Sequential Pipeline with HITL
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This is the main controller that orchestrates the entire workflow.
 * Uses SequentialAgent to control flow deterministically.
 */

import { SequentialAgent, Runner, InMemorySessionService, Event, stringifyContent, InvocationContext } from "@google/adk";
import { PlannerAgent } from "./planner.agent";
import { ValidationAgent } from "./validation.agent";
import { ExecutionAgent } from "./execution.agent";
import { ExplanationAgent } from "./explanation.agent";
import { PolicyEngine } from "./policy.engine";
import { generateWorkflowId, generateTraceId } from "./utils/ids";
import { UniversalState, createInitialState } from "./types/universal.state";
import { isGeminiAvailable } from "./config/gemini.config";
import { getAllProducts } from "../mcp_tools/products.tool";

/**
 * ==========================================
 * AdminWorkflowAgent - Main Controller
 * ==========================================
 * 
 * This agent orchestrates the entire admin workflow:
 * 1. PlannerAgent (LLM) - Extracts intent from natural language
 * 2. ValidationAgent (Deterministic) - Validates and checks guardrails
 * 3. PolicyEngine (Deterministic) - Decides if HITL is needed
 * 4. ExecutionAgent (Deterministic) - Executes actions via tools
 * 5. ExplanationAgent (LLM) - Generates natural language response
 * 
 * Flow Control: This agent controls the flow, NOT the LLM agents.
 */

export class AdminWorkflowAgent extends SequentialAgent {
  private policyEngine: PolicyEngine;

  constructor() {
    // Create agents for subAgents array so ADK can discover them and their tools
    // Even though we manually call them, having them in subAgents helps ADK web interface
    const plannerAgent = new PlannerAgent();
    const validationAgent = new ValidationAgent();
    const executionAgent = new ExecutionAgent();
    const explanationAgent = new ExplanationAgent();
    
    super({
      name: "admin_workflow",
      subAgents: [
        plannerAgent,    // Include so ADK can see tools
        validationAgent,
        executionAgent,
        explanationAgent,
      ],
    });

    // Store references for manual calls
    this.plannerAgent = plannerAgent;
    this.validationAgent = validationAgent;
    this.executionAgent = executionAgent;
    this.explanationAgent = explanationAgent;
    
    this.policyEngine = new PolicyEngine();
  }
  
  // Store agent references for manual calls
  private plannerAgent: PlannerAgent;
  private validationAgent: ValidationAgent;
  private executionAgent: ExecutionAgent;
  private explanationAgent: ExplanationAgent;

  /**
   * ==========================================
   * Run Workflow
   * ==========================================
   * 
   * Main entry point for the workflow.
   * Orchestrates all agents in sequence.
   */
  async run(ctx: any): Promise<any> {
    console.log(`[AdminWorkflow] ========== RUN CALLED ==========`);
    console.log(`[AdminWorkflow] Context keys:`, Object.keys(ctx || {}));
    console.log(`[AdminWorkflow] ctx.input:`, JSON.stringify(ctx.input || {}, null, 2));
    console.log(`[AdminWorkflow] ctx.session:`, ctx.session?.id || 'NO SESSION');
    console.log(`[AdminWorkflow] ctx.state keys:`, ctx.state ? Object.keys(ctx.state) : 'NO STATE');
    
    // Ensure ctx.state exists
    if (!ctx.state) {
      ctx.state = {};
      console.log(`[AdminWorkflow] Created new ctx.state`);
    }

    // Initialize universal state
    const message = ctx.input?.message || ctx.input?.text || "";
    const sessionId = ctx.session?.id || "unknown";
    
    console.log(`[AdminWorkflow] Extracted message: "${message}"`);
    console.log(`[AdminWorkflow] Extracted sessionId: "${sessionId}"`);
    
    const universalState = createInitialState(
      message,
      sessionId,
      generateTraceId(),
      generateWorkflowId()
    );

    // Store in session state
    ctx.state.universalState = universalState;

    // Update workflow status
    universalState.state.workflowStatus = "EXECUTING";
    universalState.state.currentStep = "PLANNING";

    try {
      console.log(`[AdminWorkflow] Starting workflow for message: "${universalState.inputSchema.message}"`);
      console.log(`[AdminWorkflow] Workflow ID: ${universalState.inputSchema.workflowId}, Trace ID: ${universalState.inputSchema.traceId}`);
      
      // Step 1: PlannerAgent (LLM) - Extract intent
      console.log(`[AdminWorkflow] Step 1: Running PlannerAgent to extract intent...`);
      universalState.metrics.plannerAgent.timestampStart = new Date().toISOString();
      
      let plan: any;
      try {
        plan = await this.runPlannerAgent(ctx, universalState);
        if (!plan || !plan.intent) {
          throw new Error("PlannerAgent returned invalid plan: missing intent");
        }
      } catch (plannerError: any) {
        console.error(`[AdminWorkflow] ❌ PlannerAgent failed:`, plannerError);
        console.error(`[AdminWorkflow] Error stack:`, plannerError.stack);
        throw new Error(`PlannerAgent failed: ${plannerError.message}`);
      }
      
      universalState.metrics.plannerAgent.timestampCompleted = new Date().toISOString();
      universalState.state.plan = plan;
      ctx.state.plan = plan; // Also store in ctx.state for sub-agents
      console.log(`[AdminWorkflow] PlannerAgent completed. Intent: ${plan.intent}, Confidence: ${plan.confidence}`);

      // Check if this is a read-only intent (skip validation/execution for these)
      const readOnlyIntents = ["LIST_PRODUCTS", "LIST_ORDERS", "LIST_PROMOTIONS", "SHOW_PRODUCT_INFO", "SHOW_ORDER_INFO"];
      const isReadOnly = readOnlyIntents.includes(plan.intent);

      if (!isReadOnly) {
        // Step 2: ValidationAgent (Deterministic) - Validate and check guardrails
        console.log(`[AdminWorkflow] Step 2: Running ValidationAgent...`);
        universalState.state.currentStep = "VALIDATING";
        universalState.metrics.validationAgent.timestampStart = new Date().toISOString();
        const validation = await this.runValidationAgent(ctx, universalState);
        universalState.metrics.validationAgent.timestampCompleted = new Date().toISOString();
        universalState.state.validation = validation;
        console.log(`[AdminWorkflow] ValidationAgent completed. Valid: ${validation.isValid}, Risk: ${validation.riskFlag || 'none'}`);

        if (!validation.isValid) {
          universalState.state.workflowStatus = "FAILED";
          universalState.state.currentStep = "FAILED";
          universalState.metrics.workflowTimestampEnd = new Date().toISOString();
          universalState.metrics.success = false;

          const validationErrorResponse = {
            message: `❌ Validation failed: ${validation.errors.join(", ")}`,
            universalState,
            error: true,
          };
          console.log(`[AdminWorkflow] Returning validation error: ${validationErrorResponse.message}`);
          return validationErrorResponse;
        }

        // Step 3: PolicyEngine (Deterministic) - Check if HITL is needed
        console.log(`[AdminWorkflow] Step 3: Running PolicyEngine...`);
        const policyDecision = await this.policyEngine.evaluate(universalState);

        if (policyDecision.outcome === "CONFIRM") {
          // Human-in-the-loop required
          console.log(`[AdminWorkflow] ⚠️ HITL required: ${policyDecision.reason}`);
          universalState.state.workflowStatus = "PENDING_CONFIRMATION";
          universalState.state.pendingAction = {
            intent: plan.intent,
            entity: plan.entities,
            riskFlag: policyDecision.reason || null,
            originalValue: validation.oldValue,
            requestedValue: validation.newValue,
          };

          const confirmationResponse = {
            message: `⚠️ ${policyDecision.reason}\n\nPlease confirm this action.`,
            requiresConfirmation: true,
            universalState,
          };
          console.log(`[AdminWorkflow] Returning confirmation request: ${confirmationResponse.message.substring(0, 100)}...`);
          return confirmationResponse;
        }
      }

      // Step 4: ExecutionAgent (Deterministic) - Execute actions
      console.log(`[AdminWorkflow] Step 4: Running ExecutionAgent...`);
      universalState.state.currentStep = "EXECUTING";
      universalState.metrics.executionAgent.timestampStart = new Date().toISOString();
      const execution = await this.runExecutionAgent(ctx, universalState);
      universalState.metrics.executionAgent.timestampCompleted = new Date().toISOString();
      universalState.state.execution = execution;
      console.log(`[AdminWorkflow] ExecutionAgent completed. Success: ${execution.success}`);

      // Step 5: ExplanationAgent (LLM) - Generate explanation
      console.log(`[AdminWorkflow] Step 5: Running ExplanationAgent to generate response...`);
      universalState.state.currentStep = "RESPONDING";
      universalState.metrics.explanationAgent.timestampStart = new Date().toISOString();
      const explanationResult = await this.runExplanationAgent(ctx, universalState);
      universalState.metrics.explanationAgent.timestampCompleted = new Date().toISOString();
      universalState.state.response = explanationResult;
      console.log(`[AdminWorkflow] ExplanationAgent completed. Response length: ${explanationResult.message?.length || 0} chars`);

      // Complete workflow
      universalState.state.workflowStatus = "COMPLETED";
      universalState.state.currentStep = "COMPLETED";
      universalState.metrics.workflowTimestampEnd = new Date().toISOString();
      universalState.metrics.totalLatencyMs = this.calculateTotalLatency(universalState);
      universalState.metrics.success = true;
      
      console.log(`[AdminWorkflow] ✅ Workflow completed successfully in ${universalState.metrics.totalLatencyMs}ms`);

      const finalResponse = {
        message: explanationResult.message,
        universalState,
      };
      
      console.log(`[AdminWorkflow] Returning final response. Message length: ${finalResponse.message?.length || 0}`);
      console.log(`[AdminWorkflow] Final response preview: ${finalResponse.message?.substring(0, 200) || 'NO MESSAGE'}...`);

      return finalResponse;
    } catch (error: any) {
      // Handle errors
      console.error(`[AdminWorkflow] ❌ Error in workflow:`, error);
      console.error(`[AdminWorkflow] Error stack:`, error.stack);
      
      universalState.state.workflowStatus = "FAILED";
      universalState.state.currentStep = "FAILED";
      universalState.metrics.workflowTimestampEnd = new Date().toISOString();
      universalState.metrics.success = false;

      // Return error message that ADK can display
      const errorMessage = error.message || "An unexpected error occurred";
      console.error(`[AdminWorkflow] Returning error message: ${errorMessage}`);

      const errorResponse = {
        message: `❌ Error: ${errorMessage}`,
        universalState,
        error: true,
      };
      
      console.log(`[AdminWorkflow] Returning error response. Message: ${errorResponse.message.substring(0, 200)}...`);
      
      return errorResponse;
    }
  }

  /**
   * ==========================================
   * Run PlannerAgent
   * ==========================================
   * 
   * Calls PlannerAgent which uses Gemini 2.5 Flash (only LLM).
   */
  private async runPlannerAgent(ctx: any, universalState: UniversalState): Promise<any> {
    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      throw new Error(
        `❌ Gemini API key is not configured.\n\n` +
        `Please set GEMINI_API_KEY: export GEMINI_API_KEY=your_key\n` +
        `Get your API key at: https://aistudio.google.com/apikey\n\n` +
        `After setting the key, restart the server with: npm run dev`
      );
    }

    const plannerAgent = new PlannerAgent();
    
    // Create context for PlannerAgent
    const plannerCtx = {
      ...ctx,
      input: {
        message: universalState.inputSchema.message,
      },
    };

    let llmResponse = "";
    const toolResults: any[] = []; // Store tool call results

    console.log(`[PlannerAgent] 🔄 Using Gemini 2.5 Flash (gemini-2.5-flash)...`);
    
    try {
      // Run PlannerAgent with Gemini - ADK returns AsyncGenerator
      console.log(`[PlannerAgent] Starting Gemini LLM call...`);
      const events = plannerAgent.runAsync(plannerCtx);
      
      let eventCount = 0;
      // Collect events and extract LLM response + tool results
      for await (const event of events) {
        eventCount++;
        console.log(`[PlannerAgent] Received event #${eventCount}, author: ${event.author}`);
        
        // Extract text content from LLM response
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              llmResponse += part.text;
              console.log(`[PlannerAgent] Received text chunk (${part.text.length} chars), total: ${llmResponse.length} chars`);
            }
            // Capture tool function responses
            if (part.functionResponse) {
              const toolResponse: any = part.functionResponse.response;
              toolResults.push({
                name: part.functionResponse.name,
                response: toolResponse,
              });
              let responsePreview: string;
              if (typeof toolResponse === 'string') {
                responsePreview = toolResponse.substring(0, 200);
              } else {
                responsePreview = JSON.stringify(toolResponse || {}).substring(0, 200);
              }
              console.log(`[PlannerAgent] Tool called: ${part.functionResponse.name}`, responsePreview);
            }
            // Capture tool function calls (for debugging)
            if (part.functionCall) {
              console.log(`[PlannerAgent] Tool call requested: ${part.functionCall.name}`, 
                JSON.stringify(part.functionCall.args).substring(0, 200));
            }
          }
        }
      }
      
      console.log(`[PlannerAgent] Finished collecting events. Total events: ${eventCount}, Response length: ${llmResponse.length}`);
      
      // Check if we got any response
      if (!llmResponse || llmResponse.trim().length === 0) {
        throw new Error("Gemini returned empty response. No text content received.");
      }
      
      // Log tool results for debugging
      if (toolResults.length > 0) {
        console.log(`[PlannerAgent] Captured ${toolResults.length} tool results`);
        // Store tool results in universalState for ExecutionAgent to use
        universalState.state.toolResults = toolResults;
      }
      
      universalState.metrics.llm.model = "gemini-2.5-flash";
      universalState.metrics.llm.retryCount = 0;
      console.log(`[PlannerAgent] ✅ Gemini succeeded with ${llmResponse.length} chars`);
    } catch (geminiError: any) {
      // Gemini failed
      const geminiErrorMsg = geminiError.message || String(geminiError);
      const isQuotaExceeded = geminiErrorMsg.includes('quota') || 
                               geminiErrorMsg.includes('Quota') || 
                               geminiErrorMsg.includes('exceeded') ||
                               geminiErrorMsg.includes('rate limit');
      
      console.error(`[PlannerAgent] ❌ Gemini failed: ${geminiErrorMsg}`);
      
      if (isQuotaExceeded) {
        throw new Error(
          `❌ Gemini quota exceeded.\n\n` +
          `Please wait a few minutes and try again, or upgrade your Gemini plan.\n` +
          `Check your quota at: https://aistudio.google.com/app/apikey`
        );
      } else {
        throw new Error(
          `❌ Gemini API error: ${geminiErrorMsg}\n\n` +
          `Please check:\n` +
          `1. GEMINI_API_KEY is set correctly\n` +
          `2. API key is valid and not expired\n` +
          `3. Network connection is working\n\n` +
          `Get a new API key at: https://aistudio.google.com/apikey`
        );
      }
    }

    // Check if we have a response
    if (!llmResponse || llmResponse.trim().length === 0) {
      console.error(`[PlannerAgent] ❌ Empty response from LLM`);
      throw new Error("PlannerAgent received empty response from LLM. Please check Gemini API key and quota limits.");
    }

    // Parse LLM response to extract structured plan
    console.log(`[PlannerAgent] Parsing LLM response (${llmResponse.length} chars)...`);
    console.log(`[PlannerAgent] Raw response preview: ${llmResponse.substring(0, 500)}...`);
    
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = llmResponse.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/g, "").trim();
    }

    let plan: any;
    try {
      plan = JSON.parse(jsonStr);
      console.log(`[PlannerAgent] ✅ Successfully parsed JSON plan:`, JSON.stringify(plan, null, 2));
    } catch (parseError: any) {
      console.error(`[PlannerAgent] ❌ Failed to parse JSON response:`, parseError);
      console.error(`[PlannerAgent] Raw response (first 1000 chars):`, jsonStr.substring(0, 1000));
      console.error(`[PlannerAgent] Full response length:`, jsonStr.length);
      throw new Error(`PlannerAgent returned invalid JSON: ${parseError.message}. Raw response: ${jsonStr.substring(0, 200)}...`);
    }

    // Validate plan structure
    if (!plan.intent || !plan.entities) {
      throw new Error(`Invalid plan structure from PlannerAgent: ${JSON.stringify(plan)}`);
    }

    // Store plan in context state (for compatibility with existing code)
    ctx.state.plan = plan;

    // Update metrics
    universalState.metrics.plannerAgent.intent = plan.intent;
    universalState.metrics.plannerAgent.intentConfidence = plan.confidence || 0.5;
    universalState.metrics.plannerAgent.entitiesExtracted = Object.keys(plan.entities || {}).length;
    universalState.metrics.plannerAgent.llmCalls = 1;
    
    // Metrics already set above
    console.log(`✅ Gemini 2.5 Flash successful`);

    return plan;
  }

  /**
   * ==========================================
   * Run ValidationAgent
   * ==========================================
   * 
   * Calls ValidationAgent which is deterministic (no LLM).
   */
  private async runValidationAgent(ctx: any, universalState: UniversalState): Promise<any> {
    // Ensure plan exists
    if (!universalState.state.plan) {
      throw new Error("Cannot run ValidationAgent: plan is not set. PlannerAgent must run first.");
    }
    
    // Use the validationAgent from constructor
    return await this.validationAgent.run({
      ...ctx,
      input: {
        plan: universalState.state.plan,
      },
    });
  }

  /**
   * ==========================================
   * Run ExecutionAgent
   * ==========================================
   * 
   * Calls ExecutionAgent which is deterministic (no LLM).
   */
  private async runExecutionAgent(ctx: any, universalState: UniversalState): Promise<any> {
    // Ensure plan exists
    if (!universalState.state.plan) {
      throw new Error("Cannot run ExecutionAgent: plan is not set. PlannerAgent must run first.");
    }
    
    // Use the executionAgent from constructor
    const result = await this.executionAgent.run({
      ...ctx,
      input: {
        plan: universalState.state.plan,
        validation: universalState.state.validation,
      },
    });

    // Update metrics
    universalState.metrics.executionAgent.apiSuccess = result.success;
    universalState.metrics.executionAgent.dataUpdated = result.success;
    universalState.metrics.executionAgent.toolCalls = 1;
    universalState.metrics.executionAgent.apiCalls = 1;

    return result;
  }

  /**
   * ==========================================
   * Run ExplanationAgent
   * ==========================================
   * 
   * Calls ExplanationAgent which uses Gemini 2.5 Flash.
   * ADK handles the LLM call and generates explanation.
   */
  private async runExplanationAgent(ctx: any, universalState: UniversalState): Promise<any> {
    // Use the explanationAgent from constructor
    // Build prompt context for explanation
    const execution = universalState.state.execution;
    const plan = universalState.state.plan;
    
    // Create context with universal state for LLM
    const explanationCtx = {
      ...ctx,
      input: {
        message: this.buildExplanationPrompt(universalState),
      },
    };

    // Run ExplanationAgent - ADK returns AsyncGenerator
    // Note: ExplanationAgent uses Gemini 2.5 Flash
    // For simple queries, use default explanation immediately
    console.log(`[ExplanationAgent] Starting explanation generation...`);
    let explanationText = "";
    
    // For simple queries like "hi", use default explanation immediately
    // For complex queries, try to use Gemini but fallback if it fails
    const isSimpleQuery = !universalState.inputSchema.message || 
                          universalState.inputSchema.message.toLowerCase().trim() === "hi" ||
                          universalState.inputSchema.message.toLowerCase().trim() === "hello";
    
    if (isSimpleQuery) {
      console.log(`[ExplanationAgent] Simple query detected, using default explanation`);
      explanationText = this.generateDefaultExplanation(universalState);
    } else {
      try {
        // Set a timeout for Gemini call (10 seconds)
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error("ExplanationAgent timeout - Gemini may be slow")), 10000);
        });
        
        const explanationPromise = (async () => {
          const events = this.explanationAgent.runAsync(explanationCtx);
          for await (const event of events) {
            if (event.content?.parts) {
              for (const part of event.content.parts) {
                if (part.text) {
                  explanationText += part.text;
                }
              }
            }
          }
          return explanationText;
        })();
        
        explanationText = await Promise.race([explanationPromise, timeoutPromise]);
        console.log(`[ExplanationAgent] ✅ Generated explanation (${explanationText.length} chars)`);
      } catch (error: any) {
        console.error(`[ExplanationAgent] ⚠️ Error generating explanation:`, error.message);
        // Fallback to default explanation if LLM fails
        explanationText = this.generateDefaultExplanation(universalState);
        console.log(`[ExplanationAgent] Using fallback explanation`);
      }
    }

    // Generate response object
    const result = {
      message: explanationText.trim() || this.generateDefaultExplanation(universalState),
      responseType: execution?.success ? "success" : "error",
    };
    
    console.log(`[ExplanationAgent] Final response: ${result.message.substring(0, 100)}...`);

    // Update metrics
    universalState.metrics.explanationAgent.responseType = result.responseType;
    universalState.metrics.explanationAgent.messageLength = result.message?.length || 0;

    return result;
  }

  /**
   * ==========================================
   * Build Explanation Prompt
   * ==========================================
   * 
   * Builds the prompt for ExplanationAgent based on universal state.
   */
  private buildExplanationPrompt(universalState: UniversalState): string {
    const execution = universalState.state.execution;
    const plan = universalState.state.plan;
    const validation = universalState.state.validation;
    const intent = plan?.intent;

    if (execution?.success) {
      // Handle LIST operations - format data clearly for LLM
      if (intent === "LIST_PRODUCTS") {
        console.log(`[buildExplanationPrompt] LIST_PRODUCTS intent detected`);
        console.log(`[buildExplanationPrompt] execution.data:`, execution.data ? Object.keys(execution.data) : 'null');
        console.log(`[buildExplanationPrompt] execution.data.products:`, execution.data?.products ? `${execution.data.products.length} products` : 'null/undefined');
        
        const products = execution.data?.products;
        if (!products || !Array.isArray(products) || products.length === 0) {
          console.error(`[buildExplanationPrompt] ❌ No products found in execution.data!`);
          console.error(`[buildExplanationPrompt] execution.data:`, JSON.stringify(execution.data).substring(0, 1000));
          // Still try to get products directly
          const directResult = getAllProducts();
          if (directResult.status === 'success' && directResult.products && directResult.products.length > 0) {
            const productList = directResult.products.slice(0, 50).map((p: any) => {
              const firstVariant = p.variants?.[0];
              const sku = firstVariant?.sku || 'N/A';
              const price = firstVariant?.price || 0;
              return `- ${p.name || 'Unknown'} (SKU: ${sku}) - $${price.toFixed(2)} - Status: ${p.status || 'active'}`;
            }).join('\n');
            return `The user asked to list products. Here are ${directResult.total || directResult.products.length} product(s) found:\n\n${productList}${(directResult.total || directResult.products.length) > 50 ? `\n\n... and ${(directResult.total || directResult.products.length) - 50} more products.` : ''}\n\nGenerate a clear, friendly response listing these products. DO NOT say "I don't have any products" - you have ${directResult.total || directResult.products.length} products.`;
          }
          return `The user asked to list products, but no products were found in the execution data. Please inform the user that the system is checking for products.`;
        }
        
        const total = execution.data.total || products.length;
        console.log(`[buildExplanationPrompt] ✅ Formatting ${products.length} products for LLM`);
        
        const productList = products.slice(0, 50).map((p: any) => {
          const firstVariant = p.variants?.[0];
          const sku = firstVariant?.sku || 'N/A';
          const price = firstVariant?.price || 0;
          return `- ${p.name || 'Unknown'} (SKU: ${sku}) - $${price.toFixed(2)} - Status: ${p.status || 'active'}`;
        }).join('\n');
        
        const prompt = `The user asked to list products. Here are ${total} product(s) found:\n\n${productList}${total > 50 ? `\n\n... and ${total - 50} more products.` : ''}\n\nCRITICAL: Generate a clear, friendly response listing these products. DO NOT say "I don't have any products" or "I don't have any products in the system" - you have ${total} products available. List them clearly.`;
        console.log(`[buildExplanationPrompt] Generated prompt with ${total} products`);
        return prompt;
      }
      
      if (intent === "LIST_ORDERS" && execution.data?.orders) {
        const orders = execution.data.orders;
        const total = execution.data.total || orders.length;
        const orderList = orders.slice(0, 50).map((o: any) => {
          return `- ${o.orderNumber} - ${o.status} - $${o.grandTotal?.toFixed(2) || '0.00'} - Customer: ${o.customer?.email || 'N/A'}`;
        }).join('\n');
        return `The user asked to list orders. Here are ${total} order(s) found:\n\n${orderList}${total > 50 ? `\n\n... and ${total - 50} more orders.` : ''}\n\nGenerate a clear, friendly response listing these orders.`;
      }
      
      if (intent === "LIST_PROMOTIONS" && execution.data?.promotions) {
        const promotions = execution.data.promotions;
        const total = execution.data.total || promotions.length;
        const promotionList = promotions.slice(0, 50).map((p: any) => {
          return `- ${p.name || p.id} - ${p.status || 'active'}`;
        }).join('\n');
        return `The user asked to list promotions. Here are ${total} promotion(s) found:\n\n${promotionList}${total > 50 ? `\n\n... and ${total - 50} more promotions.` : ''}\n\nGenerate a clear, friendly response listing these promotions.`;
      }

      // For other operations, use generic format
      return `Generate a success message for: ${intent} with data: ${JSON.stringify(execution.data)}`;
    } else if (execution?.error) {
      return `Generate an error message: ${execution.error}`;
    } else if (validation && !validation.valid) {
      return `Generate an error message: ${validation.errors.join(", ")}`;
    }
    
    return `Generate a response for the user's request: ${universalState.inputSchema.message}`;
  }

  /**
   * ==========================================
   * Generate Default Explanation
   * ==========================================
   * 
   * Fallback if LLM doesn't generate explanation.
   */
  private generateDefaultExplanation(universalState: UniversalState): string {
    const execution = universalState.state.execution;
    const plan = universalState.state.plan;
    const intent = plan?.intent;
    const message = universalState.inputSchema.message?.toLowerCase() || "";
    
    // Handle simple greetings
    if (message === "hi" || message === "hello" || message.trim() === "") {
      return "👋 Hello! I'm StorePilot, your AI assistant. I can help you manage your store using natural language. Try asking me:\n\n• \"What products do you have?\"\n• \"Show me all orders\"\n• \"Change the price of HP-BLK-001 to $49.99\"\n• \"Cancel order ORD-1001\"";
    }
    
    // Generate a simple explanation based on the intent and execution result
    if (execution?.success) {
      if (intent === "LIST_PRODUCTS" && execution.data?.products) {
        const products = execution.data.products;
        const total = execution.data.total || products.length;
        return `✅ Found ${total} product(s). Here are the products:\n\n${products.slice(0, 10).map((p: any) => `- ${p.name || p.sku} (SKU: ${p.sku || 'N/A'}) - $${(p.variants?.[0]?.price || 0).toFixed(2)}`).join('\n')}${total > 10 ? `\n\n... and ${total - 10} more products.` : ''}`;
      }
      if (intent === "LIST_ORDERS" && execution.data?.orders) {
        const orders = execution.data.orders;
        const total = execution.data.total || orders.length;
        return `✅ Found ${total} order(s). Here are the orders:\n\n${orders.slice(0, 10).map((o: any) => `- ${o.orderNumber} - ${o.status} - $${o.grandTotal?.toFixed(2) || '0.00'}`).join('\n')}${total > 10 ? `\n\n... and ${total - 10} more orders.` : ''}`;
      }
      if (intent === "LIST_PROMOTIONS" && execution.data?.promotions) {
        const promotions = execution.data.promotions;
        const total = execution.data.total || promotions.length;
        return `✅ Found ${total} promotion(s). Here are the promotions:\n\n${promotions.slice(0, 10).map((p: any) => `- ${p.name || p.id} - ${p.status || 'active'}`).join('\n')}${total > 10 ? `\n\n... and ${total - 10} more promotions.` : ''}`;
      }
      return "✅ Action completed successfully.";
    }
    return "❌ Action failed. Please check the error details.";
  }

  /**
   * ==========================================
   * Calculate Total Latency
   * ==========================================
   */
  private calculateTotalLatency(universalState: UniversalState): number {
    const start = new Date(universalState.metrics.workflowTimestampStart).getTime();
    const end = new Date(universalState.metrics.workflowTimestampEnd || new Date().toISOString()).getTime();
    return end - start;
  }

  /**
   * ==========================================
   * Resume Workflow After Confirmation
   * ==========================================
   * 
   * Called when user confirms a pending action.
   */
  async resumeAfterConfirmation(ctx: any, universalState: UniversalState): Promise<any> {
    // Clear pending action
    universalState.state.pendingAction = null;
    universalState.state.workflowStatus = "EXECUTING";
    universalState.state.currentStep = "EXECUTING";

    // Continue with execution
    const execution = await this.runExecutionAgent(ctx, universalState);
    universalState.state.execution = execution;

    // Generate explanation
    const explanation = await this.runExplanationAgent(ctx, universalState);
    universalState.state.response = explanation;

    // Complete workflow
    universalState.state.workflowStatus = "COMPLETED";
    universalState.metrics.workflowTimestampEnd = new Date().toISOString();
    universalState.metrics.success = true;

    return {
      message: explanation.message,
      universalState,
    };
  }
}
