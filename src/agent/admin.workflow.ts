/**
 * Admin Workflow Agent - Sequential Pipeline with HITL
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This is the main controller that orchestrates the entire workflow.
 * Uses SequentialAgent to control flow deterministically.
 */

import { SequentialAgent, Runner, InMemorySessionService, Event, stringifyContent } from "@google/adk";
import { PlannerAgent } from "./planner.agent";
import { ValidationAgent } from "./validation.agent";
import { ExecutionAgent } from "./execution.agent";
import { ExplanationAgent } from "./explanation.agent";
import { PolicyEngine } from "./policy.engine";
import { generateWorkflowId, generateTraceId } from "./utils/ids";
import { UniversalState, createInitialState } from "./types/universal.state";

/**
 * ==========================================
 * AdminWorkflowAgent - Main Controller
 * ==========================================
 * 
 * This SequentialAgent controls the entire flow:
 * 1. PlannerAgent (LLM) - Extracts intent
 * 2. ValidationAgent (Deterministic) - Validates and checks guardrails
 * 3. PolicyEngine - Decides if HITL is needed
 * 4. ExecutionAgent (Deterministic) - Executes actions
 * 5. ExplanationAgent (LLM) - Generates explanations
 * 
 * Flow is controlled by SequentialAgent, NOT by LLM.
 */
export class AdminWorkflowAgent extends SequentialAgent {
  private policyEngine: PolicyEngine;

  constructor() {
    super({
      name: "admin_workflow",
      subAgents: [
        new PlannerAgent(),
        new ValidationAgent(),
        new ExecutionAgent(),
        new ExplanationAgent(),
      ],
    });

    this.policyEngine = new PolicyEngine();
  }

  /**
   * ==========================================
   * Run Workflow - Main Entry Point
   * ==========================================
   * 
   * This method is called by the Runner when a new message arrives.
   * It initializes the universal state and orchestrates the workflow.
   */
  async run(ctx: any): Promise<any> {
    // Initialize universal state
    const universalState = createInitialState(
      ctx.input.message,
      ctx.session.id,
      generateTraceId(),
      generateWorkflowId()
    );

    // Store in session state
    ctx.state.universalState = universalState;

    // Update workflow status
    universalState.state.workflowStatus = "EXECUTING";
    universalState.state.currentStep = "PLANNING";

    try {
      // Step 1: PlannerAgent (LLM) - Extract intent
      universalState.metrics.plannerAgent.timestampStart = new Date().toISOString();
      const planResult = await this.runPlannerAgent(ctx, universalState);
      universalState.metrics.plannerAgent.timestampCompleted = new Date().toISOString();
      universalState.state.plan = planResult;
      universalState.state.currentStep = "VALIDATING";

      // Step 2: ValidationAgent (Deterministic) - Validate and check guardrails
      universalState.metrics.validationAgent.timestampStart = new Date().toISOString();
      const validationResult = await this.runValidationAgent(ctx, universalState);
      universalState.metrics.validationAgent.timestampCompleted = new Date().toISOString();
      universalState.state.validation = validationResult;
      universalState.state.currentStep = "VALIDATING";

      // Step 3: PolicyEngine - Check if HITL is needed
      const policyDecision = await this.policyEngine.evaluate(universalState);

      if (policyDecision.outcome === "CONFIRM") {
        // HITL required - pause workflow
        universalState.state.workflowStatus = "PENDING_CONFIRMATION";
        universalState.state.pendingAction = {
          intent: universalState.state.plan?.intent || null,
          entity: universalState.state.plan?.entities || null,
          riskFlag: validationResult.riskFlag || null,
          originalValue: validationResult.oldValue || null,
          requestedValue: validationResult.newValue || null,
        };

        // Return confirmation request
        return {
          requiresConfirmation: true,
          message: policyDecision.message,
          universalState,
        };
      }

      // Step 4: ExecutionAgent (Deterministic) - Execute actions
      if (validationResult.valid) {
        universalState.state.currentStep = "EXECUTING";
        universalState.metrics.executionAgent.timestampStart = new Date().toISOString();
        const executionResult = await this.runExecutionAgent(ctx, universalState);
        universalState.metrics.executionAgent.timestampCompleted = new Date().toISOString();
        universalState.state.execution = executionResult;
      }

      // Step 5: ExplanationAgent (LLM) - Generate explanation
      universalState.state.currentStep = "RESPONDING";
      universalState.metrics.explanationAgent.timestampStart = new Date().toISOString();
      const explanationResult = await this.runExplanationAgent(ctx, universalState);
      universalState.metrics.explanationAgent.timestampCompleted = new Date().toISOString();
      universalState.state.response = explanationResult;

      // Complete workflow
      universalState.state.workflowStatus = "COMPLETED";
      universalState.state.currentStep = "COMPLETED";
      universalState.metrics.workflowTimestampEnd = new Date().toISOString();
      universalState.metrics.totalLatencyMs = this.calculateTotalLatency(universalState);
      universalState.metrics.success = true;

      return {
        message: explanationResult.message,
        universalState,
      };
    } catch (error: any) {
      // Handle errors
      universalState.state.workflowStatus = "FAILED";
      universalState.state.currentStep = "FAILED";
      universalState.metrics.workflowTimestampEnd = new Date().toISOString();
      universalState.metrics.success = false;

      return {
        message: `Error: ${error.message}`,
        universalState,
      };
    }
  }

