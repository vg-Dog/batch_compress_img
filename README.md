# 批量压缩图片视频工具

## 功能特点

- 📁 支持选择目录批量压缩
- 🎨 支持图片和视频文件
- ⚙️ 可自定义压缩比例（默认50%）
- 📂 可自定义输出目录
- ✅ 压缩后文件自动添加_compressed后缀
- 🎯 美观的用户界面
- 🌐 支持中文显示

## 支持的文件格式

- **图片**：jpg, jpeg, png, webp
- **视频**：mp4, avi, mov, wmv

## 使用方法

1. **选择输入目录**：点击"浏览"按钮选择要压缩的文件所在目录
2. **选择输出目录**：默认与输入目录相同，可自定义
3. **设置压缩比例**：通过滑块调整，范围10-100%
4. **开始压缩**：点击"开始压缩"按钮执行压缩任务
5. **查看结果**：压缩完成后会显示成功提示

## 技术实现

- **前端**：Electron + React + Tailwind CSS
- **后端**：Python
- **图片处理**：Pillow
- **视频处理**：FFmpeg

## 开发说明

### 安装依赖

```bash
# 根目录依赖
npm install

# 前端依赖
cd frontend
npm install
```

### 构建前端

```bash
cd frontend
npm run build
```

### 运行开发版本

```bash
# 方法1：使用 electron 直接启动（推荐）
npm run start

# 方法2：使用 electron-vite 启动（可选）
npm run dev
```

**注意**：`npm run start` 命令使用 `electron .` 直接启动应用，更加稳定可靠。`npm run dev` 命令使用 `electron-vite dev`，可能需要进一步配置。

### 打包发布

#### 方法：使用 electron-packager 构建
```bash
# 1. 首先构建前端资源
cd frontend
npm run build
cd ..

# 2. 在根目录使用 electron-packager 构建应用，注意只能在dist目录打包，不然会生成重复的打包目录造成无限递归
npx electron-packager . --platform=win32 --arch=x64 --out=dist --overwrite --asar --extra-resource=backend --extra-resource=frontend/dist --extra-resource=ffmpeg
```

#### 构建结果
构建完成后，可执行文件和相关资源会生成在 `dist` 目录中。
- **主可执行文件**：`dist/batch-compress-img-win32-x64/batch-compress-img.exe`
- **完整构建目录**：`dist/batch-compress-img-win32-x64/`

**应用分发说明**：
- ✅ **必须分发完整文件夹**：由于Electron应用的特性，不能只分发单独的 `batch-compress-img.exe` 文件。必须将整个 `batch-compress-img-win32-x64` 文件夹一起分发给用户。
- ✅ **用户直接运行**：用户收到完整文件夹后，只需双击其中的 `batch-compress-img.exe` 文件即可启动应用。

**注意**：
- 构建过程可能需要下载一些依赖文件（如 Electron 运行时），首次构建时间可能较长
- 应用启动时不会显示开发者工具，提供更干净的用户体验

## 注意事项

1. **Python 3 依赖**：确保系统已安装Python 3（推荐Python 3.7+）
2. **FFmpeg 依赖**：
   - ✅ **视频压缩必须**：用于视频压缩功能，图片压缩不需要
   - ✅ **开箱即用方案**（推荐）：
     - **操作步骤**：
       1. 从 [FFmpeg官网](https://ffmpeg.org/download.html) 下载Windows版本（推荐Full build）
       2. 解压后找到 `ffmpeg.exe` 文件
       3. **方法A（构建时包含）**：
          - 将 `ffmpeg.exe` 复制到项目根目录的 `ffmpeg` 文件夹中
          - 构建应用时使用 `--extra-resource=ffmpeg` 参数
       4. **方法B（手动添加）**：
          - 构建完成后，将 `ffmpeg.exe` 复制到应用安装目录的 `resources\app\ffmpeg` 文件夹中
     - **用户使用**：用户收到应用后无需任何设置，直接使用视频压缩功能
   - ✅ **系统安装方案**（备选）：
     - 从官网下载并安装FFmpeg到系统
     - 确保将FFmpeg的 `bin` 目录添加到系统环境变量 `PATH` 中
   - ✅ **自动检测机制**：应用会按以下优先级使用FFmpeg：
     1. 优先使用应用目录下 `ffmpeg` 文件夹中的 `ffmpeg.exe`
     2. 其次使用系统环境变量中配置的 `ffmpeg`
3. **压缩视频可能需要较长时间**，取决于文件大小和数量
4. **压缩质量设置越低**，文件越小，但画质会降低

## 许可证

MIT