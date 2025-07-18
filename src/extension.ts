import * as vscode from 'vscode';
import { JsxComponentGenerator } from './components/JsxComponentGenerator';

export function activate(context: vscode.ExtensionContext) {
    const extensionPath = context.extensionPath; // 获取插件的安装地址

    // Hello World 命令
    const helloWorldCommand = vscode.commands.registerCommand('extension.helloWorld', async () => {
        let componentName = await vscode.window.showInputBox({ placeHolder: '请输入组件名称' });
        if (componentName) {
            vscode.window.showInformationMessage(`${componentName} Hello World!`);
        }
    });

    // JSX组件生成器
    const jsxGenerator = new JsxComponentGenerator(extensionPath);
    const jsxComponentCommand = jsxGenerator.registerCommand();

    context.subscriptions.push(helloWorldCommand, jsxComponentCommand);
}