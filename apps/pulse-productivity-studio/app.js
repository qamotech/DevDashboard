// --- App State ---
let state = {
  tasks: JSON.parse(localStorage.getItem('pulse_tasks')) || [],
  chronotype: 'neutral',
  wakeTime: 7.0, // decimal hours
  timer: {
    duration: 25 * 60,
    remaining: 25 * 60,
    interval: null,
    phase: 'focus', // 'focus' or 'break'
    isActive: false
  },
  audio: {
    ctx: null,
    binaural: { nodes: null, active: false, vol: 0.3 },
    rain: { nodes: null, active: false, vol: 0.4 }
  }
};

// --- DOM Elements ---
const elTime = document.getElementById('current-time');
const elEnergyText = document.getElementById('current-energy-text');
const elChronotype = document.getElementById('chronotype');
const elWakeTime = document.getElementById('wake-time');
const elWakeTimeDisplay = document.getElementById('wake-time-display');
const canvasEnergy = document.getElementById('energy-chart');
const suggestionTitle = document.getElementById('suggestion-title');
const suggestionDesc = document.getElementById('suggestion-desc');

const btnNewTask = document.getElementById('btn-new-task');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const btnModalCancel = document.getElementById('btn-modal-cancel');

const timerTime = document.getElementById('timer-time');
const timerPhase = document.getElementById('timer-phase');
const btnTimerToggle = document.getElementById('btn-timer-toggle');
const btnTimerReset = document.getElementById('btn-timer-reset');
const breathingGuide = document.getElementById('breathing-guide');

const btnBinaural = document.getElementById('btn-binaural');
const volBinaural = document.getElementById('volume-binaural');
const btnRain = document.getElementById('btn-rain');
const volRain = document.getElementById('volume-rain');

const elTaskTitle = document.getElementById('task-title');
const elTaskQuadrant = document.getElementById('task-quadrant');
const elListDo = document.getElementById('list-do');
const elListSchedule = document.getElementById('list-schedule');
const elListDelegate = document.getElementById('list-delegate');
const elListEliminate = document.getElementById('list-eliminate');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Load settings
  state.chronotype = elChronotype.value;
  state.wakeTime = parseFloat(elWakeTime.value);
  
  // Set up listeners
  elChronotype.addEventListener('change', (e) => {
    state.chronotype = e.target.value;
    updateBiorhythm();
  });
  
  elWakeTime.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.wakeTime = val;
    const hours = Math.floor(val);
    const mins = (val % 1) === 0.5 ? '30' : '00';
    elWakeTimeDisplay.textContent = `${String(hours).padStart(2, '0')}:${mins}`;
    updateBiorhythm();
  });

  // Clock
  setInterval(updateClock, 1000);
  updateClock();

  // Task events
  btnNewTask.addEventListener('click', () => taskModal.classList.add('active'));
  btnModalCancel.addEventListener('click', () => taskModal.classList.remove('active'));
  taskForm.addEventListener('submit', handleCreateTask);
  
  // Timer events
  btnTimerToggle.addEventListener('click', toggleTimer);
  btnTimerReset.addEventListener('click', resetTimer);
  
  // Audio events
  btnBinaural.addEventListener('click', () => toggleAudio('binaural', btnBinaural));
  volBinaural.addEventListener('input', (e) => adjustVolume('binaural', parseFloat(e.target.value)));
  
  btnRain.addEventListener('click', () => toggleAudio('rain', btnRain));
  volRain.addEventListener('input', (e) => adjustVolume('rain', parseFloat(e.target.value)));

  // Initial draw and load
  renderTasks();
  updateBiorhythm();
  initBreathingAnimation();
});

// --- Clock & Energy Engine ---
function updateClock() {
  const now = new Date();
  elTime.textContent = now.toTimeString().split(' ')[0];
  
  // Repaint canvas vertical time indicator every minute
  if (now.getSeconds() === 0) {
    updateBiorhythm();
  }
}

