import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

describe('UploadsService', () => {
  let service: UploadsService;
  const testUploadsDir = path.join(__dirname, '../../test-uploads');

  beforeAll(() => {
    process.env.UPLOADS_DIR = testUploadsDir;
  });

  afterAll(() => {
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
    delete process.env.UPLOADS_DIR;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadsService],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should downsize large images to around 0.5-1.0 MB and generate opt and thumb files', async () => {
    // Generate a 4000x3000 test image (simulating a 12MP phone camera photo)
    const width = 4000;
    const height = 3000;
    const rawBuffer = Buffer.alloc(width * height * 3);
    for (let i = 0; i < rawBuffer.length; i++) {
      rawBuffer[i] = (i * 37 + (i % 255)) % 256;
    }

    const originalJpeg = await sharp(rawBuffer, { raw: { width, height, channels: 3 } })
      .jpeg({ quality: 95 })
      .toBuffer();

    expect(originalJpeg.length).toBeGreaterThan(5 * 1024 * 1024); // > 5 MB

    const mockFile = {
      buffer: originalJpeg,
      originalname: 'phone_camera_photo.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const result = await service.processAndSaveImage(mockFile);

    expect(result).toHaveProperty('keyRaw');
    expect(result).toHaveProperty('keyOptimized');
    expect(result).toHaveProperty('keyThumbnail');

    const rawFilename = result.keyRaw.replace('/api/uploads/', '');
    const optFilename = result.keyOptimized.replace('/api/uploads/', '');
    const thumbFilename = result.keyThumbnail.replace('/api/uploads/', '');

    const rawPath = path.join(testUploadsDir, rawFilename);
    const optPath = path.join(testUploadsDir, optFilename);
    const thumbPath = path.join(testUploadsDir, thumbFilename);

    expect(fs.existsSync(rawPath)).toBe(true);
    expect(fs.existsSync(optPath)).toBe(true);
    expect(fs.existsSync(thumbPath)).toBe(true);

    const rawStats = fs.statSync(rawPath);
    const optStats = fs.statSync(optPath);
    const thumbStats = fs.statSync(thumbPath);

    // Downsized master image must be bounded around 0.5 to 1.0 MB (less than 1.2 MB max, much smaller than original 8MB)
    expect(rawStats.size).toBeLessThan(1.2 * 1024 * 1024);
    // Optimized image should be lightweight (~100-250 KB)
    expect(optStats.size).toBeLessThan(400 * 1024);
    // Thumbnail should be tiny (< 40 KB)
    expect(thumbStats.size).toBeLessThan(40 * 1024);

    // Verify master image resolution is bounded to max 2048px
    const rawMeta = await sharp(rawPath).metadata();
    expect(rawMeta.width).toBeLessThanOrEqual(2048);
    expect(rawMeta.height).toBeLessThanOrEqual(2048);

    // Clean up using deleteImageFiles
    await service.deleteImageFiles({
      keyRaw: result.keyRaw,
      keyOptimized: result.keyOptimized,
      keyThumbnail: result.keyThumbnail,
    });

    expect(fs.existsSync(rawPath)).toBe(false);
    expect(fs.existsSync(optPath)).toBe(false);
    expect(fs.existsSync(thumbPath)).toBe(false);
  });
});

