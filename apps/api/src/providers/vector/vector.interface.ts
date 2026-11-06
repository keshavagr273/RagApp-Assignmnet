export interface VectorSearchResult {
  chunkId: string;
  score: number;
}

export interface IVectorStore {
  search(
    queryVector: number[],
    filter: { collectionId?: string; documentIds?: string[] },
    topK: number
  ): Promise<VectorSearchResult[]>;
}

