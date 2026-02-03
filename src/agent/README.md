# ADK Agent Implementation

## Structure

This directory contains the complete ADK agent implementation following the Sequential Pipeline Pattern with HITL.

## Files

- `admin.workflow.ts` - Main SequentialAgent controller
- `planner.agent.ts` - LlmAgent for intent extraction
- `validation.agent.ts` - Deterministic validation and guardrails
- `execution.agent.ts` - Deterministic action execution
- `explanation.agent.ts` - LlmAgent for explanations
- `policy.engine.ts` - HITL decision engine
- `service.ts` - Agent service entry point
- `types/universal.state.ts` - Universal state schema
- `utils/ids.ts` - ID generation utilities

## Flow Control

**SequentialAgent controls the flow** - NOT the LLM.

1. PlannerAgent (LLM) - Extracts intent
2. ValidationAgent (Deterministic) - Validates and checks guardrails
3. PolicyEngine - Decides if HITL is needed
4. ExecutionAgent (Deterministic) - Executes actions
5. ExplanationAgent (LLM) - Generates explanations

## Usage

```typescript
import { agentService } from './agent/service';

// Handle chat request
const result = await agentService.handleChatRequest(message, sessionId);

// Handle confirmation
const result = await agentService.handleConfirmation(workflowId, sessionId, confirmed);
```

