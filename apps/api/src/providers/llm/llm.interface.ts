export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface VisionImage {
  buffer: Buffer;
  mimeType: string;
}

export interface ILLMProvider {
  generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    images?: VisionImage[],
    systemPrompt?: string
  ): Promise<T>;

  streamChat(
    messages: LLMMessage[],
    systemPrompt: string,
    images?: VisionImage[]
  ): AsyncIterable<string>;
}

