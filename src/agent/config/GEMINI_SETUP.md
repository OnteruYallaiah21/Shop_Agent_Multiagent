# Gemini API Setup for PlannerAgent

## Configuration

PlannerAgent now uses **Gemini 2.5 Flash** instead of local Ollama.

## Environment Variable

Set the Gemini API key before starting the service:

```bash
export GEMINI_API_KEY=your_api_key_here
```

Or create a `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

## Model

- **Model**: `gemini-2.5-flash`
- **Provider**: Google Gemini API
- **Base URL**: `https://generativelanguage.googleapis.com/v1beta`

## Available Tools

PlannerAgent has access to all these tools:

### Orders Tools
- `getOrderByOrderNumberTool` - Get order details
- `updateOrderStatusTool` - Update order status
- `cancelOrderTool` - Cancel an order

### Products Tools
- `getProductBySkuTool` - Get product details
- `updateProductPriceTool` - Update product price
- `updateProductDescriptionTool` - Update product description

### Promotions Tools
- `getPromotionByIdTool` - Get promotion details
- `activatePromotionTool` - Activate promotion
- `deactivatePromotionTool` - Deactivate promotion

## How It Works

1. PlannerAgent receives user message
2. Can optionally call tools to gather information (e.g., verify SKU exists)
3. Extracts intent and entities
4. Returns structured output with confidence score

## Testing

The API key was tested and confirmed working. The test file has been deleted.

