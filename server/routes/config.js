/**
 * GET /api/config — 读取 local.conf
 * PUT /api/config — 写入 local.conf
 */
const fs = require('fs');
const path = require('path');

const ZT_DATA_DIR = process.env.ZT_DATA_DIR || '/var/lib/zerotier-one';
const MAX_CONFIG_SIZE = 1024 * 1024; // 1MB 限制

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
      // 1. 验证请求体是否为对象
      if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        return res.status(400).json({ 
          success: false, 
          error: '配置必须是 JSON 对象' 
        });
      }

      // 2. 序列化配置
      let content;
      try {
        content = JSON.stringify(req.body, null, 2);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: '配置序列化失败: ' + e.message
        });
      }

      // 3. 检查文件大小限制
      if (content.length > MAX_CONFIG_SIZE) {
        return res.status(400).json({
          success: false,
          error: `配置文件过大 (${content.length} > ${MAX_CONFIG_SIZE} 字节)`
        });
      }

      // 4. 写入文件
      const configPath = path.join(ZT_DATA_DIR, 'local.conf');
      fs.writeFileSync(configPath, content, 'utf8');
      
      res.json({ 
        success: true, 
        message: '配置已保存，重启 ZeroTier 后生效',
        size: content.length
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        error: '保存配置失败', 
        detail: err.message 
      });
    }
  });

  return router;
};
