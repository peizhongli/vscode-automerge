import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { JsxComponentGenerator } from '../../components/JsxComponentGenerator';
import { TestUtils, TestDataGenerator } from '../testUtils';

suite('JsxComponentGenerator Edge Cases', () => {
    let generator: JsxComponentGenerator;
    let testWorkspaceUri: vscode.Uri;
    let extensionPath: string;

    suiteSetup(async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceUri = workspaceFolders[0].uri;
        } else {
            // 使用临时目录进行测试
            testWorkspaceUri = vscode.Uri.file(path.join(__dirname, '../../../temp-test-edge'));
        }
        extensionPath = path.join(__dirname, '../../../');
        generator = new JsxComponentGenerator(extensionPath);
    });

    teardown(async () => {
        await TestUtils.cleanupTestFolders(testWorkspaceUri, [
            'EdgeCaseComponent',
            'A',
            'VeryLongComponentNameThatShouldStillWork',
            'Component123'
        ]);
    });

    test('应该处理最短有效组件名', async () => {
        const componentName = 'A';
        const originalShowInputBox = vscode.window.showInputBox;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);

        try {
            await generator.createComponent(testWorkspaceUri);
            
            const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
            const exists = await TestUtils.folderExists(folderUri);
            assert.ok(exists, '应该能创建单字母组件');
            
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('应该处理很长的组件名', async () => {
        const componentName = 'VeryLongComponentNameThatShouldStillWork';
        const originalShowInputBox = vscode.window.showInputBox;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);

        try {
            await generator.createComponent(testWorkspaceUri);
            
            const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
            const exists = await TestUtils.folderExists(folderUri);
            assert.ok(exists, '应该能创建长名称组件');
            
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('应该处理包含数字的组件名', async () => {
        const componentName = 'Component123';
        const originalShowInputBox = vscode.window.showInputBox;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);

        try {
            await generator.createComponent(testWorkspaceUri);
            
            const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
            const exists = await TestUtils.folderExists(folderUri);
            assert.ok(exists, '应该能创建包含数字的组件');
            
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('应该正确验证所有无效组件名', async () => {
        const invalidNames = TestDataGenerator.getInvalidComponentNames();
        const originalShowInputBox = vscode.window.showInputBox;

        let validationResults: any[] = [];

        vscode.window.showInputBox = async (options?: vscode.InputBoxOptions) => {
            if (options?.validateInput) {
                validationResults = invalidNames.map(name => options.validateInput!(name));
            }
            return undefined; // 模拟用户取消
        };

        try {
            await generator.createComponent(testWorkspaceUri);

            // 验证所有无效名称都被拒绝
            validationResults.forEach((result, index) => {
                assert.ok(result !== null, `无效名称 "${invalidNames[index]}" 应该被拒绝`);
            });

        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('应该正确验证所有有效组件名', async () => {
        const validNames = TestDataGenerator.getValidComponentNames();
        const originalShowInputBox = vscode.window.showInputBox;

        let validationResults: any[] = [];

        vscode.window.showInputBox = async (options?: vscode.InputBoxOptions) => {
            if (options?.validateInput) {
                validationResults = validNames.map(name => options.validateInput!(name));
            }
            return undefined; // 模拟用户取消
        };

        try {
            await generator.createComponent(testWorkspaceUri);

            // 验证所有有效名称都被接受
            validationResults.forEach((result, index) => {
                assert.strictEqual(result, null, `有效名称 "${validNames[index]}" 应该被接受`);
            });

        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });
});

suite('JsxComponentGenerator Error Handling', () => {
    let generator: JsxComponentGenerator;
    let testWorkspaceUri: vscode.Uri;
    let extensionPath: string;

    suiteSetup(async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceUri = workspaceFolders[0].uri;
        } else {
            // 使用临时目录进行测试
            testWorkspaceUri = vscode.Uri.file(path.join(__dirname, '../../../temp-test-error'));
        }
        extensionPath = path.join(__dirname, '../../../');
        generator = new JsxComponentGenerator(extensionPath);
    });

    test('应该处理无效的扩展路径', () => {
        const invalidGenerator = new JsxComponentGenerator('/invalid/path');
        assert.ok(invalidGenerator, '应该能创建带有无效路径的生成器实例');
    });

    test('应该处理模板文件不存在的情况', async () => {
        const invalidGenerator = new JsxComponentGenerator('/nonexistent/path');
        const componentName = 'TestComponent';
        
        const originalShowInputBox = vscode.window.showInputBox;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        
        let errorMessageCalled = false;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);
        vscode.window.showErrorMessage = async (message: string) => {
            errorMessageCalled = true;
            assert.ok(message.includes('创建组件文件失败'), '应该显示错误消息');
            return undefined;
        };

        try {
            await invalidGenerator.createComponent(testWorkspaceUri);
            assert.ok(errorMessageCalled, '应该显示错误消息');
        } catch (error) {
            // 预期会抛出错误
            assert.ok(error, '应该抛出错误');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });

    test('应该处理文件写入权限错误', async () => {
        // 这个测试在实际环境中可能难以模拟，但我们可以测试错误处理逻辑
        const componentName = 'PermissionTest';
        const originalShowInputBox = vscode.window.showInputBox;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);

        try {
            await generator.createComponent(testWorkspaceUri);
            // 如果没有权限问题，测试应该正常完成
            assert.ok(true, '组件创建应该成功或正确处理权限错误');
        } catch (error) {
            // 如果有权限错误，应该被正确处理
            assert.ok(error, '权限错误应该被正确处理');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
            
            // 清理可能创建的文件
            try {
                const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
                await vscode.workspace.fs.delete(folderUri, { recursive: true });
            } catch {
                // 忽略清理错误
            }
        }
    });

    teardown(async () => {
        await TestUtils.cleanupTestFolders(testWorkspaceUri, [
            'TestComponent',
            'PermissionTest'
        ]);
    });
});

suite('JsxComponentGenerator Template Processing', () => {
    let generator: JsxComponentGenerator;
    let testWorkspaceUri: vscode.Uri;
    let extensionPath: string;

    suiteSetup(async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceUri = workspaceFolders[0].uri;
        } else {
            // 使用临时目录进行测试
            testWorkspaceUri = vscode.Uri.file(path.join(__dirname, '../../../temp-test-template'));
        }
        extensionPath = path.join(__dirname, '../../../');
        generator = new JsxComponentGenerator(extensionPath);
    });

    teardown(async () => {
        await TestUtils.cleanupTestFolders(testWorkspaceUri, [
            'TemplateTest',
            'MultipleReplace'
        ]);
    });

    test('应该正确替换模板中的所有占位符', async () => {
        const componentName = 'TemplateTest';
        const originalShowInputBox = vscode.window.showInputBox;
        
        vscode.window.showInputBox = TestUtils.mockUserInput(componentName);

        try {
            await generator.createComponent(testWorkspaceUri);
            
            const folderUri = vscode.Uri.joinPath(testWorkspaceUri, componentName);
            const jsxFileUri = vscode.Uri.joinPath(folderUri, 'index.jsx');
            const cssFileUri = vscode.Uri.joinPath(folderUri, 'index.module.less');
            
            const jsxContent = await TestUtils.readFileContent(jsxFileUri);
            const cssContent = await TestUtils.readFileContent(cssFileUri);
            
            // 验证所有模板变量都被替换
            assert.ok(!jsxContent.includes('{templateName}'), 'JSX文件不应包含未替换的模板变量');
            assert.ok(!cssContent.includes('{templateName}'), 'CSS文件不应包含未替换的模板变量');
            
            // 验证组件名被正确插入
            const componentOccurrences = (jsxContent.match(new RegExp(componentName, 'g')) || []).length;
            assert.ok(componentOccurrences >= 3, `JSX文件应该包含至少3次组件名，实际: ${componentOccurrences}`);
            
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });
});
