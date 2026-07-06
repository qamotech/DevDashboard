/*
 * IMPORTANT — SECURITY
 * ---------------------
 * This app never calls the Stability AI API directly from the browser.
 * Any API key placed in client-side JS is visible to every visitor
 * (view-source / devtools / network tab) and will get stolen and abused.
 *
 * Instead, this file calls YOUR OWN backend at the endpoint below.
 * That backend is a small server you control (e.g. a single serverless
 * function on Vercel/Netlify/Cloudflare Workers, or a tiny Express route)
 * which:
 *   1. Reads the Stability AI key from a server-side environment variable
 *      (never from a file that ships to the browser).
 *   2. Forwards the prompt to https://api.stability.ai/v2beta/stable-image/generate/sd3
 *   3. Streams/returns the resulting image bytes back to this page.
 *
 * Minimal example (Node/Express):
 *
 *   app.post('/api/generate', async (req, res) => {
 *     const r = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
 *       method: 'POST',
 *       headers: {
 *         Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
 *         Accept: 'image/*'
 *       },
 *       body: (() => {
 *         const form = new FormData();
 *         form.append('prompt', req.body.prompt);
 *         form.append('output_format', 'png');
 *         return form;
 *       })()
 *     });
 *     res.set('Content-Type', 'image/png');
 *     r.body.pipe(res);
 *   });
 *
 * Until that backend exists, GENERATE_ENDPOINT below will 404 — that's
 * expected. Point it at your real backend URL when it's ready.
 */
const GENERATE_ENDPOINT = "/api/generate";

const menuOptions = ["Resolution Control", "Color Swap", "Frame Slicer", "BG Removal", "JSON Export", "Batch Proc", "Seed Rnd", "Style Presets", "Layer Mgmt", "Brightness", "Contrast", "Hue Shift", "Dither", "Pixel Scale", "Mirror", "Rotate", "Trim", "Shadow", "Glow", "Download All"];

// ---- Build sidebar tool list ----
const menuList = document.getElementById('menuList');
menuOptions.forEach(opt => {
    const li = document.createElement('li');
    li.innerText = opt;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    const activate = () => alert(opt + " is coming soon.");
    li.addEventListener('click', activate);
    li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
        }
    });
    menuList.appendChild(li);
});

// ---- Elements ----
const form = document.getElementById('promptForm');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const img = document.getElementById('spriteDisplay');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');

function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.innerText = isLoading ? "Forging…" : "Forge Sprite";
    loadingState.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
    }
}

function showError(message) {
    errorState.innerText = message;
    errorState.classList.remove('hidden');
    emptyState.classList.toggle('hidden', img.classList.contains('visible'));
}

async function generateSprite(prompt) {
    if (!prompt.trim()) {
        showError("Type a description first — the forge needs something to work with.");
        return;
    }

    setLoading(true);
    errorState.classList.add('hidden');

    try {
        const response = await fetch(GENERATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, output_format: 'png' })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const blob = await response.blob();
        img.src = URL.createObjectURL(blob);
        img.alt = prompt;
        img.classList.add('visible');
        emptyState.classList.add('hidden');
    } catch (e) {
        showError("Forge failed: " + e.message + ". Check that your backend is running.");
    } finally {
        setLoading(false);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateSprite(promptInput.value);
});

// ---- Suggestion chips ----
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        promptInput.value = chip.dataset.prompt;
        promptInput.focus();
    });
});
