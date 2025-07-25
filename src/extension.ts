import * as vscode from 'vscode';
import { JsxComponentGenerator } from './components/JsxComponentGenerator';
import { GitBranchManager } from './components/GitBranchManager';

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

    // Git分支管理器
    const gitBranchManager = new GitBranchManager(context);
    const gitCommands = gitBranchManager.registerCommands();

    // 注册所有命令
    context.subscriptions.push(
        helloWorldCommand,
        jsxComponentCommand,
        ...gitCommands,
        gitBranchManager // 确保在扩展停用时释放资源
    );
}