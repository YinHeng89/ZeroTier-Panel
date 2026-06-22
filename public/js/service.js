/**
 * Service Control Page — Docker 部署
 */
const ServicePage = {

  init() {
    this.refresh();
    setInterval(() => this.refresh(), 15000);
  },

  async refresh() {
    try {
      const json = await API.get('/service/status');
      const svc = json.data || json;
      document.getElementById('svcRunning').innerHTML = svc.running
        ? '<span class="badge badge-success">运行中</span>'
        : '<span class="badge badge-danger">已停止</span>';
      document.getElementById('svcAgent').innerHTML =
        '<span class="badge badge-success">已连接</span>';
    } catch {
      document.getElementById('svcRunning').innerHTML = '<span class="badge badge-danger">离线</span>';
      document.getElementById('svcAgent').innerHTML = '<span class="badge badge-danger">未连接</span>';
    }

    // 开机自启
    document.getElementById('svcEnabled').innerHTML =
      '<span class="badge badge-info">Docker 管理</span>';
  },

};
