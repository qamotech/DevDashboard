/**
 * Contractor Tool Belt - Calculators Module
 * Contains formula engines for general contracting estimators and roof pitch analysis.
 */

const Calculators = {
    // 1. Concrete Calculator
    calculateConcrete(type, params) {
        let volumeCuFt = 0;
        const width = parseFloat(params.width) || 0;
        const length = parseFloat(params.length) || 0;
        const thickness = parseFloat(params.thickness) || 0; // in inches for slab, feet for footing
        const height = parseFloat(params.height) || 0;
        const radius = parseFloat(params.radius) || 0;
        const quantity = parseInt(params.quantity) || 1;
        const unitCost = parseFloat(params.unitCost) || 0;

        if (type === 'slab') {
            // thickness is in inches, convert to feet
            volumeCuFt = length * width * (thickness / 12);
        } else if (type === 'footing') {
            volumeCuFt = length * width * thickness; // thickness here is depth in feet
        } else if (type === 'column') {
            volumeCuFt = Math.PI * Math.pow(radius, 2) * height;
        }

        volumeCuFt *= quantity;
        const cubicYards = volumeCuFt / 27;
        const cubicMeters = volumeCuFt * 0.0283168;

        // Bags required
        // An 80lb bag yields ~0.60 cu ft
        // A 60lb bag yields ~0.45 cu ft
        // A 40lb bag yields ~0.30 cu ft
        const bags80 = Math.ceil(volumeCuFt / 0.60);
        const bags60 = Math.ceil(volumeCuFt / 0.45);
        const bags40 = Math.ceil(volumeCuFt / 0.30);

        const totalCost = cubicYards * unitCost;

        return {
            cubicYards: cubicYards.toFixed(2),
            cubicMeters: cubicMeters.toFixed(2),
            bags80,
            bags60,
            bags40,
            totalCost: totalCost.toFixed(2)
        };
    },

    // 2. Drywall Calculator
    calculateDrywall(params) {
        const wallLength = parseFloat(params.wallLength) || 0;
        const wallHeight = parseFloat(params.wallHeight) || 0;
        const ceilingLength = parseFloat(params.ceilingLength) || 0;
        const ceilingWidth = parseFloat(params.ceilingWidth) || 0;
        const sheetSize = params.sheetSize || '4x8'; // '4x8' or '4x12'
        const wasteFactor = 1 + (parseFloat(params.waste) || 10) / 100;
        const unitCost = parseFloat(params.unitCost) || 0;

        const wallArea = wallLength * wallHeight;
        const ceilingArea = ceilingLength * ceilingWidth;
        const totalArea = (wallArea + ceilingArea) * wasteFactor;

        const sheetArea = sheetSize === '4x12' ? 48 : 32;
        const sheetsNeeded = Math.ceil(totalArea / sheetArea);

        // Drywall accessories estimators
        // 1 gallon of joint compound per 100 sq ft
        const jointCompoundGallons = Math.ceil(totalArea / 100 * 10) / 10;
        // Joint tape: ~3.75 ft of tape per sq ft of drywall
        const jointTapeFeet = Math.round(totalArea * 3.75);
        // Screws: ~1 lb of drywall screws per 300 sq ft of drywall
        const screwsLbs = Math.ceil(totalArea / 300 * 10) / 10;

        const totalCost = sheetsNeeded * unitCost;

        return {
            totalArea: totalArea.toFixed(0),
            sheetsNeeded,
            jointCompoundGallons,
            jointTapeFeet,
            screwsLbs,
            totalCost: totalCost.toFixed(2)
        };
    },

    // 3. Paint Calculator
    calculatePaint(params) {
        const wallArea = parseFloat(params.wallArea) || 0;
        const doors = parseInt(params.doors) || 0;
        const windows = parseInt(params.windows) || 0;
        const coats = parseInt(params.coats) || 2;
        const coverage = parseFloat(params.coverage) || 350; // sq ft per gallon
        const wasteFactor = 1 + (parseFloat(params.waste) || 10) / 100;
        const paintCost = parseFloat(params.paintCost) || 0;

        // Deductions
        const netArea = Math.max(0, wallArea - (doors * 20) - (windows * 15));
        const totalArea = netArea * coats * wasteFactor;
        const gallonsPaint = Math.max(0.5, Math.ceil((totalArea / coverage) * 10) / 10);

        // Trim paint estimation (approx 1 gallon per 5 gallons of wall paint)
        const gallonsTrim = Math.max(0.5, Math.ceil((gallonsPaint * 0.2) * 10) / 10);

        const totalCost = (gallonsPaint * paintCost) + (gallonsTrim * paintCost * 0.8); // trim paint slightly cheaper or same

        return {
            netArea: netArea.toFixed(0),
            totalArea: totalArea.toFixed(0),
            gallonsPaint: gallonsPaint.toFixed(1),
            gallonsTrim: gallonsTrim.toFixed(1),
            totalCost: totalCost.toFixed(2)
        };
    },

    // 4. Framing Stud Calculator
    calculateFraming(params) {
        const wallLength = parseFloat(params.wallLength) || 0;
        const spacing = parseFloat(params.spacing) || 16; // spacing in inches (12, 16, 24)
        const plates = parseInt(params.plates) || 3; // usually 3 (1 bottom, 2 top)
        const wasteFactor = 1 + (parseFloat(params.waste) || 10) / 100;
        const studCost = parseFloat(params.studCost) || 0;

        // Studs count
        // Standard formula: (Wall Length in feet * 12 / Stud Spacing) + 1 stud per corner/intersection
        // Plus plates: Wall Length / Stud length (assumed 8 or 10ft) * plate multiplier
        const baseStuds = (wallLength * 12) / spacing;
        const extraStudsForJunctions = Math.ceil(wallLength / 10) + 2; // approximation for corners
        const studsRequired = Math.ceil((baseStuds + extraStudsForJunctions) * wasteFactor);

        // Plates (assuming standard 12ft boards for plates)
        const plateLength = 12;
        const totalPlateLengthNeeded = wallLength * plates;
        const platesRequired = Math.ceil(totalPlateLengthNeeded / plateLength);

        const totalCost = (studsRequired * studCost) + (platesRequired * studCost * 1.2); // plate boards slightly more expensive

        return {
            studsRequired,
            platesRequired,
            totalCost: totalCost.toFixed(2)
        };
    },

    // 5. Flooring Calculator
    calculateFlooring(params) {
        const area = parseFloat(params.area) || 0;
        const wasteFactor = 1 + (parseFloat(params.waste) || 10) / 100;
        const boxSize = parseFloat(params.boxSize) || 20; // sq ft per box
        const costPerSqFt = parseFloat(params.costPerSqFt) || 0;

        const totalArea = area * wasteFactor;
        const boxesNeeded = Math.ceil(totalArea / boxSize);
        const totalCost = boxesNeeded * boxSize * costPerSqFt;

        return {
            actualArea: area.toFixed(1),
            totalArea: totalArea.toFixed(1),
            boxesNeeded,
            totalCost: totalCost.toFixed(2)
        };
    },

    // 6. Roof Pitch Calculator
    calculateRoofPitch(params) {
        // Can input rise & run, pitch ratio (rise over 12 run), or degrees
        let rise = parseFloat(params.rise) || 0;
        let run = parseFloat(params.run) || 12;
        let angleDeg = 0;
        let pitchNumerator = 0;

        if (params.inputType === 'riseRun') {
            angleDeg = Math.atan(rise / run) * (180 / Math.PI);
            pitchNumerator = (rise / run) * 12;
        } else if (params.inputType === 'pitchVal') {
            pitchNumerator = parseFloat(params.pitchVal) || 4;
            rise = pitchNumerator;
            run = 12;
            angleDeg = Math.atan(rise / run) * (180 / Math.PI);
        } else if (params.inputType === 'degrees') {
            angleDeg = parseFloat(params.degrees) || 18.4;
            const rad = angleDeg * (Math.PI / 180);
            run = 12;
            rise = Math.tan(rad) * run;
            pitchNumerator = rise;
        }

        // Rafter calculation
        const diagonalLength = Math.sqrt(Math.pow(rise, 2) + Math.pow(run, 2));
        
        // Dynamic rafter count
        // Spacing in inches (e.g. 16 or 24 O.C.)
        const spacing = parseFloat(params.rafterSpacing) || 16;
        const roofLength = parseFloat(params.roofLength) || 20; // building length in feet
        const rafterCount = (Math.ceil((roofLength * 12) / spacing) + 1) * 2; // times 2 for both sides of A-frame

        return {
            rise: rise.toFixed(2),
            run: run.toFixed(2),
            angle: angleDeg.toFixed(1),
            pitchFraction: `${Math.round(pitchNumerator)}/12`,
            pitchVal: pitchNumerator.toFixed(2),
            rafterLength: diagonalLength.toFixed(2),
            rafterCount,
            totalCost: (rafterCount * (parseFloat(params.rafterCost) || 15)).toFixed(2)
        };
    },

    // Generates a responsive SVG markup representing the roof profile
    generateRoofSVG(rise, run, rafterLength, angle) {
        // Scale dimensions to fit a 320x180 SVG box
        const svgWidth = 320;
        const svgHeight = 180;
        
        // Let's normalize rise and run so it fits nicely
        // Assume run is the half-span. The span is 2 * run.
        const span = run * 2;
        const maxDim = Math.max(span, rise);
        const scale = 220 / (maxDim || 1); // scale factor (prevent divide by 0)
        
        const wHalf = run * scale;
        const h = rise * scale;
        
        const centerX = svgWidth / 2;
        const baseY = svgHeight - 45;
        
        const leftX = centerX - wHalf;
        const rightX = centerX + wHalf;
        const topY = baseY - h;
        
        return `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="roof-pitch-svg" style="width: 100%; height: auto;">
                <defs>
                    <pattern id="pitchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pitchGrid)" rx="6"/>

                <!-- Ground/Base plate reference -->
                <line x1="${leftX - 15}" y1="${baseY}" x2="${rightX + 15}" y2="${baseY}" stroke="#555" stroke-dasharray="3,3" stroke-width="1.5" />

                <!-- Span (Run * 2) line -->
                <line x1="${leftX}" y1="${baseY + 12}" x2="${rightX}" y2="${baseY + 12}" stroke="var(--accent-cyan)" stroke-width="1" />
                <path d="M ${leftX} ${baseY+8} L ${leftX} ${baseY+16} M ${rightX} ${baseY+8} L ${rightX} ${baseY+16}" stroke="var(--accent-cyan)" stroke-width="1"/>
                <text x="${centerX}" y="${baseY + 28}" fill="var(--accent-cyan)" font-size="10" font-family="monospace" text-anchor="middle">SPAN: ${(run*2).toFixed(1)}'</text>

                <!-- Rise line -->
                <line x1="${centerX}" y1="${baseY}" x2="${centerX}" y2="${topY}" stroke="var(--accent-orange)" stroke-width="1.5" stroke-dasharray="2,2"/>
                <text x="${centerX + 8}" y="${topY + h/2 + 4}" fill="var(--accent-orange)" font-size="9" font-family="monospace" text-anchor="start">RISE: ${rise}'</text>

                <!-- Run line (one half) -->
                <line x1="${leftX}" y1="${baseY}" x2="${centerX}" y2="${baseY}" stroke="#888" stroke-width="1.5" />
                <text x="${leftX + wHalf/2}" y="${baseY - 6}" fill="#888" font-size="9" font-family="monospace" text-anchor="middle">RUN: ${run}'</text>

                <!-- Rafters -->
                <line x1="${leftX}" y1="${baseY}" x2="${centerX}" y2="${topY}" stroke="var(--accent-yellow)" stroke-width="3" stroke-linecap="round"/>
                <line x1="${rightX}" y1="${baseY}" x2="${centerX}" y2="${topY}" stroke="var(--accent-yellow)" stroke-width="3" stroke-linecap="round"/>

                <!-- Angle display indicator -->
                <path d="M ${leftX + 20} ${baseY} A 20 20 0 0 0 ${leftX + 20 - (20 - 20*Math.cos(angle*Math.PI/180))} ${baseY - 20*Math.sin(angle*Math.PI/180)}" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5" />
                <text x="${leftX + 24}" y="${baseY - 6}" fill="var(--accent-cyan)" font-size="9" font-family="monospace">${angle}°</text>

                <!-- Rafter label -->
                <text x="${leftX + wHalf/2 - 10}" y="${topY + h/2 - 10}" fill="var(--accent-yellow)" font-size="10" font-family="monospace" transform="rotate(${-angle}, ${leftX + wHalf/2}, ${topY + h/2})" text-anchor="middle">RAFTER: ${rafterLength}'</text>

                <!-- Peak Ridge and Joist details -->
                <circle cx="${centerX}" cy="${topY}" r="4" fill="var(--accent-orange)"/>
                <circle cx="${leftX}" cy="${baseY}" r="3" fill="#aaa"/>
                <circle cx="${rightX}" cy="${baseY}" r="3" fill="#aaa"/>
            </svg>
        `;
    }
};

window.Calculators = Calculators;
