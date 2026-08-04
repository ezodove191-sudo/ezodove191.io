// app.js - auto-extracted from original single-file HTML

/* ===== ROUTING ===== */
function getRoute() {
  const hash = location.hash.replace(/^#/, '').replace(/^\//, '') || 'home';
  const parts = hash.split('/').filter(Boolean);
  const page = parts[0] || 'home';
  // Security: validate page against whitelist, fallback to home
  const safePage = VALID_PAGES.indexOf(page) !== -1 ? page : 'home';
  // Security: sanitize route params against injection (SQL/XSS) + char whitelist
  const safeType = parts[1] ? SecurityGuard.sanitizeRouteParam(parts[1]) : null;
  const safeId = parts[2] ? SecurityGuard.sanitizeRouteParam(parts[2]) : null;
  return { page: safePage, type: safeType, id: safeId };
}

function routeKey(page, type, id) {
  return [page, type, id].filter(Boolean).join('/') || 'home';
}

let prevRoute = null;
const scrollMemory = {};

function saveScroll() {
  if (!prevRoute) return;
  const key = routeKey(prevRoute.page, prevRoute.type, prevRoute.id);
  scrollMemory[key] = window.scrollY;
  try { sessionStorage.setItem('ph_scroll_' + key, String(window.scrollY)); } catch (e) {}
}

function getSavedScroll(key) {
  if (scrollMemory[key] !== undefined) return scrollMemory[key];
  try {
    const v = sessionStorage.getItem('ph_scroll_' + key);
    return v ? parseInt(v, 10) : 0;
  } catch (e) { return 0; }
}

function isReturningToList() {
  const cur = getRoute();
  if (!prevRoute || prevRoute.page !== cur.page) return false;
  // characters/departments/contaminants/stories: prev had detail, current has none
  if (['characters','departments','contaminants','stories'].includes(cur.page)) {
    return !!prevRoute.type && !cur.type;
  }
  // rules: from rule detail back to rulebook list, or from rulebook back to rules list
  if (cur.page === 'rules') {
    if (prevRoute.id && !cur.id && prevRoute.type === cur.type) return true; // detail -> rulebook
    if (prevRoute.type && !cur.type) return true; // rulebook -> rules list
  }
  return false;
}

function setRoute(page, type, id) {
  saveScroll();
  // Security: validate route parameters before setting hash
  // Handle case where full route string is passed as first argument (e.g. 'search/query')
  var safePage, safeType, safeId;
  if (page && typeof page === 'string' && page.indexOf('/') !== -1 && type === undefined) {
    var routeParts = page.split('/').filter(Boolean);
    safePage = VALID_PAGES.indexOf(routeParts[0]) !== -1 ? routeParts[0] : 'home';
    safeType = routeParts[1] ? SecurityGuard.sanitizeRouteParam(routeParts[1]) : null;
    safeId = routeParts[2] ? SecurityGuard.sanitizeRouteParam(routeParts[2]) : null;
  } else {
    safePage = VALID_PAGES.indexOf(page) !== -1 ? page : 'home';
    safeType = type ? SecurityGuard.sanitizeRouteParam(type) : null;
    safeId = id ? SecurityGuard.sanitizeRouteParam(id) : null;
  }
  const parts = [safePage, safeType, safeId].filter(Boolean);
  location.hash = parts.length ? '#' + parts.join('/') : '#home';
}

// Replace the current history entry instead of pushing a new one.
// Used for "hidden" pages (director/webmaster) so they don't linger
// in the history stack after the user navigates away.
function replaceRoute(page, type, id) {
  saveScroll();
  // Security: validate route parameters before replacing hash
  var safePage, safeType, safeId;
  if (page && typeof page === 'string' && page.indexOf('/') !== -1 && type === undefined) {
    var routeParts = page.split('/').filter(Boolean);
    safePage = VALID_PAGES.indexOf(routeParts[0]) !== -1 ? routeParts[0] : 'home';
    safeType = routeParts[1] ? SecurityGuard.sanitizeRouteParam(routeParts[1]) : null;
    safeId = routeParts[2] ? SecurityGuard.sanitizeRouteParam(routeParts[2]) : null;
  } else {
    safePage = VALID_PAGES.indexOf(page) !== -1 ? page : 'home';
    safeType = type ? SecurityGuard.sanitizeRouteParam(type) : null;
    safeId = id ? SecurityGuard.sanitizeRouteParam(id) : null;
  }
  const parts = [safePage, safeType, safeId].filter(Boolean);
  const newHash = parts.length ? '#' + parts.join('/') : '#home';
  history.replaceState(null, '', newHash);
  render();
}




/* ===== STATIC DATA ACCESSORS (read-only, no localStorage) ===== */
function getAllCharacters() { return characters; }
function getAllStories() { return stories; }
function getAllRulebooks() { return rulebooks; }
function getAllDepartments() { return departments; }
function getAllContaminants() { return contaminants; }

/* ===== ROUTE WHITESTIST (security: reject invalid page names) ===== */
const VALID_PAGES = ['home','characters','rules','departments','stories','contaminants','search','about','director','webmaster','map','stats','relations'];

/* ===== RENDER ===== */
function renderNav() {
  const { page } = getRoute();
  document.querySelectorAll('.sidebar-links > li > a').forEach(a => {
    a.classList.toggle('active', a.dataset.link === page);
  });
}



/* ===== GLOBAL SEARCH ===== */
function normalizeSearchText(text) {
  return String(text || '').toLowerCase().replace(/[\s\n\r]+/g, ' ').trim();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, query) {
  const t = escapeHtml(text);
  if (!query) return t;
  // Security: use safe regex builder to prevent ReDoS
  const pattern = SecurityGuard.safeSearchRegex(query);
  if (!pattern) return t;
  return t.replace(pattern, '<mark style="background:rgba(232,198,106,0.22);color:var(--gold-2);border-radius:2px;padding:0 2px;">$1</mark>');
}

function typeLabel(cat) {
  const map = { character: '人设', rule: '守则', department: '部门', story: '故事', contaminant: '污染物' };
  return map[cat] || cat;
}

function scoreMatch(text, terms) {
  const t = normalizeSearchText(text);
  if (!t) return 0;
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (t.includes(term)) score += 1;
    const chunks = t.split(/[\s，。、；：]+/);
    if (chunks.some(w => w === term)) score += 2;
    if (t.startsWith(term)) score += 1;
  }
  return score;
}

