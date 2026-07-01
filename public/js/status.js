/**
 * ZeroTier Panel - Status Page
 */

// ---- SVG 图标工厂 ----
function svgIcon(pathD, extraAttrs = '') {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" ${extraAttrs} style="vertical-align:middle">${pathD}</svg>`;
}
const ICONS = {
  refresh:   svgIcon('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
  spinner:   svgIcon('<path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>', 'class="spin-icon"'),
  arrowUp:   svgIcon('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  check:     svgIcon('<polyline points="20 6 9 17 4 12"/>'),
  cross:     svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
};

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
    const versionHtml = `<span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      ${escapeHtml(status.version || '--')}
      <button class="btn btn-xs btn-outline" onclick="StatusPage.checkUpdate(this)" style="display:inline-flex;align-items:center;gap:4px">
        ${ICONS.refresh} 检测更新
      </button>
    </span>`;

    const rows = [
      ['节点地址 (Address)', status.address || '--'],
      ['版本 (Version)', versionHtml, true],
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

    tbody.innerHTML = rows.map(([label, value, isHtml]) => `
      <tr>
        <td class="label">${escapeHtml(label)}</td>
        <td class="value">${isHtml ? value : escapeHtml(String(value))}</td>
      </tr>
    `).join('');
  },

  async checkUpdate(btn) {
    // 禁用按钮，显示加载状态
    btn.disabled = true;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `${ICONS.spinner} 检查中...`;

    try {
      const res = await API.get('/check-update');
      const { currentVersion, latestVersion, hasUpdate } = res.data;

      if (hasUpdate) {
        btn.innerHTML = `${ICONS.arrowUp} v${latestVersion} 可用`;
        btn.style.borderColor = 'var(--warning)';
        btn.style.color = 'var(--warning)';
        Toast.show(
          `发现新版本: v${currentVersion} → v${latestVersion}，可前往 GitHub 下载更新。`,
          'warning', 8000,
        );
      } else {
        btn.innerHTML = `${ICONS.check} 已是最新`;
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        Toast.success(`当前 v${currentVersion} 已是最新版本`);
      }

      // 8 秒后恢复按钮状态
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 8000);
    } catch (err) {
      btn.innerHTML = `${ICONS.cross} 检查失败`;
      btn.style.borderColor = 'var(--danger)';
      btn.style.color = 'var(--danger)';
      Toast.error('检查更新失败: ' + err.message);

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 5000);
    }
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