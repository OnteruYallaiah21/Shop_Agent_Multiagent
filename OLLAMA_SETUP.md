# Ollama Setup Guide

## Quick Setup

### 1. Install Ollama

Download and install Ollama from: https://ollama.com

### 2. Start Ollama Service

Ollama runs as a background service. It automatically starts when you install it.

**Verify Ollama is running:**
```bash
ollama list
```

If you see a list (even if empty), Ollama is running.

**Manual start (if needed):**
```bash
ollama serve
```

### 3. Download Model

**Option 1: Full Model (Recommended)**
```bash
ollama pull qwen3-coder:30b
```
- Size: ~19GB
- Best for: Production, high accuracy
- Download time: 10-30 minutes (depending on internet)

**Option 2: Smaller Model (For Testing)**
```bash
ollama pull qwen2.5-coder:7b
```
- Size: ~4GB
- Best for: Quick testing, faster responses
- Download time: 2-5 minutes

### 4. Test Ollama

**Test Model Directly:**
```bash
# Full model
ollama run qwen3-coder:30b

# OR smaller model
ollama run qwen2.5-coder:7b
```

Type a message and see if it responds. Press `Ctrl+D` to exit.

**Test Ollama API:**
```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "qwen3-coder:30b",
    "prompt": "Write hello world in TypeScript"
  }'
```

You should see a JSON response with generated text.

## Ollama API Endpoint

Ollama automatically exposes an OpenAI-style API at:

**Base URL:** `http://localhost:11434`

**Endpoints:**
- `/api/generate` - Generate text
- `/api/chat` - Chat completion
- `/api/models` - List models

## Model Selection

The agent code uses `qwen3-coder:30b` by default. To use the smaller model:

1. Update `src/agent/planner.agent.ts`:
   ```typescript
   model: "qwen2.5-coder:7b", // Change from qwen3-coder:30b
   ```

2. Update `src/agent/explanation.agent.ts`:
   ```typescript
   model: "qwen2.5-coder:7b", // Change from qwen3-coder:30b
   ```

## Verify Ollama Connection

**Check if Ollama is accessible:**
```bash
curl http://localhost:11434/api/tags
```

This should return a list of available models.

**Check specific model:**
```bash
curl http://localhost:11434/api/show -d '{"name": "qwen3-coder:30b"}'
```

## Troubleshooting

### Ollama Not Found
```bash
# Check if Ollama is installed
which ollama

# If not found, install from https://ollama.com
```

### Port 11434 Already in Use
```bash
# Check what's using the port
lsof -i :11434

# Kill the process if needed
kill -9 <PID>
```

### Model Download Fails
```bash
# Check internet connection
ping ollama.com

# Try downloading again
ollama pull qwen3-coder:30b
```

### ADK Can't Connect to Ollama
Make sure:
1. Ollama is running (`ollama list` works)
2. Model is downloaded (`ollama list` shows the model)
3. Port 11434 is accessible (`curl http://localhost:11434/api/tags` works)

## Environment Variables

Currently, ADK uses Ollama's default endpoint. If you need to customize:

```typescript
// In agent files, you can configure Ollama endpoint
// ADK should automatically detect Ollama if model name matches
```

## Quick Test Commands

```bash
# 1. Check Ollama is running
ollama list

# 2. Test model directly
ollama run qwen3-coder:30b

# 3. Test API
curl http://localhost:11434/api/generate \
  -d '{"model": "qwen3-coder:30b", "prompt": "Hello"}'

# 4. Start your service
npm run dev
```

