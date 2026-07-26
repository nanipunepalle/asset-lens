import { ImageHash, SimilarityGroup, GroupingStrategy } from './types.js';
import { hammingDistance } from './hammingDistance.js';

/**
 * Anchor strategy: each image is compared only against the anchor (first member)
 * of a candidate group. Simple O(n²) pass; may miss transitive chains
 * (A~B~C is grouped only when A~C is also within threshold).
 */
export function findSimilarGroups(
    hashes: ImageHash[],
    threshold: number = 10
): SimilarityGroup[] {
    const visited = new Set<number>();
    const groups: SimilarityGroup[] = [];

    for (let i = 0; i < hashes.length; i++) {
        if (visited.has(i)) {
            continue;
        }

        const group: string[] = [hashes[i].path];
        let minDistance = 0;

        for (let j = i + 1; j < hashes.length; j++) {
            if (visited.has(j)) {
                continue;
            }

            const distance = hammingDistance(hashes[i].hash, hashes[j].hash);
            if (distance <= threshold) {
                group.push(hashes[j].path);
                minDistance = Math.max(minDistance, distance);
                visited.add(j);
            }
        }

        if (group.length > 1) {
            visited.add(i);
            groups.push({ images: group, hammingDistance: minDistance });
        }
    }

    return groups;
}

// --- Union-Find implementation ---

class UnionFind {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]); // path compression
        }
        return this.parent[x];
    }

    union(x: number, y: number): void {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX === rootY) { return; }

        // union by rank — keep tree shallow
        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
    }
}

/**
 * Union-Find strategy (recommended): every similar pair is union()-ed, so
 * transitive chains (A~B and B~C) correctly land in a single group.
 */
export function findSimilarGroupsUnionFind(
    hashes: ImageHash[],
    threshold: number = 10
): SimilarityGroup[] {
    const uf = new UnionFind(hashes.length);
    const maxDistance = new Map<number, number>(); // root → max hamming distance in its group

    for (let i = 0; i < hashes.length; i++) {
        for (let j = i + 1; j < hashes.length; j++) {
            const distance = hammingDistance(hashes[i].hash, hashes[j].hash);
            if (distance <= threshold) {
                uf.union(i, j);
                const root = uf.find(i);
                maxDistance.set(root, Math.max(maxDistance.get(root) ?? 0, distance));
            }
        }
    }

    // Collect images by their root
    const groupMap = new Map<number, string[]>();
    for (let i = 0; i < hashes.length; i++) {
        const root = uf.find(i);
        if (!groupMap.has(root)) {
            groupMap.set(root, []);
        }
        groupMap.get(root)!.push(hashes[i].path);
    }

    const groups: SimilarityGroup[] = [];
    for (const [root, images] of groupMap) {
        if (images.length > 1) {
            groups.push({ images, hammingDistance: maxDistance.get(root) ?? 0 });
        }
    }

    return groups;
}

/** Group images by the requested strategy. */
export function findGroups(
    hashes: ImageHash[],
    strategy: GroupingStrategy = 'union-find',
    threshold: number = 10
): SimilarityGroup[] {
    return strategy === 'union-find'
        ? findSimilarGroupsUnionFind(hashes, threshold)
        : findSimilarGroups(hashes, threshold);
}
