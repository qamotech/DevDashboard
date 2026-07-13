/**
 * BRUCE LEE INTERACTIVE STUDIO - CORE CORE ENGINE
 * Cybernetic Movement Archive // JKD-01
 */

// ==========================================
// 1. DATA REPOSITORIES (Static Content)
// ==========================================
const DISCIPLINARY_DATA = {
    "Wing Chun": {
        description: "A compact Southern Chinese system that shaped Lee early: centerline control, trapping, short power, sensitivity, and direct hand paths.",
        focus: "Hold structure while keeping the hands alive. Read pressure through contact and return to the centerline.",
        breakdown: "Root stance, guard shape, elbow position, and quiet control before speed.",
        stats: { speed: 76, power: 72, range: 48, flow: 94 },
        moves: ["Siu Nim Tao", "Tan Sao Deflection", "Chi Sao Sensitivity", "Bong Sao Yield", "Muk Yan Jong Alignment", "Lin Wan Kuen Power"]
    },
    "Western Boxing": {
        description: "Modern Western pugilism utilizing sophisticated footwork, head movement, combinations, and efficient weight transfer.",
        focus: "Evasive slipping, rhythmic shifting, and exploiting open angles with high velocity punches.",
        breakdown: "Lead hand jab snap, kinetic kinetic hip rotation on cross, tight guard recovery.",
        stats: { speed: 90, power: 82, range: 60, flow: 78 },
        moves: ["Lead Snap Jab", "Slipping Counter", "Catch and Return", "Rhythmic Pivot", "Liver Shot", "Shifting Cross"]
    },
    "Fencing": {
        description: "Western blade combat specializing in precise distance management, explosive direct entries, and rapid interception.",
        focus: "Using the lead hand like a rapier. Deception, drawing reactions, and instantaneous stop-hitting.",
        breakdown: "Lead foot push-off, non-telegraphed forward launch, keeping the line closed.",
        stats: { speed: 96, power: 65, range: 88, flow: 80 },
        moves: ["Stop-Hit Entry", "Feint and Lunge", "Progressive Indirect Attack", "En Garde Mobility", "Riposte Timing"]
    },
    "Judo and Jujutsu": {
        description: "Grappling arts focused on maximizing leverage, balance disruption, dynamic body off-balancing (Kuzushi), and controlling clinches.",
        focus: "Yielding to incoming force to redirect the opponent's center of gravity into a throw or sweep.",
        breakdown: "Underhook positioning, hip-to-hip connection, low solid base foundation.",
        stats: { speed: 55, power: 85, range: 35, flow: 88 },
        moves: ["Kuzushi Off-balancing", "Osoto Gari Sweep", "Frame Break Escape", "Clinch Control Dominance", "Hip Reversal"]
    },
    "Wrestling": {
        description: "A continuous pressure-based grappling art emphasizing level changes, structural takedowns, and relentless top control.",
        focus: "Driving weight through lines of structural weakness. Heavy hand fighting and dominant hand-fighting tie-ups.",
        breakdown: "Deep level drop, straight spine alignment during drive, explosive hip extension.",
        stats: { speed: 68, power: 90, range: 40, flow: 70 },
        moves: ["Level Change Blast", "Hand Fighting Tie-up", "Sprawl Resubmission", "Underhook Drive", "Ankle Pick Entry"]
    },
    "Karate": {
        description: "A striking art utilizing explosive linear bursts, crisp structural frames, and deep, rooted chambered positioning.",
        focus: "Closing distance cleanly on a direct track with total muscular recruitment at the terminal point.",
        breakdown: "Rear-foot drive mechanics, hip snapping on termination, immediate guard recovery.",
        stats: { speed: 82, power: 88, range: 70, flow: 62 },
        moves: ["Gyaku Zuki Reverse Punch", "Mae Geri Front Snapping Kick", "Hikite Chamber Snap", "Linear Blitz Entry"]
    },
    "Taekwondo": {
        description: "An dynamic long-range combat system focused heavily on high-speed, flexible kicking combinations and fluid aerial movement.",
        focus: "Dominating space beyond hand range using active hip rotation and multiple kicking variations.",
        breakdown: "Pivot leg positioning, high chamber elevation, rapid knee snap recovery.",
        stats: { speed: 88, power: 80, range: 95, flow: 74 },
        moves: ["Fast Kick Intercept", "Spinning Hook Counter", "Chamber Feint Drive", "Axe Kick Clearance", "Cut Kick Defensive Push"]
    },
    "Tai Chi": {
        description: "Internal martial art emphasizing continuous motion, complete muscular relaxation, structural softness, and continuous structural alignment.",
        focus: "Neutralizing direct force smoothly via circular redirection without opposing strength with strength.",
        breakdown: "Sinking the mass into the heels, expanding the posture outward, maintaining absolute continuous slow flow.",
        stats: { speed: 40, power: 60, range: 50, flow: 98 },
        moves: ["Ward Off Circular Frame", "Rollback Force Redirection", "Single Whip Structure", "Cloud Hands Transit"]
    },
    "Filipino Martial Arts": {
        description: "Weapon-based and empty-hand combative logic prioritizing angular patterns, zoning footwork, and limb destruction tactics.",
        focus: "Deflecting strikes cleanly while checking the opponent's weapons system to gain superior tactical geometry.",
        breakdown: "Triangle zoning patterns, live hand monitoring, striking across diagonal lines.",
        stats: { speed: 85, power: 74, range: 75, flow: 90 },
        moves: ["Triangle Zoning Footwork", "Gunting Limb Destruction", "Inside Deflection Check", "Sectoring Entry Drill"]
    }
};

