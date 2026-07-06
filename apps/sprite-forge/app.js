const GENERATE_ENDPOINT = "/api/generate";

const menuOptions = [
  { id: "resolution", label: "Resolution Control" },
  { id: "palette", label: "Color Swap" },
  { id: "frames", label: "Frame Slicer" },
  { id: "transparent", label: "BG Removal" },
  { id: "json", label: "JSON Export" },
  { id: "batch", label: "Batch Proc" },
  { id: "seed", label: "Seed Rnd" },
  { id: "style", label: "Style Presets" },
  { id: "layers", label: "Layer Mgmt" },
  { id: "brightness", label: "Brightness" },
  { id: "contrast", label: "Contrast" },
  { id: "hue", label: "Hue Shift" },
  { id: "dither", label: "Dither" },
  { id: "scale", label: "Pixel Scale" },
  { id: "mirror", label: "Mirror" },
  { id: "rotate", label: "Rotate" },
  { id: "trim", label: "Trim" },
  { id: "shadow", label: "Shadow" },
  { id: "glow", label: "Glow" },
  { id: "download", label: "Download All" }
];

const state = {
  prompt: "",
  seed: randomSeed(),
  resolution: 32,
  palette: "neon",
  frames: 4,
  transparent: true,
  style: "hero",
  brightness: 100,
  contrast: 100,
  hue: 0,
  dither: false,
  scale: 4,
  mirror: false,
  rotate: 0,
  trim: true,
  shadow: true,
  glow: true,
  batch: []
};

const palettes = {
  neon: ["#57e8d4", "#ff4d94", "#f9f871", "#6c63ff"],
  ember: ["#ff784f", "#ffd166", "#7d2a2a", "#fff1c7"],
  forest: ["#7ee081", "#2f9c5c", "#1f3f35", "#d7ffd9"],
  royal: ["#9d7dff", "#4c2f91", "#f7d774", "#fff7d6"]
};

const menuList = document.getElementById("menuList");
const form = document.getElementById("promptForm");
const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const img = document.getElementById("spriteDisplay");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const suggestions = document.getElementById("suggestions");

let lastSvg = "";
let lastJson = "";

buildMenu();
bindInputs();
renderLocalSprite("armored knight, 32x32, side view", false);

function buildMenu() {
  if (!menuList) return;
  menuList.innerHTML = "";
  menuOptions.forEach(option => {
    const li = document.createElement("li");
    li.innerText = option.label;
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.dataset.tool = option.id;
    const activate = () => runTool(option.id);
    li.addEventListener("click", activate);
    li.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    menuList.appendChild(li);
  });
}

function bindInputs() {
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      generateSprite(promptInput?.value || "");
    });
  } else if (generateBtn) {
    generateBtn.addEventListener("click", () => generateSprite(promptInput?.value || ""));
  }

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (!promptInput) return;
      promptInput.value = chip.dataset.prompt || chip.innerText;
      promptInput.focus();
      renderLocalSprite(promptInput.value, false);
    });
  });
}

async function generateSprite(prompt) {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    showError("Type a description first. The forge needs something to work with.");
    return;
  }

  state.prompt = cleanPrompt;
  setLoading(true);
  hideError();

  try {
    const response = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: cleanPrompt, output_format: "png", seed: state.seed })
    });

    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const blob = await response.blob();
    setImage(URL.createObjectURL(blob), cleanPrompt);
    setOutput("Backend image generated. Download All will include the current settings JSON.");
  } catch (error) {
    renderLocalSprite(cleanPrompt, true);
    setOutput(`Local preview built because the backend is not available yet: ${error.message}.`);
  } finally {
    setLoading(false);
  }
}

function runTool(tool) {
  const prompt = promptInput?.value?.trim() || state.prompt || "armored knight, 32x32, side view";
  state.prompt = prompt;

  if (tool === "resolution") state.resolution = nextValue(state.resolution, [16, 24, 32, 48, 64]);
  if (tool === "palette") state.palette = nextValue(state.palette, Object.keys(palettes));
  if (tool === "frames") state.frames = nextValue(state.frames, [1, 2, 4, 6, 8]);
  if (tool === "transparent") state.transparent = !state.transparent;
  if (tool === "batch") state.batch = [...new Set([...state.batch, prompt, `${prompt} idle`, `${prompt} attack`, `${prompt} hurt`])];
  if (tool === "seed") state.seed = randomSeed();
  if (tool === "style") state.style = nextValue(state.style, ["hero", "enemy", "item", "npc"]);
  if (tool === "brightness") state.brightness = nextValue(state.brightness, [80, 100, 120, 140]);
  if (tool === "contrast") state.contrast = nextValue(state.contrast, [85, 100, 125, 150]);
  if (tool === "hue") state.hue = (state.hue + 45) % 360;
  if (tool === "dither") state.dither = !state.dither;
  if (tool === "scale") state.scale = nextValue(state.scale, [2, 3, 4, 6, 8]);
  if (tool === "mirror") state.mirror = !state.mirror;
  if (tool === "rotate") state.rotate = (state.rotate + 90) % 360;
  if (tool === "trim") state.trim = !state.trim;
  if (tool === "shadow") state.shadow = !state.shadow;
  if (tool === "glow") state.glow = !state.glow;
  if (tool === "json") return downloadText("sprite-forge-settings.json", makeJson(prompt), "application/json");
  if (tool === "download") return downloadAll(prompt);

  renderLocalSprite(prompt, false);
  setOutput(`${labelFor(tool)} applied. ${makeStatusLine()}`);
}

