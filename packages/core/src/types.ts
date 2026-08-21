/**
 * Shared data types and the platform-provided capability interfaces that make
 * Asset Lens portable. A platform adapter (VS Code, Visual Studio, ...) supplies
 * an {@link ImageSource} and an {@link ImageHasher}; everything else is computed
 * by the core.
 */

export type GroupingStrategy = 'anchor' | 'union-find';

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/** Additional visual signals produced alongside the perceptual hash. */
export interface ImageFingerprint {
    hash: bigint;
    aspectRatio: number;
    averageColor: RgbColor;
}

/** A single image and its 64-bit perceptual (average) hash. */
export interface ImageHash {
    path: string;
    hash: bigint;
    /** Optional for compatibility with hash-only platform adapters. */
    aspectRatio?: number;
    /** Optional for compatibility with hash-only platform adapters. */
    averageColor?: RgbColor;
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
    /** Decode all visual signals in one pass when supported by the adapter. */
    fingerprint?(filePath: string): Promise<ImageFingerprint>;
}

/** Optional UI progress channel; a no-op if the platform doesn't provide one. */
export interface ProgressReporter {
    report(message: string): void;
}

/** Tunables for a single analysis run. */
export interface AnalyzeOptions {
    strategy?: GroupingStrategy;
    threshold?: number;
    /** Maximum relative aspect-ratio difference, where 0.1 means 10%. */
    aspectRatioTolerance?: number;
    /** Maximum root-mean-square RGB channel difference (0-255). */
    colorDistanceThreshold?: number;
}

export interface VisualComparisonOptions {
    aspectRatioTolerance?: number;
    colorDistanceThreshold?: number;
}

/** Result of {@link analyze}. */
export interface AnalyzeResult {
    groups: SimilarityGroup[];
    imageCount: number;
}
