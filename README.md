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

## Package and test a real .vsix locally

`packages/vscode` depends on `@asset-lens/core` as a workspace symlink, and `sharp` ships a
different native binary per platform — so the extension can't just be `vsce package`d in place
without leaking the whole monorepo into the `.vsix`. `scripts/stage-vsix.mjs` builds it in an
isolated temp directory instead:

```bash
npm run compile
node scripts/stage-vsix.mjs <target> dist
code --install-extension dist/asset-lens-<target>.vsix --force
```

`<target>` must match the machine you're running this on — it's a label written into the `.vsix`,
not something the script cross-compiles for:

| Your machine           | target        |
|-------------------------|---------------|
| macOS, Apple Silicon    | `darwin-arm64`|
| macOS, Intel            | `darwin-x64`  |
| Windows, x64            | `win32-x64`   |
| Linux, x64              | `linux-x64`   |
| Linux, arm64            | `linux-arm64` |

Then in VS Code, open a folder with some images and run **Asset Lens: Find Similar Images** to
confirm it works. Uninstall with `code --uninstall-extension lalith.asset-lens` when done.

CI builds and uploads all five targets as workflow artifacts on every push — see
`.github/workflows/ci.yml`.