function performSearch(query) {
  // Security: sanitize search query against injection + length limit
  const q = normalizeSearchText(SecurityGuard.sanitizeSearchQuery(query));
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const results = [];
  const add = (category, title, snippet, link, score) => {
    results.push({ category, title, snippet, link, score });
  };

  getAllCharacters().forEach(c => {
    const text = [c.name, c.alt, c.desc, c.highlight, c.dept, c.gender, c.age, c.tags.map(t => t.text).join(' ')].join(' ');
    const score = scoreMatch(text, terms);
    if (score > 0) add('character', c.name + (c.alt ? ` · ${c.alt}` : ''), c.highlight || c.desc.slice(0, 90) + '…', `characters/${c.id}`, score);
  });

  getAllRulebooks().forEach(b => {
    const bookScore = scoreMatch([b.name, b.desc].join(' '), terms);
    if (bookScore > 0) add('rule', b.name, b.desc, `rules/${b.id}`, bookScore);
    b.items.forEach(r => {
      const score = scoreMatch([r.title, r.content].join(' '), terms);
      if (score > 0) add('rule', `${b.name} · ${r.title}`, r.content, `rules/${b.id}/${r.id}`, score);
    });
  });

  getAllDepartments().forEach(d => {
    const text = [d.name, d.desc, d.lead, d.deputy, d.staff].join(' ');
    const score = scoreMatch(text, terms);
    if (score > 0) add('department', d.name, `${d.lead ? '部长：' + d.lead + ' ' : ''}${d.deputy ? '副部长：' + d.deputy : ''}`, `departments/${d.id}`, score);
  });

  getAllStories().forEach(s => {
    const score = scoreMatch([s.title, s.content].join(' '), terms);
    if (score > 0) add('story', s.title, s.content.slice(0, 110) + (s.content.length > 110 ? '…' : ''), `stories/${s.id}`, score);
  });

  getAllContaminants().forEach(c => {
    const score = scoreMatch([c.code, c.name].join(' '), terms);
    if (score > 0) add('contaminant', `${c.code} · ${c.name}`, `编号 ${c.code}`, `contaminants/${c.id}`, score);
  });

  return results.sort((a, b) => b.score - a.score);
}

function renderSearchDropdown(results, query) {
  const dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;
  if (!query.trim() || !results.length) {
    dropdown.innerHTML = query.trim() ? '<div class="search-dropdown empty">未找到相关档案</div>' : '';
    dropdown.classList.toggle('open', !!query.trim());
    return;
  }
  const top = results.slice(0, 8);
  dropdown.innerHTML = top.map(r => `
    <div class="search-result-item" data-detail="${SecurityGuard.sanitizeAttr(r.link)}">
      <span class="r-type">${typeLabel(r.category)}</span>
      <div class="r-body">
        <div class="r-title">${highlightMatch(r.title, query)}</div>
        <div class="r-snippet">${highlightMatch(r.snippet, query)}</div>
      </div>
    </div>
  `).join('') + (results.length > 8 ? `
    <div class="search-dropdown-footer">
      <a data-link="search/${encodeURIComponent(query)}">查看全部 ${results.length} 条结果 →</a>
    </div>
  ` : '');
  dropdown.classList.add('open');
}

