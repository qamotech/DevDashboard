/**
 * Contractor Tool Belt - Blueprint Sketchpad (Mini-CAD)
 * Implements drawing walls, doors, windows, and measuring distances on a scaled grid canvas.
 */

class BlueprintSketchpad {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);

        // Core State
        this.scalePxPerFoot = 20; // 20px = 1 foot (approx 1/4" = 1' on typical displays)
        this.activeTool = 'wall'; // 'wall', 'door', 'window', 'measure', 'eraser'
        this.snapToGrid = true;
        this.gridSize = 20; // grid interval in pixels (1 foot)
        this.walls = []; // { x1, y1, x2, y2 } in feet coordinates
        this.doors = []; // { x, y, angle, size }
        this.windows = []; // { x, y, angle, size }
        this.measurements = []; // temporary drawing or permanent dimension lines

        // Drawing states
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        // UI Event Callbacks
        this.onUpdateCallback = null;

        // Init
        this.initEvents();
        this.resize();
        
        // Listen to window resize
        window.addEventListener('resize', () => this.resize());
    }

    // Set callback for whenever the layout changes (to sync with calculators)
    onUpdate(callback) {
        this.onUpdateCallback = callback;
    }

    triggerUpdate() {
        if (this.onUpdateCallback) {
            this.onUpdateCallback({
                totalWallLength: this.getTotalWallLength(),
                approxArea: this.getApproxArea()
            });
        }
    }

    resize() {
        if (!this.canvas || !this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(rect.height, 400); // at least 400px tall
        this.draw();
    }

    // Convert pixel to feet based on current zoom/scale
    pxToFeet(px) {
        return px / this.scalePxPerFoot;
    }

    // Convert feet to pixel
    feetToPx(ft) {
        return ft * this.scalePxPerFoot;
    }

    // Snap pixel value to nearest grid
    snap(val) {
        if (!this.snapToGrid) return val;
        return Math.round(val / this.gridSize) * this.gridSize;
    }

    // Get mouse coords relative to canvas
    getMouseCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rawX = clientX - rect.left;
        const rawY = clientY - rect.top;
        
        return {
            x: this.snapToGrid ? this.snap(rawX) : rawX,
            y: this.snapToGrid ? this.snap(rawY) : rawY,
            rawX,
            rawY
        };
    }

    initEvents() {
        const startHandler = (e) => {
            // e.preventDefault();
            const coords = this.getMouseCoords(e);
            this.isDrawing = true;
            this.startX = coords.x;
            this.startY = coords.y;
            this.currentX = coords.x;
            this.currentY = coords.y;

            if (this.activeTool === 'eraser') {
                this.eraseAt(coords.rawX, coords.rawY);
            }
        };

        const moveHandler = (e) => {
            if (!this.isDrawing) return;
            // e.preventDefault();
            const coords = this.getMouseCoords(e);
            
            // Constrain to orthogonal lines (vertical/horizontal) if shift key is pressed
            if (e.shiftKey && (this.activeTool === 'wall' || this.activeTool === 'measure')) {
                const dx = Math.abs(coords.x - this.startX);
                const dy = Math.abs(coords.y - this.startY);
                if (dx > dy) {
                    this.currentX = coords.x;
                    this.currentY = this.startY;
                } else {
                    this.currentX = this.startX;
                    this.currentY = coords.y;
                }
            } else {
                this.currentX = coords.x;
                this.currentY = coords.y;
            }

            if (this.activeTool === 'eraser') {
                this.eraseAt(coords.rawX, coords.rawY);
            }

            this.draw();
            this.drawTemporary();
        };

        const endHandler = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            const x1 = this.pxToFeet(this.startX);
            const y1 = this.pxToFeet(this.startY);
            const x2 = this.pxToFeet(this.currentX);
            const y2 = this.pxToFeet(this.currentY);

            // Avoid zero-length elements
            const dist = Math.hypot(this.currentX - this.startX, this.currentY - this.startY);
            if (dist > 5) {
                if (this.activeTool === 'wall') {
                    this.walls.push({ x1, y1, x2, y2 });
                    this.triggerSound('draw_wall');
                } else if (this.activeTool === 'measure') {
                    this.measurements.push({ x1, y1, x2, y2 });
                    this.triggerSound('measure');
                } else if (this.activeTool === 'door') {
                    const angle = Math.atan2(this.currentY - this.startY, this.currentX - this.startX);
                    this.doors.push({ x: x1, y: y1, angle, size: this.pxToFeet(dist) });
                    this.triggerSound('place');
                } else if (this.activeTool === 'window') {
                    const angle = Math.atan2(this.currentY - this.startY, this.currentX - this.startX);
                    this.windows.push({ x: x1, y: y1, angle, size: this.pxToFeet(dist) });
                    this.triggerSound('place');
                }
            }

            this.draw();
            this.triggerUpdate();
        };

        // Mouse Events
        this.canvas.addEventListener('mousedown', startHandler);
        this.canvas.addEventListener('mousemove', moveHandler);
        this.canvas.addEventListener('mouseup', endHandler);
        this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; this.draw(); });

        // Touch Events
        this.canvas.addEventListener('touchstart', startHandler);
        this.canvas.addEventListener('touchmove', moveHandler);
        this.canvas.addEventListener('touchend', endHandler);
    }

    eraseAt(rawX, rawY) {
        const ftX = this.pxToFeet(rawX);
        const ftY = this.pxToFeet(rawY);
        const tolerance = this.pxToFeet(12); // 12px tap tolerance

        // Erase walls
        const originalWallCount = this.walls.length;
        this.walls = this.walls.filter(w => {
            // Distance from point to line segment
            const A = ftX - w.x1;
            const B = ftY - w.y1;
            const C = w.x2 - w.x1;
            const D = w.y2 - w.y1;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;
            if (param < 0) {
                xx = w.x1;
                yy = w.y1;
            } else if (param > 1) {
                xx = w.x2;
                yy = w.y2;
            } else {
                xx = w.x1 + param * C;
                yy = w.y1 + param * D;
            }

            const dist = Math.hypot(ftX - xx, ftY - yy);
            return dist > tolerance;
        });

        // Erase doors/windows/measurements
        this.doors = this.doors.filter(d => Math.hypot(ftX - d.x, ftY - d.y) > tolerance);
        this.windows = this.windows.filter(w => Math.hypot(ftX - w.x, ftY - w.y) > tolerance);
        this.measurements = this.measurements.filter(m => {
            const A = ftX - m.x1;
            const B = ftY - m.y1;
            const C = m.x2 - m.x1;
            const D = m.y2 - m.y1;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            const param = lenSq === 0 ? -1 : dot / lenSq;
            let xx = param < 0 ? m.x1 : (param > 1 ? m.x2 : m.x1 + param * C);
            let yy = param < 0 ? m.y1 : (param > 1 ? m.y2 : m.y1 + param * D);
            return Math.hypot(ftX - xx, ftY - yy) > tolerance;
        });

        if (this.walls.length !== originalWallCount) {
            this.triggerSound('erase');
        }
    }

    clear() {
        this.walls = [];
        this.doors = [];
        this.windows = [];
        this.measurements = [];
        this.draw();
        this.triggerUpdate();
        this.triggerSound('clear');
    }

    triggerSound(action) {
        if (window.App && window.App.playSound) {
            window.App.playSound(action);
        }
    }

    getTotalWallLength() {
        let total = 0;
        this.walls.forEach(w => {
            total += Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
        });
        return Math.round(total);
    }

    // Estimate enclosed square footage
    getApproxArea() {
        if (this.walls.length < 3) return 0;
        
        // Simple room approximation
        // If walls form closed loop, or bounding rectangle of walls
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.walls.forEach(w => {
            minX = Math.min(minX, w.x1, w.x2);
            maxX = Math.max(maxX, w.x1, w.x2);
            minY = Math.min(minY, w.y1, w.y2);
            maxY = Math.max(maxY, w.y1, w.y2);
        });

        if (minX === Infinity) return 0;
        const w = maxX - minX;
        const h = maxY - minY;

        // If it's a layout, enclosed room area is roughly 60% of bounding box as heuristic,
        // or if it resembles a rectangle, the rectangle itself.
        // Let's return bounding box area first, capped logically.
        return Math.round(w * h);
    }

    // Set scale mode
    setScale(pxPerFoot) {
        this.scalePxPerFoot = pxPerFoot;
        this.gridSize = pxPerFoot;
        this.draw();
    }

    drawGrid() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < w; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < h; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
    }

    draw() {
        // Clear canvas with structural blueprint grid theme
        this.ctx.fillStyle = '#111625'; // deep blueprint blue/gray
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw Walls
        this.walls.forEach(w => {
            this.drawWallElement(w.x1, w.y1, w.x2, w.y2);
        });

        // Draw Doors
        this.doors.forEach(d => {
            this.drawDoorElement(d.x, d.y, d.angle, d.size);
        });

        // Draw Windows
        this.windows.forEach(w => {
            this.drawWindowElement(w.x, w.y, w.angle, w.size);
        });

        // Draw Measurements
        this.measurements.forEach(m => {
            this.drawMeasurementElement(m.x1, m.y1, m.x2, m.y2, false);
        });
    }

    drawTemporary() {
        if (!this.isDrawing) return;

        const x1 = this.pxToFeet(this.startX);
        const y1 = this.pxToFeet(this.startY);
        const x2 = this.pxToFeet(this.currentX);
        const y2 = this.pxToFeet(this.currentY);

        if (this.activeTool === 'wall') {
            this.drawWallElement(x1, y1, x2, y2, true);
        } else if (this.activeTool === 'measure') {
            this.drawMeasurementElement(x1, y1, x2, y2, true);
        } else if (this.activeTool === 'door') {
            const angle = Math.atan2(this.currentY - this.startY, this.currentX - this.startX);
            const size = this.pxToFeet(Math.hypot(this.currentX - this.startX, this.currentY - this.startY));
            this.drawDoorElement(x1, y1, angle, size, true);
        } else if (this.activeTool === 'window') {
            const angle = Math.atan2(this.currentY - this.startY, this.currentX - this.startX);
            const size = this.pxToFeet(Math.hypot(this.currentX - this.startX, this.currentY - this.startY));
            this.drawWindowElement(x1, y1, angle, size, true);
        }
    }

    drawWallElement(x1, y1, x2, y2, isTemp = false) {
        const px1 = this.feetToPx(x1);
        const py1 = this.feetToPx(y1);
        const px2 = this.feetToPx(x2);
        const py2 = this.feetToPx(y2);

        this.ctx.beginPath();
        this.ctx.moveTo(px1, py1);
        this.ctx.lineTo(px2, py2);
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'square';
        this.ctx.strokeStyle = isTemp ? 'rgba(255, 193, 7, 0.6)' : '#cfd8dc'; // warning yellow if temp, off-white if permanent
        this.ctx.stroke();

        // Inner structural hatch core
        this.ctx.beginPath();
        this.ctx.moveTo(px1, py1);
        this.ctx.lineTo(px2, py2);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = isTemp ? 'rgba(255, 193, 7, 0.8)' : '#263238';
        this.ctx.stroke();

        // Print dimension text
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len > 1.5) {
            const mx = (px1 + px2) / 2;
            const my = (py1 + py2) / 2;
            this.ctx.fillStyle = 'rgba(17, 22, 37, 0.85)';
            this.ctx.font = '9px monospace';
            const textWidth = this.ctx.measureText(`${len.toFixed(1)}'`).width;
            this.ctx.fillRect(mx - textWidth/2 - 3, my - 6, textWidth + 6, 12);
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${len.toFixed(1)}'`, mx, my);
        }
    }

    drawDoorElement(x, y, angle, size, isTemp = false) {
        const px = this.feetToPx(x);
        const py = this.feetToPx(y);
        const pSize = this.feetToPx(size);

        this.ctx.save();
        this.ctx.translate(px, py);
        this.ctx.rotate(angle);

        this.ctx.strokeStyle = isTemp ? 'rgba(255, 193, 7, 0.6)' : 'var(--accent-orange)';
        this.ctx.lineWidth = 2;

        // Door frame hinge point
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'var(--accent-orange)';
        this.ctx.fill();

        // Swing path (arc)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pSize, 0, Math.PI / 2);
        this.ctx.setLineDash([2, 2]);
        this.ctx.stroke();

        // Door panel
        this.ctx.restore();
        this.ctx.save();
        this.ctx.translate(px, py);
        // Door opens 90 deg relative to frame angle
        this.ctx.rotate(angle + Math.PI / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(pSize, 0);
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawWindowElement(x, y, angle, size, isTemp = false) {
        const px = this.feetToPx(x);
        const py = this.feetToPx(y);
        const pSize = this.feetToPx(size);

        this.ctx.save();
        this.ctx.translate(px, py);
        this.ctx.rotate(angle);

        this.ctx.strokeStyle = isTemp ? 'rgba(255, 193, 7, 0.6)' : 'var(--accent-cyan)';
        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.1)';
        this.ctx.lineWidth = 2;

        // Window outline box (double line standard)
        this.ctx.beginPath();
        this.ctx.rect(0, -4, pSize, 8);
        this.ctx.fill();
        this.ctx.stroke();

        // Inner middle sash line
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(pSize, 0);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawMeasurementElement(x1, y1, x2, y2, isTemp = false) {
        const px1 = this.feetToPx(x1);
        const py1 = this.feetToPx(y1);
        const px2 = this.feetToPx(x2);
        const py2 = this.feetToPx(y2);
        const len = Math.hypot(x2 - x1, y2 - y1);

        this.ctx.strokeStyle = 'var(--accent-cyan)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 4]);

        // Main line
        this.ctx.beginPath();
        this.ctx.moveTo(px1, py1);
        this.ctx.lineTo(px2, py2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Ticks/cross marks at ends
        const angle = Math.atan2(py2 - py1, px2 - px1);
        const tickLen = 6;

        this.ctx.beginPath();
        this.ctx.moveTo(px1 - Math.sin(angle) * tickLen, py1 + Math.cos(angle) * tickLen);
        this.ctx.lineTo(px1 + Math.sin(angle) * tickLen, py1 - Math.cos(angle) * tickLen);
        this.ctx.moveTo(px2 - Math.sin(angle) * tickLen, py2 + Math.cos(angle) * tickLen);
        this.ctx.lineTo(px2 + Math.sin(angle) * tickLen, py2 - Math.cos(angle) * tickLen);
        this.ctx.stroke();

        // Dimension text
        const mx = (px1 + px2) / 2;
        const my = (py1 + py2) / 2;
        this.ctx.fillStyle = '#111625';
        this.ctx.font = '10px monospace';
        const text = `${len.toFixed(2)}'`;
        const textWidth = this.ctx.measureText(text).width;
        
        this.ctx.fillRect(mx - textWidth/2 - 4, my - 6, textWidth + 8, 12);
        this.ctx.fillStyle = 'var(--accent-cyan)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, mx, my);
    }
}

window.BlueprintSketchpad = BlueprintSketchpad;
