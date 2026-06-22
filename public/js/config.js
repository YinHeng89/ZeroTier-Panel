/**
 * ZeroTier Panel - Config Page
 */

const ConfigPage = {
  init() {
    this.refresh();
    // Tab key support in textarea
    const editor = document.getElementById('configEditor');
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });
  },

  async refresh() {
    const editor = document.getElementById('configEditor');
    try {
      const res = await API.get('/config');
      const config = res.data || res;
      // Pretty format JSON
      editor.value = JSON.stringify(config, null, 2) || '{}';
    } catch (err) {
      editor.value = '// 加载失败: ' + err.message;
      Toast.error('加载配置失败: ' + err.message);
    }
  },

  async save() {
    const editor = document.getElementById('configEditor');
    const content = editor.value.trim();

    if (!content) {
      Toast.error('配置内容不能为空');
      return;
    }

    // Validate JSON
    try {
      JSON.parse(content);
    } catch (e) {
      Toast.error('JSON 格式错误: ' + e.message);
      return;
    }

    try {
      // 直接发送解析后的配置对象，后端原样写入 local.conf
      const configObj = JSON.parse(content);
      await API.put('/config', configObj);
      Toast.success('配置保存成功！需要重启 ZeroTier 服务才能生效。');
    } catch (err) {
      Toast.error('保存失败: ' + err.message);
    }
  },
};
