import { ILLMProvider } from './llm.interface.js';
import { GeminiProvider } from './gemini.llm.js';
import { GroqProvider } from './groq.llm.js';
import { MockLLMProvider } from './mock.llm.js';
import { env } from '../../lib/env.js';

let llmInstance: ILLMProvider;
let visionLLMInstance: ILLMProvider;

export function getLLMProvider(): ILLMProvider {
  if (!llmInstance) {
    if (env.GROQ_API_KEY || (env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('gsk_'))) {
      llmInstance = new GroqProvider();
    } else if (env.GEMINI_API_KEY) {
      llmInstance = new GeminiProvider();
    } else {
      llmInstance = new MockLLMProvider();
    }
  }
  return llmInstance;
}

export function getVisionLLMProvider(): ILLMProvider {
  if (!visionLLMInstance) {
    if (env.GEMINI_API_KEY) {
      visionLLMInstance = new GeminiProvider();
    } else {
      visionLLMInstance = new MockLLMProvider();
    }
  }
  return visionLLMInstance;
}

export * from './llm.interface.js';
