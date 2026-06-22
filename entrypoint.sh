#!/bin/bash
set -e

# =========================================
# ZeroTier Panel — 单容器入口脚本
# 同时管理 ZeroTier One 守护进程和 Node.js 面板
# =========================================

ZT_DATA_DIR="${ZT_DATA_DIR:-/var/lib/zerotier-one}"
PANEL_PORT="${PANEL_PORT:-3000}"

# ---- 清理函数：确保 ZeroTier 和 Node 被优雅关闭 ----
NODE_PID=""

cleanup() {
    echo "[entrypoint] 收到终止信号，正在关闭..."
    # 先通知 Node.js 优雅退出
    if [ -n "$NODE_PID" ] && kill -0 "$NODE_PID" 2>/dev/null; then
        kill "$NODE_PID" 2>/dev/null || true
        wait "$NODE_PID" 2>/dev/null || true
    fi
    # 关闭 ZeroTier 守护进程
    if [ -f /var/run/zerotier-one.pid ]; then
        kill $(cat /var/run/zerotier-one.pid) 2>/dev/null || true
    else
        pkill zerotier-one 2>/dev/null || true
    fi
    echo "[entrypoint] 已关闭"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# ---- 确保 TUN 设备可访问 ----
if [ -e /dev/net/tun ]; then
    chmod 666 /dev/net/tun 2>/dev/null || echo "[entrypoint] 警告: 无法 chmod /dev/net/tun"
fi

# ---- 启动 ZeroTier One 守护进程 ----
ZT_VERSION=$(zerotier-cli -v 2>/dev/null || echo "unknown")
echo "[entrypoint] 启动 ZeroTier One v${ZT_VERSION}..."
mkdir -p "$ZT_DATA_DIR"
/usr/sbin/zerotier-one -d

# ---- 等待 ZeroTier 就绪 (authtoken.secret 生成) ----
echo "[entrypoint] 等待 ZeroTier 就绪..."
i=0
while [ $i -lt 30 ]; do
    if [ -f "$ZT_DATA_DIR/authtoken.secret" ]; then
        echo "[entrypoint] ZeroTier One 已就绪"
        break
    fi
    sleep 1
    i=$((i + 1))
done

if [ ! -f "$ZT_DATA_DIR/authtoken.secret" ]; then
    echo "[entrypoint] 错误: authtoken.secret 未在 30 秒内生成"
    exit 1
fi

# 记录 ZeroTier 启动时间戳
date +%s000 > "$ZT_DATA_DIR/startup-time"
echo "[entrypoint] 启动时间已记录"

# ---- 从环境变量加入网络 (校验格式防路径遍历) ----
if [ -n "$ZEROTIER_JOIN_NETWORKS" ]; then
    echo "[entrypoint] 加入网络: $ZEROTIER_JOIN_NETWORKS"
    mkdir -p "$ZT_DATA_DIR/networks.d"
    for nid in $ZEROTIER_JOIN_NETWORKS; do
        if [ -n "$nid" ] && echo "$nid" | grep -qE '^[0-9a-fA-F]{16}$'; then
            touch "$ZT_DATA_DIR/networks.d/${nid}.conf"
            echo "[entrypoint]   已加入 $nid"
        else
            echo "[entrypoint]   跳过无效 Network ID: $nid"
        fi
    done
fi

# ---- 从环境变量写入 local.conf ----
if [ -n "$ZEROTIER_LOCAL_CONF" ]; then
    echo "[entrypoint] 写入 local.conf"
    echo "$ZEROTIER_LOCAL_CONF" > "$ZT_DATA_DIR/local.conf"
fi

# ---- 从环境变量写入 authtoken.secret ----
if [ -n "$ZEROTIER_API_SECRET" ]; then
    echo "[entrypoint] 写入 authtoken.secret"
    echo "$ZEROTIER_API_SECRET" > "$ZT_DATA_DIR/authtoken.secret"
    chmod 600 "$ZT_DATA_DIR/authtoken.secret"
fi

# ---- 从环境变量写入 identity 文件 ----
if [ -n "$ZEROTIER_IDENTITY_PUBLIC" ]; then
    echo "[entrypoint] 写入 identity.public"
    echo "$ZEROTIER_IDENTITY_PUBLIC" > "$ZT_DATA_DIR/identity.public"
fi
if [ -n "$ZEROTIER_IDENTITY_SECRET" ]; then
    echo "[entrypoint] 写入 identity.secret"
    echo "$ZEROTIER_IDENTITY_SECRET" > "$ZT_DATA_DIR/identity.secret"
    chmod 600 "$ZT_DATA_DIR/identity.secret"
fi

# ---- 启动 Node.js 面板 (后台, 保留 bash 处理信号) ----
echo "[entrypoint] 启动 ZeroTier Panel (端口: $PANEL_PORT)..."
echo "========================================="
node /app/server.js &
NODE_PID=$!
wait "$NODE_PID"
