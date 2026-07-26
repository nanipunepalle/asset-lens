import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { SharpHasher } from '../sharpHasher.js';

const TMP = os.tmpdir();

function tmpPath(name: string): string {
    return path.join(TMP, `asset-lens-test-${name}`);
}

async function createSolidImage(
    filePath: string,
    r: number,
    g: number,
    b: number,
    width = 32,
    height = 32
): Promise<void> {
    const pixels = Buffer.alloc(width * height * 3);
    for (let i = 0; i < pixels.length; i += 3) {
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
    }
    await sharp(pixels, { raw: { width, height, channels: 3 } })
        .png()
        .toFile(filePath);
}

suite('SharpHasher', () => {
    const hasher = new SharpHasher();
    const files: string[] = [];

    function track(filePath: string): string {
        files.push(filePath);
        return filePath;
    }

    suiteTeardown(() => {
        for (const f of files) {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
            }
        }
    });

    test('returns a bigint hash', async () => {
        const file = track(tmpPath('bigint.png'));
        await createSolidImage(file, 255, 0, 0);

        assert.strictEqual(typeof (await hasher.hash(file)), 'bigint');
    });

    test('identical images produce the same hash', async () => {
        const file1 = track(tmpPath('same1.png'));
        const file2 = track(tmpPath('same2.png'));
        await createSolidImage(file1, 100, 100, 100);
        await createSolidImage(file2, 100, 100, 100);

        assert.strictEqual(await hasher.hash(file1), await hasher.hash(file2));
    });

    test('visually different images produce different hashes', async () => {
        const file1 = track(tmpPath('diff1.png'));
        const file2 = track(tmpPath('diff2.png'));
        await createSolidImage(file1, 255, 255, 255); // white
        await createSolidImage(file2, 0, 0, 0);       // black

        assert.notStrictEqual(await hasher.hash(file1), await hasher.hash(file2));
    });

    test('rejects on a missing/corrupt file (so analyze() can skip it)', async () => {
        await assert.rejects(hasher.hash(tmpPath('missing.png')));
    });
});
