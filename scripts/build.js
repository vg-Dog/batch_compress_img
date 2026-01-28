const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 清理并禁用代码签名
function disableCodeSigning() {
  console.log('\n[1/4] 禁用代码签名...');

  // 删除整个 electron-builder 缓存目录
  const cacheBaseDir = path.join(
    process.env.LOCALAPPDATA || process.env.HOME,
    'electron-builder',
    'Cache'
  );

  if (fs.existsSync(cacheBaseDir)) {
    try {
      fs.rmSync(cacheBaseDir, { recursive: true, force: true });
      console.log('✓ 已清理 electron-builder 缓存');
    } catch (err) {
      console.log('⚠ 缓存清理失败（可忽略）:', err.message);
    }
  }

  // 设置环境变量完全禁用签名
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

  // 删除可能存在的签名相关环境变量
  delete process.env.WIN_CSC_LINK;
  delete process.env.WIN_CSC_KEY_PASSWORD;
  delete process.env.CSC_LINK;
  delete process.env.CSC_KEY_PASSWORD;

  console.log('✓ 代码签名已禁用');
}

// 构建前端
function buildFrontend() {
  console.log('\n[2/4] 构建前端...');
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
  console.log('\n[3/4] 打包 Python 后端...');
  try {
    execSync('cd backend && python -m PyInstaller compress.spec --clean', { stdio: 'inherit' });
    console.log('✓ Python 打包完成');
  } catch (err) {
    console.error('✗ Python 打包失败');
    process.exit(1);
  }
}

// 打包 Electron
function buildElectron() {
  console.log('\n[4/4] 打包 Electron 应用...');
  try {
    // 环境变量已在 disableCodeSigning() 中设置
    // 使用独立的配置文件来完全禁用签名
    execSync('electron-builder --config electron-builder.config.js', { stdio: 'inherit' });
    console.log('\n✓ Electron 打包完成');
  } catch (err) {
    console.error('✗ Electron 打包失败');
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('========================================');
  console.log('批量压缩工具 - 打包脚本');
  console.log('========================================');

  disableCodeSigning();
  buildFrontend();
  buildPython();
  buildElectron();

  console.log('\n========================================');
  console.log('✓ 打包完成！');
  console.log('安装程序位置: dist/批量压缩工具 Setup 1.0.0.exe');
  console.log('========================================\n');
}

main();
