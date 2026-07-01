/**
 * GET /api/check-update — 检查 ZeroTier 最新版本
 * 访问 GitHub API 获取最新 release 版本号
 */
const https = require('https');

module.exports = function (zt) {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      // 获取当前运行版本
      const { data: ztStatus } = await zt.getStatus();
      const currentVersion = (ztStatus.version || '0.0.0').replace(/^v/i, '');

      // 从 GitHub 获取最新 release 版本
      const latestVersion = await fetchLatestVersion();

      res.json({
        success: true,
        data: {
          currentVersion,
          latestVersion,
          hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
        },
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: '检查更新失败',
        detail: err.message,
      });
    }
  });

  return router;
};

function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://api.github.com/repos/zerotier/ZeroTierOne/releases/latest',
      {
        headers: { 'User-Agent': 'ZeroTier-Panel/1.0' },
        timeout: 10000,
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const tag = parsed.tag_name || '';
            const version = tag.replace(/^v/i, '');
            if (!version) return reject(new Error('无法解析版本号'));
            resolve(version);
          } catch (e) {
            reject(new Error('解析 GitHub 响应失败: ' + e.message));
          }
        });
      },
    );
    req.on('error', (e) => reject(new Error('请求 GitHub API 失败: ' + e.message)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GitHub API 请求超时'));
    });
  });
}

/** 简单的语义化版本比较，返回正数表示 v1 > v2 */
function compareVersions(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}
