/**
 * 路由: 服务控制
 * GET /api/service/status  — ZT 守护进程运行状态
 */
module.exports = function (zt) {
  const router = require('express').Router();

  router.get('/status', async (req, res) => {
    const running = await zt.ztRequest('GET', '/status')
      .then(() => true)
      .catch(() => false);
    res.json({ success: true, data: { running } });
  });

  return router;
};
