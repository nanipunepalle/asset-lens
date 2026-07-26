import * as vscode from 'vscode';
import * as path from 'path';
import { ImageSource } from '@asset-lens/core';

const IMAGE_GLOB = '**/*.{png,jpg,jpeg,svg}';
const EXCLUDE_GLOB = '{**/node_modules/**,**/out/**,**/.git/**}';

/**
 * Discovers workspace images via VS Code's file index (respects .gitignore and
 * multi-root workspaces). Implements the core {@link ImageSource} interface.
 */
export class VscodeImageSource implements ImageSource {
    async findImages(): Promise<string[]> {
        const uris = await vscode.workspace.findFiles(IMAGE_GLOB, EXCLUDE_GLOB);
        return uris
            .map(uri => uri.fsPath)
            .filter(fsPath => path.isAbsolute(fsPath));
    }
}
