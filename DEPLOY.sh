#!/bin/bash

# 1. 执行本地构建（可选）
# npm run build

# 2. 同步到服务器
echo "正在部署到远程服务器..."
rsync -avz --delete ./dist/ pz:/home/ubuntu/preview/pixel-tetris/

echo "部署完成！"
