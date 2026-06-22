/**
 * GET /api/peers — 节点列表
 */
module.exports = function (zt) {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { status, data } = await zt.getPeers();
      res.json({ success: status === 200, data: Array.isArray(data) ? data : [] });
    } catch (err) {
      res.status(503).json({ success: false, error: '无法获取节点信息', detail: err.message });
    }
  });
  return router;
};
