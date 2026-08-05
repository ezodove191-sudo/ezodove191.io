// pages.js - 新增页面渲染逻辑（病院地图、数据统计、投稿表单、登录/注册、角色关系）

/* ===== 病院地图页 ===== */
function renderMapPage() {
  const floors = [
    { id: 'b1', name: 'B1 · 地下层', desc: '污染物收容区 · 禁止未授权进入', color: 'var(--red)', areas: ['收容室 A-01~A-12', '污染物研究实验室', '紧急隔离区', '安保监控中心'] },
    { id: 'f1', name: '1F · 一层', desc: '接待大厅 · 医疗部 · 后厨', color: 'var(--teal)', areas: ['接待大厅', '挂号窗口', '门诊室 101~106', '后厨与餐厅', '安保前台'] },
    { id: 'f2', name: '2F · 二层', desc: '住院区 · 安全部', color: 'var(--brand)', areas: ['普通病房 201~208', '安保巡逻站', '员工休息室', '物资存放间'] },
    { id: 'f3', name: '3F · 三层', desc: '科研部 · 特殊病房', color: 'var(--brand)', areas: ['科研实验室 301~305', '特殊监护病房', '数据档案室', '会议室'] },
    { id: 'f4', name: '4F · 四层', desc: '行政部门 · 法务部', color: 'var(--teal)', areas: ['院长办公室', '行政会议室', '法务部办公区', '财务部'] },
    { id: 'rf', name: 'RF · 天台', desc: '维修部 · 直升机停机坪', color: 'var(--red)', areas: ['直升机停机坪', '维修车间', '信号塔', '紧急撤离通道'] },
  ];

  let floorsHtml = floors.map((f, i) => {
    let areasHtml = f.areas.map(a => `<div class="map-area-chip">${escapeHtml(a)}</div>`).join('');
    return `
      <div class="map-floor" style="--floor-color: ${escapeHtml(f.color)}" data-floor="${escapeHtml(f.id)}">
        <div class="map-floor-header">
          <div class="map-floor-number">${escapeHtml(f.id.toUpperCase())}</div>
          <div class="map-floor-info">
            <h3 class="map-floor-name">${escapeHtml(f.name)}</h3>
            <p class="map-floor-desc">${escapeHtml(f.desc)}</p>
          </div>
          <div class="map-floor-expand" title="展开/收起">▾</div>
        </div>
        <div class="map-floor-areas">${areasHtml}</div>
      </div>`;
  }).join('');

  return `
    <section class="detail-header">
      <h1 class="detail-title">病院地图</h1>
      <p class="detail-sub">Psychiatric Hospital — Floor Plan</p>
    </section>
    <section class="section">
      <div class="map-legend">
        <div class="map-legend-item"><span class="dot" style="background:var(--teal)"></span>公共区域</div>
        <div class="map-legend-item"><span class="dot" style="background:var(--brand)"></span>受限区域</div>
        <div class="map-legend-item"><span class="dot" style="background:var(--red)"></span>禁止进入</div>
      </div>
      <div class="map-floors">${floorsHtml}</div>
      <div class="map-placeholder">
        <div class="map-placeholder-icon">🏛</div>
        <p>将病院平面图图片放入 <code>assets/images/map/</code> 目录即可在此显示</p>
        <p class="map-placeholder-hint">命名建议：floor-b1.png, floor-1f.png, floor-2f.png ...</p>
      </div>
    </section>
  `;
}

