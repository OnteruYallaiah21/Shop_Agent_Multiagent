# 🏗️ ShopAgent Multi-Agent Architecture - Complete System Design

**Developer:** Yallaiah onter  
**Email:** yallaiah.ai.enginner@gmail.com

---

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Admin UI    │  │ Storefront   │  │  Chatbot UI  │                 │
│  │ /admin      │  │   /          │  │  /admin/chat │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          │  HTTP POST       │  HTTP POST       │  HTTP POST
          │  /agent/chat    │  /agent/chat     │  /agent/chat
          └──────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT SERVICE LAYER (Port 3000)                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              AdminWorkflowAgent (SequentialAgent)                 │ │
│  │                    Main Orchestrator                              │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  Step 1: PlannerAgent (LlmAgent)                            │  │ │
│  │  │  - Uses Gemini 2.5 Flash                                    │  │ │
│  │  │  - Extracts intent + entities from natural language         │  │ │
│  │  │  - Calls tools to gather information (MANDATORY)            │  │ │
│  │  │  - Returns: { intent, entities, confidence }                │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                       │ │
│  │                           ▼                                       │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  Step 2: ValidationAgent (BaseAgent - Deterministic)       │  │ │
│  │  │  - No LLM usage                                            │  │ │
│  │  │  - Schema validation (Zod)                                │  │ │
│  │  │  - Business rule checks                                     │  │ │
│  │  │  - Guardrail evaluation                                    │  │ │
│  │  │  - Returns: { isValid, errors, riskFlags }                 │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                       │ │
│  │                           ▼                                       │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  Step 3: PolicyEngine (Deterministic)                      │  │ │
│  │  │  - Evaluates UniversalState                                │  │ │
│  │  │  - Decides if HITL (Human-in-the-Loop) needed              │  │ │
│  │  │  - Triggers: price deviation > 40%, low confidence, etc.   │  │ │
│  │  │  - Returns: { requiresConfirmation, pendingAction }        │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                       │ │
│  │                    ┌──────┴──────┐                                │ │
│  │                    │             │                                │ │
│  │              HITL? │             │ No HITL                        │ │
│  │                    ▼             ▼                                │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  Step 4: ExecutionAgent (BaseAgent - Deterministic)        │  │ │
│  │  │  - No LLM usage                                            │  │ │
│  │  │  - Calls underlying functions from mcp_tools               │  │ │
│  │  │  - Executes: updateProductPrice, cancelOrder, etc.          │  │ │
│  │  │  - Returns: { success, data, error, apiResponse }          │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                       │ │
│  │                           ▼                                       │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  Step 5: ExplanationAgent (LlmAgent)                     │  │ │
│  │  │  - Uses Gemini 2.5 Flash                                  │  │ │
│  │  │  - Generates natural language response                     │  │ │
│  │  │  - Answers session history questions                      │  │ │
│  │  │  - Formats product/order lists clearly                   │  │ │
│  │  │  - Returns: Human-readable message                        │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        TOOL LAYER (mcp_tools/)                          │
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                   │
│  │   Product Tools      │  │    Order Tools       │                   │
│  │  - getAllProducts    │  │  - getAllOrders      │                   │
│  │  - getProductBySku   │  │  - getOrderByNumber  │                   │
│  │  - updateProductPrice│  │  - cancelOrder       │                   │
│  │  - archiveProduct    │  │  - archiveOrder      │                   │
│  │  - ... (20+ tools)   │  │  - ... (15+ tools)   │                   │
│  └──────────┬───────────┘  └──────────┬───────────┘                   │
│             │                          │                                │
│             └──────────┬───────────────┘                                │
│                        ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Guardrails                                    │  │
│  │  - validation.guard.ts (schema + value validation)             │  │
│  │  - price.guard.ts (price outlier detection)                     │  │
│  │  - transition.guard.ts (order status transitions)               │  │
│  │  - inventory.guard.ts (inventory checks)                         │  │
│  │  - promotion.guard.ts (promotion validation)                    │  │
│  │  - human.confirm.guard.ts (HITL triggers)                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Storage)                               │
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                   │
│  │   Seed Data          │  │   Dynamic Data       │                   │
│  │  data/seed/          │  │  data/dynamic/       │                   │
│  │  - products.json    │  │  - products.json     │                   │
│  │  - orders.json      │  │  - orders.json      │                   │
│  │  - promotions.json │  │  - promotions.json  │                   │
│  └──────────────────────┘  └──────────────────────┘                   │
│                                                                          │
│  Storage Utility (src/utils/storage.ts):                                │
│  - Reads from seed on first load                                       │
│  - Writes to dynamic for updates                                       │
│  - Provides getAll(), getById(), update(), etc.                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow Example: "What products do you have?"

