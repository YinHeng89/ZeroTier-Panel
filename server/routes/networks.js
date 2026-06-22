/**
 * GET    /api/networks       — 网络列表
 * POST   /api/networks/:id   — 加入网络
 * DELETE /api/networks/:id   — 离开网络
 */
module.exports = function (zt) {
  const router = require('express').Router();
  router.get('/', async (req, res) => {
    try {
      const { data } = await zt.getNetworkList();
      const networks = Array.isArray(data) ? data : [];
      const mapped = {};
      for (const net of networks) {
        const id = net.id || net.nwid;
        if (id) mapped[id] = net;
      }
      res.json({ success: true, data: mapped });
    } catch (err) {
      res.status(503).json({ success: false, error: '无法获取网络列表', detail: err.message });
    }
  });

  function validateNetworkId(id) {
    return /^[0-9a-fA-F]{16}$/.test(id);
  }

  router.post('/:id', async (req, res) => {
    const { id } = req.params;
    if (!validateNetworkId(id)) {
      return res.status(400).json({ success: false, error: '无效的 Network ID (需为16位十六进制)' });
    }
    try {
      const { status, data } = await zt.joinNetwork(id);
      res.status(status).json({ success: status === 200, data });
    } catch (err) {
      res.status(503).json({ success: false, error: '加入网络失败', detail: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!validateNetworkId(id)) {
      return res.status(400).json({ success: false, error: '无效的 Network ID (需为16位十六进制)' });
    }
    try {
      const { status, data } = await zt.leaveNetwork(id);
      res.status(status).json({ success: status === 200, data });
    } catch (err) {
      res.status(503).json({ success: false, error: '离开网络失败', detail: err.message });
    }
  });

  return router;
};
