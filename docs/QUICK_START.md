# 快速开始 - 打包指南

## 一键打包命令

```bash
# 1. 安装 PyInstaller
pip install pyinstaller

# 2. 安装前端依赖（如果还没安装）
cd frontend && npm install && cd ..

# 3. 一键打包
npm run package
```

## 打包产物

打包完成后，你会在 `dist` 目录找到：

```
dist/
└── 批量压缩工具 Setup 1.0.0.exe
```

这个安装程序：
- ✅ 包含所有依赖，无需用户安装 Python 或 Node.js
- ✅ 不暴露任何 Python 源代码（已编译成 exe）
- ✅ JavaScript 代码已打包成 asar 格式
- ✅ 开箱即用，双击安装即可

## 验证打包结果

1. 双击安装 `批量压缩工具 Setup 1.0.0.exe`
2. 启动应用
3. 测试图片压缩功能
4. 测试视频压缩功能

## 分发给用户

直接将 `批量压缩工具 Setup 1.0.0.exe` 发送给用户即可，用户无需安装任何依赖。

## 详细文档

查看 [BUILD.md](BUILD.md) 了解更多详细信息。