// Biorhythm Calculator Formula
// Returns energy level between 0.0 and 1.0 for a given hour of day (0-23)
function getEnergyAtHour(hour) {
  const wake = state.wakeTime;
  const chrono = state.chronotype;
  
  // Shift hour base relative to wake time
  // Default wake is 7:00. If user wakes at 9:00, shift the curve by 2 hours.
  let relativeHour = (hour - wake + 24) % 24;
  
  // Adjust base shift depending on chronotype
  if (chrono === 'morning') {
    relativeHour += 1; // Peaks earlier
  } else if (chrono === 'night') {
    relativeHour -= 3; // Peaks much later
  }
  
  // Circadian Curve Equation: combination of two sine waves (daily peak, afternoon slump, evening boost)
  // peak around relative Hour 4 (e.g. 11am), slumps at 14 (3pm), secondary peak at 18 (7pm), sleep drop at 22 (11pm)
  const mainCycle = Math.sin((relativeHour - 2) * Math.PI / 10); // Main peak-valley
  const ultradianCycle = 0.3 * Math.sin(relativeHour * Math.PI / 4); // Micro dips
  
  let energy = 0.5 + 0.4 * mainCycle + 0.1 * ultradianCycle;
  
  // Limit bounds
  return Math.max(0.1, Math.min(1.0, energy));
}

function updateBiorhythm() {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentEnergy = getEnergyAtHour(currentHour);
  
  // Update state text
  let stateText = 'Coasting';
  let badgeColor = 'var(--text-muted)';
  let adviceTitle = 'Pacing Stage';
  let adviceDesc = 'Take it steady. Perfect time for administrative work, coordination, or planning.';

  if (currentEnergy > 0.8) {
    stateText = 'Peak Cognitive';
    badgeColor = 'var(--color-do)';
    adviceTitle = 'Peak Focus Window';
    adviceDesc = 'Your mental agility is at its highest. Focus on high-priority analytical or creative tasks.';
  } else if (currentEnergy > 0.65) {
    stateText = 'High Alert';
    badgeColor = 'var(--color-schedule)';
    adviceTitle = 'Productive Window';
    adviceDesc = 'Excellent concentration levels. Handle complex scheduling, problem-solving, or structured studies.';
  } else if (currentEnergy < 0.4) {
    stateText = 'Midday Recovery';
    badgeColor = 'var(--color-eliminate)';
    adviceTitle = 'Wind Down / Relax';
    adviceDesc = 'Energy levels are low. Do light administrative work, take a walk, or eliminate trivial tasks.';
  } else if (currentHour < state.wakeTime || currentHour > (state.wakeTime + 17) % 24) {
    stateText = 'Deep Recharging';
    badgeColor = 'var(--color-eliminate)';
    adviceTitle = 'Rest & Sleep Cycle';
    adviceDesc = 'Your body is in recovery mode. Rest, meditate, or sleep to prepare for the next cycle.';
  }

  elEnergyText.textContent = stateText;
  elEnergyText.style.color = badgeColor;
  elEnergyText.style.textShadow = `0 0 12px ${badgeColor}`;
  suggestionTitle.textContent = adviceTitle;
  suggestionDesc.textContent = adviceDesc;
  
  drawEnergyChart(currentHour);
}

