# How to Start the Service

## Prerequisites

1. **Node.js 18+** installed
2. **Gemini API Key** (required for PlannerAgent)
   - Get your API key from: https://aistudio.google.com/apikey
   - Set environment variable: `export GEMINI_API_KEY=your_api_key`
   - Or: `export GOOGLE_GENAI_API_KEY=your_api_key`
3. **Ollama** (optional, for ExplanationAgent if using local LLM)
   - Only needed if ExplanationAgent uses Ollama
   - Model: `qwen3-coder:30b` (or `qwen2.5-coder:7b` for testing)

## Step-by-Step Startup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Gemini API Key (Required)

```bash
# Set the API key for PlannerAgent (uses Gemini 2.5 Flash)
export GEMINI_API_KEY=your_api_key_here
# OR
export GOOGLE_GENAI_API_KEY=your_api_key_here
```

**Important**: The API key must be set before starting the service. PlannerAgent uses Gemini 2.5 Flash and requires this key.

### 3. Install Ollama Model (Optional - Only if using local LLM for ExplanationAgent)

```bash
# Make sure Ollama is running
ollama pull qwen3-coder:30b
```

**Note:** This model is ~19GB, so it may take time to download. Only needed if ExplanationAgent uses Ollama.

### 4. Seed the Database (First Time Only)

```bash
npm run seed
```

This creates the initial data in `data/seed/` directory.

### 5. Start the Service

**Development Mode (Recommended):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

### 5. Verify Services are Running

The service should start on **port 3000**:

- **Storefront**: http://localhost:3000/
- **Admin Dashboard**: http://localhost:3000/admin
- **API Documentation**: http://localhost:3000/api
- **Agent Service**: http://localhost:3000/agent/chat
- **Health Check**: http://localhost:3000/health

### 6. Test the Chatbot

1. Open http://localhost:3000/admin
2. Click the **💬 StorePilot** button (bottom right)
3. Try asking:
   - "Change price of HP-BLK-001 to $320"
   - "Cancel order ORD-1001"
   - "What happened in this session?"

## Troubleshooting

### Ollama Not Running

If you see errors about Ollama connection:

```bash
# Check if Ollama is running
ollama list

# If not running, start Ollama
ollama serve
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Set a different port
PORT=3001 npm run dev
```

### Missing Dependencies

If you see module errors:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Data Not Loading

If data doesn't load:

```bash
# Re-seed the database
npm run seed
```

## Service Architecture

```
┌─────────────────┐
│   Ollama        │  Port 11434 (Local LLM)
│   qwen3-coder   │
└─────────────────┘
         ↑
         │
┌─────────────────┐
│   Agent Service │  Port 3000
│   (ADK)         │
│   - Planner     │
│   - Validation  │
│   - Execution   │
│   - Explanation │
└─────────────────┘
         ↑
         │
┌─────────────────┐
│   Backend API   │  Port 3000
│   - Products    │
│   - Orders      │
│   - Promotions  │
└─────────────────┘
         ↑
         │
┌─────────────────┐
│   UI (Chatbot)  │  Port 3000
│   - Admin       │
│   - Storefront  │
└─────────────────┘
```

## Quick Start Commands

```bash
# Full startup sequence
npm install
npm run seed
npm run dev
```

## Environment Variables

Currently, the service uses default values:
- `PORT=3000` (can be overridden with `PORT` env variable)
- Ollama URL: `http://localhost:11434` (default)

## Next Steps

After starting the service:
1. Open http://localhost:3000/admin
2. Click StorePilot chatbot
3. Start chatting with the agent!

