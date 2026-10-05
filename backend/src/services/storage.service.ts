import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

export interface FileMetadata {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface IStorageService {
  saveFile(file: Express.Multer.File): Promise<FileMetadata>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
  async saveFile(file: Express.Multer.File): Promise<FileMetadata> {
    // Relative URL served via Express static
    const url = `/uploads/${file.filename}`;
    return {
      name: file.originalname,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(config.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error('[LocalStorageService] Error deleting file', err);
    }
  }
}

export const storageService = new LocalStorageService();