### Step-by-Step Execution:

```
1. USER INPUT
   └─> "what products do you have"
       │
       ▼
2. AgentService.handleChatRequest()
   └─> Creates UniversalState
       └─> Calls AdminWorkflowAgent.run()
           │
           ▼
3. PlannerAgent (LlmAgent)
   └─> Instruction: "MANDATORY: Call getAllProductsTool for inventory questions"
       └─> LLM calls: getAllProductsTool()
           └─> Tool returns: { status: "success", products: [...], total: 5 }
       └─> Extracts intent: "LIST_PRODUCTS"
       └─> Stores tool results in universalState.state.toolResults
       └─> Returns: { intent: "LIST_PRODUCTS", entities: {}, confidence: 0.98 }
           │
           ▼
4. ValidationAgent (Deterministic)
   └─> Checks: intent === "LIST_PRODUCTS" → read-only, skip validation
       └─> Returns: { isValid: true, errors: [] }
           │
           ▼
5. PolicyEngine (Deterministic)
   └─> Checks: read-only intent → no HITL needed
       └─> Returns: { requiresConfirmation: false }
           │
           ▼
6. ExecutionAgent (Deterministic)
   └─> Checks toolResults for getAllProducts result
       └─> If found: uses tool result data
       └─> If not found: calls getAllProducts() directly
       └─> Returns: { 
             success: true, 
             data: { products: [...], total: 5 },
             error: null 
           }
           │
           ▼
7. ExplanationAgent (LlmAgent)
   └─> Receives execution.data.products
       └─> Formats: "Here are 5 products: ..."
       └─> Instruction: "DO NOT say 'I don't have any products'"
       └─> Returns: "✅ I have 5 products available:\n• Premium Wireless Headphones..."
           │
           ▼
8. Response to User
   └─> JSON: { message: "✅ I have 5 products available:..." }
       └─> Displayed in chatbot UI
```

---

## 🔄 Complete Flow Example: "Change price of HP-BLK-001 to $49.99"

### Step-by-Step Execution:

```
1. USER INPUT
   └─> "Change price of HP-BLK-001 to $49.99"
       │
       ▼
2. PlannerAgent (LlmAgent)
   └─> Instruction: "Verify SKU exists before updating"
       └─> LLM calls: getProductBySkuTool({ sku: "HP-BLK-001" })
           └─> Tool returns: { status: "success", product: {...}, variant: {...} }
       └─> Extracts intent: "UPDATE_PRODUCT_PRICE"
       └─> Extracts entities: { sku: "HP-BLK-001", newPrice: 49.99 }
       └─> Returns: { intent: "UPDATE_PRODUCT_PRICE", entities: {...}, confidence: 0.96 }
           │
           ▼
3. ValidationAgent (Deterministic)
   └─> validateSkuExists() → ✅ SKU found
   └─> validatePrice() → ✅ Price >= 0
   └─> checkPriceOutlier() → Calculates deviation
       └─> If deviation > 40% → riskFlag = "PRICE_OUTLIER"
   └─> Returns: { isValid: true, riskFlag: "PRICE_OUTLIER", errors: [] }
           │
           ▼
4. PolicyEngine (Deterministic)
   └─> Checks: riskFlag === "PRICE_OUTLIER"
       └─> Returns: { requiresConfirmation: true, pendingAction: {...} }
           │
           ▼
5. HITL (Human-in-the-Loop)
   └─> Workflow pauses
   └─> Saves state: { status: "PENDING_CONFIRMATION", pendingAction: {...} }
   └─> Returns to user: "⚠️ Large price change detected. Please confirm..."
       │
       ▼
6. USER CONFIRMS
   └─> "CONFIRM price change for HP-BLK-001 to $49.99"
       │
       ▼
7. ExecutionAgent (Deterministic)
   └─> Calls: updateProductPrice({ sku: "HP-BLK-001", newPrice: 49.99 })
       └─> Storage.update() → writes to data/dynamic/products.json
       └─> Returns: { success: true, data: { sku, oldPrice, newPrice }, error: null }
           │
           ▼
8. ExplanationAgent (LlmAgent)
   └─> Generates: "✅ Successfully updated price of HP-BLK-001 from $299.99 to $49.99"
       │
       ▼
9. Response to User
   └─> JSON: { message: "✅ Successfully updated..." }
```

