import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Constants ---
let GRID_SIZE = 20;
const TILE_SIZE = 1;
const TICK_RATE = 150; // Milliseconds per move

// --- State ---
let scene, camera, renderer, composer;
let ambientLight, dirLight, pointLight;
let snake = [];
let foods = [];
let direction = { x: 1, z: 0 };
let nextDirection = { x: 1, z: 0 };
let lastMoveTime = 0;
let isGameOver = false;
let score = 0;
let totalFoodsEaten = 0;
let zoomLevel = 22; // Slightly further out for dramatic angle
let groupSnake, groupFood, groupGrid, groupBlood, groupEffects;
let bloodParticles = [];
let beams = [];

// --- Elements ---
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const pauseEl = document.getElementById('pause-menu');
let isPaused = false;

// --- Initialization ---
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Very dark background
    scene.fog = new THREE.FogExp2(0x050505, 0.02); // Add fog for depth

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 15);
    camera.lookAt(0, 0, 0);

    // Remove loading text
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias off for post-processing performance usually
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    // Post-Processing
    const params = {
        exposure: 1,
        bloomStrength: 1.5,
        bloomThreshold: 0,
        bloomRadius: 0
    };

    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Lights
    ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Dynamic Point Light attached to "Grid Center" or similar to give life
    pointLight = new THREE.PointLight(0x00f3ff, 1, 100);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Groups
    groupSnake = new THREE.Group();
    scene.add(groupSnake);

    groupFood = new THREE.Group();
    scene.add(groupFood);

    groupGrid = new THREE.Group();
    scene.add(groupGrid);

    groupBlood = new THREE.Group();
    scene.add(groupBlood);

    groupEffects = new THREE.Group();
    scene.add(groupEffects);

    createGrid();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Start Game
    resetGame();
    animate();
}

function createGrid() {
    // Clear old grid
    while (groupGrid.children.length > 0) {
        groupGrid.remove(groupGrid.children[0]);
    }

    // Floor - Reflective Tech Grid
    const geometry = new THREE.PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2);
    // Using a grid texture would be nice, but procedural is safer for single file
    const material = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.1,
        metalness: 0.8,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1; // Slightly below zero
    groupGrid.add(floor);

    // Grid Helper for the visual lines
    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x00f3ff, 0x111111);
    groupGrid.add(gridHelper);

    // Dynamic borders - Glowing Neon Walls
    const borderMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 2
    });

    // Create a continuous railing or corner pillars for a cleaner look?
    // Let's go with corner pillars and thin laser beams
    const halfSize = GRID_SIZE / 2;

    // Laser Beam Fences
    const wallGeoH = new THREE.BoxGeometry(GRID_SIZE, 0.05, 0.05);
    const wallGeoV = new THREE.BoxGeometry(0.05, 0.05, GRID_SIZE);

    const wallTop = new THREE.Mesh(wallGeoH, borderMat);
    wallTop.position.set(0, 0.5, -halfSize);
    groupGrid.add(wallTop);

    const wallBottom = new THREE.Mesh(wallGeoH, borderMat);
    wallBottom.position.set(0, 0.5, halfSize);
    groupGrid.add(wallBottom);

    const wallLeft = new THREE.Mesh(wallGeoV, borderMat);
    wallLeft.position.set(-halfSize, 0.5, 0);
    groupGrid.add(wallLeft);

    const wallRight = new THREE.Mesh(wallGeoV, borderMat);
    wallRight.position.set(halfSize, 0.5, 0);
    groupGrid.add(wallRight);
}

function resetGame() {
    isGameOver = false;
    score = 0;
    totalFoodsEaten = 0;
    scoreEl.innerText = `SCORE: 0`;
    gameOverEl.classList.add('hidden');

    // Clear old meshes
    [groupSnake, groupFood, groupBlood, groupEffects].forEach(g => {
        while (g.children.length > 0) g.remove(g.children[0]);
    });

    bloodParticles = [];
    beams = [];

    // Reset Grid Size
    GRID_SIZE = 20;
    zoomLevel = 22;

    createGrid();

    // Reset Snake Data
    snake = [
        { x: 0, z: 0 },
        { x: -1, z: 0 },
        { x: -2, z: 0 }
    ];

    direction = { x: 1, z: 0 };
    nextDirection = { x: 1, z: 0 };
    foods = [];

    updateSnakeMeshes();
    spawnFoods(1);
}

