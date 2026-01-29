#!/bin/bash
# 创建简单的 40x40 灰色 PNG 图标
for name in calendar calendar-active family family-active memory memory-active profile profile-active; do
  # 使用 base64 编码的最小 PNG (1x1 透明像素)
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > ${name}.png
done
