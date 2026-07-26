import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension', () => {

    test('extension is registered and activates', async () => {
        const ext = vscode.extensions.getExtension('lalith.asset-lens');
        assert.ok(ext, 'Extension should be registered');
        await ext!.activate();
        assert.ok(ext!.isActive, 'Extension should be active');
    });

    test('command asset-lens.findSimilarImages is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes('asset-lens.findSimilarImages'),
            'Command should be registered'
        );
    });
});