function renderSearchPage(query) {
  // Security: sanitize decoded query against injection
  const decoded = SecurityGuard.sanitizeSearchQuery(decodeURIComponent(query || ''));
  const results = performSearch(decoded);
  return `
    <div class="page" id="page-search">
      <section class="detail-header">
        <h2>搜索结果</h2>
        <div class="detail-sub">SEARCH RESULTS · “${escapeHtml(decoded)}” 共 ${results.length} 条</div>
      </section>
      <section class="section">
        ${results.length ? `
          <div class="list-grid">
            ${results.map(r => `
              <div class="list-card" data-detail="${SecurityGuard.sanitizeAttr(r.link)}">
                <div class="card-title"><span style="color:var(--ink-dim);font-family:var(--font-mono);margin-right:8px">${typeLabel(r.category)}</span>${highlightMatch(r.title, decoded)}</div>
                <div class="card-body">${highlightMatch(r.snippet, decoded)}</div>
              </div>
            `).join('')}
          </div>
        ` : `<div class="empty-state" style="text-align:center;color:var(--ink-muted);padding:80px 20px;font-size:15px;letter-spacing:1px;">未找到与 “${escapeHtml(decoded)}” 相关的档案。</div>`}
      </section>
    </div>
  `;
}

function initGlobalSearch() {
  const input = document.getElementById('globalSearch');
  const clearBtn = document.getElementById('searchClear');
  const dropdown = document.getElementById('searchDropdown');
  if (!input) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    const q = input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Security: sanitize input before search
      const safeQ = SecurityGuard.sanitizeSearchQuery(q);
      if (safeQ !== q) input.value = safeQ;
      const results = performSearch(safeQ);
      renderSearchDropdown(results, safeQ);
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) {
        dropdown.classList.remove('open');
        setRoute('search', encodeURIComponent(q));
        input.blur();
      }
    } else if (e.key === 'Escape') {
      input.value = '';
      renderSearchDropdown([], '');
      input.blur();
    }
  });

  input.addEventListener('focus', () => {
    const q = input.value.trim();
    if (q) {
      const results = performSearch(q);
      renderSearchDropdown(results, q);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      renderSearchDropdown([], '');
    });
  }

  // Event delegation for dynamically created dropdown items
  if (dropdown) {
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('[data-detail]');
      if (item) {
        e.stopPropagation();
        // Security: validate data-detail before navigation
        const safeRoute = SecurityGuard.validateDataRoute(item.dataset.detail);
        if (!safeRoute) return;
        const parts = safeRoute.split('/');
        dropdown.classList.remove('open');
        input.blur();
        setRoute(parts[0], parts[1], parts[2]);
        return;
      }
      const footerLink = e.target.closest('.search-dropdown-footer [data-link]');
      if (footerLink) {
        e.stopPropagation();
        // Security: validate data-link before navigation
        const safeLink = SecurityGuard.validateDataRoute(footerLink.dataset.link);
        if (!safeLink) return;
        dropdown.classList.remove('open');
        input.blur();
        setRoute(safeLink);
        return;
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.floating-search')) {
      dropdown?.classList.remove('open');
    }
  });
}

function initFooterBadge() {
  const badge = document.getElementById('footerBadge');
  if (!badge) return;
  badge.addEventListener('dblclick', () => setRoute('about'));
}



/* ===== NAME CROSS-LINKING ===== */
function buildNameIndex() {
  // Build a map of character names to their IDs for cross-linking
  // Sort by name length descending so longer names are matched first
  const names = [];
  characters.forEach(c => {
    names.push({ name: c.name, id: c.id });
    if (c.alt && c.alt.length >= 2 && !c.alt.includes('的意思')) {
      names.push({ name: c.alt, id: c.id });
    }
  });
  names.sort((a, b) => b.name.length - a.name.length);
  return names;
}

function linkifyNames(htmlText) {
  const nameIndex = buildNameIndex();
  if (!nameIndex.length) return htmlText;
  // Build a single regex that matches any known name
  const pattern = new RegExp('(' + nameIndex.map(n => escapeRegExp(n.name)).join('|') + ')', 'g');
  // Replace matches with clickable spans, but skip if already inside a tag
  // We split by HTML tags and only process text nodes
  let result = '';
  let lastIndex = 0;
  let match;
  // Simple approach: skip content inside < > tags
  const tagPattern = /<[^>]*>/g;
  const segments = [];
  let pos = 0;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(htmlText)) !== null) {
    if (tagMatch.index > pos) {
      segments.push({ type: 'text', content: htmlText.slice(pos, tagMatch.index) });
    }
    segments.push({ type: 'tag', content: tagMatch[0] });
    pos = tagMatch.index + tagMatch[0].length;
  }
  if (pos < htmlText.length) {
    segments.push({ type: 'text', content: htmlText.slice(pos) });
  }
  return segments.map(seg => {
    if (seg.type === 'tag') return seg.content;
    return seg.content.replace(pattern, (m) => {
      const entry = nameIndex.find(n => n.name === m);
      if (!entry) return m;
      // Security: sanitize entry.id to prevent attribute injection (XSS)
      var safeId = SecurityGuard.sanitizeAttr(entry.id);
      if (!safeId) return m;
      return `<span class="name-link" data-char-link="${safeId}">${m}</span>`;
    });
  }).join('');
}

