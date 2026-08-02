#!/usr/bin/env node
// vsce's file collector walks up past packages/vscode into the monorepo root
// (its .git, root package-lock.json, CI config, ...) because .vscodeignore can't
// exclude paths outside the extension's own directory. This builds the extension
// in an isolated temp dir with no parent .git, so there's nothing to leak.
//
// Usage: node scripts/stage-vsix.mjs <vsce-target> [outDir]
// Example: node scripts/stage-vsix.mjs darwin-arm64 ./dist

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const vscodePkgDir = join(repoRoot, 'packages/vscode');
const corePkgDir = join(repoRoot, 'packages/core');

function run(cmd, args, opts = {}) {
    console.log(`+ ${cmd} ${args.join(' ')}`);
    execFileSync(cmd, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32', // npm/npx are .cmd shims on Windows
        ...opts,
    });
}

function main() {
    const [target, outDirArg] = process.argv.slice(2);
    if (!target) {
        console.error('Usage: node scripts/stage-vsix.mjs <vsce-target> [outDir]');
        process.exit(1);
    }
    const outDir = resolve(repoRoot, outDirArg ?? 'dist');
    mkdirSync(outDir, { recursive: true });

    if (!existsSync(join(vscodePkgDir, 'out')) || !existsSync(join(corePkgDir, 'out'))) {
        console.error('Compiled output missing — run `npm run compile` first.');
        process.exit(1);
    }

    const stage = mkdtempSync(join(tmpdir(), 'asset-lens-vsix-'));
    console.log(`Staging in ${stage}`);

    // 1. @asset-lens/core is only a workspace symlink, not a real dependency.
    //    Pack it into a tarball so the stage can install a real copy.
    run('npm', ['pack', '--silent', '--pack-destination', stage], { cwd: corePkgDir });
    const tarball = readdirSync(stage).find(f => f.endsWith('.tgz'));
    if (!tarball) {
        throw new Error('npm pack did not produce a tarball for @asset-lens/core');
    }

    // 2. Copy the extension's runtime files: docs, compiled output, icons.
    for (const f of ['README.md', 'CHANGELOG.md', 'LICENSE']) {
        cpSync(join(vscodePkgDir, f), join(stage, f));
    }
    cpSync(join(vscodePkgDir, 'out'), join(stage, 'out'), { recursive: true });
    mkdirSync(join(stage, 'assets'), { recursive: true });
    cpSync(join(vscodePkgDir, 'assets/marketplace-icon.png'), join(stage, 'assets/marketplace-icon.png'));
    cpSync(join(vscodePkgDir, 'assets/icon.svg'), join(stage, 'assets/icon.svg'));

    // 3. Point @asset-lens/core at the local tarball. Drop devDependencies/scripts
    //    so `vsce package`'s vscode:prepublish hook can't try to run `tsc` here —
    //    it's not installed in this stage, and out/ is already compiled.
    const pkg = JSON.parse(readFileSync(join(vscodePkgDir, 'package.json'), 'utf8'));
    pkg.dependencies['@asset-lens/core'] = `file:./${tarball}`;
    delete pkg.devDependencies;
    delete pkg.scripts;
    writeFileSync(join(stage, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

    // 4. No parent workspace here, so this is a real install, not a symlink —
    //    sharp resolves its native binary for whatever platform runs this script.
    run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: stage });
    rmSync(join(stage, 'package-lock.json'), { force: true }); // install metadata, not needed in the VSIX
    rmSync(join(stage, tarball), { force: true }); // already unpacked into node_modules

    const vsixPath = join(outDir, `asset-lens-${target}.vsix`);
    run('npx', ['--yes', '@vscode/vsce', 'package', '--target', target, '--out', vsixPath], { cwd: stage });

    console.log(`\nBuilt ${vsixPath}`);
}

main();
