// Loc-Me-In Application Logic & Web Audio Synthesizer

// Service Pricing Database based on Booksy scraper
const serviceDatabase = {
    shampoo: { name: 'Shampoo Only', basePrice: 25.00, duration: '1h 10m' },
    locStyle: { name: 'Loc Style Only', basePrice: 65.00, duration: '2h 30m' },
    retwistOnly: { name: 'Retwist Only (100 Locs or Less)', basePrice: 100.00, duration: '3h 0m' },
    retwistOnlyMore: { name: 'Retwist Only (More Than 100 Locs)', basePrice: 120.00, duration: '3h 30m' },
    barrelBraids: { name: 'Retwist W/Barrel/Criss Cross/Corn Rows', basePrice: 125.00, duration: '3h 30m', lengthSensitive: true },
    frenchBraids: { name: 'Retwist W/Two French Braids', basePrice: 125.00, duration: '3h 30m', lengthSensitive: true },
    ponytailBun: { name: 'Retwist W/Ponytail or Bun', basePrice: 125.00, duration: '3h 30m' },
    twoStrand: { name: 'Retwist W/Two Strand Twist', basePrice: 150.00, duration: '3h 30m', lengthSensitive: true },
    locPetals: { name: 'Retwist W/Loc Petals', basePrice: 150.00, duration: '4h 0m', lengthSensitive: true },
    indivBraids: { name: 'Retwist W/Individual Braids', basePrice: 150.00, duration: '4h 0m', lengthSensitive: true },
    pipeCleaners: { name: 'Retwist W/Pipe Cleaners', basePrice: 150.00, duration: '4h 0m', lengthSensitive: true },
    twoStrandBob: { name: 'Retwist W/Two Strand Loc Bob', basePrice: 175.00, duration: '4h 30m' },
    stitchBraids: { name: 'Stitch Braids (Natural Hair)', basePrice: 85.00, duration: '3h 30m' }
};

// Application State
const state = {
    selectedService: 'retwistOnly',
    locCount: '100_less', 
    locStyle: 'classic',  
    locLength: 'shoulder', 
    locColor: '#0b0705',   
    accessories: 'none',   // 'none', 'gold-cuffs', 'cowry-shells'
    bookingDate: null,
    bookingTime: null,
    audioPlaying: false
};

// Web Audio Ambient Synthesizer Variables
let audioCtx = null;
let soundTimer = null;
let activeOscillators = [];

// DOM Elements
let elPreviewImg, elTotalPrice, elTotalDuration, elConfirmOverlay;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    elPreviewImg = document.getElementById('hair-preview-img');
    elTotalPrice = document.getElementById('total-price');
    elTotalDuration = document.getElementById('total-duration');
    elConfirmOverlay = document.getElementById('confirm-overlay');

    initParticles();
    setupInteractiveControls();
    setupServiceSelection();
    setupCalendar();
    setupBookingForm();
    setupAudioToggle();
    setupRoutinePlanner();
    setupContactConsole();
    updateVisualizer();
    updateSummary();
});

