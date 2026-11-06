import fs from 'fs';
import path from 'path';
import { IStorageAdapter } from './storage.interface.js';
import { env } from '../lib/env.js';

export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || env.UPLOAD_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.resolve(this.baseDir, key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, buffer);
    return key;
  }

  async getFile(key: string): Promise<Buffer> {
    const fullPath = path.resolve(this.baseDir, key);
    return await fs.promises.readFile(fullPath);
  }

  async deleteFile(key: string): Promise<void> {
    const fullPath = path.resolve(this.baseDir, key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFilePath(key: string): string {
    return path.resolve(this.baseDir, key);
  }
}