const PRINCIPLE_LENSES = {
    interception: { entry: "Stop-hit or intercept the opponent's movement at its point of preparation.", structure: "Lead hand and lead foot forward to control the closest target line.", finish: "End the engagement instantly at the moment of entry." },
    economy: { entry: "Eliminate all telegraphic movement and unnecessary windups.", structure: "Maintain the shortest distance path to the target without extra motions.", finish: "Strike from exactly where your hand is without loading back." },
    centerline: { entry: "Protect the direct geometric route between your body and the opponent's.", structure: "Elbows, knees, and shoulders organize tightly around the middle axis.", finish: "Finish by taking the center back definitively after contact." },
    rhythm: { entry: "Broken rhythm entry—disrupt their established movement cadence.", structure: "Fluid weight shifts that mask your true offensive or defensive timing.", finish: "Explode out of an apparent moment of rest or structural freeze." },
    adaptability: { entry: "Pliant response—formless application based entirely on what you encounter.", structure: "Fluidly transition structures from low to high as the pressure morphs.", finish: "Flow smoothly from striking to trapping or grappling options seamlessly." },
    structure: { entry: "Rooted extension that aligns the skeleton with target impact vectors.", structure: "Sunk hips, stable kinetic core connectivity, and braced bone alignments.", finish: "Deliver maximum force transfer supported cleanly by your base." }
};

// ==========================================
// 2. STATE MANAGEMENT SYSTEM
// ==========================================
const StudioState = {
    activeArt: "Wing Chun",
    activeLens: "interception",
    currentForm: [],
    
    // Telemetry Trackers
    xp: 25,
    level: 1,
    sessionsCompleted: 1,
    fastestReaction: 534, // ms
    
    // System Timers & Runs
    tempoTimerInterval: null,
    tempoTimeRemaining: 30,
    isTempoRunning: false,
    
    reactionRunActive: false,
    reactionStartTime: null,
    reactionHits: 0,
    reactionTotalTimes: 0,
    reactionTargetIndex: null,
    reactionZones: ["HIGH LEFT", "CENTERLINE", "HIGH RIGHT", "LOW LEFT", "BODY LINE", "LOW RIGHT"]
};

