# Ollama Local Configuration

## Overview

Both **PlannerAgent** and **ExplanationAgent** use **local Ollama** at `http://localhost:11434`.

## Configuration Location

The Ollama base URL is configured in:
- **File**: `src/agent/config/ollama.config.ts`
- **Default URL**: `http://localhost:11434`
- **Default Model**: `qwen3-coder:30b`

## How It Works

### 1. ADK Automatic Detection

ADK automatically connects to Ollama when:
- Model name matches an Ollama model (e.g., `qwen3-coder:30b`)
- Ollama is running on `http://localhost:11434`
- The model is available in Ollama (`ollama list` shows it)

### 2. Agent Configuration

**PlannerAgent** (`src/agent/planner.agent.ts`):
```typescript
super({
  name: "planner_agent",
  model: DEFAULT_OLLAMA_MODEL, // "qwen3-coder:30b"
  instruction: prompt,
  outputSchema: PlannerOutputSchema,
  outputKey: "plan",
});
```

**ExplanationAgent** (`src/agent/explanation.agent.ts`):
```typescript
super({
  name: "explanation_agent",
  model: DEFAULT_OLLAMA_MODEL, // "qwen3-coder:30b"
  instruction: prompt,
});
```

### 3. Environment Variables

You can override defaults:

```bash
# Set custom Ollama URL (if not using default localhost:11434)
export OLLAMA_BASE_URL=http://localhost:11434

# Set custom model (if not using qwen3-coder:30b)
export OLLAMA_MODEL=qwen2.5-coder:7b
```

## Verification

### Check Ollama is Running

```bash
# List available models
ollama list

# Test API directly
curl http://localhost:11434/api/tags
```

### Check Agent Health

```bash
# Health check endpoint
curl http://localhost:3000/agent/health
```

## Connection Flow

```
PlannerAgent / ExplanationAgent
   ↓
ADK Framework
   ↓
Detects model name matches Ollama model
   ↓
Connects to http://localhost:11434
   ↓
Calls Ollama API
   ↓
Returns generated text
```

## Troubleshooting

### Ollama Not Found

1. **Check Ollama is installed:**
   ```bash
   ollama --version
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Download model:**
   ```bash
   ollama pull qwen3-coder:30b
   ```

### Connection Errors

1. **Verify Ollama is accessible:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check firewall/port:**
   - Ollama uses port `11434` by default
   - Make sure it's not blocked

3. **Check model availability:**
   ```bash
   ollama list | grep qwen3-coder
   ```

## Files Reference

- `src/agent/config/ollama.config.ts` - Configuration
- `src/agent/planner.agent.ts` - Uses Ollama for intent extraction
- `src/agent/explanation.agent.ts` - Uses Ollama for explanations
- `src/agent/utils/ollama.verify.ts` - Verification utilities
- `src/routes/agent.ts` - Health check endpoint

## Summary

✅ **Ollama URL is configured locally** in `ollama.config.ts`  
✅ **Default URL**: `http://localhost:11434`  
✅ **Default Model**: `qwen3-coder:30b`  
✅ **ADK automatically connects** when model name matches  
✅ **Can be overridden** via environment variables

