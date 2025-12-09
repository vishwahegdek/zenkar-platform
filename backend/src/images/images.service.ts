import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Mobile-first Image Response
 */
export interface ImageResponse {
  id: number;
  thumbnailUrl: string;
  optimizedUrl: string;
  rawUrl: string;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async processAndUpload(
    fileBuffer: Buffer,
    originalName: string,
    relation: { productId?: number; orderItemId?: number },
  ) {
    const ext = path.extname(originalName);
    const baseName = uuidv4();
    
    // 1. Raw Key
    const keyRaw = `raw/${baseName}${ext}`;
    
    // 2. Optimized Key (<1MB, webp)
    const keyOptimized = `opt/${baseName}.webp`;
    
    // 3. Thumbnail Key (200px, webp)
    const keyThumbnail = `thumb/${baseName}.webp`;

    // Process Images in parallel
    const [optimizedBuffer, thumbnailBuffer] = await Promise.all([
      // Optimize: Resize to max 1920px width, 80% quality webp
      sharp(fileBuffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer(),
      
      // Thumbnail: Resize to 300px width
      sharp(fileBuffer)
        .resize({ width: 300 })
        .webp({ quality: 60 })
        .toBuffer(),
    ]);

    // Upload in parallel
    await Promise.all([
      // Upload Raw -> zenkar-raw
      this.storage.upload('zenkar-raw', keyRaw, fileBuffer, {
        'Content-Type': 'application/octet-stream', // or guess mime type
      }),
      // Upload Assets -> zenkar-assets
      this.storage.upload('zenkar-assets', keyOptimized, optimizedBuffer, {
        'Content-Type': 'image/webp',
      }),
      this.storage.upload('zenkar-assets', keyThumbnail, thumbnailBuffer, {
        'Content-Type': 'image/webp',
      }),
    ]);

    // Save to DB
    const image = await this.prisma.image.create({
      data: {
        keyRaw,
        keyOptimized,
        keyThumbnail,
        productId: relation.productId,
        orderItemId: relation.orderItemId,
      },
    });

    return this.transformImage(image);
  }

  // Transform DB Record -> Full URLs
  transformImage(image: any): ImageResponse {
    return {
      id: image.id,
      rawUrl: this.storage.getPublicUrl('zenkar-raw', image.keyRaw),
      optimizedUrl: this.storage.getPublicUrl('zenkar-assets', image.keyOptimized),
      thumbnailUrl: this.storage.getPublicUrl('zenkar-assets', image.keyThumbnail),
    };
  }
}
