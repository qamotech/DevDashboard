/**
 * Contractor Tool Belt - Sensors & Interactive Instruments
 * Implements Bubble Level, Plumb Bob, and Flashlight widgets.
 */

class ContractorSensors {
    constructor() {
        // State
        this.pitch = 0; // x-axis tilt
        this.roll = 0;  // y-axis tilt
        this.calibratedPitch = 0;
        this.calibratedRoll = 0;
        
        // Physics for Plumb Bob
        this.bobAngle = 0;
        this.bobAngularVelocity = 0;
        this.bobDamping = 0.96; // drag
        this.bobLength = 120; // visual length
        
        // Device Sensor Flag
        this.sensorsActive = false;
        this.levelInterval = null;

        // Flashlight State
        this.flashlightOn = false;
        this.stream = null;
    }

    init() {
        this.setupDeviceOrientation();
        this.startBobPhysicsLoop();
    }

    // Set up Device Orientation sensors if supported
    setupDeviceOrientation() {
        if (window.DeviceOrientationEvent) {
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // We'll prompt the user with a button in the UI
            } else {
                window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
                this.sensorsActive = true;
            }
        }
    }

    requestSensorPermission(callback) {
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
                        this.sensorsActive = true;
                        if (callback) callback(true);
                    } else {
                        if (callback) callback(false);
                    }
                })
                .catch(err => {
                    console.error('Sensor permission error:', err);
                    if (callback) callback(false);
                });
        } else {
            // Already active or unsupported
            if (callback) callback(this.sensorsActive);
        }
    }

    handleOrientation(event) {
        // beta: front-back tilt (-180 to 180)
        // gamma: left-right tilt (-90 to 90)
        if (event.beta !== null) this.pitch = event.beta;
        if (event.gamma !== null) this.roll = event.gamma;
    }

    calibrate() {
        this.calibratedPitch = this.pitch;
        this.calibratedRoll = this.roll;
        this.triggerSound('calibrate');
    }

    resetCalibration() {
        this.calibratedPitch = 0;
        this.calibratedRoll = 0;
    }

    getAngles() {
        // Calibrated values
        let p = this.pitch - this.calibratedPitch;
        let r = this.roll - this.calibratedRoll;
        
        // Clamp to logical limits
        if (p > 180) p -= 360;
        if (p < -180) p += 360;
        if (r > 90) r -= 180;
        if (r < -90) r += 180;

        return {
            pitch: Math.min(Math.max(p, -90), 90),
            roll: Math.min(Math.max(r, -90), 90),
            rawPitch: this.pitch,
            rawRoll: this.roll
        };
    }

    // Plumb Bob physics simulation (swinging string)
    startBobPhysicsLoop() {
        const fps = 60;
        const gravity = 0.4;
        
        this.levelInterval = setInterval(() => {
            const { pitch, roll } = this.getAngles();
            
            // The gravity vector affects the Bob angle based on the device roll
            // Target angle based on device roll
            const targetAngle = -roll * (Math.PI / 180);
            
            // Torque acting on the plumb bob
            const restoringTorque = -Math.sin(this.bobAngle - targetAngle) * gravity;
            
            this.bobAngularVelocity += restoringTorque;
            this.bobAngularVelocity *= this.bobDamping;
            this.bobAngle += this.bobAngularVelocity;
            
            // Render the widgets
            this.updateLevelVisuals();
            this.updatePlumbBobVisuals();
        }, 1000 / fps);
    }

    updateLevelVisuals() {
        const { pitch, roll } = this.getAngles();
        
        // Bullseye level coordinates (Center is 0,0)
        // Max tilt represented visually is ~15 degrees
        const maxVisualAngle = 15;
        const containerSize = 150; // bullseye diameter
        const center = containerSize / 2;
        const maxRadius = center - 12; // boundary for bubble center
        
        // Normalize roll/pitch to radius
        const magnitude = Math.hypot(roll, pitch);
        const angle = Math.atan2(pitch, roll);
        
        const visualMag = Math.min(magnitude / maxVisualAngle, 1) * maxRadius;
        
        const bubbleX = center + Math.cos(angle) * visualMag;
        const bubbleY = center + Math.sin(angle) * visualMag;
        
        // Update Bullseye Bubble
        const bubbleEl = document.getElementById('level-bullseye-bubble');
        if (bubbleEl) {
            bubbleEl.style.left = `${bubbleX}px`;
            bubbleEl.style.top = `${bubbleY}px`;
        }

        // Horizontal Vial bubble position
        // Only uses roll (x-axis tilt)
        const vialW = 180;
        const bubbleVialX = (vialW / 2) + Math.min(Math.max(roll / maxVisualAngle, -1), 1) * (vialW / 2 - 12);
        const vialBubbleEl = document.getElementById('level-vial-horizontal-bubble');
        if (vialBubbleEl) {
            vialBubbleEl.style.left = `${bubbleVialX}px`;
        }

        // Vertical Plumb Vial bubble position
        // Only uses pitch (y-axis tilt)
        const vialH = 180;
        const bubbleVialY = (vialH / 2) + Math.min(Math.max(pitch / maxVisualAngle, -1), 1) * (vialH / 2 - 12);
        const vialPlumbBubbleEl = document.getElementById('level-vial-vertical-bubble');
        if (vialPlumbBubbleEl) {
            vialPlumbBubbleEl.style.top = `${bubbleVialY}px`;
        }

        // Text printouts
        const textEl = document.getElementById('level-angle-text');
        if (textEl) {
            textEl.textContent = `PITCH: ${pitch.toFixed(1)}° | ROLL: ${roll.toFixed(1)}°`;
        }

        // Level detection sound triggering
        const totalTilt = Math.hypot(pitch, roll);
        const levelTolerance = 0.3; // extremely close to 0
        const widgetCard = document.querySelector('.level-instrument-panel');

        if (totalTilt <= levelTolerance) {
            if (widgetCard && !widgetCard.classList.contains('perfectly-level')) {
                widgetCard.classList.add('perfectly-level');
                this.triggerSound('level_hit');
            }
        } else {
            if (widgetCard) {
                widgetCard.classList.remove('perfectly-level');
            }
        }
    }

    updatePlumbBobVisuals() {
        const svg = document.getElementById('plumb-bob-svg');
        if (!svg) return;
        
        const line = document.getElementById('plumb-bob-line');
        const weight = document.getElementById('plumb-bob-weight');
        const text = document.getElementById('plumb-bob-angle-text');
        
        const startX = 100; // SVG center
        const startY = 15;
        
        const endX = startX + Math.sin(this.bobAngle) * this.bobLength;
        const endY = startY + Math.cos(this.bobAngle) * this.bobLength;
        
        if (line) {
            line.setAttribute('x2', endX);
            line.setAttribute('y2', endY);
        }
        
        if (weight) {
            // Shift coordinates for visual brass cone
            // Simple triangle points or circle center
            weight.setAttribute('cx', endX);
            weight.setAttribute('cy', endY);
        }
        
        if (text) {
            const angleDeg = (this.bobAngle * (180 / Math.PI));
            text.textContent = `DEV: ${Math.abs(angleDeg).toFixed(1)}° ${angleDeg > 0 ? 'RIGHT' : angleDeg < 0 ? 'LEFT' : ''}`;
        }
    }

    nudgeBob(dir) {
        // Desktop test simulation nudge
        this.bobAngularVelocity += dir * 0.15;
        this.triggerSound('nudge');
    }

    simulateTilt(axis, val) {
        // Simulates manual sliders for desktop
        if (axis === 'pitch') {
            this.pitch = parseFloat(val);
        } else if (axis === 'roll') {
            this.roll = parseFloat(val);
        }
    }

    // Toggle screen flashlight / camera LED torch
    async toggleFlashlight() {
        this.flashlightOn = !this.flashlightOn;
        this.triggerSound('switch');

        const flashlightBtn = document.getElementById('flashlight-toggle-btn');
        const overlay = document.getElementById('flashlight-screen-overlay');

        if (this.flashlightOn) {
            if (flashlightBtn) flashlightBtn.classList.add('active');
            
            // Try to toggle actual camera torch if available
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const track = this.stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                
                if (capabilities.torch) {
                    await track.applyConstraints({
                        advanced: [{ torch: true }]
                    });
                } else {
                    // Fallback to screen flash
                    if (overlay) overlay.style.display = 'block';
                }
            } catch (err) {
                console.warn('Camera flash not supported, falling back to full screen glow:', err);
                if (overlay) overlay.style.display = 'block';
            }
        } else {
            if (flashlightBtn) flashlightBtn.classList.remove('active');
            if (overlay) overlay.style.display = 'none';

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        }
    }

    triggerSound(action) {
        if (window.App && window.App.playSound) {
            window.App.playSound(action);
        }
    }
    
    destroy() {
        if (this.levelInterval) {
            clearInterval(this.levelInterval);
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

window.ContractorSensors = new ContractorSensors();