function drawEnergyChart(currentHourDecimal) {
  const ctx = canvasEnergy.getContext('2d');
  const width = canvasEnergy.width = canvasEnergy.offsetWidth * window.devicePixelRatio;
  const height = canvasEnergy.height = canvasEnergy.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const w = canvasEnergy.offsetWidth;
  const h = canvasEnergy.offsetHeight;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gridX = (w / 4) * i;
    ctx.beginPath();
    ctx.moveTo(gridX, 0);
    ctx.lineTo(gridX, h);
    ctx.stroke();
  }
  
  // Draw Energy Curve
  ctx.beginPath();
  ctx.lineWidth = 3;
  
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, 'var(--color-do)');
  gradient.addColorStop(0.3, 'var(--color-schedule)');
  gradient.addColorStop(0.6, 'var(--color-delegate)');
  gradient.addColorStop(1, 'var(--color-eliminate)');
  ctx.strokeStyle = gradient;
  
  for (let x = 0; x <= w; x++) {
    const hour = (x / w) * 24;
    const val = getEnergyAtHour(hour);
    const y = h - (val * (h - 20) + 10);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Fill under curve
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x++) {
    const hour = (x / w) * 24;
    const val = getEnergyAtHour(hour);
    const y = h - (val * (h - 20) + 10);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
  fillGrad.addColorStop(0, 'rgba(100, 120, 240, 0.08)');
  fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = fillGrad;
  ctx.fill();
  
  // Draw Current Time Indicator
  const currentX = (currentHourDecimal / 24) * w;
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.moveTo(currentX, 0);
  ctx.lineTo(currentX, h);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Dot at current location
  const currentVal = getEnergyAtHour(currentHourDecimal);
  const currentY = h - (currentVal * (h - 20) + 10);
  ctx.beginPath();
  ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0; // reset
}

// --- Task Manager ---
function handleCreateTask(e) {
  e.preventDefault();
  const title = elTaskTitle.value.trim();
  const quadrant = elTaskQuadrant.value;
  
  if (!title) return;
  
  const newTask = {
    id: Date.now().toString(),
    title,
    quadrant,
    completed: false
  };
  
  state.tasks.push(newTask);
  saveTasks();
  renderTasks();
  
  // Reset and close
  taskForm.reset();
  taskModal.classList.remove('active');
}

function saveTasks() {
  localStorage.setItem('pulse_tasks', JSON.stringify(state.tasks));
}

