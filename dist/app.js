(function () {
  'use strict';

  const CATEGORIES = window.CATEGORIES;
  const ALL_TOPIC = { id: 'all', label: 'All' };
  const TOPICS = [ALL_TOPIC].concat(window.TOPICS);

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                   'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const DEFAULT_SECONDS = 120;
  const DEFAULT_CATEGORY_COUNT = 12;
  const LOW_TIME_MS = 10000;
  const MAX_SECONDS = 5999;

  const HISTORY_LIMIT = Math.ceil(LETTERS.length / 2);

  const STORAGE_KEY = 'scattegories-rehashed:v1';

  const GAME = {
    IN_GAME: 'IN_GAME',
    GAME_OVER: 'GAME_OVER',
    GAME_PAUSED: 'GAME_PAUSED',
    BEFORE_START: 'BEFORE_START'
  };

  function isTopic(id) {
    return TOPICS.some(function (t) { return t.id === id; });
  }

  function poolFor(topicId) {
    return CATEGORIES
      .filter(function (c) { return topicId === 'all' || (c.topics || []).indexOf(topicId) !== -1; })
      .map(function (c) { return c.name; });
  }

  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduceMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  function pad(n, length) {
    let s = String(n);
    while (s.length < length) s = '0' + s;
    return s;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clampInt(value, min, max, fallback) {
    const n = Math.round(Number(value));
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function validInt(value, min, max, fallback) {
    const n = Number(value);
    return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
  }

  function loadSettings() {
    const settings = {
      seconds: DEFAULT_SECONDS,
      categoryCount: DEFAULT_CATEGORY_COUNT,
      topic: ALL_TOPIC.id,
      letterHistory: []
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      settings.seconds = validInt(saved.seconds, 1, MAX_SECONDS, DEFAULT_SECONDS);
      settings.categoryCount = validInt(saved.categoryCount, 1, CATEGORIES.length, DEFAULT_CATEGORY_COUNT);
      if (isTopic(saved.topic)) settings.topic = saved.topic;
      if (Array.isArray(saved.letterHistory)) {
        settings.letterHistory = saved.letterHistory
          .filter(function (l) { return LETTERS.indexOf(l) !== -1; })
          .slice(-HISTORY_LIMIT);
      }
    } catch (e) {  }
    return settings;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {  }
  }

  const WakeLock = (function () {
    let lock = null;
    let pending = false;

    function acquire() {
      if (!('wakeLock' in navigator) || lock || pending || document.visibilityState !== 'visible') return;
      pending = true;
      navigator.wakeLock.request('screen').then(function (sentinel) {
        pending = false;
        lock = sentinel;
        sentinel.addEventListener('release', function () { lock = null; });
      }).catch(function () {
        pending = false;
      });
    }

    document.addEventListener('visibilitychange', acquire);

    document.addEventListener('pointerdown', acquire);
    document.addEventListener('keydown', acquire);

    return { acquire: acquire };
  })();

  function animatePlayButton(showPlay) {
    const pausePath = 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26';
    const playPath = 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28';

    if (reduceMotion()) {
      const path = document.querySelector('.controls-wrap .animate-svg-path path');
      if (path) path.setAttribute('d', showPlay ? playPath : pausePath);
      return Promise.resolve();
    }

    const out = anime.timeline({ autoplay: true });
    out.add({
      targets: ['.controls-wrap .label .label-inner'],
      translateY: [0, -5],
      rotateX: [0, 45],
      offset: 0,
      easing: 'easeOutCubic',
      duration: 400,
      opacity: { value: [1, 0], duration: 100, easing: 'linear' }
    }).add({
      targets: ['.controls-wrap .animate-svg-path path'],
      easing: 'easeOutCirc',
      duration: 300,
      offset: 0,
      d: showPlay ? playPath : pausePath
    });

    const back = anime.timeline({ autoplay: true });
    back.add({
      targets: ['.controls-wrap .label .label-inner'],
      translateY: [5, 0],
      rotateX: [-45, 0],
      easing: 'easeOutBack',
      duration: 500,
      opacity: { value: [0, 1], duration: 100, easing: 'linear', offset: 200 },
      offset: 500
    });

    return out.finished;
  }

  function animateRestart() {
    anime.timeline({ autoplay: true })
      .add({
        targets: ['.reset-button .refresh-icon-wrap svg', '.button-play-again svg'],
        rotate: [0, 180],
        offset: 0,
        opacity: { value: [1, 0], duration: 400, easing: 'linear' },
        easing: 'easeOutQuart',
        duration: 400
      })
      .add({
        targets: ['.reset-button .animated-letter'],
        translateY: [0, 5],
        opacity: { value: [1, 0], duration: 100, easing: 'linear' },
        delay: function (el, i) { return 200 + 20 * ('restart'.length - i); },
        offset: 0
      })
      .add({
        targets: ['.animation-overlay'],
        translateX: ['110%', 0],
        duration: 400,
        easing: 'easeOutCubic',
        offset: 400
      })
      .add({
        targets: ['.animation-overlay'],
        translateX: [0, '-110%'],
        duration: 500,
        easing: 'easeInCubic'
      })
      .add({
        targets: ['.reset-button .animated-letter'],
        translateY: [5, 0],
        opacity: { value: [0, 1], duration: 100, easing: 'linear' },
        delay: function (el, i) { return 200 + 20 * i; },
        offset: '-=200'
      })
      .add({
        targets: ['.reset-button .refresh-icon-wrap svg', '.button-play-again svg'],
        translateY: [-80, 0],
        opacity: { value: [0, 1], duration: 200, easing: 'linear' },
        offset: '-=800',
        duration: 800,
        elasticity: 400
      });
  }

  const saved = loadSettings();

  new Vue({
    el: '#view',

    data: {
      GAME: GAME,
      gameState: GAME.BEFORE_START,
      playLabel: 'Play',

      currentLetter: 'A',
      currentWords: [],
      numberOfWords: saved.categoryCount,
      topic: saved.topic,
      topics: TOPICS,

      initialGameSeconds: saved.seconds,
      currentMs: saved.seconds * 1000,
      lowTimeMs: LOW_TIME_MS,

      editMinutes: '',
      editSeconds: '',

      fullscreenSupported: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
      isFullscreen: false,

      state: {
        isResetting: false,
        editingTime: false,
        timeUp: false
      }
    },

    computed: {

      timeText: function () {
        const ms = this.currentMs;
        if (ms < this.lowTimeMs) {
          return pad(Math.floor(ms / 1000), 2) + ':' + pad(Math.floor(ms % 1000), 3);
        }
        const total = Math.ceil(ms / 1000);
        return pad(Math.floor(total / 60), 2) + ':' + pad(total % 60, 2);
      },

      pool: function () {
        return poolFor(this.topic);
      },

      categoryCount: function () {
        return Math.min(this.numberOfWords, this.pool.length);
      },

      canEdit: function () {
        return this.currentMs === this.initialGameSeconds * 1000 && this.gameState !== GAME.IN_GAME;
      },

      editTotal: function () {
        return 60 * (parseInt(this.editMinutes, 10) || 0) + (parseInt(this.editSeconds, 10) || 0);
      }
    },

    watch: {
      'state.editingTime': function (open) {
        if (!open) return;
        this.setEditTotal(Math.ceil(this.currentMs / 1000));
        this.$nextTick(function () {
          const input = document.getElementById('time-input-min');
          if (input) { input.focus(); input.select(); }
        });
      },

      'state.timeUp': function (open) {
        if (!open) return;
        this.$nextTick(function () {
          const button = document.getElementById('time-up-confirm');
          if (button) button.focus();
        });
      }
    },

    created: function () {

      this.timer = null;
      this.timerEndAt = null;
      this.timeUpTimeout = null;
      this.categoryBag = [];
      this.letterHistory = saved.letterHistory;
    },

    mounted: function () {
      this.currentWords = this.drawCategories(this.categoryCount);
      this.rollLetter();
      this.$nextTick(function () { document.body.classList.add('mounted'); });
      WakeLock.acquire();

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (this.state.timeUp) this.closeTimeUp();
        else if (this.state.editingTime) this.closeTimeEditor();
      });

      const syncFullscreen = () => {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
      };
      document.addEventListener('fullscreenchange', syncFullscreen);
      document.addEventListener('webkitfullscreenchange', syncFullscreen);
    },

    methods: {

      persist: function () {
        saveSettings({
          seconds: this.initialGameSeconds,
          categoryCount: this.numberOfWords,
          topic: this.topic,
          letterHistory: this.letterHistory
        });
      },

      drawCategories: function (n) {
        const pool = this.pool;
        const picked = [];
        while (picked.length < n) {
          if (!this.categoryBag.length) {
            this.categoryBag = pool.filter(function (c) { return picked.indexOf(c) === -1; });
            if (!this.categoryBag.length) break;
          }
          const i = Math.floor(Math.random() * this.categoryBag.length);
          picked.push(this.categoryBag.splice(i, 1)[0]);
        }
        return picked;
      },

      changeCategoryCount: function (delta) {
        const n = Math.min(this.pool.length, Math.max(1, this.categoryCount + delta));
        if (n === this.categoryCount) return;
        this.numberOfWords = n;
        if (this.canEdit) this.syncCategories();
        this.persist();
      },

      syncCategories: function () {
        while (this.currentWords.length > this.categoryCount) {
          this.categoryBag.push(this.currentWords.pop());
        }
        if (this.currentWords.length < this.categoryCount) {
          const extra = this.drawCategories(this.categoryCount - this.currentWords.length);
          this.currentWords = this.currentWords.concat(extra);
        }
      },

      setTopic: function (id) {
        if (!this.canEdit || !isTopic(id) || id === this.topic) return;
        this.topic = id;
        this.categoryBag = [];
        this.currentWords = this.drawCategories(this.categoryCount);
        this.persist();
      },

      rollLetter: function () {
        const played = this.letterHistory.filter(function (l) { return LETTERS.indexOf(l) !== -1; });
        if (played.length >= HISTORY_LIMIT) {
          this.letterHistory = played.slice(-1);
          this.persist();
        }

        const current = this.currentLetter;
        let candidates = LETTERS.filter((l) => this.letterHistory.indexOf(l) === -1 && l !== current);
        if (!candidates.length) {
          candidates = LETTERS.filter((l) => l !== current);
        }
        this.currentLetter = randomItem(candidates);
      },

      recordLetter: function () {
        if (this.letterHistory.indexOf(this.currentLetter) === -1) {
          this.letterHistory.push(this.currentLetter);
          this.persist();
        }
      },

      onLetterInput: function (e) {
        const el = e.target;
        if (!this.canEdit) {
          el.value = this.currentLetter;
          return;
        }
        let ch = null;
        if (e.data && /^[a-z]$/i.test(e.data)) {
          ch = e.data;
        } else {
          const m = el.value.match(/[a-z]/gi);
          ch = m && m[m.length - 1];
        }
        if (ch) this.currentLetter = ch.toUpperCase();
        el.value = this.currentLetter;
        el.select();
      },

      editTime: function () {
        if (this.gameState === GAME.IN_GAME) this.pauseGame();
        this.state.editingTime = true;
      },

      closeTimeEditor: function () {
        this.state.editingTime = false;
      },

      setEditTotal: function (seconds) {
        const n = clampInt(seconds, 0, MAX_SECONDS, 0);
        this.editMinutes = pad(Math.floor(n / 60), 2);
        this.editSeconds = pad(n % 60, 2);
      },

      onTimeField: function (e, field) {
        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
        e.target.value = value;
        this[field] = value;
      },

      stepTime: function (delta) {
        this.setEditTotal(this.editTotal + delta);
      },

      submitUpdateTime: function () {
        const seconds = Math.min(MAX_SECONDS, this.editTotal);
        if (seconds < 1) return;
        this.initialGameSeconds = seconds;
        this.currentMs = seconds * 1000;
        this.state.editingTime = false;
        this.persist();
      },

      resetTime: function () {
        this.currentMs = this.initialGameSeconds * 1000;
      },

      startTimer: function () {
        this.stopTimer();
        this.timerEndAt = performance.now() + this.currentMs;
        this.timer = setInterval(() => {
          const remaining = Math.max(0, this.timerEndAt - performance.now());

          if (remaining < this.lowTimeMs || Math.ceil(remaining / 1000) !== Math.ceil(this.currentMs / 1000)) {
            this.currentMs = remaining;
          }
          if (remaining <= 0) this.endGame();
        }, 16);
        animatePlayButton().then(() => { this.playLabel = 'Pause'; });
      },

      stopTimer: function () {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.timerEndAt = null;
      },

      startGame: function () {
        if (this.canEdit) this.recordLetter();
        this.state.editingTime = false;
        this.gameState = GAME.IN_GAME;
        this.startTimer();
      },

      pauseGame: function () {
        if (this.timerEndAt !== null) {
          this.currentMs = Math.max(0, this.timerEndAt - performance.now());
        }
        this.gameState = GAME.GAME_PAUSED;
        this.stopTimer();
        animatePlayButton(true).then(() => { this.playLabel = 'Play'; });
      },

      endGame: function () {
        this.gameState = GAME.GAME_PAUSED;
        this.stopTimer();

        clearTimeout(this.timeUpTimeout);
        this.timeUpTimeout = setTimeout(() => {
          if (this.gameState !== GAME.GAME_PAUSED || this.currentMs !== 0) return;
          this.gameState = GAME.GAME_OVER;
          this.playLabel = 'Reset';
          this.state.timeUp = true;
        }, 600);
      },

      closeTimeUp: function () {
        this.state.timeUp = false;
      },

      restartFromTimeUp: function () {
        this.state.timeUp = false;
        this.resetGame();
      },

      resetGame: function () {
        if (this.state.isResetting) return;
        clearTimeout(this.timeUpTimeout);
        this.state.timeUp = false;
        this.playLabel = 'Play';
        this.stopTimer();
        this.state.isResetting = true;

        const swapRound = () => {
          this.currentWords = this.drawCategories(this.categoryCount);
          this.rollLetter();
          this.state.isResetting = false;
          this.state.editingTime = false;
          this.gameState = GAME.BEFORE_START;
          this.resetTime();
        };

        animatePlayButton(true);

        if (reduceMotion()) {
          swapRound();
          return;
        }

        animateRestart();

        setTimeout(swapRound, 1600);
      },

      toggleFullscreen: function () {
        const root = document.documentElement;
        let result;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          result = (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          result = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
        }
        if (result && result.catch) result.catch(function () {  });
      }
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {  });
    });
  }
})();
