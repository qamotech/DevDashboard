(function () {
  "use strict";

  var STORAGE = {
    mode: "n8t-mode",
    pinned: "n8t-pinned",
    position: "n8t-position",
    clipboard: "n8t-clipboard",
    notes: "n8t-notes",
    botHistory: "n8t-pathfinder-history",
    botTimer: "n8t-pathfinder-timer"
  };
  var MODES = ["calm", "dark", "light", "cyber", "transformers"];
  var state = {
    pages: [],
    mode: "transformers",
    pinned: true,
    contextTimer: 0,
    toastTimer: 0,
    ruler: false,
    lastFocus: null,
    botHistory: [],
    commandHistory: [],
    commandIndex: 0,
    timerInterval: 0
  };

  function safeGet(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toast(message) {
    var node = document.getElementById("n8t-toast");
    if (!node) return;
    node.textContent = message;
    node.dataset.show = "true";
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      node.dataset.show = "false";
    }, 2300);
  }

  function copyText(value, successMessage) {
    var text = String(value || "");
    safeSet(STORAGE.clipboard, text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        toast(successMessage || "Copied to clipboard");
        return true;
      }).catch(function () {
        toast("Clipboard permission was unavailable");
        return false;
      });
    }
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    area.remove();
    toast(copied ? (successMessage || "Copied to clipboard") : "Clipboard permission was unavailable");
    return Promise.resolve(copied);
  }

  function capturePages() {
    var seen = Object.create(null);
    var pages = [];
    document.querySelectorAll("#n8x-list .n8x-page").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var title = (link.querySelector("strong") || link).textContent.trim();
      var category = (link.querySelector("span") || {}).textContent || "N8 Fleet";
      if (!href || seen[href]) return;
      seen[href] = true;
      pages.push({ href: href, title: title || href, category: category.trim() });
    });
    if (!pages.length) {
      pages.push({ href: "index.html", title: "DevDashboard", category: "Command Hub" });
      pages.push({ href: "QamelotMenu.html", title: "Qamelot Menu", category: "Directory" });
    }
    return pages;
  }

  var ICON_RULES = [
    { test: /\b(home|homepage|dashboard|hub)\b/i, icon: "🏠", tone: "gold" },
    { test: /\b(play|game|arcade|battle|arena)\b/i, icon: "🎮", tone: "red" },
    { test: /\b(save|store|keep)\b/i, icon: "💾", tone: "cyan" },
    { test: /\b(download|export|get file)\b/i, icon: "📥", tone: "blue" },
    { test: /\b(upload|import|choose file)\b/i, icon: "📤", tone: "violet" },
    { test: /\b(copy|clipboard|duplicate)\b/i, icon: "📋", tone: "gold" },
    { test: /\b(search|find|locate|discover)\b/i, icon: "🔎", tone: "cyan" },
    { test: /\b(settings?|configure|configuration|options?|preferences?)\b/i, icon: "⚙️", tone: "slate" },
    { test: /\b(tool|studio|editor|workshop|forge)\b/i, icon: "🛠️", tone: "orange" },
    { test: /\b(email|contact|message|send|reply)\b/i, icon: "✉️", tone: "violet" },
    { test: /\b(location|map|direction|navigate|fleet|directory)\b/i, icon: "🧭", tone: "green" },
    { test: /\b(time|timer|focus|clock|schedule|calendar)\b/i, icon: "⏱️", tone: "gold" },
    { test: /\b(task|check|done|complete|finish|approve)\b/i, icon: "✅", tone: "green" },
    { test: /\b(add|new|create|generate|build|make)\b/i, icon: "➕", tone: "cyan" },
    { test: /\b(delete|remove|clear|reset|trash)\b/i, icon: "🗑️", tone: "red" },
    { test: /\b(edit|note|write|compose|rename)\b/i, icon: "✏️", tone: "gold" },
    { test: /\b(share|link|connect|network)\b/i, icon: "🔗", tone: "blue" },
    { test: /\b(back|previous|return|undo)\b/i, icon: "◀", tone: "blue" },
    { test: /\b(next|continue|forward|redo)\b/i, icon: "▶", tone: "cyan" },
    { test: /\b(random|surprise|shuffle|roll)\b/i, icon: "🎲", tone: "violet" },
    { test: /\b(fullscreen|maximize|expand|zoom)\b/i, icon: "⛶", tone: "cyan" },
    { test: /\b(music|audio|sound|listen)\b/i, icon: "🎵", tone: "violet" },
    { test: /\b(video|watch|movie|media)\b/i, icon: "🎬", tone: "red" },
    { test: /\b(image|photo|gallery|picture|visual)\b/i, icon: "🖼️", tone: "green" },
    { test: /\b(code|developer|development|html|css|javascript|script)\b/i, icon: "💻", tone: "cyan" },
    { test: /\b(security|secure|lock|privacy|protect)\b/i, icon: "🔐", tone: "gold" },
    { test: /\b(data|chart|report|analytics|metrics|stats)\b/i, icon: "📊", tone: "green" },
    { test: /\b(math|calculate|calculator|number|count)\b/i, icon: "🧮", tone: "violet" },
    { test: /\b(paint|art|design|color|palette|draw)\b/i, icon: "🎨", tone: "orange" },
    { test: /\b(prompt|ai|brain|neural|intelligence)\b/i, icon: "🧠", tone: "violet" },
    { test: /\b(print)\b/i, icon: "🖨️", tone: "blue" },
    { test: /\b(help|info|about|guide|learn)\b/i, icon: "❔", tone: "cyan" },
    { test: /\b(close|cancel|stop|exit)\b/i, icon: "✕", tone: "red" },
    { test: /\b(open|launch|enter|view|visit)\b/i, icon: "↗", tone: "cyan" }
  ];
  var HEADING_ICONS = [
    { icon: "✦", tone: "cyan" },
    { icon: "◆", tone: "violet" },
    { icon: "●", tone: "gold" },
    { icon: "⬢", tone: "green" },
    { icon: "✹", tone: "orange" },
    { icon: "◈", tone: "red" }
  ];

  function iconChoice(element, text) {
    for (var index = 0; index < ICON_RULES.length; index += 1) {
      if (ICON_RULES[index].test.test(text)) return ICON_RULES[index];
    }
    if (element.matches("h2,h3")) {
      var hash = Array.from(text).reduce(function (total, character) {
        return (total + character.codePointAt(0)) % HEADING_ICONS.length;
      }, 0);
      return HEADING_ICONS[hash];
    }
    if (element.matches("label")) return { icon: "●", tone: "violet" };
    if (element.matches("a")) return { icon: "◆", tone: "blue" };
    return { icon: "⚡", tone: "cyan" };
  }

  function iconCandidate(element) {
    if (!element || element.dataset.n8Iconized === "true") return false;
    if (element.closest("#n8t-shell,#n8t-context,#n8t-clipboard,#n8t-modal,#n8x-skip")) return false;
    if (element.querySelector(".n8t-page-icon")) return false;
    if (element.matches("a,button") && element.querySelector("img,svg,canvas,video,[class*='icon' i],[data-icon]")) return false;
    var text = element.textContent.replace(/\s+/g, " ").trim();
    var limit = element.matches("h2,h3") ? 72 : element.matches("label") ? 36 : 44;
    if (text.length < 2 || text.length > limit) return false;
    if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(text.slice(0, 4))) return false;
    if (element.matches("button") && /^[\W_]{1,4}$/.test(text)) return false;
    return true;
  }

  function addColorIcon(element) {
    if (!iconCandidate(element)) return false;
    var text = element.textContent.replace(/\s+/g, " ").trim();
    var choice = iconChoice(element, text);
    var icon = document.createElement("span");
    icon.className = "n8t-page-icon";
    icon.dataset.tone = choice.tone;
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = choice.icon;
    element.insertBefore(icon, element.firstChild);
    element.dataset.n8Iconized = "true";
    element.classList.add("n8t-iconized");
    return true;
  }

  function decoratePageIcons(root) {
    if (!root || root.nodeType !== 1) return;
    var selector = "button,a,h2,h3,label";
    var candidates = [];
    if (root.matches && root.matches(selector)) candidates.push(root);
    if (root.querySelectorAll) candidates = candidates.concat(Array.from(root.querySelectorAll(selector)));
    var added = 0;
    candidates.forEach(function (element) {
      if (added < 140 && addColorIcon(element)) added += 1;
    });
    var total = document.querySelectorAll(".n8t-page-icon").length;
    document.documentElement.dataset.n8ColorIcons = String(total);
  }

  function observeIconTargets() {
    if (!window.MutationObserver) return;
    var queue = [];
    var scheduled = false;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && !node.closest("#n8t-shell,#n8t-context,#n8t-clipboard,#n8t-modal")) queue.push(node);
        });
      });
      if (scheduled || !queue.length) return;
      scheduled = true;
      setTimeout(function () {
        var nodes = queue.splice(0, queue.length);
        scheduled = false;
        nodes.forEach(decoratePageIcons);
      }, 60);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function cleanLegacy() {
    [
      "n8bot-shell", "n8bot-context", "n8bot-toast", "n8bot-progress",
      "n8bot-theme-layer", "n8bot-dimmer", "n8bot-styles",
      "n8bot-turtle-data", "n8bot-script"
    ].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.remove();
    });
    ["n8x-shell", "n8x-toast"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.remove();
    });
    document.documentElement.removeAttribute("data-n8bot-mode");
    document.documentElement.removeAttribute("data-n8bot-calm");
  }

  function shellMarkup() {
    return [
      '<div id="n8t-mode-layer" aria-hidden="true"></div>',
      '<section id="n8t-shell" data-open="false" data-n8t-mode="transformers" aria-label="N8 Tools">',
      '  <div class="n8t-panel" id="n8t-panel" aria-hidden="true">',
      '    <header class="n8t-head">',
      '      <div><span class="n8t-kicker">All-in-one browser system</span><h2 class="n8t-title">N8 <em>Tools</em></h2></div>',
      '      <span class="n8t-status">Systems online</span>',
      '    </header>',
      '    <div class="n8t-tabs" role="tablist" aria-label="N8 Tool sections">',
      '      <button class="n8t-tab" id="n8t-tab-bot" role="tab" aria-selected="true" aria-controls="n8t-view-bot" data-tab="bot"><span aria-hidden="true">✦</span>Pathfinder</button>',
      '      <button class="n8t-tab" id="n8t-tab-features" role="tab" aria-selected="false" aria-controls="n8t-view-features" data-tab="features"><span aria-hidden="true">🧰</span>Features</button>',
      '      <button class="n8t-tab" id="n8t-tab-fleet" role="tab" aria-selected="false" aria-controls="n8t-view-fleet" data-tab="fleet"><span aria-hidden="true">🧭</span>Fleet</button>',
      '      <button class="n8t-tab" id="n8t-tab-modes" role="tab" aria-selected="false" aria-controls="n8t-view-modes" data-tab="modes"><span aria-hidden="true">🎨</span>Modes</button>',
      '    </div>',
      '    <div class="n8t-stage">',
      '      <section class="n8t-view n8t-bot" id="n8t-view-bot" role="tabpanel" aria-labelledby="n8t-tab-bot">',
      '        <div class="n8t-bot-identity"><span class="n8t-bot-core" aria-hidden="true"><i></i></span><span><b>N8 PATHFINDER</b><small>Private on-device command brain</small></span><span class="n8t-bot-online">READY</span></div>',
      '        <div class="n8t-bot-timer" id="n8t-bot-timer" hidden><span>FOCUS TIMER</span><strong id="n8t-bot-timer-value">00:00</strong><button type="button" id="n8t-bot-timer-cancel">CANCEL</button></div>',
      '        <div class="n8t-bot-log" id="n8t-bot-log" role="log" aria-live="polite" aria-label="Pathfinder conversation"></div>',
      '        <div class="n8t-bot-chips" aria-label="Pathfinder shortcuts">',
      '          <button type="button" data-bot-quick="suggest">Suggest</button>',
      '          <button type="button" data-bot-quick="summarize page">Page intel</button>',
      '          <button type="button" data-bot-quick="focus 25">Focus 25</button>',
      '          <button type="button" data-bot-quick="help">Commands</button>',
      '        </div>',
      '        <form class="n8t-bot-compose" id="n8t-bot-form">',
      '          <input id="n8t-bot-input" type="text" autocomplete="off" maxlength="240" aria-label="Message N8 Pathfinder" placeholder="Ask, find, open, note, time, focus…">',
      '          <button class="n8t-bot-mic" id="n8t-bot-mic" type="button" aria-label="Speak to Pathfinder" title="Voice input">◎</button>',
      '          <button class="n8t-bot-send" type="submit" aria-label="Send to Pathfinder">GO</button>',
      '        </form>',
      '      </section>',
      '      <section class="n8t-view" id="n8t-view-features" role="tabpanel" aria-labelledby="n8t-tab-features" hidden>',
      '        <div class="n8t-grid">',
      '          <button class="n8t-card" data-feature="clipboard"><span class="n8t-card-icon">▣</span><b>Clipboard View</b><span>Reveal the latest copied text in a private popup note.</span></button>',
      '          <button class="n8t-card" data-feature="notes"><span class="n8t-card-icon">✦</span><b>Quick Notes</b><span>Keep an autosaved scratchpad on this browser.</span></button>',
      '          <button class="n8t-card" data-feature="ruler"><span class="n8t-card-icon">═</span><b>Reading Ruler</b><span>Track a focused line across dense pages.</span></button>',
      '          <button class="n8t-card" data-feature="links"><span class="n8t-card-icon">⌁</span><b>Link Inspector</b><span>Audit internal, external, mail, and download links.</span></button>',
      '          <button class="n8t-card" data-feature="snapshot"><span class="n8t-card-icon">⇩</span><b>Page Snapshot</b><span>Save the current page as a portable HTML snapshot.</span></button>',
      '          <button class="n8t-card" data-feature="scan"><span class="n8t-card-icon">◇</span><b>Transformer Scan</b><span>Run a fast structural and accessibility diagnostic.</span></button>',
      '        </div>',
      '      </section>',
      '      <section class="n8t-view" id="n8t-view-fleet" role="tabpanel" aria-labelledby="n8t-tab-fleet" hidden>',
      '        <input class="n8t-search" id="n8t-search" type="search" placeholder="Search the N8 website fleet…" autocomplete="off">',
      '        <div class="n8t-fleet" id="n8t-fleet"></div>',
      '      </section>',
      '      <section class="n8t-view" id="n8t-view-modes" role="tabpanel" aria-labelledby="n8t-tab-modes" hidden>',
      '        <div class="n8t-mode-list">',
      modeMarkup("calm", "#82989d", "Calm Mode", "Dim, desaturate, and quiet the visual field."),
      modeMarkup("dark", "#05080c", "Dark Mode", "Deep contrast for night operation."),
      modeMarkup("light", "#dbeaf0", "Light Mode", "Bright mechanical surfaces and crisp type."),
      modeMarkup("cyber", "#00f1ff", "Cyber Mode", "Neon grid energy with cyan instrumentation."),
      modeMarkup("transformers", "linear-gradient(135deg,#38ddff 0 45%,#ffc857 46% 55%,#ff3f45 56%)", "Transformers Mode", "Angular armor, energon cyan, and command red."),
      '        </div>',
      '      </section>',
      '    </div>',
      '    <footer class="n8t-foot"><span>Pathfinder works privately in your browser</span><code>ALT+B</code></footer>',
      '  </div>',
      '  <div class="n8t-dock">',
      '    <button class="n8t-btn n8t-brand" id="n8t-toggle" aria-expanded="false" aria-controls="n8t-panel"><span class="n8t-mark">N8</span><span class="n8t-brand-copy"><strong>PATHFINDER</strong><small>Command brain online</small></span></button>',
      '    <button class="n8t-btn n8t-icon-btn" id="n8t-clipboard-button" title="Clipboard view" aria-label="Open clipboard view">▣</button>',
      '    <button class="n8t-btn n8t-icon-btn" id="n8t-mode-button" title="Cycle visual mode" aria-label="Cycle visual mode">◈</button>',
      '    <button class="n8t-btn n8t-icon-btn" id="n8t-pin" title="Pin N8 Tools" aria-label="Pin N8 Tools" aria-pressed="true">⌖</button>',
      '    <button class="n8t-btn n8t-icon-btn n8t-grip" id="n8t-grip" title="Drag N8 Tools" aria-label="Drag N8 Tools">⠿</button>',
      '  </div>',
      '</section>',
      '<div id="n8t-context" role="menu" aria-label="N8 extended context menu" hidden>',
      '  <div class="n8t-menu-label">N8 Extended Actions</div>',
      contextItem("copy-url", "Copy page URL", "01"),
      contextItem("copy-title", "Copy page title", "02"),
      contextItem("copy-selection", "Copy selection", "03"),
      contextItem("clipboard", "Clipboard viewer", "04"),
      contextItem("notes", "Quick note", "05"),
      contextItem("fleet", "Search site fleet", "06"),
      contextItem("calm", "Calm mode", "07"),
      contextItem("cycle", "Cycle visual mode", "08"),
      contextItem("links", "Link inspector", "09"),
      contextItem("scan", "Transformer scan", "10"),
      contextItem("top", "Back to top", "11"),
      contextItem("fullscreen", "Toggle fullscreen", "12"),
      contextItem("print", "Print page", "13"),
      contextItem("pathfinder", "Ask N8 Pathfinder", "14"),
      '</div>',
      overlayMarkup("n8t-clipboard", "Clipboard View", "n8t-clipboard-text", "Refresh", "Copy", "Clear"),
      overlayMarkup("n8t-modal", "N8 Utility", "n8t-modal-content", "", "", ""),
      '<div id="n8t-ruler" aria-hidden="true" hidden></div>',
      '<div id="n8t-toast" role="status" aria-live="polite"></div>'
    ].join("");
  }

  function modeMarkup(id, color, label, description) {
    return '<button class="n8t-mode" data-mode="' + id + '" aria-pressed="false"><span class="n8t-mode-swatch" style="background:' + color + '"></span><span><b>' + label + '</b><small>' + description + '</small></span><span class="n8t-mode-state">READY</span></button>';
  }

  function contextItem(action, label, index) {
    return '<button class="n8t-menu-item" role="menuitem" data-context="' + action + '"><span>' + label + '</span><kbd>' + index + '</kbd></button>';
  }

  function overlayMarkup(id, title, bodyId, first, second, third) {
    var isClipboard = id === "n8t-clipboard";
    var body = isClipboard
      ? '<textarea id="' + bodyId + '" aria-label="Latest clipboard text" placeholder="Copy text anywhere, then use Refresh. Clipboard access requires browser permission."></textarea>'
      : '<div id="' + bodyId + '"></div>';
    var actions = '<button class="n8t-action" data-close="' + id + '">Close</button>';
    if (first) actions = '<button class="n8t-action" id="n8t-clip-refresh">' + first + '</button><button class="n8t-action" id="n8t-clip-copy">' + second + '</button><button class="n8t-action" id="n8t-clip-clear">' + third + '</button>' + actions;
    return '<div class="n8t-overlay" id="' + id + '" hidden><section class="n8t-dialog" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title"><header class="n8t-dialog-head"><h2 id="' + id + '-title">' + title + '</h2><button class="n8t-action" data-close="' + id + '" aria-label="Close">×</button></header><div class="n8t-dialog-body">' + body + '</div><footer class="n8t-dialog-actions">' + actions + '</footer></section></div>';
  }

  function mount() {
    if (document.getElementById("n8t-shell")) return;
    state.pages = capturePages();
    cleanLegacy();
    document.body.insertAdjacentHTML("beforeend", shellMarkup());
    bind();
    renderFleet("");
    initPathfinder();
    var storedMode = safeGet(STORAGE.mode, "transformers");
    setMode(MODES.indexOf(storedMode) > -1 ? storedMode : "transformers", false);
    state.pinned = safeGet(STORAGE.pinned, "true") !== "false";
    setPinned(state.pinned, false);
    restorePosition();
    updateProgress();
    decoratePageIcons(document.body);
    observeIconTargets();
  }

  function bind() {
    var shell = document.getElementById("n8t-shell");
    var toggle = document.getElementById("n8t-toggle");
    toggle.addEventListener("click", function () {
      setOpen(shell.dataset.open !== "true");
    });
    document.getElementById("n8t-clipboard-button").addEventListener("click", openClipboard);
    document.getElementById("n8t-mode-button").addEventListener("click", cycleMode);
    document.getElementById("n8t-pin").addEventListener("click", function () {
      setPinned(!state.pinned, true);
    });
    bindDrag();
    document.querySelectorAll(".n8t-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { setTab(tab.dataset.tab); });
    });
    document.getElementById("n8t-search").addEventListener("input", function (event) {
      renderFleet(event.target.value);
    });
    document.getElementById("n8t-bot-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = document.getElementById("n8t-bot-input");
      var command = input.value.trim();
      if (!command) return;
      input.value = "";
      runPathfinder(command);
    });
    document.getElementById("n8t-bot-input").addEventListener("keydown", botHistoryKeys);
    document.querySelectorAll("[data-bot-quick]").forEach(function (button) {
      button.addEventListener("click", function () { runPathfinder(button.dataset.botQuick); });
    });
    document.getElementById("n8t-bot-mic").addEventListener("click", startVoiceInput);
    document.getElementById("n8t-bot-timer-cancel").addEventListener("click", cancelFocusTimer);
    document.querySelectorAll(".n8t-card").forEach(function (card) {
      card.addEventListener("click", function () { runFeature(card.dataset.feature); });
    });
    document.querySelectorAll(".n8t-mode").forEach(function (button) {
      button.addEventListener("click", function () { setMode(button.dataset.mode, true); });
    });
    document.querySelectorAll("[data-close]").forEach(function (button) {
      button.addEventListener("click", function () { closeOverlay(button.dataset.close); });
    });
    document.getElementById("n8t-clip-refresh").addEventListener("click", readClipboard);
    document.getElementById("n8t-clip-copy").addEventListener("click", function () {
      copyText(document.getElementById("n8t-clipboard-text").value, "Clipboard note copied");
    });
    document.getElementById("n8t-clip-clear").addEventListener("click", function () {
      document.getElementById("n8t-clipboard-text").value = "";
      safeSet(STORAGE.clipboard, "");
      toast("Clipboard note cleared");
    });
    document.querySelectorAll(".n8t-overlay").forEach(function (overlay) {
      overlay.addEventListener("pointerdown", function (event) {
        if (event.target === overlay) closeOverlay(overlay.id);
      });
    });
    document.querySelectorAll("[data-context]").forEach(function (item) {
      item.addEventListener("click", function () {
        runContext(item.dataset.context);
        hideContext();
      });
    });
    document.addEventListener("contextmenu", showContext, false);
    document.addEventListener("copy", rememberCopy, false);
    document.addEventListener("keydown", keyboard, false);
    addEventListener("scroll", updateProgress, { passive: true });
    addEventListener("resize", function () {
      updateProgress();
      keepInViewport();
    }, { passive: true });
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = new Set((link.rel || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.rel = Array.from(rel).join(" ");
    });
  }

  function setOpen(open) {
    var shell = document.getElementById("n8t-shell");
    shell.dataset.open = String(open);
    document.getElementById("n8t-panel").setAttribute("aria-hidden", String(!open));
    document.getElementById("n8t-toggle").setAttribute("aria-expanded", String(open));
  }

  function setTab(name) {
    document.querySelectorAll(".n8t-tab").forEach(function (tab) {
      tab.setAttribute("aria-selected", String(tab.dataset.tab === name));
    });
    document.querySelectorAll(".n8t-view").forEach(function (view) {
      view.hidden = view.id !== "n8t-view-" + name;
    });
  }

  function renderFleet(query) {
    var needle = String(query || "").trim().toLowerCase();
    var fleet = document.getElementById("n8t-fleet");
    if (!fleet) return;
    fleet.replaceChildren();
    state.pages.filter(function (page) {
      return !needle || (page.title + " " + page.category + " " + page.href).toLowerCase().indexOf(needle) > -1;
    }).forEach(function (page) {
      var link = document.createElement("a");
      var title = document.createElement("span");
      var type = document.createElement("small");
      link.href = page.href;
      title.textContent = page.title;
      type.textContent = page.category;
      link.append(title, type);
      fleet.appendChild(link);
    });
    if (!fleet.children.length) {
      var empty = document.createElement("p");
      empty.textContent = "No fleet pages match that search.";
      fleet.appendChild(empty);
    }
  }

  function initPathfinder() {
    try {
      var saved = JSON.parse(safeGet(STORAGE.botHistory, "[]"));
      if (Array.isArray(saved)) {
        state.botHistory = saved.filter(function (item) {
          return item && (item.role === "bot" || item.role === "user") && typeof item.text === "string";
        }).slice(-32);
      }
    } catch (error) {
      state.botHistory = [];
    }
    if (!state.botHistory.length) {
      state.botHistory.push({
        role: "bot",
        text: "Pathfinder online. I mapped " + state.pages.length + " N8 destinations and analyzed this page. Ask me to suggest, find, open, note, focus, summarize, scan, copy, or change mode.",
        time: Date.now()
      });
    }
    renderBotHistory();
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    document.getElementById("n8t-bot-mic").hidden = !SpeechRecognition;
    resumeFocusTimer();
  }

  function botSay(role, text) {
    state.botHistory.push({ role: role, text: String(text), time: Date.now() });
    state.botHistory = state.botHistory.slice(-32);
    safeSet(STORAGE.botHistory, JSON.stringify(state.botHistory));
    renderBotHistory();
  }

  function renderBotHistory() {
    var log = document.getElementById("n8t-bot-log");
    if (!log) return;
    log.replaceChildren();
    state.botHistory.forEach(function (item) {
      var message = document.createElement("article");
      var label = document.createElement("span");
      var copy = document.createElement("p");
      message.className = "n8t-bot-message n8t-bot-" + item.role;
      label.textContent = item.role === "user" ? "YOU" : "PATHFINDER";
      copy.textContent = item.text;
      message.append(label, copy);
      log.appendChild(message);
    });
    log.scrollTop = log.scrollHeight;
  }

  function pageIntel() {
    var clone = document.body.cloneNode(true);
    clone.querySelectorAll("#n8t-shell,#n8t-context,#n8t-clipboard,#n8t-modal,#n8t-ruler,#n8t-toast,#n8t-mode-layer,#n8x-skip,#n8x-progress,.n8t-page-icon").forEach(function (node) {
      node.remove();
    });
    var words = (clone.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    var headings = Array.from(document.querySelectorAll("h1,h2,h3")).filter(function (node) {
      return !node.closest("#n8t-shell");
    });
    return {
      title: document.title || "Untitled page",
      heading: headings.length ? headings[0].textContent.trim() : "No primary heading",
      words: words,
      minutes: Math.max(1, Math.ceil(words / 220)),
      links: document.querySelectorAll("a[href]").length,
      buttons: Array.from(document.querySelectorAll("button")).filter(function (node) { return !node.closest("#n8t-shell,#n8t-context,#n8t-modal,#n8t-clipboard"); }).length,
      fields: Array.from(document.querySelectorAll("input,textarea,select")).filter(function (node) { return !node.closest("#n8t-shell,#n8t-modal,#n8t-clipboard"); }).length,
      canvases: document.querySelectorAll("canvas").length
    };
  }

  function pageSummary() {
    var intel = pageIntel();
    return [
      "PAGE INTEL — " + intel.title,
      "Primary heading: " + intel.heading,
      intel.words + " words · about " + intel.minutes + " min read",
      intel.links + " links · " + intel.buttons + " buttons · " + intel.fields + " fields · " + intel.canvases + " canvases"
    ].join("\n");
  }

  function pathfinderSuggestions() {
    var intel = pageIntel();
    var ideas = [];
    if (intel.canvases) ideas.push('This is an interactive canvas page—try "fullscreen" or "scan".');
    if (intel.fields) ideas.push('There are ' + intel.fields + ' input fields—try "summarize page" before entering data.');
    if (intel.words > 900) ideas.push('This page is text-heavy—turn on the Reading Ruler from Features.');
    if (intel.buttons > 12) ideas.push('There are ' + intel.buttons + ' controls—run "scan" for a quick interface check.');
    if (state.pages.length > 5) ideas.push('I can jump across all ' + state.pages.length + ' destinations: type "open" plus a page name.');
    ideas.push('Start a protected work sprint with "focus 25".');
    ideas.push('Capture an idea instantly with "note" followed by your thought.');
    return "BEST NEXT MOVES\n" + ideas.slice(0, 3).map(function (idea, index) {
      return (index + 1) + ". " + idea;
    }).join("\n");
  }

  function findOnPage(query) {
    var needle = query.toLowerCase();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest("#n8t-shell,#n8t-context,#n8t-modal,#n8t-clipboard,script,style")) continue;
      var index = node.nodeValue.toLowerCase().indexOf(needle);
      if (index < 0) continue;
      var range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + query.length);
      var selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      node.parentElement.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      return true;
    }
    return false;
  }

  function fleetMatch(query) {
    var needle = query.toLowerCase().trim();
    var terms = needle.split(/\s+/).filter(Boolean);
    return state.pages.map(function (page) {
      var title = page.title.toLowerCase();
      var haystack = (page.title + " " + page.category + " " + page.href).toLowerCase();
      var score = title === needle ? 100 : title.startsWith(needle) ? 80 : title.indexOf(needle) > -1 ? 65 : terms.every(function (term) { return haystack.indexOf(term) > -1; }) ? 45 : terms.filter(function (term) { return haystack.indexOf(term) > -1; }).length * 10;
      return { page: page, score: score };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) {
      return b.score - a.score || a.page.title.localeCompare(b.page.title);
    });
  }

  function runPathfinder(rawCommand) {
    var command = String(rawCommand || "").trim();
    if (!command) return;
    state.commandHistory.push(command);
    state.commandHistory = state.commandHistory.slice(-20);
    state.commandIndex = state.commandHistory.length;
    botSay("user", command);
    var lower = command.toLowerCase().replace(/^\/+/, "");
    var match;

    if (/^(help|commands|what can you do|\?)$/.test(lower)) {
      botSay("bot", 'COMMAND MAP\nsuggest · summarize page · find <text> · open <site>\nnote <idea> · show notes · focus <minutes> · cancel timer\nmode <name> · copy url/title/selection · clipboard\nscan · links · random · top · bottom · time · clear chat');
    } else if (/^(suggest|recommend|what next|next)$/.test(lower)) {
      botSay("bot", pathfinderSuggestions());
    } else if (/^(summarize|summarise|summarize page|page intel|analyze page|analyse page|status)$/.test(lower)) {
      botSay("bot", pageSummary());
    } else if ((match = lower.match(/^(?:find|locate|search page for)\s+(.+)/))) {
      var found = findOnPage(match[1]);
      botSay("bot", found ? 'Found and selected “' + match[1] + '” on this page.' : 'I could not find “' + match[1] + '” on this page.');
    } else if ((match = lower.match(/^(?:open|go to|navigate to|launch)\s+(.+)/))) {
      var matches = fleetMatch(match[1]);
      if (!matches.length) {
        botSay("bot", 'No fleet destination matched “' + match[1] + '”. Try the Fleet tab.');
      } else {
        botSay("bot", "Opening " + matches[0].page.title + "…");
        setTimeout(function () { location.href = matches[0].page.href; }, 420);
      }
    } else if ((match = command.match(/^(?:note|remember|capture)\s+(.+)/i))) {
      var stamp = new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      var existing = safeGet(STORAGE.notes, "");
      safeSet(STORAGE.notes, (existing ? existing + "\n" : "") + "• " + match[1].trim() + "  [" + stamp + "]");
      botSay("bot", "Captured in Quick Notes: " + match[1].trim());
    } else if (/^(show|open)\s+notes?$/.test(lower)) {
      openNotes();
      botSay("bot", "Quick Notes opened.");
    } else if ((match = lower.match(/^(?:focus|timer)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)?$/))) {
      startFocusTimer(Number(match[1]));
    } else if (/^(?:cancel|stop|clear)\s+(?:focus|timer)$/.test(lower)) {
      cancelFocusTimer();
    } else if ((match = lower.match(/^(?:mode|theme)\s+(calm|dark|light|cyber|transformers?)$/))) {
      setMode(match[1] === "transformer" ? "transformers" : match[1], true);
      botSay("bot", "Visual system changed to " + state.mode + " mode.");
    } else if (/^copy\s+(?:url|link|page link)$/.test(lower)) {
      copyText(location.href, "Page URL copied");
      botSay("bot", "Page URL copied.");
    } else if (/^copy\s+(?:title|page title)$/.test(lower)) {
      copyText(document.title, "Page title copied");
      botSay("bot", "Page title copied.");
    } else if (/^copy\s+selection$/.test(lower)) {
      var selected = String(getSelection ? getSelection() : "").trim();
      if (selected) {
        copyText(selected, "Selection copied");
        botSay("bot", "Selected text copied.");
      } else {
        botSay("bot", "Select some page text first, then ask again.");
      }
    } else if (/^(clipboard|open clipboard|clipboard view)$/.test(lower)) {
      openClipboard();
      botSay("bot", "Clipboard View opened.");
    } else if (/^(scan|diagnose|diagnostic|transformer scan)$/.test(lower)) {
      transformerScan();
      botSay("bot", "Transformer scan running.");
    } else if (/^(fullscreen|full screen|toggle fullscreen)$/.test(lower)) {
      toggleFullscreen();
      botSay("bot", "Fullscreen toggled.");
    } else if (/^(links|inspect links|link inspector)$/.test(lower)) {
      inspectLinks();
      botSay("bot", "Link Inspector opened.");
    } else if (/^(random|surprise me|random page)$/.test(lower)) {
      var choices = state.pages.filter(function (page) { return !location.pathname.endsWith(page.href); });
      var choice = choices[Math.floor(Math.random() * choices.length)];
      if (choice) {
        botSay("bot", "Surprise route selected: " + choice.title + "…");
        setTimeout(function () { location.href = choice.href; }, 420);
      }
    } else if (/^(top|back to top)$/.test(lower)) {
      scrollTo({ top: 0, behavior: "smooth" });
      botSay("bot", "Moving to the top.");
    } else if (/^(bottom|go to bottom)$/.test(lower)) {
      scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      botSay("bot", "Moving to the bottom.");
    } else if (/^(time|date|today|what time is it)$/.test(lower)) {
      botSay("bot", new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" }));
    } else if (/^(clear|clear chat|reset chat)$/.test(lower)) {
      state.botHistory = [];
      safeSet(STORAGE.botHistory, "[]");
      botSay("bot", "Conversation cleared. Pathfinder is ready.");
    } else if (/^(who are you|what are you|about)$/.test(lower)) {
      botSay("bot", "I’m N8 Pathfinder: a private browser-side operator. I use the page already in front of you—no account, server, or conversation upload required.");
    } else {
      var suggestions = fleetMatch(lower).slice(0, 3);
      if (findOnPage(command)) {
        botSay("bot", 'I found “' + command + '” on this page and selected it. For fleet navigation, say "open ' + command + '".');
      } else if (suggestions.length) {
        botSay("bot", "Possible fleet matches:\n" + suggestions.map(function (item) { return "• " + item.page.title; }).join("\n") + '\nSay "open" plus a title to launch one.');
      } else {
        botSay("bot", 'I did not recognize that yet. Try "suggest" or "help" for my command map.');
      }
    }
  }

  function botHistoryKeys(event) {
    if (!state.commandHistory.length || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    state.commandIndex += event.key === "ArrowUp" ? -1 : 1;
    state.commandIndex = Math.max(0, Math.min(state.commandHistory.length, state.commandIndex));
    event.currentTarget.value = state.commandIndex === state.commandHistory.length ? "" : state.commandHistory[state.commandIndex];
  }

  function startVoiceInput() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Voice input is unavailable in this browser");
      return;
    }
    var recognition = new SpeechRecognition();
    var button = document.getElementById("n8t-bot-mic");
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    button.dataset.listening = "true";
    recognition.onresult = function (event) {
      var spoken = event.results[0][0].transcript;
      document.getElementById("n8t-bot-input").value = spoken;
      runPathfinder(spoken);
    };
    recognition.onerror = function () { toast("I could not hear that command"); };
    recognition.onend = function () { button.dataset.listening = "false"; };
    recognition.start();
  }

  function startFocusTimer(minutes) {
    minutes = Math.max(.1, Math.min(180, Number(minutes) || 25));
    var timer = { end: Date.now() + Math.round(minutes * 60000), minutes: minutes };
    safeSet(STORAGE.botTimer, JSON.stringify(timer));
    activateFocusTimer(timer);
    botSay("bot", "Focus shield engaged for " + minutes + " minute" + (minutes === 1 ? "" : "s") + ". I’ll keep the countdown visible across pages.");
  }

  function resumeFocusTimer() {
    try {
      var timer = JSON.parse(safeGet(STORAGE.botTimer, "null"));
      if (timer && Number(timer.end) > Date.now()) activateFocusTimer(timer);
      else safeSet(STORAGE.botTimer, "");
    } catch (error) {
      safeSet(STORAGE.botTimer, "");
    }
  }

  function activateFocusTimer(timer) {
    clearInterval(state.timerInterval);
    var panel = document.getElementById("n8t-bot-timer");
    var value = document.getElementById("n8t-bot-timer-value");
    panel.hidden = false;
    function tick() {
      var remaining = Math.max(0, Number(timer.end) - Date.now());
      var seconds = Math.ceil(remaining / 1000);
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      value.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
      if (remaining <= 0) {
        clearInterval(state.timerInterval);
        panel.hidden = true;
        safeSet(STORAGE.botTimer, "");
        toast("Focus mission complete");
        botSay("bot", "Focus mission complete. Take a breath, save your work, and choose the next move.");
      }
    }
    tick();
    state.timerInterval = setInterval(tick, 1000);
  }

  function cancelFocusTimer() {
    clearInterval(state.timerInterval);
    var panel = document.getElementById("n8t-bot-timer");
    if (panel) panel.hidden = true;
    safeSet(STORAGE.botTimer, "");
    botSay("bot", "Focus timer cancelled.");
  }

  function setMode(mode, announce) {
    if (MODES.indexOf(mode) < 0) mode = "transformers";
    state.mode = mode;
    document.documentElement.dataset.n8tMode = mode;
    document.getElementById("n8t-shell").dataset.n8tMode = mode;
    document.querySelectorAll(".n8t-mode").forEach(function (button) {
      var active = button.dataset.mode === mode;
      button.setAttribute("aria-pressed", String(active));
      var label = button.querySelector(".n8t-mode-state");
      if (label) label.textContent = active ? "ACTIVE" : "READY";
    });
    safeSet(STORAGE.mode, mode);
    document.getElementById("n8t-mode-button").title = "Current mode: " + mode;
    if (announce) toast(mode.charAt(0).toUpperCase() + mode.slice(1) + " mode engaged");
  }

  function cycleMode() {
    var index = MODES.indexOf(state.mode);
    setMode(MODES[(index + 1) % MODES.length], true);
  }

  function setPinned(pinned, announce) {
    state.pinned = Boolean(pinned);
    var pin = document.getElementById("n8t-pin");
    pin.setAttribute("aria-pressed", String(state.pinned));
    pin.title = state.pinned ? "Unpin N8 Tools to drag" : "Pin N8 Tools";
    safeSet(STORAGE.pinned, String(state.pinned));
    if (state.pinned) {
      var shell = document.getElementById("n8t-shell");
      shell.style.left = "";
      shell.style.top = "";
      shell.style.right = "18px";
      shell.style.bottom = "18px";
      safeSet(STORAGE.position, "");
    }
    if (announce) toast(state.pinned ? "N8 Tools pinned to corner" : "N8 Tools unlocked for dragging");
  }

  function bindDrag() {
    var shell = document.getElementById("n8t-shell");
    var grip = document.getElementById("n8t-grip");
    var drag = null;
    grip.addEventListener("pointerdown", function (event) {
      if (state.pinned) {
        toast("Unpin N8 Tools before dragging");
        return;
      }
      var rect = shell.getBoundingClientRect();
      drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      grip.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    grip.addEventListener("pointermove", function (event) {
      if (!drag) return;
      var width = shell.offsetWidth;
      var height = shell.offsetHeight;
      var left = Math.max(6, Math.min(innerWidth - width - 6, event.clientX - drag.x));
      var top = Math.max(6, Math.min(innerHeight - height - 6, event.clientY - drag.y));
      shell.style.left = left + "px";
      shell.style.top = top + "px";
      shell.style.right = "auto";
      shell.style.bottom = "auto";
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      var rect = shell.getBoundingClientRect();
      safeSet(STORAGE.position, JSON.stringify({ left: rect.left, top: rect.top }));
    }
    grip.addEventListener("pointerup", endDrag);
    grip.addEventListener("pointercancel", endDrag);
  }

  function restorePosition() {
    if (state.pinned) return;
    var raw = safeGet(STORAGE.position, "");
    if (!raw) return;
    try {
      var position = JSON.parse(raw);
      var shell = document.getElementById("n8t-shell");
      shell.style.left = Math.max(6, Math.min(innerWidth - shell.offsetWidth - 6, Number(position.left) || 6)) + "px";
      shell.style.top = Math.max(6, Math.min(innerHeight - shell.offsetHeight - 6, Number(position.top) || 6)) + "px";
      shell.style.right = "auto";
      shell.style.bottom = "auto";
    } catch (error) {
      safeSet(STORAGE.position, "");
    }
  }

  function keepInViewport() {
    if (state.pinned) return;
    var shell = document.getElementById("n8t-shell");
    var rect = shell.getBoundingClientRect();
    shell.style.left = Math.max(6, Math.min(innerWidth - rect.width - 6, rect.left)) + "px";
    shell.style.top = Math.max(6, Math.min(innerHeight - rect.height - 6, rect.top)) + "px";
  }

  function openOverlay(id) {
    state.lastFocus = document.activeElement;
    var overlay = document.getElementById(id);
    overlay.hidden = false;
    requestAnimationFrame(function () {
      var focusable = overlay.querySelector("textarea,button,input");
      if (focusable) focusable.focus();
    });
  }

  function closeOverlay(id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.hidden = true;
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function openClipboard() {
    var area = document.getElementById("n8t-clipboard-text");
    area.value = safeGet(STORAGE.clipboard, "");
    openOverlay("n8t-clipboard");
    readClipboard();
  }

  function readClipboard() {
    var area = document.getElementById("n8t-clipboard-text");
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (text) {
        if (text) {
          area.value = text;
          safeSet(STORAGE.clipboard, text);
          toast("Latest clipboard text loaded");
        } else {
          toast("Clipboard is empty");
        }
      }).catch(function () {
        area.value = safeGet(STORAGE.clipboard, "");
        toast(area.value ? "Showing last text captured by N8 Tools" : "Copy text, then tap Refresh");
      });
    } else {
      area.value = safeGet(STORAGE.clipboard, "");
      toast(area.value ? "Showing last text captured by N8 Tools" : "Copy text to load this view");
    }
  }

  function rememberCopy() {
    setTimeout(function () {
      var selection = String(getSelection ? getSelection() : "").trim();
      if (selection) safeSet(STORAGE.clipboard, selection);
    }, 0);
  }

  function openNotes() {
    var body = document.getElementById("n8t-modal-content");
    body.replaceChildren();
    var area = document.createElement("textarea");
    area.id = "n8t-notes-text";
    area.placeholder = "Type a private browser note…";
    area.value = safeGet(STORAGE.notes, "");
    area.addEventListener("input", function () {
      safeSet(STORAGE.notes, area.value);
    });
    body.appendChild(area);
    setModalTitle("Quick Notes");
    openOverlay("n8t-modal");
  }

  function setModalTitle(title) {
    document.getElementById("n8t-modal-title").textContent = title;
  }

  function showReport(title, lines) {
    var body = document.getElementById("n8t-modal-content");
    body.replaceChildren();
    var pre = document.createElement("pre");
    pre.textContent = lines.join("\n");
    body.appendChild(pre);
    setModalTitle(title);
    openOverlay("n8t-modal");
  }

  function toggleRuler() {
    state.ruler = !state.ruler;
    var ruler = document.getElementById("n8t-ruler");
    ruler.hidden = !state.ruler;
    if (state.ruler) {
      document.addEventListener("pointermove", moveRuler, { passive: true });
      toast("Reading ruler on — move the pointer to track");
    } else {
      document.removeEventListener("pointermove", moveRuler);
      toast("Reading ruler off");
    }
  }

  function moveRuler(event) {
    if (state.ruler) document.getElementById("n8t-ruler").style.top = Math.max(0, event.clientY - 17) + "px";
  }

  function inspectLinks() {
    var links = Array.from(document.querySelectorAll("a[href]")).filter(function (link) {
      return !link.closest("#n8t-shell,#n8t-context,#n8t-modal,#n8t-clipboard");
    });
    var stats = { internal: 0, external: 0, mail: 0, download: 0, fragment: 0, insecure: 0 };
    links.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      if (/^mailto:/i.test(href)) stats.mail += 1;
      else if (link.hasAttribute("download")) stats.download += 1;
      else if (/^#/.test(href)) stats.fragment += 1;
      else {
        try {
          var url = new URL(href, location.href);
          if (url.origin === location.origin) stats.internal += 1;
          else stats.external += 1;
          if (url.protocol === "http:" && location.protocol === "https:") stats.insecure += 1;
        } catch (error) {
          stats.internal += 1;
        }
      }
    });
    showReport("Link Inspector", [
      "N8 LINK INSPECTION",
      "────────────────────────",
      "Total links       " + links.length,
      "Internal          " + stats.internal,
      "External          " + stats.external,
      "Email actions     " + stats.mail,
      "Downloads         " + stats.download,
      "Page fragments    " + stats.fragment,
      "Mixed HTTP risks  " + stats.insecure
    ]);
  }

  function snapshotPage() {
    var copy = document.documentElement.cloneNode(true);
    ["#n8t-shell", "#n8t-context", "#n8t-clipboard", "#n8t-modal", "#n8t-ruler", "#n8t-toast", "#n8t-mode-layer"].forEach(function (selector) {
      var node = copy.querySelector(selector);
      if (node) node.remove();
    });
    var source = "<!doctype html>\n" + copy.outerHTML;
    var blob = new Blob([source], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = (document.title || "n8-page").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() + "-snapshot.html";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Portable page snapshot created");
  }

  function transformerScan() {
    document.documentElement.classList.add("n8t-scanning");
    setTimeout(function () { document.documentElement.classList.remove("n8t-scanning"); }, 2500);
    var images = Array.from(document.images);
    var buttons = Array.from(document.querySelectorAll("button"));
    var headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    var fields = Array.from(document.querySelectorAll("input,textarea,select"));
    var missingAlt = images.filter(function (image) { return !image.hasAttribute("alt"); }).length;
    var unlabeled = fields.filter(function (field) {
      return !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby") && !field.labels.length;
    }).length;
    var unnamedButtons = buttons.filter(function (button) {
      return !button.textContent.trim() && !button.getAttribute("aria-label") && !button.getAttribute("title");
    }).length;
    setTimeout(function () {
      showReport("Transformer Scan", [
        "N8 TRANSFORMER DIAGNOSTIC",
        "────────────────────────",
        "Document title     " + (document.title ? "ONLINE" : "MISSING"),
        "Language marker    " + (document.documentElement.lang || "MISSING"),
        "Headings detected  " + headings.length,
        "Links detected     " + document.querySelectorAll("a[href]").length,
        "Controls detected  " + (buttons.length + fields.length),
        "Images detected    " + images.length,
        "Missing image alt  " + missingAlt,
        "Unlabeled fields   " + unlabeled,
        "Unnamed buttons    " + unnamedButtons,
        "Viewport width     " + innerWidth + "px",
        "Page height        " + document.documentElement.scrollHeight + "px",
        "",
        missingAlt + unlabeled + unnamedButtons === 0 ? "STATUS: SYSTEMS NOMINAL" : "STATUS: REVIEW FLAGS DETECTED"
      ]);
    }, 850);
  }

  function runFeature(feature) {
    if (feature === "clipboard") openClipboard();
    else if (feature === "notes") openNotes();
    else if (feature === "ruler") toggleRuler();
    else if (feature === "links") inspectLinks();
    else if (feature === "snapshot") snapshotPage();
    else if (feature === "scan") transformerScan();
  }

  function showContext(event) {
    var menu = document.getElementById("n8t-context");
    if (!menu) return;
    menu.hidden = false;
    var width = Math.min(248, innerWidth - 18);
    var height = Math.min(menu.scrollHeight, innerHeight - 18);
    menu.style.left = Math.max(9, Math.min(innerWidth - width - 9, event.clientX)) + "px";
    menu.style.top = Math.max(9, Math.min(innerHeight - height - 9, event.clientY)) + "px";
    clearTimeout(state.contextTimer);
    state.contextTimer = setTimeout(hideContext, 12000);
  }

  function hideContext() {
    var menu = document.getElementById("n8t-context");
    if (menu) menu.hidden = true;
    clearTimeout(state.contextTimer);
  }

  function runContext(action) {
    if (action === "copy-url") copyText(location.href, "Page URL copied");
    else if (action === "copy-title") copyText(document.title, "Page title copied");
    else if (action === "copy-selection") {
      var selected = String(getSelection ? getSelection() : "").trim();
      if (selected) copyText(selected, "Selection copied");
      else toast("Select page text first");
    } else if (action === "clipboard") openClipboard();
    else if (action === "notes") openNotes();
    else if (action === "fleet") {
      setOpen(true);
      setTab("fleet");
      document.getElementById("n8t-search").focus();
    } else if (action === "calm") setMode("calm", true);
    else if (action === "cycle") cycleMode();
    else if (action === "links") inspectLinks();
    else if (action === "scan") transformerScan();
    else if (action === "top") scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    else if (action === "fullscreen") toggleFullscreen();
    else if (action === "print") print();
    else if (action === "pathfinder") {
      setOpen(true);
      setTab("bot");
      document.getElementById("n8t-bot-input").focus();
    }
  }

  function toggleFullscreen() {
    var promise;
    try {
      promise = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } catch (error) {
      toast("Fullscreen is unavailable here");
      return;
    }
    if (promise && promise.catch) promise.catch(function () { toast("Fullscreen is unavailable here"); });
  }

  function keyboard(event) {
    var typing = /input|textarea|select/i.test((document.activeElement && document.activeElement.tagName) || "");
    if (event.key === "Escape") {
      hideContext();
      document.querySelectorAll(".n8t-overlay:not([hidden])").forEach(function (overlay) { closeOverlay(overlay.id); });
      if (state.ruler) toggleRuler();
      setOpen(false);
    } else if (event.altKey && event.key.toLowerCase() === "n") {
      event.preventDefault();
      setOpen(document.getElementById("n8t-shell").dataset.open !== "true");
    } else if (event.altKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      setOpen(true);
      setTab("bot");
      document.getElementById("n8t-bot-input").focus();
    } else if (event.altKey && event.key.toLowerCase() === "c" && !typing) {
      event.preventDefault();
      openClipboard();
    } else if (event.altKey && event.key.toLowerCase() === "p" && !typing) {
      event.preventDefault();
      setPinned(!state.pinned, true);
    }
  }

  function updateProgress() {
    var progress = document.getElementById("n8x-progress");
    if (!progress) return;
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
