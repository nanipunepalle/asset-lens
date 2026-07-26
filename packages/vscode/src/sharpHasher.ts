import sharp from 'sharp';
import { HASH_SIZE, ImageHasher, averageHashFromPixels } from '@asset-lens/core';

/**
 * Decodes an image to {@link HASH_SIZE}×{@link HASH_SIZE} grayscale pixels with
 * `sharp`, then delegates the perceptual-hash bit-math to the core. Implements
 * the core {@link ImageHasher} interface.
 */
export class SharpHasher implements ImageHasher {
    async hash(filePath: string): Promise<bigint> {
        const pixels = await sharp(filePath)
            .resize(HASH_SIZE, HASH_SIZE, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        return averageHashFromPixels(pixels);
    }
}
