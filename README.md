# Asset Lens

Find visually similar and duplicate images in your workspace using perceptual hashing.

This repository is a monorepo split into a **platform-agnostic core** and thin **per-editor
adapters**, so the algorithm is written once and reused across editors.

```
packages/
├── core/     @asset-lens/core — pure, dependency-free algorithm (hashing, Hamming, grouping)
└── vscode/   asset-lens        — the VS Code extension (adapter over the core)
```

## How the pieces fit

The core exposes an `analyze()` orchestrator plus two interfaces a platform must implement:

| Interface     | Responsibility                                  | VS Code implementation           |
|---------------|-------------------------------------------------|----------------------------------|
| `ImageSource` | discover image files in the project             | `workspace.findFiles` glob       |
| `ImageHasher` | turn one image into a 64-bit perceptual hash    | `sharp` → `averageHashFromPixels`|

To add a new editor (e.g. Visual Studio) later: implement `ImageSource` + `ImageHasher`, render the
returned `SimilarityGroup[]`, and call `analyze()`. The core never changes.

## Develop

```bash
npm install        # links the workspaces
npm run compile    # builds core, then the vscode extension
npm run lint
npm test
```

Then open `packages/vscode` in VS Code and press <kbd>F5</kbd> to launch the extension host.
