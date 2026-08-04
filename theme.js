/* ==========================================================================
   主题切换管理器 (theme.js)
   --------------------------------------------------------------------------
   提供深色 / 浅色主题的切换、持久化与按钮注入能力。
   使用方式：在页面加载后 ThemeManager.init() 即可自动完成初始化。
   ========================================================================== */

(function (global) {
  'use strict';

  /* —— 常量定义 —— */

  // localStorage 存储键名
  var STORAGE_KEY = 'asylum_theme';

  // 默认主题
  var DEFAULT_THEME = 'dark';

  // 支持的主题白名单
  var VALID_THEMES = ['dark', 'light'];

  // 过渡动画时长 (毫秒)，需与 themes.css 中的 0.3s 保持一致
  var TRANSITION_DURATION = 300;

  /* —— 太阳图标 SVG (深色主题下显示，点击切换到浅色) —— */
  var SUN_ICON_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"></circle>' +
    '<line x1="12" y1="1" x2="12" y2="3"></line>' +
    '<line x1="12" y1="21" x2="12" y2="23"></line>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
    '<line x1="1" y1="12" x2="3" y2="12"></line>' +
    '<line x1="21" y1="12" x2="23" y2="12"></line>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
    '</svg>';

  /* —— 月亮图标 SVG (浅色主题下显示，点击切换到深色) —— */
  var MOON_ICON_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
    '</svg>';

  /* ==========================================================================
     ThemeManager 对象
     ========================================================================== */
  var ThemeManager = {

    // 当前主题 ('dark' | 'light')
    currentTheme: null,

    // 切换按钮 DOM 引用
    toggleButton: null,

    // 过渡定时器句柄
    _transitionTimer: null,

    /* ----------------------------------------------------------------------
       init()
       初始化主题管理器：读取已保存的主题、应用到 <html>、注入切换按钮。
       ---------------------------------------------------------------------- */
    init: function () {
      // 读取持久化的主题，若无则使用默认值
      this.currentTheme = this.getTheme();

      // 立即应用主题 (首次加载不做过渡动画)
      this._applyTheme(this.currentTheme, false);

      // 动态创建并插入主题切换按钮
      this._createToggleButton();

      // 监听系统主题变化 (可选增强：当用户未手动设置过时跟随系统)
      this._watchSystemPreference();
    },

    /* ----------------------------------------------------------------------
       toggle()
       在深色 / 浅色之间切换。
       ---------------------------------------------------------------------- */
    toggle: function () {
      var nextTheme = (this.currentTheme === 'dark') ? 'light' : 'dark';
      this.setTheme(nextTheme);
    },

    /* ----------------------------------------------------------------------
       setTheme(theme)
       设置指定主题并持久化。
       @param {string} theme - 'dark' 或 'light'
       ---------------------------------------------------------------------- */
    setTheme: function (theme) {
      // 校验主题合法性
      if (VALID_THEMES.indexOf(theme) === -1) {
        return;
      }

      this.currentTheme = theme;

      // 应用主题 (带过渡动画)
      this._applyTheme(theme, true);

      // 持久化到 localStorage
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        /* silently ignore storage errors */
      }
    },

    /* ----------------------------------------------------------------------
       getTheme()
       获取当前已保存的主题 (从 localStorage 读取)。
       @return {string} 'dark' 或 'light'
       ---------------------------------------------------------------------- */
    getTheme: function () {
      var saved;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        saved = null;
      }

      // 校验读取到的值，无效则回退到默认主题
      if (saved && VALID_THEMES.indexOf(saved) !== -1) {
        return saved;
      }
      return DEFAULT_THEME;
    },

    /* ======================================================================
       内部方法
       ====================================================================== */

    /* ----------------------------------------------------------------------
       _applyTheme(theme, animate)
       将主题应用到 <html> 元素的 data-theme 属性，并更新按钮图标状态。
       @param {string} theme
       @param {boolean} animate - 是否启用过渡动画
       ---------------------------------------------------------------------- */
    _applyTheme: function (theme, animate) {
      var html = document.documentElement;
      html.setAttribute('data-theme', theme);

      // 更新按钮图标可见性
      this._updateButtonIcon(theme);

      // 根据需要添加过渡效果
      if (animate) {
        this._addTransitionClass();
      }
    },

    /* ----------------------------------------------------------------------
       _createToggleButton()
       动态创建主题切换按钮，并插入到导航栏的 nav-actions 区域。
       ---------------------------------------------------------------------- */
    _createToggleButton: function () {
      // 若按钮已存在则跳过
      if (this.toggleButton) {
        return;
      }

      // 创建按钮元素
      var btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', '切换主题');
      btn.setAttribute('title', '切换深色 / 浅色主题');

      // 注入太阳与月亮两个图标 (绝对定位叠加)
      var iconSun = document.createElement('span');
      iconSun.className = 'icon icon-sun';
      iconSun.innerHTML = SUN_ICON_SVG;

      var iconMoon = document.createElement('span');
      iconMoon.className = 'icon icon-moon';
      iconMoon.innerHTML = MOON_ICON_SVG;

      btn.appendChild(iconSun);
      btn.appendChild(iconMoon);

      // 绑定点击事件
      var self = this;
      btn.addEventListener('click', function () {
        self.toggle();
      });

      // 保存引用
      this.toggleButton = btn;

      // 将按钮插入到 nav-actions 区域
      this._insertButtonIntoNav(btn);

      // 根据当前主题初始化图标状态
      this._updateButtonIcon(this.currentTheme);
    },

    /* ----------------------------------------------------------------------
       _insertButtonIntoNav(btn)
       将按钮插入到页面导航栏的 .nav-actions 容器中。
       若容器暂不存在，则轮询等待其出现 (兼容动态渲染的导航)。
       @param {HTMLElement} btn
       ---------------------------------------------------------------------- */
    _insertButtonIntoNav: function (btn) {
      var self = this;

      /**
       * 尝试查找 nav-actions 容器并插入按钮。
       * @return {boolean} 是否插入成功
       */
      function tryInsert() {
        var navActions = document.querySelector('.nav-actions');

        if (navActions) {
          // 避免重复插入
          if (!navActions.querySelector('.theme-toggle')) {
            navActions.appendChild(btn);
          }
          return true;
        }
        return false;
      }

      // 首次尝试
      if (tryInsert()) {
        return;
      }

      // 容器暂未就绪：使用 MutationObserver 监听 DOM 变化
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function () {
          if (tryInsert()) {
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // 兜底：5 秒后停止监听，避免无限等待
        setTimeout(function () {
          observer.disconnect();
        }, 5000);
      } else {
        // 不支持 MutationObserver 的环境使用轮询兜底
        var pollCount = 0;
        var pollTimer = setInterval(function () {
          if (tryInsert() || pollCount >= 20) {
            clearInterval(pollTimer);
          }
          pollCount++;
        }, 250);
      }
    },

    /* ----------------------------------------------------------------------
       _updateButtonIcon(theme)
       根据当前主题更新按钮的无障碍标签。
       图标的显隐由 CSS 根据 [data-theme] 自动控制，此处仅更新语义信息。
       @param {string} theme
       ---------------------------------------------------------------------- */
    _updateButtonIcon: function (theme) {
      if (!this.toggleButton) {
        return;
      }

      if (theme === 'dark') {
        // 深色模式：显示太阳图标，点击将切换到浅色
        this.toggleButton.setAttribute('aria-label', '切换到浅色主题');
        this.toggleButton.setAttribute('title', '切换到浅色主题');
      } else {
        // 浅色模式：显示月亮图标，点击将切换到深色
        this.toggleButton.setAttribute('aria-label', '切换到深色主题');
        this.toggleButton.setAttribute('title', '切换到深色主题');
      }
    },

    /* ----------------------------------------------------------------------
       _addTransitionClass()
       在 <body> 上临时添加 .theme-transitioning 类以触发全局过渡动画，
       动画结束后移除该类。
       ---------------------------------------------------------------------- */
    _addTransitionClass: function () {
      var body = document.body;
      if (!body) {
        return;
      }

      // 清除上一次可能残留的定时器
      if (this._transitionTimer) {
        clearTimeout(this._transitionTimer);
      }

      // 添加过渡类
      body.classList.add('theme-transitioning');

      // 在过渡时长后移除
      var self = this;
      this._transitionTimer = setTimeout(function () {
        body.classList.remove('theme-transitioning');
        self._transitionTimer = null;
      }, TRANSITION_DURATION);
    },

    /* ----------------------------------------------------------------------
       _watchSystemPreference()
       监听系统深色 / 浅色模式变化。
       仅当用户未手动保存过主题时，自动跟随系统切换。
       ---------------------------------------------------------------------- */
    _watchSystemPreference: function () {
      // 浏览器不支持则跳过
      if (typeof global.matchMedia !== 'function') {
        return;
      }

      var mql = global.matchMedia('(prefers-color-scheme: light)');
      var self = this;

      // 判断用户是否已手动设置过主题
      function hasUserPreference() {
        try {
          return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
          return false;
        }
      }

      // 系统主题变化回调
      function handleChange(e) {
        // 用户已手动设置则不跟随系统
        if (hasUserPreference()) {
          return;
        }
        var systemTheme = e.matches ? 'light' : 'dark';
        self.currentTheme = systemTheme;
        self._applyTheme(systemTheme, true);
      }

      // 注册监听 (兼容旧版 API)
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handleChange);
      }
    }
  };

  // 暴露到全局
  global.ThemeManager = ThemeManager;

  /* ==========================================================================
     自动初始化
     --------------------------------------------------------------------------
     在 DOM 就绪后调用 ThemeManager.init()。
     若脚本在 DOMContentLoaded 之后加载则立即执行。
     ========================================================================== */
  function bootstrap() {
    ThemeManager.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})(typeof window !== 'undefined' ? window : this);
