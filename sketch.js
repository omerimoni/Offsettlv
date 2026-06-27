let song;
let fft;

let blocks = [];
const numBlocks = 18;
let smoothedMouseX = 0;
let distortionIntensity = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(2);

    fft = new p5.FFT();

    // Load sound asynchronously so it doesn't block the sketch from starting
    song = loadSound("./song/Don't Stop 'Til You Get Enough (2003 Edit) [m_O25dOQpCQ].mp3",
        () => {
            console.log("🔊 Audio loaded successfully!");
            fft.setInput(song);
        },
        (err) => {
            console.warn("⚠️ Audio failed to decode or load (this is expected in some sandboxed browsers like Chromium):", err);
        }
    );

    smoothedMouseX = width / 2;
    generateNewBlocks();

    frameRate(60); // Run at 60 FPS for smooth mouse interaction
}

function draw() {
    // 1. Audio analysis
    if (song && song.isLoaded()) {
        fft.analyze();
    }

    // 2. Regenerate blocks at 2 FPS (every 30 frames at 60 FPS)
    if (frameCount % 30 === 0) {
        generateNewBlocks();
    }

    background("#FE62F9");

    // 3. Smooth mouse position (chase speed increased to 0.15)
    smoothedMouseX = lerp(smoothedMouseX, mouseX, 0.15);

    // Fade distortion intensity based on cursor presence on canvas
    let isMouseOnScreen = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
    let targetIntensity = isMouseOnScreen ? 1 : 0;
    distortionIntensity = lerp(distortionIntensity, targetIntensity, 0.1);

    // Parallax displacement for blocks
    let blockParallax = map(smoothedMouseX, 0, width, -10, 10);

    // Render Blocks
    noStroke();
    for (let i = 0; i < blocks.length; i++) {
        fill(blocks[i].color);
        rect(blocks[i].x + blockParallax, blocks[i].y, blocks[i].w, blocks[i].h);
    }

    // 4. Render vertical scanlines with mouse lens distortion
    let lineParallax = map(smoothedMouseX, 0, width, -15, 15);

    // Scanlines are placed every 6px (from x = -30 to width + 30 to prevent border issues)
    for (let x = -30; x < width + 30; x += 6) {
        let lineX = x + lineParallax;
        let distance = abs(lineX - smoothedMouseX);

        let displacement = 0;
        let weight = 0.5; // Thinner default line width (0.5px)
        let opacity = 90;

        // Lens distortion effect chasing the smoothed cursor position (within 30px)
        if (distance < 30) {
            let direction = (lineX < smoothedMouseX) ? -1 : 1;
            displacement = map(distance, 0, 30, 12, 0) * direction * distortionIntensity;
            
            let weightAddition = map(distance, 0, 30, 1.5, 0) * distortionIntensity;
            weight = 0.5 + weightAddition; // maps up to 2.0px when fully active
            
            let activeOpacity = map(distance, 0, 30, 160, 90);
            opacity = lerp(90, activeOpacity, distortionIntensity);
        }

        stroke(0, opacity);
        strokeWeight(weight);
        line(lineX + displacement, 0, lineX + displacement, height);
    }
}

function generateNewBlocks() {
    blocks = [];
    for (let i = 0; i < numBlocks; i++) {
        blocks.push({
            x: floor(random(width) / 40) * 40,
            y: floor(random(height) / 40) * 40,
            w: floor(random(3, 10)) * 40,
            h: floor(random(2, 8)) * 40,
            color: random(["#3941F9", "#04E5FE"])
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Global functions for HTML DOM to hook into
window.toggleOffsetAudio = function () {
    userStartAudio(); // Resumes Web Audio context if blocked
    if (!song || !song.isLoaded()) return false;

    if (song.isPlaying()) {
        song.pause();
        return false;
    } else {
        song.play();
        return true;
    }
};

window.isOffsetAudioPlaying = function () {
    return song && song.isLoaded() && song.isPlaying();
};
