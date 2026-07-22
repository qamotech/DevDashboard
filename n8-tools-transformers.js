(function () {
  "use strict";

  var STORAGE = {
    mode: "n8t-mode",
    pinned: "n8t-pinned",
    position: "n8t-position",
    clipboard: "n8t-clipboard",
    notes: "n8t-notes"
  };
  var MODES = ["calm", "dark", "light", "cyber", "transformers"];
  var state = {
    pages: [],
    mode: "transformers",
    pinned: true,
    contextTimer: 0,
    toastTimer: 0,
    ruler: false,
    lastFocus: null
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
      '      <button class="n8t-tab" id="n8t-tab-features" role="tab" aria-selected="true" aria-controls="n8t-view-features" data-tab="features">Features</button>',
      '      <button class="n8t-tab" id="n8t-tab-fleet" role="tab" aria-selected="false" aria-controls="n8t-view-fleet" data-tab="fleet">Fleet</button>',
      '      <button class="n8t-tab" id="n8t-tab-modes" role="tab" aria-selected="false" aria-controls="n8t-view-modes" data-tab="modes">Modes</button>',
      '    </div>',
      '    <div class="n8t-stage">',
      '      <section class="n8t-view" id="n8t-view-features" role="tabpanel" aria-labelledby="n8t-tab-features">',
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
      '    <footer class="n8t-foot"><span>Right-click keeps the browser menu + N8 actions</span><code>ALT+N</code></footer>',
      '  </div>',
      '  <div class="n8t-dock">',
      '    <button class="n8t-btn n8t-brand" id="n8t-toggle" aria-expanded="false" aria-controls="n8t-panel"><span class="n8t-mark">N8</span><span class="n8t-brand-copy"><strong>N8 TOOLS</strong><small>Transform system</small></span></button>',
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
    var storedMode = safeGet(STORAGE.mode, "transformers");
    setMode(MODES.indexOf(storedMode) > -1 ? storedMode : "transformers", false);
    state.pinned = safeGet(STORAGE.pinned, "true") !== "false";
    setPinned(state.pinned, false);
    restorePosition();
    updateProgress();
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