// ==========================================
// 3. CORE CORE INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    setupEventListeners();
    updateArtUI(StudioState.activeArt);
    updateLensUI(StudioState.activeLens);
    syncTelemetryUI();
    renderDynamicStyleMixer();
}

// ==========================================
// 4. EVENT LISTENERS SETUP
// ==========================================
function setupEventListeners() {
    // Discipline Navigation Buttons
    document.querySelectorAll("[data-art-select]").forEach(button => {
        button.addEventListener("click", (e) => {
            const artName = e.currentTarget.getAttribute("data-art-select");
            if (DISCIPLINARY_DATA[artName]) {
                StudioState.activeArt = artName;
                updateArtUI(artName);
                renderDynamicStyleMixer(); // Refresh layout matches
            }
        });
    });

    // Principle Lens Buttons
    document.querySelectorAll("[data-lens-select]").forEach(button => {
        button.addEventListener("click", (e) => {
            const lensName = e.currentTarget.getAttribute("data-lens-select");
            if (PRINCIPLE_LENSES[lensName]) {
                StudioState.activeLens = lensName;
                updateLensUI(lensName);
            }
        });
    });

    // Mixer Dropdowns Change Listeners
    const baseSelector = document.getElementById("mixer-base-select");
    const pressureSelector = document.getElementById("mixer-pressure-select");
    if (baseSelector && pressureSelector) {
        baseSelector.addEventListener("change", renderDynamicStyleMixer);
        pressureSelector.addEventListener("change", renderDynamicStyleMixer);
    }

    // Form Builder Mechanics
    const addMoveBtn = document.getElementById("btn-add-move");
    const nextStepBtn = document.getElementById("btn-next-step");
    const clearFormBtn = document.getElementById("btn-clear-form");

    if (addMoveBtn) addMoveBtn.addEventListener("click", handleAddCurrentMove);
    if (nextStepBtn) nextStepBtn.addEventListener("click", handleNextFormStep);
    if (clearFormBtn) clearFormBtn.addEventListener("click", handleClearForm);

    // Tempo Round Components
    const startTempoBtn = document.getElementById("btn-start-tempo");
    const resetTempoBtn = document.getElementById("btn-reset-tempo");

    if (startTempoBtn) startTempoBtn.addEventListener("click", toggleTempoTimer);
    if (resetTempoBtn) resetTempoBtn.addEventListener("click", resetTempoTimer);

    // Reaction Engine Buttons
    const startReactionBtn = document.getElementById("btn-start-reaction");
    if (startReactionBtn) startReactionBtn.addEventListener("click", startReactionRun);

    document.querySelectorAll("[data-reaction-zone]").forEach(zoneBtn => {
        zoneBtn.addEventListener("click", (e) => {
            handleZoneStrike(e.currentTarget.getAttribute("data-reaction-zone"));
        });
    });

    // Protocol System Generator
    const generateProtocolBtn = document.getElementById("btn-generate-protocol");
    if (generateProtocolBtn) generateProtocolBtn.addEventListener("click", generateDynamicProtocol);
    
    // Quick Controls Global
    const resetGlobalBtn = document.getElementById("btn-global-reset");
    if (resetGlobalBtn) resetGlobalBtn.addEventListener("click", resetStudioGlobal);
}

// ==========================================
// 5. INTERFACE UPDATE REFACTOR ROUTINES
// ==========================================

