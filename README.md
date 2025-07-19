# ChenLiwen VSCode Extension

一个强大的VSCode扩展，提供快捷开发工具，包括JSX组件生成和Git分支自动合并功能。

## 🚀 功能特性

### 1. JSX组件快速生成
- 🎯 右键文件夹快速创建React组件
- 📁 自动生成组件文件夹结构
- 🎨 包含JSX文件和CSS模块文件
- ✅ 输入验证确保组件名称规范
- 🔧 基于模板的代码生成

### 2. Git分支自动合并 🆕
- 🔀 一键自动合并当前分支到dev和sit环境
- 📋 显示所有分支信息
- ⚡ 智能冲突检测和分支检查
- 📊 详细的操作日志
- 🛡️ 安全的操作确认流程

## 📦 安装

1. 在VSCode扩展市场搜索 "chenliwen"
2. 点击安装
3. 重启VSCode

## 🎯 使用方法

### JSX组件生成

1. **右键文件夹**：在资源管理器中右键点击任意文件夹
2. **选择"创建JSX组件"**：从上下文菜单中选择
3. **输入组件名称**：输入符合规范的组件名称
4. **自动生成**：扩展会自动创建组件文件夹和文件

生成的文件结构：
```
ComponentName/
├── index.jsx          # React组件文件
└── index.module.less   # CSS模块样式文件
```

### Git分支自动合并

1. **切换到功能分支**：确保当前在要合并的功能分支上
2. **打开命令面板**：`Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
3. **搜索Git命令**：
   - `🚀 自动合并当前分支到dev和sit` - 执行自动合并流程
   - `📋 显示分支信息` - 查看当前仓库分支信息

#### 自动合并流程：
1. 直接开始合并当前分支（无需确认）
2. 自动执行以下步骤：
   - 拉取当前分支最新代码
   - 合并到dev分支并推送
   - 合并到sit分支并推送
   - 切换回原始分支
3. 支持随时取消操作

## ⚙️ 配置

### 组件名称规范
- 必须以字母开头
- 只能包含字母和数字
- 不能包含特殊字符或空格

### Git要求
- 项目必须是Git仓库
- 需要有dev和sit分支
- 确保有推送权限

## 🔧 开发

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/chenliwen123/VscodeExtension.git

# 安装依赖
npm install

# 编译
npm run compile

# 运行测试
npm run test
```

### 项目结构
```
src/
├── components/
│   ├── JsxComponentGenerator.ts    # JSX组件生成器
│   └── GitBranchManager.ts         # Git分支管理器
├── test/                           # 测试文件
├── extension.ts                    # 主扩展文件
template/
└── jsx/                           # JSX模板文件
```

## 🧪 测试

扩展包含完整的单元测试：

```bash
npm run test
```

测试覆盖：
- ✅ 组件生成功能
- ✅ 输入验证
- ✅ 错误处理
- ✅ Git操作
- ✅ 用户交互

## 📝 更新日志

### v0.0.2
- 🆕 添加Git分支自动合并功能
- 🔧 重构JSX组件生成器
- ✅ 添加完整的单元测试
- 📚 改进文档和错误处理

### v0.0.1
- 🎉 初始版本
- ✨ JSX组件快速生成功能
- 📝 基础代码片段支持

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

chenliwen - [GitHub](https://github.com/chenliwen123)
