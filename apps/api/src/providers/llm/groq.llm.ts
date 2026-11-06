import OpenAI from 'openai';
import { ILLMProvider, LLMMessage, VisionImage } from './llm.interface.js';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';

export class GroqProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = env.GROQ_API_KEY || env.OPENAI_API_KEY || '';
    const baseURL = env.GROQ_BASE_URL || env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = env.GROQ_MODEL || 'openai/gpt-oss-120b';
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    _images?: VisionImage[],
    systemPrompt?: string
  ): Promise<T> {
    const fullSystem = `${systemPrompt || 'You are an expert document analysis system.'}\n\nYou must return ONLY valid JSON matching this schema:\n${schemaDescription}`;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: fullSystem },
            { role: 'user', content: prompt },
          ],
        });

        let rawText = response.choices[0]?.message?.content || '{}';
        rawText = rawText.trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        }
        return JSON.parse(rawText) as T;
      } catch (err: any) {
        lastError = err;
        logger.warn({ attempt, error: err.message }, 'Groq structured parse retry');
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Failed to generate structured output from Groq');
  }

  async *streamChat(
    messages: LLMMessage[],
    systemPrompt: string,
    _images?: VisionImage[]
  ): AsyncIterable<string> {
    const groqMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messages) {
      if (msg.role === 'system') continue;
      groqMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: groqMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  }
}
