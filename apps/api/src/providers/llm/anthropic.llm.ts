import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider, LLMMessage, VisionImage } from './llm.interface.js';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';

export class AnthropicProvider implements ILLMProvider {
  private client: Anthropic;
  private model: string;
  private visionModel: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY || '',
    });
    this.model = env.LLM_MODEL || 'claude-3-5-sonnet-20241022';
    this.visionModel = env.LLM_VISION_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    images?: VisionImage[],
    systemPrompt?: string
  ): Promise<T> {
    const fullSystem = `${systemPrompt || 'You are an expert document analysis system.'}\n\nYou must return ONLY a valid, raw JSON object matching this schema description:\n${schemaDescription}\nDo NOT include markdown backticks or any other text before or after the JSON.`;

    const content: any[] = [];

    if (images && images.length > 0) {
      for (const img of images) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: (img.mimeType || 'image/png') as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
            data: img.buffer.toString('base64'),
          },
        });
      }
    }

    content.push({
      type: 'text',
      text: prompt,
    });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: images && images.length > 0 ? this.visionModel : this.model,
          max_tokens: 4096,
          system: fullSystem,
          messages: [{ role: 'user', content }],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        const rawText = textBlock && 'text' in textBlock ? textBlock.text : '';

        // Clean any accidental markdown code fences
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        return JSON.parse(cleaned) as T;
      } catch (err: any) {
        lastError = err;
        logger.warn({ attempt, error: err.message }, 'Anthropic structured parse retry');
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Failed to generate structured output from Anthropic');
  }

  async *streamChat(
    messages: LLMMessage[],
    systemPrompt: string,
    images?: VisionImage[]
  ): AsyncIterable<string> {
    const formattedMessages: Anthropic.MessageParam[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'system') continue;

      if (i === messages.length - 1 && msg.role === 'user' && images && images.length > 0) {
        const content: any[] = [];
        for (const img of images) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: (img.mimeType || 'image/png') as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
              data: img.buffer.toString('base64'),
            },
          });
        }
        content.push({ type: 'text', text: msg.content });
        formattedMessages.push({ role: 'user', content } as any);
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    const stream = await this.client.messages.stream({
      model: images && images.length > 0 ? this.visionModel : this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: formattedMessages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
