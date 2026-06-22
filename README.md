# ZeroTier Panel

一个轻量级的 ZeroTier One 管理面板，内置最新版 ZeroTier 守护进程。

## 特性

- 🚀 **单容器部署**：ZeroTier 守护进程 + Web 管理面板，一键启动
- 🔄 **自动跟版**：构建时从 GitHub API 获取最新 ZeroTier 版本
- 📡 **完整管理**：状态监控、网络加入/离开、节点管理、配置编辑
- 🎨 **暗色主题**：响应式 UI，支持桌面和移动端
- 🏗️ **多架构**：支持 amd64 / arm64

---

## Docker 部署操作手册

### 方式一：使用预构建镜像（推荐）

直接从 Docker Hub 拉取并运行：

#### 1. 拉取镜像

```bash
docker pull yinheng1989/zerotier-panel:latest
```

#### 2. 使用 Docker Compose 启动（推荐）

创建 `docker-compose.yml` 文件：

```yaml
services:
  panel:
    image: yinheng1989/zerotier-panel:latest
    container_name: zt-panel
    network_mode: host
    cap_add:
      - NET_ADMIN
      - SYS_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    volumes:
      - zt-data:/var/lib/zerotier-one
    environment:
      - PANEL_PORT=3000
      # 可选: 容器启动时自动加入的网络（空格分隔）
      # - ZEROTIER_JOIN_NETWORKS=your_network_id_here
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  zt-data:
```

启动：

```bash
docker compose up -d
```

#### 3. 使用 Docker CLI 启动

```bash
docker run -d \
  --name zt-panel \
  --network host \
  --cap-add NET_ADMIN \
  --cap-add SYS_ADMIN \
  --device /dev/net/tun:/dev/net/tun \
  -v zt-data:/var/lib/zerotier-one \
  -e PANEL_PORT=3000 \
  --restart unless-stopped \
  yinheng1989/zerotier-panel:latest
```

#### 4. 访问面板

打开浏览器访问：`http://<服务器IP>:3000`

---

### 方式二：本地构建

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/zerotier-panel.git
cd zerotier-panel
```

#### 2. 使用 build.sh 构建

```bash
# 默认：自动获取最新 ZeroTier 版本并构建
./build.sh

# 指定 ZeroTier 版本
./build.sh --zt-version 1.16.2

# 构建多架构（需要 buildx）
./build.sh --platform linux/amd64,linux/arm64
```

#### 3. 启动

```bash
docker compose up -d
```

---

### 方式三：直接使用 Dockerfile 构建

```bash
# 构建
docker build -t zerotier-panel .

# 运行
docker run -d --name zt-panel \
  --network host \
  --cap-add NET_ADMIN \
  --cap-add SYS_ADMIN \
  --device /dev/net/tun:/dev/net/tun \
  -v zt-data:/var/lib/zerotier-one \
  zerotier-panel
```

---

### 环境变量说明

| 变量                         | 默认值                  | 说明                              |
| ---------------------------- | ----------------------- | --------------------------------- |
| `PANEL_PORT`                 | `3000`                  | Web 面板监听端口                   |
| `ZT_API_HOST`                | `127.0.0.1`             | ZeroTier API 地址                  |
| `ZT_API_PORT`                | `9993`                  | ZeroTier API 端口                  |
| `ZT_DATA_DIR`                | `/var/lib/zerotier-one` | ZeroTier 数据目录                  |
| `ZEROTIER_JOIN_NETWORKS`     | (空)                    | 启动时自动加入的网络 ID（空格分隔） |
| `ZEROTIER_LOCAL_CONF`        | (空)                    | 自定义 local.conf 内容             |
| `ZEROTIER_API_SECRET`        | (空)                    | 自定义 API 密钥（覆盖自动生成的）   |
| `ZEROTIER_IDENTITY_PUBLIC`   | (空)                    | 自定义公钥（节点迁移用）            |
| `ZEROTIER_IDENTITY_SECRET`   | (空)                    | 自定义私钥（节点迁移用）            |

---

### 容器管理

```bash
# 查看日志
docker compose logs -f

# 停止容器
docker compose down

# 更新镜像并重启（生产环境）
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 进入容器
docker exec -it zt-panel bash

# 在容器内使用 ZeroTier CLI
docker exec zt-panel zerotier-cli status
docker exec zt-panel zerotier-cli listnetworks
```

---

### 常见问题

**Q: 容器启动后无法访问面板？**
A: 请确认使用 `network_mode: host` 或正确映射了端口，并检查防火墙规则。

**Q: ZeroTier 节点无法连接网络？**
A: 确保容器添加了 `--cap-add NET_ADMIN`、`--cap-add SYS_ADMIN` 和 `--device /dev/net/tun` 权限。

**Q: 如何迁移节点身份到新服务器？**
A: 将旧服务器的 `zt-data` volume 数据迁移到新服务器，或使用 `ZEROTIER_IDENTITY_PUBLIC` / `ZEROTIER_IDENTITY_SECRET` 环境变量注入。

---

## 多架构发布（维护者用）

```bash
# 一键发布到 Docker Hub（自动获取最新 ZT 版本，构建 amd64 + arm64）
./publish.sh

# 指定版本发布
ZT_VERSION=1.16.2 ./publish.sh
```

---

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
