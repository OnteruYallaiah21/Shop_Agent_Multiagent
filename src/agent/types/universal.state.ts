/**
 * Universal State Types
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Defines the universal state schema that flows through all agents.
 */

export interface UniversalState {
  inputSchema: {
    message: string;
    sessionId: string;
    traceId: string;
    workflowId: string;
    timestamp: string;
  };
  metrics: {
    workflowTimestampStart: string;
    workflowTimestampEnd: string | null;
    totalLatencyMs: number | null;
    agentSteps: number;
    success: boolean | null;
    retries: number;
    plannerAgent: AgentMetrics;
    validationAgent: AgentMetrics;
    executionAgent: AgentMetrics;
    explanationAgent: AgentMetrics;
    llm: LLMMetrics;
    api: APIMetrics;
  };
  state: {
    currentStep: WorkflowStep;
    workflowStatus: WorkflowStatus;
    plan: PlanState | null;
    validation: ValidationState | null;
    execution: ExecutionState | null;
    response: ResponseState | null;
    pendingAction: PendingAction | null;
    conversationSummary: string | null;
  };
}

export type WorkflowStep = "IDLE" | "PLANNING" | "VALIDATING" | "EXECUTING" | "RESPONDING" | "COMPLETED" | "FAILED";
export type WorkflowStatus = "IDLE" | "PENDING_CONFIRMATION" | "EXECUTING" | "COMPLETED" | "FAILED";

export interface PlanState {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

export interface ValidationState {
  valid: boolean;
  riskFlag: string | null;
  errors: string[];
  entityExists: boolean | null;
  businessRulesPassed: boolean | null;
  requiresConfirmation: boolean;
  oldValue?: any;
  newValue?: any;
  deviationPercent?: number;
}

export interface ExecutionState {
  success: boolean;
  data: any | null;
  error: string | null;
  apiResponse: any | null;
}

export interface ResponseState {
  message: string | null;
  responseType: "success" | "confirmation" | "error" | null;
}

export interface PendingAction {
  intent: string | null;
  entity: any | null;
  riskFlag: string | null;
  originalValue: any | null;
  requestedValue: any | null;
}

export interface AgentMetrics {
  timestampStart: string | null;
  timestampCompleted: string | null;
  latencyMs: number | null;
  [key: string]: any;
}

export interface LLMMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextUsagePct: number;
  latencyMs: number | null;
  retryCount: number;
  model: string;
}

export interface APIMetrics {
  apiLatencyMs: number | null;
  fileWriteMs: number | null;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  errors: number;
}

/**
 * ==========================================
 * Create Initial Universal State
 * ==========================================
 */
export function createInitialState(
  message: string,
  sessionId: string,
  traceId: string,
  workflowId: string
): UniversalState {
  return {
    inputSchema: {
      message,
      sessionId,
      traceId,
      workflowId,
      timestamp: new Date().toISOString(),
    },
    metrics: {
      workflowTimestampStart: new Date().toISOString(),
      workflowTimestampEnd: null,
      totalLatencyMs: null,
      agentSteps: 0,
      success: null,
      retries: 0,
      plannerAgent: {
        timestampStart: null,
        timestampCompleted: null,
        latencyMs: null,
        intent: null,
        intentConfidence: null,
        entitiesExtracted: null,
        llmCalls: 0,
        errors: 0,
      },
      validationAgent: {
        timestampStart: null,
        timestampCompleted: null,
        latencyMs: null,
        schemaValidationFailures: 0,
        guardrailTriggers: [],
        riskFlags: [],
        validationPassed: null,
        errors: 0,
      },
      executionAgent: {
        timestampStart: null,
        timestampCompleted: null,
        latencyMs: null,
        toolCalls: 0,
        apiCalls: 0,
        apiSuccess: null,
        dataUpdated: null,
        errors: 0,
      },
      explanationAgent: {
        timestampStart: null,
        timestampCompleted: null,
        latencyMs: null,
        responseType: null,
        messageLength: null,
        errors: 0,
      },
      llm: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        contextUsagePct: 0,
        latencyMs: null,
        retryCount: 0,
        model: "qwen3-coder:30b",
      },
      api: {
        apiLatencyMs: null,
        fileWriteMs: null,
        endpoint: null,
        method: null,
        statusCode: null,
        errors: 0,
      },
    },
    state: {
      currentStep: "IDLE",
      workflowStatus: "IDLE",
      plan: null,
      validation: null,
      execution: null,
      response: null,
      pendingAction: null,
      conversationSummary: null,
    },
  };
}