function spawnFoods(count = 1) {
    for (let i = 0; i < count; i++) {
        spawnFoodItem();
    }
}

function spawnFoodItem(type = 'normal') {
    let x, z;
    let valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        z = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        valid = true;
        for (let s of snake) if (s.x === x && s.z === z) valid = false;
        for (let f of foods) if (f.x === x && f.z === z) valid = false;
    }

    const group = new THREE.Group();
    group.position.set(x, 0.5, z);

    // Enhanced Food Visuals
    const isBad = type === 'bad';
    const color = isBad ? 0xff0055 : 0x00ff88; // Neon Pink or Neon Green

    // Core (Glowing)
    const geometry = new THREE.OctahedronGeometry(0.4);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 3,
        roughness: 0.2,
        metalness: 0.8
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Floating Rings
    const ringGeo = new THREE.TorusGeometry(0.6, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const f = { x, z, mesh: group, jumpCooldown: 0, id: Math.random(), type: type, preJump: false, preJumpTimer: 0 };
    foods.push(f);
    groupFood.add(group);
}

function onKeyDown(event) {
    if (isGameOver) {
        if (event.code === 'Space') resetGame();
        return;
    }

    if (event.code === 'Escape' || event.code === 'KeyP') {
        togglePause();
        return;
    }

    if (isPaused) return;

    switch (event.code) {
        case 'ArrowUp': case 'KeyW': if (direction.z !== 1) nextDirection = { x: 0, z: -1 }; break;
        case 'ArrowDown': case 'KeyS': if (direction.z !== -1) nextDirection = { x: 0, z: 1 }; break;
        case 'ArrowLeft': case 'KeyA': if (direction.x !== 1) nextDirection = { x: -1, z: 0 }; break;
        case 'ArrowRight': case 'KeyD': if (direction.x !== -1) nextDirection = { x: 1, z: 0 }; break;
    }
}

function update(time) {
    if (isGameOver || isPaused) return;

    if (time - lastMoveTime > TICK_RATE) {
        lastMoveTime = time;
        moveSnake();
    }
    updateFoodBehavior(time);
}

function updateFoodBehavior(time) {
    if (isGameOver) return;
    for (let f of foods) {
        if (!f || !f.mesh) continue;

        // Rotate rings
        f.mesh.children[1].rotation.x += 0.05;
        f.mesh.children[1].rotation.y += 0.05;

        // Jump logic check (simplified for visual consistency)
        if (f.jumpCooldown > 0) {
            f.jumpCooldown -= 16;
            continue;
        }

        const head = snake[0];
        const dist = Math.sqrt(Math.pow(head.x - f.x, 2) + Math.pow(head.z - f.z, 2));

        if (dist < 4) {
            if (f.preJump) {
                f.preJumpTimer -= 16;
                if (f.preJumpTimer <= 0) {
                    jumpFood(f);
                    f.preJump = false;
                }
            } else if (Math.random() < 0.02) { // Random chance to start jump if close, instead of vector math for now per frame
                f.preJump = true;
                f.preJumpTimer = 400;
                spawnBeam(f.x, f.z);
            }
        }
    }
}

function jumpFood(foodItem) {
    let x, z, valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        z = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        valid = true;
        for (let s of snake) if (s.x === x && s.z === z) valid = false;
        for (let f of foods) if (f !== foodItem && f.x === x && f.z === z) valid = false;
    }
    foodItem.x = x;
    foodItem.z = z;
    foodItem.mesh.position.set(x, 0.5, z);
    foodItem.jumpCooldown = 2000;
}

function spawnBloods(x, z) {
    // Neon Explosion
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00f3ff }); // Cyan sparks
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0.5, z);

        const velocity = {
            x: (Math.random() - 0.5) * 0.5,
            y: Math.random() * 0.5 + 0.2,
            z: (Math.random() - 0.5) * 0.5
        };
        groupBlood.add(mesh);
        bloodParticles.push({ mesh, velocity, life: 1.0 });
    }
}

function updateBlood() {
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const p = bloodParticles[i];
        p.life -= 0.03;
        if (p.life <= 0) {
            groupBlood.remove(p.mesh);
            bloodParticles.splice(i, 1);
            continue;
        }
        p.velocity.y -= 0.02;
        p.mesh.position.add(p.velocity);
        // Fade out
        // Note: MeshBasicMaterial doesn't support alpha easily without transparent:true, 
        // but shrinking scale works well for sparks
        p.mesh.scale.setScalar(p.life);

        if (p.mesh.position.y < 0) {
            p.velocity.y *= -0.5;
            p.mesh.position.y = 0;
        }
    }
}

