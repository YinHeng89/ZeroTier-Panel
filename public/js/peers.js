/**
 * ZeroTier Panel - Peers Page
 */

const PeersPage = {
  init() {
    this.refresh();
    // Auto refresh every 20 seconds
    setInterval(() => this.refresh(), 20000);
  },

  async refresh() {
    const tbody = document.getElementById('peersTableBody');
    try {
      const res = await API.get('/peers');
      const peers = res.data || res;
      if (!Array.isArray(peers) || peers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无已连接的节点</td></tr>';
        return;
      }
      this.render(peers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:var(--danger)">加载失败: ${escapeHtml(err.message)}</td></tr>`;
    }
  },

  render(peers) {
    const tbody = document.getElementById('peersTableBody');

    // Sort: direct connections first, then by latency
    peers.sort((a, b) => {
      const aDirect = (a.paths || []).some((p) => p.preferred && !p.relayed);
      const bDirect = (b.paths || []).some((p) => p.preferred && !p.relayed);
      if (aDirect && !bDirect) return -1;
      if (!aDirect && bDirect) return 1;
      const aLat = a.latency || 9999;
      const bLat = b.latency || 9999;
      return aLat - bLat;
    });

    tbody.innerHTML = peers.map((peer) => {
      const address = peer.address || '--';
      const version = (peer.versionMajor != null && peer.versionMajor >= 0)
        ? `${peer.versionMajor}.${peer.versionMinor}.${peer.versionRev}`
        : '/';
      const latency = peer.latency !== undefined && peer.latency !== -1 ? `${peer.latency}ms` : '--';
      const role = this.getRole(peer.role);
      const connectionType = this.getConnectionType(peer.paths || []);

      return `
        <tr>
          <td><span class="mono">${escapeHtml(address)}</span></td>
          <td>${escapeHtml(version)}</td>
          <td>${escapeHtml(latency)}</td>
          <td><span class="badge ${role.badge}">${role.label}</span></td>
          <td>${connectionType}</td>
        </tr>
      `;
    }).join('');
  },

  getRole(role) {
    const roles = {
      LEAF: { label: 'Leaf', badge: 'badge-info' },
      MOON: { label: 'Moon', badge: 'badge-warning' },
      PLANET: { label: 'Planet', badge: 'badge-success' },
    };
    return roles[role] || { label: role || 'Unknown', badge: 'badge-info' };
  },

  getConnectionType(paths) {
    if (!paths || paths.length === 0) {
      return '<span class="badge badge-danger">未连接</span>';
    }

    const preferred = paths.find((p) => p.preferred) || paths[0];

    if (preferred.relayed) {
      return '<span class="badge badge-warning">中继 (Relayed)</span>';
    }

    return `<span class="badge badge-success">直连 (Direct)</span>`;
  },
};
