import * as assert from 'assert';
import { averageHashFromPixels, PIXEL_COUNT } from '../averageHash.js';

function filled(value: number): number[] {
    return new Array(PIXEL_COUNT).fill(value);
}

describe('averageHashFromPixels', () => {
    it('returns a bigint', () => {
        const hash = averageHashFromPixels(filled(0));
        assert.strictEqual(typeof hash, 'bigint');
    });

    it('produces the same hash for identical pixel buffers', () => {
        const pixels = filled(0).map((_, i) => (i % 3) * 90);
        assert.strictEqual(averageHashFromPixels(pixels), averageHashFromPixels([...pixels]));
    });

    it('produces different hashes for visually different buffers', () => {
        const gradientA = filled(0).map((_, i) => (i < PIXEL_COUNT / 2 ? 0 : 255));
        const gradientB = filled(0).map((_, i) => (i % 2 === 0 ? 0 : 255));
        assert.notStrictEqual(averageHashFromPixels(gradientA), averageHashFromPixels(gradientB));
    });

    it('distinguishes solid black from solid white (zero-variance edge case)', () => {
        const black = averageHashFromPixels(filled(0));
        const white = averageHashFromPixels(filled(255));
        assert.notStrictEqual(black, white);
        assert.strictEqual(black, 0n); // brightness 0 → 0 bits set
    });

    it('throws when given too few pixels', () => {
        assert.throws(() => averageHashFromPixels(filled(0).slice(0, 10)));
    });
});