function syncTelemetryUI() {
    // Synchronize XP Metrics
    const xpText = document.getElementById("ui-xp-text");
    const xpProgress = document.getElementById("ui-xp-progress-bar");
    const studioLevel = document.getElementById("ui-studio-level");
    
    if (xpText) xpText.textContent = `${StudioState.xp} / 100 XP`;
    if (xpProgress) xpProgress.style.width = `${StudioState.xp}%`;
    if (studioLevel) studioLevel.textContent = String(StudioState.level).padStart(2, '0');

    // Stats Displays
    const sessionsDisplay = document.getElementById("ui-sessions-completed");
    const recordDisplay = document.getElementById("ui-reaction-record");

    if (sessionsDisplay) sessionsDisplay.textContent = StudioState.sessionsCompleted;
    if (recordDisplay) recordDisplay.textContent = `${StudioState.fastestReaction}ms`;
}

function updateArtUI(artName) {
    const art = DISCIPLINARY_DATA[artName];
    if (!art) return;

    // Headings & Text Injection
    const titleEl = document.getElementById("art-display-title");
    const descEl = document.getElementById("art-display-description");
    const focusEl = document.getElementById("art-display-focus");
    const breakdownEl = document.getElementById("art-display-breakdown");

    if (titleEl) titleEl.textContent = artName;
    if (descEl) descEl.textContent = art.description;
    if (focusEl) focusEl.textContent = art.focus;
    if (breakdownEl) breakdownEl.textContent = art.breakdown;

    // Stat Value Rendering (Text and optional CSS bars)
    const stats = ["speed", "power", "range", "flow"];
    stats.forEach(stat => {
        const textEl = document.getElementById(`stat-val-${stat}`);
        const barEl = document.getElementById(`stat-bar-${stat}`);
        if (textEl) textEl.textContent = art.stats[stat];
        if (barEl) barEl.style.width = `${art.stats[stat]}%`;
    });

    // Populate Available Interactive Form Selection Moves Mini Panel
    const movesContainer = document.getElementById("art-available-moves");
    if (movesContainer) {
        movesContainer.innerHTML = "";
        art.moves.forEach(move => {
            const chip = document.createElement("span");
            chip.className = "move-tag-chip";
            chip.textContent = move;
            movesContainer.appendChild(chip);
        });
    }

    // Active Highlight Toggle on Sidebar Buttons
    document.querySelectorAll("[data-art-select]").forEach(btn => {
        if (btn.getAttribute("data-art-select") === artName) {
            btn.classList.add("active-art-selection");
        } else {
            btn.classList.remove("active-art-selection");
        }
    });
}

function updateLensUI(lensName) {
    const lens = PRINCIPLE_LENSES[lensName];
    if (!lens) return;

    const entryEl = document.getElementById("lens-entry-text");
    const structureEl = document.getElementById("lens-structure-text");
    const finishEl = document.getElementById("lens-finish-text");

    if (entryEl) entryEl.textContent = lens.entry;
    if (structureEl) structureEl.textContent = lens.structure;
    if (finishEl) finishEl.textContent = lens.finish;

    // Highlight Toggle Buttons
    document.querySelectorAll("[data-lens-select]").forEach(btn => {
        if (btn.getAttribute("data-lens-select") === lensName) {
            btn.classList.add("active-lens-selection");
        } else {
            btn.classList.remove("active-lens-selection");
        }
    });
}

