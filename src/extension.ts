import * as vscode from 'vscode';
const capitalizeFirstLetter = (str: string): string => 
 str.charAt(0).toUpperCase() + str.slice(1);

export function activate(context: vscode.ExtensionContext) {
 const extensionPath = context.extensionPath; // 获取插件的安装地址
	const disposable = vscode.commands.registerCommand('extension.helloWorld', async () => {
  let what = await vscode.window.showInputBox({ placeHolder: '请输入组件名称' });
  if (what) {
   vscode.window.showInformationMessage(`${what}Hello World!`);
  }
	});

	const disposable1 = vscode.commands.registerCommand('extension.explorerContext', async (url) => {
  let what = await vscode.window.showInputBox({ placeHolder: '请输入组件名称' });
  if (what) {
   const UpKey = capitalizeFirstLetter(what);
   const templateFilePath = vscode.Uri.file(`${extensionPath}/template/jsx/index.jsx`);
   const cssFilePath = vscode.Uri.file(`${extensionPath}/template/jsx/index.module.less`);
   const content = (await vscode.workspace.fs.readFile(templateFilePath)).toString();
   const cssContent = (await vscode.workspace.fs.readFile(cssFilePath)).toString();
   // 检查文件夹是否存在
   const folderPath = vscode.Uri.joinPath(url, UpKey);
   try {
    await vscode.workspace.fs.stat(folderPath);
    vscode.window.showWarningMessage(`文件夹已存在: ${UpKey}`);
   } catch (error) {
    // 文件夹不存在，创建文件夹
    await vscode.workspace.fs.createDirectory(folderPath);
   }
   const oldContent = `{templateName}`;
   const newContent = UpKey;
   
   const updatedContent = content.replace(new RegExp(oldContent, 'g'), newContent);
   const updatedCssContent = cssContent.replace(new RegExp(oldContent, 'g'), newContent);
   vscode.workspace.fs.writeFile(vscode.Uri.joinPath(folderPath, `index.jsx`), Buffer.from(updatedContent))
   vscode.workspace.fs.writeFile(vscode.Uri.joinPath(folderPath, `index.module.less`), Buffer.from(updatedCssContent))
   vscode.window.showInformationMessage(`${UpKey}组件创建成功`);
  }
	});

	context.subscriptions.push(disposable,disposable1);
}