  /**
   * ==========================================
   * Run PlannerAgent
   * ==========================================
   */
  private async runPlannerAgent(ctx: any, universalState: UniversalState): Promise<any> {
    const plannerAgent = new PlannerAgent();
    const result = await plannerAgent.run({
      ...ctx,
      input: {
        message: universalState.inputSchema.message,
      },
    });

    // Update metrics
    universalState.metrics.plannerAgent.intent = result.intent;
    universalState.metrics.plannerAgent.intentConfidence = result.confidence;
    universalState.metrics.plannerAgent.entitiesExtracted = Object.keys(result.entities || {}).length;
    universalState.metrics.plannerAgent.llmCalls = 1;

    return result;
  }

  /**
   * ==========================================
   * Run ValidationAgent
   * ==========================================
   */
  private async runValidationAgent(ctx: any, universalState: UniversalState): Promise<any> {
    const validationAgent = new ValidationAgent();
    const result = await validationAgent.run({
      ...ctx,
      input: {
        plan: universalState.state.plan,
      },
    });

    // Update metrics
    universalState.metrics.validationAgent.validationPassed = result.valid;
    universalState.metrics.validationAgent.riskFlags = result.riskFlag ? [result.riskFlag] : [];
    universalState.metrics.validationAgent.guardrailTriggers = result.riskFlag ? [result.riskFlag] : [];

    return result;
  }

  /**
   * ==========================================
   * Run ExecutionAgent
   * ==========================================
   */
  private async runExecutionAgent(ctx: any, universalState: UniversalState): Promise<any> {
    const executionAgent = new ExecutionAgent();
    const result = await executionAgent.run({
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
   */
  private async runExplanationAgent(ctx: any, universalState: UniversalState): Promise<any> {
    const explanationAgent = new ExplanationAgent();
    const result = await explanationAgent.run({
      ...ctx,
      input: {
        universalState,
      },
    });

    // Update metrics
    universalState.metrics.explanationAgent.responseType = result.responseType;
    universalState.metrics.explanationAgent.messageLength = result.message?.length || 0;

    return result;
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
    universalState.metrics.executionAgent.timestampStart = new Date().toISOString();
    const executionResult = await this.runExecutionAgent(ctx, universalState);
    universalState.metrics.executionAgent.timestampCompleted = new Date().toISOString();
    universalState.state.execution = executionResult;

    // Generate explanation
    universalState.state.currentStep = "RESPONDING";
    universalState.metrics.explanationAgent.timestampStart = new Date().toISOString();
    const explanationResult = await this.runExplanationAgent(ctx, universalState);
    universalState.metrics.explanationAgent.timestampCompleted = new Date().toISOString();
    universalState.state.response = explanationResult;

    // Complete workflow
    universalState.state.workflowStatus = "COMPLETED";
    universalState.state.currentStep = "COMPLETED";
    universalState.metrics.workflowTimestampEnd = new Date().toISOString();
    universalState.metrics.totalLatencyMs = this.calculateTotalLatency(universalState);
    universalState.metrics.success = true;

    return {
      message: explanationResult.message,
      universalState,
    };
  }
}

