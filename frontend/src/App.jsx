import React, { useState, useEffect } from 'react';

/**
 * 批量压缩图片视频工具主应用
 * 功能：选择目录、设置压缩比例、选择输出目录、执行压缩
 */
function App() {
  // 状态管理
  const [inputDir, setInputDir] = useState('');
  const [inputFiles, setInputFiles] = useState([]);
  const [outputDir, setOutputDir] = useState('');
  const [compressionRate, setCompressionRate] = useState(50);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(''); // 初始设置为空字符串
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [electronApiAvailable, setElectronApiAvailable] = useState(false);
  const [selectionMode, setSelectionMode] = useState('directory'); // 'directory' or 'files'
  const [hasNoFiles, setHasNoFiles] = useState(false); // 跟踪是否检测到"未找到文件"或"目录为空"的情况

  // 初始化检查electronAPI是否可用
  useEffect(() => {
    console.log('检查 electronAPI 是否可用');
    if (window.electronAPI) {
      setElectronApiAvailable(true);
      console.log('electronAPI 可用');
      setError('');
    } else {
      setElectronApiAvailable(false);
      setError('错误：Electron API 未加载，请重新启动应用');
      console.error('electronAPI 不可用');
    }
  }, []);

  // 初始化时设置默认输出目录为输入目录
  useEffect(() => {
    if (inputDir && !outputDir) {
      setOutputDir(inputDir);
    }
  }, [inputDir, outputDir]);

  // 选择输入目录或文件
  const handleSelectInput = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API 不可用');
      }
      
      if (selectionMode === 'directory') {
        console.log('调用 selectDirectory');
        const dir = await window.electronAPI.selectDirectory();
        console.log('选择目录结果:', dir);
        if (dir) {
          setInputDir(dir);
          setInputFiles([]);
          if (!outputDir) {
            setOutputDir(dir);
          }
          setError('');
        }
      } else {
        console.log('调用 selectFiles');
        const files = await window.electronAPI.selectFiles();
        console.log('选择文件结果:', files);
        if (files && files.length > 0) {
          setInputFiles(files);
          setInputDir('');
          // 默认输出目录为第一个文件所在目录
          if (!outputDir && files.length > 0) {
            const firstFileDir = files[0].substring(0, files[0].lastIndexOf('\\'));
            setOutputDir(firstFileDir);
          }
          setError('');
        }
      }
    } catch (err) {
      console.error('选择失败:', err);
      setError('选择失败: ' + err.message);
    }
  };

  // 选择输出目录
  const handleSelectOutputDir = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API 不可用');
      }
      console.log('调用 selectOutputDirectory');
      const dir = await window.electronAPI.selectOutputDirectory();
      console.log('选择输出目录结果:', dir);
      if (dir) {
        setOutputDir(dir);
        setError('');
      }
    } catch (err) {
      console.error('选择输出目录失败:', err);
      setError('选择输出目录失败: ' + err.message);
    }
  };

  // 处理压缩开始
  const handleCompress = async () => {
    if (!inputDir && inputFiles.length === 0) {
      setError('请选择要压缩的目录或文件');
      return;
    }

    if (!outputDir) {
      setError('请选择输出目录');
      return;
    }

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API 不可用');
      }
      setIsCompressing(true);
      setProgress('0%'); // 开始压缩时设置为0%
      setError('');
      setSuccess('');
      setHasNoFiles(false); // 重置为false

      // 注册进度监听器
      console.log('注册进度监听器');
      const unsubscribe = window.electronAPI.onCompressProgress((data) => {
        console.log('收到进度数据:', data);
        if (data.type === 'progress') {
          // 只处理包含"处理进度:"的信息，忽略其他信息
          if (data.data.includes('处理进度:')) {
            // 提取百分比进度
            const progressMatch = data.data.match(/\d+%/);
            if (progressMatch) {
              setProgress(progressMatch[0]);
            }
          } else if (data.data.includes('未找到可处理的图片或视频文件')) {
            // 显示未找到文件的提示
            setProgress('未找到文件');
            setHasNoFiles(true);
            setError('未找到可处理的图片或视频文件');
          } else if (data.data.includes('错误: 目录为空')) {
            // 显示目录为空的提示
            setProgress('目录为空');
            setHasNoFiles(true);
            setError('目录为空，未找到可处理的文件');
          }
        } else if (data.type === 'error') {
          setError(data.data);
        }
      });

      // 执行压缩
      console.log('执行压缩:', { inputDir, inputFiles, outputDir, compressionRate });
      const result = await window.electronAPI.compressFiles({
        inputDir,
        inputFiles,
        outputDir,
        compressionRate
      });

      // 检查是否有错误信息或特殊退出码，如果有则不显示"压缩完成！"
      if (result.code !== 2 && result.code !== 3 && progress !== '未找到文件' && progress !== '目录为空') {
        setSuccess('压缩完成！');
      }
      unsubscribe();
    } catch (err) {
      console.error('压缩失败:', err);
      setError('压缩失败: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-3 max-w-md w-full">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2 rounded text-xs">
            <p>{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-2 rounded text-xs">
            <p>{success}</p>
          </div>
        )}

        {/* 进度显示 */}
        {isCompressing && (
          <div className="mb-2">
            <div className="text-center text-xs text-gray-500 mb-0.5">{progress || '0%'}</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ 
                  width: progress && progress.includes('%') ? progress : '0%' 
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* 选择模式切换 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              选择模式
            </label>
            <div className="flex space-x-2">
              <label className="flex items-center space-x-1 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="selectionMode"
                  value="directory"
                  checked={selectionMode === 'directory'}
                  onChange={() => setSelectionMode('directory')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>选择目录</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="selectionMode"
                  value="files"
                  checked={selectionMode === 'files'}
                  onChange={() => setSelectionMode('files')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>选择文件</span>
              </label>
            </div>
          </div>

          {/* 输入目录/文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              {selectionMode === 'directory' ? '选择要压缩的目录' : '选择要压缩的文件'}
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={selectionMode === 'directory' ? inputDir : inputFiles.length > 0 ? `${inputFiles.length} 个文件` : ''}
                readOnly
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder={selectionMode === 'directory' ? '请选择目录' : '请选择文件'}
              />
              <button
                onClick={handleSelectInput}
                disabled={!electronApiAvailable}
                className={`px-2 py-1 rounded-lg hover:bg-opacity-90 transition-colors text-sm ${
                  electronApiAvailable
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                浏览
              </button>
            </div>
          </div>

          {/* 输出目录选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              选择输出目录
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={outputDir}
                readOnly
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="请选择输出目录"
              />
              <button
                onClick={handleSelectOutputDir}
                disabled={!electronApiAvailable}
                className={`px-2 py-1 rounded-lg hover:bg-opacity-90 transition-colors text-sm ${
                  electronApiAvailable
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                浏览
              </button>
            </div>
          </div>

          {/* 压缩比例设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              压缩比例: {compressionRate}%
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="100"
                value={compressionRate}
                onChange={(e) => setCompressionRate(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <input
                type="number"
                min="10"
                max="100"
                value={compressionRate}
                onChange={(e) => setCompressionRate(Math.max(10, Math.min(100, parseInt(e.target.value) || 10)))}
                className="w-12 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          {/* 压缩按钮 */}
          <div className="mt-1">
            <button
              onClick={handleCompress}
              disabled={isCompressing || (!inputDir && inputFiles.length === 0) || !outputDir || !electronApiAvailable}
              className={`w-full py-1.5 px-3 rounded-lg font-medium transition-colors text-sm ${
                isCompressing || (!inputDir && inputFiles.length === 0) || !outputDir || !electronApiAvailable
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isCompressing ? '压缩中...' : '开始压缩'}
            </button>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-2 text-center text-xs text-gray-500">
          <p>支持图片和视频文件批量压缩</p>
          <p className="mt-0.5">压缩后文件会添加_compressed后缀</p>
        </div>
      </div>
    </div>
  );
}

export default App;