import sharp from 'sharp';
import {
    HASH_SIZE,
    ImageFingerprint,
    ImageHasher,
    averageHashFromPixels,
} from '@asset-lens/core';

/**
 * Decodes an image with `sharp` and extracts its perceptual hash, oriented
 * aspect ratio, and alpha-weighted average color. Implements the core
 * {@link ImageHasher} interface.
 */
export class SharpHasher implements ImageHasher {
    async hash(filePath: string): Promise<bigint> {
        return (await this.fingerprint(filePath)).hash;
    }

    async fingerprint(filePath: string): Promise<ImageFingerprint> {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const pixels = await image
            .clone()
            .autoOrient()
            .resize(HASH_SIZE, HASH_SIZE, { fit: 'fill' })
            .toColorspace('srgb')
            .ensureAlpha()
            .raw()
            .toBuffer();

        const grayscale = new Uint8Array(HASH_SIZE * HASH_SIZE);
        let red = 0;
        let green = 0;
        let blue = 0;
        let alphaTotal = 0;

        for (let i = 0; i < grayscale.length; i++) {
            const offset = i * 4;
            const alpha = pixels[offset + 3] / 255;
            const compositedRed = pixels[offset] * alpha + 255 * (1 - alpha);
            const compositedGreen = pixels[offset + 1] * alpha + 255 * (1 - alpha);
            const compositedBlue = pixels[offset + 2] * alpha + 255 * (1 - alpha);

            grayscale[i] = Math.round(
                0.2126 * compositedRed +
                0.7152 * compositedGreen +
                0.0722 * compositedBlue
            );
            red += pixels[offset] * alpha;
            green += pixels[offset + 1] * alpha;
            blue += pixels[offset + 2] * alpha;
            alphaTotal += alpha;
        }

        const colorDivisor = alphaTotal || grayscale.length;
        const { width, height } = metadata.autoOrient;
        return {
            hash: averageHashFromPixels(grayscale),
            aspectRatio: width / height,
            averageColor: alphaTotal === 0
                ? { r: 255, g: 255, b: 255 }
                : {
                    r: red / colorDivisor,
                    g: green / colorDivisor,
                    b: blue / colorDivisor,
                },
        };
    }
}
