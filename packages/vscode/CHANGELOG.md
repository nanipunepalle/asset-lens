# Changelog

All notable changes to the Asset Lens extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-08-02

### Added

- `Asset Lens: Find Similar Images` command that scans the open workspace for
  visually similar and duplicate images.
- Activity-bar view listing each group of similar images with its worst
  pairwise Hamming distance; clicking an entry opens that image.
- 64-bit average-hash (aHash) perceptual hashing via `sharp`, with a
  brightness-based fallback so solid-colour images stay distinguishable.
- `asset-lens.groupingStrategy` setting — `union-find` (default, groups
  transitive chains) or `anchor`.
- `asset-lens.similarityThreshold` setting — maximum Hamming distance (0–64)
  for two images to count as similar. Default `10`.
- Discovery spans multi-root workspaces and skips `node_modules`, `out`, and
  `.git`.

[Unreleased]: https://github.com/nanipunepalle/asset-lens/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/nanipunepalle/asset-lens/releases/tag/v0.0.1
