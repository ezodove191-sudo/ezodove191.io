// security.js - 安全防护模块
// 防止 SQL 注入、XSS、DOM 注入、原型污染、ReDoS 等攻击向量
// 必须在所有其他脚本之前加载

/* ===== 1. 原型污染防护 ===== */
// 冻结 Object.prototype，阻止 __proto__ 注入
(function freezePrototypes() {
  try {
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(String.prototype);
    Object.freeze(Number.prototype);
    Object.freeze(Boolean.prototype);
    Object.freeze(Function.prototype);
  } catch (e) {
    // 某些环境可能已冻结，忽略
  }
})();

/* ===== 2. 安全防护核心 ===== */
var SecurityGuard = (function () {

  /* --- SQL 注入特征模式 --- */
  var SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b\s+)/gi,
    /('\s*(or|and|union|select|insert|update|delete|drop)\s+)/gi,
    /(--\s)/g,
    /(;\s*(drop|delete|update|insert|create|alter|exec|truncate)\s)/gi,
    /(\bor\b\s+1\s*=\s*1)/gi,
    /(\band\b\s+1\s*=\s*1)/gi,
    /(\b(or|and)\b\s+'[^']*'\s*=\s*'[^']*')/gi,
    /(\/\*.*?\*\/)/g,
    /(\bxp_cmdshell\b)/gi,
    /(\bwaitfor\s+delay\b)/gi,
    /(\bbenchmark\s*\()/gi,
    /(\bsleep\s*\()/gi,
    /(\bload_file\s*\()/gi,
    /(\binto\s+(outfile|dumpfile)\b)/gi,
    /(\bconcat\s*\()/gi,
    /(\bhex\s*\()/gi,
    /(\bchar\s*\()/gi,
    /(\bextractvalue\s*\()/gi,
    /(\bupdatexml\s*\()/gi,
    /(\bif\s*\(.*\))/gi
  ];

  /* --- XSS 注入特征模式 --- */
  var XSS_PATTERNS = [
    /<script[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /<svg[\s\S]*?<\/svg>/gi,
    /on\w+\s*=\s*["\']?[^"\']*[")]/gi,
    /javascript:\s*/gi,
    /vbscript:\s*/gi,
    /data:\s*text\/html/gi,
    /<img[^>]+src\s*=\s*["\']?\s*(javascript|vbscript|data:text\/html)/gi,
    /<link[^>]+href\s*=\s*["\']?\s*(javascript|vbscript)/gi,
    /expression\s*\(/gi,
    /<meta[^>]+http-equiv/gi,
    /<base[^>]+href/gi,
    /<form[^>]+action\s*=\s*["\']?\s*(javascript|vbscript)/gi
  ];

  /* --- 危险 HTML 标签（含 SVG / MATH 等可嵌套脚本的标签） --- */
  var DANGEROUS_TAGS = /<(script|iframe|object|embed|link|meta|base|form|style|applet|frame|frameset|svg|math)\b[^>]*>/gi;

  /* --- 路由参数安全字符白名单 --- */
  // 允许字母、数字、下划线、短横线、百分号（百分号用于 URL 编码的搜索查询）
  var SAFE_ROUTE_CHARS = /^[a-zA-Z0-9_\-%]+$/;

  /* --- 搜索关键词最大长度 --- */
  var MAX_SEARCH_LEN = 80;

  /* --- 路由参数最大长度 --- */
  var MAX_ROUTE_PARAM_LEN = 64;

  /* --- 正则表达式安全限制 --- */
  var MAX_REGEX_TERMS = 20;
  var MAX_REGEX_TERM_LEN = 40;

  /**
   * 检测字符串中是否包含 SQL 注入特征
   * @param {string} str - 待检测字符串
   * @returns {boolean} - 是否检测到注入特征
   */
  function detectSqlInjection(str) {
    if (!str || typeof str !== 'string') return false;
    var s = String(str);
    for (var i = 0; i < SQL_INJECTION_PATTERNS.length; i++) {
      if (SQL_INJECTION_PATTERNS[i].test(s)) {
        // 重置正则的 lastIndex（避免全局匹配的状态残留）
        SQL_INJECTION_PATTERNS[i].lastIndex = 0;
        return true;
      }
      SQL_INJECTION_PATTERNS[i].lastIndex = 0;
    }
    return false;
  }

  /**
   * 检测字符串中是否包含 XSS 注入特征
   * @param {string} str - 待检测字符串
   * @returns {boolean} - 是否检测到注入特征
   */
  function detectXss(str) {
    if (!str || typeof str !== 'string') return false;
    var s = String(str);
    for (var i = 0; i < XSS_PATTERNS.length; i++) {
      if (XSS_PATTERNS[i].test(s)) {
        XSS_PATTERNS[i].lastIndex = 0;
        return true;
      }
      XSS_PATTERNS[i].lastIndex = 0;
    }
    return false;
  }

  /**
   * 综合注入检测：同时检测 SQL 注入和 XSS
   */
  function detectInjection(str) {
    return detectSqlInjection(str) || detectXss(str);
  }

  /**
   * 净化输入：移除 SQL 注入和 XSS 特征
   * @param {string} str - 待净化字符串
   * @returns {string} - 净化后的字符串
   */
  function sanitizeInput(str) {
    if (!str) return '';
    var s = String(str);
    // 移除 SQL 注入特征
    for (var i = 0; i < SQL_INJECTION_PATTERNS.length; i++) {
      s = s.replace(SQL_INJECTION_PATTERNS[i], '');
      SQL_INJECTION_PATTERNS[i].lastIndex = 0;
    }
    // 移除 XSS 特征
    for (var j = 0; j < XSS_PATTERNS.length; j++) {
      s = s.replace(XSS_PATTERNS[j], '');
      XSS_PATTERNS[j].lastIndex = 0;
    }
    return s;
  }

  /**
   * 净化路由参数：仅保留安全字符，限制长度
   * @param {string} str - 待净化的路由参数
   * @returns {string|null} - 净化后的参数，或 null（如果无效）
   */
  function sanitizeRouteParam(str) {
    if (!str) return null;
    var s = String(str).slice(0, MAX_ROUTE_PARAM_LEN);
    // 移除注入特征
    s = sanitizeInput(s);
    // 仅允许安全字符
    if (!SAFE_ROUTE_CHARS.test(s)) {
      // 尝试提取安全部分
      var cleaned = s.replace(/[^a-zA-Z0-9_\-]/g, '');
      if (!cleaned || !SAFE_ROUTE_CHARS.test(cleaned)) return null;
      return cleaned;
    }
    return s;
  }

  /**
   * 转义 HTML 属性值：防止属性注入
   * 用于 data-detail="..." data-link="..." 等场景
   * @param {string} str - 待转义的值
   * @returns {string} - 转义后的值
   */
  function sanitizeAttr(str) {
    if (!str) return '';
    var s = String(str);
    // 先移除注入特征
    s = sanitizeInput(s);
    // 转义 HTML 特殊字符（属性上下文）
    s = s.replace(/&/g, '&amp;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');
    return s;
  }

  /**
   * 净化 HTML 内容：移除危险标签和事件处理器
   * 用于 descHtml / contentHtml 等预格式化 HTML
   * @param {string} html - 待净化的 HTML
   * @returns {string} - 净化后的 HTML
   */
  function sanitizeHtml(html) {
    if (!html) return '';
    var s = String(html);
    // 移除危险标签（含 SVG / MATH 等可嵌套脚本的标签）
    s = s.replace(/<(script|iframe|object|embed|link|meta|base|form|style|applet|frame|frameset|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    s = s.replace(/<(script|iframe|object|embed|link|meta|base|form|style|applet|frame|frameset|svg|math)\b[^>]*\/?>/gi, '');
    // 移除所有 on* 事件属性（含无引号、单引号、双引号三种形式）
    s = s.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
         .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
         .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
    // 移除 javascript: / vbscript: 协议（href / src / formaction / xlink:href / action 等）
    s = s.replace(/(href|src|formaction|action|xlink:href)\s*=\s*["']?\s*javascript:/gi, '$1="#"');
    s = s.replace(/(href|src|formaction|action|xlink:href)\s*=\s*["']?\s*vbscript:/gi, '$1="#"');
    // 移除 data: 协议中的 HTML / SVG 类型（可携带脚本）
    s = s.replace(/(href|src)\s*=\s*["']?\s*data:text\/html/gi, '$1="#"');
    s = s.replace(/(href|src)\s*=\s*["']?\s*data:image\/svg\+xml/gi, '$1="#"');
    // 移除 CSS expression() 与 -moz-binding
    s = s.replace(/expression\s*\(/gi, '(');
    s = s.replace(/-moz-binding\s*:/gi, 'disabled:');
    return s;
  }

  /**
   * 安全正则表达式构建：防止 ReDoS
   * 限制搜索词数量和长度
   * @param {string} query - 搜索查询
   * @returns {RegExp|null} - 安全的正则表达式，或 null
   */
  function safeSearchRegex(query) {
    if (!query) return null;
    var s = String(query).toLowerCase().trim();
    if (!s) return null;
    var terms = s.split(/\s+/).filter(Boolean);
    if (!terms.length) return null;
    // 限制搜索词数量
    if (terms.length > MAX_REGEX_TERMS) {
      terms = terms.slice(0, MAX_REGEX_TERMS);
    }
    // 限制每个词长度并转义正则特殊字符
    var escapedTerms = [];
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i].slice(0, MAX_REGEX_TERM_LEN);
      // 移除注入特征
      term = sanitizeInput(term);
      if (term) {
        escapedTerms.push(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }
    }
    if (!escapedTerms.length) return null;
    try {
      return new RegExp('(' + escapedTerms.join('|') + ')', 'gi');
    } catch (e) {
      return null;
    }
  }

  /**
   * 验证并截断搜索查询
   * @param {string} query - 搜索查询
   * @returns {string} - 安全的搜索查询
   */
  function sanitizeSearchQuery(query) {
    if (!query) return '';
    var s = String(query).slice(0, MAX_SEARCH_LEN);
    // 移除注入特征
    s = sanitizeInput(s);
    // 移除控制字符
    s = s.replace(/[\x00-\x1f\x7f]/g, '');
    return s.trim();
  }

  /**
   * 安全设置 innerHTML：在赋值前对内容进行净化
   * @param {HTMLElement} el - 目标元素
   * @param {string} html - HTML 内容
   */
  function safeSetInnerHTML(el, html) {
    if (!el) return;
    var s = String(html || '');
    // 如果检测到注入特征，记录并净化
    if (detectInjection(s)) {
      s = sanitizeInput(s);
    }
    el.innerHTML = s;
  }

  /**
   * 验证 data-detail / data-link 属性值
   * 确保格式为 page/type/id，且各部分均为安全字符
   * @param {string} value - data-detail 或 data-link 值
   * @returns {string|null} - 验证后的值，或 null
   */
  function validateDataRoute(value) {
    if (!value) return null;
    var s = String(value).slice(0, 200); // 总长度限制
    // 检测注入
    if (detectInjection(s)) {
      s = sanitizeInput(s);
    }
    // 仅允许安全字符、分隔符和百分号（用于 URL 编码的搜索查询）
    if (!/^[a-zA-Z0-9_\-\/%]*$/.test(s)) {
      s = s.replace(/[^a-zA-Z0-9_\-\/%]/g, '');
    }
    // 验证各部分
    var parts = s.split('/').filter(Boolean);
    var safeParts = [];
    for (var i = 0; i < parts.length && i < 3; i++) {
      var p = sanitizeRouteParam(parts[i]);
      if (p) safeParts.push(p);
    }
    return safeParts.length ? safeParts.join('/') : null;
  }

  // 公开 API
  return {
    detectSqlInjection: detectSqlInjection,
    detectXss: detectXss,
    detectInjection: detectInjection,
    sanitizeInput: sanitizeInput,
    sanitizeRouteParam: sanitizeRouteParam,
    sanitizeAttr: sanitizeAttr,
    sanitizeHtml: sanitizeHtml,
    safeSearchRegex: safeSearchRegex,
    sanitizeSearchQuery: sanitizeSearchQuery,
    safeSetInnerHTML: safeSetInnerHTML,
    validateDataRoute: validateDataRoute,
    MAX_SEARCH_LEN: MAX_SEARCH_LEN,
    MAX_ROUTE_PARAM_LEN: MAX_ROUTE_PARAM_LEN
  };
})();

// 暴露到全局
window.SecurityGuard = SecurityGuard;
