/**
 * GET /api/config — 读取 local.conf
 * PUT /api/config — 写入 local.conf
 */
const fs = require('fs');
const path = require('path');

const ZT_DATA_DIR = process.env.ZT_DATA_DIR || '/var/lib/zerotier-one';

module.exports = function () {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const configPath = path.join(ZT_DATA_DIR, 'local.conf');
      if (!fs.existsSync(configPath)) {
        return res.json({ success: true, data: {} });
      }
      const raw = fs.readFileSync(configPath, 'utf8');
      let config;
      try {
        config = JSON.parse(raw);
      } catch {
        config = { _raw: raw, _error: '配置不是有效 JSON' };
      }
      res.json({ success: true, data: config });
    } catch (err) {
      res.status(500).json({ success: false, error: '读取配置失败', detail: err.message });
    }
  });

  router.put('/', async (req, res) => {
    try {
      const configPath = path.join(ZT_DATA_DIR, 'local.conf');
      fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf8');
      res.json({ success: true, message: '配置已保存，重启 ZeroTier 后生效' });
    } catch (err) {
      res.status(500).json({ success: false, error: '保存配置失败', detail: err.message });
    }
  });

  return router;
};
