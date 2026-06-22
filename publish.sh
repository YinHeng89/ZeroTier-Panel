#!/bin/bash
set -e

# ==================== 配置 ====================
DOCKER_USER="yinheng1989"
IMAGE_NAME="zerotier-panel"
ZT_VERSION="${ZT_VERSION:-latest}"
VERSION=$(date +%Y%m%d-%H%M)

cd "$(dirname "$0")"

# ---- 从 GitHub API 获取 ZeroTier 最新版本 ----
get_latest_zt_version() {
  local latest
  latest=$(curl -fsS --connect-timeout 5 --max-time 10 \
    "https://api.github.com/repos/zerotier/ZeroTierOne/releases/latest" \
    2>/dev/null | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  if [ -z "$latest" ]; then
    echo ""
  else
    echo "$latest"
  fi
}

# ---- 自动获取最新版本 ----
if [ "$ZT_VERSION" = "latest" ] || [ "$ZT_VERSION" = "auto" ]; then
  echo ">>> 正在查询 ZeroTier 最新版本..."
  DETECTED=$(get_latest_zt_version)
  if [ -n "$DETECTED" ]; then
    ZT_VERSION="$DETECTED"
    echo ">>> 已获取最新版本: v${ZT_VERSION}"
  else
    echo ">>> 警告: 无法获取最新版本, 使用回退版本 1.16.2"
    ZT_VERSION="1.16.2"
  fi
fi

echo "========================================"
echo "  ZeroTier Panel 打包发布 (单容器)"
echo "  镜像:     ${DOCKER_USER}/${IMAGE_NAME}"
echo "  版本:     ${VERSION}"
echo "  ZeroTier: v${ZT_VERSION}"
echo "========================================"

# ---- 1. 登录 ----
echo ""
echo "[1/4] 检查 Docker Hub 登录状态..."
DOCKER_CONFIG="${DOCKER_CONFIG:-$HOME/.docker}"
if ! grep -q '"https://index.docker.io/v1/"' "$DOCKER_CONFIG/config.json" 2>/dev/null; then
  echo "⚠️  未登录 Docker Hub，请登录："
  docker login
fi

# ---- 2. 创建/使用 buildx builder ----
echo ""
echo "[2/4] 检查 buildx builder..."
if ! docker buildx ls | grep -q "zt-builder"; then
  docker buildx create --name zt-builder --use
else
  docker buildx use zt-builder
fi
docker buildx inspect --bootstrap

# ---- 3. 构建并推送（多架构） ----
echo ""
echo "[3/4] 构建并推送多架构镜像 (amd64 + arm64)..."
docker buildx build \
  --no-cache \
  --platform linux/amd64,linux/arm64 \
  --build-arg ZT_VERSION=${ZT_VERSION} \
  -t ${DOCKER_USER}/${IMAGE_NAME}:latest \
  -t ${DOCKER_USER}/${IMAGE_NAME}:${VERSION} \
  --push \
  .

# ---- 4. 摘要 ----
echo ""
echo "[4/4] ✅ 发布完成！"
echo ""
echo "  镜像地址:"
echo "    ${DOCKER_USER}/${IMAGE_NAME}:latest"
echo "    ${DOCKER_USER}/${IMAGE_NAME}:${VERSION}"
echo ""
echo "  生产部署 (单容器):"
echo "    docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  注意: 此镜像内置 ZeroTier One v${ZT_VERSION} + 面板，"
echo "        无需额外运行 zerotier/zerotier 容器。"
