# MCP Tools - ADK Function Tools

This directory contains all ADK (Agent Development Kit) Function Tools for the ShopAgent system.

## Required Dependencies

Before using these tools, ensure the following packages are installed:

```bash
npm install @google/adk zod
```

## Available Tools

### Orders Tools (`orders.tool.ts`)
- `get_order_by_order_number` - Retrieve order details by order number
- `update_order_status` - Update order status (pending, confirmed, processing, shipped, delivered, cancelled)
- `cancel_order` - Cancel an order (only if not shipped or delivered)

### Products Tools (`products.tool.ts`)
- `get_product_by_sku` - Retrieve product and variant details by SKU
- `update_product_price` - Update product variant price by SKU
- `update_product_description` - Update product description by SKU

### Promotions Tools (`promotions.tool.ts`)
- `get_promotion_by_id` - Retrieve promotion details by ID
- `activate_promotion` - Activate a promotion (set status to active)
- `deactivate_promotion` - Deactivate a promotion (set status to paused)
- `get_promotion_usage` - Get promotion usage statistics

## Usage

Import tools in your agent:

```typescript
import {
  getOrderByOrderNumberTool,
  updateOrderStatusTool,
  cancelOrderTool,
  getProductBySkuTool,
  updateProductPriceTool,
  updateProductDescriptionTool,
  getPromotionByIdTool,
  activatePromotionTool,
  deactivatePromotionTool,
  getPromotionUsageTool,
} from './mcp_tools';
```

Then add them to your agent's tools array:

```typescript
const agent = new LlmAgent({
  // ... other config
  tools: [
    getOrderByOrderNumberTool,
    updateOrderStatusTool,
    cancelOrderTool,
    getProductBySkuTool,
    updateProductPriceTool,
    updateProductDescriptionTool,
    getPromotionByIdTool,
    activatePromotionTool,
    deactivatePromotionTool,
    getPromotionUsageTool,
  ],
});
```

## Data Storage

All tools use the `Storage` class from `../utils/storage` which:
- Automatically uses `data/dynamic/` directory for read/write operations
- Copies from `data/seed/` on first write if dynamic file doesn't exist
- Provides atomic file operations with caching

## Tool Structure

Each tool follows the ADK FunctionTool pattern:
- Uses `zod` for parameter validation
- Returns structured responses with `status`, data, and `error_message` fields
- Includes comprehensive docstrings for LLM understanding
- Implements proper error handling

