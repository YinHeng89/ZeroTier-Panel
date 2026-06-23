/**
 * ZeroTier Panel - Status Page
 */

const StatusPage = {

  init() {
    this.refresh();
    // Auto refresh every 15 seconds
    setInterval(() => this.refresh(), 15000);
  },

  async refresh() {
    try {
      const res = await API.get('/status');
      const status = res.data || res;
      this.render(status);

      // Also fetch network count
      const netRes = await API.get('/networks');
      const networks = netRes.data || netRes;
      const count = networks && typeof networks === 'object' ? Object.keys(networks).length : 0;
      document.getElementById('statNetworkCount').textContent = count;
    } catch (err) {
      document.getElementById('statOnline').textContent = '无法连接';
      document.getElementById('statOnline').style.color = 'var(--danger)';
    }
  },

  render(status) {
    // Stats cards
    const onlineEl = document.getElementById('statOnline');
    onlineEl.textContent = status.online ? '在线' : '离线';
    onlineEl.style.color = status.online ? 'var(--success)' : 'var(--danger)';

    document.getElementById('statAddress').textContent = status.address || '--';
    document.getElementById('statVersion').textContent = status.version || '--';

    // Details table
    const tbody = document.getElementById('statusDetails');
    const rows = [
      ['节点地址 (Address)', status.address || '--'],
      ['版本 (Version)', status.version || '--'],
      ['在线状态', status.online ? '在线' : '离线'],
      ['TCP 回退', status.tcpFallbackActive ? '启用' : '未启用'],
      ['公共身份 (Public Key)', status.publicIdentity ? status.publicIdentity.substring(0, 60) + '...' : '--'],
    ];

    if (status.startupTime) {
      rows.push(['服务启动时间', new Date(parseInt(status.startupTime, 10)).toLocaleString('zh-CN')]);
    }
    if (status.uptime) {
      rows.push(['已运行时长', formatUptime(status.uptime)]);
    }

    tbody.innerHTML = rows.map(([label, value]) => `
      <tr>
        <td class="label">${escapeHtml(label)}</td>
        <td class="value">${escapeHtml(String(value))}</td>
      </tr>
    `).join('');
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0) parts.push(`${h} 小时`);
  if (m > 0 || parts.length === 0) parts.push(`${m} 分钟`);
  return parts.join(' ');
}