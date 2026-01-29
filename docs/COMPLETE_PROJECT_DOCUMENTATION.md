# Enterprise Multi-Agent E-Commerce System
## Complete Project Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Agent System Design](#agent-system-design)
5. [MCP (Multi-Agent Control Plane)](#mcp-multi-agent-control-plane)
6. [Guardrails & Validation](#guardrails--validation)
7. [Implementation Plan](#implementation-plan)
8. [Technical Specifications](#technical-specifications)
9. [Testing Strategy](#testing-strategy)
10.[Deployment & Operations](#deployment--operations)
11.[Observability & Logging](#observability--logging)
12.[Quick Start Guide](#quick-start-guide)

---

## Executive Summary

### My Understanding Based on Requirements

**Source**: All requirements and understanding are derived from `README.md` - AI Agent Engineering Assessment

**What I Understand from the Requirements**:

1. **Project Context** (from README.md Overview):
   - This is a simplified e-commerce platform
   - We need to build a natural-language AI agent
   - The agent assists a **single store administrator** (not multiple users)
   - The system already has: storefront UI, admin UI, and fully functional backend API

2. **What We're Provided** (from README.md Application Structure):
   - ✅ Storefront UI at `http://localhost:3000/` (customer-facing, read-only)
   - ✅ Admin Dashboard at `http://localhost:3000/admin` (displays orders, products)
   - ✅ Backend API at `http://localhost:3000/api` (fully functional)
   - ✅ Admin UI already allows: updating order status, editing product details

3. **What We Must Build** (from README.md Your Task):
   - **Task 1**: Chatbot UI embedded in admin page
   - **Task 2**: Backend agent service that chatbot communicates with
   - **Task 3**: Agent logic that translates natural language into API actions

4. **Core Requirement** (from README.md):
   - Transform simple admin tasks from multi-step UI interactions to natural language commands
   - Example commands: "Cancel order ORD-1001" or "Change the price of SKU-001 to $49.99"
   - Focus: **Correctness, clarity, and sound engineering judgment** - NOT UI polish or exhaustive features

### Project Purpose

Based on my understanding of the requirements, I need to build a **natural-language AI agent system** that enables the store administrator to manage e-commerce operations through conversational interactions. The system interprets admin requests in natural language, validates them against business rules, and safely executes API calls to manage orders and products.

**Core Requirement**: Transform simple admin tasks from multi-step UI interactions to natural language commands like "Cancel order ORD-1001" or "Change the price of SKU-001 to $49.99".

### What I Actually Want to Build

**Based on README.md Requirements Analysis**, I understand I need to implement:

1. **Chatbot UI** (from README.md Chatbot UI Requirements)
   - **Location**: Embedded directly on admin page (`/admin`) - as specified in requirements
   - **Implementation**: Use off-the-shelf chatbot UI library (Suggested: AI SDK UI)
   - **Responsibilities** (from requirements):
     - Accept natural language input from admin user
     - Display conversational responses
     - Show confirmations, summaries, and error messages
     - Communicate with agent service via HTTP (or similar)

2. **Backend Agent Service** (from README.md Agent Service Requirements)
   - **Framework**: Google Agent Development Kit (ADK) for TypeScript - **REQUIRED** by assessment
   - **LLM Provider**: Ollama - **REQUIRED** by assessment (Qwen3 models up to 30b parameters)
   - **Responsibilities** (from requirements):
     - Accept natural language requests from chatbot
     - Maintain short-term conversational context
     - Decide when and how to call backend APIs
     - Execute actions safely and deterministically
     - Return clear, human-readable responses

3. **Required Agent Capabilities** (from README.md Required Agent Capabilities):

   **Orders** (exactly as specified in requirements):
   - Change order status (e.g., pending → shipped → cancelled)
   - Validate order existence and transitions
   - Handle errors gracefully and explain outcomes
   - **Example from requirements**: "Cancel order ORD-1043"

   **Products** (exactly as specified in requirements):
   - Update product description
   - Update product price
   - Validate inputs (e.g., non-negative prices)
   - **Example from requirements**: "Change the price of SKU-001 to $49.99"

   **Important Note from Requirements**: "You are not required to support every API endpoint. Depth and correctness matter more than breadth."

### Key Objectives (Derived from Requirements)

**Based on README.md evaluation criteria and expectations**, my objectives are:

- **Natural Language Interface**: Allow the admin to manage orders and products via conversational AI
- **Safety & Validation**: Enforce business rules through dynamic guardrails
- **Correctness Over Breadth**: Focus on depth and correctness, not exhaustive feature coverage (explicitly stated in requirements)
- **Clear Architecture**: Separation of concerns, tool definitions, error handling (from Architecture Expectations)
- **Maintainable**: Business rules stored in JSON, editable without code changes (our design decision for flexibility)

**Evaluation Focus** (from README.md Evaluation Criteria):
- Agent design and reasoning
- API integration correctness
- Error handling and recovery
- Code quality and test coverage
- Communication and engineering judgment

### Technology Stack (Based on Requirements)

**Required Technologies** (from README.md):
- **Backend**: Node.js 18+, Express.js, TypeScript (existing project setup)
- **AI Framework**: Google Agent Development Kit (ADK) for TypeScript - **REQUIRED**
- **LLM**: Ollama - **REQUIRED** (Qwen3 models up to 30b parameters)
- **UI Library**: AI SDK UI - **SUGGESTED** in requirements (https://ai-sdk.dev/docs/ai-sdk-ui/overview)
- **Testing**: Jest 29+ (existing project setup)
- **Storage**: File-based JSON (existing, upgradeable to database)

**My Understanding**:
- The project already has Express.js backend, TypeScript, and Jest configured
- I must use ADK for TypeScript (required by assessment)
- I must use Ollama (required by assessment)
- I should use AI SDK UI (suggested in requirements)
- All other technology choices are based on existing project structure

### Happy Paths (Success Scenarios)

#### 1. Order Cancellation - Happy Path
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: Detects intent "cancel_order", extracts orderNumber "ORD-1001" via tools in MCP
    ↓
Validation Agent: Validates order exists, status allows cancellation (pending/confirmed)
    ↓
Execution Agent: Calls POST /api/orders/:id/cancel via MCP tools
    ↓
Response: "Order ORD-1001 has been cancelled successfully. A refund will be processed."
```

#### 2. Order Status Update - Happy Path
```
Admin: "Mark order ORD-1002 as shipped"
    ↓
Conversation Agent: Detects intent "update_order_status", extracts orderNumber "ORD-1002", status "shipped" via tools in MCP
    ↓
Validation Agent: Validates order exists, status transition allowed (processing → shipped)
    ↓
Execution Agent: Calls POST /api/orders/:id/status with {status: "shipped"} via MCP tools
    ↓
Response: "Order ORD-1002 status has been updated to 'shipped'."
```

#### 3. Product Price Update - Happy Path
```
Admin: "Change the price of SKU-001 to $49.99"
    ↓
Conversation Agent: Detects intent "update_product_price", extracts sku "SKU-001", price 49.99 via tools in MCP
    ↓
Validation Agent: Validates SKU exists, price is valid (positive number, within limits)
    ↓
Execution Agent: Calls PUT /api/products/:id/variants/:variantId with {price: 49.99} via MCP tools
    ↓
Response: "Price for SKU-001 has been updated to $49.99."
```

#### 4. Product Description Update - Happy Path
```
Admin: "Update the description of Premium Wireless Headphones to mention 40-hour battery"
    ↓
Conversation Agent: Detects intent "update_product_description", extracts product name, new description via tools in MCP
    ↓
Validation Agent: Validates product exists, description is not empty
    ↓
Execution Agent: Calls PUT /api/products/:id with {description: "..."} via MCP tools
    ↓
Response: "Description for Premium Wireless Headphones has been updated successfully."
```

### Edge Cases & Error Scenarios

#### 1. Order Cancellation - Edge Cases

**Case A: Order Already Shipped**
```
Admin: "Cancel order ORD-1004"
    ↓
Validation Agent: Detects order status is "shipped"
    ↓
Response: "Order ORD-1004 cannot be cancelled because it has already been shipped. 
          Please contact customer service for assistance."
```

**Case B: Order Not Found**
```
Admin: "Cancel order ORD-9999"
    ↓
Validation Agent: Order lookup fails (404)
    ↓
Response: "Order ORD-9999 not found. Please check the order number and try again."
```

**Case C: Invalid Order Number Format**
```
Admin: "Cancel order 12345"
    ↓
Validation Agent: Order number doesn't match format (ORD-####)
    ↓
Response: "Invalid order number format. Please use format ORD-#### (e.g., ORD-1001)."
```

#### 2. Order Status Update - Edge Cases

**Case A: Invalid Status Transition**
```
Admin: "Change order ORD-1003 from delivered to pending"
    ↓
Validation Agent: Detects invalid transition (delivered → pending not allowed)
    ↓
Response: "Cannot change order status from 'delivered' to 'pending'. 
          Allowed transitions from 'delivered' are: completed."
```

**Case B: Ambiguous Status**
```
Admin: "Ship order ORD-1005"
    ↓
Conversation Agent: Detects intent but needs clarification (ship = shipped status)
    ↓
Response: "I understand you want to update order ORD-1005. 
          Do you want to set the status to 'shipped'?"
```

#### 3. Product Price Update - Edge Cases

**Case A: Negative Price**
```
Admin: "Change price of SKU-001 to -$10"
    ↓
Validation Agent: Detects negative price (violates min_price: 0.01)
    ↓
Response: "Price cannot be negative. Please enter a valid price (minimum $0.01)."
```

**Case B: Price Too High**
```
Admin: "Change price of SKU-001 to $200000"
    ↓
Validation Agent: Detects price exceeds max_price: 100000
    ↓
Response: "Price exceeds maximum allowed value of $100,000. Please enter a lower price."
```

**Case C: SKU Not Found**
```
Admin: "Change price of SKU-9999 to $50"
    ↓
Validation Agent: SKU lookup fails (404)
    ↓
Response: "Product with SKU-9999 not found. Please check the SKU and try again."
```

**Case D: Missing Price Value**
```
Admin: "Change the price of SKU-001"
    ↓
Conversation Agent: Detects intent but price value missing
    ↓
Response: "I need the new price value. What price would you like to set for SKU-001?"
```

**Case E: Significant Price Decrease - Threshold Exceeded (Requires Human Confirmation)**
```
Admin: "Change price of SKU-001 to $74"
    ↓
Validation Agent: 
  • Current price: $899
  • New price: $74
  • Absolute difference: $825
  • Percentage decrease: 91.8%
  • Threshold check: Exceeds 50% decrease threshold
    ↓
Response: "⚠️ Significant price change detected:
          Current price: $899.00
          New price: $74.00
          Difference: $825.00 (91.8% decrease)
          
          This exceeds the 50% price change threshold. 
          Please confirm this is correct:
          - Type 'yes' to proceed with $74.00
          - Type 'no' to cancel
          - Or provide the correct price"
    ↓
Admin: "no" (or provides correct price like $740)
    ↓
Response: "Price change cancelled. Please provide the correct price."
```

**Case F: Significant Price Increase - Threshold Exceeded (Requires Human Confirmation)**
```
Admin: "Change price of SKU-001 to $2000"
    ↓
Validation Agent:
  • Current price: $899
  • New price: $2000
  • Absolute difference: $1101
  • Percentage increase: 122.5%
  • Threshold check: Exceeds 50% increase threshold
    ↓
Response: "⚠️ Significant price change detected:
          Current price: $899.00
          New price: $2,000.00
          Difference: $1,101.00 (122.5% increase)
          
          This exceeds the 50% price change threshold.
          Please confirm this is correct:
          - Type 'yes' to proceed with $2,000.00
          - Type 'no' to cancel
          - Or provide the correct price"
```

**Case G: Price Difference Within Threshold (Auto-Approved)**
```
Admin: "Change price of SKU-001 to $950"
    ↓
Validation Agent:
  • Current price: $899
  • New price: $950
  • Absolute difference: $51
  • Percentage change: 5.7%
  • Threshold check: Within 50% threshold ✓
    ↓
Execution Agent: Proceeds with price update (no confirmation needed)
    ↓
Response: "Price for SKU-001 has been updated from $899.00 to $950.00."
```

**Case H: Large Absolute Difference But Small Percentage (Edge Case)**
```
Admin: "Change price of SKU-001 to $825"
    ↓
Validation Agent:
  • Current price: $899
  • New price: $825
  • Absolute difference: $74
  • Percentage decrease: 8.2%
  • Threshold check: Within 50% threshold ✓
  • Note: Large absolute difference but small percentage
    ↓
Execution Agent: Proceeds with price update
    ↓
Response: "Price for SKU-001 has been updated from $899.00 to $825.00."
```

**Case I: Price Difference Exactly at Threshold**
```
Admin: "Change price of SKU-001 to $449.50"
    ↓
Validation Agent:
  • Current price: $899
  • New price: $449.50
  • Absolute difference: $449.50
  • Percentage decrease: 50.0%
  • Threshold check: Exactly at 50% threshold
    ↓
Response: "⚠️ Price change at threshold limit:
          Current price: $899.00
          New price: $449.50
          Difference: $449.50 (50.0% decrease)
          
          This is at the threshold limit. Please confirm:
          - Type 'yes' to proceed
          - Type 'no' to cancel"
```

**Case J: Human Confirmation - Admin Confirms Large Price Change**
```
Admin: "Change price of SKU-001 to $74"
    ↓
Validation Agent: Detects threshold exceeded, requests confirmation
    ↓
Response: "⚠️ Significant price change detected. Please confirm..."
    ↓
Admin: "yes"
    ↓
Validation Agent: Confirmation received, proceeds with validation
    ↓
Execution Agent: Updates price to $74.00
    ↓
Response: "Price for SKU-001 has been updated from $899.00 to $74.00. 
          This change has been logged for review."
```

**Case K: Human Confirmation - Admin Provides Corrected Price**
```
Admin: "Change price of SKU-001 to $74"
    ↓
Validation Agent: Detects threshold exceeded, requests confirmation
    ↓
Response: "⚠️ Significant price change detected. Please confirm..."
    ↓
Admin: "Actually, make it $740"
    ↓
Validation Agent: 
  • New price: $740
  • Current price: $899
  • Percentage change: 17.7%
  • Threshold check: Within threshold ✓
    ↓
Execution Agent: Updates price to $740.00
    ↓
Response: "Price for SKU-001 has been updated from $899.00 to $740.00."
```

**Guardrail Configuration for Price Thresholds** (stored in `MCP/registry/guardrails.json`):
```json
{
  "product": {
    "price": {
      "min_price": 0.01,
      "max_price": 100000,
      "change_threshold": {
        "percentage": 50,
        "absolute_difference": 500,
        "require_confirmation": true,
        "confirmation_message": "⚠️ Significant price change detected. Please confirm..."
      }
    }
  }
}
```

**My Understanding of Threshold Logic**:
- **Percentage Threshold**: If price change exceeds 50% (increase or decrease), require confirmation
- **Absolute Difference Threshold**: If absolute difference exceeds $500, require confirmation
- **Both Checks**: Either condition triggers human confirmation
- **Confirmation Flow**: Admin can confirm, cancel, or provide corrected price
- **Logging**: All threshold-triggered changes are logged for audit

#### 4. Product Description Update - Edge Cases

**Case A: Product Not Found**
```
Admin: "Update description of NonExistent Product"
    ↓
Validation Agent: Product lookup fails (404)
    ↓
Response: "Product 'NonExistent Product' not found. Please check the product name."
```

**Case B: Empty Description**
```
Admin: "Update description of SKU-001 to empty"
    ↓
Validation Agent: Description cannot be empty
    ↓
Response: "Product description cannot be empty. Please provide a valid description."
```

#### 5. General Error Scenarios

**Case A: Unclear Intent**
```
Admin: "Do something with that order"
    ↓
Conversation Agent: Low confidence, missing entities
    ↓
Response: "I need more information. Which order are you referring to, and what would you like to do with it?"
```

**Case B: API Service Unavailable**
```
Admin: "Cancel order ORD-1001"
    ↓
Execution Agent: API call fails (503 Service Unavailable)
    ↓
Response: "I encountered an issue while processing your request. Please try again in a moment, 
          or contact support if the problem persists."
```

**Case C: Network Timeout**
```
Admin: "Update price of SKU-001 to $50"
    ↓
Execution Agent: API call times out
    ↓
Response: "The request timed out. Please try again."
```

**Case D: LLM Service Unavailable**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: Cannot connect to Ollama
    ↓
Response: "AI service is temporarily unavailable. Please try again in a moment."
```

#### 6. Input Validation Edge Cases

**Case A: Malformed Input**
```
Admin: "Cancel order ORD-1001 and also update price to $50"
    ↓
Conversation Agent: Detects multiple intents
    ↓
Response: "I can help with one action at a time. Would you like to cancel order ORD-1001 
          or update a product price?"
```

**Case B: Special Characters in Input**
```
Admin: "Cancel order ORD-1001!!!"
    ↓
Conversation Agent: Handles special characters, extracts valid order number
    ↓
Response: (Proceeds with cancellation if order exists)
```

**Case C: Case Insensitivity**
```
Admin: "CANCEL ORDER ord-1001"
    ↓
Conversation Agent: Normalizes to uppercase, handles case-insensitive matching
    ↓
Response: (Proceeds with cancellation)
```

#### 7. Order Status Transition Edge Cases

**Case A: Order Already in Target Status**
```
Admin: "Mark order ORD-1001 as pending"
    ↓
Validation Agent: Order status is already "pending"
    ↓
Response: "Order ORD-1001 is already in 'pending' status. No change needed."
```

**Case B: Order Partially Shipped**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Order has partial shipments (some items shipped, some not)
    ↓
Response: "Order ORD-1001 has partial shipments. Cannot cancel entire order. 
          Would you like to cancel only the unshipped items?"
```

**Case C: Order with Refunds**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Order has existing refunds
    ↓
Response: "Order ORD-1001 has existing refunds. Cancellation may affect refund status. 
          Please confirm you want to proceed."
```

**Case D: Order Status Race Condition**
```
Admin: "Mark order ORD-1001 as shipped"
    ↓
Validation Agent: Checks status (pending) ✓
    ↓
Execution Agent: API call in progress...
    ↓
(Another process updates order to "cancelled" simultaneously)
    ↓
Execution Agent: API returns 409 Conflict - status changed
    ↓
Response: "Order ORD-1001 status was changed by another process. Current status: 'cancelled'. 
          Cannot update to 'shipped'."
```

#### 8. Product Update Edge Cases

**Case A: Product Has Active Orders**
```
Admin: "Change price of SKU-001 to $50"
    ↓
Validation Agent: Product has active orders with old price
    ↓
Response: "⚠️ Product SKU-001 has 5 active orders with current price. 
          Price change will affect future orders only. Proceed? (yes/no)"
```

**Case B: Product Out of Stock**
```
Admin: "Change price of SKU-001 to $50"
    ↓
Validation Agent: Product is out of stock (inventory = 0)
    ↓
Response: "Product SKU-001 is currently out of stock. Price updated to $50.00. 
          Note: Product will remain unavailable until inventory is added."
```

**Case C: Product with Variants**
```
Admin: "Change price of SKU-001 to $50"
    ↓
Validation Agent: Product has multiple variants, SKU-001 is variant-specific
    ↓
Execution Agent: Updates only the specific variant price
    ↓
Response: "Price for variant SKU-001 has been updated to $50.00. 
          Other variants remain unchanged."
```

**Case D: Product Description Too Long**
```
Admin: "Update description of SKU-001 to [very long text...]"
    ↓
Validation Agent: Description exceeds max_length: 5000 characters
    ↓
Response: "Description exceeds maximum length of 5,000 characters. 
          Please shorten the description."
```

#### 9. Concurrent Request Edge Cases

**Case A: Multiple Requests for Same Order**
```
Admin: "Cancel order ORD-1001"
    ↓
(Admin sends same request again before first completes)
    ↓
Validation Agent: Detects duplicate request in progress
    ↓
Response: "Request to cancel order ORD-1001 is already being processed. 
          Please wait for the current operation to complete."
```

**Case B: Conflicting Requests**
```
Admin: "Cancel order ORD-1001"
    ↓
(Admin immediately sends: "Mark order ORD-1001 as shipped")
    ↓
Validation Agent: Detects conflicting intents for same order
    ↓
Response: "Conflicting requests detected for order ORD-1001. 
          Please wait for the cancellation to complete, or cancel the previous request."
```

#### 10. MCP System Edge Cases

**Case A: MCP Registry File Missing**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Attempts to load guardrails from MCP registry
    ↓
Error: guardrails.json not found
    ↓
Response: "System configuration error. Please contact support. Error: Guardrails file missing."
```

**Case B: MCP Registry Invalid JSON**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Attempts to load guardrails
    ↓
Error: Invalid JSON syntax in guardrails.json
    ↓
Response: "System configuration error. Guardrails file is corrupted. Using default rules."
    ↓
(Agent continues with default guardrails)
```

**Case C: MCP Tool Unavailable**
```
Admin: "Cancel order ORD-1001"
    ↓
Execution Agent: Attempts to use OrderTool.cancel()
    ↓
Error: OrderTool not initialized or unavailable
    ↓
Response: "System error: Order management tool unavailable. Please try again or contact support."
```

**Case D: MCP Memory Full**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: Attempts to store context in MCP memory
    ↓
Error: Memory storage limit exceeded
    ↓
Response: "Conversation history limit reached. Starting new session. 
          Previous context may be lost."
    ↓
(Agent clears old memory and continues)
```

#### 11. LLM/ADK Edge Cases

**Case A: LLM Returns Invalid JSON**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: LLM returns malformed JSON response
    ↓
Error: JSON parse error
    ↓
Response: "I encountered an issue understanding your request. Please rephrase: 
          'Cancel order ORD-1001'"
```

**Case B: LLM Timeout**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: LLM call exceeds timeout (30 seconds)
    ↓
Error: Request timeout
    ↓
Response: "Request timed out. Please try again with a simpler request."
```

**Case C: LLM Low Confidence**
```
Admin: "Maybe cancel that order"
    ↓
Conversation Agent: Intent confidence: 0.45 (below threshold: 0.7)
    ↓
Response: "I'm not sure what you'd like me to do. Could you clarify? 
          For example: 'Cancel order ORD-1001'"
```

**Case D: ADK Framework Error**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: ADK framework throws internal error
    ↓
Error: ADK initialization failed
    ↓
Response: "AI service error. Please try again in a moment."
```

#### 12. Data Consistency Edge Cases

**Case A: Order Deleted During Processing**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Validates order exists ✓
    ↓
Execution Agent: API call in progress...
    ↓
(Order is deleted by another process)
    ↓
Execution Agent: API returns 404 Not Found
    ↓
Response: "Order ORD-1001 was deleted during processing. Operation cancelled."
```

**Case B: Product Updated During Processing**
```
Admin: "Change price of SKU-001 to $50"
    ↓
Validation Agent: Loads current price: $100
    ↓
Execution Agent: API call in progress...
    ↓
(Product price updated to $75 by another process)
    ↓
Execution Agent: API call succeeds, but price is now $50 (overwrites $75)
    ↓
Response: "Price updated to $50.00. Note: Price was changed during processing."
```

**Case C: Stale Data in MCP Cache**
```
Admin: "Cancel order ORD-1001"
    ↓
Validation Agent: Uses cached order data (status: pending)
    ↓
(Order status changed to shipped externally)
    ↓
Validation Agent: Proceeds with cancellation based on stale cache
    ↓
Execution Agent: API returns 409 Conflict - order is shipped
    ↓
Response: "Order ORD-1001 status has changed. Current status: 'shipped'. Cannot cancel."
    ↓
(Agent invalidates cache and refreshes data)
```

#### 13. Session and Context Edge Cases

**Case A: Session Expired**
```
Admin: "Cancel order ORD-1001"
    ↓
Conversation Agent: Session expired (30 minutes inactivity)
    ↓
Response: "Your session has expired. Starting new session. 
          Please repeat your request: 'Cancel order ORD-1001'"
```

**Case B: Context Lost**
```
Admin: "Cancel that order"
    ↓
Conversation Agent: No previous context in memory
    ↓
Response: "I need more information. Which order would you like to cancel? 
          Please provide the order number (e.g., ORD-1001)."
```

**Case C: Context Confusion**
```
Admin: "Cancel order ORD-1001"
    ↓
(Previous conversation was about product SKU-001)
    ↓
Conversation Agent: Incorrectly references SKU-001 from previous context
    ↓
Response: "I understand you want to cancel order ORD-1001. 
          (Note: Previous conversation about SKU-001 is not related)"
    ↓
(Agent proceeds correctly with ORD-1001)
```

#### 14. Authentication and Authorization Edge Cases

**Case A: Unauthorized Access**
```
Admin: "Cancel order ORD-1001"
    ↓
Execution Agent: API call returns 401 Unauthorized
    ↓
Response: "Authentication required. Please log in again."
```

**Case B: Permission Denied**
```
Admin: "Cancel order ORD-1001"
    ↓
Execution Agent: API call returns 403 Forbidden
    ↓
Response: "You don't have permission to cancel orders. 
          Please contact your administrator."
```

---

## Multi-Agent Workflow Issues and Disturbances

### Overview

The multi-agent system (Conversation → Validation → Execution) can experience various disturbances that affect workflow integrity, performance, and reliability. This section documents all possible issues and their mitigation strategies.

### 1. Agent Communication Failures

#### Issue: Message Loss Between Agents
**Scenario**: Intent object lost between Conversation and Validation agents
```
Conversation Agent → [Message Lost] → Validation Agent (never receives)
```
**Impact**: Request hangs, no response to admin
**Mitigation**: 
- Implement message queue with acknowledgments
- Add timeout and retry mechanism
- Fallback to direct HTTP communication

#### Issue: Partial Message Delivery
**Scenario**: Validation Agent receives incomplete intent object
```
Conversation Agent sends: {intent: 'cancel_order', orderNumber: 'ORD-1001'}
Validation Agent receives: {intent: 'cancel_order'} // orderNumber missing
```
**Impact**: Validation fails with unclear error
**Mitigation**:
- Schema validation for all inter-agent messages
- Required field checks
- Request admin to rephrase if data incomplete

#### Issue: Agent Response Timeout
**Scenario**: Validation Agent takes too long (>10 seconds)
```
Conversation Agent → Validation Agent (timeout after 10s)
```
**Impact**: Request fails, poor user experience
**Mitigation**:
- Set reasonable timeouts per agent (5-10 seconds)
- Implement circuit breaker pattern
- Return graceful error message
- Log slow operations for optimization

### 2. Agent State Inconsistency

#### Issue: Stale State in Validation Agent
**Scenario**: Validation uses cached order data, order updated externally
```
Validation Agent: Checks cached order (status: pending) ✓
(Order updated to "shipped" by another process)
Execution Agent: Attempts cancellation on shipped order
```
**Impact**: Operation fails at execution stage
**Mitigation**:
- Always fetch fresh data before validation
- Use optimistic locking (ETags)
- Implement cache invalidation on updates
- Re-validate at execution stage

#### Issue: Race Condition in Multi-Step Operations
**Scenario**: Two agents modify same resource simultaneously
```
Validation Agent: Validates order ORD-1001 (status: pending)
Execution Agent: Starts cancellation
(Another process ships order ORD-1001)
Execution Agent: API returns 409 Conflict
```
**Impact**: Operation fails, confusing error message
**Mitigation**:
- Implement distributed locks for critical operations
- Use database transactions where possible
- Retry with fresh data on conflict
- Clear error messages explaining conflict

### 3. MCP System Failures

#### Issue: MCP Registry Unavailable
**Scenario**: MCP registry files cannot be loaded
```
Validation Agent: Attempts to load guardrails.json
Error: File system error, file locked or missing
```
**Impact**: Validation cannot proceed, system fails
**Mitigation**:
- Fallback to default guardrails in memory
- Health check endpoint for MCP registry
- Alert monitoring for registry failures
- Graceful degradation mode

#### Issue: MCP Tool Failure
**Scenario**: OrderTool.cancel() throws exception
```
Execution Agent: Calls OrderTool.cancel(orderId)
Error: OrderTool internal error
```
**Impact**: Operation fails, no clear error message
**Mitigation**:
- Try-catch around all MCP tool calls
- Tool health checks before use
- Fallback to direct API calls if tool fails
- Detailed error logging

#### Issue: MCP Memory Corruption
**Scenario**: Session memory data becomes corrupted
```
Conversation Agent: Retrieves context from MCP memory
Error: Invalid session data, JSON parse error
```
**Impact**: Context lost, conversation breaks
**Mitigation**:
- Validate memory data structure
- Clear corrupted sessions automatically
- Start fresh session on corruption
- Regular memory cleanup

### 4. LLM/ADK Integration Issues

#### Issue: LLM Service Intermittent Failures
**Scenario**: Ollama service goes down during request
```
Conversation Agent: Calls Ollama API
Error: Connection refused
```
**Impact**: Intent detection fails, no response
**Mitigation**:
- Retry with exponential backoff (3 attempts)
- Circuit breaker to prevent cascade failures
- Fallback to rule-based intent detection
- Health check before LLM calls

#### Issue: LLM Response Quality Degradation
**Scenario**: LLM returns incorrect intent or entities
```
Admin: "Cancel order ORD-1001"
LLM Response: {intent: 'update_price', entities: {sku: 'ORD-1001'}}
```
**Impact**: Wrong operation executed
**Mitigation**:
- Confidence threshold checks (reject if < 0.7)
- Entity validation (format checks)
- Admin confirmation for low-confidence intents
- Log all LLM responses for analysis

#### Issue: ADK Framework Bugs
**Scenario**: ADK throws unexpected errors
```
Conversation Agent: ADK.process() throws TypeError
```
**Impact**: System crashes or hangs
**Mitigation**:
- Comprehensive error handling in ADK wrapper
- Version pinning for ADK
- Fallback mechanisms
- Regular ADK updates and testing

### 5. Data Flow Disruptions

#### Issue: Backend API Changes
**Scenario**: Backend API endpoint changes, MCP tools not updated
```
Execution Agent: Calls POST /api/orders/:id/cancel
Error: 404 Not Found (endpoint changed to /api/orders/:id/status)
```
**Impact**: All order operations fail
**Mitigation**:
- API versioning
- Endpoint discovery mechanism
- Health checks for all endpoints
- Automated testing for API compatibility

#### Issue: Data Format Mismatch
**Scenario**: Backend API expects different data format
```
Execution Agent: Sends {orderId: 'ORD-1001'}
Backend expects: {id: 'ORD-1001', action: 'cancel'}
```
**Impact**: API calls fail with validation errors
**Mitigation**:
- Schema validation before API calls
- API contract testing
- Version-aware data transformation
- Clear error messages

### 6. Performance and Scalability Issues

#### Issue: Agent Bottleneck
**Scenario**: Validation Agent becomes slow under load
```
Multiple requests → Validation Agent (queues up, slow processing)
```
**Impact**: High latency, timeout errors
**Mitigation**:
- Horizontal scaling (multiple agent instances)
- Request queuing with priority
- Load balancing
- Performance monitoring and alerts

#### Issue: Memory Leak in Agent
**Scenario**: Conversation Agent memory grows unbounded
```
Long-running session → Memory accumulation → System slowdown
```
**Impact**: System becomes slow, eventually crashes
**Mitigation**:
- Session timeout and cleanup
- Memory limits per session
- Regular garbage collection
- Memory profiling and monitoring

#### Issue: MCP Registry Size Growth
**Scenario**: Guardrails file becomes very large (>10MB)
```
Validation Agent: Loads guardrails.json (slow, high memory)
```
**Impact**: Slow startup, high memory usage
**Mitigation**:
- Lazy loading of guardrails
- Guardrail caching
- Split large files into modules
- Regular cleanup of unused rules

### 7. Error Propagation Issues

#### Issue: Error Masking
**Scenario**: Lower-level errors are caught but not properly surfaced
```
Execution Agent: API error → Caught → Generic error message
Admin sees: "Something went wrong" (not helpful)
```
**Impact**: Difficult to debug, poor user experience
**Mitigation**:
- Proper error propagation through agent chain
- Detailed error messages for admins
- Error codes for programmatic handling
- Comprehensive error logging

#### Issue: Error Cascade
**Scenario**: One agent failure causes chain reaction
```
Validation Agent fails → Execution Agent receives invalid data → API call fails → System error
```
**Impact**: Multiple failures from single issue
**Mitigation**:
- Fail-fast at each agent stage
- Input validation at each boundary
- Circuit breakers to prevent cascades
- Isolated error handling per agent

### 8. Security and Safety Issues

#### Issue: Injection Attacks Through Natural Language
**Scenario**: Admin input contains malicious patterns
```
Admin: "Cancel order ORD-1001'; DROP TABLE orders; --"
```
**Impact**: Potential security vulnerability
**Mitigation**:
- Input sanitization
- Entity extraction validation
- No direct SQL/command execution
- Parameterized API calls only

#### Issue: Unauthorized Operations
**Scenario**: Agent attempts operation without proper validation
```
Validation Agent: Bypasses guardrail check
Execution Agent: Executes unauthorized operation
```
**Impact**: Security breach, data corruption
**Mitigation**:
- Mandatory guardrail checks
- Operation whitelist
- Audit logging for all operations
- Regular security reviews

### 9. Monitoring and Observability Issues

#### Issue: Lack of Visibility into Agent Decisions
**Scenario**: Operation fails, but unclear which agent caused it
```
Request fails → Which agent? What was the decision? Why?
```
**Impact**: Difficult debugging, slow resolution
**Mitigation**:
- Request ID propagation through all agents
- Structured logging at each agent stage
- Decision logging (intent, validation, execution)
- Distributed tracing

#### Issue: Metrics Not Captured
**Scenario**: System performance degrades, but no metrics available
```
Slow responses → No data on which agent is slow
```
**Impact**: Cannot identify bottlenecks
**Mitigation**:
- Metrics for each agent (latency, error rate)
- MCP tool usage metrics
- LLM call metrics
- Dashboard for real-time monitoring

### 10. Recovery and Resilience Strategies

#### General Mitigation Approach:
1. **Retry Logic**: Exponential backoff for transient failures
2. **Circuit Breakers**: Prevent cascade failures
3. **Fallback Mechanisms**: Default behaviors when systems fail
4. **Health Checks**: Proactive monitoring of all components
5. **Graceful Degradation**: System continues with reduced functionality
6. **Comprehensive Logging**: All errors and decisions logged
7. **Alerting**: Real-time alerts for critical failures
8. **Testing**: Regular testing of failure scenarios

### Expected Outcomes

- **Task Completion**: Successfully handle 90%+ of valid admin requests
- **Response Time**: < 2 seconds for 95% of requests
- **Error Handling**: Graceful error messages for all edge cases
- **User Experience**: Clear, actionable responses for both success and failure scenarios
- **Code Quality**: Clean architecture, comprehensive tests, maintainable code

---

## Project Overview

### Problem Statement

The store administrator needs to manage e-commerce operations (orders, products, promotions) but traditional admin interfaces require multiple clicks and form fills for simple tasks like "Cancel order ORD-1001" or "Change product price to $49.99".

### Solution Approach

A three-agent system that:
1. **Conversation Agent** - Understands natural language and extracts intent
2. **Validation Agent** - Applies business rules and guardrails
3. **Execution Agent** - Safely executes API calls and formats responses

### Target Users

- **Primary**: Store administrator managing daily operations
- **Single User System**: The system is designed for a single admin user managing the e-commerce store

### Current System State

- ✅ Backend API fully functional (Products, Orders, Promotions)
- ✅ Admin UI with order/product management
- ✅ Storefront for customer browsing
- ✅ Seed data system
- ⏳ **To Build**: Agent service layer and chatbot UI

---

## System Architecture

### Port Configuration

**Service Ports**:
- Backend + UI: `3000`
- Ollama (LLM): `11434`
- Agent: `3333`
- MCP Server: (configured separately)

### Application Endpoints

#### 1. Storefront (Customer View)
- **URL**: `http://localhost:3000/`
- **Purpose**: Read-only storefront for browsing products
- **Features**:
  - Customer can view products
  - Customer can view order history
- **Note**: Included for realism and data generation

#### 2. Admin Dashboard
- **URL**: `http://localhost:3000/admin`
- **Purpose**: Admin page for managing store operations
- **Displays**:
  - Recent orders
  - Product catalog
- **Allows**:
  - Updating order status
  - Editing product details (name, description, price)
- **Extension**: Chatbot interface embedded on this page for natural language management

#### 3. Backend API
- **Base URL**: `http://localhost:3000/api`
- **Full API Documentation**: `http://localhost:3000/api`
- **Extended Endpoints**:
  - `http://localhost:3000/api/v1/orders` - Interact with agents to modify order details
  - `http://localhost:3000/api/v1/products` - Change product information through agents
  - `http://localhost:3000/api/chat` - Chatbot interface endpoint

### LLM Model Configuration

**Model Selected**: `qwen3-coder:30b`
- **Source**: https://ollama.com/library/qwen3-coder:30b (19GB)
- **Download Command**: `ollama pull qwen3-coder:30b`
- **Rationale**: Latest AI qwen3:30b parameter model that supports thinking and coder activities, especially designed for agent workflows

### System Flow

```
Admin UI
    ↓
Agent (ADK)
    ↓
MCP_tools (dummy for naming convention)
    ↓
Tools
    ├─ Order API
    ├─ Product API
    └─ Internal DB / business logic
```

### High-Level Flow

```
Admin UI (Chatbot)
    ↓ HTTP Request
Agent Service Layer
    ├─ Conversation Agent (Intent Detection via MCP tools)
    ├─ Validation Agent (Guardrail Enforcement via MCP registry)
    └─ Execution Agent (API Execution via MCP tools)
    ↓
MCP (Multi-Agent Control Plane) ← All agents use MCP
    ├─ Registry (Guardrails, Rules, Endpoints)
    │   └─ Used by: Validation Agent, Execution Agent
    ├─ Tools (OrderTool, ProductTool, InventoryTool, DiscountEngine)
    │   └─ Used by: All agents for API operations
    ├─ Memory (Sessions, Chat History)
    │   └─ Used by: Conversation Agent, Execution Agent
    └─ Prompts (Versioned Templates)
        └─ Used by: Conversation Agent for LLM interactions
    ↓
Backend API (/api)
    ├─ Products API (called via MCP ProductTool)
    ├─ Orders API (called via MCP OrderTool)
    └─ Promotions API (called via MCP DiscountEngine)
    ↓
Data Storage (JSON files)
```

### Component Layers

#### 1. Frontend Layer
- **Admin Dashboard** (`/admin`): Order/product management with embedded chatbot
- **Storefront** (`/`): Customer-facing product browsing
- **Chatbot UI**: AI SDK UI component for natural language interaction

#### 2. Agent Service Layer
- **Agent Orchestrator**: Routes requests, manages communication
- **Three Agents**: Conversation → Validation → Execution pipeline
- **Error Recovery**: Retry logic, fallback strategies

#### 3. MCP Layer
- **Registry**: Dynamic configurations (guardrails.json, validationRules.json, endpoints.json)
- **Tools**: Reusable functions for API operations
- **Memory**: Session management and conversation history
- **Prompts**: Versioned prompt templates

#### 4. Backend API Layer
- **Products API**: CRUD, variants, inventory, categories
- **Orders API**: Management, shipments, refunds, transactions
- **Promotions API**: Discount codes, automatic discounts, validation

#### 5. Data Layer
- **Storage**: File-based JSON storage
- **Seed Data**: Pre-populated products, orders, promotions
- **LLM**: Ollama service for AI processing

### Technology Stack Details

**Runtime & Framework**
- Node.js 18+ with TypeScript 5.3+
- Express.js 4.18+ for REST API
- File-based storage (upgradeable to PostgreSQL/MongoDB)

**AI/ML**
- Google Agent Development Kit (ADK) for TypeScript
- Ollama with Qwen3 models (7b, 14b, or 32b based on system)
- Prompt versioning system

**Testing & Quality**
- Jest 29+ for unit/integration tests
- Supertest for API testing
- Target: 90%+ code coverage

---

## Agent System Design

### Three-Agent Architecture

#### 1. Conversation Agent

**Responsibilities**:
- Parse natural language input
- Detect user intent (cancel_order, update_price, etc.) **via MCP tools**
- Extract entities (order numbers, SKUs, prices, statuses) **via MCP tools**
- Maintain conversation context using MCP memory
- Handle ambiguous requests

**Input**: Natural language string  
**Output**: Structured intent object

**How It Works**:
- Uses MCP tools for intent detection and entity extraction
- Leverages LLM (Ollama) through ADK framework
- Accesses MCP prompts for system instructions
- Stores context in MCP memory system

```typescript
{
  intent: 'cancel_order',
  entities: { orderNumber: 'ORD-1001' },
  confidence: 0.95,
  context: { sessionId: '...' }
}
```

**Key Capabilities**:
- Intent classification with confidence scoring (via MCP tools)
- Entity extraction using MCP tools (regex + LLM)
- Context resolution for follow-up questions (via MCP memory)
- Clarification requests for ambiguous inputs

#### 2. Validation Agent

**Responsibilities**:
- Load guardrails from MCP registry
- Validate intent against business rules using MCP tools
- Check status transitions via MCP validation tools
- Verify data constraints (prices, quantities) using MCP tools
- Return validation result with reasons

**Input**: Structured intent object  
**Output**: Validation result

**How It Works**:
- Loads guardrails from `MCP/registry/guardrails.json`
- Uses MCP validation tools to check rules
- Accesses MCP registry for endpoint configurations
- Applies business rules from MCP registry

```typescript
{
  valid: true,
  errors: [],
  warnings: ['Refund will be processed'],
  guardrailsApplied: ['status_transition', 'refund_policy']
}
```

**Key Capabilities**:
- Dynamic guardrail loading from MCP registry JSON
- Status transition validation via MCP tools
- Price/discount limit checks using MCP validation tools
- Inventory availability verification via MCP InventoryTool
- Permission validation through MCP registry

#### 3. Execution Agent

**Responsibilities**:
- Map validated intent to API endpoints (via MCP registry)
- Execute API calls using MCP tools (OrderTool, ProductTool, etc.)
- Handle errors gracefully
- Format responses for users
- Update conversation memory in MCP memory system

**Input**: Validated intent object  
**Output**: Human-readable response + execution result

**How It Works**:
- Maps intents to endpoints using `MCP/registry/endpoints.json`
- Executes API calls via MCP tools (OrderTool.cancel(), ProductTool.updatePrice(), etc.)
- Uses MCP tools for all API interactions
- Updates MCP memory with conversation history

**Key Capabilities**:
- Intent-to-API mapping via MCP registry
- Tool integration using MCP tools (OrderTool, ProductTool, InventoryTool, DiscountEngine)
- Error translation to user-friendly messages
- Retry logic with exponential backoff
- Response formatting

### Agent Communication Flow

```
User: "Cancel order ORD-1001"
    ↓
Conversation Agent (via MCP tools)
  • Parses input using MCP prompts
  • Detects: cancel_order intent (via MCP tools + LLM)
  • Extracts: orderNumber = "ORD-1001" (via MCP tools)
  • Output: Intent Object
    ↓
Validation Agent (via MCP registry & tools)
  • Loads guardrails from MCP registry
  • Checks: Order exists? ✓ (via MCP OrderTool)
  • Checks: Can cancel? (status = pending) ✓ (via MCP validation tools)
  • Validates: Status transition allowed ✓ (via MCP guardrails)
  • Output: Validation Result (valid: true)
    ↓
Execution Agent (via MCP tools)
  • Maps to: POST /api/orders/:id/cancel (via MCP registry/endpoints.json)
  • Calls: MCP OrderTool.cancel(orderId)
  • Handles: Success/Error
  • Formats: "Order ORD-1001 has been cancelled successfully"
  • Updates: MCP memory with conversation history
    ↓
User Response
```

### Error Handling Strategy

**Conversation Agent Errors**:
- Low confidence → Request clarification
- Missing entities → Ask for missing information
- Ambiguous intent → Present options

**Validation Agent Errors**:
- Guardrail violation → Explain why blocked
- Invalid data → Suggest corrections
- Business rule violation → Provide alternatives

**Execution Agent Errors**:
- API errors → Translate to user messages
- Network errors → Retry with backoff
- Timeout → Suggest retry later

---

## MCP (Multi-Agent Control Plane)

### Purpose

Centralized control plane providing shared tools, dynamic configurations, memory management, and prompt versioning for all agents.

### Directory Structure

```
src/mcp/
├── registry/              # Dynamic configurations
│   ├── guardrails.json    # Business rules
│   ├── validationRules.json
│   └── endpoints.json     # API endpoint configs
├── tools/                 # Reusable agent tools
│   ├── discountEngine.ts
│   ├── inventoryTool.ts
│   ├── orderTool.ts
│   └── productTool.ts
├── memory/                # Conversation memory
│   ├── sessionMemory.ts
│   └── chatHistoryStore.ts
└── prompts/               # Prompt templates
    ├── orderPrompts.json
    ├── productPrompts.json
    └── systemPrompts.json
```

### Registry System

**Guardrails** (`registry/guardrails.json`):
- Order status transitions
- Price limits (min/max)
- Discount restrictions
- Inventory policies
- Update restrictions

**Validation Rules** (`registry/validationRules.json`):
- Order number format: `^ORD-\d{4,}$`
- SKU format: `^[A-Z0-9-]+$` (3-50 chars)
- Price: 0.01 to 100,000 (2 decimals)
- Email validation patterns
- Percentage: 0-100

**Endpoints** (`registry/endpoints.json`):
- API endpoint mappings
- Request/response schemas
- Required parameters
- Method specifications

### Tools System

**OrderTool**:
- `getOrder(orderNumber)` - Fetch order by number
- `updateStatus(orderId, status)` - Update order status
- `cancelOrder(orderId)` - Cancel order
- `getShipments(orderId)` - Get order shipments

**ProductTool**:
- `getProduct(productId)` - Fetch product
- `updateProduct(productId, updates)` - Update product
- `updatePrice(variantId, price)` - Update variant price
- `updateDescription(productId, description)` - Update description

**InventoryTool**:
- `getInventoryLevel(variantId, locationId)` - Get stock level
- `checkAvailability(variantId, quantity)` - Check if available
- `getLocations()` - List all locations

**DiscountEngine**:
- `calculateDiscounts(cart)` - Calculate applicable discounts
- `validatePromoCode(code)` - Validate promotion code
- `applyDiscount(order, discount)` - Apply discount to order

### Memory System

**SessionMemory**:
- Session context management
- Conversation state tracking
- Entity resolution across turns

**ChatHistoryStore**:
- Persist conversation history
- Load previous conversations
- Search history

### Prompt System

**Versioned Templates**:
- System prompts for each agent
- User prompt examples
- Error handling prompts
- Version management for A/B testing

---

## Guardrails & Validation

### Guardrail Types

1. **Business Rules**: Order status transitions, discount limits
2. **Data Constraints**: Price ranges, SKU formats, email validation
3. **Action Permissions**: Allowed operations and restrictions
4. **State Validation**: Order state, inventory availability

### Example Guardrails

**Order Status Transitions**:
```json
{
  "pending": ["confirmed", "cancelled"],
  "confirmed": ["processing", "cancelled"],
  "processing": ["shipped", "cancelled"],
  "shipped": ["delivered"],
  "delivered": ["completed"],
  "completed": [],
  "cancelled": []
}
```

**Price Limits**:
```json
{
  "min_price": 0.01,
  "max_price": 100000,
  "max_discount_percentage": 90
}
```

**Cancel Restrictions**:
```json
{
  "cannot_cancel_after": "shipped",
  "refund_required": true
}
```

### How Guardrails Work

1. **Loading**: Validation Agent loads guardrails at runtime from JSON
2. **Application**: Relevant rules checked based on intent
3. **Validation**: Returns valid/invalid with reasons
4. **Updates**: Edit JSON file → restart service → new rules apply

### Dynamic Updates

- **No Code Changes**: All guardrails in JSON files
- **Hot Reload**: Can implement file watching for live updates
- **Version Control**: Track changes in Git
- **Rollback**: Keep previous versions for quick rollback

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### Project Setup
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Express server setup (`src/server.ts`)
- [x] Basic API routes (`src/routes/`)
- [x] Seed data system (`src/seed.ts`)
- [x] Type definitions (`src/types/index.ts`)
- [x] Storage utilities (`src/utils/storage.ts`)
- [x] Error handling (`src/utils/errors.ts`)

#### MCP Infrastructure

**Directory Structure**:
- [ ] Create `src/mcp/` directory structure
  - [ ] `src/mcp/registry/` directory
  - [ ] `src/mcp/tools/` directory
  - [ ] `src/mcp/memory/` directory
  - [ ] `src/mcp/prompts/` directory

**Registry System**:
- [ ] Create `registry/guardrails.json` template
- [ ] Create `registry/validationRules.json` template
- [ ] Create `registry/endpoints.json` template
- [ ] Implement registry loader (`registry/loader.ts`)
- [ ] Add hot-reload capability (optional)

**Tool System**:
- [ ] Create `tools/orderTool.ts`
  - [ ] `getOrder(orderNumber: string)`
  - [ ] `updateStatus(orderId: string, status: OrderStatus)`
  - [ ] `cancelOrder(orderId: string)`
  - [ ] `getShipments(orderId: string)`
- [ ] Create `tools/productTool.ts`
  - [ ] `getProduct(productId: string)`
  - [ ] `updateProduct(productId: string, updates: Partial<Product>)`
  - [ ] `updatePrice(variantId: string, price: number)`
  - [ ] `updateDescription(productId: string, description: string)`
- [ ] Create `tools/inventoryTool.ts`
  - [ ] `getInventoryLevel(variantId: string, locationId: string)`
  - [ ] `checkAvailability(variantId: string, quantity: number)`
  - [ ] `getLocations()`
- [ ] Create `tools/discountEngine.ts`
  - [ ] `calculateDiscounts(cart: CartItem[])`
  - [ ] `validatePromoCode(code: string)`
  - [ ] `applyDiscount(order: Order, discount: Discount)`

**Memory System**:
- [ ] Create `memory/sessionMemory.ts`
  - [ ] `getSession(sessionId: string)`
  - [ ] `updateSession(sessionId: string, context: Partial<SessionContext>)`
  - [ ] `clearSession(sessionId: string)`
  - [ ] `getConversationHistory(sessionId: string)`
- [ ] Create `memory/chatHistoryStore.ts`
  - [ ] `saveMessage(sessionId: string, message: ChatMessage)`
  - [ ] `getHistory(sessionId: string, limit?: number)`
  - [ ] `clearHistory(sessionId: string)`

**Prompt System**:
- [ ] Create `prompts/orderPrompts.json`
- [ ] Create `prompts/productPrompts.json`
- [ ] Create `prompts/systemPrompts.json`
- [ ] Implement prompt loader (`prompts/loader.ts`)
- [ ] Add version management

**Testing Phase 1**:
- [ ] Unit tests for tools
  - [ ] `orderTool.test.ts`
  - [ ] `productTool.test.ts`
  - [ ] `inventoryTool.test.ts`
  - [ ] `discountEngine.test.ts`
- [ ] Unit tests for memory
  - [ ] `sessionMemory.test.ts`
  - [ ] `chatHistoryStore.test.ts`
- [ ] Integration tests for registry
  - [ ] `registry/loader.test.ts`

**Deliverables**:
- Complete MCP structure
- All tools implemented and tested
- Registry system functional

---

### Phase 2: Agent Implementation (Week 3-4)

#### Conversation Agent
- [ ] Set up ADK with Ollama
  - [ ] Install ADK dependencies
  - [ ] Configure Ollama connection
  - [ ] Test LLM connectivity
- [ ] Implement intent detection
  - [ ] Create intent classification system
  - [ ] Define intent types (cancel_order, update_price, etc.)
  - [ ] Implement confidence scoring
- [ ] Implement entity extraction
  - [ ] Extract order numbers
  - [ ] Extract product SKUs
  - [ ] Extract prices
  - [ ] Extract status values
- [ ] Add context management
  - [ ] Maintain conversation context
  - [ ] Handle follow-up questions
  - [ ] Resolve ambiguous references
- [ ] Write unit tests
  - [ ] `conversationAgent.test.ts`
  - [ ] Test intent detection accuracy
  - [ ] Test entity extraction
  - [ ] Test context management

#### Validation Agent
- [ ] Implement guardrail loader
  - [ ] Load from `registry/guardrails.json`
  - [ ] Cache guardrails in memory
  - [ ] Handle file updates
- [ ] Implement rule validator
  - [ ] Status transition validator
  - [ ] Price limit validator
  - [ ] Discount limit validator
  - [ ] Inventory policy validator
- [ ] Add status transition validator
  - [ ] Check allowed transitions
  - [ ] Generate error messages
- [ ] Add price limit validator
  - [ ] Check min/max prices
  - [ ] Validate currency
- [ ] Write unit tests
  - [ ] `validationAgent.test.ts`
  - [ ] Test guardrail enforcement
  - [ ] Test error message generation
  - [ ] Test edge cases

#### Execution Agent
- [ ] Implement API call mapper
  - [ ] Map intents to API endpoints
  - [ ] Build request payloads
  - [ ] Handle path parameters
- [ ] Integrate with tools
  - [ ] Use OrderTool for order operations
  - [ ] Use ProductTool for product operations
  - [ ] Use InventoryTool for inventory checks
- [ ] Add error handling
  - [ ] Handle API errors
  - [ ] Retry logic with exponential backoff
  - [ ] Translate errors to user-friendly messages
- [ ] Implement response formatter
  - [ ] Format success messages
  - [ ] Format error messages
  - [ ] Include relevant details
- [ ] Write unit tests
  - [ ] `executionAgent.test.ts`
  - [ ] Test API call mapping
  - [ ] Test error handling
  - [ ] Test response formatting

**Testing Phase 2**:
- [ ] Integration tests
  - [ ] Test agent communication
  - [ ] Test end-to-end flows
  - [ ] Test error propagation

**Deliverables**:
- All three agents functional
- Unit tests passing
- Integration tests passing

---

### Phase 3: Integration (Week 5)

#### Agent Orchestration
- [ ] Create agent coordinator
  - [ ] `agents/coordinator.ts`
  - [ ] Route requests to agents
  - [ ] Manage agent communication
- [ ] Implement message passing
  - [ ] Define message protocol
  - [ ] Implement message queue
  - [ ] Handle async operations
- [ ] Add error recovery
  - [ ] Retry failed operations
  - [ ] Fallback strategies
  - [ ] Graceful degradation
- [ ] Add logging
  - [ ] Log all agent actions
  - [ ] Log errors with context
  - [ ] Log performance metrics

#### Frontend Integration
- [ ] Set up AI SDK UI
  - [ ] Install AI SDK dependencies
  - [ ] Create chatbot component
  - [ ] Style chatbot interface
- [ ] Create chatbot component
  - [ ] Message input
  - [ ] Message display
  - [ ] Loading states
  - [ ] Error display
- [ ] Connect to agent service
  - [ ] Create API client
  - [ ] Handle WebSocket/HTTP
  - [ ] Manage session state
- [ ] Add loading states
  - [ ] Show typing indicator
  - [ ] Disable input during processing
- [ ] Add error display
  - [ ] Show error messages
  - [ ] Provide retry options
  - [ ] Display help text

#### End-to-End Testing
- [ ] Test order cancellation flow
  - [ ] Valid order cancellation
  - [ ] Invalid order number
  - [ ] Already shipped order
- [ ] Test product update flow
  - [ ] Update price
  - [ ] Update description
  - [ ] Invalid price
- [ ] Test error scenarios
  - [ ] Network errors
  - [ ] API errors
  - [ ] Validation errors
- [ ] Test guardrail enforcement
  - [ ] Price limits
  - [ ] Status transitions
  - [ ] Discount limits

**Testing Phase 3**:
- [ ] E2E tests
  - [ ] Full user workflows
  - [ ] Error scenarios
  - [ ] Performance tests

**Deliverables**:
- Working chatbot in admin UI
- End-to-end flows functional
- Error handling verified

---

### Phase 4: Enhancement (Week 6)

#### Prompt Versioning
- [ ] Implement prompt loader
  - [ ] Load from JSON files
  - [ ] Support versioning
  - [ ] Cache prompts
- [ ] Add version management
  - [ ] Track prompt versions
  - [ ] Support A/B testing
  - [ ] Rollback capability
- [ ] Create prompt templates
  - [ ] System prompts
  - [ ] User prompts
  - [ ] Error prompts
- [ ] Add A/B testing support
  - [ ] Multiple prompt versions
  - [ ] Metrics collection
  - [ ] Performance comparison

#### Advanced Features
- [ ] Add conversation history
  - [ ] Persist chat history
  - [ ] Load previous conversations
  - [ ] Search history
- [ ] Implement multi-turn conversations
  - [ ] Handle follow-up questions
  - [ ] Maintain context
  - [ ] Resolve references
- [ ] Add confirmation prompts
  - [ ] Confirm destructive actions
  - [ ] Show action summary
  - [ ] Allow cancellation
- [ ] Add undo/redo support
  - [ ] Track actions
  - [ ] Support undo
  - [ ] Support redo

#### Performance Optimization
- [ ] Add caching for guardrails
  - [ ] Cache in memory
  - [ ] Invalidate on file change
  - [ ] TTL for cache entries
- [ ] Optimize API calls
  - [ ] Batch requests
  - [ ] Reduce redundant calls
  - [ ] Use connection pooling
- [ ] Add request batching
  - [ ] Batch multiple operations
  - [ ] Reduce round trips
- [ ] Implement rate limiting
  - [ ] Per-endpoint limits
  - [ ] Request throttling
  - [ ] Graceful handling

**Testing Phase 4**:
- [ ] Performance tests
  - [ ] Response time
  - [ ] Throughput
  - [ ] Resource usage
- [ ] Load tests
  - [ ] Concurrent requests
  - [ ] Stress testing
  - [ ] Scalability testing

**Deliverables**:
- Enhanced user experience
- Performance optimized
- Advanced features working

---

### Phase 5: Documentation & Deployment (Week 7)

#### Documentation
- [ ] API documentation
  - [ ] Endpoint descriptions
  - [ ] Request/response examples
  - [ ] Error codes
- [ ] Agent architecture docs
  - [ ] Agent responsibilities
  - [ ] Communication protocol
  - [ ] Error handling
- [ ] Guardrail configuration guide
  - [ ] How to update guardrails
  - [ ] Common patterns
  - [ ] Troubleshooting
- [ ] Deployment guide
  - [ ] Environment setup
  - [ ] Configuration
  - [ ] Monitoring
- [ ] User manual
  - [ ] How to use chatbot
  - [ ] Common commands
  - [ ] Troubleshooting

#### Deployment
- [ ] Production build setup
  - [ ] Build scripts
  - [ ] Environment variables
  - [ ] Configuration files
- [ ] Environment configuration
  - [ ] Development
  - [ ] Staging
  - [ ] Production
- [ ] Docker containerization
  - [ ] Dockerfile
  - [ ] Docker Compose
  - [ ] Health checks
- [ ] CI/CD pipeline
  - [ ] Automated testing
  - [ ] Automated deployment
  - [ ] Rollback capability

#### Monitoring
- [ ] Set up logging
  - [ ] Structured logging
  - [ ] Log levels
  - [ ] Log rotation
- [ ] Set up metrics
  - [ ] Response times
  - [ ] Error rates
  - [ ] Agent performance
- [ ] Set up alerts
  - [ ] Error alerts
  - [ ] Performance alerts
  - [ ] Health check alerts

**Deliverables**:
- Complete documentation
- Production-ready deployment
- Monitoring in place

---

### Implementation Checklists Summary

#### Testing Checklist

**Unit Tests**:
- [ ] All agents have unit tests
- [ ] All tools have unit tests
- [ ] All utilities have unit tests
- [ ] Test coverage > 90%

**Integration Tests**:
- [ ] Agent communication tests
- [ ] API integration tests
- [ ] Tool integration tests
- [ ] End-to-end flow tests

**E2E Tests**:
- [ ] Order management workflows
- [ ] Product management workflows
- [ ] Error handling workflows
- [ ] Guardrail enforcement tests

**Performance Tests**:
- [ ] Response time tests
- [ ] Throughput tests
- [ ] Load tests
- [ ] Stress tests

#### Code Quality Checklist

**Code Standards**:
- [ ] TypeScript strict mode enabled
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] All code formatted

**Documentation**:
- [ ] All functions documented
- [ ] Complex logic explained
- [ ] README updated
- [ ] Architecture documented

**Security**:
- [ ] Input validation
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention
- [ ] Authentication/authorization

**Performance**:
- [ ] No memory leaks
- [ ] Efficient algorithms
- [ ] Proper caching
- [ ] Optimized API calls

#### Deployment Checklist

**Pre-Deployment**:
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Environment variables configured

**Deployment**:
- [ ] Build successful
- [ ] Tests passing in staging
- [ ] Smoke tests passing
- [ ] Monitoring configured

**Post-Deployment**:
- [ ] Health checks passing
- [ ] Metrics being collected
- [ ] Logs being captured
- [ ] Alerts configured

#### Maintenance Checklist

**Regular Tasks**:
- [ ] Update guardrails as needed
- [ ] Refine prompts based on feedback
- [ ] Monitor performance metrics
- [ ] Review error logs

**Monthly Tasks**:
- [ ] Review and update documentation
- [ ] Analyze usage patterns
- [ ] Optimize slow operations
- [ ] Update dependencies

**Quarterly Tasks**:
- [ ] Security audit
- [ ] Performance review
- [ ] Architecture review
- [ ] Admin feedback analysis

---

## Technical Specifications

### Project Structure

#### Enterprise Project Structure

```
ecommerce-ai-admin/
│
├── README.md
├── package.json
├── tsconfig.json
├── .env
├── docker-compose.yml
│
├── data/                           # JSON-based data (no DB schema)
│   ├── orders.json
│   ├── products.json
│   └── audit.log.json
│
├── frontend/                       # Admin UI + Chatbot
│   ├── src/
│   │   ├── admin/
│   │   │   ├── AdminPage.tsx
│   │   │   ├── OrdersPanel.tsx
│   │   │   ├── ProductsPanel.tsx
│   │   │   └── ChatbotPanel.tsx
│   │   ├── chatbot/
│   │   │   ├── ChatUI.tsx
│   │   │   └── chat.api.ts
│   │   └── index.tsx
│   └── package.json
│
├── mcp-client/                     # Chat → Agent bridge
│   ├── chat.gateway.ts             # HTTP client to MCP server
│   └── session.context.ts
│
├── mcp-server/                     # 🧠 AGENT + TOOLS + POLICY CORE
│   │
│   ├── server.ts                   # MCP server entry
│   │
│   ├── agent/                      # SINGLE enterprise agent
│   │   ├── admin.agent.ts          # Intent → plan → tool call
│   │   ├── prompt.builder.ts       # Dynamic prompt injection
│   │   └── context.manager.ts
│   │
│   ├── tools/                      # MCP tools (ONLY actions)
│   │   ├── orders.read.ts
│   │   ├── orders.update.ts
│   │   ├── products.read.ts
│   │   └── products.update.ts
│   │
│   ├── services/                   # Data access (JSON)
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   └── audit.service.ts
│   │
│   ├── validators/                 # 🔒 Deterministic enforcement
│   │   ├── orderStatus.rules.ts
│   │   ├── payment.rules.ts
│   │   └── price.rules.ts
│   │
│   ├── policies/                   # 🔒 SECURITY ARTIFACTS (READ-ONLY)
│   │   ├── guardrails.json
│   │   ├── transition.matrix.json
│   │   └── forbidden.actions.json
│   │
│   ├── registry/                   # ⚙️ Dynamic NON-CODE config
│   │   ├── prompts.registry.json
│   │   ├── workflows.registry.json
│   │   ├── tools.registry.json           # 🔒 Locked
│   │   └── roles.registry.json           # 🔒 Locked
│   │
│   ├── execution/                  # 🛑 SAFETY FIREWALL
│   │   ├── execution.guard.ts
│   │   └── policy.enforcer.ts
│   │
│   ├── llm/                        # Ollama integration
│   │   ├── ollama.client.ts
│   │   └── model.config.ts
│   │
│   ├── audit/                      # Compliance & immutable logs
│   │   ├── action.logger.ts
│   │   └── decision.logger.ts
│   │
│   └── trace/                      # 🔹 Traceability & debug
│       ├── admin-agent/            # Per-agent debug traces
│       │   ├── action-YYYYMMDD.log.json
│       │   └── decision-YYYYMMDD.log.json
│       ├── order-agent/
│       │   └── action-YYYYMMDD.log.json
│       ├── product-agent/
│       │   └── action-YYYYMMDD.log.json
│       └── debug/                  # Generic debug & session logs
│           ├── session-YYYYMMDD.log.json
│           └── llm-response-YYYYMMDD.log.json
│
├── tests/
│   ├── agent/
│   ├── validators/
│   ├── policies/
│   └── tools/
│
└── docs/
    ├── architecture.md
    ├── agent-flow.md
    └── security-model.md
```

#### Structure Overview

**Root Level**:
- Configuration files (package.json, tsconfig.json, .env, docker-compose.yml)
- README.md for project overview

**data/** - JSON-based data storage (no database schema):
- `orders.json` - Order data
- `products.json` - Product data
- `audit.log.json` - Immutable audit trail

**frontend/** - Admin UI with embedded chatbot:
- React/TypeScript frontend
- Admin panels for orders and products
- Chatbot UI component
- API client for agent communication

**mcp-client/** - Bridge between frontend and agent:
- HTTP client to MCP server
- Session context management

**mcp-server/** - Core agent system:
- **agent/** - Single enterprise agent (not three separate agents)
  - Intent detection, planning, tool calling
  - Dynamic prompt building
  - Context management
- **tools/** - MCP tools (action-only, no business logic)
  - Read operations (orders.read.ts, products.read.ts)
  - Update operations (orders.update.ts, products.update.ts)
- **services/** - Data access layer
  - JSON file operations
  - Audit service
- **validators/** - Deterministic rule enforcement
  - Order status rules
  - Payment rules
  - Price rules
- **policies/** - Security artifacts (read-only)
  - Guardrails configuration
  - Status transition matrix
  - Forbidden actions list
- **registry/** - Dynamic non-code configuration
  - Prompts registry
  - Workflows registry
  - Tools registry (locked)
  - Roles registry (locked)
- **execution/** - Safety firewall
  - Execution guard
  - Policy enforcer
- **llm/** - Ollama integration
  - Ollama client
  - Model configuration
- **audit/** - Compliance and logging
  - Action logger
  - Decision logger
- **trace/** - Traceability and debugging
  - Per-agent debug traces
  - Session logs
  - LLM response logs

**tests/** - Comprehensive test suite:
- Agent tests
- Validator tests
- Policy tests
- Tool tests

**docs/** - Documentation:
- Architecture documentation
- Agent flow documentation
- Security model documentation

#### Key Design Principles

1. **Single Enterprise Agent**: One agent handles intent → plan → execution (not three separate agents)
2. **Separation of Concerns**:
   - Tools: Action-only, no business logic
   - Services: Data access only
   - Validators: Deterministic rule enforcement
   - Policies: Security artifacts (read-only)
3. **Safety First**:
   - Execution guard as safety firewall
   - Policy enforcer for security
   - Immutable audit logs
4. **Traceability**:
   - Per-agent debug traces
   - Session logs
   - LLM response logs
5. **Dynamic Configuration**:
   - Registry for non-code configs
   - Policies for security rules
   - Prompts for LLM instructions

### API Endpoints

**Orders**:
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `GET /api/orders/number/:orderNumber` - Get by order number
- `POST /api/orders/:id/status` - Update status
- `POST /api/orders/:id/cancel` - Cancel order

**Products**:
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `PUT /api/products/:id/variants/:variantId` - Update variant price

**Promotions**:
- `POST /api/promotions/validate-code` - Validate code
- `POST /api/promotions/apply-code` - Apply code

### Data Models

**Order**:
- id, orderNumber, status, paymentStatus, fulfillmentStatus
- customerEmail, billingAddress, shippingAddress
- lineItems[], discounts[], totals
- createdAt, updatedAt

**Product**:
- id, name, slug, description, status
- variants[], images[], categoryIds[]
- price, compareAtPrice, costPrice
- inventory levels per location

**Promotion**:
- id, name, type, value, status
- codes[], conditions[], targetIds[]
- usage limits, stackable rules

---

## Testing Strategy

### Unit Tests

**Agent Tests**:
- Conversation Agent: Intent detection, entity extraction, context management
- Validation Agent: Guardrail enforcement, rule validation, error messages
- Execution Agent: API mapping, error handling, response formatting

**Tool Tests**:
- OrderTool: All CRUD operations
- ProductTool: Price/description updates
- InventoryTool: Availability checks
- DiscountEngine: Calculation accuracy

**Target Coverage**: 90%+

### Integration Tests

- Agent communication flow
- API integration
- Tool integration
- End-to-end workflows

### E2E Tests

- Order cancellation workflow
- Product update workflow
- Error handling workflows
- Guardrail enforcement

### Test Structure

```
__tests__/
├── agents/
│   ├── conversationAgent.test.ts
│   ├── validationAgent.test.ts
│   └── executionAgent.test.ts
├── tools/
│   ├── orderTool.test.ts
│   ├── productTool.test.ts
│   └── inventoryTool.test.ts
└── integration/
    ├── agentFlow.test.ts
    └── apiIntegration.test.ts
```

---

## Deployment & Operations

### Development Setup

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start dev server
npm run dev
```

### Production Deployment

**Requirements**:
- Node.js 18+
- 2GB+ RAM
- Ollama service running

**Environment Variables**:
```env
NODE_ENV=production
PORT=3000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
```

**Build & Start**:
```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Monitoring

- **Logging**: Structured logging (Winston/Pino)
- **Metrics**: Prometheus metrics endpoint
- **Health Checks**: `/health` endpoint
- **Error Tracking**: Sentry integration

### Maintenance

**Regular Tasks**:
- Update guardrails as business rules change
- Refine prompts based on user feedback
- Monitor performance metrics
- Review error logs

**Monthly Tasks**:
- Review documentation
- Analyze usage patterns
- Optimize slow operations
- Update dependencies

---

## Observability & Logging

### Overview

Observability is critical for understanding system behavior, debugging issues, and optimizing performance. This section covers metrics tracking, logging strategy, and debug log storage for the multi-agent system.

### Metrics to Track

#### 1. Agent Performance Metrics

**Conversation Agent**:
- `agent.conversation.intent_detection.latency` - Time to detect intent (ms)
- `agent.conversation.intent_detection.confidence` - Confidence score (0-1)
- `agent.conversation.intent_detection.accuracy` - Correct intent detection rate
- `agent.conversation.entity_extraction.latency` - Time to extract entities (ms)
- `agent.conversation.entity_extraction.success_rate` - Successful extraction rate
- `agent.conversation.context_resolution.count` - Number of context resolutions
- `agent.conversation.clarification_requests.count` - Requests for clarification

**Validation Agent**:
- `agent.validation.guardrail_check.latency` - Time to check guardrails (ms)
- `agent.validation.guardrail_violations.count` - Number of violations
- `agent.validation.guardrail_violations.by_type` - Violations by guardrail type
- `agent.validation.rule_validation.latency` - Time to validate rules (ms)
- `agent.validation.status_transition.checks` - Status transition validations
- `agent.validation.price_limit.checks` - Price limit validations

**Execution Agent**:
- `agent.execution.api_call.latency` - API call duration (ms)
- `agent.execution.api_call.success_rate` - Successful API calls (%)
- `agent.execution.api_call.retry.count` - Number of retries
- `agent.execution.error.translation.latency` - Error translation time (ms)
- `agent.execution.response.formatting.latency` - Response formatting time (ms)

#### 2. System Performance Metrics

**Request Metrics**:
- `http.request.duration` - Total request duration (ms)
- `http.request.count` - Total request count
- `http.request.method` - By HTTP method (GET, POST, PUT, DELETE)
- `http.request.status_code` - By status code (200, 400, 500, etc.)
- `http.request.size` - Request payload size (bytes)
- `http.response.size` - Response payload size (bytes)

**API Endpoint Metrics**:
- `api.orders.get.latency` - Get order latency
- `api.orders.update.latency` - Update order latency
- `api.orders.cancel.latency` - Cancel order latency
- `api.products.get.latency` - Get product latency
- `api.products.update.latency` - Update product latency
- `api.promotions.validate.latency` - Validate promotion latency

**LLM Metrics**:
- `llm.ollama.request.latency` - LLM request duration (ms)
- `llm.ollama.request.tokens.input` - Input tokens count
- `llm.ollama.request.tokens.output` - Output tokens count
- `llm.ollama.request.cost` - Estimated cost per request
- `llm.ollama.request.errors` - LLM request errors
- `llm.ollama.model.usage` - Model usage by type

#### 3. Business Metrics

**Order Operations**:
- `business.orders.cancelled.count` - Orders cancelled
- `business.orders.status_changed.count` - Status changes
- `business.orders.status_changed.by_type` - By status type
- `business.orders.cancellation_rate` - Cancellation rate (%)

**Product Operations**:
- `business.products.price_updated.count` - Price updates
- `business.products.description_updated.count` - Description updates
- `business.products.update_frequency` - Update frequency

**Promotion Operations**:
- `business.promotions.validated.count` - Promotions validated
- `business.promotions.applied.count` - Promotions applied
- `business.promotions.rejected.count` - Promotions rejected

#### 4. Error Metrics

**Error Rates**:
- `errors.total.count` - Total errors
- `errors.by_type` - Errors by type (validation, execution, API, LLM)
- `errors.by_agent` - Errors by agent (conversation, validation, execution)
- `errors.by_endpoint` - Errors by API endpoint
- `errors.retry.count` - Errors that triggered retries
- `errors.recovery.success_rate` - Successful error recovery rate

**Error Types**:
- `errors.validation.guardrail_violation` - Guardrail violations
- `errors.validation.invalid_data` - Invalid data errors
- `errors.execution.api_failure` - API call failures
- `errors.execution.timeout` - Timeout errors
- `errors.llm.request_failed` - LLM request failures
- `errors.llm.invalid_response` - Invalid LLM responses

#### 5. Resource Metrics

**System Resources**:
- `system.cpu.usage` - CPU usage (%)
- `system.memory.usage` - Memory usage (MB)
- `system.memory.heap.used` - Heap memory used (MB)
- `system.memory.heap.total` - Total heap memory (MB)
- `system.disk.usage` - Disk usage (MB)
- `system.network.bytes_sent` - Bytes sent
- `system.network.bytes_received` - Bytes received

**Application Resources**:
- `app.active_sessions` - Active admin sessions
- `app.concurrent_requests` - Concurrent requests
- `app.queue.length` - Request queue length
- `app.cache.hit_rate` - Cache hit rate (%)
- `app.cache.size` - Cache size (items)

### Logging Strategy

#### Log Levels

**DEBUG** - Detailed information for debugging
- Agent internal state
- Entity extraction details
- Guardrail check details
- API request/response bodies
- LLM prompts and responses

**INFO** - General informational messages
- Request received
- Agent transitions
- Successful operations
- Configuration changes

**WARN** - Warning messages
- Guardrail violations
- Retry attempts
- Performance degradation
- Deprecated feature usage

**ERROR** - Error messages
- Failed operations
- API errors
- LLM errors
- Validation failures

**FATAL** - Critical errors
- System crashes
- Data corruption
- Security breaches

#### Structured Logging Format

All logs use structured JSON format:

```json
{
  "timestamp": "2026-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "agent-service",
  "agent": "conversation",
  "sessionId": "sess_abc123",
  "requestId": "req_xyz789",
  "message": "Intent detected: cancel_order",
  "metadata": {
    "intent": "cancel_order",
    "confidence": 0.95,
    "entities": {
      "orderNumber": "ORD-1001"
    },
    "latency": 245
  },
    "context": {
      "adminId": "admin_123",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
}
```

#### Log Categories

**Agent Logs**:
- `agent.conversation.*` - Conversation agent logs
- `agent.validation.*` - Validation agent logs
- `agent.execution.*` - Execution agent logs

**API Logs**:
- `api.orders.*` - Order API logs
- `api.products.*` - Product API logs
- `api.promotions.*` - Promotion API logs

**System Logs**:
- `system.startup.*` - Startup logs
- `system.shutdown.*` - Shutdown logs
- `system.health.*` - Health check logs

**Error Logs**:
- `error.validation.*` - Validation errors
- `error.execution.*` - Execution errors
- `error.api.*` - API errors

### Debug Log Storage

#### Storage Strategy

**Development Environment**:
- **Location**: `logs/` directory in project root
- **Format**: Daily rotating files
- **Retention**: 7 days
- **Structure**:
  ```
  logs/
  ├── debug/
  │   ├── debug-2026-01-15.log
  │   ├── debug-2026-01-16.log
  │   └── ...
  ├── info/
  │   ├── info-2026-01-15.log
  │   └── ...
  ├── error/
  │   ├── error-2026-01-15.log
  │   └── ...
  └── combined/
      ├── combined-2026-01-15.log
      └── ...
  ```

**Production Environment**:
- **Location**: Centralized logging service (ELK Stack, CloudWatch, etc.)
- **Format**: JSON structured logs
- **Retention**: 30 days for INFO, 90 days for ERROR
- **Backup**: Archive to S3/cloud storage after retention period

#### Log File Organization

**By Component**:
```
logs/
├── agents/
│   ├── conversation/
│   │   ├── conversation-2026-01-15.log
│   │   └── ...
│   ├── validation/
│   │   ├── validation-2026-01-15.log
│   │   └── ...
│   └── execution/
│       ├── execution-2026-01-15.log
│       └── ...
├── api/
│   ├── orders/
│   │   ├── orders-2026-01-15.log
│   │   └── ...
│   ├── products/
│   │   └── ...
│   └── promotions/
│       └── ...
└── system/
    ├── system-2026-01-15.log
    └── ...
```

**By Session**:
```
logs/sessions/
├── sess_abc123/
│   ├── session.log
│   ├── conversation.log
│   └── debug.log
└── sess_xyz789/
    └── ...
```

#### Log Rotation

**Daily Rotation**:
- New log file created at midnight UTC
- Previous day's logs compressed (gzip)
- Old logs archived after retention period

**Size-Based Rotation**:
- Rotate when file reaches 100MB
- Keep last 10 files
- Compress rotated files

**Configuration**:
```typescript
{
  "rotation": {
    "strategy": "daily",
    "maxSize": "100MB",
    "maxFiles": 10,
    "compress": true,
    "retention": {
      "debug": "7d",
      "info": "30d",
      "error": "90d"
    }
  }
}
```

### Logging Implementation

#### Winston Configuration

```typescript
import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'agent-service',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined', 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10
    }),
    // Debug logs (development only)
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.File({
        filename: path.join(logDir, 'debug', 'debug.log'),
        level: 'debug',
        maxsize: 10485760,
        maxFiles: 7
      })
    ] : [])
  ]
});

// Console output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

#### Agent-Specific Logging

```typescript
// Conversation Agent Logger
export const conversationLogger = logger.child({
  agent: 'conversation',
  component: 'agent'
});

// Validation Agent Logger
export const validationLogger = logger.child({
  agent: 'validation',
  component: 'agent'
});

// Execution Agent Logger
export const executionLogger = logger.child({
  agent: 'execution',
  component: 'agent'
});
```

#### Logging Best Practices

1. **Use Structured Logging**: Always log in JSON format
2. **Include Context**: Add requestId, sessionId, adminId to all logs
3. **Log at Appropriate Levels**: DEBUG for development, INFO for operations
4. **Don't Log Sensitive Data**: Never log passwords, tokens, or PII
5. **Use Correlation IDs**: Track requests across agents with requestId
6. **Log Errors with Stack Traces**: Include full error details
7. **Performance Logging**: Log latency for all operations
8. **Audit Logging**: Log all state-changing operations by admin

### Metrics Collection

#### Prometheus Integration

**Metrics Endpoint**: `/metrics`

**Example Metrics**:
```prometheus
# Agent Performance
agent_conversation_intent_detection_latency_ms{agent="conversation"} 245
agent_conversation_intent_detection_confidence{agent="conversation"} 0.95
agent_validation_guardrail_violations_total{type="status_transition"} 5

# API Performance
http_request_duration_seconds{method="POST",endpoint="/api/orders/:id/cancel"} 0.342
http_request_total{method="POST",status="200"} 1234

# Error Rates
errors_total{type="validation",agent="validation"} 12
errors_total{type="execution",agent="execution"} 8

# Business Metrics
business_orders_cancelled_total 45
business_products_price_updated_total 23
```

#### Custom Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Counters
const intentDetectionCounter = new Counter({
  name: 'agent_conversation_intent_detections_total',
  help: 'Total number of intent detections',
  labelNames: ['intent', 'confidence_level']
});

// Histograms
const apiLatencyHistogram = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Gauges
const activeSessionsGauge = new Gauge({
  name: 'app_active_sessions',
  help: 'Number of active admin sessions'
});
```

### Monitoring & Alerting

#### Health Checks

**Endpoint**: `/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:45.123Z",
  "uptime": 86400,
  "agents": {
    "conversation": "healthy",
    "validation": "healthy",
    "execution": "healthy"
  },
  "services": {
    "ollama": "healthy",
    "api": "healthy",
    "storage": "healthy"
  },
  "metrics": {
    "response_time_p95": 1.2,
    "error_rate": 0.001,
    "active_sessions": 15
  }
}
```

#### Alerting Rules

**Critical Alerts**:
- Error rate > 5% for 5 minutes
- Response time P95 > 5 seconds for 10 minutes
- Agent health check failures
- LLM service unavailable
- Disk space < 10%

**Warning Alerts**:
- Error rate > 1% for 10 minutes
- Response time P95 > 2 seconds for 15 minutes
- Guardrail violations > 10 per hour
- Memory usage > 80%

#### Dashboard Metrics

**Key Dashboards**:
1. **Agent Performance Dashboard**
   - Intent detection accuracy
   - Agent latency by type
   - Error rates by agent

2. **API Performance Dashboard**
   - Request latency by endpoint
   - Success/error rates
   - Throughput

3. **Business Metrics Dashboard**
   - Orders processed
   - Products updated
   - Promotions applied

4. **System Health Dashboard**
   - Resource usage
   - Service health
   - Error trends

### Log Analysis & Debugging

#### Querying Logs

**By Request ID**:
```bash
grep "req_xyz789" logs/combined/combined-*.log
```

**By Session ID**:
```bash
grep "sess_abc123" logs/combined/combined-*.log
```

**By Agent**:
```bash
grep '"agent":"conversation"' logs/combined/combined-*.log
```

**By Error Type**:
```bash
grep '"level":"ERROR"' logs/error/error-*.log | jq '.metadata.errorType'
```

#### Debug Log Analysis

**Trace Request Flow**:
1. Find request by requestId
2. Trace through all agents
3. Identify bottlenecks
4. Check error points

**Example Debug Trace**:
```bash
# Find all logs for a request
grep "req_xyz789" logs/debug/debug-*.log | jq '.'

# Output shows:
# 1. Conversation Agent: Intent detected
# 2. Validation Agent: Guardrails checked
# 3. Execution Agent: API called
# 4. Response formatted
```

### Storage Recommendations

#### Development
- **Local Files**: `logs/` directory
- **Retention**: 7 days
- **Size Limit**: 1GB total

#### Production
- **Centralized Logging**: ELK Stack, CloudWatch, Datadog
- **Retention**: 30-90 days based on log level
- **Archive**: Long-term storage (S3, Glacier) for compliance
- **Search**: Full-text search capability
- **Cost**: Optimize by log level and retention

#### Cloud Storage Options

**AWS**:
- CloudWatch Logs for real-time monitoring
- S3 for long-term storage
- Glacier for archival

**GCP**:
- Cloud Logging for real-time
- Cloud Storage for archival

**Azure**:
- Application Insights
- Blob Storage for archival

---

## Quick Start Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- Ollama installed locally
- Git

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ShopAgent
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

4. **Pull Qwen3 Model**
   ```bash
   ollama pull qwen2.5:14b
   ```

5. **Seed Database**
   ```bash
   npm run seed
   ```

6. **Start Server**
   ```bash
   npm run dev
   ```

### Access Points

- **Storefront**: `http://localhost:3000/`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **API Docs**: `http://localhost:3000/api`

### Common Commands

```bash
npm run dev          # Start dev server
npm run seed         # Seed database
npm test             # Run tests
npm run build        # Build for production
npm start            # Start production server
```

### Troubleshooting

**Ollama not found**:
```bash
ollama serve
```

**Port 3000 in use**:
```bash
PORT=3001 npm run dev
```

**TypeScript errors**:
```bash
rm -rf dist node_modules
npm install
npm run build
```

---

## Success Metrics

### Technical Metrics

- **Response Time**: < 2 seconds for 95% of requests
- **Accuracy**: > 95% intent detection accuracy
- **Error Rate**: < 1% unhandled errors
- **Uptime**: 99.9% availability

### Business Metrics

- **Task Completion**: > 90% of requests completed successfully
- **Admin Satisfaction**: > 4.5/5 rating
- **Time Saved**: 50% reduction in admin task time
- **Error Reduction**: 30% fewer manual errors

---

## Risk Mitigation

### Technical Risks

1. **LLM Accuracy**
   - Mitigation: Comprehensive testing, prompt engineering, fallback to structured input

2. **API Failures**
   - Mitigation: Retry logic, circuit breakers, graceful degradation

3. **Performance**
   - Mitigation: Caching, request batching, async processing

### Business Risks

1. **Guardrail Bypass**
   - Mitigation: Multi-layer validation, audit logging

2. **Data Loss**
   - Mitigation: Backup strategies, transaction logging

---

## Future Enhancements

### Short Term (3-6 months)

- Multi-language support
- Voice input/output
- Advanced analytics dashboard
- Mobile app integration

### Long Term (6-12 months)

- Multi-store support
- Advanced AI capabilities (predictive analytics)
- Integration with external services (shipping, payment)
- Custom agent training

---

## Conclusion

This enterprise multi-agent system provides a robust, scalable solution for natural language e-commerce management. The three-agent architecture ensures safety through validation, while the MCP provides flexibility for business rule changes without code modifications.

The phased implementation approach allows for incremental development and testing, ensuring quality at each stage. With comprehensive testing, monitoring, and documentation, the system is production-ready and maintainable.

**Key Strengths**:
- ✅ Dynamic guardrails (no code changes for business rules)
- ✅ Type-safe TypeScript implementation
- ✅ Comprehensive testing strategy
- ✅ Scalable architecture
- ✅ Production-ready deployment

**Next Steps**:
1. Review this documentation
2. Set up development environment
3. Follow Phase 1 implementation checklist
4. Iterate and refine based on testing

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-01-15  
**Status**: Ready for Implementation

