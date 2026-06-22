# ZeroTier Panel

一个轻量级的 ZeroTier One 管理面板，内置最新版 ZeroTier 守护进程。

## 特性

- 🚀 **单容器部署**：ZeroTier 守护进程 + Web 管理面板，一键启动
- 🔄 **自动跟版**：构建时从 GitHub API 获取最新 ZeroTier 版本
- 📡 **完整管理**：状态监控、网络加入/离开、节点管理、配置编辑
- 🎨 **暗色主题**：响应式 UI，支持桌面和移动端
- 🏗️ **多架构**：支持 amd64 / arm64

## 快速开始

```bash
# 本地构建 & 运行
./build.sh
docker compose up -d

# 访问面板
open http://localhost:3000
```

## 生产部署

```bash
# 一键发布 (多架构推送 Docker Hub)
./publish.sh

# 在生产服务器上
docker compose -f docker-compose.prod.yml up -d
```

## 构建选项

```bash
# 指定 ZeroTier 版本
./build.sh --zt-version 1.16.2

# 自动获取最新版本 (默认)
./build.sh

# 多架构构建
./build.sh --platform linux/amd64,linux/arm64

# 构建并推送
./build.sh --push
```

## 项目结构

```
├── Dockerfile              # 单容器镜像构建
├── entrypoint.sh           # 容器入口 (启动 ZT + 面板)
├── docker-compose.yml      # 开发环境
├── docker-compose.prod.yml # 生产环境
├── build.sh                # 本地构建脚本
├── publish.sh              # 多架构发布脚本
├── server/                 # Node.js 后端
│   ├── server.js           # Express 主入口
│   ├── zt.js               # ZeroTier API 客户端
│   └── routes/             # API 路由
└── public/                 # 前端 SPA
    ├── index.html
    ├── css/style.css
    └── js/                 # 页面逻辑
```

## 技术栈

- **运行时**: Node.js 20
- **后端**: Express.js
- **前端**: 原生 JS (零依赖 SPA)
- **容器**: Docker (基于 Debian Bookworm)
- **网络**: ZeroTier One (官方 APT 安装)

## License

MIT
