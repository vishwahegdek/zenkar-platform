import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as crypto from 'crypto';
import type { Response } from 'express';

@Injectable()
export class UploadsService {
  private uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsDir();
  }

  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<{
    keyRaw: string;
    keyOptimized: string;
    keyThumbnail: string;
  }> {
    this.ensureUploadsDir();

    const id = crypto.randomUUID();

    // Inspect image metadata to handle transparency and auto-rotation
    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    const hasAlpha = Boolean(metadata.hasAlpha);

    // Master / high-res photo:
    // Downsized to max 2048x2048 (2K resolution) with MozJPEG/WebP quality 86,
    // maintaining crisp wood grain and fine carpentry details without noticeable degradation,
    // while keeping storage footprint firmly around 0.5 to 1.0 MB (instead of 5-15 MB uncompressed).
    const rawFilename = `raw-${id}${hasAlpha ? '.webp' : '.jpg'}`;
    const optFilename = `opt-${id}.webp`;
    const thumbFilename = `thumb-${id}.webp`;

    const rawPath = path.join(this.uploadsDir, rawFilename);
    const optPath = path.join(this.uploadsDir, optFilename);
    const thumbPath = path.join(this.uploadsDir, thumbFilename);

    // Save downsized master image (0.5 to 1.0 MB target)
    if (hasAlpha) {
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86, effort: 4 })
        .toFile(rawPath);
    } else {
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true, progressive: true })
        .toFile(rawPath);
    }

    // Generate optimized image for catalog cards and views (max 1200x1200, webp quality 80, ~80-120 KB)
    await sharp(file.buffer)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optPath);

    // Generate thumbnail (300x300, cover, webp quality 80, ~15-25 KB)
    await sharp(file.buffer)
      .rotate()
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    return {
      keyRaw: `/api/uploads/${rawFilename}`,
      keyOptimized: `/api/uploads/${optFilename}`,
      keyThumbnail: `/api/uploads/${thumbFilename}`,
    };
  }

  async deleteImageFiles(image: { keyRaw?: string | null; keyOptimized?: string | null; keyThumbnail?: string | null }) {
    const keys = [image.keyRaw, image.keyOptimized, image.keyThumbnail].filter(Boolean);
    for (const key of keys) {
      if (key && key.startsWith('/api/uploads/')) {
        const filename = key.replace('/api/uploads/', '');
        const filePath = path.join(this.uploadsDir, filename);
        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } catch (err) {
          console.warn(`[UploadsService] Failed to remove file: ${filePath}`, err);
        }
      }
    }
  }

  serveFile(filename: string, res: Response) {
    const filePath = path.join(this.uploadsDir, filename);
    const resolvedPath = path.resolve(filePath);

    // Guard against directory traversal
    if (!resolvedPath.startsWith(path.resolve(this.uploadsDir))) {
      throw new ForbiddenException('Access denied');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(resolvedPath);
  }
}