/* ===== 数据统计面板 ===== */
function renderStatsPage() {
  const allChars = (typeof getAllCharacters === 'function') ? getAllCharacters() : characters;
  const allDepts = (typeof getAllDepartments === 'function') ? getAllDepartments() : departments;
  const allConts = (typeof getAllContaminants === 'function') ? getAllContaminants() : contaminants;
  const allStories = (typeof getAllStories === 'function') ? getAllStories() : stories;

  const genderStats = {};
  allChars.forEach(c => {
    const g = c.gender || (c.tags && c.tags.find(t => t.type === 'gender')?.text) || '未知';
    genderStats[g] = (genderStats[g] || 0) + 1;
  });

  const deptStats = allDepts.map(d => {
    const count = d.staff ? d.staff.split(/[，,、]/).filter(Boolean).length : 0;
    return { name: d.name, count, id: d.id };
  }).sort((a, b) => b.count - a.count);

  const contLevels = {};
  allConts.forEach(c => {
    const lv = c.level !== undefined ? `Level ${c.level}` : '未分类';
    contLevels[lv] = (contLevels[lv] || 0) + 1;
  });

  const maxDeptCount = Math.max(...deptStats.map(d => d.count), 1);
  const maxContLevel = Math.max(...Object.values(contLevels), 1);

  const genderBars = Object.entries(genderStats).map(([g, c]) => {
    const pct = (c / allChars.length * 100).toFixed(1);
    return `<div class="stat-bar-row"><span class="stat-bar-label">${escapeHtml(g)}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:var(--teal)"></div></div><span class="stat-bar-value">${c}</span></div>`;
  }).join('');

  const deptBars = deptStats.map(d => {
    const pct = (d.count / maxDeptCount * 100).toFixed(1);
    return `<div class="stat-bar-row" data-detail="departments/${escapeHtml(d.id)}"><span class="stat-bar-label">${escapeHtml(d.name)}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:var(--brand)"></div></div><span class="stat-bar-value">${d.count}</span></div>`;
  }).join('');

  const contBars = Object.entries(contLevels).map(([lv, c]) => {
    const pct = (c / maxContLevel * 100).toFixed(1);
    return `<div class="stat-bar-row"><span class="stat-bar-label">${escapeHtml(lv)}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:var(--red)"></div></div><span class="stat-bar-value">${c}</span></div>`;
  }).join('');

  return `
    <section class="detail-header">
      <h1 class="detail-title">数据统计</h1>
      <p class="detail-sub">Statistical Dashboard · 实时数据</p>
    </section>
    <section class="section">
      <div class="stats-grid">
        <div class="stat-card stat-card-gold">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-num" data-count="${allChars.length}">${allChars.length}</div>
          <div class="stat-card-label">角色总数</div>
        </div>
        <div class="stat-card stat-card-teal">
          <div class="stat-card-icon">🏢</div>
          <div class="stat-card-num" data-count="${allDepts.length}">${allDepts.length}</div>
          <div class="stat-card-label">部门数量</div>
        </div>
        <div class="stat-card stat-card-red">
          <div class="stat-card-icon">⚠</div>
          <div class="stat-card-num" data-count="${allConts.length}">${allConts.length}</div>
          <div class="stat-card-label">污染物记录</div>
        </div>
        <div class="stat-card stat-card-gold">
          <div class="stat-card-icon">📖</div>
          <div class="stat-card-num" data-count="${allStories.length}">${allStories.length}</div>
          <div class="stat-card-label">故事档案</div>
        </div>
      </div>

      <div class="stats-charts">
        <div class="stat-chart-panel">
          <h3 class="stat-chart-title">角色性别分布</h3>
          ${genderBars || '<p class="stat-empty">暂无数据</p>'}
        </div>
        <div class="stat-chart-panel">
          <h3 class="stat-chart-title">部门人员分布</h3>
          ${deptBars}
        </div>
        <div class="stat-chart-panel">
          <h3 class="stat-chart-title">污染物等级分布</h3>
          ${contBars}
        </div>
      </div>

      <div class="stats-extra">
        <div class="stat-extra-row"><span class="stat-extra-label">在职人员总数</span><span class="stat-extra-value">${deptStats.reduce((s, d) => s + d.count, 0)}</span></div>
        <div class="stat-extra-row"><span class="stat-extra-label">访问模式</span><span class="stat-extra-value">只读</span></div>
        <div class="stat-extra-row"><span class="stat-extra-label">系统版本</span><span class="stat-extra-value">v2.4.0</span></div>
      </div>
    </section>
  `;
}

/* ===== 角色关系图谱页 ===== */
function renderRelationsPage() {
  return `
    <section class="detail-header">
      <h1 class="detail-title">角色关系图谱</h1>
      <p class="detail-sub">Character Relationship Graph</p>
    </section>
    <section class="section">
      <div class="relations-intro">
        <p>拖拽节点可移动位置，滚轮缩放，点击节点查看角色详情。</p>
        <p>相同部门的角色会聚集在一起，共享标签的角色之间会有连线。</p>
      </div>
      <div id="relation-graph-container" class="relation-graph-container"></div>
    </section>
  `;
}
