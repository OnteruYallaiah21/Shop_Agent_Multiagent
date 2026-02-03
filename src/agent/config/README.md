# Ollama Configuration

## Local Ollama Setup

The agents are configured to use **local Ollama** at `http://localhost:11434`.

### Configuration Files

- `ollama.config.ts` - Contains Ollama base URL and model configuration
- Used by `PlannerAgent` and `ExplanationAgent`

### Environment Variables

You can override the default configuration:

```bash
# Set custom Ollama URL (if not using default localhost:11434)
export OLLAMA_BASE_URL=http://localhost:11434

# Set custom model (if not using qwen3-coder:30b)
export OLLAMA_MODEL=qwen2.5-coder:7b
```

### Default Configuration

- **Base URL**: `http://localhost:11434` (Ollama default)
- **Model**: `qwen3-coder:30b` (or `qwen2.5-coder:7b` for testing)

### How ADK Connects to Ollama

ADK automatically detects Ollama when:
1. Model name matches an Ollama model (e.g., `qwen3-coder:30b`)
2. Ollama is running on `http://localhost:11434`
3. The model is available in Ollama (`ollama list` shows it)

### Verification

Check if Ollama is accessible:
```bash
curl http://localhost:11434/api/tags
```

Test agent health:
```bash
curl http://localhost:3000/agent/health
```

