/**
 * ZeroTier Panel - Networks Page
 */

const NetworksPage = {
  init() {
    this.refresh();
    // Auto refresh every 20 seconds
    setInterval(() => this.refresh(), 20000);

    // Enter key to join
    document.getElementById('networkIdInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.join();
    });
  },

  async refresh() {
    const container = document.getElementById('networksList');
    try {
      const res = await API.get('/networks');
      const networks = res.data || res;
      const netList = Array.isArray(networks) ? networks : Object.values(networks || {});
      if (netList.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无已加入的网络<br><small style="color:var(--text-muted);margin-top:8px;display:block">输入 Network ID 加入你的第一个网络</small></div>';
        return;
      }
      this.render(netList);
    } catch (err) {
      container.innerHTML = `<div class="empty-state" style="color:var(--danger)">加载失败: ${escapeHtml(err.message)}</div>`;
    }
  },

  render(netList) {
    const container = document.getElementById('networksList');
    container.innerHTML = netList.map((net) => {
      const status = net.status || 'UNKNOWN';
      const statusClass = status === 'OK' ? 'ok' : status === 'ACCESS_DENIED' ? 'error' : 'pending';
      const addrs = net.assignedAddresses || [];
      const ipv4 = addrs.filter((a) => !a.includes(':'));
      const ipv6 = addrs.filter((a) => a.includes(':'));
      const routes = (net.routes || []).map((r) => r.target).join(', ') || '无';
      const name = net.name || '未命名网络';
      const type = net.type === 'PRIVATE' ? '私有' : '公共';
      const mac = net.mac || '--';

      const detailItems = [
        ipv4.length > 0 ? { label: 'IPv4', value: ipv4.join(', ') } : null,
        ipv6.length > 0 ? { label: 'IPv6', value: ipv6.join(', ') } : null,
        { label: '路由', value: routes },
        { label: 'MAC', value: mac },
      ].filter(Boolean);

      return `
        <div class="net-card">
          <span class="net-status ${statusClass}" title="${escapeHtml(status)}"></span>
          <div class="net-info">
            <div class="net-title">
              <span class="net-name">${escapeHtml(name)}</span>
              <span class="net-id">${escapeHtml(net.id || '')}</span>
              <span class="badge ${type === '私有' ? 'badge-warning' : 'badge-info'}">${type}</span>
            </div>
            <div class="net-tags">
              ${detailItems.map(d => `
                <span class="net-tag">
                  <span class="net-tag-label">${escapeHtml(d.label)}</span>
                  <span class="net-tag-value" title="${escapeHtml(d.value)}">${escapeHtml(d.value)}</span>
                </span>
              `).join('')}
            </div>
          </div>
          <button class="btn btn-danger net-leave-btn" onclick="NetworksPage.leave('${escapeHtml(net.id)}')">离开</button>
        </div>
      `;
    }).join('');
  },

  async join() {
    const input = document.getElementById('networkIdInput');
    const btn = document.getElementById('joinBtn');
    const networkId = input.value.trim();

    if (!networkId || !/^[0-9a-fA-F]{16}$/.test(networkId)) {
      Toast.error('请输入有效的 16 位 Network ID');
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = '加入中...';

    try {
      await API.post(`/networks/${networkId}`);
      Toast.success(`已成功加入网络 ${networkId}`);
      input.value = '';
      this.refresh();
    } catch (err) {
      Toast.error(`加入失败: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = '加入';
    }
  },

  async leave(networkId) {
    // 第一次确认
    if (!confirm(`确定要离开网络 ${networkId} 吗？\n\n此操作将断开该网络的连接。`)) {
      return;
    }

    // 第二次确认（更强烈的警告）
    const userConfirmed = prompt(
      `请输入 Network ID 的前 8 位 "${networkId.substring(0, 8)}" 以确认离开网络：`,
      ''
    );
    
    if (userConfirmed !== networkId.substring(0, 8)) {
      Toast.error('输入不匹配，操作已取消');
      return;
    }

    try {
      await API.del(`/networks/${networkId}`);
      Toast.success(`已离开网络 ${networkId}`);
      this.refresh();
    } catch (err) {
      Toast.error(`离开失败: ${err.message}`);
    }
  },
};
