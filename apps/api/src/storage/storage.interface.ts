export interface IStorageAdapter {
  uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getFilePath?(key: string): string; // for local files if available
}