---

## 📋 Component Details

### 1. **AdminWorkflowAgent (SequentialAgent)**
- **Type:** Workflow Orchestrator
- **LLM:** ❌ No
- **Responsibilities:**
  - Controls execution flow
  - Manages UniversalState
  - Coordinates all sub-agents
  - Handles HITL pause/resume

### 2. **PlannerAgent (LlmAgent)**
- **Type:** Intent Extraction
- **LLM:** ✅ Yes (Gemini 2.5 Flash)
- **Responsibilities:**
  - Parses natural language
  - Extracts intent + entities
  - **MANDATORY tool calls** for data retrieval
  - Returns structured output

### 3. **ValidationAgent (BaseAgent)**
- **Type:** Business Rules
- **LLM:** ❌ No
- **Responsibilities:**
  - Schema validation (Zod)
  - Business rule checks
  - Guardrail evaluation
  - Risk detection

### 4. **PolicyEngine**
- **Type:** HITL Decision
- **LLM:** ❌ No
- **Responsibilities:**
  - Evaluates UniversalState
  - Decides if confirmation needed
  - Sets pendingAction state

### 5. **ExecutionAgent (BaseAgent)**
- **Type:** Action Execution
- **LLM:** ❌ No
- **Responsibilities:**
  - Calls underlying functions
  - Executes tool operations
  - Updates data storage
  - Returns execution results

### 6. **ExplanationAgent (LlmAgent)**
- **Type:** Response Generation
- **LLM:** ✅ Yes (Gemini 2.5 Flash)
- **Responsibilities:**
  - Generates natural language
  - Formats lists clearly
  - Answers session questions
  - Never hallucinates inventory

---

## 🛡️ Guardrails & Safety

### Price Guardrail
```typescript
if (ABS(newPrice - oldPrice) / oldPrice > 0.40) {
  riskFlag = "PRICE_OUTLIER"
  requiresConfirmation = true
}
```

### Order Status Transition Guardrail
```typescript
Valid transitions:
- pending → fulfilled ✅
- pending → cancelled ✅
- fulfilled → cancelled ❌ (already shipped)
```

### Delete Operation Guardrail
```typescript
// DELETE is FORBIDDEN
// All delete requests → ARCHIVE instead
if (intent === "DELETE_PRODUCT") {
  intent = "ARCHIVE_PRODUCT"
}
```

---

## 📊 UniversalState Schema

```typescript
{
  inputSchema: {
    message: string,
    sessionId: string,
    traceId: string,
    workflowId: string,
    timestamp: ISO string
  },
  metrics: {
    workflowTimestampStart: ISO string,
    workflowTimestampEnd: ISO string,
    plannerAgent: { timestampStart, timestampCompleted, latencyMs, ... },
    validationAgent: { ... },
    executionAgent: { ... },
    explanationAgent: { ... },
    llm: { promptTokens, completionTokens, model, ... },
    api: { latencyMs, statusCode, ... }
  },
  state: {
    currentStep: "PLANNING" | "VALIDATING" | "EXECUTING" | "RESPONDING",
    workflowStatus: "IDLE" | "PENDING_CONFIRMATION" | "EXECUTING" | "COMPLETED",
    plan: { intent, entities, confidence },
    validation: { isValid, errors, riskFlags },
    execution: { success, data, error },
    response: { message, responseType },
    pendingAction: { intent, entity, riskFlag },
    toolResults: [{ name, response }] // From PlannerAgent tool calls
  }
}
```

