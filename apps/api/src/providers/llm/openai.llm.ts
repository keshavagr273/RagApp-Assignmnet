import OpenAI from 'openai';
import { ILLMProvider, LLMMessage, VisionImage } from './llm.interface.js';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';

export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const isGemini = !!env.GEMINI_API_KEY && !env.OPENAI_API_KEY;
    const apiKey = isGemini ? env.GEMINI_API_KEY : (env.OPENAI_API_KEY || env.GEMINI_API_KEY || '');
    const baseURL = isGemini
      ? (env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai')
      : (env.OPENAI_BASE_URL || undefined);

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = env.LLM_MODEL || (isGemini ? 'gemini-2.5-flash' : 'gpt-4o');
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    images?: VisionImage[],
    systemPrompt?: string
  ): Promise<T> {
    const fullSystem = `${systemPrompt || 'You are an expert document analysis system.'}\n\nYou must return ONLY valid JSON matching this schema:\n${schemaDescription}`;

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
    if (images && images.length > 0) {
      for (const img of images) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || 'image/png'};base64,${img.buffer.toString('base64')}`,
          },
        });
      }
    }
    content.push({ type: 'text', text: prompt });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: fullSystem },
            { role: 'user', content },
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
        logger.warn({ attempt, error: err.message }, 'OpenAI structured parse retry');
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Failed to generate structured output from OpenAI');
  }

  async *streamChat(
    messages: LLMMessage[],
    systemPrompt: string,
    images?: VisionImage[]
  ): AsyncIterable<string> {
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'system') continue;

      if (i === messages.length - 1 && msg.role === 'user' && images && images.length > 0) {
        const parts: OpenAI.Chat.ChatCompletionContentPart[] = [];
        for (const img of images) {
          parts.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mimeType || 'image/png'};base64,${img.buffer.toString('base64')}`,
            },
          });
        }
        parts.push({ type: 'text', text: msg.content });
        openAIMessages.push({ role: 'user', content: parts });
      } else {
        openAIMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
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

