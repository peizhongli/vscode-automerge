import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { JsxComponentGenerator } from '../../components/JsxComponentGenerator';

suite('JsxComponentGenerator Test Suite', () => {
    let generator: JsxComponentGenerator;
    let testWorkspaceUri: vscode.Uri;
    let extensionPath: string;

    suiteSetup(async () => {
        // 获取测试工作区路径，如果没有则使用临时目录
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceUri = workspaceFolders[0].uri;
        } else {
            // 使用临时目录进行测试
            testWorkspaceUri = vscode.Uri.file(path.join(__dirname, '../../../temp-test'));
        }

        // 模拟扩展路径
        extensionPath = path.join(__dirname, '../../../');
        generator = new JsxComponentGenerator(extensionPath);
    });

    teardown(async () => {
        // 清理测试创建的文件夹
        try {
            const testFolders = ['TestComponent', 'AnotherComponent', 'ValidComponent'];
            for (const folder of testFolders) {
                const folderUri = vscode.Uri.joinPath(testWorkspaceUri, folder);
                try {
                    await vscode.workspace.fs.delete(folderUri, { recursive: true });
                } catch (error) {
                    // 忽略删除失败的错误
                }
            }
        } catch (error) {
            console.log('Cleanup error:', error);
        }
    });

    test('应该能够创建JSX组件生成器实例', () => {
        assert.ok(generator);
        assert.strictEqual(typeof generator.createComponent, 'function');
        assert.strictEqual(typeof generator.registerCommand, 'function');
    });

    test('应该能够注册VSCode命令', () => {
        const disposable = generator.registerCommand();
        assert.ok(disposable);
        assert.strictEqual(typeof disposable.dispose, 'function');
        disposable.dispose();
    });

    test('createComponent应该处理空组件名称', async () => {
        // 模拟用户取消输入
        const originalShowInputBox = vscode.window.showInputBox;
        vscode.window.showInputBox = async () => undefined;

        try {
            await generator.createComponent(testWorkspaceUri);
            // 如果没有抛出错误，说明正确处理了空输入
            assert.ok(true);
        } catch (error) {
            assert.fail(`Should handle empty component name gracefully: ${error}`);
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('createComponent应该处理无效组件名称', async () => {
        const originalShowInputBox = vscode.window.showInputBox;
        let validationCalled = false;

        vscode.window.showInputBox = async (options?: vscode.InputBoxOptions) => {
            if (options?.validateInput) {
                // 测试无效输入
                const result1 = options.validateInput('123invalid');
                assert.ok(result1, '应该拒绝以数字开头的组件名');
                
                const result2 = options.validateInput('invalid-name');
                assert.ok(result2, '应该拒绝包含特殊字符的组件名');
                
                const result3 = options.validateInput('');
                assert.ok(result3, '应该拒绝空组件名');
                
                const result4 = options.validateInput('ValidName');
                assert.strictEqual(result4, null, '应该接受有效的组件名');
                
                validationCalled = true;
            }
            return undefined; // 模拟用户取消
        };

        try {
            await generator.createComponent(testWorkspaceUri);
            assert.ok(validationCalled, '应该调用输入验证');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });
});

suite('JsxComponentGenerator Integration Tests', () => {
    let generator: JsxComponentGenerator;
    let testWorkspaceUri: vscode.Uri;
    let extensionPath: string;

    suiteSetup(async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceUri = workspaceFolders[0].uri;
        } else {
            // 使用临时目录进行测试
            testWorkspaceUri = vscode.Uri.file(path.join(__dirname, '../../../temp-test-integration'));
        }
        extensionPath = path.join(__dirname, '../../../');
        generator = new JsxComponentGenerator(extensionPath);
    });

    teardown(async () => {
        // 清理测试文件
        try {
            const testFolders = ['IntegrationTest', 'ExistingFolder'];
            for (const folder of testFolders) {
                const folderUri = vscode.Uri.joinPath(testWorkspaceUri, folder);
                try {
                    await vscode.workspace.fs.delete(folderUri, { recursive: true });
                } catch (error) {
                    // 忽略删除失败的错误
                }
            }
        } catch (error) {
            console.log('Integration test cleanup error:', error);
        }
    });

    test('应该能够创建完整的JSX组件结构', async () => {
        const componentName = 'IntegrationTest';
        const originalShowInputBox = vscode.window.showInputBox;
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        
        let infoMessageCalled = false;
        
        vscode.window.showInputBox = async () => componentName;
        vscode.window.showInformationMessage = async (message: string) => {
            infoMessageCalled = true;
            assert.ok(message.includes(componentName), '成功消息应该包含组件名');
            return undefined;
        };

        try {
            await generator.createComponent(testWorkspaceUri);
            
            // 验证文件夹是否创建
            const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
            const folderStat = await vscode.workspace.fs.stat(folderUri);
            assert.strictEqual(folderStat.type, vscode.FileType.Directory);
            
            // 验证JSX文件是否创建
            const jsxFileUri = vscode.Uri.joinPath(folderUri, 'index.jsx');
            const jsxFileStat = await vscode.workspace.fs.stat(jsxFileUri);
            assert.strictEqual(jsxFileStat.type, vscode.FileType.File);
            
            // 验证CSS文件是否创建
            const cssFileUri = vscode.Uri.joinPath(folderUri, 'index.module.less');
            const cssFileStat = await vscode.workspace.fs.stat(cssFileUri);
            assert.strictEqual(cssFileStat.type, vscode.FileType.File);
            
            // 验证文件内容
            const jsxContent = (await vscode.workspace.fs.readFile(jsxFileUri)).toString();
            assert.ok(jsxContent.includes(componentName), 'JSX文件应该包含组件名');
            
            const cssContent = (await vscode.workspace.fs.readFile(cssFileUri)).toString();
            assert.ok(cssContent.includes(componentName), 'CSS文件应该包含组件名');
            
            assert.ok(infoMessageCalled, '应该显示成功消息');
            
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
            vscode.window.showInformationMessage = originalShowInformationMessage;
        }
    });

    test('应该处理已存在的文件夹', async () => {
        const componentName = 'ExistingFolder';
        const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
        
        // 先创建文件夹
        await vscode.workspace.fs.createDirectory(folderUri);
        
        const originalShowInputBox = vscode.window.showInputBox;
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        
        let warningMessageCalled = false;
        
        vscode.window.showInputBox = async () => componentName;
        vscode.window.showWarningMessage = async (message: string) => {
            warningMessageCalled = true;
            assert.ok(message.includes('已存在'), '警告消息应该提示文件夹已存在');
            return undefined;
        };

        try {
            await generator.createComponent(testWorkspaceUri);
            assert.ok(warningMessageCalled, '应该显示警告消息');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
            vscode.window.showWarningMessage = originalShowWarningMessage;
        }
    });
});
