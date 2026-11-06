export interface IEmbedProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

