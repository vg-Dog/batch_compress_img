const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建前端
function buildFrontend() {
  console.log('\n[1/3] 构建前端...');
  try {
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    console.log('✓ 前端构建完成');
  } catch (err) {
    console.error('✗ 前端构建失败');
    process.exit(1);
  }
}

// 打包 Python
function buildPython() {
  console.log('\n[2/3] 打包 Python 后端...');
  try {
    execSync('cd backend && python -m PyInstaller compress.spec --clean', { stdio: 'inherit' });
    console.log('✓ Python 打包完成');
  } catch (err) {
    console.error('✗ Python 打包失败');
    process.exit(1);
  }
}

// 使用 electron-packager 打包
function packageElectron() {
  console.log('\n[3/4] 打包 Electron 应用...');

  // 清理旧的打包文件
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    console.log('清理旧的打包文件...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  try {
    // 使用 electron-packager 打包
    // 使用英文名称避免路径编码问题
    execSync(
      'npx electron-packager . "BatchCompressTool" ' +
      '--platform=win32 ' +
      '--arch=x64 ' +
      '--out=dist ' +
      '--overwrite ' +
      '--asar ' +
      '--icon=frontend/public/icon.ico ' +
      '--app-version=1.0.0 ' +
      '--executable-name="批量压缩工具" ' +
      '--ignore="^/(frontend|backend|node_modules|dist|docs|scripts|.git|.gitignore|.trae|test.html|compress.spec|electron-builder.config.js|build.bat|tmpclaude.*)" ' +
      '--prune=true',
      { stdio: 'inherit' }
    );

    console.log('✓ Electron 打包完成');
  } catch (err) {
    console.error('✗ Electron 打包失败');
    process.exit(1);
  }
}

// 复制额外资源
function copyResources() {
  console.log('\n[4/4] 复制资源文件...');

  const appDir = path.join(__dirname, '..', 'dist', 'BatchCompressTool-win32-x64', 'resources');

  try {
    // 复制 Python 可执行文件
    const backendSrc = path.join(__dirname, '..', 'backend', 'dist');
    const backendDest = path.join(appDir, 'backend', 'dist');
    fs.mkdirSync(backendDest, { recursive: true });
    fs.copyFileSync(
      path.join(backendSrc, 'compress.exe'),
      path.join(backendDest, 'compress.exe')
    );
    console.log('✓ 已复制 Python 可执行文件');

    // 复制前端文件
    const frontendSrc = path.join(__dirname, '..', 'frontend', 'dist');
    const frontendDest = path.join(appDir, 'dist');
    fs.cpSync(frontendSrc, frontendDest, { recursive: true });
    console.log('✓ 已复制前端文件');

    // 复制 FFmpeg
    const ffmpegSrc = path.join(__dirname, '..', 'ffmpeg');
    const ffmpegDest = path.join(appDir, 'ffmpeg');
    if (fs.existsSync(ffmpegSrc)) {
      fs.cpSync(ffmpegSrc, ffmpegDest, { recursive: true });
      console.log('✓ 已复制 FFmpeg');
    } else {
      console.log('⚠ FFmpeg 目录不存在，跳过');
    }

    console.log('✓ 资源文件复制完成');
  } catch (err) {
    console.error('✗ 资源文件复制失败:', err.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('========================================');
  console.log('批量压缩工具 - 打包脚本 (electron-packager)');
  console.log('========================================');

  buildFrontend();
  buildPython();
  packageElectron();
  copyResources();

  console.log('\n========================================');
  console.log('✓ 打包完成！');
  console.log('应用位置: dist/BatchCompressTool-win32-x64/批量压缩工具.exe');
  console.log('\n使用说明:');
  console.log('1. 直接运行: dist/BatchCompressTool-win32-x64/批量压缩工具.exe');
  console.log('2. 或将整个文件夹打包成 zip 分发给用户');
  console.log('========================================\n');
}

main();
