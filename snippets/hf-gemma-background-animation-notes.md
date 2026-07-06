# Hugging Face Gemma Background Animation

Source: https://huggingface.co/spaces/webml-community/gemma-4-webgpu-kernels

Files:

- `hf-gemma-background-animation.js` is the copied Three.js background animation module from the Space's `landing.js`.
- `hf-gemma-background-animation-usage.html` is a small wrapper showing the required `#crt-frame` container, Three.js import map, fade styling, and script include.

To reuse it, keep the JavaScript file next to your HTML file or update the script path:

```html
<script type="module" src="./hf-gemma-background-animation.js"></script>
```

The animation expects this element to exist:

```html
<div id="crt-frame" aria-hidden="true"></div>
```
