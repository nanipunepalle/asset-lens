import * as vscode from 'vscode';
import { analyze, GroupingStrategy } from '@asset-lens/core';
import { VscodeImageSource } from './vscodeImageSource.js';
import { SharpHasher } from './sharpHasher.js';
import { ResultsViewProvider } from './resultsView.js';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ResultsViewProvider();

    const treeView = vscode.window.createTreeView('asset-lens.resultsView', {
        treeDataProvider: provider,
        showCollapseAll: true,
    });

    const source = new VscodeImageSource();
    const hasher = new SharpHasher();

    const disposable = vscode.commands.registerCommand('asset-lens.findSimilarImages', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Asset Lens: No workspace folder open.');
            return;
        }

        provider.clear();

        const config = vscode.workspace.getConfiguration('asset-lens');
        const strategy = config.get<GroupingStrategy>('groupingStrategy', 'union-find');
        const threshold = config.get<number>('similarityThreshold', 10);

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Asset Lens',
                cancellable: false,
            },
            async progress => {
                const { groups, imageCount } = await analyze(
                    { source, hasher, progress: { report: message => progress.report({ message }) } },
                    { strategy, threshold }
                );

                if (imageCount === 0) {
                    vscode.window.showInformationMessage('Asset Lens: No images found in workspace.');
                    return;
                }

                if (groups.length === 0) {
                    vscode.window.showInformationMessage('Asset Lens: No similar images found.');
                    return;
                }

                provider.refresh(groups);
                await treeView.reveal(undefined as any, { focus: true });
                vscode.window.showInformationMessage(
                    `Asset Lens: Found ${groups.length} group(s) of similar images.`
                );
            }
        );
    });

    context.subscriptions.push(disposable, treeView);
}

export function deactivate() {}
