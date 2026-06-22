/**
 * ZeroTier Panel - Main App Logic
 * SPA routing, navigation, toast, API helper
 */

// ==================== API Helper ====================
const API = {
  async get(url) {
    const res = await fetch(`/api${url}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
  async post(url, body = {}) {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
  async put(url, body = {}) {
    const res = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
  async del(url) {
    const res = await fetch(`/api${url}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
};

// ==================== Toast ====================
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
};

// ==================== Navigation ====================
const pages = {
  status: { title: '系统状态', init: () => StatusPage.init() },
  networks: { title: '网络管理', init: () => NetworksPage.init() },
  peers: { title: '节点信息', init: () => PeersPage.init() },
  config: { title: '配置管理', init: () => ConfigPage.init() },
  service: { title: '服务控制', init: () => ServicePage.init() },
};

const pageInited = {};

function navigateTo(page) {
  if (!pages[page]) page = 'status';

  // Update URL hash
  if (window.location.hash !== `#${page}`) {
    history.replaceState(null, '', `#${page}`);
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Show/hide pages
  document.querySelectorAll('.page').forEach((el) => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  // Update title
  document.getElementById('pageTitle').textContent = pages[page].title;

  // Initialize page if needed
  if (!pageInited[page]) {
    pageInited[page] = true;
    pages[page].init();
  }

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

// ==================== Connection Check ====================
async function checkConnection() {
  const dot = document.getElementById('connectionDot');
  const text = document.getElementById('connectionText');
  try {
    const res = await API.get('/status');
    const status = res.data || res;
    dot.className = `status-dot ${status.online ? 'online' : 'offline'}`;
    text.textContent = status.online ? '在线' : '离线';

    // Update sidebar node ID
    const nodeId = document.getElementById('sidebarNodeId');
    nodeId.textContent = status.address || '--';

    return status;
  } catch (err) {
    dot.className = 'status-dot offline';
    text.textContent = '无法连接';
    return null;
  }
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
  // Nav click handlers
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  // Mobile menu toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('menuBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on outside click (mobile)
  document.querySelector('.main-content').addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  // Read hash for initial page
  const hash = window.location.hash.replace('#', '') || 'status';
  navigateTo(hash);

  // Check connection
  checkConnection();

  // Periodic connection check
  setInterval(checkConnection, 30000);
});

// ==================== Utility ====================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