---

## 🔧 Tool Registry

### Product Tools (20+)
- `getAllProductsTool` - List all products
- `getProductBySkuTool` - Get by SKU
- `getProductsByCategoryTool` - Filter by category
- `getProductsByTagsTool` - Filter by tags
- `searchProductsTool` - Search name/description
- `updateProductPriceTool` - Update price
- `archiveProductTool` - Archive (safe delete)
- ... and more

### Order Tools (15+)
- `getAllOrdersTool` - List all orders
- `getOrderByOrderNumberTool` - Get by order number
- `getOrdersByStatusTool` - Filter by status
- `cancelOrderTool` - Cancel order
- `archiveOrderTool` - Archive (safe delete)
- ... and more

### Promotion Tools
- `getAllPromotionsTool` - List all promotions
- `getPromotionByIdTool` - Get by ID

---

## 🚀 Production Features

✅ **Logging & Tracing**
- Every step logged with traceId, workflowId, sessionId
- Per-agent timing metrics
- Complete audit trail

✅ **Error Handling**
- Schema validation at every step
- Graceful error messages
- Retry logic for LLM calls

✅ **State Persistence**
- UniversalState saved to workflow.state.json
- HITL state preserved across sessions
- Complete workflow replay capability

✅ **Security**
- Input validation (Zod schemas)
- No hard deletes (archive only)
- Audit trail for all operations

✅ **Extensibility**
- New tools: Add to mcp_tools/
- New agents: Extend BaseAgent
- New prompts: Version in prompts/v1/, prompts/v2/

---

## 📈 Comparison with Recommended Design

| Recommended Design | Our Implementation | Status |
|-------------------|-------------------|--------|
| Intent Agent (NLP/LLM) | ✅ PlannerAgent (LlmAgent) | ✅ Implemented |
| Planner Agent (Decision) | ✅ AdminWorkflowAgent + ValidationAgent | ✅ Implemented |
| Tool/Service Layer | ✅ mcp_tools/ (20+ tools) | ✅ Implemented |
| JSON Schema Registry | ✅ Zod schemas in tools | ✅ Implemented |
| Response Layer | ✅ ExplanationAgent (LlmAgent) | ✅ Implemented |
| Logging & Auditing | ✅ UniversalState + metrics | ✅ Implemented |
| Error Handling | ✅ ValidationAgent + guards | ✅ Implemented |
| Caching | ⚠️ In-memory (1s cache) | ⚠️ Basic |
| Security | ✅ Guardrails + validation | ✅ Implemented |
| HITL | ✅ PolicyEngine + confirmation | ✅ Implemented |

---

## 🎯 Key Differences from Recommended Design

### ✅ What We Have Better:
1. **Multi-Agent Orchestration:** SequentialAgent with clear separation
2. **HITL Integration:** Policy-based confirmation system
3. **Comprehensive Guardrails:** 6 different guard types
4. **UniversalState:** Complete traceability and debugging
5. **Versioned Prompts:** A/B testing capability

### ⚠️ What Could Be Enhanced:
1. **Caching:** Currently 1s in-memory cache → Could add Redis
2. **Microservices:** Currently monolith → Could split to services
3. **Confidence Thresholds:** Currently fixed → Could be configurable
4. **Parallel Tool Execution:** Currently sequential → Could parallelize

---

## 📝 Next Steps (Optional Enhancements)

1. **Add Redis Caching** for frequently accessed products/orders
2. **Split to Microservices** (Product Service, Order Service, Agent Service)
3. **Add Confidence Thresholds** configurable per intent type
4. **Parallel Tool Execution** for independent operations
5. **Add Monitoring Dashboard** for workflow metrics
6. **Add Unit Tests** for each agent and tool

---

**This architecture is production-ready and follows all best practices from the recommended design!** 🎉

