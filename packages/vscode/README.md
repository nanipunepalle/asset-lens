# Asset Lens

Find visually similar and duplicate images in your workspace.

Asset Lens hashes every image in your project with a perceptual hash (average
hash), then groups images whose hashes are close together. Unlike a checksum,
this catches images that *look* the same without being byte-identical —
re-exports, resized copies, recompressed JPEGs, and near-duplicate assets that
accumulate in a `assets/` or `public/` folder over time.

## Usage

1. Open the **Asset Lens** view in the activity bar.
2. Click the search icon in the view title, or run **Asset Lens: Find Similar
   Images** from the command palette.

Results appear grouped, with the worst pairwise distance shown per group:

```
Group 1 — 3 images (distance: 2)
  logo.png
  logo-copy.png
  logo@2x.png
Group 2 — 2 images (distance: 7)
  hero-banner.jpg
  hero-banner-old.jpg
```

Click any image to open it.

## Settings

| Setting | Default | Description |
|---|---|---|
| `asset-lens.similarityThreshold` | `10` | Maximum Hamming distance (0–64) between two hashes for the images to count as similar. Lower is stricter — `0` means the hashes are identical. |
| `asset-lens.groupingStrategy` | `union-find` | `union-find` groups transitive chains (if A~B and B~C, all three land in one group). `anchor` compares every image only against the first member of a group, so it may split chains. |

### Choosing a threshold

The hash is 64 bits, so distance ranges from 0 (identical hashes) to 64.

- **0–4** — near-exact duplicates: re-encodes, format conversions, minor
  recompression.
- **5–10** — visually similar: resizes, small crops, light edits. This is the
  default range and the useful one for most asset cleanup.
- **10+** — loosely similar. Expect false positives, particularly among images
  that are mostly one flat colour.

## Supported formats

`.png`, `.jpg`, `.jpeg`, and `.svg`. Files under `node_modules`, `out`, and
`.git` are skipped. Images that fail to decode are skipped rather than aborting
the scan.

## Known limitations

- Comparison is O(n²) in the number of images, and runs on the extension host.
  Large asset directories (several thousand images) will take a noticeable
  amount of time, and the scan cannot currently be cancelled once started.
- Average hash is sensitive to rotation and heavy cropping — a rotated copy of
  an image will generally *not* be grouped with the original.
- Images that are a single flat colour are compared by brightness alone, so
  distinct flat colours of similar lightness may group together.

## Contributing

The extension is the VS Code adapter over a platform-agnostic core
(`@asset-lens/core`) that holds the hashing and grouping logic. See the
[repository README](https://github.com/nanipunepalle/asset-lens#readme) for the
architecture and development setup.

## License

[MIT](LICENSE)
