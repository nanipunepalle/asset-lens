/**
 * Pure perceptual-hash (average hash / aHash) computation.
 *
 * This module deliberately has NO image-decoding dependency. A platform adapter
 * is responsible for decoding an image down to {@link HASH_SIZE}×{@link HASH_SIZE}
 * grayscale pixels (row-major, one byte per pixel) and passing that buffer here.
 */

export const HASH_SIZE = 8; // 8x8 = 64 bits
export const PIXEL_COUNT = HASH_SIZE * HASH_SIZE;

/**
 * Compute a 64-bit average hash from a buffer of grayscale pixel values.
 *
 * Each bit is set when its pixel is >= the mean brightness. Solid-color images
 * (zero variance) carry no gradient to hash, so their brightness is encoded as a
 * bit count (popcount) instead, keeping distinct flat colors distinguishable.
 *
 * @param pixels Row-major grayscale bytes (0–255). Must contain {@link PIXEL_COUNT} values.
 */
export function averageHashFromPixels(pixels: Uint8Array | number[]): bigint {
    if (pixels.length < PIXEL_COUNT) {
        throw new Error(
            `averageHashFromPixels expected ${PIXEL_COUNT} pixels but received ${pixels.length}`
        );
    }

    let sum = 0;
    for (let i = 0; i < PIXEL_COUNT; i++) {
        sum += pixels[i];
    }
    const mean = sum / PIXEL_COUNT;

    let variance = 0;
    for (let i = 0; i < PIXEL_COUNT; i++) {
        variance += (pixels[i] - mean) ** 2;
    }
    variance /= PIXEL_COUNT;

    // Solid-color image: no variation to hash, encode brightness as bit count instead.
    if (variance === 0) {
        const level = Math.round((mean / 255) * PIXEL_COUNT);
        let hash = 0n;
        for (let i = 0; i < level; i++) {
            hash |= 1n << BigInt(i);
        }
        return hash;
    }

    let hash = 0n;
    for (let i = 0; i < PIXEL_COUNT; i++) {
        if (pixels[i] >= mean) {
            hash |= 1n << BigInt(i);
        }
    }
    return hash;
}
