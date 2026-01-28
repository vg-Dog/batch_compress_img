const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 设置应用名称
app.name = '批量压缩工具';

// 创建中文菜单栏
const createMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' },
        { type: 'separator' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '切换全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { 
          label: '关于', 
          click: () => {
            dialog.showMessageBox({
              title: '关于批量压缩工具',
              message: '批量压缩工具 v1.0.0\n\n轻松压缩图片和视频文件',
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// 打印当前目录和文件路径，用于调试
console.log('当前目录:', __dirname);
console.log('preload.js 路径:', path.join(__dirname, 'preload.js'));
console.log('preload.js 是否存在:', fs.existsSync(path.join(__dirname, 'preload.js')));

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
        width: 500,
        height: 470,
        webPreferences: {
          // 使用 preload.js 来安全地暴露 Electron API
          preload: path.resolve(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        },
        title: '批量压缩图片视频工具',
        icon: path.join(__dirname, 'frontend', 'public', 'icon.png'),
        resizable: false // 禁用窗口大小调整，确保始终显示合适的尺寸
      });

  // 加载应用
  // 直接使用resources/dist目录中的前端资源（extra-resource方式）
  const frontendHtmlPath = path.join(process.resourcesPath, 'dist', 'index.html');
  
  console.log('加载前端文件:', frontendHtmlPath);
  console.log('前端文件是否存在:', fs.existsSync(frontendHtmlPath));
  
  mainWindow.loadFile(frontendHtmlPath);

  // 生产环境不打开开发者工具
  // mainWindow.webContents.openDevTools();
  
  // 创建中文菜单栏
  createMenu();
}

// 处理文件选择
ipcMain.handle('select-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择要压缩的目录',
    defaultPath: app.getPath('desktop')
  });
  
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// 处理文件选择（单个或多个文件）
ipcMain.handle('select-files', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    title: '选择要压缩的文件',
    defaultPath: app.getPath('desktop'),
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
      { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'wmv'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  
  if (canceled) {
    return null;
  } else {
    return filePaths;
  }
});

// 处理输出目录选择
ipcMain.handle('select-output-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择输出目录',
    defaultPath: app.getPath('desktop')
  });
  
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// 处理压缩任务
  ipcMain.handle('compress-files', async (event, { inputDir, inputFiles, outputDir, compressionRate }) => {
    return new Promise((resolve, reject) => {
      try {
        // 直接使用resources/backend/dist目录中的后端可执行文件（extra-resource方式）
        const backendScript = path.join(process.resourcesPath, 'backend', 'dist', 'compress.exe');
        
        if (!fs.existsSync(backendScript)) {
          reject(new Error('后端压缩可执行文件不存在'));
          return;
        }

        // 直接使用resources/ffmpeg目录中的FFmpeg（extra-resource方式）
        let ffmpegPath = path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe');
        
        // 如果resources/ffmpeg目录中不存在，使用系统FFmpeg
        if (!fs.existsSync(ffmpegPath)) {
          ffmpegPath = 'ffmpeg';
        }

        // 准备参数
        const args = [
          inputDir || '',
          outputDir,
          compressionRate.toString(),
          ffmpegPath // 添加FFmpeg路径参数
        ];
        
        // 如果有输入文件，添加到参数中
        if (inputFiles && inputFiles.length > 0) {
          args.push(...inputFiles);
        }

        // 直接运行压缩可执行文件
        const pythonProcess = spawn(backendScript, args);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        // 处理编码问题，确保输出是正确的 UTF-8 字符串
        const stdoutData = data.toString('utf-8');
        output += stdoutData;
        // 实时发送进度信息
        event.sender.send('compress-progress', {
          type: 'progress',
          data: stdoutData
        });
      });

      pythonProcess.stderr.on('data', (data) => {
        // 处理编码问题，确保输出是正确的 UTF-8 字符串
        const stderrData = data.toString('utf-8');
        errorOutput += stderrData;
        event.sender.send('compress-progress', {
          type: 'error',
          data: stderrData
        });
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else if (code === 2 || code === 3) {
          // 特殊退出码，分别表示空目录和未找到可处理文件
          // 这些情况不是真正的错误，而是正常的处理结果
          // 所以我们仍然resolve，但可以在返回值中包含退出码信息
          resolve({ success: true, output, code });
        } else {
          reject(new Error(`压缩失败: ${errorOutput || '未知错误'}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
});

// 应用就绪后创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 关闭所有窗口时退出应用（Windows和Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});