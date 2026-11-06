import { describe, it, expect } from 'vitest';
import { compressImageForUpload } from './imageCompressor';

describe('imageCompressor', () => {
  it('returns original file if file is not an image', async () => {
    const textFile = new File(['hello text'], 'test.txt', { type: 'text/plain' });
    const result = await compressImageForUpload(textFile);
    expect(result).toBe(textFile);
  });

  it('returns original file if image is already small (<= 1MB)', async () => {
    const smallContent = new Uint8Array(500 * 1024); // 500 KB
    const smallFile = new File([smallContent], 'small.jpg', { type: 'image/jpeg' });
    const result = await compressImageForUpload(smallFile);
    expect(result).toBe(smallFile);
  });
});