function spawnBeam(x, z) {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 20, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0055, // Warning Red
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 10, z);
    groupEffects.add(mesh);
    beams.push({ mesh, life: 1.0 });
}

function updateBeams() {
    for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.life -= 0.05;
        if (b.life <= 0) {
            groupEffects.remove(b.mesh);
            beams.splice(i, 1);
        } else {
            b.mesh.material.opacity = b.life;
        }
    }
}

function moveSnake() {
    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: Math.round(head.x + direction.x), z: Math.round(head.z + direction.z) };

    const limit = GRID_SIZE / 2;
    if (newHead.x < -limit || newHead.x >= limit || newHead.z < -limit || newHead.z >= limit) {
        gameOver();
        return;
    }
    for (let s of snake) if (newHead.x === s.x && newHead.z === s.z) { gameOver(); return; }

    snake.unshift(newHead);

    let eatenIndex = -1;
    for (let i = 0; i < foods.length; i++) {
        if (newHead.x === foods[i].x && newHead.z === foods[i].z) {
            eatenIndex = i;
            break;
        }
    }

    if (eatenIndex !== -1) {
        const eatenFood = foods[eatenIndex];
        spawnBloods(eatenFood.x, eatenFood.z);
        groupFood.remove(eatenFood.mesh);
        foods.splice(eatenIndex, 1);

        if (eatenFood.type === 'bad') {
            score -= 5;
            scoreEl.innerText = `SCORE: ${score}`;
            snake.pop(); // Eat bad food -> shrink
        } else {
            score += 10;
            scoreEl.innerText = `SCORE: ${score}`;
            totalFoodsEaten++;
            spawnFoods(2);
            GRID_SIZE += 2;
            createGrid();
            zoomLevel += 0.5;
            if (totalFoodsEaten % 5 === 0) spawnFoodItem('bad');
        }
    } else {
        snake.pop();
    }
    updateSnakeMeshes();
}

function updateSnakeMeshes() {
    while (groupSnake.children.length > 0) groupSnake.remove(groupSnake.children[0]);

    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        const isHead = (i === 0);

        const group = new THREE.Group();
        group.position.set(seg.x, 0.5, seg.z);

        // Cyber-Snake Aesthetic
        const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const mat = new THREE.MeshStandardMaterial({
            color: isHead ? 0xffffff : 0x00f3ff,
            emissive: isHead ? 0xffffff : 0x0088ff,
            emissiveIntensity: isHead ? 0.5 : 0.2,
            roughness: 0.1,
            metalness: 0.9
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        // Inner glowing core
        const coreGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        if (isHead) {
            // High-tech Visor Eyes
            const visorGeo = new THREE.BoxGeometry(0.95, 0.3, 0.5);
            const visorMat = new THREE.MeshBasicMaterial({ color: 0xff0055 }); // Red Visor
            const visor = new THREE.Mesh(visorGeo, visorMat);

            // Orient Visor
            visor.position.y = 0.2;
            if (direction.x !== 0) {
                visor.position.x = direction.x * 0.2;
                visor.scale.set(0.1, 1, 1);
            } else {
                visor.position.z = direction.z * 0.2;
                visor.scale.set(1, 1, 0.1);
            }
            group.add(visor);
        }

        groupSnake.add(group);
    }
}

function gameOver() {
    isGameOver = true;
    gameOverEl.classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    update(time);
    updateBlood();
    updateBeams();

    // Animate Food Float
    for (let f of foods) {
        if (f.mesh) {
            f.mesh.position.y = 0.5 + Math.sin(time / 500 + f.id * 10) * 0.2;
        }
    }

    // Camera Smooth Follow
    if (snake.length > 0) {
        const head = snake[0];
        const targetX = head.x;
        const targetZ = head.z + (zoomLevel * 0.6);

        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
        camera.position.y = zoomLevel;
        camera.lookAt(camera.position.x, 0, camera.position.z - 20); // Look ahead
    }

    // Render with Effect Composer
    composer.render();
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseEl.classList.remove('hidden');
    } else {
        pauseEl.classList.add('hidden');
    }
}

init();
