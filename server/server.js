/**
 * ZeroTier Panel — 后端服务
 * 生产模式：连接 ZeroTier 守护进程 API
 */
const express = require('express');
const path = require('path');
const app = express();

const PORT = parseInt(process.env.PANEL_PORT, 10) || 3000;
const STATIC_DIR = path.join(__dirname, 'public');

// ---- 中间件 ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.path} ${duration}ms`);
  });
  next();
});

// CORS 中间件
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.options('*', (_req, res) => res.sendStatus(204));

// ---- 路由 ----
const zt = require('./zt');
app.use('/api/status',    require('./routes/status')(zt));
app.use('/api/networks',  require('./routes/networks')(zt));
app.use('/api/peers',     require('./routes/peers')(zt));
app.use('/api/config',    require('./routes/config')(zt));
app.use('/api/service',   require('./routes/service')(zt));

// ---- 静态文件 ----
app.use(express.static(STATIC_DIR));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ success: false, error: 'API 不存在' });
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ---- 全局错误处理中间件 ----
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  console.error(err.stack);
  
  // 防止 Headers 已发送的错误
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '服务器错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ---- 启动 ----
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  ZeroTier Panel Server');
  console.log('========================================');
  console.log(`  端口:      ${PORT}`);
  console.log(`  ZT API:    ${process.env.ZT_API_HOST || '127.0.0.1'}:${process.env.ZT_API_PORT || '9993'}`);
  console.log(`  数据目录:  ${process.env.ZT_DATA_DIR || '/var/lib/zerotier-one'}`);
  console.log(`  访问:      http://localhost:${PORT}`);
  console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  app.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  app.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
