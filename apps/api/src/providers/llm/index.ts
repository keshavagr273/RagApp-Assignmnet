import { ILLMProvider } from './llm.interface.js';
import { AnthropicProvider } from './anthropic.llm.js';
import { OpenAIProvider } from './openai.llm.js';
import { MockLLMProvider } from './mock.llm.js';
import { env } from '../../lib/env.js';

let llmInstance: ILLMProvider;

export function getLLMProvider(): ILLMProvider {
  if (!llmInstance) {
    if (env.ANTHROPIC_API_KEY) {
      llmInstance = new AnthropicProvider();
    } else if (env.OPENAI_API_KEY || env.GEMINI_API_KEY) {
      llmInstance = new OpenAIProvider();
    } else {
      llmInstance = new MockLLMProvider();
    }
  }
  return llmInstance;
}

export * from './llm.interface.js';

