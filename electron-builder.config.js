/**
 * electron-builder 配置文件
 * 用于完全禁用代码签名
 */

module.exports = {
  appId: 'com.batchcompress.app',
  productName: '批量压缩工具',
  copyright: 'Copyright © 2026',

  // 完全禁用代码签名
  forceCodeSigning: false,

  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'frontend/public/icon.ico'
  },

  nsis: {
    oneClick: true,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: false,
    installerIcon: 'frontend/public/icon.ico',
    uninstallerIcon: 'frontend/public/icon.ico',
    installerHeaderIcon: 'frontend/public/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '批量压缩工具'
  },

  directories: {
    output: 'dist',
    buildResources: 'frontend/public'
  },

  extraResources: [
    {
      from: 'backend/dist',
      to: 'backend/dist',
      filter: ['compress.exe']
    },
    {
      from: 'frontend/dist',
      to: 'dist',
      filter: ['**/*']
    },
    {
      from: 'ffmpeg',
      to: 'ffmpeg',
      filter: ['**/*']
    }
  ]
};
