# StorePilot Chat → SequentialAgent → PlannerAgent → Backend Data Flow

## Complete Connection Flow

### 1. User Input (StorePilot Chat)
```
User types: "Change price of SKU-001 to $49.99"
   ↓
Chatbot JavaScript (admin.js / storefront-chatbot.js)
   ↓
POST /agent/chat
   {
     "message": "Change price of SKU-001 to $49.99",
     "sessionId": "admin-1234567890"
   }
```

### 2. Agent Service (service.ts)
```
AgentService.handleChatRequest()
   ↓
Creates/retrieves session
   ↓
Calls AdminWorkflowAgent.run()
```

### 3. SequentialAgent (admin.workflow.ts)
```
AdminWorkflowAgent (CONTROLLER)
   ↓
Step 1: PlannerAgent.run()
   ↓
Step 2: ValidationAgent.run()
   ↓
Step 3: PolicyEngine.evaluate()
   ↓
Step 4: ExecutionAgent.run() (if approved)
   ↓
Step 5: ExplanationAgent.run()
```

### 4. PlannerAgent (planner.agent.ts)
```
PlannerAgent (LlmAgent)
   ↓
Uses Ollama (qwen3-coder:30b)
   ↓
Extracts intent and entities
   ↓
Returns: {
     intent: "UPDATE_PRODUCT_PRICE",
     entities: { sku: "SKU-001", newPrice: 49.99 },
     confidence: 0.96
   }
   ↓
Stored in: universalState.state.plan
```

### 5. ValidationAgent (validation.agent.ts)
```
ValidationAgent (Deterministic)
   ↓
Reads: universalState.state.plan
   ↓
Validates SKU exists
   ↓
Checks price rules
   ↓
Checks guardrails (price outlier > 40%)
   ↓
Returns: {
     valid: true,
     riskFlag: null,
     errors: []
   }
   ↓
Stored in: universalState.state.validation
```

### 6. PolicyEngine (policy.engine.ts)
```
PolicyEngine (HITL Decision)
   ↓
Reads: universalState.state.validation
   ↓
Checks if requiresConfirmation = true
   ↓
If yes → Returns: { outcome: "CONFIRM" }
   ↓
If no → Returns: { outcome: "CONTINUE" }
```

### 7. ExecutionAgent (execution.agent.ts)
```
ExecutionAgent (Deterministic)
   ↓
Reads: universalState.state.plan
   ↓
Calls: updateProductPriceTool.execute()
   ↓
Tool calls: Backend API
   ↓
Backend updates: data/dynamic/products.json
   ↓
Returns: {
     success: true,
     data: { sku, oldPrice, newPrice }
   }
   ↓
Stored in: universalState.state.execution
```

### 8. ExplanationAgent (explanation.agent.ts)
```
ExplanationAgent (LlmAgent)
   ↓
Reads: universalState.state.execution
   ↓
Uses Ollama (qwen3-coder:30b)
   ↓
Generates natural language explanation
   ↓
Returns: {
     message: "✅ Successfully updated...",
     responseType: "success"
   }
   ↓
Stored in: universalState.state.response
```

### 9. Response to Chatbot
```
AgentService returns:
   {
     message: "✅ Successfully updated...",
     workflowId: "SHOP-1234567890",
     universalState: { ... }
   }
   ↓
Chatbot displays message
   ↓
If success → Refreshes data (loadRecentOrders(), loadProducts())
   ↓
Backend data changes are now visible in UI
```

## Data Change Flow

1. **User Request** → Chatbot
2. **PlannerAgent** → Extracts intent (UPDATE_PRODUCT_PRICE)
3. **ValidationAgent** → Validates (SKU exists, price valid)
4. **PolicyEngine** → Checks HITL (price outlier?)
5. **ExecutionAgent** → Calls tool → Backend API
6. **Backend** → Updates `data/dynamic/products.json`
7. **ExplanationAgent** → Generates response
8. **Chatbot** → Shows message + Refreshes UI
9. **UI** → Shows updated data

## Key Points

- **SequentialAgent controls flow** - NOT the LLM
- **PlannerAgent extracts meaning** - Uses LLM for intent
- **ValidationAgent enforces rules** - No LLM, deterministic
- **PolicyEngine decides HITL** - No LLM, deterministic
- **ExecutionAgent executes actions** - No LLM, calls tools
- **ExplanationAgent explains** - Uses LLM for natural language
- **Backend data changes** - Reflected immediately in UI

## Session Management

- Each chat session has a unique `sessionId`
- Each workflow has a unique `workflowId`
- Universal state flows through all agents
- State persists in session for HITL resume

