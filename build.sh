#!/bin/bash
#
# ZeroTier Panel - Docker Build Script (单容器)
# 用法: ./build.sh [选项]
#
# 选项:
#   --tag <tag>        自定义镜像标签 (默认: zerotier-panel:latest)
#   --zt-version <ver> 指定 ZeroTier 版本 (默认: 自动获取最新版)
#                      可用 "latest" 自动获取, 或直接指定如 "1.16.2"
#   --push             构建后推送到 registry
#   --platform <plat>  指定目标平台 (如: linux/amd64,linux/arm64)
#   --help             显示帮助
#

set -e

# 默认配置
IMAGE_NAME="zerotier-panel"
IMAGE_TAG="latest"
ZT_VERSION="latest"
PUSH=false
PLATFORM=""
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --zt-version)
      ZT_VERSION="$2"
      shift 2
      ;;
    --push)
      PUSH=true
      shift
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --help|-h)
      echo "用法: ./build.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --tag <tag>        自定义镜像标签 (默认: latest)"
      echo "  --zt-version <ver> 指定 ZeroTier 版本 (默认: 自动获取最新)"
      echo "                     可用 'latest' 自动获取, 或如 '1.16.2'"
      echo "  --push             构建后推送到 registry"
      echo "  --platform <plat>  指定目标平台 (如: linux/amd64,linux/arm64)"
      echo "  --help             显示帮助"
      exit 0
      ;;
    *)
      log_error "未知参数: $1"
      exit 1
      ;;
  esac
done

FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# ---- 自动获取最新 ZeroTier 版本 ----
if [ "$ZT_VERSION" = "latest" ] || [ "$ZT_VERSION" = "auto" ]; then
  log_info "正在查询 ZeroTier 最新版本..."
  DETECTED=$(get_latest_zt_version)
  if [ -n "$DETECTED" ]; then
    ZT_VERSION="$DETECTED"
    log_ok "已获取最新版本: v${ZT_VERSION}"
  else
    log_warn "无法获取最新版本, 使用回退版本"
    ZT_VERSION="1.16.2"
  fi
fi

echo ""
echo "=========================================="
echo "  ZeroTier Panel - Docker Build"
echo "=========================================="
echo ""
log_info "镜像:         ${FULL_IMAGE}"
log_info "ZeroTier:     v${ZT_VERSION}"
log_info "目录:         ${SCRIPT_DIR}"
[ -n "$PLATFORM" ] && log_info "平台:         ${PLATFORM}"
echo ""

# 检查 Docker 是否可用
if ! command -v docker &> /dev/null; then
  log_error "Docker 未安装或不在 PATH 中"
  exit 1
fi

log_ok "Docker 已就绪: $(docker --version)"

# 构建镜像
log_info "开始构建镜像..."
echo ""

BUILD_ARGS=(--build-arg "ZT_VERSION=${ZT_VERSION}")
[ -n "$PLATFORM" ] && BUILD_ARGS+=(--platform "$PLATFORM")

echo ">>> docker build ${BUILD_ARGS[*]} -t ${FULL_IMAGE} ${SCRIPT_DIR}"
echo ""

if docker build "${BUILD_ARGS[@]}" -t "${FULL_IMAGE}" "${SCRIPT_DIR}"; then
  echo ""
  log_ok "镜像构建成功!"
  echo ""

  # 显示镜像信息
  docker images ${FULL_IMAGE}
  echo ""

  # 推送
  if [ "$PUSH" = true ]; then
    log_info "推送镜像 ${FULL_IMAGE}..."
    docker push ${FULL_IMAGE}
    log_ok "镜像推送完成!"
  fi

  echo "=========================================="
  echo "  构建完成!"
  echo "=========================================="
  echo ""
  echo "启动命令 (单容器):"
  echo "  docker run -d --name zt-panel \\"
  echo "    --cap-add NET_ADMIN --cap-add SYS_ADMIN \\"
  echo "    --device /dev/net/tun:/dev/net/tun \\"
  echo "    --network host \\"
  echo "    -v zt-data:/var/lib/zerotier-one \\"
  echo "    ${FULL_IMAGE}"
  echo ""
  echo "或使用 docker-compose:"
  echo "  docker compose up -d"
  echo ""
  echo "访问面板: http://<设备IP>:3000"
  echo ""
else
  log_error "镜像构建失败!"
  exit 1
fi
