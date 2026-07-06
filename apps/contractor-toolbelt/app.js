/**
 * Contractor Tool Belt - Central Controller & Synthesized Sound Design
 * Orchestrates navigation, local project storage, checklists, and Web Audio API sounds.
 */

class ContractorApp {
    constructor() {
        this.audioCtx = null;
        this.muted = false;
        this.activeTool = 'blueprint'; // 'blueprint', 'estimator', 'pitch', 'level', 'checklist'
        
        // Checklist / Budget State
        this.projectBudget = [];
        this.blueprintDetails = { totalWallLength: 0, approxArea: 0 };
    }

    init() {
        this.loadProjectFromStorage();
        this.setupNavigation();
        this.setupEventListeners();
        this.setupCalculators();
        this.setupBlueprintBridge();
        this.renderChecklist();
        this.updateTotalBudgetUI();
    }

    // Lazy load and unlock AudioContext
    getAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    setMute(state) {
        this.muted = state;
        const muteIcon = document.getElementById('mute-toggle-icon');
        if (muteIcon) {
            muteIcon.textContent = this.muted ? '🔇' : '🔊';
        }
        localStorage.setItem('contractor_toolbelt_muted', this.muted);
    }

    // Synthesizes cool mechanical, audio, and sensor beeps completely on-the-fly
    playSound(action) {
        if (this.muted) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        try {
            switch (action) {
                case 'draw_wall': {
                    // Chalk sketching sound (short filtered noise burst)
                    const bufferSize = ctx.sampleRate * 0.15;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(1000, now);
                    filter.Q.setValueAtTime(3, now);

                    const gain = ctx.createGain();
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    noise.start(now);
                    break;
                }
                case 'measure': {
                    // Tape measure zip (swept pitch oscillator)
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(450, now);
                    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

                    // Add a tiny bit of high frequency buzz for the tape recoil mechanism
                    const modulator = ctx.createOscillator();
                    const modGain = ctx.createGain();
                    modulator.frequency.value = 80;
                    modGain.gain.value = 50;

                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                    modulator.connect(modGain);
                    modGain.connect(osc.frequency);
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    modulator.start(now);
                    osc.start(now);
                    modulator.stop(now + 0.35);
                    osc.stop(now + 0.35);
                    break;
                }
                case 'place': {
                    // Heavy staple gun or hammer tap (noise burst + sub thump)
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(90, now);
                    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.15);

                    // High frequency tap click
                    const clickOsc = ctx.createOscillator();
                    const clickGain = ctx.createGain();
                    clickOsc.type = 'triangle';
                    clickOsc.frequency.setValueAtTime(2500, now);
                    clickGain.gain.setValueAtTime(0.08, now);
                    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

                    clickOsc.connect(clickGain);
                    clickGain.connect(ctx.destination);
                    clickOsc.start(now);
                    clickOsc.stop(now + 0.03);
                    break;
                }
                case 'erase': {
                    // Friction sweep
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.linearRampToTimeValue ? osc.frequency.linearRampToValueAtTime(350, now + 0.2) : osc.frequency.setValueAtTime(350, now + 0.2);

                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                }
                case 'clear': {
                    // Rewind sweep down
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.4);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;
                }
                case 'level_hit': {
                    // Pristine crystal bubble level align chime (880Hz, major 5th interval)
                    const playChime = (freq, delay, dur) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + delay);
                        gain.gain.setValueAtTime(0, now + delay);
                        gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.03);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + delay);
                        osc.stop(now + delay + dur);
                    };
                    
                    playChime(880, 0, 0.4);   // A5
                    playChime(1320, 0.08, 0.5); // E6
                    break;
                }
                case 'switch': {
                    // Heavy physical switch relay
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(120, now);
                    
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(500, now);
                    filter.Q.setValueAtTime(4, now);

                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.06);
                    break;
                }
                case 'calibrate': {
                    // Electronic confirmation double-beep
                    const beep = (freq, startTime, duration) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, startTime);
                        gain.gain.setValueAtTime(0.1, startTime);
                        gain.gain.setValueAtTime(0.1, startTime + duration - 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(startTime);
                        osc.stop(startTime + duration);
                    };

                    beep(1000, now, 0.08);
                    beep(1400, now + 0.1, 0.1);
                    break;
                }
                case 'nudge': {
                    // Small metallic ring
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(1800, now);

                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.15);
                    break;
                }
                case 'hover': {
                    // Soft ticking relay
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(3000, now);
                    gain.gain.setValueAtTime(0.015, now);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.01);
                    break;
                }
            }
        } catch (e) {
            console.error('Audio synthesis failed:', e);
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.toolbelt-pouch');
        const viewpanels = document.querySelectorAll('.toolbelt-panel');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTool = btn.dataset.tool;
                if (!targetTool) return;

                this.playSound('switch');

                // Toggle navigation buttons active state
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show target view panel
                viewpanels.forEach(p => {
                    if (p.id === `panel-${targetTool}`) {
                        p.classList.add('active');
                    } else {
                        p.classList.remove('active');
                    }
                });

                this.activeTool = targetTool;

                // Specific triggers on opening tabs
                if (targetTool === 'blueprint' && window.Sketchpad) {
                    window.Sketchpad.resize();
                }
            });
        });

        // Add soft mechanical hover clicks to interactive buttons
        document.querySelectorAll('button, select, input[type="range"], .toolbelt-pouch').forEach(el => {
            el.addEventListener('mouseenter', () => this.playSound('hover'));
        });
    }

    setupEventListeners() {
        // Mute state load
        const muted = localStorage.getItem('contractor_toolbelt_muted') === 'true';
        this.setMute(muted);

        const muteBtn = document.getElementById('mute-toggle-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.setMute(!this.muted);
                this.playSound('switch');
            });
        }

        // Export Blueprint calculations to material calculators
        const exportBtn = document.getElementById('bp-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (this.blueprintDetails.totalWallLength > 0) {
                    // Auto-fill Wall Length in Drywall and Framing Calculators
                    const drywallWallLengthInput = document.getElementById('drywall-wallLength');
                    const framingWallLengthInput = document.getElementById('framing-wallLength');
                    
                    if (drywallWallLengthInput) {
                        drywallWallLengthInput.value = this.blueprintDetails.totalWallLength;
                        drywallWallLengthInput.dispatchEvent(new Event('input'));
                    }
                    if (framingWallLengthInput) {
                        framingWallLengthInput.value = this.blueprintDetails.totalWallLength;
                        framingWallLengthInput.dispatchEvent(new Event('input'));
                    }

                    // Auto-fill Area in Flooring and Paint (wall area = perimeter * height)
                    const flooringAreaInput = document.getElementById('flooring-area');
                    const paintAreaInput = document.getElementById('paint-wallArea');
                    
                    if (flooringAreaInput) {
                        flooringAreaInput.value = this.blueprintDetails.approxArea || 0;
                        flooringAreaInput.dispatchEvent(new Event('input'));
                    }

                    if (paintAreaInput) {
                        // Assuming standard 8-foot ceiling
                        paintAreaInput.value = this.blueprintDetails.totalWallLength * 8;
                        paintAreaInput.dispatchEvent(new Event('input'));
                    }

                    this.playSound('calibrate');
                    
                    // Show short alert
                    const notifier = document.getElementById('bp-export-indicator');
                    if (notifier) {
                        notifier.style.opacity = '1';
                        setTimeout(() => { notifier.style.opacity = '0'; }, 2000);
                    }
                } else {
                    alert('Draw some walls on the blueprint first to export dimensions.');
                }
            });
        }

        // Clear Canvas Button
        const clearBtn = document.getElementById('bp-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear blueprint canvas? This cannot be undone.')) {
                    if (window.Sketchpad) window.Sketchpad.clear();
                }
            });
        }

        // Blueprint tools buttons
        const toolBtns = document.querySelectorAll('.bp-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playSound('switch');
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (window.Sketchpad) {
                    window.Sketchpad.activeTool = btn.dataset.tool;
                }
            });
        });

        // Scale Select in Blueprint
        const bpScaleSelect = document.getElementById('bp-scale-select');
        if (bpScaleSelect) {
            bpScaleSelect.addEventListener('change', () => {
                const scaleVal = parseInt(bpScaleSelect.value) || 20;
                if (window.Sketchpad) {
                    window.Sketchpad.setScale(scaleVal);
                }
                const label = document.getElementById('blueprint-indicator-scale');
                if (label) {
                    if (scaleVal === 20) label.textContent = 'Scale: 1/4" = 1\'';
                    else if (scaleVal === 40) label.textContent = 'Scale: 1/2" = 1\'';
                    else if (scaleVal === 10) label.textContent = 'Scale: 1/8" = 1\'';
                }
            });
        }

        // Snap to Grid Checkbox
        const bpSnapCheckbox = document.getElementById('bp-snap-checkbox');
        if (bpSnapCheckbox) {
            bpSnapCheckbox.addEventListener('change', () => {
                if (window.Sketchpad) {
                    window.Sketchpad.snapToGrid = bpSnapCheckbox.checked;
                    window.Sketchpad.draw();
                }
            });
        }

        // Level Sensor Activation & Calibration
        const levelSensorBtn = document.getElementById('level-sensor-activate-btn');
        if (levelSensorBtn) {
            levelSensorBtn.addEventListener('click', () => {
                window.ContractorSensors.requestSensorPermission((granted) => {
                    if (granted) {
                        levelSensorBtn.textContent = "SENSORS ONLINE";
                        levelSensorBtn.classList.add('btn-disabled');
                        levelSensorBtn.disabled = true;
                    } else {
                        alert("Orientation sensor permission denied. Level will run in Simulator mode.");
                        levelSensorBtn.textContent = "SIMULATOR ACTIVE";
                    }
                    this.playSound('calibrate');
                });
            });
        }

        const levelCalibrateBtn = document.getElementById('level-calibrate-btn');
        if (levelCalibrateBtn) {
            levelCalibrateBtn.addEventListener('click', () => {
                window.ContractorSensors.calibrate();
            });
        }

        const levelResetBtn = document.getElementById('level-reset-btn');
        if (levelResetBtn) {
            levelResetBtn.addEventListener('click', () => {
                window.ContractorSensors.resetCalibration();
                this.playSound('calibrate');
            });
        }

        // Bob controls
        const bobLeftBtn = document.getElementById('bob-nudge-left');
        const bobRightBtn = document.getElementById('bob-nudge-right');
        if (bobLeftBtn && bobRightBtn) {
            bobLeftBtn.addEventListener('click', () => window.ContractorSensors.nudgeBob(-1));
            bobRightBtn.addEventListener('click', () => window.ContractorSensors.nudgeBob(1));
        }

        // Flashlight Button
        const flashlightBtn = document.getElementById('flashlight-toggle-btn');
        if (flashlightBtn) {
            flashlightBtn.addEventListener('click', () => window.ContractorSensors.toggleFlashlight());
        }

        // Simulator sliders for level (useful for Desktop testing)
        const simPitch = document.getElementById('sim-pitch');
        const simRoll = document.getElementById('sim-roll');
        if (simPitch && simRoll) {
            const handleSimChange = () => {
                window.ContractorSensors.simulateTilt('pitch', simPitch.value);
                window.ContractorSensors.simulateTilt('roll', simRoll.value);
            };
            simPitch.addEventListener('input', handleSimChange);
            simRoll.addEventListener('input', handleSimChange);
        }

        // Checklist Custom Item Form Add Button
        const customItemBtn = document.getElementById('custom-item-add-btn');
        if (customItemBtn) {
            customItemBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('custom-name');
                const catSelect = document.getElementById('custom-cat');
                const qtyInput = document.getElementById('custom-qty');
                const unitInput = document.getElementById('custom-unit');

                if (nameInput && nameInput.value.trim()) {
                    const name = nameInput.value.trim();
                    const cat = catSelect.value;
                    const qty = parseFloat(qtyInput.value) || 1;
                    const unit = parseFloat(unitInput.value) || 0;
                    const total = qty * unit;

                    this.addToBudget(name, cat, qty, unit, total);

                    // Reset form
                    nameInput.value = '';
                    qtyInput.value = 1;
                    unitInput.value = '0.00';
                } else {
                    alert('Please enter an item or task name.');
                }
            });
        }
    }

    setupBlueprintBridge() {
        // Instantiate the Blueprint Sketchpad
        window.Sketchpad = new window.BlueprintSketchpad('blueprint-canvas', 'blueprint-canvas-container');
        
        if (window.Sketchpad) {
            window.Sketchpad.onUpdate((data) => {
                this.blueprintDetails = data;
                
                // Update blueprint panel readouts
                const wallLabel = document.getElementById('bp-readout-wall');
                const areaLabel = document.getElementById('bp-readout-area');
                
                if (wallLabel) wallLabel.textContent = `${data.totalWallLength} ft`;
                if (areaLabel) areaLabel.textContent = `${data.approxArea} sq ft`;
            });
        }
    }

    setupCalculators() {
        // Sidebar selection navigation
        const estNavBtns = document.querySelectorAll('.est-nav-btn');
        const estSubPanels = document.querySelectorAll('.estimator-sub-panel');
        
        estNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playSound('switch');
                estNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                estSubPanels.forEach(p => {
                    if (p.id === `est-${btn.dataset.sub}`) {
                        p.classList.add('active');
                    } else {
                        p.classList.remove('active');
                    }
                });
            });
        });

        // 1. Concrete Calculator Live Bindings
        const concreteType = document.getElementById('concrete-type');
        const concreteSlabInputs = document.getElementById('concrete-inputs-slab');
        const concreteFootingInputs = document.getElementById('concrete-inputs-footing');
        const concreteColumnInputs = document.getElementById('concrete-inputs-column');
        
        const runConcrete = () => {
            const type = concreteType.value;
            let params = {
                quantity: document.getElementById('concrete-qty').value,
                unitCost: document.getElementById('concrete-cost').value
            };
            
            if (type === 'slab') {
                params.length = document.getElementById('concrete-slab-length').value;
                params.width = document.getElementById('concrete-slab-width').value;
                params.thickness = document.getElementById('concrete-slab-thickness').value;
            } else if (type === 'footing') {
                params.length = document.getElementById('concrete-footing-length').value;
                params.width = document.getElementById('concrete-footing-width').value;
                params.thickness = document.getElementById('concrete-footing-depth').value; // thickness is depth here
            } else if (type === 'column') {
                params.height = document.getElementById('concrete-column-height').value;
                params.radius = document.getElementById('concrete-column-radius').value;
            }

            const results = window.Calculators.calculateConcrete(type, params);
            
            // Render outputs
            document.getElementById('concrete-res-yards').textContent = results.cubicYards;
            document.getElementById('concrete-res-meters').textContent = results.cubicMeters;
            document.getElementById('concrete-res-bags80').textContent = results.bags80;
            document.getElementById('concrete-res-bags60').textContent = results.bags60;
            document.getElementById('concrete-res-bags40').textContent = results.bags40;
            document.getElementById('concrete-res-cost').textContent = `$${parseFloat(results.totalCost).toFixed(2)}`;
        };

        concreteType.addEventListener('change', () => {
            this.playSound('switch');
            const val = concreteType.value;
            concreteSlabInputs.style.display = val === 'slab' ? 'block' : 'none';
            concreteFootingInputs.style.display = val === 'footing' ? 'block' : 'none';
            concreteColumnInputs.style.display = val === 'column' ? 'block' : 'none';
            runConcrete();
        });

        document.querySelectorAll('#est-concrete input').forEach(el => {
            el.addEventListener('input', runConcrete);
        });

        document.getElementById('concrete-add-btn').addEventListener('click', () => {
            const typeLabel = concreteType.options[concreteType.selectedIndex].text;
            const yards = document.getElementById('concrete-res-yards').textContent;
            const cost = parseFloat(document.getElementById('concrete-res-cost').textContent.replace('$', '')) || 0;
            this.addToBudget(`Concrete Pour - ${typeLabel} (${yards} Yards³)`, 'Concrete', yards, cost / yards, cost);
        });

        // 2. Drywall Calculator Live Bindings
        const runDrywall = () => {
            const params = {
                wallLength: document.getElementById('drywall-wallLength').value,
                wallHeight: document.getElementById('drywall-wallHeight').value,
                ceilingLength: document.getElementById('drywall-ceilLength').value,
                ceilingWidth: document.getElementById('drywall-ceilWidth').value,
                sheetSize: document.getElementById('drywall-sheetSize').value,
                waste: document.getElementById('drywall-waste').value,
                unitCost: document.getElementById('drywall-cost').value
            };
            const res = window.Calculators.calculateDrywall(params);
            
            document.getElementById('drywall-res-area').textContent = res.totalArea;
            document.getElementById('drywall-res-sheets').textContent = res.sheetsNeeded;
            document.getElementById('drywall-res-compound').textContent = res.jointCompoundGallons.toFixed(1);
            document.getElementById('drywall-res-tape').textContent = res.jointTapeFeet;
            document.getElementById('drywall-res-screws').textContent = res.screwsLbs.toFixed(1);
            document.getElementById('drywall-res-cost').textContent = `$${parseFloat(res.totalCost).toFixed(2)}`;
        };

        document.querySelectorAll('#est-drywall input, #est-drywall select').forEach(el => {
            el.addEventListener('input', runDrywall);
        });

        document.getElementById('drywall-add-btn').addEventListener('click', () => {
            const sheets = parseInt(document.getElementById('drywall-res-sheets').textContent) || 0;
            const cost = parseFloat(document.getElementById('drywall-res-cost').textContent.replace('$', '')) || 0;
            const size = document.getElementById('drywall-sheetSize').value;
            this.addToBudget(`Drywall Sheets - ${sheets}ct (${size})`, 'Drywall', sheets, cost / (sheets || 1), cost);
            
            // Add accessories automatically to list
            const tape = parseInt(document.getElementById('drywall-res-tape').textContent) || 0;
            const compound = parseFloat(document.getElementById('drywall-res-compound').textContent) || 0;
            if (tape > 0) {
                this.addToBudget(`Drywall Joint Tape (${tape} Ft)`, 'Drywall', 1, 6.50, 6.50);
            }
            if (compound > 0) {
                this.addToBudget(`Joint Compound (${compound} Gal)`, 'Drywall', Math.ceil(compound), 18.00, Math.ceil(compound) * 18.00);
            }
        });

        // 3. Paint Calculator Live Bindings
        const runPaint = () => {
            const params = {
                wallArea: document.getElementById('paint-wallArea').value,
                doors: document.getElementById('paint-doors').value,
                windows: document.getElementById('paint-windows').value,
                coats: document.getElementById('paint-coats').value,
                coverage: document.getElementById('paint-coverage').value,
                waste: document.getElementById('paint-waste').value,
                paintCost: document.getElementById('paint-cost').value
            };
            const res = window.Calculators.calculatePaint(params);
            
            document.getElementById('paint-res-net').textContent = `${res.netArea} sq ft`;
            document.getElementById('paint-res-total').textContent = `${res.totalArea} sq ft`;
            document.getElementById('paint-res-gallons').textContent = `${res.gallonsPaint} gal`;
            document.getElementById('paint-res-trim').textContent = `${res.gallonsTrim} gal`;
            document.getElementById('paint-res-cost').textContent = `$${parseFloat(res.totalCost).toFixed(2)}`;
        };

        document.querySelectorAll('#est-paint input').forEach(el => {
            el.addEventListener('input', runPaint);
        });

        document.getElementById('paint-add-btn').addEventListener('click', () => {
            const wallGals = parseFloat(document.getElementById('paint-res-gallons').textContent) || 0;
            const trimGals = parseFloat(document.getElementById('paint-res-trim').textContent) || 0;
            const cost = parseFloat(document.getElementById('paint-res-cost').textContent.replace('$', '')) || 0;
            
            this.addToBudget(`Wall Paint (${wallGals} Gal) & Trim (${trimGals} Gal)`, 'Paint', 1, cost, cost);
        });

        // 4. Framing Calculator Live Bindings
        const runFraming = () => {
            const params = {
                wallLength: document.getElementById('framing-wallLength').value,
                spacing: document.getElementById('framing-spacing').value,
                plates: document.getElementById('framing-plates').value,
                waste: document.getElementById('framing-waste').value,
                studCost: document.getElementById('framing-cost').value
            };
            const res = window.Calculators.calculateFraming(params);
            
            document.getElementById('framing-res-studs').textContent = res.studsRequired;
            document.getElementById('framing-res-plates').textContent = res.platesRequired;
            document.getElementById('framing-res-cost').textContent = `$${parseFloat(res.totalCost).toFixed(2)}`;
        };

        document.querySelectorAll('#est-framing input, #est-framing select').forEach(el => {
            el.addEventListener('input', runFraming);
        });

        document.getElementById('framing-add-btn').addEventListener('click', () => {
            const studs = parseInt(document.getElementById('framing-res-studs').textContent) || 0;
            const plates = parseInt(document.getElementById('framing-res-plates').textContent) || 0;
            const cost = parseFloat(document.getElementById('framing-res-cost').textContent.replace('$', '')) || 0;
            
            this.addToBudget(`Wall Framing - ${studs} Studs, ${plates} Plates`, 'Framing', 1, cost, cost);
        });

        // 5. Flooring Calculator Live Bindings
        const runFlooring = () => {
            const params = {
                area: document.getElementById('flooring-area').value,
                boxSize: document.getElementById('flooring-boxSize').value,
                waste: document.getElementById('flooring-waste').value,
                costPerSqFt: document.getElementById('flooring-cost').value
            };
            const res = window.Calculators.calculateFlooring(params);
            
            document.getElementById('flooring-res-net').textContent = `${res.actualArea} sq ft`;
            document.getElementById('flooring-res-total').textContent = `${res.totalArea} sq ft`;
            document.getElementById('flooring-res-boxes').textContent = res.boxesNeeded;
            document.getElementById('flooring-res-cost').textContent = `$${parseFloat(res.totalCost).toFixed(2)}`;
        };

        document.querySelectorAll('#est-flooring input').forEach(el => {
            el.addEventListener('input', runFlooring);
        });

        document.getElementById('flooring-add-btn').addEventListener('click', () => {
            const boxes = parseInt(document.getElementById('flooring-res-boxes').textContent) || 0;
            const cost = parseFloat(document.getElementById('flooring-res-cost').textContent.replace('$', '')) || 0;
            const boxSize = parseFloat(document.getElementById('flooring-boxSize').value) || 20;
            
            this.addToBudget(`Flooring Materials (${boxes} Boxes)`, 'Flooring', boxes, cost / (boxes || 1), cost);
        });

        // 6. Roof Pitch Live Bindings & SVG Generator
        const pitchType = document.getElementById('pitch-inputType');
        const pitchRiseRun = document.getElementById('pitch-inputs-riseRun');
        const pitchValNum = document.getElementById('pitch-inputs-pitchVal');
        const pitchDegreesGroup = document.getElementById('pitch-inputs-degrees');

        const runRoofPitch = () => {
            const inputType = pitchType.value;
            let params = {
                inputType,
                rafterSpacing: document.getElementById('pitch-spacing').value,
                roofLength: document.getElementById('pitch-roofLength').value,
                rafterCost: document.getElementById('pitch-rafterCost').value
            };

            if (inputType === 'riseRun') {
                params.rise = document.getElementById('pitch-rise').value;
                params.run = document.getElementById('pitch-run').value;
            } else if (inputType === 'pitchVal') {
                params.pitchVal = document.getElementById('pitch-val-num').value;
            } else if (inputType === 'degrees') {
                params.degrees = document.getElementById('pitch-degrees').value;
            }

            const res = window.Calculators.calculateRoofPitch(params);

            // Update UI elements
            document.getElementById('pitch-res-angle').textContent = `${res.angle}°`;
            document.getElementById('pitch-res-fraction').textContent = `${res.pitchFraction}`;
            document.getElementById('pitch-res-length').textContent = res.rafterLength;
            document.getElementById('pitch-res-count').textContent = res.rafterCount;
            document.getElementById('pitch-res-cost').textContent = `$${parseFloat(res.totalCost).toFixed(2)}`;

            // Render dynamic SVG
            const svgContainer = document.getElementById('roof-svg-container');
            if (svgContainer) {
                svgContainer.innerHTML = window.Calculators.generateRoofSVG(
                    parseFloat(res.rise),
                    parseFloat(res.run),
                    parseFloat(res.rafterLength),
                    parseFloat(res.angle)
                );
            }
        };

        pitchType.addEventListener('change', () => {
            this.playSound('switch');
            const val = pitchType.value;
            pitchRiseRun.style.display = val === 'riseRun' ? 'block' : 'none';
            pitchValNum.style.display = val === 'pitchVal' ? 'block' : 'none';
            pitchDegreesGroup.style.display = val === 'degrees' ? 'block' : 'none';
            runRoofPitch();
        });

        document.querySelectorAll('#est-pitch input, #est-pitch select').forEach(el => {
            el.addEventListener('input', runRoofPitch);
        });

        document.getElementById('pitch-add-btn').addEventListener('click', () => {
            const count = parseInt(document.getElementById('pitch-res-count').textContent) || 0;
            const length = document.getElementById('pitch-res-length').textContent;
            const cost = parseFloat(document.getElementById('pitch-res-cost').textContent.replace('$', '')) || 0;
            const pitchStr = document.getElementById('pitch-res-fraction').textContent;
            
            this.addToBudget(`Rafter Boards - ${count}ct (Span ${length}ft @ ${pitchStr})`, 'Roofing', count, cost / (count || 1), cost);
        });

        // Initialize all calculators to display correct start counts
        runConcrete();
        runDrywall();
        runPaint();
        runFraming();
        runFlooring();
        runRoofPitch();
    }

    // Material List & Project Pouch / Budget management
    loadProjectFromStorage() {
        const data = localStorage.getItem('contractor_toolbelt_budget');
        if (data) {
            try {
                this.projectBudget = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse local storage budget:', e);
                this.projectBudget = [];
            }
        }
    }

    saveProjectToStorage() {
        localStorage.setItem('contractor_toolbelt_budget', JSON.stringify(this.projectBudget));
        this.updateTotalBudgetUI();
    }

    addToBudget(itemName, category, quantity, unitCost, totalCost) {
        // Prevent duplicate addition of identical items in the same timestamp
        const isDuplicate = this.projectBudget.some(item => 
            item.name === itemName && 
            item.category === category && 
            Math.abs(item.totalCost - totalCost) < 0.01 &&
            (Date.now() - parseInt(item.id.split('_')[0])) < 1000
        );

        if (isDuplicate) return;

        this.projectBudget.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: itemName,
            category: category,
            quantity: parseFloat(quantity) || 1,
            unitCost: parseFloat(unitCost) || 0,
            totalCost: parseFloat(totalCost) || 0,
            done: false
        });
        this.saveProjectToStorage();
        this.renderChecklist();
        this.playSound('place');

        // Show toast animation in top header
        const alertEl = document.getElementById('budget-add-alert');
        if (alertEl) {
            alertEl.classList.add('active');
            setTimeout(() => alertEl.classList.remove('active'), 2500);
        }
    }

    deleteFromBudget(id) {
        this.projectBudget = this.projectBudget.filter(item => item.id !== id);
        this.saveProjectToStorage();
        this.renderChecklist();
        this.playSound('erase');
    }

    toggleBudgetItem(id) {
        const item = this.projectBudget.find(item => item.id === id);
        if (item) {
            item.done = !item.done;
            this.saveProjectToStorage();
            this.renderChecklist();
            this.playSound('switch');
        }
    }

    clearChecklist() {
        if (confirm('Delete all items from budget checklist?')) {
            this.projectBudget = [];
            this.saveProjectToStorage();
            this.renderChecklist();
            this.playSound('clear');
        }
    }

    updateTotalBudgetUI() {
        const total = this.projectBudget.reduce((sum, item) => sum + item.totalCost, 0);
        const headerTotal = document.getElementById('header-budget-total');
        const listTotal = document.getElementById('checklist-total-amount');

        if (headerTotal) headerTotal.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (listTotal) listTotal.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    renderChecklist() {
        const container = document.getElementById('checklist-items-tbody');
        if (!container) return;

        if (this.projectBudget.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="checklist-empty">
                        <span class="pouch-empty-icon">🧰</span>
                        <p>No materials or tasks added. Use estimators to calculate costs and add them here, or add custom entries below.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.projectBudget.forEach(item => {
            html += `
                <tr class="${item.done ? 'checked-item' : ''}">
                    <td>
                        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="App.toggleBudgetItem('${item.id}')" class="checkbox-custom">
                    </td>
                    <td class="item-name-cell">${item.name}</td>
                    <td><span class="category-badge cat-${item.category.toLowerCase()}">${item.category}</span></td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitCost.toFixed(2)}</td>
                    <td class="total-col">$${item.totalCost.toFixed(2)}</td>
                    <td>
                        <button onclick="App.deleteFromBudget('${item.id}')" class="btn-icon btn-danger-icon" title="Remove Item" style="background:none; border:none; cursor:pointer;">🗑️</button>
                    </td>
                </tr>
            `;
        });
        container.innerHTML = html;
    }
}

window.App = new ContractorApp();
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
    // Initialize orientation sensors
    if (window.ContractorSensors) {
        window.ContractorSensors.init();
    }
});
