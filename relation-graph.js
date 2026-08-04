// ============================================================
// relation-graph.js
// 角色关系图谱可视化（精神病院档案系统）
// ------------------------------------------------------------
// 依赖：
//   - 全局数组 characters（data/characters.js）
//   - setRoute(page, type, id)（js/app.js），点击节点跳转角色详情
// 纯原生 JS + 内联 SVG，无第三方依赖。
//
// 用法：
//   RelationGraph.init(document.getElementById('rg-container'));
//   RelationGraph.destroy();   // 离开页面时调用（可选，离开 DOM 也会自动清理）
//
// 对外接口：init(container) / render() / destroy()
// ============================================================

const RelationGraph = (function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ===== 可调配置 ===== */
  var CONFIG = {
    simIterations: 300,     // 初始化物理模拟迭代次数（结束后图谱静止）
    minCanvasHeight: 500,   // 画布最小高度
    defaultHeight: 560,     // 画布默认高度

    // —— 连线规则：两个角色共享同一标签即连线 ——
    // gender 默认不参与连线：它会把近半数角色连成一个完全团，
    // 使“节点大小=连接数”与“悬停高亮”失去意义、图谱不可读。
    // 如需包含性别连线，将 includeGender 置为 true。
    includeGender: false,
    edgeDept: true,         // 同部门（dept 字段）连线

    // —— 力学参数 ——
    repulsion: 3000,        // 库仑排斥力强度
    springK: 0.045,         // 胡克弹簧劲度
    springLen: 92,          // 弹簧自然长度（基础值，共享越多越短）
    clusterK: 0.014,        // 部门聚集力（拉向部门质心）
    centerK: 0.006,         // 中心引力（防止飞出画布）
    damping: 0.85,          // 速度阻尼
    maxSpeed: 12,           // 单帧最大位移（防止爆炸）

    // —— 节点尺寸 ——
    minRadius: 8,
    maxRadius: 22,

    // —— 缩放范围 ——
    minZoom: 0.3,
    maxZoom: 3
  };

  /* ===== 内部状态 ===== */
  var container = null;     // 宿主容器
  var wrapper = null;       // .relation-graph 包裹层
  var svg = null;           // <svg> 根
  var viewport = null;      // <g> 视口（承载 pan/zoom 变换）
  var edgeLayer = null;     // <g> 边层
  var nodeLayer = null;     // <g> 节点层
  var legendEl = null;
  var hintEl = null;
  var toolbarEl = null;

  var canvasW = 0, canvasH = 0;
  var nodes = [];           // 节点数据
  var edges = [];           // 边数据
  var nodeIndex = {};       // id -> node
  var deptList = [];        // 部门列表（已排序）
  var palette = [];         // 部门调色板（由 teal/gold/red 派生）
  var deptColor = {};       // 部门 -> 颜色

  var view = { x: 0, y: 0, k: 1 }; // 视口变换
  var destroyed = false;
  var simRunning = false;

  // 交互状态
  var dragNode = null;
  var panStart = null;
  var pointerStart = null;
  var suppressClick = false;

  // 清理用
  var ac = null;            // AbortController（统一移除事件）
  var ro = null;            // ResizeObserver
  var mo = null;            // MutationObserver（DOM 被移除时自动 destroy）

  /* ===== 小工具 ===== */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function svgEl(name) { return document.createElementNS(SVGNS, name); }

  function on(el, evt, fn, opts) {
    // 统一通过 AbortController 管理，destroy 时一次性移除
    opts = opts || {};
    if (ac) opts.signal = ac.signal;
    el.addEventListener(evt, fn, opts);
  }

  // 读取 CSS 变量值
  function readCssVar(name) {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch (e) { return ''; }
  }

  // —— 颜色转换工具（用于从 teal/gold/red 派生部门调色板）——
  function parseColor(str) {
    str = String(str || '').trim();
    if (str.charAt(0) === '#') {
      var h = str.slice(1);
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(h, 16);
      if (isNaN(n)) return { r: 128, g: 128, b: 128 };
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    var m = str.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(',').map(function (s) { return parseFloat(s); });
      return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0 };
    }
    return { r: 128, g: 128, b: 128 };
  }

  function rgbToHsl(o) {
    var r = o.r / 255, g = o.g / 255, b = o.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = 0; s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToHex(o) {
    return '#' + [o.r, o.g, o.b].map(function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
  }

  /* ===== 部门调色板：基于 teal/gold(--brand)/red 三个 CSS 变量派生 ===== */
  function buildPalette() {
    var anchors = ['--teal', '--brand', '--red'].map(readCssVar).map(parseColor);
    // 每个锚色派生 4 个明度变体，共 12 色，足以覆盖部门数量
    var shifts = [0, 12, -12, 22];
    var colors = [];
    anchors.forEach(function (c) {
      var hsl = rgbToHsl(c);
      shifts.forEach(function (d) {
        colors.push(rgbToHex(hslToRgb(hsl.h, hsl.s * 0.95, clamp(hsl.l + d, 18, 82))));
      });
    });
    return colors;
  }

  /* ===== 数据建模：从全局 characters 构建节点与边 ===== */
  function buildData() {
    var list = (typeof characters !== 'undefined') ? characters : [];
    if (!list.length) { nodes = []; edges = []; nodeIndex = {}; deptList = []; return; }

    // 收集部门（'未分配' 排到末尾）
    var deptSet = {};
    list.forEach(function (c) { deptSet[c.dept || '未分配'] = true; });
    deptList = Object.keys(deptSet).sort(function (a, b) {
      if (a === '未分配') return 1;
      if (b === '未分配') return -1;
      return a.localeCompare(b, 'zh');
    });

    palette = buildPalette();
    deptColor = {};
    deptList.forEach(function (d, i) {
      if (d === '未分配') {
        deptColor[d] = readCssVar('--ink-muted') || '#8a8f9c';
      } else {
        deptColor[d] = palette[i % palette.length];
      }
    });

    // 确定参与连线的标签类型：除 'dept'（由字段单独处理）外，默认排除 'gender'
    var tagTypes = {};
    list.forEach(function (c) {
      (c.tags || []).forEach(function (t) { tagTypes[t.type] = true; });
    });
    var edgeTagTypes = Object.keys(tagTypes).filter(function (t) {
      if (t === 'dept') return false;
      if (t === 'gender' && !CONFIG.includeGender) return false;
      return true;
    });

    // 节点
    nodes = list.map(function (c, i) {
      var dept = c.dept || '未分配';
      var tagKeys = {};
      (c.tags || []).forEach(function (t) {
        if (edgeTagTypes.indexOf(t.type) !== -1) tagKeys[t.type + '|' + t.text] = true;
      });
      return {
        idx: i,
        id: c.id,
        name: c.name,
        dept: dept,
        tagKeys: tagKeys,
        x: 0, y: 0, vx: 0, vy: 0,
        pinned: false,
        degree: 0,
        color: deptColor[dept] || '#8a8f9c',
        radius: 0,
        neighbors: {},
        edgeEls: [],
        el: null
      };
    });
    nodeIndex = {};
    nodes.forEach(function (n) { nodeIndex[n.id] = n; });

    // 边：两个角色共享同一标签（含同部门）即连线，权重=共享特征数
    edges = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var w = 0;
        if (CONFIG.edgeDept && a.dept !== '未分配' && a.dept === b.dept) w++;
        for (var k in a.tagKeys) { if (b.tagKeys[k]) w++; }
        if (w > 0) {
          edges.push({ source: i, target: j, weight: w, el: null });
          a.degree++; b.degree++;
          a.neighbors[j] = true; b.neighbors[i] = true;
        }
      }
    }

    // 节点半径：依据连接数（开方缩放，差异更柔和）
    var maxDeg = 1;
    nodes.forEach(function (n) { if (n.degree > maxDeg) maxDeg = n.degree; });
    nodes.forEach(function (n) {
      var f = Math.sqrt(n.degree) / Math.sqrt(maxDeg);
      n.radius = CONFIG.minRadius + (CONFIG.maxRadius - CONFIG.minRadius) * f;
    });
  }

  /* ===== 初始布局：按部门分扇区放置，利于聚类收敛 ===== */
  function initLayout() {
    var cx = canvasW / 2, cy = canvasH / 2;
    var R = Math.min(canvasW, canvasH) * 0.34;
    var realDepts = deptList.filter(function (d) { return d !== '未分配'; });
    var sectors = {};
    realDepts.forEach(function (d, i) {
      var ang = (i / Math.max(1, realDepts.length)) * Math.PI * 2 - Math.PI / 2;
      sectors[d] = { x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R };
    });
    nodes.forEach(function (n) {
      var base;
      if (sectors[n.dept]) {
        base = sectors[n.dept];
      } else {
        // 未分配部门：散布在外圈
        var ang = Math.random() * Math.PI * 2;
        base = { x: cx + Math.cos(ang) * R * 1.15, y: cy + Math.sin(ang) * R * 1.15 };
      }
      n.x = base.x + (Math.random() - 0.5) * 44;
      n.y = base.y + (Math.random() - 0.5) * 44;
      n.vx = 0; n.vy = 0;
    });
  }

  /* ===== 物理模拟：单步迭代 =====
   * 简化的力导向积分（类 Verlet / 半隐式欧拉 + 阻尼）：
   *   1) 库仑排斥：任意两节点互斥，F ∝ 1/r²
   *   2) 胡克弹簧：相连节点间吸引，F = k(r - L0)
   *   3) 部门聚集：节点被拉向本部门质心
   *   4) 中心引力：整体向画布中心轻微收敛
   */
  function tick() {
    var n = nodes.length, i, j;

    // 1) 库仑排斥力（O(n²)）
    for (i = 0; i < n; i++) {
      var a = nodes[i];
      for (j = i + 1; j < n; j++) {
        var b = nodes[j];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = dx * dx + dy * dy + 0.01; }
        var d = Math.sqrt(d2);
        var f = CONFIG.repulsion / d2;
        var fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // 2) 胡克弹簧力
    for (var e = 0; e < edges.length; e++) {
      var ed = edges[e];
      var sa = nodes[ed.source], sb = nodes[ed.target];
      var sdx = sb.x - sa.x, sdy = sb.y - sa.y;
      var sd = Math.sqrt(sdx * sdx + sdy * sdy) || 0.01;
      var rest = CONFIG.springLen / (1 + ed.weight * 0.25); // 共享特征越多，自然长度越短
      var diff = sd - rest;
      var sf = CONFIG.springK * diff;
      var sfx = (sdx / sd) * sf, sfy = (sdy / sd) * sf;
      sa.vx += sfx; sa.vy += sfy;
      sb.vx -= sfx; sb.vy -= sfy;
    }

    // 3) 部门质心 + 4) 中心引力
    var centroids = {}, counts = {};
    nodes.forEach(function (nd) {
      if (!centroids[nd.dept]) { centroids[nd.dept] = { x: 0, y: 0 }; counts[nd.dept] = 0; }
      centroids[nd.dept].x += nd.x; centroids[nd.dept].y += nd.y; counts[nd.dept]++;
    });
    for (var d in centroids) { centroids[d].x /= counts[d]; centroids[d].y /= counts[d]; }
    var cx = canvasW / 2, cy = canvasH / 2;
    nodes.forEach(function (nd) {
      var c = centroids[nd.dept];
      nd.vx += (c.x - nd.x) * CONFIG.clusterK;
      nd.vy += (c.y - nd.y) * CONFIG.clusterK;
      nd.vx += (cx - nd.x) * CONFIG.centerK;
      nd.vy += (cy - nd.y) * CONFIG.centerK;
    });

    // 积分（带阻尼、限速、软边界）
    var m = 28;
    nodes.forEach(function (nd) {
      if (nd.pinned) return;
      nd.vx *= CONFIG.damping; nd.vy *= CONFIG.damping;
      var sp = Math.sqrt(nd.vx * nd.vx + nd.vy * nd.vy);
      if (sp > CONFIG.maxSpeed) { nd.vx = nd.vx / sp * CONFIG.maxSpeed; nd.vy = nd.vy / sp * CONFIG.maxSpeed; }
      nd.x += nd.vx; nd.y += nd.vy;
      if (nd.x < m) { nd.x = m; nd.vx *= -0.3; }
      if (nd.x > canvasW - m) { nd.x = canvasW - m; nd.vx *= -0.3; }
      if (nd.y < m) { nd.y = m; nd.vy *= -0.3; }
      if (nd.y > canvasH - m) { nd.y = canvasH - m; nd.vy *= -0.3; }
    });
  }

  // 异步分批运行模拟（避免阻塞 UI，并呈现“落定”动画），达到指定迭代数后停止
  function runSimulation(onDone) {
    simRunning = true;
    var iter = 0;
    var perFrame = 12;
    function frame() {
      if (destroyed || !svg) return;
      for (var i = 0; i < perFrame && iter < CONFIG.simIterations; i++) { tick(); iter++; }
      updatePositions();
      if (iter < CONFIG.simIterations) {
        requestAnimationFrame(frame);
      } else {
        simRunning = false;
        autoFit();
        updatePositions();
        if (typeof onDone === 'function') onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ===== 渲染：构建内联 SVG ===== */
  function render() {
    if (!viewport) return;
    viewport.innerHTML = '';
    updateViewport();

    // 边层
    edgeLayer = svgEl('g');
    edgeLayer.setAttribute('class', 'rg-edges');
    viewport.appendChild(edgeLayer);
    edges.forEach(function (e) {
      var ln = svgEl('line');
      ln.setAttribute('class', 'rg-edge');
      ln.setAttribute('stroke-width', (0.5 + e.weight * 0.5).toFixed(2));
      ln.style.opacity = clamp(0.10 + e.weight * 0.10, 0.08, 0.5).toFixed(2);
      edgeLayer.appendChild(ln);
      e.el = ln;
    });

    // 节点层
    nodeLayer = svgEl('g');
    nodeLayer.setAttribute('class', 'rg-nodes');
    viewport.appendChild(nodeLayer);
    nodes.forEach(function (nd) {
      var g = svgEl('g');
      g.setAttribute('class', 'rg-node');
      g.dataset.id = nd.id;
      g.style.color = nd.color; // 供 currentColor 光晕使用

      var c = svgEl('circle');
      c.setAttribute('class', 'rg-node-circle');
      c.setAttribute('r', nd.radius);
      c.setAttribute('fill', nd.color);
      g.appendChild(c);

      var t = svgEl('text');
      t.setAttribute('class', 'rg-label');
      t.setAttribute('x', 0);
      t.setAttribute('y', nd.radius + 12);
      t.textContent = nd.name;
      g.appendChild(t);

      nodeLayer.appendChild(g);
      nd.el = g;
      attachNodeEvents(g, nd);
    });

    updatePositions();
  }

  // 把节点坐标同步到 DOM
  function updatePositions() {
    if (!nodeLayer) return;
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.el) nd.el.setAttribute('transform', 'translate(' + nd.x.toFixed(2) + ',' + nd.y.toFixed(2) + ')');
    }
    for (var e = 0; e < edges.length; e++) {
      var ed = edges[e];
      if (!ed.el) continue;
      var a = nodes[ed.source], b = nodes[ed.target];
      ed.el.setAttribute('x1', a.x.toFixed(2));
      ed.el.setAttribute('y1', a.y.toFixed(2));
      ed.el.setAttribute('x2', b.x.toFixed(2));
      ed.el.setAttribute('y2', b.y.toFixed(2));
    }
  }

  // 应用 pan/zoom 视口变换
  function updateViewport() {
    if (viewport) {
      viewport.setAttribute('transform',
        'translate(' + view.x.toFixed(2) + ',' + view.y.toFixed(2) + ') scale(' + view.k.toFixed(4) + ')');
    }
  }

  // 自适应：根据节点包围盒计算视口缩放与居中
  function autoFit() {
    if (!nodes.length) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (nd) {
      var r = nd.radius + 8;
      if (nd.x - r < minX) minX = nd.x - r;
      if (nd.x + r > maxX) maxX = nd.x + r;
      if (nd.y - r < minY) minY = nd.y - r;
      if (nd.y + r > maxY) maxY = nd.y + r;
    });
    var bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var pad = 44;
    var k = clamp(Math.min((canvasW - pad * 2) / bw, (canvasH - pad * 2) / bh), CONFIG.minZoom, CONFIG.maxZoom);
    view.k = k;
    view.x = (canvasW - (minX + maxX) * k) / 2;
    view.y = (canvasH - (minY + maxY) * k) / 2;
    updateViewport();
  }

  /* ===== 悬停高亮：点亮相关节点与边，其余变暗 ===== */
  function highlight(id) {
    if (!svg) return;
    if (id == null) {
      svg.classList.remove('rg-hovering');
      nodes.forEach(function (nd) { if (nd.el) { nd.el.classList.remove('active', 'dimmed'); } });
      edges.forEach(function (e) { if (e.el) { e.el.classList.remove('active', 'dimmed'); } });
      return;
    }
    svg.classList.add('rg-hovering');
    var focus = nodeIndex[id];
    if (!focus) return;
    nodes.forEach(function (nd) {
      if (!nd.el) return;
      if (nd.id === id || focus.neighbors[nd.idx]) {
        nd.el.classList.add('active');
        nd.el.classList.remove('dimmed');
      } else {
        nd.el.classList.add('dimmed');
        nd.el.classList.remove('active');
      }
    });
    edges.forEach(function (e) {
      if (!e.el) return;
      if (e.source === focus.idx || e.target === focus.idx) {
        e.el.classList.add('active');
        e.el.classList.remove('dimmed');
      } else {
        e.el.classList.add('dimmed');
        e.el.classList.remove('active');
      }
    });
  }

  /* ===== 坐标换算：屏幕坐标 -> 图谱坐标 ===== */
  function clientToGraph(clientX, clientY) {
    var rect = svg.getBoundingClientRect();
    var sx = clientX - rect.left, sy = clientY - rect.top;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
  }

  /* ===== 节点事件 ===== */
  function attachNodeEvents(g, nd) {
    g.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      nd.pinned = true;
      dragNode = nd;
      suppressClick = false;
      pointerStart = { x: e.clientX, y: e.clientY };
      var pt = clientToGraph(e.clientX, e.clientY);
      nd._offX = pt.x - nd.x;
      nd._offY = pt.y - nd.y;
      highlight(nd.id);
    });
    g.addEventListener('pointerenter', function () {
      if (!dragNode && !panStart) highlight(nd.id);
    });
    g.addEventListener('pointerleave', function () {
      if (!dragNode && !panStart) highlight(null);
    });
    g.addEventListener('click', function (e) {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
      if (typeof setRoute === 'function') setRoute('characters', nd.id);
    });
  }

  function onPointerMove(e) {
    if (destroyed || !svg) return;
    if (dragNode) {
      var pt = clientToGraph(e.clientX, e.clientY);
      dragNode.x = pt.x - dragNode._offX;
      dragNode.y = pt.y - dragNode._offY;
      var dx = e.clientX - pointerStart.x, dy = e.clientY - pointerStart.y;
      if (dx * dx + dy * dy > 16) suppressClick = true; // 移动超过阈值则不触发点击跳转
      updatePositions();
    } else if (panStart) {
      view.x = panStart.viewX + (e.clientX - panStart.x);
      view.y = panStart.viewY + (e.clientY - panStart.y);
      updateViewport();
    }
  }

  function onPointerUp() {
    if (destroyed) return;
    if (dragNode) { dragNode.pinned = false; dragNode = null; }
    panStart = null;
    if (svg) svg.classList.remove('panning');
  }

  // 拖拽空白处平移
  function onBackgroundPointerDown(e) {
    if (e.target.closest && e.target.closest('.rg-node')) return; // 点中节点不触发平移
    panStart = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
    suppressClick = false;
    highlight(null);
    if (svg) svg.classList.add('panning');
  }

  // 滚轮缩放（以光标为锚点）
  function onWheel(e) {
    e.preventDefault();
    if (destroyed || !svg) return;
    var rect = svg.getBoundingClientRect();
    var sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    var nk = clamp(view.k * factor, CONFIG.minZoom, CONFIG.maxZoom);
    var gx = (sx - view.x) / view.k, gy = (sy - view.y) / view.k;
    view.x = sx - gx * nk;
    view.y = sy - gy * nk;
    view.k = nk;
    updateViewport();
  }

  // 工具栏按钮缩放（以画布中心为锚点）
  function zoomBy(factor) {
    var cx = canvasW / 2, cy = canvasH / 2;
    var nk = clamp(view.k * factor, CONFIG.minZoom, CONFIG.maxZoom);
    var gx = (cx - view.x) / view.k, gy = (cy - view.y) / view.k;
    view.x = cx - gx * nk;
    view.y = cy - gy * nk;
    view.k = nk;
    updateViewport();
  }

  /* ===== 工具栏 / 图例 / 提示 ===== */
  function icon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  function buildToolbar() {
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'rg-toolbar';
    function btn(svg, title, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = svg;
      b.addEventListener('click', fn);
      toolbarEl.appendChild(b);
    }
    btn(icon('<path d="M12 5v14M5 12h14"/>'), '放大', function () { zoomBy(1.2); });
    btn(icon('<path d="M5 12h14"/>'), '缩小', function () { zoomBy(1 / 1.2); });
    btn(icon('<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>'), '重置视图', function () { autoFit(); });
    wrapper.appendChild(toolbarEl);
  }

  function buildLegend() {
    if (!deptList.length) return;
    legendEl = document.createElement('div');
    legendEl.className = 'rg-legend';
    deptList.forEach(function (d) {
      var item = document.createElement('span');
      item.className = 'lg-item';
      var dot = document.createElement('span');
      dot.className = 'lg-dot';
      dot.style.background = deptColor[d];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(d));
      legendEl.appendChild(item);
    });
    wrapper.appendChild(legendEl);
  }

  function buildHint() {
    hintEl = document.createElement('div');
    hintEl.className = 'rg-hint';
    hintEl.textContent = '拖拽节点移动 · 滚轮缩放 · 拖拽空白处平移 · 点击查看档案';
    wrapper.appendChild(hintEl);
  }

  /* ===== 样式注入（仅一次） ===== */
  function injectStyles() {
    if (document.getElementById('relation-graph-styles')) return;
    var style = document.createElement('style');
    style.id = 'relation-graph-styles';
    style.textContent = [
      '.relation-graph{position:relative;width:100%;min-height:500px;height:560px;',
      'background:var(--bg-panel);border:1px solid var(--glass-border);border-radius:var(--radius-md);',
      'overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35),0 0 40px var(--brand-glow);',
      'user-select:none;-webkit-user-select:none;}',
      '.relation-graph-svg{width:100%;height:100%;display:block;cursor:grab;touch-action:none;}',
      '.relation-graph-svg.panning{cursor:grabbing;}',
      // 悬停时整体变暗，再按 active/dimmed 精细控制（!important 确保优先级覆盖行内透明度）
      '.relation-graph-svg.rg-hovering .rg-edge{opacity:.05!important;}',
      '.relation-graph-svg.rg-hovering .rg-node{opacity:.2;}',
      '.relation-graph-svg.rg-hovering .rg-edge.active{opacity:1!important;stroke:var(--brand)!important;stroke-width:1.6!important;}',
      '.relation-graph-svg.rg-hovering .rg-node.active{opacity:1!important;}',
      '.relation-graph-svg.rg-hovering .rg-node.dimmed{opacity:.12!important;}',
      '.relation-graph-svg.rg-hovering .rg-edge.dimmed{opacity:.05!important;}',
      // 边
      '.rg-edge{stroke:var(--ink-muted);transition:opacity .15s ease,stroke .15s ease,stroke-width .15s ease;}',
      // 节点
      '.rg-node{cursor:pointer;transition:opacity .15s ease;}',
      '.rg-node-circle{stroke:var(--bg-panel);stroke-width:1.5;transition:r .15s ease,stroke-width .15s ease,filter .15s ease;}',
      '.rg-node:hover .rg-node-circle,.rg-node.active .rg-node-circle{stroke:var(--brand);stroke-width:2;',
      'filter:drop-shadow(0 0 6px currentColor);}',
      // 标签（带描边光晕，深浅色主题均可读）
      '.rg-label{fill:var(--ink);font-size:11px;font-family:var(--font-mono);text-anchor:middle;',
      'pointer-events:none;paint-order:stroke;stroke:var(--bg-panel);stroke-width:3px;stroke-linejoin:round;letter-spacing:.5px;}',
      // 工具栏
      '.rg-toolbar{position:absolute;top:12px;right:12px;display:flex;gap:6px;z-index:5;}',
      '.rg-toolbar button{width:32px;height:32px;border:1px solid var(--glass-border);background:var(--bg-panel);',
      'color:var(--ink);border-radius:var(--radius-md);cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'backdrop-filter:blur(8px);transition:background .15s,color .15s,border-color .15s,transform .1s;}',
      '.rg-toolbar button svg{width:16px;height:16px;}',
      '.rg-toolbar button:hover{background:var(--brand);color:#0b1020;border-color:var(--brand);}',
      '.rg-toolbar button:active{transform:scale(.92);}',
      // 图例
      '.rg-legend{position:absolute;left:12px;bottom:12px;max-width:60%;max-height:55%;overflow:auto;',
      'background:var(--bg-panel);border:1px solid var(--glass-border);border-radius:var(--radius-md);',
      'padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px 12px;font-size:11px;color:var(--ink-muted);',
      'backdrop-filter:blur(8px);z-index:5;}',
      '.rg-legend .lg-item{display:flex;align-items:center;gap:5px;white-space:nowrap;}',
      '.rg-legend .lg-dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;}',
      // 提示
      '.rg-hint{position:absolute;left:12px;top:12px;font-size:11px;color:var(--ink-muted);letter-spacing:.5px;z-index:5;pointer-events:none;}',
      '@media (max-width:560px){.relation-graph{height:520px;}.rg-hint{display:none;}.rg-legend{max-width:46%;}}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ===== 测量画布尺寸 ===== */
  function measureCanvas() {
    canvasW = Math.max(320, (wrapper && wrapper.clientWidth) || (container && container.clientWidth) || 800);
    canvasH = Math.max(CONFIG.minCanvasHeight, (wrapper && wrapper.clientHeight) || CONFIG.defaultHeight);
  }

  /* ===== 初始化 ===== */
  function init(host) {
    destroy();               // 清理上一次实例
    destroyed = false;
    container = host;
    if (!container) return;

    injectStyles();
    ac = new AbortController();

    wrapper = document.createElement('div');
    wrapper.className = 'relation-graph';
    container.appendChild(wrapper);
    measureCanvas();

    buildData();

    svg = svgEl('svg');
    svg.setAttribute('class', 'relation-graph-svg');
    svg.setAttribute('width', canvasW);
    svg.setAttribute('height', canvasH);
    svg.setAttribute('viewBox', '0 0 ' + canvasW + ' ' + canvasH);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    viewport = svgEl('g');
    viewport.setAttribute('class', 'rg-viewport');
    svg.appendChild(viewport);
    wrapper.appendChild(svg);

    buildToolbar();
    buildLegend();
    buildHint();

    if (!nodes.length) {
      var empty = svgEl('text');
      empty.setAttribute('x', canvasW / 2);
      empty.setAttribute('y', canvasH / 2);
      empty.setAttribute('class', 'rg-label');
      empty.textContent = '暂无角色数据';
      // 注意：var() 仅在 CSS / inline-style 中生效，不能写入 SVG 展示属性 fill="..."
      empty.style.fill = 'var(--ink-muted)';
      viewport.appendChild(empty);
      attachGlobalEvents();
      setupObservers();
      return;
    }

    view = { x: 0, y: 0, k: 1 };
    initLayout();
    render();
    attachGlobalEvents();

    // 模拟落定后自适应；之后图谱静止
    runSimulation();

    setupObservers();
  }

  // 监听容器尺寸变化 + DOM 被移除时自动清理
  function setupObservers() {
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (destroyed || !wrapper) return;
        measureCanvas();
        if (svg) {
          svg.setAttribute('width', canvasW);
          svg.setAttribute('height', canvasH);
          svg.setAttribute('viewBox', '0 0 ' + canvasW + ' ' + canvasH);
        }
        autoFit();
      });
      ro.observe(wrapper);
    }
    if (window.MutationObserver) {
      mo = new MutationObserver(function () {
        if (wrapper && !document.contains(wrapper)) destroy();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  function attachGlobalEvents() {
    on(svg, 'pointerdown', onBackgroundPointerDown);
    on(window, 'pointermove', onPointerMove);
    on(window, 'pointerup', onPointerUp);
    on(window, 'pointercancel', onPointerUp);
    on(svg, 'wheel', onWheel, { passive: false });
    on(svg, 'pointerleave', function () { if (!dragNode && !panStart) highlight(null); });
  }

  /* ===== 销毁：移除 DOM、事件、观察者 ===== */
  function destroy() {
    destroyed = true;
    simRunning = false;
    if (ac) { try { ac.abort(); } catch (e) {} ac = null; }
    if (ro) { ro.disconnect(); ro = null; }
    if (mo) { mo.disconnect(); mo = null; }
    dragNode = null; panStart = null; pointerStart = null;
    nodes = []; edges = []; nodeIndex = {}; deptList = []; palette = []; deptColor = {};
    edgeLayer = null; nodeLayer = null; legendEl = null; hintEl = null; toolbarEl = null;
    viewport = null; svg = null;
    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    wrapper = null;
    container = null;
  }

  // 对外接口
  return { init: init, render: render, destroy: destroy };
})();
