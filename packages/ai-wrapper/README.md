# AI Wrapper Package

Universal AI model abstraction layer for Zarai Dost - enables seamless integration and switching between multiple AI providers.

## Overview

The AI Wrapper provides a unified interface for interacting with various AI models (GPT, Claude, Gemini, Llama) without changing application code. Built for the AI Wrapper Competition 2025, it simplifies model management, prompt engineering, and response handling while enabling easy A/B testing and fallback strategies.

## Features

- **Multi-Provider Support**: OpenAI GPT, Anthropic Claude, Google Gemini, Meta Llama
- **Unified Interface**: Single API for all providers
- **Automatic Fallback**: Switch to backup provider on failure
- **Cost Optimization**: Route requests to most cost-effective model
- **Response Caching**: Redis-based caching for repeated queries
- **Prompt Templates**: Reusable templates with variable interpolation
- **Multi-Agent Orchestration**: LangChain integration for complex workflows
- **Token Usage Tracking**: Monitor and optimize API costs
- **Rate Limiting**: Respect provider rate limits
- **Streaming Support**: Real-time response streaming
- **Context Management**: Conversation history and context window management

## Installation

```bash
# In monorepo root
pnpm add @zaraidost/ai-wrapper

# Or standalone
npm install @zaraidost/ai-wrapper
```

## Quick Start

```typescript
import { AIWrapper } from '@zaraidost/ai-wrapper';

// Initialize with default provider
const ai = new AIWrapper({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview'
});

// Simple completion
const response = await ai.complete({
  prompt: 'What are common wheat diseases in Pakistan?',
  maxTokens: 500
});

console.log(response.text);
```

## Configuration

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

# Google Gemini
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-pro

# Groq (for Llama)
GROQ_API_KEY=...
GROQ_MODEL=llama3-70b-8192

