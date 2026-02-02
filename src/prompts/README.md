# Prompt Registry

This directory contains all prompts used by the LLM agents in the system. Prompts are versioned and can be dynamically injected into LLM calls.

## Structure

```
prompts/
├── registry.json          # Prompt registry metadata
├── prompt.registry.ts     # Prompt registry manager
├── v1/                    # Version 1 prompts
│   ├── planner.txt
│   ├── validation.txt
│   ├── execution.txt
│   ├── response.txt
│   └── workflow.txt
└── v2/                    # Version 2 prompts (empty, ready for definition)
    ├── planner.txt
    ├── validation.txt
    ├── execution.txt
    ├── response.txt
    └── workflow.txt
```

## Usage

### Get Active Prompt

```typescript
import { promptRegistry } from './prompts/prompt.registry';

// Get active planner prompt
const plannerPrompt = promptRegistry.getActivePrompt('planner');

// Get active response prompt
const responsePrompt = promptRegistry.getActivePrompt('response');
```

### Get Specific Version

```typescript
// Get specific version
const plannerV1 = promptRegistry.getPrompt('planner', 'v1');
const plannerV2 = promptRegistry.getPrompt('planner', 'v2');

// Get active version number
const activeVersion = promptRegistry.getActiveVersion('planner'); // Returns "v1" or "v2"
```

### Build Prompt with Context

```typescript
// Inject dynamic context into prompt
const prompt = promptRegistry.buildPrompt('planner', {
  sessionId: 'sess-123',
  availableIntents: 'UPDATE_PRODUCT_PRICE, CANCEL_ORDER',
});
```

### Change Active Prompt

```typescript
// Switch to different version
promptRegistry.setActivePrompt('planner', 'v2');
```

### Register New Prompt

```typescript
// Register a new prompt version (creates file in v3 folder)
promptRegistry.registerPrompt(
  'planner',
  'v3',
  'v3/planner.txt',
  'Enhanced planner with multi-intent detection'
);
```

## Prompt Versioning

- **v1**: Basic version with core functionality
- **v2+**: Enhanced versions with additional features
- Active version is defined in `registry.json`

## Benefits

1. **Versioning**: Track prompt changes over time
2. **A/B Testing**: Test different prompt versions
3. **Rollback**: Quickly revert to previous versions
4. **Dynamic Injection**: Inject context at runtime
5. **Caching**: Prompts are cached for performance

## Adding New Prompts

1. Create a new `.txt` file (e.g., `planner.v3.txt`)
2. Register it using `promptRegistry.registerPrompt()`
3. Update `registry.json` if needed
4. Set as active using `promptRegistry.setActivePrompt()`

