#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量压缩图片和视频文件的后端脚本
支持的图片格式：jpg, jpeg, png, webp
支持的视频格式：mp4, avi, mov, wmv
"""

import os
import sys

# 确保 stdout 使用 UTF-8 编码
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import subprocess
from PIL import Image

def compress_image(input_path, output_path, quality):
    """
    压缩图片文件
    :param input_path: 输入图片路径
    :param output_path: 输出图片路径
    :param quality: 压缩质量 (0-100)
    """
    try:
        img = Image.open(input_path)
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 根据压缩比例调整图片尺寸
        # 压缩比例越低，尺寸越小
        width, height = img.size
        # 将压缩比例转换为尺寸缩放因子 (1.0 - 0.1)
        scale_factor = 0.1 + (quality / 100) * 0.9
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        
        # 调整图片尺寸
        resized_img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # 保存压缩后的图片
        resized_img.save(output_path, optimize=True, quality=quality)
        
        return True, f"成功压缩图片: {os.path.basename(input_path)} (尺寸: {width}x{height} → {new_width}x{new_height})"
    except Exception as e:
        return False, f"压缩图片失败: {os.path.basename(input_path)} - {str(e)}"

def compress_video(input_path, output_path, quality, ffmpeg_path='ffmpeg'):
    """
    压缩视频文件
    :param input_path: 输入视频路径
    :param output_path: 输出视频路径
    :param quality: 压缩质量 (0-100)，转换为CRF值
    :param ffmpeg_path: FFmpeg可执行文件路径
    """
    try:
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 将质量值转换为ffmpeg的CRF值 (0-51，值越小质量越高)
        crf = 51 - (quality * 0.41)  # 将100-0映射到0-51
        
        # 使用ffmpeg压缩视频
        cmd = [
            ffmpeg_path,
            '-i', input_path,
            '-c:v', 'libx264',
            '-crf', str(int(crf)),
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',  # 覆盖输出文件
            output_path
        ]
        
        # 执行命令
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        
        return True, f"成功压缩视频: {os.path.basename(input_path)}"
    except Exception as e:
        return False, f"压缩视频失败: {os.path.basename(input_path)} - {str(e)}"

def get_output_filename(input_path, suffix="_compressed"):
    """
    生成带后缀的输出文件名
    :param input_path: 输入文件路径
    :param suffix: 要添加的后缀
    :return: 带后缀的文件路径
    """
    dirname = os.path.dirname(input_path)
    basename = os.path.basename(input_path)
    name, ext = os.path.splitext(basename)
    return os.path.join(dirname, f"{name}{suffix}{ext}")

def main(input_dir, output_dir, compression_rate, input_files=None, ffmpeg_path='ffmpeg'):
    """
    主函数
    :param input_dir: 输入目录
    :param output_dir: 输出目录
    :param compression_rate: 压缩比例 (0-100)
    :param input_files: 输入文件列表，None表示处理目录
    :param ffmpeg_path: FFmpeg可执行文件路径
    """
    # 支持的文件格式
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    video_extensions = {'.mp4', '.avi', '.mov', '.wmv'}
    
    # 统计信息
    total_files = 0
    processed_files = 0
    failed_files = 0
    
    print(f"压缩比例: {compression_rate}%")
    print(f"输出目录: {output_dir}")
    print("=" * 60)
    
    # 收集所有要处理的文件
    files_to_process = []
    
    # 确保输出不被缓冲
    sys.stdout.flush()
    
    if input_files:
        # 处理单个或多个文件
        print(f"开始处理 {len(input_files)} 个文件")
        for input_path in input_files:
            if os.path.exists(input_path):
                ext = os.path.splitext(input_path)[1].lower()
                if ext in image_extensions or ext in video_extensions:
                    files_to_process.append(input_path)
                else:
                    print(f"跳过不支持的文件类型: {os.path.basename(input_path)}")
                    failed_files += 1
            else:
                print(f"文件不存在: {input_path}")
                failed_files += 1
    else:
        # 遍历目录
        print(f"开始扫描目录: {input_dir}")
        # 检查目录是否存在
        if not os.path.exists(input_dir):
            print(f"错误: 目录不存在: {input_dir}")
            print("=" * 60)
            print("压缩完成!")
            print(f"总文件数: 0")
            print(f"成功压缩: 0")
            print(f"压缩失败: 0")
            sys.stdout.flush()
            return
        
        # 检查目录是否为空
        is_empty = True
        for root, dirs, files in os.walk(input_dir):
            if files:
                is_empty = False
                break
        
        if is_empty:
            print(f"错误: 目录为空: {input_dir}")
            print("=" * 60)
            print("压缩完成!")
            print(f"总文件数: 0")
            print(f"成功压缩: 0")
            print(f"压缩失败: 0")
            sys.stdout.flush()
            sys.exit(2)  # 返回特殊退出码，表示空目录
        
        # 遍历目录收集文件
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                input_path = os.path.join(root, file)
                ext = os.path.splitext(file)[1].lower()
                if ext in image_extensions or ext in video_extensions:
                    files_to_process.append(input_path)
    
    total_files = len(files_to_process)
    print(f"找到 {total_files} 个可处理的文件")
    print("=" * 60)
    
    # 确保输出不被缓冲
    sys.stdout.flush()
    
    # 检查是否有可处理的文件
    if total_files == 0:
        print("未找到可处理的图片或视频文件")
        print("=" * 60)
        print("压缩完成!")
        print(f"总文件数: 0")
        print(f"成功压缩: 0")
        print(f"压缩失败: 0")
        sys.stdout.flush()
        sys.exit(3)  # 返回特殊退出码，表示未找到可处理文件
    
    # 处理所有文件
    for i, input_path in enumerate(files_to_process):
        # 计算进度百分比
        progress_percent = int((i + 1) / total_files * 100)
        print(f"处理进度: {progress_percent}% ({i + 1}/{total_files})")
        
        ext = os.path.splitext(input_path)[1].lower()
        
        # 生成输出路径
        if input_files:
            # 处理单个文件
            filename = os.path.basename(input_path)
            output_filename = get_output_filename(os.path.join(output_dir, filename))
        else:
            # 处理目录中的文件
            relative_path = os.path.relpath(os.path.dirname(input_path), input_dir)
            output_subdir = os.path.join(output_dir, relative_path)
            filename = os.path.basename(input_path)
            output_filename = get_output_filename(os.path.join(output_subdir, filename))
        
        # 执行压缩
        if ext in image_extensions:
            success, message = compress_image(input_path, output_filename, compression_rate)
        else:
            success, message = compress_video(input_path, output_filename, compression_rate, ffmpeg_path)
        
        # 输出结果
        print(message)
        
        # 确保输出不被缓冲
        sys.stdout.flush()
        
        if success:
            processed_files += 1
        else:
            failed_files += 1
    
    print("=" * 60)
    print(f"压缩完成!")
    print(f"总文件数: {total_files}")
    print(f"成功压缩: {processed_files}")
    print(f"压缩失败: {failed_files}")
    
    # 确保输出不被缓冲
    sys.stdout.flush()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python compress.py <输入目录> <输出目录> <压缩比例> [ffmpeg路径] [文件1] [文件2] ...")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    compression_rate = int(sys.argv[3])
    
    # 检查是否提供了ffmpeg路径
    if len(sys.argv) > 4 and not os.path.isfile(sys.argv[4]):
        # 第4个参数不是文件路径，说明没有提供ffmpeg路径
        ffmpeg_path = 'ffmpeg'
        input_files = sys.argv[4:] if len(sys.argv) > 4 else None
    else:
        # 第4个参数是文件路径，说明提供了ffmpeg路径
        ffmpeg_path = sys.argv[4] if len(sys.argv) > 4 else 'ffmpeg'
        input_files = sys.argv[5:] if len(sys.argv) > 5 else None
    
    # 验证参数
    if input_files:
        # 处理文件列表，不需要验证输入目录
        print(f"处理 {len(input_files)} 个文件")
    else:
        # 处理目录，需要验证输入目录
        if not os.path.exists(input_dir):
            print(f"错误: 输入目录不存在: {input_dir}")
            sys.exit(1)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    if compression_rate < 0 or compression_rate > 100:
        print("错误: 压缩比例必须在0-100之间")
        sys.exit(1)
    
    main(input_dir, output_dir, compression_rate, input_files, ffmpeg_path)