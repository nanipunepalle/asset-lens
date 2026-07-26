/**
 * Shared data types and the platform-provided capability interfaces that make
 * Asset Lens portable. A platform adapter (VS Code, Visual Studio, ...) supplies
 * an {@link ImageSource} and an {@link ImageHasher}; everything else is computed
 * by the core.
 */

export type GroupingStrategy = 'anchor' | 'union-find';

/** A single image and its 64-bit perceptual (average) hash. */
export interface ImageHash {
    path: string;
    hash: bigint;
}

/** A cluster of images considered similar, with the worst pairwise distance in the cluster. */
export interface SimilarityGroup {
    images: string[];
    hammingDistance: number;
}

/** Discovers candidate image files in the current project/workspace. */
export interface ImageSource {
    findImages(): Promise<string[]>;
}

/** Turns one image file into a 64-bit average hash. */
export interface ImageHasher {
    hash(filePath: string): Promise<bigint>;
}

/** Optional UI progress channel; a no-op if the platform doesn't provide one. */
export interface ProgressReporter {
    report(message: string): void;
}

/** Tunables for a single analysis run. */
export interface AnalyzeOptions {
    strategy?: GroupingStrategy;
    threshold?: number;
}

/** Result of {@link analyze}. */
export interface AnalyzeResult {
    groups: SimilarityGroup[];
    imageCount: number;
}
