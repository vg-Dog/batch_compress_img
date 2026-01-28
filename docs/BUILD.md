# 打包说明文档

本文档说明如何将包含 Python 代码的 Electron 应用打包成完全独立的可执行文件，不暴露任何源代码。

## 打包原理

1. **Python 代码打包**: 使用 PyInstaller 将 Python 脚本打包成独立的 `.exe` 可执行文件
2. **前端代码打包**: 使用 Vite 构建前端 React 应用
3. **Electron 打包**: 使用 electron-builder 将所有资源打包成 Windows 安装程序

## 环境准备

### 1. 安装 Python 依赖

```bash
# 进入 backend 目录
cd backend

# 安装项目依赖
pip install -r requirements.txt

# 安装 PyInstaller
pip install pyinstaller
```

### 2. 安装 Node.js 依赖

```bash
# 在项目根目录
npm install

# 进入 frontend 目录安装前端依赖
cd frontend
npm install
cd ..
```

## 打包步骤

### 方式一：一键打包（推荐）

```bash
npm run package
```

这个命令会自动执行以下步骤：
1. 构建前端应用
2. 打包 Python 脚本为 exe
3. 使用 electron-builder 打包整个应用

### 方式二：分步打包

#### 步骤 1: 打包 Python 后端

```bash
npm run build:python
```

这会在 `backend/dist` 目录生成 `compress.exe` 文件。

**PyInstaller 参数说明**:
- `--onefile`: 打包成单个 exe 文件
- `--clean`: 清理临时文件
- `--noconsole`: 不显示控制台窗口（可选）
- 使用 `.spec` 文件可以更精细地控制打包过程

#### 步骤 2: 构建前端应用

```bash
npm run build:frontend
```

这会在 `frontend/dist` 目录生成前端静态文件。

#### 步骤 3: 打包 Electron 应用

```bash
npm run electron:build
```

或者使用完整打包命令：

```bash
npm run package
```

## 打包后的文件结构

```
dist/
└── 批量压缩工具 Setup 1.0.0.exe    # Windows 安装程序
```

安装后的应用结构：
```
安装目录/
├── 批量压缩工具.exe                # 主程序
└── resources/
    ├── app.asar                    # 打包的 Electron 代码（加密）
    ├── backend/
    │   └── dist/
    │       └── compress.exe        # Python 可执行文件（无源码）
    ├── dist/                       # 前端静态文件
    │   ├── index.html
    │   └── assets/
    └── ffmpeg/
        └── ffmpeg.exe              # FFmpeg 可执行文件
```

## 源代码保护

### 1. Python 代码保护

PyInstaller 将 Python 代码编译成字节码并打包到 exe 中：
- ✅ 源代码 `.py` 文件不会被包含
- ✅ 代码被编译成 `.pyc` 字节码
- ✅ 所有依赖库都被打包进 exe
- ✅ 用户无法直接查看 Python 源代码

**注意**: 虽然字节码可以被反编译，但难度较高。如需更强保护，可以考虑：
- 使用代码混淆工具
- 使用 Cython 编译成 C 扩展
- 使用商业加密工具

### 2. JavaScript 代码保护

- ✅ Electron 使用 `asar` 格式打包，提供基本保护
- ✅ 前端代码经过 Vite 构建和压缩
- ⚠️ JavaScript 代码仍可被提取和反编译

**增强保护**（可选）:
```bash
# 在 package.json 中添加 asar 加密
"build": {
  "asar": true,
  "asarUnpack": "**\\*.{node,dll}"
}
```

### 3. 资源文件保护

- FFmpeg 可执行文件: 开源工具，无需保护
- 前端静态资源: 图片、样式等，基本保护即可

## 常见问题

### 1. PyInstaller 打包失败

**问题**: 提示找不到模块或依赖

**解决方案**:
```bash
# 确保所有依赖都已安装
pip install -r requirements.txt
pip install pyinstaller

# 清理缓存重新打包
cd backend
pyinstaller compress.spec --clean
```

### 2. 打包后运行报错

**问题**: 找不到 compress.exe

**解决方案**:
- 确保 `backend/dist/compress.exe` 存在
- 检查 [package.json](../package.json) 中的 `extraResources` 配置是否正确

### 3. 前端页面无法加载

**问题**: Electron 窗口显示空白

**解决方案**:
- 确保 `frontend/dist` 目录存在且包含 `index.html`
- 检查 [main.js:95](../main.js#L95) 中的路径配置

### 4. FFmpeg 相关错误

**问题**: 视频压缩失败

**解决方案**:
- 确保 `ffmpeg` 目录包含 `ffmpeg.exe`
- 或者在系统中安装 FFmpeg 并添加到 PATH

## 发布清单

打包完成后，确保以下内容：

- [ ] 生成了 `批量压缩工具 Setup 1.0.0.exe` 安装程序
- [ ] 安装程序可以正常安装
- [ ] 应用可以正常启动
- [ ] 图片压缩功能正常
- [ ] 视频压缩功能正常（需要 FFmpeg）
- [ ] 没有暴露 Python 源代码（`.py` 文件）
- [ ] 没有暴露 JavaScript 源代码（已打包成 `.asar`）

## 分发说明

### 用户系统要求

- **操作系统**: Windows 7 及以上
- **依赖**: 无需安装 Python、Node.js 或其他依赖
- **磁盘空间**: 约 100-200 MB

### 分发方式

1. **直接分发安装程序**:
   - 将 `dist/批量压缩工具 Setup 1.0.0.exe` 发送给用户
   - 用户双击安装即可使用

2. **绿色版**（可选）:
   - 解压安装后的文件夹
   - 打包成 zip 文件分发
   - 用户解压后直接运行 `批量压缩工具.exe`

## 技术栈总结

- **前端**: React + Vite
- **桌面框架**: Electron
- **后端**: Python + Pillow + FFmpeg
- **打包工具**:
  - PyInstaller (Python → exe)
  - electron-builder (Electron → 安装程序)
  - Vite (前端构建)

## 相关文件

- [package.json](../package.json) - 项目配置和打包脚本
- [backend/compress.spec](../backend/compress.spec) - PyInstaller 配置
- [main.js](../main.js) - Electron 主进程
- [backend/compress.py](../backend/compress.py) - Python 压缩脚本
