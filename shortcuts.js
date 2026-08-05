// shortcuts.js - 键盘快捷键模块
// 提供全局键盘快捷键：搜索聚焦、返回、主题切换、g 前缀页面跳转、帮助浮层等。
// 依赖全局函数：setRoute / getRoute（定义于 app.js），ThemeManager（可选，若不存在则回退）。

const KeyboardShortcuts = (function () {
  /* ===== 快捷键定义（同时用于帮助浮层展示） ===== */
  const SHORTCUTS = [
    { keys: '/',   desc: '聚焦全局搜索框' },
    { keys: 'Esc', desc: '失焦搜索 / 返回上一页' },
    { keys: 't',   desc: '切换深色 / 浅色主题' },
    { keys: '?',   desc: '显示 / 隐藏快捷键帮助' },
    { keys: 'g h', desc: '前往主页' },
    { keys: 'g c', desc: '前往人设档案' },
    { keys: 'g r', desc: '前往院区守则' },
    { keys: 'g d', desc: '前往职能部门' },
    { keys: 'g s', desc: '前往故事记录' },
    { keys: 'g m', desc: '前往地图' },
    { keys: 'g t', desc: '前往统计' }
  ];

  /* ===== g 前缀跳转映射：按下 g 后，1 秒内再按对应键即跳转 ===== */
  const G_PREFIX_MAP = {
    h: 'home',
    c: 'characters',
    r: 'rules',
    d: 'departments',
    s: 'stories',
    m: 'map',
    t: 'stats'
  };

  const G_PREFIX_TIMEOUT = 1000; // g 前缀等待下一个键的最长时间（毫秒）

  let gPending = false;   // 是否处于 g 前缀等待状态
  let gTimer = null;      // g 前缀超时计时器
  let overlayEl = null;   // 帮助浮层元素
  let initialized = false;

  /* ===== 判断事件是否发生在可编辑元素中（输入框 / 文本域 / 下拉框 / 可编辑区域） ===== */
  function isTyping(e) {
    const t = e.target;
    if (!t) return false;
    const tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (t.isContentEditable === true) return true;
    return false;
  }

  /* ===== 切换主题：优先调用全局 ThemeManager，否则回退切换 data-theme ===== */
  function toggleTheme() {
    if (typeof ThemeManager !== 'undefined' && ThemeManager && typeof ThemeManager.toggle === 'function') {
      ThemeManager.toggle();
      return;
    }
    // 回退方案：切换 <html> 上的 data-theme 属性并持久化
    const root = document.documentElement;
    const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('asylum_theme', next); } catch (err) {}
  }

  /* ===== 帮助浮层：格式化按键展示 ===== */
  function formatKeys(k) {
    return k.split(' ').map(function (part) {
      return '<kbd>' + part + '</kbd>';
    }).join('<span class="kb-plus">+</span>');
  }

  /* ===== 创建 / 获取帮助浮层 DOM ===== */
  function getOverlay() {
    if (overlayEl && document.body.contains(overlayEl)) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'kb-shortcuts-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', '键盘快捷键');
    overlayEl.innerHTML =
      '<div class="kb-shortcuts-panel">' +
        '<div class="kb-shortcuts-head">' +
          '<h2>键盘快捷键</h2>' +
          '<button class="kb-shortcuts-close" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="kb-shortcuts-body">' +
          SHORTCUTS.map(function (s) {
            return '<div class="kb-shortcuts-row">' +
              '<span class="kb-shortcuts-keys">' + formatKeys(s.keys) + '</span>' +
              '<span class="kb-shortcuts-desc">' + s.desc + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="kb-shortcuts-foot">按 <kbd>Esc</kbd> 或点击空白处关闭</div>' +
      '</div>';
    document.body.appendChild(overlayEl);
    // 关闭按钮
    overlayEl.querySelector('.kb-shortcuts-close').addEventListener('click', hideOverlay);
    // 点击遮罩空白处关闭
    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl) hideOverlay();
    });
    return overlayEl;
  }

  function showOverlay() {
    const ov = getOverlay();
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  function isOverlayOpen() {
    return !!(overlayEl && overlayEl.classList.contains('open'));
  }

  /* ===== 聚焦全局搜索框（搜索框现在是悬浮在右上角，无需打开侧边栏） ===== */
  function focusSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    input.focus();
  }

  /* ===== Escape 处理：关闭浮层 → 关闭侧边栏 → 失焦搜索 → 详情页返回 ===== */
  function handleEscape() {
    // 1. 帮助浮层打开时优先关闭
    if (isOverlayOpen()) { hideOverlay(); return; }

    // 2. 侧边栏打开时关闭侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      if (typeof closeSidebar === 'function') closeSidebar();
      return;
    }

    const input = document.getElementById('globalSearch');
    const dropdown = document.getElementById('searchDropdown');
    // 3. 搜索框聚焦或下拉结果打开时：失焦并关闭搜索
    if (input && (document.activeElement === input || (dropdown && dropdown.classList.contains('open')))) {
      input.blur();
      if (dropdown) dropdown.classList.remove('open');
      return;
    }

    // 4. 处于详情页（带 type 参数）时：返回上一页
    const r = (typeof getRoute === 'function') ? getRoute() : null;
    if (r && r.type) {
      if (window.history.length > 1) history.back();
      else if (typeof setRoute === 'function') setRoute(r.page);
      return;
    }

    // 5. 其余情况：失焦当前元素
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }

  /* ===== 处理 g 前缀的第二个按键 ===== */
  function handleGPrefix(key) {
    const route = G_PREFIX_MAP[key];
    if (route && typeof setRoute === 'function') {
      setRoute(route);
    }
  }

  /* ===== 取消 g 前缀等待状态 ===== */
  function cancelGPrefix() {
    gPending = false;
    if (gTimer) { clearTimeout(gTimer); gTimer = null; }
  }

  /* ===== 全局 keydown 处理 ===== */
  function onKeydown(e) {
    const key = e.key;

    // Escape 始终生效（即便在输入框中）
    if (key === 'Escape') {
      cancelGPrefix();
      handleEscape();
      return;
    }

    // 在可编辑元素中时不触发其余快捷键（避免影响输入）
    if (isTyping(e)) return;

    // 处于 g 前缀等待状态：消费下一个按键
    if (gPending) {
      cancelGPrefix();
      const lower = key.toLowerCase();
      if (G_PREFIX_MAP[lower]) {
        e.preventDefault();
        handleGPrefix(lower);
      }
      // 无效的第二键：静默取消
      return;
    }

    // ? 切换帮助浮层
    if (key === '?') {
      e.preventDefault();
      if (isOverlayOpen()) hideOverlay(); else showOverlay();
      return;
    }

    // 帮助浮层打开时，其余快捷键不触发
    if (isOverlayOpen()) return;

    // / 聚焦搜索（阻止 Firefox 快速查找）
    if (key === '/') {
      e.preventDefault();
      focusSearch();
      return;
    }

    // t 切换主题
    if (key === 't' || key === 'T') {
      toggleTheme();
      return;
    }

    // g 进入前缀等待状态
    if (key === 'g' || key === 'G') {
      gPending = true;
      gTimer = setTimeout(function () { gPending = false; }, G_PREFIX_TIMEOUT);
      return;
    }
  }

  /* ===== 注入帮助浮层样式（暗色玻璃质感） ===== */
  function injectStyles() {
    if (document.getElementById('kb-shortcuts-style')) return;
    const style = document.createElement('style');
    style.id = 'kb-shortcuts-style';
    style.textContent = [
      '.kb-shortcuts-overlay {',
      '  position: fixed; inset: 0; z-index: 9999;',
      '  display: none; align-items: center; justify-content: center;',
      '  background: rgba(0,0,0,0.55);',
      '  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);',
      '  padding: 24px;',
      '}',
      '.kb-shortcuts-overlay.open { display: flex; animation: kbFade .2s ease; }',
      '@keyframes kbFade { from { opacity: 0; } to { opacity: 1; } }',
      '.kb-shortcuts-panel {',
      '  width: 100%; max-width: 520px; max-height: 82vh; overflow: auto;',
      '  background: var(--bg-panel, rgba(11,16,32,0.86));',
      '  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));',
      '  border-radius: var(--radius-md, 14px);',
      '  box-shadow: 0 20px 60px rgba(0,0,0,0.5);',
      '  color: var(--ink, #e8e9ed);',
      '  font-family: var(--font-base, sans-serif);',
      '}',
      '.kb-shortcuts-head {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  padding: 18px 22px; border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.08));',
      '}',
      '.kb-shortcuts-head h2 {',
      '  margin: 0; font-size: 18px; letter-spacing: 2px; color: var(--ink, #e8e9ed);',
      '  font-family: var(--font-display, sans-serif);',
      '}',
      '.kb-shortcuts-close {',
      '  background: none; border: none; cursor: pointer;',
      '  color: var(--ink-dim, #8a90a0); font-size: 24px; line-height: 1; padding: 0 4px;',
      '}',
      '.kb-shortcuts-close:hover { color: var(--ink, #e8e9ed); }',
      '.kb-shortcuts-body { padding: 14px 22px; }',
      '.kb-shortcuts-row {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);',
      '}',
      '.kb-shortcuts-row:last-child { border-bottom: none; }',
      '.kb-shortcuts-keys { display: flex; align-items: center; gap: 6px; }',
      '.kb-shortcuts-keys kbd, .kb-shortcuts-foot kbd {',
      '  display: inline-block; min-width: 26px; text-align: center;',
      '  padding: 4px 8px; font-family: var(--font-mono, monospace); font-size: 12px;',
      '  color: var(--ink, #e8e9ed);',
      '  background: rgba(255,255,255,0.05);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.12));',
      '  border-radius: 6px; box-shadow: 0 2px 0 rgba(0,0,0,0.3);',
      '}',
      '.kb-plus { color: var(--ink-dim, #8a90a0); font-size: 12px; }',
      '.kb-shortcuts-desc { color: var(--ink-muted, #9aa0ad); font-size: 14px; }',
      '.kb-shortcuts-foot {',
      '  padding: 12px 22px 18px; font-size: 12px; color: var(--ink-dim, #8a90a0);',
      '  text-align: center; font-family: var(--font-mono, monospace);',
      '}',
      '@media (max-width: 520px) {',
      '  .kb-shortcuts-panel { max-width: 100%; }',
      '  .kb-shortcuts-desc { font-size: 13px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ===== 初始化 ===== */
  function init() {
    if (initialized) return;
    initialized = true;
    injectStyles();
    document.addEventListener('keydown', onKeydown);
  }

  return { init: init, showOverlay: showOverlay, hideOverlay: hideOverlay };
})();

// 模块加载后自动初始化
KeyboardShortcuts.init();
