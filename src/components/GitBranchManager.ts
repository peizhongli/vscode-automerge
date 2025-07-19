import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Git分支管理器
 * 基于你的autoMerge.js功能，提供VSCode集成的Git分支自动合并功能
 */
export class GitBranchManager {
    private outputChannel: vscode.OutputChannel;
    private workingDirectory: string | undefined;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Git Branch Manager');
        this.workingDirectory = this.getWorkspaceRoot();
    }

    /**
     * 自动合并分支到dev和sit
     */
    async autoMergeBranch(): Promise<void> {
        try {
            this.outputChannel.show();
            this.log('🚀 开始自动合并分支...');

            // 检查是否在Git仓库中
            if (!(await this.isGitRepository())) {
                const message = '当前工作区不是Git仓库，请在Git项目中使用此功能';
                this.log(`❌ ${message}`);
                vscode.window.showErrorMessage(message);
                return;
            }

            // 检查工作区是否干净
            if (!(await this.isWorkingDirectoryClean())) {
                const message = '工作区有未提交的更改，请先提交或暂存更改后再进行合并操作';
                this.log(`⚠️ ${message}`);
                const action = await vscode.window.showWarningMessage(
                    message,
                    '查看更改',
                    '继续操作',
                    '取消'
                );

                if (action === '查看更改') {
                    vscode.commands.executeCommand('git.openChange');
                    return;
                } else if (action !== '继续操作') {
                    this.log('❌ 用户取消操作');
                    return;
                }
            }

            // 获取当前分支
            const currentBranch = await this.getCurrentBranch();
            this.log(`📍 当前分支: ${currentBranch}`);

            // 检查当前分支是否为dev或sit
            if (currentBranch === 'dev' || currentBranch === 'sit') {
                const message = `当前分支是 ${currentBranch}，不能将其合并到自身。请切换到功能分支后再执行合并操作。`;
                this.log(`⚠️ ${message}`);
                vscode.window.showWarningMessage(message);
                return;
            }

            // 直接执行合并流程
            await this.executeMergeFlow(currentBranch, currentBranch);

        } catch (error) {
            this.logError('合并过程中发生错误', error);

            // 提供更友好的错误信息
            let errorMessage = '合并失败';
            if (error instanceof Error) {
                if (error.message.includes('not a git repository')) {
                    errorMessage = '当前目录不是Git仓库，请在Git项目中使用此功能';
                } else if (error.message.includes('fatal: not a git repository')) {
                    errorMessage = '请确保在Git仓库的根目录下使用此功能';
                } else {
                    errorMessage = `合并失败: ${error.message}`;
                }
            }

            vscode.window.showErrorMessage(errorMessage);
        }
    }

    /**
     * 获取工作区根目录
     */
    private getWorkspaceRoot(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }
        return undefined;
    }

    /**
     * 执行Git命令
     */
    private async execGitCommand(command: string): Promise<{ stdout: string; stderr: string }> {
        const options = this.workingDirectory ? { cwd: this.workingDirectory } : {};
        return await execAsync(command, options);
    }

    /**
     * 检查是否在Git仓库中
     */
    private async isGitRepository(): Promise<boolean> {
        try {
            await this.execGitCommand('git rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查工作区是否干净（没有未提交的更改）
     */
    private async isWorkingDirectoryClean(): Promise<boolean> {
        try {
            const { stdout } = await this.execGitCommand('git status --porcelain');
            return stdout.trim().length === 0;
        } catch {
            return false;
        }
    }

    /**
     * 获取当前分支
     */
    private async getCurrentBranch(): Promise<string> {
        const { stdout } = await this.execGitCommand('git rev-parse --abbrev-ref HEAD');
        return stdout.trim();
    }



    /**
     * 获取所有分支
     */
    private async getAllBranches(): Promise<string[]> {
        try {
            const { stdout } = await this.execGitCommand('git branch -a');
            return stdout
                .split('\n')
                .map(branch => branch.replace(/^\*?\s+/, '').replace(/^remotes\/origin\//, ''))
                .filter(branch => branch && !branch.includes('HEAD'))
                .filter((branch, index, arr) => arr.indexOf(branch) === index); // 去重
        } catch (error) {
            this.logError('获取分支列表失败', error);
            return [];
        }
    }



    /**
     * 执行合并流程
     */
    private async executeMergeFlow(branchToMerge: string, originalBranch: string): Promise<void> {
        let isCancelled = false;

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '自动合并分支 (点击取消可中止)',
                cancellable: true
            }, async (progress, token) => {

                // 监听取消事件
                token.onCancellationRequested(() => {
                    isCancelled = true;
                    this.log('⚠️ 用户取消了合并操作');
                });

                // 步骤1: 确保当前分支代码是最新的
                if (token.isCancellationRequested) return;
                progress.report({ increment: 15, message: `拉取 ${branchToMerge} 分支最新代码...` });
                await this.pullCurrentBranch(branchToMerge);

                // 步骤2: 合并到dev分支
                if (token.isCancellationRequested) return;
                progress.report({ increment: 35, message: '合并到 dev 分支...' });
                await this.mergeToTargetBranch(branchToMerge, 'dev');

                // 步骤3: 合并到sit分支
                if (token.isCancellationRequested) return;
                progress.report({ increment: 35, message: '合并到 sit 分支...' });
                await this.mergeToTargetBranch('dev', 'sit');

                // 步骤4: 切换回原分支
                if (token.isCancellationRequested) return;
                progress.report({ increment: 15, message: `切换回 ${originalBranch} 分支...` });
                await this.switchToBranch(originalBranch);

                if (!token.isCancellationRequested) {
                    progress.report({ message: '合并完成!' });
                }
            });

            if (isCancelled) {
                this.log('❌ 合并操作已取消');
                vscode.window.showWarningMessage('⚠️ 合并操作已取消');
            } else {
                this.log('✅ 自动合并完成!');
                vscode.window.showInformationMessage('🎉 分支自动合并成功!');
            }
        } catch (error) {
            if (isCancelled) {
                this.log('❌ 合并操作已取消');
                vscode.window.showWarningMessage('⚠️ 合并操作已取消');
            } else {
                throw error; // 重新抛出非取消相关的错误
            }
        }
    }

    /**
     * 拉取当前分支最新代码
     */
    private async pullCurrentBranch(branch: string): Promise<void> {
        this.log(`⬇️ 拉取 ${branch} 分支最新代码...`);
        await this.execGitCommand(`git pull origin ${branch}`);
    }

    /**
     * 切换到指定分支
     */
    private async switchToBranch(branch: string): Promise<void> {
        this.log(`🔄 切换到 ${branch} 分支...`);
        await this.execGitCommand(`git checkout ${branch}`);
    }

    /**
     * 合并到目标分支
     */
    private async mergeToTargetBranch(sourceBranch: string, targetBranch: string): Promise<void> {
        // 切换到目标分支
        await this.switchToBranch(targetBranch);

        // 拉取目标分支最新代码
        this.log(`⬇️ 拉取 ${targetBranch} 分支最新代码...`);
        await this.execGitCommand(`git pull origin ${targetBranch}`);

        // 合并源分支
        this.log(`🔀 合并 ${sourceBranch} 到 ${targetBranch}...`);
        await this.execGitCommand(`git merge ${sourceBranch}`);

        // 检查是否有冲突
        if (await this.checkMergeConflict()) {
            throw new Error(`合并 ${sourceBranch} 到 ${targetBranch} 时发生冲突，请手动解决`);
        }

        // 推送到远程
        this.log(`⬆️ 推送 ${targetBranch} 分支...`);
        await this.execGitCommand(`git push origin ${targetBranch}:${targetBranch}`);
    }

    /**
     * 检查是否有合并冲突
     */
    private async checkMergeConflict(): Promise<boolean> {
        try {
            const { stdout } = await this.execGitCommand('git status --porcelain');
            return stdout.includes('UU') || stdout.includes('AA') || stdout.includes('DD');
        } catch {
            return false;
        }
    }

    /**
     * 记录日志
     */
    private log(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * 记录错误日志
     */
    private logError(message: string, error: any): void {
        const timestamp = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`[${timestamp}] ❌ ${message}: ${error}`);
    }

    /**
     * 注册VSCode命令
     */
    registerCommands(): vscode.Disposable[] {
        const autoMergeCommand = vscode.commands.registerCommand(
            'extension.autoMergeBranch',
            () => this.autoMergeBranch()
        );

        const showBranchesCommand = vscode.commands.registerCommand(
            'extension.showBranches',
            () => this.showBranchInfo()
        );

        return [autoMergeCommand, showBranchesCommand];
    }

    /**
     * 显示分支信息
     */
    private async showBranchInfo(): Promise<void> {
        try {
            const currentBranch = await this.getCurrentBranch();
            const branches = await this.getAllBranches();
            
            this.outputChannel.show();
            this.log('📋 分支信息:');
            this.log(`当前分支: ${currentBranch}`);
            this.log('所有分支:');
            branches.forEach(branch => {
                this.log(`  - ${branch}${branch === currentBranch ? ' (当前)' : ''}`);
            });
        } catch (error) {
            this.logError('获取分支信息失败', error);
        }
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}
