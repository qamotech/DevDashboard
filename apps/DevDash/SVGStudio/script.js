const input = document.getElementById('svg-input');
const preview = document.getElementById('svg-preview');

// Live Render
input.addEventListener('input', () => { preview.innerHTML = input.value; });

// Color Customizer
function applyColor(color) {
    const svg = preview.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('*').forEach(el => {
        if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.setAttribute('fill', color);
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', color);
    });
    input.value = svg.outerHTML;
}

// Optimizer
function optimizeSVG() {
    let code = input.value
        .replace(//g, '')
        .replace(/<\?xml.*?\?>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    input.value = code;
    preview.innerHTML = code;
}

// Downloader
function downloadSVG() {
    const pName = document.getElementById('project-name').value || 'untitled_svg';
    const blob = new Blob([input.value], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pName.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}