function renderLocalSprite(prompt, warn) {
  state.prompt = prompt;
  const colors = palettes[state.palette];
  const size = state.resolution;
  const cells = 8;
  const seed = hash(`${prompt}-${state.seed}-${state.palette}-${state.style}`);
  const parts = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${size * state.frames}" height="${size}" viewBox="0 0 ${size * state.frames} ${size}" shape-rendering="crispEdges">`);
  if (!state.transparent) parts.push(`<rect width="100%" height="100%" fill="#101119"/>`);

  for (let frame = 0; frame < state.frames; frame++) {
    const ox = frame * size;
    if (state.shadow) parts.push(`<rect x="${ox + size * .25}" y="${size * .78}" width="${size * .5}" height="${Math.max(1, size * .08)}" fill="#000" opacity=".28"/>`);
    for (let y = 1; y < cells - 1; y++) {
      for (let x = 1; x < cells - 1; x++) {
        const mirroredX = state.mirror ? cells - 1 - x : x;
        const n = hash(`${seed}-${frame}-${x}-${y}`);
        const bodyMask = Math.abs(x - 3.5) + Math.abs(y - 3.8) < 4.2;
        if (!bodyMask && n % 5 !== 0) continue;
        const color = colors[(n + frame + y) % colors.length];
        const px = ox + mirroredX * (size / cells);
        const py = y * (size / cells);
        parts.push(`<rect x="${px}" y="${py}" width="${size / cells}" height="${size / cells}" fill="${color}" opacity="${bodyMask ? 1 : .72}"/>`);
      }
    }
    parts.push(`<rect x="${ox + size * .34}" y="${size * .28}" width="${size * .1}" height="${size * .1}" fill="#101119"/>`);
    parts.push(`<rect x="${ox + size * .58}" y="${size * .28}" width="${size * .1}" height="${size * .1}" fill="#101119"/>`);
    if (state.glow) parts.push(`<rect x="${ox + 1}" y="1" width="${size - 2}" height="${size - 2}" fill="none" stroke="${colors[0]}" opacity=".45"/>`);
  }

  parts.push(`</svg>`);
  lastSvg = parts.join("");
  lastJson = makeJson(prompt);

  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(lastSvg)}`;
  setImage(encoded, prompt);
  if (warn) showError("Backend unavailable. Showing local generated preview instead.");
  else hideError();
}

function setImage(src, alt) {
  if (!img) return;
  img.src = src;
  img.alt = alt;
  img.classList.add("visible");
  emptyState?.classList.add("hidden");
}

function setLoading(isLoading) {
  if (generateBtn) {
    generateBtn.disabled = isLoading;
    generateBtn.innerText = isLoading ? "Forging..." : "Forge Sprite";
  }
  loadingState?.classList.toggle("hidden", !isLoading);
  if (isLoading) emptyState?.classList.add("hidden");
}

function showError(message) {
  if (!errorState) {
    setOutput(message);
    return;
  }
  errorState.innerText = message;
  errorState.classList.remove("hidden");
}

function hideError() {
  errorState?.classList.add("hidden");
}

function setOutput(message) {
  let output = document.getElementById("toolOutput");
  if (!output && suggestions) {
    output = document.createElement("p");
    output.id = "toolOutput";
    output.className = "tool-output";
    suggestions.after(output);
  }
  if (output) output.textContent = message;
}

function downloadAll(prompt) {
  if (!lastSvg) renderLocalSprite(prompt, false);
  downloadText("sprite-forge-sheet.svg", lastSvg, "image/svg+xml");
  setTimeout(() => downloadText("sprite-forge-settings.json", lastJson || makeJson(prompt), "application/json"), 100);
  setOutput("Output ready: sprite sheet SVG and settings JSON downloads started.");
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function makeJson(prompt) {
  return JSON.stringify({
    prompt,
    seed: state.seed,
    resolution: state.resolution,
    frames: state.frames,
    palette: state.palette,
    style: state.style,
    transparent: state.transparent,
    scale: state.scale,
    effects: {
      brightness: state.brightness,
      contrast: state.contrast,
      hue: state.hue,
      dither: state.dither,
      mirror: state.mirror,
      rotate: state.rotate,
      trim: state.trim,
      shadow: state.shadow,
      glow: state.glow
    },
    batch: state.batch
  }, null, 2);
}

function makeStatusLine() {
  return `${state.resolution}px, ${state.frames} frame(s), ${state.palette}, seed ${state.seed}.`;
}

function labelFor(tool) {
  return menuOptions.find(option => option.id === tool)?.label || tool;
}

function nextValue(current, values) {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length];
}

function randomSeed() {
  return Math.floor(100000 + Math.random() * 900000);
}

function hash(input) {
  let value = 2166136261;
  for (let i = 0; i < String(input).length; i++) {
    value ^= String(input).charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}
