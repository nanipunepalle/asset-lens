import * as assert from 'assert';
import { ImageHash } from '../types.js';
import {
    findGroups,
    findSimilarGroups,
    findSimilarGroupsUnionFind,
} from '../similarityChecker.js';

function img(
    path: string,
    hash: bigint,
    aspectRatio?: number,
    averageColor?: { r: number; g: number; b: number }
): ImageHash {
    return { path, hash, aspectRatio, averageColor };
}

/** Build a hash that differs from `base` in exactly `bits` low-order bits. */
function differByBits(base: bigint, bits: number): bigint {
    let mask = 0n;
    for (let i = 0; i < bits; i++) {
        mask |= 1n << BigInt(i);
    }
    return base ^ mask;
}

for (const [name, group] of [
    ['anchor', findSimilarGroups],
    ['union-find', findSimilarGroupsUnionFind],
] as const) {
    describe(`findGroups (${name})`, () => {
        it('groups identical hashes with distance 0', () => {
            const groups = group([img('a', 5n), img('b', 5n)], 10);
            assert.strictEqual(groups.length, 1);
            assert.strictEqual(groups[0].images.length, 2);
            assert.strictEqual(groups[0].hammingDistance, 0);
        });

        it('does not group hashes above the threshold', () => {
            const groups = group([img('a', 0n), img('b', differByBits(0n, 40))], 10);
            assert.strictEqual(groups.length, 0);
        });

        it('groups hashes exactly at the threshold', () => {
            const groups = group([img('a', 0n), img('b', differByBits(0n, 10))], 10);
            assert.strictEqual(groups.length, 1);
            assert.strictEqual(groups[0].hammingDistance, 10);
        });

        it('does not group one bit over the threshold', () => {
            const groups = group([img('a', 0n), img('b', differByBits(0n, 11))], 10);
            assert.strictEqual(groups.length, 0);
        });

        it('returns no groups for a single image', () => {
            assert.strictEqual(group([img('a', 1n)], 10).length, 0);
        });

        it('returns no groups for empty input', () => {
            assert.strictEqual(group([], 10).length, 0);
        });

        it('detects multiple distinct clusters', () => {
            const groups = group(
                [
                    img('a1', 0n),
                    img('a2', differByBits(0n, 1)),
                    img('b1', differByBits(0n, 50)),
                    img('b2', differByBits(0n, 51)),
                ],
                5
            );
            assert.strictEqual(groups.length, 2);
        });

        it('places each image in at most one group', () => {
            const groups = group([img('a', 0n), img('b', 0n), img('c', 0n)], 10);
            const all = groups.flatMap(g => g.images);
            assert.strictEqual(new Set(all).size, all.length);
        });

        it('rejects matching hashes with incompatible aspect ratios', () => {
            const groups = group([
                img('square', 0n, 1, { r: 50, g: 50, b: 50 }),
                img('wide', 0n, 2, { r: 50, g: 50, b: 50 }),
            ]);
            assert.strictEqual(groups.length, 0);
        });

        it('allows aspect ratios within the configured tolerance', () => {
            const groups = group(
                [img('a', 0n, 1), img('b', 0n, 1.15)],
                10,
                { aspectRatioTolerance: 0.2 }
            );
            assert.strictEqual(groups.length, 1);
        });

        it('rejects matching hashes with substantially different colors', () => {
            const groups = group([
                img('red', 0n, 1, { r: 255, g: 0, b: 0 }),
                img('blue', 0n, 1, { r: 0, g: 0, b: 255 }),
            ]);
            assert.strictEqual(groups.length, 0);
        });

        it('allows colors within the configured distance', () => {
            const groups = group(
                [
                    img('dark', 0n, 1, { r: 20, g: 20, b: 20 }),
                    img('lighter', 0n, 1, { r: 70, g: 70, b: 70 }),
                ],
                10,
                { colorDistanceThreshold: 50 }
            );
            assert.strictEqual(groups.length, 1);
        });
    });
}

describe('union-find transitive chains', () => {
    it('groups A~B~C into one group even when A and C exceed the threshold', () => {
        // A=0, B differs by 6 bits, C differs by 12 bits from A but 6 from B.
        const a = 0n;
        const b = differByBits(a, 6);
        // Flip 6 higher bits so C is 6 from B but 12 from A.
        let highMask = 0n;
        for (let i = 6; i < 12; i++) {
            highMask |= 1n << BigInt(i);
        }
        const c = b ^ highMask;

        const chain = [img('A', a), img('B', b), img('C', c)];
        const unionGroups = findSimilarGroupsUnionFind(chain, 8);
        assert.strictEqual(unionGroups.length, 1);
        assert.strictEqual(unionGroups[0].images.length, 3);
    });
});

describe('findGroups dispatch', () => {
    it('routes to union-find by default', () => {
        const groups = findGroups([img('a', 0n), img('b', 0n)]);
        assert.strictEqual(groups.length, 1);
    });

    it('routes to the anchor strategy when requested', () => {
        const groups = findGroups([img('a', 0n), img('b', 0n)], 'anchor');
        assert.strictEqual(groups.length, 1);
    });
});
