import {
    AnalyzeOptions,
    AnalyzeResult,
    ImageHash,
    ImageHasher,
    ImageSource,
    ProgressReporter,
} from './types.js';
import { findGroups } from './similarityChecker.js';

/** Platform-provided capabilities the analyzer orchestrates. */
export interface AnalyzerDeps {
    source: ImageSource;
    hasher: ImageHasher;
    progress?: ProgressReporter;
}

/**
 * The end-to-end pipeline, independent of any editor:
 *   discover → hash (skipping unreadable files) → group by similarity.
 *
 * Adapters wire in their own {@link ImageSource}/{@link ImageHasher} and render
 * the returned {@link SimilarityGroup}s however their UI dictates.
 */
export async function analyze(
    deps: AnalyzerDeps,
    options: AnalyzeOptions = {}
): Promise<AnalyzeResult> {
    const { source, hasher, progress } = deps;

    progress?.report('Scanning for images...');
    const paths = await source.findImages();
    if (paths.length === 0) {
        return { groups: [], imageCount: 0 };
    }

    progress?.report(`Hashing ${paths.length} images...`);
    const hashes: ImageHash[] = [];
    for (const filePath of paths) {
        try {
            if (hasher.fingerprint) {
                hashes.push({ path: filePath, ...await hasher.fingerprint(filePath) });
            } else {
                hashes.push({ path: filePath, hash: await hasher.hash(filePath) });
            }
        } catch (err) {
            // Skip files that can't be processed (corrupt, unsupported format, etc.)
            console.warn(`Asset Lens: skipping ${filePath} — ${(err as Error).message}`);
        }
    }

    const strategy = options.strategy ?? 'union-find';
    const threshold = options.threshold ?? 10;

    progress?.report(`Comparing images (${strategy})...`);
    const groups = findGroups(hashes, strategy, threshold, {
        aspectRatioTolerance: options.aspectRatioTolerance,
        colorDistanceThreshold: options.colorDistanceThreshold,
    });

    return { groups, imageCount: paths.length };
}