function bindNameLinks() {
  document.querySelectorAll('[data-char-link]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // Security: validate charId before navigation to prevent route injection
      var charId = SecurityGuard.validateDataRoute(el.dataset.charLink);
      if (charId) setRoute('characters', charId);
    });
  });
}



/* ===== DIRECTOR & WEBMASTER DETAIL PAGES ===== */
function renderDirectorPage() {
  // Generate garbled text — random Unicode block characters
  const garbleChars = '█▓▒░■□▪▫◾◿◺▞▟▘▝▚▞▟▖▗▙▘▝▚▛▜▞▟¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
  let garbled = '';
  for (let i = 0; i < 600; i++) {
    garbled += garbleChars[Math.floor(Math.random() * garbleChars.length)];
    if ((i + 1) % 48 === 0) garbled += '\n';
  }
  return `
    <div class="page director-page" id="page-director">
      <div class="director-garble" id="directorGarble">${garbled}</div>
    </div>
  `;
}

function startDirectorGarble() {
  const el = document.getElementById('directorGarble');
  if (!el) return;
  const garbleChars = '█▓▒░■□▪▫◾◿◺▞▟▘▝▚▞▟▖▗▙▘▝▚▛▜▞▟¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
  if (window.__directorGarbleTimer) clearInterval(window.__directorGarbleTimer);
  window.__directorGarbleTimer = setInterval(() => {
    let garbled = '';
    for (let i = 0; i < 600; i++) {
      garbled += garbleChars[Math.floor(Math.random() * garbleChars.length)];
      if ((i + 1) % 48 === 0) garbled += '\n';
    }
    el.textContent = garbled;
  }, 120);
}

function clearDirectorGarble() {
  if (window.__directorGarbleTimer) {
    clearInterval(window.__directorGarbleTimer);
    window.__directorGarbleTimer = null;
  }
}

function bindAboutHiddenEntries() {
  const director = document.getElementById('directorName');
  const webmaster = document.getElementById('webmasterName');
  if (director) {
    director.addEventListener('dblclick', () => setRoute('director'));
  }
  if (webmaster) {
    webmaster.addEventListener('dblclick', () => setRoute('webmaster'));
  }
}

function renderWebmasterPage() {
  const verses = [
    '弧纹框定十二恒定神筵',
    '私念锚定独属一纸法言',
    '折界剖分黄道错落星垣',
    '空茫消融所有妄求尘缘',
    '环轨复刻地支往复循环',
    '执欲攀附律章赋予尊颜',
    '刻度区划四途层叠疆沿',
    '荒寂褪尽托亚兰间盛繁',
    '数列演算万法底层根源',
    '贪垒堆叠众神隐秘心渊',
    '秘契封存梦域未宣真诠',
    '弧光归于万象无存之渊'
  ];
  return `
    <div class="page webmaster-page" id="page-webmaster">
      <div class="wm-redline"></div>
      <div class="webmaster-container">
        <div class="webmaster-header">
          <span class="webmaster-title wm-flicker">ArcLight<span class="wm-dot">·</span>弧光</span>
          <div class="webmaster-subtitle">STATION MASTER</div>
        </div>
        <div class="webmaster-seal"></div>
        <div class="webmaster-fields">
          <div class="webmaster-field">
            <div class="wm-label">性别</div>
            <div class="wm-value">光</div>
          </div>
          <div class="webmaster-field">
            <div class="wm-label">年龄</div>
            <div class="wm-value">0岁</div>
          </div>
        </div>
        <div class="webmaster-verses">
          ${verses.map(v => `<div class="webmaster-verse">${v}</div>`).join('')}
        </div>
        <a class="wm-back back-link" data-link="about">← 返回</a>
      </div>
    </div>
  `;
}