function renderTasks() {
  const lists = {
    do: elListDo,
    schedule: elListSchedule,
    delegate: elListDelegate,
    eliminate: elListEliminate
  };
  
  // Clear lists
  Object.values(lists).forEach(list => list.innerHTML = '');
  
  state.tasks.forEach(task => {
    const listEl = lists[task.quadrant];
    if (!listEl) return;
    
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;
    
    taskItem.innerHTML = `
      <div class="task-info">
        <div class="checkbox-custom"></div>
        <span class="task-text">${escapeHtml(task.title)}</span>
      </div>
      <button class="btn-delete-task">✕</button>
    `;
    
    // Toggle completion on checkmark click
    taskItem.querySelector('.checkbox-custom').addEventListener('click', () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });
    
    // Delete task
    taskItem.querySelector('.btn-delete-task').addEventListener('click', () => {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });
    
    listEl.appendChild(taskItem);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Timer & Breathing Guide ---
function toggleTimer() {
  if (state.timer.isActive) {
    clearInterval(state.timer.interval);
    state.timer.isActive = false;
    btnTimerToggle.textContent = 'Start';
  } else {
    state.timer.isActive = true;
    btnTimerToggle.textContent = 'Pause';
    state.timer.interval = setInterval(tickTimer, 1000);
  }
}

function tickTimer() {
  if (state.timer.remaining <= 0) {
    // Phase complete sound notification (quick synthezised chime)
    playChime();
    
    if (state.timer.phase === 'focus') {
      state.timer.phase = 'break';
      state.timer.remaining = 5 * 60;
      timerPhase.textContent = 'BREAK';
      timerPhase.style.color = 'var(--color-schedule)';
    } else {
      state.timer.phase = 'focus';
      state.timer.remaining = 25 * 60;
      timerPhase.textContent = 'FOCUS';
      timerPhase.style.color = 'var(--color-do)';
    }
  } else {
    state.timer.remaining--;
  }
  updateTimerDisplay();
}

function resetTimer() {
  clearInterval(state.timer.interval);
  state.timer.isActive = false;
  state.timer.phase = 'focus';
  state.timer.remaining = 25 * 60;
  btnTimerToggle.textContent = 'Start';
  timerPhase.textContent = 'FOCUS';
  timerPhase.style.color = '';
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(state.timer.remaining / 60);
  const s = state.timer.remaining % 60;
  timerTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function initBreathingAnimation() {
  // Toggle breathing classes every 5 seconds
  let breatheIn = true;
  setInterval(() => {
    if (!state.timer.isActive || state.timer.phase !== 'focus') {
      if (breathingGuide.className !== 'breathing-circle-inner') {
        breathingGuide.className = 'breathing-circle-inner';
      }
      return;
    }
    
    if (breatheIn) {
      breathingGuide.classList.add('inhale');
      breathingGuide.classList.remove('exhale');
    } else {
      breathingGuide.classList.add('exhale');
      breathingGuide.classList.remove('inhale');
    }
    breatheIn = !breatheIn;
  }, 5000);
}

// --- Synthesizer & Web Audio Engine ---
function getAudioContext() {
  if (!state.audio.ctx) {
    state.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audio.ctx;
}

function toggleAudio(type, buttonEl) {
  const audioContext = getAudioContext();
  
  if (state.audio[type].active) {
    // Stop nodes
    stopSynthNode(type);
    buttonEl.classList.remove('active');
    buttonEl.textContent = '🔇';
  } else {
    // Start nodes
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    startSynthNode(type);
    buttonEl.classList.add('active');
    buttonEl.textContent = '🔊';
  }
}

function adjustVolume(type, val) {
  state.audio[type].vol = val;
  if (state.audio[type].active && state.audio[type].nodes) {
    state.audio[type].nodes.gain.gain.setValueAtTime(val, state.audio.ctx.currentTime);
  }
}

function startSynthNode(type) {
  const ctx = state.audio.ctx;
  state.audio[type].active = true;
  
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(state.audio[type].vol, ctx.currentTime);
  mainGain.connect(ctx.destination);
  
  if (type === 'binaural') {
    // Binaural focus beats: 140Hz in Left ear, 144Hz in Right ear (produces 4Hz theta wave)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    
    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    
    oscL.frequency.setValueAtTime(140, ctx.currentTime);
    oscR.frequency.setValueAtTime(144, ctx.currentTime);
    
    oscL.type = 'sine';
    oscR.type = 'sine';
    
    if (pannerL && pannerR) {
      pannerL.pan.setValueAtTime(-1, ctx.currentTime);
      pannerR.pan.setValueAtTime(1, ctx.currentTime);
      
      oscL.connect(pannerL);
      oscR.connect(pannerR);
      
      pannerL.connect(mainGain);
      pannerR.connect(mainGain);
    } else {
      // Fallback if Panner API is unsupported
      oscL.connect(mainGain);
      oscR.connect(mainGain);
    }
    
    oscL.start();
    oscR.start();
    
    state.audio.binaural.nodes = { oscL, oscR, gain: mainGain };
    
  } else if (type === 'rain') {
    // Rain noise generation using procedurally generated white noise + filter sweeping
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoiseSource = ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;
    
    // Lowpass filter to muffle noise and make it sound like deep ambient rain
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    
    // Sweep the filter frequency slowly to simulate waves / gust of wind
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow oscillation
    lfoGain.gain.setValueAtTime(150, ctx.currentTime); // dynamic range +/- 150hz
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    whiteNoiseSource.connect(filter);
    filter.connect(mainGain);
    
    whiteNoiseSource.start();
    lfo.start();
    
    state.audio.rain.nodes = { source: whiteNoiseSource, lfo, gain: mainGain };
  }
}

function stopSynthNode(type) {
  state.audio[type].active = false;
  const nodes = state.audio[type].nodes;
  if (!nodes) return;
  
  if (type === 'binaural') {
    nodes.oscL.stop();
    nodes.oscR.stop();
  } else if (type === 'rain') {
    nodes.source.stop();
    nodes.lfo.stop();
  }
  
  nodes.gain.disconnect();
  state.audio[type].nodes = null;
}

// Chime when timer completes
function playChime() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
  osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}
