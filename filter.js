// filter.js - 高级筛选模块
// 为列表页（人设 / 部门 / 故事 / 污染物）提供：标签筛选、分类筛选、排序、页内搜索。
// 设计要点：
//   - 筛选项（标签 / 分类）由实际数据动态推导，数据变化时自动适配；
//   - 通过隐藏 / 重排已有卡片实现筛选，保留原有事件绑定，无需重复渲染卡片；
//   - 自行监听路由变化，在列表页自动插入筛选栏。
// 依赖全局函数：getRoute / setRoute / render / getAllCharacters 等（定义于 app.js）。

const FilterManager = (function () {

  /* ===== 标签类型中文标签（含未来可能新增的 danger/safe/special 类型） ===== */
  const TAG_TYPE_LABELS = {
    gender: '性别',
    age: '年龄',
    dept: '部门',
    height: '身高',
    danger: '危险',
    safe: '安全',
    special: '特殊'
  };

  /* ===== 各列表页的筛选配置 ===== */
  const PAGE_CONFIG = {
    // 人设：按标签（性别 / 身高等）筛选 + 按部门筛选
    characters: {
      data: function () { return getAllCharacters(); },
      idOf: function (c) { return c.id; },
      nameOf: function (c) { return c.name; },
      searchText: function (c) {
        return [c.name, c.alt, c.desc, c.highlight, c.dept, (c.tags || []).map(function (t) { return t.text; }).join(' ')].join(' ');
      },
      facets: [
        { key: 'tag', type: 'tag', excludeTypes: ['dept'], maxDistinct: 8 }, // 部门单独作为 facet，故标签中排除 dept
        { key: 'dept', type: 'field', field: 'dept', label: '部门' }
      ]
    },
    // 部门：无标签 / 分类，仅提供页内搜索与排序
    departments: {
      data: function () { return getAllDepartments(); },
      idOf: function (d) { return d.id; },
      nameOf: function (d) { return d.name; },
      searchText: function (d) { return [d.name, d.desc, d.lead, d.deputy, d.staff].join(' '); },
      facets: []
    },
    // 故事：按标签筛选（数据中若含 tags 字段则自动出现按钮）
    stories: {
      data: function () { return getAllStories(); },
      idOf: function (s) { return s.id; },
      nameOf: function (s) { return s.title; },
      searchText: function (s) { return [s.title, s.content].join(' '); },
      facets: [
        { key: 'tag', type: 'tag', maxDistinct: 8 }
      ]
    },
    // 污染物：按类别（等级 level）筛选
    contaminants: {
      data: function () { return getAllContaminants(); },
      idOf: function (c) { return c.id; },
      nameOf: function (c) { return c.name; },
      searchText: function (c) { return [c.code, c.name].join(' '); },
      facets: [
        { key: 'level', type: 'field', field: 'level', label: '类别', format: function (v) { return v + '级'; } }
      ]
    }
  };

  /* ===== 当前筛选状态 ===== */
  let state = { page: null, active: {}, sort: 'date', search: '' };

  let barEl = null;            // 当前筛选栏元素（.filter-bar）
  let gridEl = null;           // 当前列表网格元素（.list-grid）
  let originalCards = null;    // 原始卡片节点快照（用于按添加时间排序还原）
  let orderMap = null;         // 卡片 -> 原始索引（排序用）
  let statusEl = null;         // 结果计数元素
  let emptyEl = null;          // 空状态元素
  let initialized = false;

  /* ===== 工具函数 ===== */
  function norm(s) { return String(s == null ? '' : s).toLowerCase(); }

  function escapeHtml(str) {
    // 优先复用 app.js 中的全局 escapeHtml
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /* ===== 依据数据动态推导某个 facet 的可选分组 ===== */
  // 返回 [{ label, options: [{ value, label, count }] }]
  function buildFacetGroups(cfg, facet, items) {
    const groups = [];

    if (facet.type === 'tag') {
      // 按 tag.type 分组收集
      const byType = {}; // type -> { counts, labels }
      items.forEach(function (it) {
        (it.tags || []).forEach(function (t) {
          if (facet.excludeTypes && facet.excludeTypes.indexOf(t.type) >= 0) return;
          if (!t.text) return;
          if (!byType[t.type]) byType[t.type] = { counts: {}, labels: {} };
          byType[t.type].counts[t.text] = (byType[t.type].counts[t.text] || 0) + 1;
          byType[t.type].labels[t.text] = t.text;
        });
      });
      Object.keys(byType).forEach(function (type) {
        const g = byType[type];
        const vals = Object.keys(g.counts);
        // 值过多的类型（如年龄）跳过，避免按钮爆炸
        if (facet.maxDistinct && vals.length > facet.maxDistinct) return;
        const options = vals.map(function (v) {
          return { value: v, label: g.labels[v], count: g.counts[v] };
        });
        options.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label, 'zh'); });
        groups.push({ label: TAG_TYPE_LABELS[type] || type, options: options });
      });
      groups.sort(function (a, b) { return a.label.localeCompare(b.label, 'zh'); });

    } else if (facet.type === 'field') {
      const counts = {}, labels = {};
      items.forEach(function (it) {
        const raw = it[facet.field];
        if (raw == null || raw === '') return;
        const val = String(raw);
        counts[val] = (counts[val] || 0) + 1;
        labels[val] = facet.format ? facet.format(raw) : String(raw);
      });
      const options = Object.keys(counts).map(function (v) {
        return { value: v, label: labels[v], count: counts[v] };
      });
      options.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label, 'zh'); });
      groups.push({ label: facet.label || facet.field, options: options });
    }

    return groups;
  }

  /* ===== 判断单项是否匹配当前筛选条件 ===== */
  function matches(cfg, it) {
    // 页内搜索：所有空格分词都需命中
    if (state.search) {
      const text = norm(cfg.searchText(it));
      const terms = state.search.split(/\s+/).filter(Boolean);
      for (let i = 0; i < terms.length; i++) {
        if (text.indexOf(terms[i]) < 0) return false;
      }
    }
    // 各 facet：跨 facet 取 AND，同一 facet 内取 OR
    for (let f = 0; f < cfg.facets.length; f++) {
      const facet = cfg.facets[f];
      const sel = state.active[facet.key];
      if (!sel || sel.size === 0) continue;
      let ok = false;
      if (facet.type === 'tag') {
        const tags = it.tags || [];
        for (let i = 0; i < tags.length; i++) {
          if (facet.excludeTypes && facet.excludeTypes.indexOf(tags[i].type) >= 0) continue;
          if (sel.has(tags[i].text)) { ok = true; break; }
        }
      } else if (facet.type === 'field') {
        const raw = it[facet.field];
        if (raw != null && sel.has(String(raw))) ok = true;
      }
      if (!ok) return false;
    }
    return true;
  }

  /* ===== 应用筛选与排序：隐藏不匹配卡片，重排可见卡片 ===== */
  function applyFilters() {
    if (!gridEl || !state.page) return;
    const cfg = PAGE_CONFIG[state.page];
    if (!cfg || !originalCards) return;

    const items = cfg.data();
    const itemById = {};
    items.forEach(function (it) { itemById[cfg.idOf(it)] = it; });

    const visibleCards = [];
    let visibleCount = 0;

    // 显示 / 隐藏
    for (let i = 0; i < originalCards.length; i++) {
      const card = originalCards[i];
      const detail = card.getAttribute('data-detail') || '';
      const id = detail.split('/')[1] || '';
      const it = itemById[id];
      const show = it ? matches(cfg, it) : true; // 找不到对应数据时默认保留
      if (show) {
        card.style.display = '';
        visibleCards.push(card);
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    }

    // 排序（仅重排可见卡片，移动节点以保留事件监听）
    let ordered;
    if (state.sort === 'name') {
      ordered = visibleCards.slice().sort(function (a, b) {
        const ia = itemById[(a.getAttribute('data-detail') || '').split('/')[1]];
        const ib = itemById[(b.getAttribute('data-detail') || '').split('/')[1]];
        const na = ia ? norm(cfg.nameOf(ia)) : '';
        const nb = ib ? norm(cfg.nameOf(ib)) : '';
        return na.localeCompare(nb, 'zh');
      });
    } else {
      // 按添加时间：还原原始顺序
      ordered = visibleCards.slice().sort(function (a, b) {
        return (orderMap.get(a) || 0) - (orderMap.get(b) || 0);
      });
    }
    ordered.forEach(function (card) { gridEl.appendChild(card); });

    // 更新计数与空状态
    if (statusEl) statusEl.textContent = '显示 ' + visibleCount + ' / ' + originalCards.length;
    if (emptyEl) emptyEl.style.display = visibleCount === 0 ? '' : 'none';
  }

  /* ===== 渲染筛选栏 HTML 到指定容器 ===== */
  function renderFilterBar(container, page) {
    const cfg = PAGE_CONFIG[page];
    if (!cfg || !container) return;
    const items = cfg.data();

    // 构建 facet 分组 HTML
    let facetsHtml = '';
    cfg.facets.forEach(function (facet) {
      const groups = buildFacetGroups(cfg, facet, items);
      groups.forEach(function (group) {
        if (!group.options.length) return;
        var safeFacetKey = escapeHtml(facet.key);
        facetsHtml +=
          '<div class="filter-group" data-facet="' + safeFacetKey + '">' +
            '<span class="filter-group-label">' + escapeHtml(group.label) + '</span>' +
            '<div class="filter-tags">' +
              group.options.map(function (o) {
                return '<button class="filter-tag" data-facet="' + safeFacetKey + '" data-value="' + escapeHtml(o.value) + '">' +
                  escapeHtml(o.label) + '<span class="filter-tag-count">' + o.count + '</span></button>';
              }).join('') +
            '</div>' +
          '</div>';
      });
    });

    container.innerHTML =
      '<div class="filter-bar" id="filterBar">' +
        '<div class="filter-bar-header">' +
          '<button class="filter-bar-toggle" id="filterBarToggle" aria-label="展开 / 收起筛选" aria-expanded="true">' +
            '<span class="filter-bar-title">筛选</span>' +
            '<svg class="filter-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</button>' +
          '<span class="filter-result" id="filterResult">显示 ' + items.length + ' / ' + items.length + '</span>' +
        '</div>' +
        '<div class="filter-bar-body" id="filterBarBody">' +
          (facetsHtml ? '<div class="filter-facets">' + facetsHtml + '</div>' : '') +
          '<div class="filter-controls">' +
            '<div class="filter-search">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
              '<input type="text" id="filterSearchInput" placeholder="在此页搜索..." autocomplete="off" maxlength="80">' +
            '</div>' +
            '<select class="filter-sort" id="filterSort">' +
              '<option value="date">按添加时间</option>' +
              '<option value="name">按名称</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ===== 绑定筛选栏交互事件 ===== */
  function bindBarEvents() {
    if (!barEl) return;

    // 事件委托：标签切换 / 折叠按钮
    barEl.addEventListener('click', function (e) {
      const tag = e.target.closest('.filter-tag');
      if (tag) {
        const facetKey = tag.dataset.facet;
        const val = tag.dataset.value;
        if (!state.active[facetKey]) state.active[facetKey] = new Set();
        if (state.active[facetKey].has(val)) {
          state.active[facetKey].delete(val);
          tag.classList.remove('active');
        } else {
          state.active[facetKey].add(val);
          tag.classList.add('active');
        }
        applyFilters();
        return;
      }
      const toggle = e.target.closest('#filterBarToggle');
      if (toggle) {
        const collapsed = barEl.classList.toggle('collapsed');
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        return;
      }
    });

    // 排序下拉
    const sortSel = barEl.querySelector('#filterSort');
    if (sortSel) {
      sortSel.value = state.sort;
      sortSel.addEventListener('change', function () {
        state.sort = sortSel.value;
        applyFilters();
      });
    }

    // 页内搜索（防抖）
    const searchInput = barEl.querySelector('#filterSearchInput');
    if (searchInput) {
      searchInput.value = state.search;
      let tid = null;
      searchInput.addEventListener('input', function () {
        clearTimeout(tid);
        tid = setTimeout(function () {
          // Security: sanitize search input against injection
          var raw = searchInput.value;
          var safe = (window.SecurityGuard) ? SecurityGuard.sanitizeSearchQuery(raw) : raw.trim();
          if (safe !== raw) searchInput.value = safe;
          state.search = safe;
          applyFilters();
        }, 120);
      });
      // 在搜索框中按 Escape 失焦，交由全局快捷键处理返回逻辑
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') searchInput.blur();
      });
    }
  }

  /* ===== 拆除当前筛选栏与空状态 ===== */
  function teardown() {
    if (barEl && barEl.parentNode) barEl.parentNode.removeChild(barEl);
    if (emptyEl && emptyEl.parentNode) emptyEl.parentNode.removeChild(emptyEl);
    barEl = null;
    gridEl = null;
    originalCards = null;
    orderMap = null;
    statusEl = null;
    emptyEl = null;
    state = { page: null, active: {}, sort: 'date', search: '' };
  }

  /* ===== 为当前路由设置筛选栏（列表页生效） ===== */
  function setupForCurrentRoute() {
    teardown();
    const r = (typeof getRoute === 'function') ? getRoute() : null;
    if (!r) return;

    const page = r.page;
    const cfg = PAGE_CONFIG[page];
    // 仅在列表页（无详情 type）且配置存在时启用
    if (!cfg || r.type) return;

    gridEl = document.querySelector('#app .list-grid');
    if (!gridEl) return;

    // 初始化筛选状态
    state = { page: page, active: {}, sort: 'date', search: '' };

    // 创建筛选栏容器并插入到网格之前
    const wrap = document.createElement('div');
    wrap.className = 'filter-bar-wrap';
    gridEl.parentNode.insertBefore(wrap, gridEl);
    renderFilterBar(wrap, page);

    // 选取内部元素引用
    barEl = wrap.querySelector('#filterBar');
    statusEl = wrap.querySelector('#filterResult');

    // 空状态节点放入网格内（非 .list-card，不会被卡片查询选中）
    emptyEl = document.createElement('div');
    emptyEl.className = 'filter-empty-state';
    emptyEl.textContent = '没有匹配的条目';
    emptyEl.style.display = 'none';
    gridEl.appendChild(emptyEl);

    // 快照原始卡片顺序（按添加时间排序依据）
    originalCards = Array.prototype.slice.call(gridEl.querySelectorAll(':scope > .list-card'));
    orderMap = new Map();
    originalCards.forEach(function (card, i) { orderMap.set(card, i); });

    // 移动端默认收起
    if (window.innerWidth <= 900) {
      barEl.classList.add('collapsed');
      const toggle = barEl.querySelector('#filterBarToggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    bindBarEvents();
    applyFilters();
  }

  /* ===== 注入筛选栏样式 ===== */
  function injectStyles() {
    if (document.getElementById('filter-bar-style')) return;
    const style = document.createElement('style');
    style.id = 'filter-bar-style';
    style.textContent = [
      '.filter-bar-wrap { margin: 0 0 18px; }',
      '.filter-bar {',
      '  background: var(--bg-panel, rgba(11,16,32,0.7));',
      '  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));',
      '  border-radius: var(--radius-md, 14px);',
      '  padding: 14px 18px;',
      '  box-shadow: 0 8px 30px rgba(0,0,0,0.25);',
      '}',
      '.filter-bar-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }',
      '.filter-bar-toggle {',
      '  display: inline-flex; align-items: center; gap: 8px;',
      '  background: none; border: none; cursor: pointer; padding: 0;',
      '  color: var(--ink, #e8e9ed); font-family: var(--font-display, sans-serif);',
      '  font-size: 14px; letter-spacing: 2px;',
      '}',
      '.filter-bar-title { text-transform: uppercase; }',
      '.filter-caret { width: 16px; height: 16px; transition: transform .25s ease; color: var(--ink-dim, #8a90a0); }',
      '.filter-bar.collapsed .filter-caret { transform: rotate(-90deg); }',
      '.filter-bar-body {',
      '  margin-top: 14px; display: flex; flex-direction: column; gap: 14px;',
      '  transition: max-height .3s ease, opacity .25s ease, margin .25s ease; overflow: hidden;',
      '}',
      '.filter-bar.collapsed .filter-bar-body { max-height: 0; opacity: 0; margin-top: 0; pointer-events: none; }',
      '.filter-facets { display: flex; flex-direction: column; gap: 12px; }',
      '.filter-group { display: flex; flex-direction: column; gap: 6px; }',
      '.filter-group-label {',
      '  font-size: 11px; letter-spacing: 1.5px; color: var(--ink-dim, #8a90a0);',
      '  text-transform: uppercase; font-family: var(--font-mono, monospace);',
      '}',
      '.filter-tags { display: flex; flex-wrap: wrap; gap: 8px; }',
      '.filter-tag {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  padding: 5px 12px; font-size: 13px; cursor: pointer;',
      '  color: var(--ink-muted, #9aa0ad);',
      '  background: rgba(255,255,255,0.03);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.1));',
      '  border-radius: 999px; transition: all .2s ease; font-family: var(--font-base, sans-serif);',
      '}',
      '.filter-tag:hover { color: var(--ink, #e8e9ed); border-color: var(--glass-highlight, rgba(255,255,255,0.2)); }',
      '.filter-tag.active {',
      '  color: #0b1020; background: var(--brand, #e8c66a); border-color: var(--brand, #e8c66a);',
      '  box-shadow: 0 0 14px rgba(232,198,106,0.4);',
      '}',
      '.filter-tag-count { font-size: 11px; opacity: .7; font-family: var(--font-mono, monospace); }',
      '.filter-tag.active .filter-tag-count { opacity: .85; }',
      '.filter-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }',
      '.filter-search {',
      '  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;',
      '  padding: 8px 12px; background: rgba(255,255,255,0.03);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.1)); border-radius: 10px;',
      '}',
      '.filter-search svg { width: 16px; height: 16px; color: var(--ink-dim, #8a90a0); flex-shrink: 0; }',
      '.filter-search input {',
      '  flex: 1; min-width: 0; background: none; border: none; outline: none;',
      '  color: var(--ink, #e8e9ed); font-size: 13px; font-family: var(--font-base, sans-serif);',
      '}',
      '.filter-search input::placeholder { color: var(--ink-dim, #8a90a0); }',
      '.filter-sort {',
      '  padding: 8px 12px; background: rgba(255,255,255,0.03);',
      '  border: 1px solid var(--glass-border, rgba(255,255,255,0.1)); border-radius: 10px;',
      '  color: var(--ink, #e8e9ed); font-size: 13px; cursor: pointer; outline: none;',
      '}',
      '.filter-sort option { background: #0b1020; color: var(--ink, #e8e9ed); }',
      '.filter-result { font-size: 12px; color: var(--ink-dim, #8a90a0); font-family: var(--font-mono, monospace); white-space: nowrap; }',
      '.filter-empty-state {',
      '  grid-column: 1 / -1; padding: 60px 20px; text-align: center;',
      '  color: var(--ink-muted, #9aa0ad); font-size: 14px; letter-spacing: 1px;',
      '}',
      '@media (max-width: 900px) {',
      '  .filter-controls { flex-direction: column; align-items: stretch; }',
      '  .filter-search { min-width: 0; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ===== 初始化：注入样式 + 监听路由 + 首次接入 ===== */
  function init(page) {
    if (initialized) return;
    initialized = true;
    injectStyles();
    // 路由变化时延迟执行，确保 render() 已生成 .list-grid
    window.addEventListener('hashchange', function () { setTimeout(setupForCurrentRoute, 0); });
    // 首次接入（延迟到当前同步脚本执行完毕，等待首次 render() 完成）
    setTimeout(setupForCurrentRoute, 0);
    // page 参数保留用于显式指定页面（此处以实际路由为准）
    if (page) { /* 以当前路由自动判断，无需额外处理 */ }
  }

  return {
    init: init,
    renderFilterBar: renderFilterBar,
    applyFilters: applyFilters,
    setupForCurrentRoute: setupForCurrentRoute
  };
})();

// 模块加载后自动初始化
FilterManager.init();
