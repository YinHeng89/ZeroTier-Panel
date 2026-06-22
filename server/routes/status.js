/**
 * GET /api/status — 系统状态
 */
const fs = require('fs');
const path = require('path');

const ZT_DATA_DIR = process.env.ZT_DATA_DIR || '/var/lib/zerotier-one';

module.exports = function (zt) {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { data } = await zt.getStatus();
      // 读取 ZeroTier 启动时间戳 (由 entrypoint.sh 写入)
      const startupFile = path.join(ZT_DATA_DIR, 'startup-time');
      if (fs.existsSync(startupFile)) {
        data.startupTime = parseInt(fs.readFileSync(startupFile, 'utf8'), 10);
      }
      // 运行时长 = 当前时间 - 启动时间
      if (data.startupTime && data.clock) {
        data.uptime = data.clock - data.startupTime;
      }
      res.json({ success: true, data });
    } catch (err) {
      res.status(503).json({ success: false, error: 'ZeroTier 服务未运行', detail: err.message });
    }
  });
  return router;
};
