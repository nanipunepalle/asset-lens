/**
 * Number of differing bits between two hashes (0–64). Lower means more similar.
 */
export function hammingDistance(a: bigint, b: bigint): number {
    let diff = a ^ b;
    let distance = 0;
    while (diff > 0n) {
        distance += Number(diff & 1n);
        diff >>= 1n;
    }
    return distance;
}