// ==========================================
// 6. STYLE MIXER SYSTEM
// ==========================================
function renderDynamicStyleMixer() {
    const baseSelect = document.getElementById("mixer-base-select");
    const pressureSelect = document.getElementById("mixer-pressure-select");

    if (!baseSelect || !pressureSelect) return;

    const base = baseSelect.value || StudioState.activeArt;
    const pressure = pressureSelect.value;

    const baseData = DISCIPLINARY_DATA[base];
    const pressureData = DISCIPLINARY_DATA[pressure];

    // Combine strings for execution logic
    const titleCombo = document.getElementById("mixer-combo-title");
    const promptText = document.getElementById("mixer-prompt-output");

    if (titleCombo) titleCombo.textContent = `${base} x ${pressure}`;
    
    if (promptText) {
        const sampleBaseMove = baseData.moves[0];
        const samplePressureMove = pressureData.moves[0] || pressureData.moves[0];
        promptText.textContent = `Use *${sampleBaseMove}* as your primary structure, then aggressively apply *${samplePressureMove}* as structural pressure. Keep the current lens actively operational until distance parameters crack open, then shift to instant optimization.`;
    }

    // Blend Scores Mathematically
    const targetSpeed = Math.round((baseData.stats.speed + pressureData.stats.speed) / 2 * 1.05);
    const targetPower = Math.round((baseData.stats.power + pressureData.stats.power) / 2 * 0.95);
    const targetRange = Math.round((baseData.stats.range + pressureData.stats.range) / 2);
    const targetFlow = Math.round((baseData.stats.flow + pressureData.stats.flow) / 2 * 1.02);

    const scoresDisplay = document.getElementById("mixer-scores-output");
    if (scoresDisplay) {
        scoresDisplay.textContent = `Blend telemetry metrics: speed ${Math.min(targetSpeed, 100)}, power ${Math.min(targetPower, 100)}, range ${Math.min(targetRange, 100)}, flow ${Math.min(targetFlow, 100)}.`;
    }
}

// ==========================================
// 7. INTERACTIVE FORM BUILDER
// ==========================================
function handleAddCurrentMove() {
    const currentArtData = DISCIPLINARY_DATA[StudioState.activeArt];
    // Grab a pseudo-random or sequential move from current art to simulate placement
    const randomMove = currentArtData.moves[Math.floor(Math.random() * currentArtData.moves.length)];
    
    if (StudioState.currentForm.length < 6) {
        StudioState.currentForm.push(randomMove);
        renderFormSequenceUI();
        awardXP(10);
    } else {
        alert("Six-count flow sequence limits maximized. Clear system to map a fresh form configuration.");
    }
}

function handleNextFormStep() {
    if (StudioState.currentForm.length === 0) return;
    
    // Rotate the active element highlighting layout visually
    const items = document.querySelectorAll(".form-step-node");
    let activeIndex = -1;
    
    items.forEach((item, idx) => {
        if (item.classList.contains("active-step-flash")) {
            activeIndex = idx;
        }
    });

    items.forEach(item => item.classList.remove("active-step-flash"));
    
    let nextIndex = activeIndex + 1;
    if (nextIndex >= StudioState.currentForm.length) nextIndex = 0;

    if (items[nextIndex]) {
        items[nextIndex].classList.add("active-step-flash");
    }
}

function handleClearForm() {
    StudioState.currentForm = [];
    renderFormSequenceUI();
}

function renderFormSequenceUI() {
    for (let i = 1; i <= 6; i++) {
        const stepSlot = document.getElementById(`form-step-${i}`);
        if (stepSlot) {
            const moveInSlot = StudioState.currentForm[i - 1];
            if (moveInSlot) {
                stepSlot.textContent = moveInSlot;
                stepSlot.classList.add("populated-node");
            } else {
                stepSlot.textContent = `Step ${i}`;
                stepSlot.classList.remove("populated-node", "active-step-flash");
            }
        }
    }
}

// ==========================================
// 8. TEMPO TIMER MODULE
// ==========================================
function toggleTempoTimer() {
    const startBtn = document.getElementById("btn-start-tempo");
    
    if (StudioState.isTempoRunning) {
        // Halt
        clearInterval(StudioState.tempoTimerInterval);
        StudioState.isTempoRunning = false;
        if (startBtn) startBtn.textContent = "Start";
    } else {
        // Kickoff
        if (StudioState.tempoTimeRemaining <= 0) StudioState.tempoTimeRemaining = 30;
        StudioState.isTempoRunning = true;
        if (startBtn) startBtn.textContent = "Pause";

        StudioState.tempoTimerInterval = setInterval(() => {
            StudioState.tempoTimeRemaining--;
            updateTempoClockUI();

            if (StudioState.tempoTimeRemaining <= 0) {
                clearInterval(StudioState.tempoTimerInterval);
                StudioState.isTempoRunning = false;
                if (startBtn) startBtn.textContent = "Start";
                awardXP(15);
            }
        }, 1000);
    }
}