# Configuration
DEFAULT_PROVIDER=openai
ENABLE_FALLBACK=true
FALLBACK_PROVIDERS=anthropic,google
ENABLE_CACHING=true
REDIS_URL=redis://localhost:6379
```

### Initialization Options

```typescript
interface AIWrapperConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'groq';
  apiKey: string;
  model?: string;
  temperature?: number;           // 0-1, default: 0.7
  maxTokens?: number;            // Default: 1000
  topP?: number;                 // 0-1, default: 1
  enableFallback?: boolean;      // Default: true
  fallbackProviders?: string[];  // Default: all others
  enableCaching?: boolean;       // Default: true
  cacheTTL?: number;            // Seconds, default: 3600
  timeout?: number;             // Milliseconds, default: 30000
  retries?: number;             // Default: 3
}
```

## Usage Examples

### Basic Completion

```typescript
const ai = new AIWrapper({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const result = await ai.complete({
  prompt: 'Identify crop diseases from these symptoms: yellow leaves, brown spots',
  temperature: 0.3,
  maxTokens: 300
});
```

### Chat Conversation

```typescript
const conversation = ai.createConversation();

await conversation.addMessage('user', 'What fertilizer is best for wheat?');
const response1 = await conversation.complete();

await conversation.addMessage('user', 'How much should I apply per acre?');
const response2 = await conversation.complete();

// Get full conversation history
const history = conversation.getHistory();
```

### Streaming Responses

```typescript
const stream = await ai.streamComplete({
  prompt: 'Explain integrated pest management for cotton crops'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Using Templates

```typescript
// Define template
const diseaseTemplate = ai.createTemplate({
  name: 'crop-disease-diagnosis',
  template: `
    You are an expert agricultural advisor in Pakistan.
    Analyze the following crop information and provide diagnosis:

    Crop: {{crop}}
    Symptoms: {{symptoms}}
    Location: {{location}}
    Season: {{season}}

    Provide:
    1. Likely disease identification
    2. Confidence level
    3. Treatment recommendations
    4. Local product availability
  `,
  variables: ['crop', 'symptoms', 'location', 'season']
});

// Use template
const result = await diseaseTemplate.execute({
  crop: 'wheat',
  symptoms: 'yellow rust on leaves',
  location: 'Punjab',
  season: 'Rabi'
});
```

### Multi-Provider Setup

```typescript
// Primary: GPT-4, Fallback: Claude, Gemini
const ai = new AIWrapper({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
  enableFallback: true,
  fallbackProviders: [
    {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-sonnet-20240229'
    },
    {
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-pro'
    }
  ]
});

// Automatically uses fallback if primary fails
const result = await ai.complete({ prompt: 'Hello' });
```

### Cost Optimization

```typescript
// Route based on complexity
const ai = new AIWrapper({
  provider: 'openai',
  routing: {
    simple: { model: 'gpt-3.5-turbo', maxTokens: 500 },
    medium: { model: 'gpt-4', maxTokens: 1000 },
    complex: { model: 'gpt-4-turbo-preview', maxTokens: 2000 }
  }
});

// Simple query → uses GPT-3.5
await ai.complete({
  prompt: 'What is wheat?',
  complexity: 'simple'
});

// Complex query → uses GPT-4 Turbo
await ai.complete({
  prompt: 'Analyze these soil test results and recommend fertilizer...',
  complexity: 'complex'
});
```

### Caching

```typescript
// Enable caching (cached for 1 hour by default)
const ai = new AIWrapper({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  enableCaching: true,
  cacheTTL: 3600
});

// First call hits API
const response1 = await ai.complete({ prompt: 'Common wheat diseases' });

// Second call returns cached response (no API call)
const response2 = await ai.complete({ prompt: 'Common wheat diseases' });

// Clear cache for specific prompt
await ai.clearCache({ prompt: 'Common wheat diseases' });
```

### Multi-Agent Workflows (LangChain)

```typescript
import { createAgentWorkflow } from '@zaraidost/ai-wrapper/langchain';

// Create multi-agent workflow
const workflow = createAgentWorkflow({
  agents: [
    {
      name: 'vision',
      model: 'gpt-4-vision-preview',
      task: 'Analyze crop image and identify issues'
    },
    {
      name: 'advisor',
      model: 'claude-3-opus-20240229',
      task: 'Provide detailed treatment recommendations'
    },
    {
      name: 'market',
      model: 'gemini-pro',
      task: 'Suggest cost-effective products'
    }
  ]
});

// Execute workflow
const result = await workflow.execute({
  imageUrl: 'https://example.com/crop.jpg',
  location: 'Punjab',
  budget: 5000
});

/*
Result contains outputs from all agents:
{
  vision: { disease: 'Yellow Rust', confidence: 0.92 },
  advisor: { treatment: 'Apply fungicide...', timing: 'Within 3 days' },
  market: { products: [...], totalCost: 4500 }
}
*/
```

### Token Usage Tracking

```typescript
const ai = new AIWrapper({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  trackUsage: true
});

const result = await ai.complete({ prompt: 'Hello world' });

console.log(result.usage);
/*
{
  promptTokens: 10,
  completionTokens: 15,
  totalTokens: 25,
  estimatedCost: 0.00075  // USD
}
*/

// Get cumulative usage
const totalUsage = ai.getTotalUsage();
console.log(`Total cost: $${totalUsage.totalCost}`);
```

## Project Structure

```
packages/ai-wrapper/
├── src/
│   ├── index.ts              # Main exports
│   ├── AIWrapper.ts          # Core wrapper class
│   ├── providers/            # Provider implementations
│   │   ├── base.provider.ts
│   │   ├── openai.provider.ts
│   │   ├── anthropic.provider.ts
│   │   ├── google.provider.ts
│   │   └── groq.provider.ts
│   ├── templates/            # Prompt template engine
│   │   └── TemplateEngine.ts
│   ├── cache/                # Caching layer
│   │   └── CacheManager.ts
│   ├── langchain/            # LangChain integration
│   │   └── AgentWorkflow.ts
│   ├── utils/
│   │   ├── tokenCounter.ts
│   │   ├── costCalculator.ts
│   │   └── rateLimiter.ts
│   └── types/
│       └── index.ts
├── tests/
├── examples/
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

### AIWrapper Class

#### `complete(options: CompletionOptions): Promise<CompletionResult>`

Generate a text completion.

**Parameters:**
- `prompt` (string): The input prompt
- `maxTokens` (number): Maximum tokens to generate
- `temperature` (number): Randomness (0-1)
- `stopSequences` (string[]): Stop generation at these sequences

**Returns:** `CompletionResult`
- `text` (string): Generated text
- `finishReason` (string): Why generation stopped
- `usage` (object): Token usage statistics
- `provider` (string): Which provider was used
- `cached` (boolean): Whether response was cached

#### `streamComplete(options: CompletionOptions): AsyncGenerator<CompletionChunk>`

Stream a text completion.

#### `createConversation(): Conversation`

Create a conversation context for multi-turn chat.

#### `createTemplate(template: TemplateConfig): Template`

Create a reusable prompt template.

### Conversation Class

#### `addMessage(role: 'user' | 'assistant', content: string): void`

Add message to conversation history.

#### `complete(options?: CompletionOptions): Promise<CompletionResult>`

Generate response based on conversation history.

#### `getHistory(): Message[]`

Get all messages in conversation.

### Template Class

#### `execute(variables: Record<string, string>): Promise<CompletionResult>`

Execute template with provided variables.

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Test specific provider
pnpm test openai.provider.test.ts
```

## Best Practices

1. **Use Templates**: Create reusable templates for common tasks
2. **Enable Caching**: Reduce costs for repeated queries
3. **Set Timeouts**: Prevent hanging requests
4. **Monitor Usage**: Track token consumption and costs
5. **Implement Fallbacks**: Always have backup providers
6. **Temperature Control**: Use low temperature (0.1-0.3) for factual tasks
7. **Context Management**: Clear conversation history to stay within limits
8. **Error Handling**: Always wrap calls in try-catch blocks

## Performance Tips

- Cache frequently asked questions
- Use cheaper models (GPT-3.5) for simple queries
- Implement request batching for multiple queries
- Set appropriate max token limits
- Use streaming for long responses

## Troubleshooting

### Common Issues

**API key invalid**
- Verify environment variables are set correctly
- Check API key has required permissions

**Rate limit exceeded**
- Enable automatic retries with exponential backoff
- Use rate limiting middleware
- Distribute load across multiple API keys

**Timeout errors**
- Increase timeout duration
- Check network connectivity
- Use streaming for long completions

**High costs**
- Enable caching
- Use cheaper models for simple tasks
- Set lower max token limits
- Monitor usage with tracking

## Contributing

See main [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT - See [LICENSE](../../LICENSE)

---

**Built for AI Wrapper Competition 2025**
