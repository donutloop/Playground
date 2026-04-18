// YouTube Shorts dimensions (9:16)
let w = 1080;
let h = 1920;

// Recursion settings
const maxDepth = 13;          // increased depth for more detail
let branchLength = 140;       // initial trunk length
let angleBase = Math.PI / 5;  // base angle for sway

function setup() {
    createCanvas(w, h);
    angleMode(RADIANS);
    // No seed for randomness to keep animation smooth
}

function draw() {
    // Background gradient (dark to slightly lighter)
    const gradientTop = color(10, 10, 30);
    const gradientBottom = color(30, 20, 40);
    for (let y = 0; y < height; y++) {
        const inter = map(y, 0, height, 0, 1);
        const c = lerpColor(gradientTop, gradientBottom, inter);
        stroke(c);
        line(0, y, width, y);
    }

    // ---- Draw the tree in the top 3/4 ----
    push();
    translate(width / 2, height * 0.78); // slightly lower base
    drawBranch(branchLength, 0);
    pop();

    // ---- Overlay text in the bottom 1/4 ----
    fill(255, 230);
    noStroke();
    textSize(56);
    textAlign(CENTER, CENTER);
    text("Fractal Tree", width / 2, height * 0.9); // centered in bottom quarter
}

/**
 * Recursively draws a branch.
 * @param {number} len - length of this branch
 * @param {number} depth - current recursion depth (0 = trunk)
 */
function drawBranch(len, depth) {
    if (depth > maxDepth) return;

    // Stroke weight gets thinner with depth, with a minimum
    const sw = map(depth, 0, maxDepth, 5, 0.3);
    strokeWeight(sw);

    // Color interpolation: brown trunk → green leaves → slight yellow at tips
    const brown = color(101, 67, 33);
    const greenColor = color(34, 139, 34);
    const yellow = color(255, 215, 0);
    // Use two-stage interpolation: trunk to mid, then mid to tip
    let inter = map(depth, 0, maxDepth, 0, 1);
    let c;
    if (depth < maxDepth * 0.6) {
        c = lerpColor(brown, greenColor, inter / 0.6);
    } else {
        c = lerpColor(greenColor, yellow, (inter - 0.6) / 0.4);
    }
    stroke(c);

    // Add a subtle glow effect by drawing extra strokes with low alpha
    for (let i = 1; i <= 3; i++) {
        const glowAlpha = map(i, 1, 3, 30, 5);
        strokeRed = red(c);
        strokeGreen = green(c);
        strokeBlue = blue(c);
        stroke(strokeRed, strokeGreen, strokeBlue, glowAlpha);
        strokeWeight(sw + i * 0.5);
        line(0, 0, 0, -len);
    }
    // Reset stroke weight and color for the main line
    strokeWeight(sw);
    stroke(c);

    // Animated sway: each depth gets a different phase and some noise for organic feel
    const timeScale = 0.001;
    const baseSway = sin(millis() * timeScale + depth * 0.7) * 0.4;
    const noiseSway = noise(depth * 0.5, millis() * 0.0005) * 0.2;
    const sway = baseSway + noiseSway;
    const angle = angleBase * sway;

    // Draw the current branch
    line(0, 0, 0, -len);
    translate(0, -len);

    // Add leaves at the tips (when near max depth)
    if (depth >= maxDepth - 2) {
        noStroke();
        fill(144, 238, 144, 200); // light green with transparency
        const leafSize = map(depth, maxDepth - 2, maxDepth, 4, 8);
        ellipse(0, 0, leafSize, leafSize * 0.6);
    }

    // Recurse left and right with slight randomness in length factor
    const lengthFactor = 0.68 + random(-0.05, 0.05); // vary between 0.63 and 0.73
    const newLen = len * lengthFactor;

    push();
    rotate(angle);
    drawBranch(newLen, depth + 1);
    pop();

    push();
    rotate(-angle);
    drawBranch(newLen, depth + 1);
    pop();
}