function resetTempoTimer() {
    clearInterval(StudioState.tempoTimerInterval);
    StudioState.isTempoRunning = false;
    StudioState.tempoTimeRemaining = 30;
    updateTempoClockUI();
    const startBtn = document.getElementById("btn-start-tempo");
    if (startBtn) startBtn.textContent = "Start";
}

function updateTempoClockUI() {
    const clockEl = document.getElementById("tempo-clock-display");
    if (clockEl) clockEl.textContent = String(StudioState.tempoTimeRemaining).padStart(2, '0');
}

// ==========================================
// 9. NEURAL RESPONSE ENGINE (REACTION GRID)
// ==========================================
function startReactionRun() {
    if (StudioState.reactionRunActive) return;

    StudioState.reactionRunActive = true;
    StudioState.reactionHits = 0;
    StudioState.reactionTotalTimes = 0;
    
    updateReactionStatsUI();
    triggerNextReactionTarget();
}

function triggerNextReactionTarget() {
    // Clear active layout markers
    clearReactionTargetHighlights();

    if (StudioState.reactionHits >= 10) {
        // Run completed successfully
        StudioState.reactionRunActive = false;
        const avgScore = Math.round(StudioState.reactionTotalTimes / 10);
        
        if (avgScore < StudioState.fastestReaction) {
            StudioState.fastestReaction = avgScore;
        }
        
        StudioState.sessionsCompleted += 1;
        awardXP(30);
        syncTelemetryUI();
        
        const feedbackEl = document.getElementById("reaction-feedback-signal");
        if (feedbackEl) feedbackEl.textContent = `Protocol finished. Avg Speed: ${avgScore}ms. Telemetry recorded.`;
        return;
    }

    // Pick arbitrary node array sector
    const randomIndex = Math.floor(Math.random() * StudioState.reactionZones.length);
    StudioState.reactionTargetIndex = randomIndex;
    const activeZoneName = StudioState.reactionZones[randomIndex];

    // Light up viewport elements matching name string tags
    const targetButton = document.querySelector(`[data-reaction-zone="${activeZoneName}"]`);
    if (targetButton) {
        targetButton.classList.add("illuminated-target-flash");
    }

    StudioState.reactionStartTime = window.performance.now();
}

function handleZoneStrike(zoneName) {
    if (!StudioState.reactionRunActive) return;

    const expectedZone = StudioState.reactionZones[StudioState.reactionTargetIndex];
    if (zoneName === expectedZone) {
        const strikeTime = window.performance.now();
        const reactionDuration = Math.round(strikeTime - StudioState.reactionStartTime);
        
        StudioState.reactionTotalTimes += reactionDuration;
        StudioState.reactionHits += 1;

        updateReactionStatsUI(reactionDuration);
        triggerNextReactionTarget();
    }
}

function clearReactionTargetHighlights() {
    document.querySelectorAll("[data-reaction-zone]").forEach(btn => {
        btn.classList.remove("illuminated-target-flash");
    });
}

function updateReactionStatsUI(lastDuration = null) {
    const hitsEl = document.getElementById("reaction-telemetry-hits");
    const avgEl = document.getElementById("reaction-telemetry-avg");
    const bestEl = document.getElementById("reaction-telemetry-best");
    const feedbackEl = document.getElementById("reaction-feedback-signal");

    if (hitsEl) hitsEl.textContent = `HITS ${StudioState.reactionHits}/10`;
    
    if (StudioState.reactionHits > 0) {
        const runningAvg = Math.round(StudioState.reactionTotalTimes / StudioState.reactionHits);
        if (avgEl) avgEl.textContent = `AVERAGE ${runningAvg}ms`;
    } else {
        if (avgEl) avgEl.textContent = "AVERAGE --";
    }

    if (bestEl) bestEl.textContent = `BEST ${StudioState.fastestReaction}ms`;
    
    if (feedbackEl) {
        if (lastDuration) {
            feedbackEl.textContent = `Intercept struck cleanly in ${lastDuration}ms!`;
        } else {
            feedbackEl.textContent = "Strike target zones immediately on signal illumination...";
        }
    }
}

