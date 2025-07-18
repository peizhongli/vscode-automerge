import * as vscode from 'vscode';

/**
 * JSX组件生成器类
 * 负责创建React JSX组件的文件夹和文件结构
 */
export class JsxComponentGenerator {
    private extensionPath: string;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    /**
     * 创建JSX组件
     * @param targetUrl 目标文件夹路径
     */
    async createComponent(targetUrl: vscode.Uri): Promise<void> {
        const componentName = await this.getComponentName();
        
        if (!componentName) {
            return;
        }

        const capitalizedName = this.capitalizeFirstLetter(componentName);
        const folderPath = vscode.Uri.joinPath(targetUrl, capitalizedName);

        // 检查文件夹是否存在
        if (await this.checkFolderExists(folderPath, capitalizedName)) {
            return;
        }

        // 创建组件文件夹和文件
        await this.generateComponentFiles(folderPath, capitalizedName);
        
        vscode.window.showInformationMessage(`${capitalizedName}组件创建成功`);
    }

    /**
     * 获取组件名称
     */
    private async getComponentName(): Promise<string | undefined> {
        return await vscode.window.showInputBox({ 
            placeHolder: '请输入组件名称',
            prompt: '组件名称将用于创建文件夹和文件',
            validateInput: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return '组件名称不能为空';
                }
                if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value.trim())) {
                    return '组件名称只能包含字母和数字，且必须以字母开头';
                }
                return null;
            }
        });
    }

    /**
     * 首字母大写
     */
    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 检查文件夹是否存在
     */
    private async checkFolderExists(folderPath: vscode.Uri, componentName: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(folderPath);
            vscode.window.showWarningMessage(`文件夹已存在: ${componentName}`);
            return true;
        } catch (error) {
            // 文件夹不存在，创建文件夹
            await vscode.workspace.fs.createDirectory(folderPath);
            return false;
        }
    }

    /**
     * 生成组件文件
     */
    private async generateComponentFiles(folderPath: vscode.Uri, componentName: string): Promise<void> {
        try {
            const templateFilePath = vscode.Uri.file(`${this.extensionPath}/template/jsx/index.jsx`);
            const cssFilePath = vscode.Uri.file(`${this.extensionPath}/template/jsx/index.module.less`);

            // 读取模板文件
            const jsxContent = (await vscode.workspace.fs.readFile(templateFilePath)).toString();
            const cssContent = (await vscode.workspace.fs.readFile(cssFilePath)).toString();

            // 替换模板变量
            const updatedJsxContent = this.replaceTemplateVariables(jsxContent, componentName);
            const updatedCssContent = this.replaceTemplateVariables(cssContent, componentName);

            // 写入文件
            await Promise.all([
                vscode.workspace.fs.writeFile(
                    vscode.Uri.joinPath(folderPath, 'index.jsx'), 
                    Buffer.from(updatedJsxContent)
                ),
                vscode.workspace.fs.writeFile(
                    vscode.Uri.joinPath(folderPath, 'index.module.less'), 
                    Buffer.from(updatedCssContent)
                )
            ]);
        } catch (error) {
            vscode.window.showErrorMessage(`创建组件文件失败: ${error}`);
            throw error;
        }
    }

    /**
     * 替换模板变量
     */
    private replaceTemplateVariables(content: string, componentName: string): string {
        return content.replace(new RegExp('{templateName}', 'g'), componentName);
    }

    /**
     * 注册VSCode命令
     */
    registerCommand(): vscode.Disposable {
        return vscode.commands.registerCommand('extension.createJsxComponent', async (url) => {
            await this.createComponent(url);
        });
    }
}