// 1. Particle Background Generator (Purple and Gold blend)
function initParticles() {
    const bg = document.querySelector('.ambient-bg');
    if (!bg) return;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        const colorClass = Math.random() > 0.5 ? 'purple' : 'gold';
        p.className = `particle ${colorClass}`;
        
        const size = Math.random() * 8 + 3;
        const left = Math.random() * 100;
        const delay = Math.random() * -20;
        const duration = Math.random() * 15 + 15;
        
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${left}%`;
        p.style.animationDelay = `${delay}s`;
        p.style.animationDuration = `${duration}s`;
        
        bg.appendChild(p);
    }
}

// 2. Offline Web Audio Synthesizer Loop & Step Sequencer
let schedulerTimer = null;
let nextNoteTime = 0.0;
let current16thNote = 0;
const lookahead = 25.0; // ms
const scheduleAheadTime = 0.1; // seconds

function setupAudioToggle() {
    const selector = document.getElementById('audio-genre-selector');
    if (!selector) return;

    selector.addEventListener('change', () => {
        const val = selector.value;
        state.audioGenre = val;

        if (val === 'off') {
            stopAudioLoop();
        } else {
            stopAudioLoop(); // Clear any active runs
            startAudioLoop();
        }
    });
}

function startAudioLoop() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        state.audioPlaying = true;
        nextNoteTime = audioCtx.currentTime;
        current16thNote = 0;
        scheduler();
    } catch (e) {
        console.error("Web Audio Start failed: ", e);
    }
}

function stopAudioLoop() {
    state.audioPlaying = false;
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
    }
    if (soundTimer) {
        clearTimeout(soundTimer);
    }
    activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
    });
    activeOscillators = [];
}

function scheduler() {
    if (!state.audioPlaying) return;
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(current16thNote, nextNoteTime);
        advanceNote();
    }
    schedulerTimer = setTimeout(scheduler, lookahead);
}

function advanceNote() {
    let bpm = 110;
    if (state.audioGenre === 'somber_chords') bpm = 60;
    if (state.audioGenre === 'soothing_rain') bpm = 70;
    if (state.audioGenre === 'caribbean_wave') bpm = 120;
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime += 0.25 * secondsPerBeat; // 16th note step
    current16thNote = (current16thNote + 1) % 16;
}

function scheduleNote(step, time) {
    if (state.audioGenre === 'island_breeze') {
        playIslandBeat(step, time);
    } else if (state.audioGenre === 'caribbean_wave') {
        playCaribbeanWaveBeat(step, time);
    } else if (state.audioGenre === 'somber_chords') {
        playSomberChordsBeat(step, time);
    } else if (state.audioGenre === 'soothing_rain') {
        playSoothingRainBeat(step, time);
    }
}

// G major pentatonic island bounce (steel drum sound)
function playIslandBeat(step, time) {
    // Island Kick
    if (step === 0 || step === 8) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.16);
    }

    // Reggae Hi-hat / Shaker noise bursts
    if (step % 2 === 0 && step % 8 !== 0) {
        const bufferSize = audioCtx.sampleRate * 0.04;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 6000;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.015, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start(time); noise.stop(time + 0.05);
    }

    // Steel drum arpeggio
    const melody = [
        { s: 0, f: 392.00 }, // G4
        { s: 3, f: 493.88 }, // B4
        { s: 6, f: 587.33 }, // D5
        { s: 8, f: 440.00 }, // A4
        { s: 11, f: 659.25 }, // E5
        { s: 14, f: 587.33 }  // D5
    ];
    const match = melody.find(m => m.s === step);
    if (match) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(match.f, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
        
        // overtone for steel-drum visual signature metallic sound
        const overtone = audioCtx.createOscillator();
        const overtoneGain = audioCtx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(match.f * 2, time);
        overtoneGain.gain.setValueAtTime(0.03, time);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
        
        osc.connect(gain); gain.connect(audioCtx.destination);
        overtone.connect(overtoneGain); overtoneGain.connect(audioCtx.destination);
        
        osc.start(time); osc.stop(time + 0.26);
        overtone.start(time); overtone.stop(time + 0.16);
    }

    // Island Bassline
    if (step === 0 || step === 4 || step === 8 || step === 12) {
        let bassFreq = 98.00;
        if (step === 4) bassFreq = 130.81;
        if (step === 8) bassFreq = 82.41;
        if (step === 12) bassFreq = 73.42;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, time);
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.35);
    }
}

// Calypso-style upbeat steel drum track
function playCaribbeanWaveBeat(step, time) {
    // Caribbean Wave Kick
    if (step === 0 || step === 4 || step === 8 || step === 12) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.13);
    }

    // Woodblock/Rimshot Accent
    if (step === 3 || step === 7 || step === 11 || step === 15) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, time);
        gain.gain.setValueAtTime(0.03, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.06);
    }

    // Caribbean Shaker
    if (step % 2 === 0) {
        const bufferSize = audioCtx.sampleRate * 0.03;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 7000;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.012, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start(time); noise.stop(time + 0.04);
    }

    // Calypso Steel Pan Melody (Key of C Major Pentatonic)
    const calypsoMelody = [
        { s: 0, f: 523.25 }, // C5
        { s: 2, f: 587.33 }, // D5
        { s: 4, f: 659.25 }, // E5
        { s: 6, f: 783.99 }, // G5
        { s: 8, f: 880.00 }, // A5
        { s: 10, f: 783.99 }, // G5
        { s: 12, f: 659.25 }, // E5
        { s: 14, f: 587.33 }  // D5
    ];
    const match = calypsoMelody.find(m => m.s === step);
    if (match) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(match.f, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        
        const overtone = audioCtx.createOscillator();
        const overtoneGain = audioCtx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(match.f * 2, time);
        overtoneGain.gain.setValueAtTime(0.02, time);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        
        osc.connect(gain); gain.connect(audioCtx.destination);
        overtone.connect(overtoneGain); overtoneGain.connect(audioCtx.destination);
        
        osc.start(time); osc.stop(time + 0.21);
        overtone.start(time); overtone.stop(time + 0.13);
    }

    // Calypso Bassline
    if (step === 0 || step === 4 || step === 8 || step === 12) {
        let bassFreq = 130.81; // C3
        if (step === 4) bassFreq = 174.61; // F3
        if (step === 8) bassFreq = 196.00; // G3
        if (step === 12) bassFreq = 130.81; // C3
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, time);
        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.3);
    }
}

// Somber, Slow ambient minor chords
function playSomberChordsBeat(step, time) {
    // Very soft heartbeat sub kick
    if (step === 0 || step === 8) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(50, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 0.45);
    }

    // Pad chords on Step 0 and 8
    if (step === 0 || step === 8) {
        const chord = step === 0 
            ? [110.00, 130.81, 164.81, 196.00, 246.94] // Am9
            : [82.41, 98.00, 123.47, 146.83, 185.00];  // Em7/F#
        
        const duration = 3.6;
        chord.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.015, time + 0.4);
            gain.gain.setValueAtTime(0.015, time + duration - 0.8);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.setValueAtTime(350, time);
            
            osc.connect(gain); gain.connect(filter); filter.connect(audioCtx.destination);
            
            osc.start(time); osc.stop(time + duration);
            activeOscillators.push(osc);
        });
    }
}

// Gentle continuous rain pattern and quiet sparse bells
function playSoothingRainBeat(step, time) {
    // Rain noise burst
    const bufferSize = audioCtx.sampleRate * 0.6;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 1.0;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.004, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.58);
    
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start(time); noise.stop(time + 0.6);

    // Quiet, slow bell notes (Pentatonic Minor)
    const bellNotes = [
        { s: 2, f: 587.33 },  // D5
        { s: 6, f: 698.46 },  // F5
        { s: 10, f: 880.00 }, // A5
        { s: 14, f: 1046.50 } // C6
    ];
    const match = bellNotes.find(n => n.s === step);
    if (match) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(match.f, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.015, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
        
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(time); osc.stop(time + 1.3);
    }
}


// 3. Upgraded Styling Interactive Controls
function setupInteractiveControls() {
    // Loc Count Toggle
    document.querySelectorAll('[data-loc-count]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-loc-count]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.locCount = btn.dataset.locCount;
            
            if (state.selectedService === 'retwistOnly' || state.selectedService === 'retwistOnlyMore') {
                state.selectedService = (state.locCount === '100_less') ? 'retwistOnly' : 'retwistOnlyMore';
                highlightSelectedService();
            }
            updateVisualizer();
            updateSummary();
        });
    });

    // Loc Style Options
    document.querySelectorAll('[data-loc-style]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-loc-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.locStyle = btn.dataset.locStyle;
            
            mapStyleToService(state.locStyle);
            updateVisualizer();
            updateSummary();
        });
    });

    // Loc Length Options
    document.querySelectorAll('[data-loc-length]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-loc-length]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.locLength = btn.dataset.locLength;
            updateVisualizer();
            updateSummary();
        });
    });

    // Accessories Options
    document.querySelectorAll('[data-accessories]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-accessories]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.accessories = btn.dataset.accessories;
            updateVisualizer();
            updateSummary();
        });
    });
}

function mapStyleToService(visualStyle) {
    switch (visualStyle) {
        case 'bun':
            state.selectedService = 'ponytailBun';
            break;
        case 'braids':
            state.selectedService = 'barrelBraids';
            break;
        case 'bob':
            state.selectedService = 'twoStrandBob';
            break;
        case 'two-strand':
            state.selectedService = 'twoStrand';
            break;
        default:
            state.selectedService = (state.locCount === '100_less') ? 'retwistOnly' : 'retwistOnlyMore';
    }
    highlightSelectedService();
}

function highlightSelectedService() {
    document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.service === state.selectedService) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// Setup Service Selection List
function setupServiceSelection() {
    const container = document.getElementById('service-list');
    container.innerHTML = '';

    Object.keys(serviceDatabase).forEach(key => {
        const svc = serviceDatabase[key];
        const item = document.createElement('div');
        item.className = `service-item ${key === state.selectedService ? 'selected' : ''}`;
        item.dataset.service = key;
        item.innerHTML = `
            <div class="service-details">
                <h4>${svc.name}</h4>
                <p>Duration: ${svc.duration}</p>
            </div>
            <div class="service-price">$${svc.basePrice.toFixed(2)}</div>
        `;

        item.addEventListener('click', () => {
            document.querySelectorAll('.service-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            state.selectedService = key;
            
            syncConfiguratorToService(key);
            updateSummary();
        });

        container.appendChild(item);
    });
}

function syncConfiguratorToService(serviceKey) {
    let targetStyle = 'classic';
    if (serviceKey === 'ponytailBun') targetStyle = 'bun';
    else if (serviceKey === 'barrelBraids' || serviceKey === 'frenchBraids') targetStyle = 'braids';
    else if (serviceKey === 'twoStrandBob') targetStyle = 'bob';
    else if (serviceKey === 'twoStrand' || serviceKey === 'locPetals' || serviceKey === 'indivBraids') targetStyle = 'two-strand';

    state.locStyle = targetStyle;
    document.querySelectorAll('[data-loc-style]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.locStyle === targetStyle);
    });

    if (serviceKey === 'retwistOnlyMore') {
        state.locCount = '100_more';
        document.querySelectorAll('[data-loc-count]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.locCount === '100_more');
        });
    } else if (serviceKey === 'retwistOnly') {
        state.locCount = '100_less';
        document.querySelectorAll('[data-loc-count]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.locCount === '100_less');
        });
    }
    updateVisualizer();
}

// 4. Upgraded Image-Based Visualizer
function updateVisualizer() {
    if (!elPreviewImg) return;

    // Soft fade transition
    elPreviewImg.style.opacity = '0.2';

    setTimeout(() => {
        let imgName = 'classic';
        if (state.locStyle === 'bun') imgName = 'bun';
        else if (state.locStyle === 'braids') imgName = 'braids';
        else if (state.locStyle === 'bob') imgName = 'bob';
        else if (state.locStyle === 'two-strand') imgName = 'two_strand';

        const suffix = (state.locCount === '100_less') ? '_less' : '_more';
        elPreviewImg.src = `assets/${imgName}${suffix}.png`;
        elPreviewImg.style.opacity = '1';

        updateAccessoriesOverlay();
    }, 150);
}

// Render beads and cuffs dynamically on top of the hairstyle preview image
function updateAccessoriesOverlay() {
    const overlay = document.getElementById('preview-accessories-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    
    if (state.accessories === 'none') {
        return;
    }
    
    // Position floating accessories relative to the hair region on the picture
    const positions = [
        { top: 22, left: 38 }, { top: 28, left: 62 },
        { top: 40, left: 24 }, { top: 38, left: 76 },
        { top: 52, left: 28 }, { top: 58, left: 72 },
        { top: 68, left: 34 }, { top: 64, left: 62 },
        { top: 48, left: 45 }, { top: 45, left: 55 }
    ];
    
    positions.forEach(pos => {
        const item = document.createElement('div');
        item.style.position = 'absolute';
        item.style.top = pos.top + '%';
        item.style.left = pos.left + '%';
        item.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 40 - 20}deg)`;
        
        if (state.accessories === 'gold-cuffs') {
            // Shiny cylindrical gold cuff SVG
            item.innerHTML = `
                <svg width="24" height="18" viewBox="0 0 24 18" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
                    <defs>
                        <linearGradient id="gold-grad-accessory" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#8a6f27" />
                            <stop offset="30%" stop-color="#e8c86b" />
                            <stop offset="50%" stop-color="#fff6cc" />
                            <stop offset="70%" stop-color="#e8c86b" />
                            <stop offset="100%" stop-color="#8a6f27" />
                        </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="20" height="14" rx="3" fill="url(#gold-grad-accessory)" />
                    <line x1="6" y1="2" x2="6" y2="16" stroke="#5c4a1a" stroke-width="1.5" />
                    <line x1="12" y1="2" x2="12" y2="16" stroke="#5c4a1a" stroke-width="1.5" />
                    <line x1="18" y1="2" x2="18" y2="16" stroke="#5c4a1a" stroke-width="1.5" />
                </svg>
            `;
        } else if (state.accessories === 'cowry-shells') {
            // Detailed organic cream cowry shell SVG
            item.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 30 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
                    <ellipse cx="15" cy="15" rx="10" ry="13" fill="#fcfaf2" stroke="#dfd7c2" stroke-width="1" />
                    <path d="M15 4 C11 10, 11 20, 15 26 C19 20, 19 10, 15 4" fill="#eee5ce" stroke="#8c7d5c" stroke-width="1" />
                    <path d="M11 11 H13.5 M11 14 H13.5 M11 17 H13.5 M11 20 H13.5 M16.5 11 H19 M16.5 14 H19 M16.5 17 H19 M16.5 20 H19" stroke="#8c7d5c" stroke-width="1" />
                </svg>
            `;
        }
        overlay.appendChild(item);
    });
}

// Calculate Summary Pricing
function updateSummary() {
    const svc = serviceDatabase[state.selectedService];
    if (!svc) return;

    let price = svc.basePrice;
    
    if (svc.lengthSensitive) {
        if (state.locLength === 'midback') price += 25.00;
        if (state.locLength === 'past_mid') price += 50.00;
    }

    if (state.locCount === '100_more' && (state.selectedService !== 'retwistOnlyMore')) {
        price += 25.00; 
    }

    if (state.accessories === 'gold-cuffs') price += 15.00;
    if (state.accessories === 'cowry-shells') price += 20.00;

    elTotalPrice.textContent = `$${price.toFixed(2)}`;
    elTotalDuration.textContent = svc.duration;
}

// Calendar Generator Simulation
function setupCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid) return;

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    grid.innerHTML = '';

    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayLabels.forEach(lbl => {
        const el = document.createElement('div');
        el.className = 'calendar-day-label';
        el.textContent = lbl;
        grid.appendChild(el);
    });

    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        grid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = day;

        const cellDate = new Date(currentYear, currentMonth, day);
        if (cellDate < today && day !== today.getDate()) {
            el.classList.add('disabled');
        } else {
            el.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                el.classList.add('selected');
                state.bookingDate = `${monthNames[currentMonth]} ${day}, ${currentYear}`;
                generateTimeSlots();
            });
            if (day === today.getDate() + 1) {
                el.click();
            }
        }
        grid.appendChild(el);
    }
}

function generateTimeSlots() {
    const slotsContainer = document.getElementById('time-slots');
    slotsContainer.innerHTML = '';
    
    const slots = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
    
    slots.forEach(slot => {
        const el = document.createElement('div');
        el.className = 'time-slot';
        el.textContent = slot;
        el.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            el.classList.add('selected');
            state.bookingTime = slot;
        });
        
        if (slot === '09:00 AM') {
            el.classList.add('selected');
            state.bookingTime = slot;
        }
        slotsContainer.appendChild(el);
    });
}

// Booking Form Actions
function setupBookingForm() {
    const form = document.getElementById('booking-form-submit');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const clientName = document.getElementById('client-name').value;
        const clientPhone = document.getElementById('client-phone').value;

        if (!clientName || !clientPhone) {
            alert('Please provide name and phone details.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'CONNECTING TO GOOGLE CALENDAR ENGINE...';

        setTimeout(() => {
            submitBtn.textContent = 'CONFIRMING APPOINTMENT STATUS...';
            setTimeout(() => {
                showConfirmation(clientName);
                submitBtn.disabled = false;
                submitBtn.textContent = origText;
            }, 1200);
        }, 1500);
    });

    const closeBtn = document.getElementById('close-confirm-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            elConfirmOverlay.classList.remove('active');
        });
    }
}

function showConfirmation(clientName) {
    const summaryDetails = document.getElementById('confirm-details');
    const svc = serviceDatabase[state.selectedService];
    
    summaryDetails.innerHTML = `
        <p style="margin-bottom: 0.5rem"><strong>Client:</strong> ${clientName}</p>
        <p style="margin-bottom: 0.5rem"><strong>Service Selected:</strong> ${svc.name}</p>
        <p style="margin-bottom: 0.5rem"><strong>Date & Time:</strong> ${state.bookingDate} at ${state.bookingTime}</p>
        <p style="margin-bottom: 0.5rem"><strong>Duration:</strong> ${svc.duration}</p>
        <p style="margin-bottom: 0.5rem; color: var(--accent-gold);"><strong>Estimated Price:</strong> ${elTotalPrice.textContent}</p>
        <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 1rem;">Google Calendar event synced successfully. A confirmation link has been simulated to your calendar.</p>
    `;

    elConfirmOverlay.classList.add('active');
}

// 6. Interactive Loc Maintenance Routine Planner
function setupRoutinePlanner() {
    const btn = document.getElementById('generate-plan-btn');
    const output = document.getElementById('planner-output');
    if (!btn || !output) return;

    btn.addEventListener('click', () => {
        const stage = document.getElementById('plan-loc-type').value;
        const scalp = document.getElementById('plan-scalp-type').value;
        
        generateRoutineSchedule(stage, scalp);
        output.classList.remove('hidden-output');
        output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function generateRoutineSchedule(stage, scalp) {
    const grid = document.querySelector('.schedule-grid');
    if (!grid) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Custom daily tasks based on inputs
    let hydrationTask = "Rosewater Mist + Light Oil";
    let washDay = "Sun";
    let protectionTask = "Satin Wrap Protection";
    let specialTask = "Scalp Massage (5 mins)";

    if (scalp === 'dry') {
        hydrationTask = "Moisture Spray + Extra Virgin Olive Oil";
        specialTask = "Hot Oil Treatment & Massage";
    } else if (scalp === 'oily') {
        hydrationTask = "Light Rosewater Mist Only";
        specialTask = "Clarifying Herbal Scalp Cleanse";
    }

    let routineList = [];

    if (stage === 'baby') {
        // Starter locs: less wash, no heavy products
        routineList = [
            { day: 'Mon', desc: `${hydrationTask}` },
            { day: 'Tue', desc: `${specialTask}` },
            { day: 'Wed', desc: `${hydrationTask}` },
            { day: 'Thu', desc: `Check parting definitions & separate roots` },
            { day: 'Fri', desc: `${hydrationTask}` },
            { day: 'Sat', desc: `${protectionTask}` },
            { day: 'Sun', desc: `Starter Loc Cleanse & Air Dry` }
        ];
    } else if (stage === 'teen') {
        // Teen stage: frizzy, expanding
        routineList = [
            { day: 'Mon', desc: `${hydrationTask}` },
            { day: 'Tue', desc: `Palm roll loose frizzy loc roots` },
            { day: 'Wed', desc: `${hydrationTask}` },
            { day: 'Thu', desc: `${specialTask}` },
            { day: 'Fri', desc: `${hydrationTask}` },
            { day: 'Sat', desc: `${protectionTask}` },
            { day: 'Sun', desc: `ACV Cleansing Rinse & Retighten` }
        ];
    } else {
        // Mature stage: heavy, solid
        routineList = [
            { day: 'Mon', desc: `${hydrationTask}` },
            { day: 'Tue', desc: `${specialTask}` },
            { day: 'Wed', desc: `${hydrationTask}` },
            { day: 'Thu', desc: `Deep hydration steam treatment` },
            { day: 'Fri', desc: `${hydrationTask}` },
            { day: 'Sat', desc: `${protectionTask}` },
            { day: 'Sun', desc: `Shampoo + Leave-in loc treatment` }
        ];
    }

    grid.innerHTML = '';
    routineList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        card.innerHTML = `
            <div class="schedule-day">${item.day}</div>
            <div class="schedule-desc">${item.desc}</div>
        `;
        grid.appendChild(card);
    });
}

// 7. Loc-Me-In Contact Console Unlock Animation and Interaction
function setupContactConsole() {
    const lockContainer = document.querySelector('.lock-container');
    const lockSvg = document.getElementById('contact-lock-svg');
    const shackle = document.getElementById('lock-shackle');
    const detailsPanel = document.getElementById('contact-details-panel');
    const actionBtn = document.getElementById('lock-action-btn');
    const downloadBtn = document.getElementById('download-vcf-btn');

    if (!lockContainer || !actionBtn) return;

    let isLocked = true;

    function toggleLock() {
        if (isLocked) {
            // Unlock action
            shackle.style.transform = 'translateY(-6px) rotate(-15deg)';
            lockSvg.style.color = '#39ff14'; // Cyber Lime unlocked color
            lockSvg.style.filter = 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.7))';
            
            // Show details panel with smooth fade-in
            detailsPanel.style.display = 'block';
            setTimeout(() => {
                detailsPanel.style.opacity = '1';
                detailsPanel.style.transform = 'scale(1)';
            }, 50);

            // Update button texts
            actionBtn.textContent = 'SECURE DETAILS CONSOLE';
            if (downloadBtn) {
                downloadBtn.style.display = 'inline-flex';
            }
            
            // Web Audio sound effect for unlocking
            playUnlockSound();

            isLocked = false;
        } else {
            // Lock action
            shackle.style.transform = 'none';
            lockSvg.style.color = 'var(--accent-gold)';
            lockSvg.style.filter = 'drop-shadow(0 0 8px rgba(207, 185, 151, 0.4))';
            
            // Hide details panel
            detailsPanel.style.opacity = '0';
            detailsPanel.style.transform = 'scale(0.95)';
            setTimeout(() => {
                detailsPanel.style.display = 'none';
            }, 300);

            // Update button texts
            actionBtn.textContent = 'DECRYPT CONTACT INFO';
            if (downloadBtn) {
                downloadBtn.style.display = 'none';
            }

            // Web Audio sound effect for locking
            playLockSound();

            isLocked = true;
        }
    }

    lockContainer.addEventListener('click', toggleLock);
    actionBtn.addEventListener('click', toggleLock);
}

function playUnlockSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Cyber lock unlock mechanical sound: high click, then a frequency sweep up
    const click = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(800, now);
    click.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
    clickGain.gain.setValueAtTime(0.1, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    click.connect(clickGain); clickGain.connect(audioCtx.destination);
    click.start(now); click.stop(now + 0.1);

    const laser = audioCtx.createOscillator();
    const laserGain = audioCtx.createGain();
    laser.type = 'sine';
    laser.frequency.setValueAtTime(1000, now + 0.05);
    laser.frequency.exponentialRampToValueAtTime(2000, now + 0.25);
    laserGain.gain.setValueAtTime(0.05, now + 0.05);
    laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    laser.connect(laserGain); laserGain.connect(audioCtx.destination);
    laser.start(now + 0.05); laser.stop(now + 0.3);
}

function playLockSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Cyber lock lock mechanical sound: high click, then a frequency sweep down
    const click = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(1500, now);
    click.frequency.exponentialRampToValueAtTime(600, now + 0.12);
    clickGain.gain.setValueAtTime(0.1, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    click.connect(clickGain); clickGain.connect(audioCtx.destination);
    click.start(now); click.stop(now + 0.15);
}