// ==========================================
// 10. ADAPTIVE PROTOCOL CIRCUIT SYSTEM
// ==========================================
function generateDynamicProtocol() {
    const primaryArt = document.getElementById("protocol-art-select")?.value || StudioState.activeArt;
    const duration = document.getElementById("protocol-time-select")?.value || "30 minutes";
    const intensity = document.getElementById("protocol-intensity-select")?.value || "Balanced";

    const movesList = DISCIPLINARY_DATA[primaryArt].moves;

    // Build functional blocks
    const step1Name = `Prime: ${movesList[0] || "Stance Preparation"} structural mechanics`;
    const step2Name = `Pattern: ${movesList[1] || "Basic Strike"} direct repetitions`;
    const step3Name = `Pressure: ${movesList[2] || "Sensitivity Mechanics"} with ${intensity.toLowerCase()} timing constraints`;
    const step4Name = `Integrate: Formless tactical adaptation flow loop and core balance reset`;

    // Calculate duration split intervals
    const numericalTime = parseInt(duration);
    const chunkShort = Math.round(numericalTime * 0.2);
    const chunkLong = Math.round(numericalTime * 0.3);

    // Render text block updates
    updateProtocolStepUI("p-step-1", step1Name, `${chunkShort}m`);
    updateProtocolStepUI("p-step-2", step2Name, `${chunkLong}m`);
    updateProtocolStepUI("p-step-3", step3Name, `${chunkLong}m`);
    updateProtocolStepUI("p-step-4", step4Name, `${chunkShort}m`);

    const summaryText = document.getElementById("protocol-summary-output");
    if (summaryText) {
        summaryText.textContent = `A customized ${duration} ${intensity.toLowerCase()} progression circuit calibrated to ${primaryArt}.`;
    }

    awardXP(20);
}

function updateProtocolStepUI(id, text, time) {
    const block = document.getElementById(id);
    if (!block) return;
    
    const textNode = block.querySelector(".step-desc");
    const timeNode = block.querySelector(".step-time");

    if (textNode) textNode.textContent = text;
    if (timeNode) timeNode.textContent = time;
}

// ==========================================
// 11. GAMIFICATION ENGINE & CORE CONTROLS
// ==========================================
function awardXP(amount) {
    StudioState.xp += amount;
    if (StudioState.xp >= 100) {
        StudioState.level += 1;
        StudioState.xp = StudioState.xp - 100;
        triggerLevelUpVisualEffect();
    }
    syncTelemetryUI();
}

function triggerLevelUpVisualEffect() {
    const levelBadge = document.getElementById("ui-studio-level");
    if (levelBadge) {
        levelBadge.classList.add("cyber-glitch-active");
        setTimeout(() => {
            levelBadge.classList.remove("cyber-glitch-active");
        }, 1200);
    }
}

function resetStudioGlobal() {
    // Clear all intervals safely
    clearInterval(StudioState.tempoTimerInterval);

    StudioState.activeArt = "Wing Chun";
    StudioState.activeLens = "interception";
    StudioState.currentForm = [];
    StudioState.xp = 25;
    StudioState.level = 1;
    StudioState.sessionsCompleted = 1;
    StudioState.isTempoRunning = false;
    StudioState.tempoTimeRemaining = 30;
    StudioState.reactionRunActive = false;

    // Synchronize everything completely
    initApp();
    handleClearForm();
    clearReactionTargetHighlights();
    updateReactionStatsUI();
    resetTempoTimer();
}