function renderAboutPage() {
  return `
    <div class="page" id="page-about">
      <section class="detail-header">
        <h2>关于系统</h2>
        <div class="detail-sub">ABOUT // ASYLUM ARCHIVE SYSTEM</div>
      </section>
      <section class="section">
        <div class="about-terminal">
          <div class="about-row director-row">
            <span class="about-label">院长</span>
            <span class="glitch-text" data-glitch id="directorName">██████████████</span>
          </div>
          <div class="about-row webmaster-row">
            <span class="about-label">站长</span>
            <span class="webmaster" id="webmasterName">
              <svg class="crescent-icon" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M32 6 A26 26 0 1 0 32 58 A20 20 0 1 1 32 6 Z" fill="currentColor"/>
              </svg>
              <span class="webmaster-name">ArcL</span>
            </span>
          </div>
          <div class="about-divider"></div>
          <div class="about-body">
            <p>精神病院内部档案系统 · 版本 2.4.0</p>
            <p>本系统收录院内职员档案、部门编制、安全守则、事件记录及污染物编号。所有数据均经过加密与权限分级，未经授权的访问将被安全部记录并追责。</p>
            <p class="about-mono">BUILD: 2026.07.29 // NODE: 异常收容科 // STATUS: 在线</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

function startGlitchEffect() {
  const el = document.querySelector('[data-glitch]');
  if (!el) return;
  const glyphs = '█▓▒░■□▪▫◾◿◺▞▟▘▝';
  const base = '';
  const len = 14;
  if (window.__glitchTimer) clearInterval(window.__glitchTimer);
  window.__glitchTimer = setInterval(() => {
    let s = '';
    for (let i = 0; i < len; i++) s += glyphs[Math.floor(Math.random() * glyphs.length)];
    el.textContent = base + s;
  }, 90);
}

function clearGlitchEffect() {
  if (window.__glitchTimer) {
    clearInterval(window.__glitchTimer);
    window.__glitchTimer = null;
  }
}

function renderHome() {
  return `
    <div class="page" id="page-home">
      <section class="hero">
        <div class="hero-glow"></div>
        <div class="hero-badge">内部档案系统 v2.4</div>
        <h1><span class="gold">精神病院</span></h1>
        <div class="subtitle">Psychiatric Hospital</div>
        <div class="divider"></div>
        <p>
          本系统仅供本院员工查阅。收录人设档案、部门架构、事件记录与污染物数据库。<br>
          本院立足于神性选中的实验星球之一。宇宙自大爆炸后经九次对称破缺，人性与神性分离；污染物即宇宙本源污染能与物品、概念结合的产物。本院高层既是追寻人性圆满的化身，亦肩负维护宇宙平衡之责。请各位员工在日常工作中以院内守则为准，谨慎处理相关事务。<br>
          所有信息均属内部机密，未经授权不得外传。
        </p>
        <div class="warning-banner">
          <span class="sym"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <span>您访问的是精神病院内部档案系统。您的所有操作将被记录。请确保您具有相应的访问权限。</span>
        </div>
      </section>

      <section class="section" style="padding-bottom: 0;">
        <div class="stats-row">
          <div class="stat-item"><div class="num">${getAllDepartments().length}</div><div class="label">职能部门</div></div>
          <div class="stat-item"><div class="num">${getAllCharacters().length}</div><div class="label">档案角色</div></div>
          <div class="stat-item"><div class="num">—</div><div class="label">事故记录</div></div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>档案目录</h2>
          <div class="sub">ARCHIVE INDEX</div>
          <div class="line"></div>
        </div>
        <div class="category-grid">
          ${categories.map(c => `
            <div class="category-card" data-link="${escapeHtml(c.id)}">
              <div class="cat-icon">${c.icon}</div>
              <div class="cat-name">${escapeHtml(c.name)}</div>
              <div class="cat-count">${escapeHtml(c.count)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderCharacterList() {
  const allChars = getAllCharacters();
  return `
    <div class="page" id="page-characters">
      <section class="detail-header">
        <h2>人设档案</h2>
        <div class="detail-sub">CHARACTER PROFILES · ${allChars.length} 位角色</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${allChars.map(c => `
            <div class="list-card" data-detail="characters/${escapeHtml(c.id)}">
              <div class="card-title">${escapeHtml(c.name)}${c.alt ? ` <span style="font-size:13px;color:var(--ink-dim);font-family:var(--font-mono)">${escapeHtml(c.alt)}</span>` : ''}</div>
              <div class="card-body">${escapeHtml(c.highlight || (c.desc||'').slice(0, 60) + '…')}</div>
              <div class="card-tags">${(c.tags||[]).map(t => `<span class="tag ${escapeHtml(t.type)}">${escapeHtml(t.text)}</span>`).join('')}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderDepartmentList() {
  const allDepts = getAllDepartments();
  return `
    <div class="page" id="page-departments">
      <section class="detail-header">
        <h2>职能部门</h2>
        <div class="detail-sub">DEPARTMENTS · ${allDepts.length} 个部门</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${allDepts.map(d => `
            <div class="list-card" data-detail="departments/${escapeHtml(d.id)}">
              <div class="card-title">${escapeHtml(d.name)}</div>
              <div class="card-sub">${escapeHtml(d.desc)}</div>
              <div class="card-body"><strong style="color:var(--teal)">部长：</strong>${escapeHtml(d.lead || '—')}<br><strong style="color:var(--teal)">副部长：</strong>${escapeHtml(d.deputy || '—')}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderRulesList() {
  const allBooks = getAllRulebooks();
  return `
    <div class="page" id="page-rules">
      <section class="detail-header">
        <h2>院区守则</h2>
        <div class="detail-sub">RULES & REGULATIONS · ${allBooks.length} 份守则</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${allBooks.map(b => `
            <div class="list-card" data-detail="rules/${escapeHtml(b.id)}">
              <div class="card-title">${escapeHtml(b.name)}</div>
              <div class="card-sub">${b.items.length} 条规则</div>
              <div class="card-body">${escapeHtml(b.desc)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderRulebookDetail(bookId) {
  const b = getAllRulebooks().find(x => x.id === bookId);
  if (!b) return renderRulesList();
  return `
    <div class="page" id="page-rulebook-detail">
      <section class="detail-header">
        <h2>${escapeHtml(b.name)}</h2>
        <div class="detail-sub">RULES & REGULATIONS · ${b.items.length} 条规则</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${b.items.map(r => `
            <div class="list-card" data-detail="rules/${escapeHtml(b.id)}/${escapeHtml(r.id)}">
              <div class="card-title"><span style="color:var(--ink-dim);font-family:var(--font-mono);margin-right:8px">${String(r.num).padStart(2, '0')}</span>${escapeHtml(r.title)}</div>
              <div class="card-body">${escapeHtml(r.content)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderRuleDetail(bookId, ruleId) {
  const b = getAllRulebooks().find(x => x.id === bookId);
  if (!b) return renderRulesList();
  const r = b.items.find(x => x.id === ruleId);
  if (!r) return renderRulebookDetail(bookId);
  return `
    <div class="page" id="page-rule-detail">
      <section class="detail-header">
        <h2><span style="color:var(--ink-dim);display:block;font-size:14px;letter-spacing:2px;font-family:var(--font-mono);margin-bottom:8px">${escapeHtml(b.name)} · RULE ${String(r.num).padStart(2, '0')}</span>${escapeHtml(r.title)}</h2>
        <div class="detail-sub">RULES & REGULATIONS</div>
      </section>
      <div class="detail-content">
        <div class="detail-block">
          <h3>守则内容</h3>
          <p>${linkifyNames(escapeHtml(r.content))}</p>
        </div>
        <a class="back-link" data-link="rules/${escapeHtml(b.id)}">← 返回 ${escapeHtml(b.name)}</a>
      </div>
    </div>
  `;
}

function renderContaminantList() {
  const allConts = getAllContaminants();
  return `
    <div class="page" id="page-contaminants">
      <section class="detail-header">
        <h2>污染物数据库</h2>
        <div class="detail-sub">CONTAMINANTS DATABASE · ${allConts.length} 条记录</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${allConts.map(c => `
            <div class="list-card" data-detail="contaminants/${escapeHtml(c.id)}">
              <div class="card-title"><span style="color:var(--ink-dim);font-family:var(--font-mono);margin-right:8px">${escapeHtml(c.code)}</span>${escapeHtml(c.name)}</div>
              <div class="card-body">编号 ${escapeHtml(c.code)}。</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderContaminantDetail(id) {
  const c = getAllContaminants().find(x => x.id === id);
  if (!c) return renderContaminantList();
  return `
    <div class="page" id="page-contaminant-detail">
      <section class="detail-header">
        <h2><span style="color:var(--ink-dim);display:block;font-size:14px;letter-spacing:2px;font-family:var(--font-mono);margin-bottom:8px">CONTAMINANT · ${escapeHtml(c.code)}</span>${escapeHtml(c.name)}</h2>
        <div class="detail-sub">CONTAMINANTS DATABASE</div>
      </section>
      <div class="detail-content">
        <div class="detail-block">
          <h3>基础信息</h3>
          <div class="field"><strong>编号</strong><span>${escapeHtml(c.code)}</span></div>
          <div class="field"><strong>名称</strong><span>${escapeHtml(c.name)}</span></div>
        </div>
        <a class="back-link" data-link="contaminants">← 返回污染物列表</a>
      </div>
    </div>
  `;
}

function renderStoryList() {
  const allStories = getAllStories();
  return `
    <div class="page" id="page-stories">
      <section class="detail-header">
        <h2>故事记录</h2>
        <div class="detail-sub">STORY RECORDS · ${allStories.length} 条记录</div>
      </section>
      <section class="section">
        <div class="list-grid">
          ${allStories.map(s => `
            <div class="list-card" data-detail="stories/${escapeHtml(s.id)}">
              <div class="card-title"><span style="color:var(--ink-dim);font-family:var(--font-mono);margin-right:8px">${String(s.num).padStart(3, '0')}</span>${escapeHtml(s.title)}</div>
              <div class="card-body">${escapeHtml((s.content||'').slice(0, 80).replace(/\n/g, ' '))}${(s.content||'').length > 80 ? '…' : ''}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderStoryDetail(id) {
  const s = getAllStories().find(x => x.id === id);
  if (!s) return renderStoryList();
  // Security: sanitize pre-formatted HTML content
  const contentHtml = s.contentHtml ? SecurityGuard.sanitizeHtml(s.contentHtml) : s.content.split('\n').map(p => `<p>${linkifyNames(escapeHtml(p))}</p>`).join('');
  return `
    <div class="page" id="page-story-detail">
      <section class="detail-header">
        <h2><span style="color:var(--ink-dim);display:block;font-size:14px;letter-spacing:2px;font-family:var(--font-mono);margin-bottom:8px">STORY RECORDS · NO.${String(s.num).padStart(3, '0')}</span>${escapeHtml(s.title)}</h2>
        <div class="detail-sub">STORY RECORDS</div>
      </section>
      <div class="detail-content">
        <div class="detail-block">
          <h3>故事内容</h3>
          ${contentHtml}
        </div>
        <a class="back-link" data-link="stories">← 返回故事列表</a>
      </div>
    </div>
  `;
}

function renderEmptyPage(title, sub, icon) {
  const emptyIcon = icon || "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"width:56px;height:56px\"><circle cx=\"20\" cy=\"20\" r=\"10\"/><path d=\"M36 36l-8-8\"/></svg>";
  return `
    <div class="page">
      <section class="detail-header">
        <h2>${title}</h2>
        <div class="detail-sub">${sub}</div>
      </section>
      <section class="section">
        <div class="empty-state">
          <div class="empty-icon">${emptyIcon}</div>
          <p>该分类下暂无条目</p>
        </div>
      </section>
    </div>
  `;
}

function renderCharacterDetail(id) {
  const c = getAllCharacters().find(x => x.id === id);
  if (!c) return renderCharacterList();
  // Security: sanitize pre-formatted HTML content
  const descHtml = c.descHtml ? SecurityGuard.sanitizeHtml(c.descHtml) : `<p>${linkifyNames(escapeHtml(c.desc))}</p>`;
  return `
    <div class="page" id="page-character-detail">
      <section class="detail-header">
        <h2>${escapeHtml(c.name)}${c.alt ? ` <span style="font-size:16px;color:var(--ink-dim);display:block;margin-top:8px;font-family:var(--font-mono)">${escapeHtml(c.alt)}</span>` : ''}</h2>
        <div class="detail-sub">CHARACTER PROFILE</div>
      </section>
      <div class="detail-content">
        <div class="detail-block">
          <h3>基础信息</h3>
          ${c.gender ? `<div class="field"><strong>性别</strong><span>${escapeHtml(c.gender)}</span></div>` : ''}
          ${c.age ? `<div class="field"><strong>年龄</strong><span>${escapeHtml(c.age)}</span></div>` : ''}
          ${c.height ? `<div class="field"><strong>身高</strong><span>${escapeHtml(c.height)}</span></div>` : ''}
          ${c.dept ? `<div class="field"><strong>部门</strong><span>${escapeHtml(c.dept)}</span></div>` : ''}
          <div class="detail-tags">${(c.tags||[]).map(t => `<span class="tag ${escapeHtml(t.type)}">${escapeHtml(t.text)}</span>`).join('')}</div>
        </div>
        <div class="detail-block">
          <h3>人物描述</h3>
          ${descHtml}
          ${c.highlight ? `<p><span style="color:var(--teal);font-family:var(--font-mono)">▸</span> ${linkifyNames(escapeHtml(c.highlight))}</p>` : ''}
        </div>
        <a class="back-link" data-link="characters">← 返回人设列表</a>
      </div>
    </div>
  `;
}

function renderDepartmentDetail(id) {
  const d = getAllDepartments().find(x => x.id === id);
  if (!d) return renderDepartmentList();
  // Security: sanitize pre-formatted HTML content
  const descHtml = d.descHtml ? SecurityGuard.sanitizeHtml(d.descHtml) : `<p>${linkifyNames(escapeHtml(d.desc))}</p>`;
  return `
    <div class="page" id="page-department-detail">
      <section class="detail-header">
        <h2>${escapeHtml(d.name)}</h2>
        <div class="detail-sub">DEPARTMENT PROFILE</div>
      </section>
      <div class="detail-content">
        <div class="detail-block">
          <h3>部门职责</h3>
          ${descHtml}
        </div>
        <div class="detail-block">
          <h3>人员构成</h3>
          <div class="field"><strong>部长</strong><span>${linkifyNames(escapeHtml(d.lead || '—'))}</span></div>
          <div class="field"><strong>副部长</strong><span>${linkifyNames(escapeHtml(d.deputy || '—'))}</span></div>
          <div class="field"><strong>员工</strong><span>${linkifyNames(escapeHtml(d.staff || '—'))}</span></div>
        </div>
        <a class="back-link" data-link="departments">← 返回部门列表</a>
      </div>
    </div>
  `;
}


function render() {
  const app = document.getElementById('app');
  const cur = getRoute();
  const { page, type, id } = cur;
  const returning = isReturningToList();
  const listKey = routeKey(page, type, id);

  clearGlitchEffect();
  clearDirectorGarble();
  renderNav();

  if (page === 'home') app.innerHTML = renderHome();
  else if (page === 'characters') {
    if (type) app.innerHTML = renderCharacterDetail(type);
    else app.innerHTML = renderCharacterList();
  }
  else if (page === 'departments') {
    if (type) app.innerHTML = renderDepartmentDetail(type);
    else app.innerHTML = renderDepartmentList();
  }
  else if (page === 'rules') {
    if (type && id) app.innerHTML = renderRuleDetail(type, id);
    else if (type) app.innerHTML = renderRulebookDetail(type);
    else app.innerHTML = renderRulesList();
  }
  else if (page === 'stories') {
    if (type) app.innerHTML = renderStoryDetail(type);
    else app.innerHTML = renderStoryList();
  }
  else if (page === 'contaminants') {
    if (type) app.innerHTML = renderContaminantDetail(type);
    else app.innerHTML = renderContaminantList();
  }
  else if (page === 'search') {
    app.innerHTML = renderSearchPage(type || '');
  }
  else if (page === 'about') {
    app.innerHTML = renderAboutPage();
  }
  else if (page === 'director') {
    app.innerHTML = renderDirectorPage();
  }
  else if (page === 'webmaster') {
    app.innerHTML = renderWebmasterPage();
  }
  else if (page === 'map') app.innerHTML = renderMapPage();
  else if (page === 'stats') app.innerHTML = renderStatsPage();
  else if (page === 'relations') {
    app.innerHTML = renderRelationsPage();
    setTimeout(() => { if (typeof RelationGraph !== 'undefined') RelationGraph.init(document.getElementById('relation-graph-container')); }, 50);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  else app.innerHTML = renderHome();

  bindLinks();
  bindNameLinks();
  bindTiltEffects();
  bindScrollProgress();
  animateNumbers();
  bindCardActions();
  if (page === 'about') {
    startGlitchEffect();
    bindAboutHiddenEntries();
  }
  if (page === 'director') startDirectorGarble();

  if (returning) {
    const y = getSavedScroll(listKey);
    if (y > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    }
  } else {
    // Use 'auto' (instant) for first load to avoid WebView smooth-scroll issues
    window.scrollTo({ top: 0, behavior: prevRoute ? 'smooth' : 'auto' });
  }

  prevRoute = { page, type, id };
}

function bindLinks() {
  document.querySelectorAll('[data-link]').forEach(el => {
    el.addEventListener('click', () => {
      const curRoute = getRoute();
      const isFromHiddenPage = curRoute.page === 'director' || curRoute.page === 'webmaster';
      // Security: validate data-link before navigation
      const safeLink = SecurityGuard.validateDataRoute(el.dataset.link);
      if (!safeLink) return; // reject invalid route
      if (el.classList.contains('back-link')) {
        if (isFromHiddenPage) {
          replaceRoute(safeLink);
        } else if (window.history.length > 1) {
          const currentHash = location.hash;
          window.history.back();
          setTimeout(() => {
            if (location.hash === currentHash) {
              setRoute(safeLink);
            }
          }, 150);
        } else {
          setRoute(safeLink);
        }
      } else {
        setRoute(safeLink);
      }
      closeSidebar();
    });
  });
  document.querySelectorAll('[data-detail]').forEach(el => {
    el.addEventListener('click', () => {
      saveScroll();
      // Security: validate data-detail before navigation
      const safeRoute = SecurityGuard.validateDataRoute(el.dataset.detail);
      if (!safeRoute) return; // reject invalid route
      const parts = safeRoute.split('/');
      setRoute(parts[0], parts[1], parts[2]);
    });
  });
}

/* ===== CARD ACTIONS (no-op in read-only mode) ===== */
function bindCardActions() {
  // Read-only mode: no card actions available
}




