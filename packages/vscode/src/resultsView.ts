import * as vscode from 'vscode';
import * as path from 'path';
import { SimilarityGroup } from '@asset-lens/core';

type TreeNode = GroupNode | ImageNode;

class GroupNode extends vscode.TreeItem {
    constructor(
        public readonly group: SimilarityGroup,
        public readonly index: number
    ) {
        super(
            `Group ${index + 1} — ${group.images.length} images (distance: ${group.hammingDistance})`,
            vscode.TreeItemCollapsibleState.Expanded
        );
        this.contextValue = 'group';
        this.iconPath = new vscode.ThemeIcon('files');
    }
}

class ImageNode extends vscode.TreeItem {
    constructor(public readonly imagePath: string) {
        super(path.basename(imagePath), vscode.TreeItemCollapsibleState.None);
        this.resourceUri = vscode.Uri.file(imagePath);
        this.tooltip = imagePath;
        this.contextValue = 'image';
        this.command = {
            command: 'vscode.open',
            title: 'Open Image',
            arguments: [vscode.Uri.file(imagePath)],
        };
        this.iconPath = new vscode.ThemeIcon('file-media');
    }
}

export class ResultsViewProvider implements vscode.TreeDataProvider<TreeNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private groups: SimilarityGroup[] = [];

    refresh(groups: SimilarityGroup[]): void {
        this.groups = groups;
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        this.groups = [];
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeNode): TreeNode[] {
        if (!element) {
            if (this.groups.length === 0) {
                return [];
            }
            return this.groups.map((group, i) => new GroupNode(group, i));
        }

        if (element instanceof GroupNode) {
            return element.group.images.map(p => new ImageNode(p));
        }

        return [];
    }
}
