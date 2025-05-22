// Create and set up the canvas
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

// Handle resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateVectors();
    initParticles();
});
// --- UI Sliders for gridSize and noiseScale ---
const controls = document.createElement('div');
controls.style.position = 'fixed';
controls.style.top = '10px';
controls.style.left = '10px';
controls.style.background = 'rgba(0,0,0,0.7)';
controls.style.color = '#fff';
controls.style.padding = '10px';
controls.style.borderRadius = '8px';
controls.style.zIndex = 1000;
controls.innerHTML = `
  <label>Grid Size: <input id="gridSizeSlider" type="range" min="5" max="100" value="20" step="1"></label>
  <span id="gridSizeValue">20</span><br>
  <label>Noise Scale: <input id="noiseScaleSlider" type="range" min="0.001" max="0.05" value="0.01" step="0.001"></label>
  <span id="noiseScaleValue">0.01</span>
`;
document.body.appendChild(controls);

const gridSizeSlider = document.getElementById('gridSizeSlider');
const gridSizeValue = document.getElementById('gridSizeValue');
const noiseScaleSlider = document.getElementById('noiseScaleSlider');
const noiseScaleValue = document.getElementById('noiseScaleValue');

// --- Perlin Noise Grid Vector Implementation ---
let gridSize = parseInt(gridSizeSlider.value, 10);
let noiseScale = parseFloat(noiseScaleSlider.value);
let cols, rows, vectors;

function generateVectors() {
    cols = Math.ceil(canvas.width / gridSize) + 2;
    rows = Math.ceil(canvas.height / gridSize) + 2;
    vectors = [];
    for (let y = 0; y < rows; y++) {
        vectors[y] = [];
        for (let x = 0; x < cols; x++) {
            const angle = Math.random() * Math.PI * 2;
            vectors[y][x] = { x: Math.cos(angle), y: Math.sin(angle) };
        }
    }
}
generateVectors();
window.addEventListener('resize', () => {
    generateVectors();
    initParticles();
});

// Update gridSize and noiseScale from sliders
gridSizeSlider.addEventListener('input', () => {
    gridSize = parseInt(gridSizeSlider.value, 10);
    gridSizeValue.textContent = gridSize;
    generateVectors();
});
noiseScaleSlider.addEventListener('input', () => {
    noiseScale = parseFloat(noiseScaleSlider.value);
    noiseScaleValue.textContent = noiseScale.toFixed(3);
});

// ...existing code...
function fade(t) {
    // Perlin's fade function: 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
}
function dotGridGradient(ix, iy, x, y) {
    // Clamp indices to grid
    ix = Math.max(0, Math.min(ix, vectors[0].length - 1));
    iy = Math.max(0, Math.min(iy, vectors.length - 1));
    // Get gradient from grid
    const gradient = vectors[iy][ix];
    // Compute distance vector
    const dx = x - ix * gridSize;
    const dy = y - iy * gridSize;
    // Return dot product
    return (dx * gradient.x + dy * gradient.y);
}
function lerp(a, b, t) {
    return a + t * (b - a);
}

function perlinNoise2D(x, y, t = 0) {
    // Animate by offsetting x and y with t to mimic 3D Perlin noise
    const animSpeed = 100;
    x += t * animSpeed;
    y += t * animSpeed;

    // Grid cell coordinates
    const x0 = Math.floor(x / gridSize);
    const x1 = x0 + 1;
    const y0 = Math.floor(y / gridSize);
    const y1 = y0 + 1;

    // Local coordinates in cell
    const sx = fade((x - x0 * gridSize) / gridSize);
    const sy = fade((y - y0 * gridSize) / gridSize);

    // Dot products at the corners
    const n0 = dotGridGradient(x0, y0, x, y);
    const n1 = dotGridGradient(x1, y0, x, y);
    const ix0 = lerp(n0, n1, sx);

    const n2 = dotGridGradient(x0, y1, x, y);
    const n3 = dotGridGradient(x1, y1, x, y);
    const ix1 = lerp(n2, n3, sx);

    // Interpolate between the two results
    const value = lerp(ix0, ix1, sy);

    // Normalize to [0,1]
    return (value + gridSize * 0.7071) / (2 * gridSize * 0.7071);
}

// --- Particle System Implementation ---
let particles = [];
const num = 1000;

function initParticles() {
    particles = [];
    for (let i = 0; i < num; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
}
initParticles();
window.addEventListener('resize', initParticles);

function onScreen(p) {
    return p.x >= 0 && p.x <= canvas.width && p.y >= 0 && p.y <= canvas.height;
}

let time = 0;
function drawParticles() {
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.lineWidth = 1;

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fill();

        let n = perlinNoise2D(
            p.x * noiseScale,
            p.y * noiseScale,
            time * noiseScale * noiseScale
        );
        let angle = Math.PI * 2 * n + (Math.random() - 0.5) * 0.1;

        p.x += Math.cos(angle);
        p.y += Math.sin(angle);

        if (!onScreen(p)) {
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
        }
    }

    time += 1;
    requestAnimationFrame(drawParticles);
}

drawParticles();

canvas.addEventListener('mouseup', () => {
    generateVectors();
    for (let i = 0; i < particles.length; i++) {
        particles[i].x = Math.random() * canvas.width;
        particles[i].y = Math.random() * canvas.height;
    }
});