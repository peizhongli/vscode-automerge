import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

// 导入我们的扩展模块进行测试
import { activate } from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should activate successfully', async () => {
		// 创建模拟的扩展上下文
		const mockContext: vscode.ExtensionContext = {
			subscriptions: [],
			workspaceState: {} as any,
			globalState: {} as any,
			extensionUri: vscode.Uri.file(path.join(__dirname, '../..')),
			extensionPath: path.join(__dirname, '../..'),
			asAbsolutePath: (relativePath: string) => path.join(__dirname, '../..', relativePath),
			storageUri: undefined,
			storagePath: undefined,
			globalStorageUri: vscode.Uri.file(path.join(__dirname, '../..', 'globalStorage')),
			globalStoragePath: path.join(__dirname, '../..', 'globalStorage'),
			logUri: vscode.Uri.file(path.join(__dirname, '../..', 'logs')),
			logPath: path.join(__dirname, '../..', 'logs'),
			extensionMode: vscode.ExtensionMode.Test,
			environmentVariableCollection: {} as any,
			secrets: {} as any,
			languageModelAccessInformation: {} as any,
			extension: {} as any
		};

		// 测试扩展激活
		try {
			activate(mockContext);
			assert.ok(mockContext.subscriptions.length > 0, '扩展应该注册至少一个命令');
			assert.strictEqual(mockContext.subscriptions.length, 2, '扩展应该注册2个命令');
		} catch (error) {
			assert.fail(`扩展激活失败: ${error}`);
		}
	});

	test('Commands should be registered', async () => {
		// 获取所有已注册的命令
		const commands = await vscode.commands.getCommands(true);

		// 验证我们的命令是否已注册
		assert.ok(commands.includes('extension.helloWorld'), 'Hello World命令应该被注册');
		assert.ok(commands.includes('extension.createJsxComponent'), 'JSX组件创建命令应该被注册');
	});

	test('Hello World command should work', async () => {
		const originalShowInputBox = vscode.window.showInputBox;
		const originalShowInformationMessage = vscode.window.showInformationMessage;

		let inputBoxCalled = false;
		let infoMessageCalled = false;
		let receivedMessage = '';

		vscode.window.showInputBox = async () => {
			inputBoxCalled = true;
			return 'TestComponent';
		};

		vscode.window.showInformationMessage = async (message: string) => {
			infoMessageCalled = true;
			receivedMessage = message;
			return undefined;
		};

		try {
			await vscode.commands.executeCommand('extension.helloWorld');

			assert.ok(inputBoxCalled, '应该调用输入框');
			assert.ok(infoMessageCalled, '应该显示信息消息');
			assert.ok(receivedMessage.includes('TestComponent'), '消息应该包含组件名');
			assert.ok(receivedMessage.includes('Hello World'), '消息应该包含Hello World');

		} finally {
			vscode.window.showInputBox = originalShowInputBox;
			vscode.window.showInformationMessage = originalShowInformationMessage;
		}
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
