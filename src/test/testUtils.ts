import * as vscode from 'vscode';

/**
 * 测试工具类
 * 提供测试中常用的模拟和辅助功能
 */
export class TestUtils {
    /**
     * 创建模拟的VSCode Uri
     */
    static createMockUri(path: string): vscode.Uri {
        return vscode.Uri.file(path);
    }

    /**
     * 模拟用户输入
     */
    static mockUserInput(input: string | undefined): () => Promise<string | undefined> {
        return async () => input;
    }

    /**
     * 模拟用户输入验证
     */
    static mockInputValidation(validInputs: string[], invalidInputs: string[]): vscode.InputBoxOptions {
        return {
            placeHolder: '测试输入',
            validateInput: (value: string) => {
                if (invalidInputs.includes(value)) {
                    return '无效输入';
                }
                if (validInputs.includes(value)) {
                    return null;
                }
                return '未知输入';
            }
        };
    }

    /**
     * 清理测试文件夹
     */
    static async cleanupTestFolders(baseUri: vscode.Uri, folderNames: string[]): Promise<void> {
        for (const folderName of folderNames) {
            try {
                const folderUri = vscode.Uri.joinPath(baseUri, folderName);
                await vscode.workspace.fs.delete(folderUri, { recursive: true });
            } catch (error) {
                // 忽略删除失败的错误
                console.log(`Failed to cleanup folder ${folderName}:`, error);
            }
        }
    }

    /**
     * 验证文件是否存在
     */
    static async fileExists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证文件夹是否存在
     */
    static async folderExists(uri: vscode.Uri): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    /**
     * 读取文件内容
     */
    static async readFileContent(uri: vscode.Uri): Promise<string> {
        const content = await vscode.workspace.fs.readFile(uri);
        return content.toString();
    }

    /**
     * 创建临时测试文件
     */
    static async createTestFile(uri: vscode.Uri, content: string): Promise<void> {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    }

    /**
     * 创建临时测试文件夹
     */
    static async createTestFolder(uri: vscode.Uri): Promise<void> {
        await vscode.workspace.fs.createDirectory(uri);
    }

    /**
     * 等待指定时间（用于异步测试）
     */
    static async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 模拟VSCode消息显示
     */
    static createMessageMock(): {
        showInformationMessage: (message: string) => Promise<void>;
        showWarningMessage: (message: string) => Promise<void>;
        showErrorMessage: (message: string) => Promise<void>;
        getMessages: () => { type: string; message: string }[];
    } {
        const messages: { type: string; message: string }[] = [];

        return {
            showInformationMessage: async (message: string) => {
                messages.push({ type: 'info', message });
            },
            showWarningMessage: async (message: string) => {
                messages.push({ type: 'warning', message });
            },
            showErrorMessage: async (message: string) => {
                messages.push({ type: 'error', message });
            },
            getMessages: () => messages
        };
    }
}

/**
 * 测试数据生成器
 */
export class TestDataGenerator {
    /**
     * 生成有效的组件名称
     */
    static getValidComponentNames(): string[] {
        return [
            'TestComponent',
            'MyButton',
            'UserProfile',
            'NavigationBar',
            'Component123',
            'A',
            'LongComponentNameWithManyWords'
        ];
    }

    /**
     * 生成无效的组件名称
     */
    static getInvalidComponentNames(): string[] {
        return [
            '',
            '123Component',
            'component-name',
            'component_name',
            'component name',
            'component@name',
            'component#name',
            '中文组件名',
            'component.name'
        ];
    }

    /**
     * 生成测试用的JSX模板内容
     */
    static getJsxTemplate(): string {
        return `import React, { useImperativeHandle, forwardRef } from 'react';
import Style from './index.module.less'
import classNames from 'classnames';
const {templateName} = forwardRef((props,ref) => {
 
 useImperativeHandle(ref, () => ({ }));
  return (
    <div className={classNames([Style.{templateName}])}>
     
    </div>
  );
});
{templateName}.displayName = '{templateName}';

export default {templateName};`;
    }

    /**
     * 生成测试用的CSS模板内容
     */
    static getCssTemplate(): string {
        return `.{templateName}{
  
}`;
    }
}
