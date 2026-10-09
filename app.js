(() => {
  const COLORS = ["white", "green", "yellow", "red"];

  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const display = $("display");
  const modeSel = $("mode");
  const intervalInput = $("interval");
  const intervalLabel = $("intervalLabel");
  const soundInput = $("sound");
  const wakelockInput = $("wakelock");
  const wakeLockStatus = $("wakeLockStatus");
  const playPause = $("playPause");
  const fullscreenBtn = $("fullscreen");
  const settingsPanel = $("settings");
  const settingsToggle = $("toggleSettings");

  const SETTINGS_KEY = "lookout.settings.v1";
  const defaults = { mode: "colors", interval: 4, sound: true, wakelock: true };
  const state = { ...defaults, running: false, lastValue: null, timer: null, wakeLock: null };

  loadSettings();
  syncUiFromState();
  attachEvents();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) Object.assign(state, defaults, JSON.parse(raw));
    } catch {}
  }

  function saveSettings() {
    const { mode, interval, sound, wakelock } = state;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode, interval, sound, wakelock })); } catch {}
  }

  function syncUiFromState() {
    modeSel.value = state.mode;
    intervalInput.value = String(state.interval);
    intervalLabel.value = `${state.interval.toFixed(1)}s`;
    soundInput.checked = state.sound;
    wakelockInput.checked = state.wakelock;
  }

  function attachEvents() {
    modeSel.addEventListener("change", () => {
      state.mode = modeSel.value;
      state.lastValue = null;
      saveSettings();
      if (state.running) stop();
    });

    intervalInput.addEventListener("input", () => {
      state.interval = parseFloat(intervalInput.value);
      intervalLabel.value = `${state.interval.toFixed(1)}s`;
    });

    intervalInput.addEventListener("change", () => {
      state.interval = parseFloat(intervalInput.value);
      intervalLabel.value = `${state.interval.toFixed(1)}s`;
      saveSettings();
      if (state.running) stop();
    });

    soundInput.addEventListener("change", () => {
      state.sound = soundInput.checked;
      saveSettings();
      if (state.running) stop();
    });

    wakelockInput.addEventListener("change", () => {
      state.wakelock = wakelockInput.checked;
      saveSettings();
      if (state.running) stop();
      else setWakeLockStatus("");
    });

    playPause.addEventListener("click", () => {
      if (state.running) { stop(); return; }
      primeAudio(); // must run synchronously in the user gesture for iOS
      enterFullscreen();
      start();
    });

    fullscreenBtn.addEventListener("click", async () => {
      if (!document.fullscreenElement) enterFullscreen();
      else await exitFullscreen();
      hideSettings();
    });

    settingsToggle.addEventListener("click", async () => {
      if (state.running) {
        await stop();
        settingsPanel.classList.remove("hidden");
        settingsToggle.setAttribute("aria-expanded", "true");
        return;
      }
      const hidden = settingsPanel.classList.toggle("hidden");
      settingsToggle.setAttribute("aria-expanded", String(!hidden));
    });

    document.addEventListener("pointerdown", (e) => {
      if (settingsPanel.classList.contains("hidden")) return;
      if (settingsPanel.contains(e.target) || settingsToggle.contains(e.target)) return;
      hideSettings();
    });

    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && state.running && state.wakelock) {
        wakeLockRetryDelay = 1000;
        await acquireWakeLock();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) return;
      screen.orientation?.unlock?.();
      if (state.running) stop();
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); state.running ? stop() : start(); }
      if (e.key === "f" || e.key === "F") fullscreenBtn.click();
    });
  }

  async function start() {
    state.running = true;
    wakeLockRetryDelay = 1000;
    playPause.textContent = "Stop";
    playPause.classList.remove("primary");
    settingsToggle.setAttribute("aria-label", "Stop session and open settings");
    if (state.wakelock) await acquireWakeLock();
    tick();
    restartTimer();
    hideSettings();
  }

  function hideSettings() {
    settingsPanel.classList.add("hidden");
    settingsToggle.setAttribute("aria-expanded", "false");
  }

  function enterFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
        .then(() => screen.orientation?.lock?.("landscape").catch(() => {}))
        .catch(() => {});
    }
  }

  async function exitFullscreen() {
    screen.orientation?.unlock?.();
    if (!document.fullscreenElement) return;
    try { await document.exitFullscreen?.(); } catch {}
  }

  async function stop() {
    state.running = false;
    playPause.textContent = "Start";
    playPause.classList.add("primary");
    settingsToggle.setAttribute("aria-label", "Toggle settings");
    clearInterval(state.timer);
    state.timer = null;
    clearWakeLockTimers();
    await releaseWakeLock();
    await exitFullscreen();
    setWakeLockStatus("");
  }

  function restartTimer() {
    clearInterval(state.timer);
    state.timer = setInterval(tick, Math.max(500, state.interval * 1000));
  }

  function tick() {
    const mode = state.mode === "mixed"
      ? ["colors", "numbers", "math"][Math.floor(Math.random() * 3)]
      : state.mode;

    const value = nextValue(mode, state.lastValue);
    state.lastValue = value.key;
    render(mode, value);
    if (state.sound) beep();
  }

  function nextValue(mode, lastKey) {
    // re-roll until different from last shown value
    for (let i = 0; i < 12; i++) {
      const v = rollValue(mode);
      if (v.key !== lastKey) return v;
    }
    return rollValue(mode);
  }

  function rollValue(mode) {
    if (mode === "colors") {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      return { key: `color:${c}`, kind: "color", color: c };
    }
    if (mode === "numbers") {
      const n = 1 + Math.floor(Math.random() * 10);
      return { key: `num:${n}`, kind: "number", text: String(n) };
    }
    // math: results stay within 0..10
    if (Math.random() < 0.5) {
      const a = Math.floor(Math.random() * 10);          // 0..9
      const b = Math.floor(Math.random() * (10 - a + 1)); // a+b <= 10
      return { key: `math:${a}+${b}`, kind: "math", text: `${a} + ${b}` };
    } else {
      const a = 1 + Math.floor(Math.random() * 10);      // 1..10
      const b = Math.floor(Math.random() * (a + 1));     // 0..a
      return { key: `math:${a}-${b}`, kind: "math", text: `${a} − ${b}` };
    }
  }

  function render(mode, value) {
    stage.classList.remove(
      "color-mode",
      "bg-white", "bg-green", "bg-yellow", "bg-red"
    );
    if (value.kind === "color") {
      stage.classList.add("color-mode", `bg-${value.color}`);
      display.textContent = "";
    } else {
      stage.style.background = "";
      display.textContent = value.text;
      autoFitDisplay();
    }
  }

  function autoFitDisplay() {
    // Measure text at a reference size, then scale to fill the viewport
    display.style.fontSize = "100px";
    const textW = display.scrollWidth;
    const textH = display.scrollHeight;
    if (!textW || !textH) return;
    const maxW = stage.clientWidth * 0.95;
    const maxH = stage.clientHeight * 0.9;
    const scale = Math.min(maxW / textW, maxH / textH);
    display.style.fontSize = Math.floor(100 * scale) + "px";
  }

  // --- audio cue ---
  let audioCtx = null;
  function primeAudio() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch {}
  }
  function beep() {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  // --- screen wake lock ---
  let wakeLockRequest = null;
  let wakeLockRetryTimer = null;
  let wakeLockStableTimer = null;
  let wakeLockRetryDelay = 1000;

  async function acquireWakeLock() {
    if (!state.running || !state.wakelock || document.visibilityState !== "visible") return;
    if (!("wakeLock" in navigator)) {
      setWakeLockStatus("Screen wake lock is not supported by this browser.", true);
      return;
    }
    if (state.wakeLock && !state.wakeLock.released) return;
    if (wakeLockRequest) return wakeLockRequest;

    wakeLockRequest = (async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!state.running || !state.wakelock || document.visibilityState !== "visible") {
          await lock.release();
          return;
        }

        state.wakeLock = lock;
        setWakeLockStatus("Screen will stay on.");
        clearTimeout(wakeLockStableTimer);
        wakeLockStableTimer = setTimeout(() => { wakeLockRetryDelay = 1000; }, 30000);

        lock.addEventListener("release", () => {
          if (state.wakeLock !== lock) return;
          state.wakeLock = null;
          clearTimeout(wakeLockStableTimer);
          if (state.running && state.wakelock && document.visibilityState === "visible") {
            setWakeLockStatus("Wake lock was released; retrying...", true);
            scheduleWakeLockRetry();
          }
        });
      } catch (error) {
        console.warn("Unable to acquire screen wake lock:", error);
        setWakeLockStatus("Chrome or Android denied the screen wake lock.", true);
      } finally {
        wakeLockRequest = null;
      }
    })();

    return wakeLockRequest;
  }

  function scheduleWakeLockRetry() {
    clearTimeout(wakeLockRetryTimer);
    wakeLockRetryTimer = setTimeout(() => {
      wakeLockRetryTimer = null;
      acquireWakeLock();
    }, wakeLockRetryDelay);
    wakeLockRetryDelay = Math.min(wakeLockRetryDelay * 2, 30000);
  }

  function clearWakeLockTimers() {
    clearTimeout(wakeLockRetryTimer);
    clearTimeout(wakeLockStableTimer);
    wakeLockRetryTimer = null;
    wakeLockStableTimer = null;
  }

  function setWakeLockStatus(message, isError = false) {
    wakeLockStatus.textContent = message;
    wakeLockStatus.hidden = !message;
    wakeLockStatus.classList.toggle("error", isError);
  }

  async function releaseWakeLock() {
    try { await state.wakeLock?.release(); } catch {}
    state.wakeLock = null;
  }
})();
