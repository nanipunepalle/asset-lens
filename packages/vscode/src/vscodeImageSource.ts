import * as vscode from 'vscode';
import * as path from 'path';
import { ImageSource } from '@asset-lens/core';

const IMAGE_GLOB = '**/*.{png,jpg,jpeg,svg}';
const DEFAULT_EXCLUDE_GLOBS = ['**/node_modules/**', '**/out/**', '**/.git/**'];

/**
 * Discovers workspace images via VS Code's file index (respects .gitignore and
 * multi-root workspaces). Implements the core {@link ImageSource} interface.
 */
export class VscodeImageSource implements ImageSource {
    constructor(private readonly excludedFolders: readonly string[] = []) {}

    async findImages(): Promise<string[]> {
        const excludeGlob = [
            ...DEFAULT_EXCLUDE_GLOBS,
            ...this.excludedFolders.map(folder => `**/${folder.replace(/^[/\\]+|[/\\]+$/g, '')}/**`),
        ].join(',');
        const uris = await vscode.workspace.findFiles(IMAGE_GLOB, `{${excludeGlob}}`);
        return uris
            .map(uri => uri.fsPath)
            .filter(fsPath => path.isAbsolute(fsPath));
    }
}
