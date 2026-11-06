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

  private resolveKey(key: string): string {
    const primary = path.resolve(this.baseDir, key);
    if (fs.existsSync(primary)) return primary;

    // Check alternative directory (monorepo root uploads vs apps/api/uploads)
    const altDir = this.baseDir.includes('apps')
      ? path.resolve(this.baseDir, '..', '..', 'uploads', key)
      : path.resolve(this.baseDir, 'apps', 'api', 'uploads', key);
    if (fs.existsSync(altDir)) return altDir;

    return primary;
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
    const fullPath = this.resolveKey(key);
    return await fs.promises.readFile(fullPath);
  }

  async deleteFile(key: string): Promise<void> {
    const fullPath = this.resolveKey(key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFilePath(key: string): string {
    return this.resolveKey(key);
  }
}
