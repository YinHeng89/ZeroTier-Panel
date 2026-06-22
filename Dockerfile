# ========================================
# ZeroTier Panel — 单容器 Docker 镜像
# ========================================
# 构建:  docker build -t zerotier-panel .
# 可选:  docker build --build-arg ZT_VERSION=1.16.2 -t zerotier-panel .
#        默认由 build.sh 自动获取 GitHub 最新版, 此处为回退值
# 运行:  docker run -d --name zt-panel \
#          --cap-add NET_ADMIN --cap-add SYS_ADMIN \
#          --device /dev/net/tun \
#          -p 3000:3000 \
#          -v zt-data:/var/lib/zerotier-one \
#          zerotier-panel
# ========================================

FROM node:20-bookworm-slim

ARG ZT_VERSION=1.16.2

# ---- 安装 ZeroTier One (从官方 APT 仓库) ----
# 注意: bookworm-slim 比 bookworm 小约 250MB, 需手动装少数工具
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    mkdir -p /usr/share/zerotier && \
    curl -fsSL -o /usr/share/zerotier/tmp.asc "https://download.zerotier.com/contact%40zerotier.com.gpg" && \
    gpg --no-default-keyring --keyring /usr/share/zerotier/zerotier.gpg --import /usr/share/zerotier/tmp.asc && \
    rm -f /usr/share/zerotier/tmp.asc && \
    echo "deb [signed-by=/usr/share/zerotier/zerotier.gpg] http://download.zerotier.com/debian/bookworm bookworm main" > /etc/apt/sources.list.d/zerotier.list && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends zerotier-one=${ZT_VERSION} && \
    rm -rf /var/lib/zerotier-one && \
    apt-get purge -y gnupg && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ---- 安装面板 (Node.js) ----
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --production --ignore-scripts; \
    else \
      npm install --production --ignore-scripts; \
    fi
COPY server/ ./
COPY public/ ./public/

# ---- 入口脚本 ----
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ---- 环境变量 ----
ENV PANEL_PORT=3000
ENV ZT_API_HOST=127.0.0.1
ENV ZT_API_PORT=9993
ENV ZT_DATA_DIR=/var/lib/zerotier-one

EXPOSE 3000
EXPOSE 9993/udp

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3000/api/status || exit 1

ENTRYPOINT ["/entrypoint.sh"]
