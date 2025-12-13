import * as THREE from 'three';

// --- Constants ---
// --- Constants ---
let GRID_SIZE = 20;
const TILE_SIZE = 1;
const TICK_RATE = 150; // Milliseconds per move

// --- State ---
let scene, camera, renderer;
let ambientLight, dirLight;
let snake = [];
let foods = []; // Array of food objects
let direction = { x: 1, z: 0 }; // Moving right initially
let nextDirection = { x: 1, z: 0 };
let lastMoveTime = 0;
let isGameOver = false;
let score = 0;
let totalFoodsEaten = 0;
let zoomLevel = 20; // Default zoom
let groupSnake, groupFood, groupGrid, groupBlood;
let bloodParticles = [];

// --- Elements ---
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');

// --- Initialization ---
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e); // Dark Blue-ish to see if renderer works

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 15);
    camera.lookAt(0, 0, 0);

    // Remove loading text
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    document.body.appendChild(renderer.domElement);

    // Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Groups
    groupSnake = new THREE.Group();
    scene.add(groupSnake);

    groupFood = new THREE.Group();
    scene.add(groupFood);

    groupGrid = new THREE.Group();
    scene.add(groupGrid);

    groupBlood = new THREE.Group();
    scene.add(groupBlood);

    createGrid();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Start Game
    resetGame();
    animate();
}

function createGrid() {
    // Clear old grid if exists
    if (groupGrid.children.length > 0) {
        // Simple clear
        while (groupGrid.children.length > 0) {
            groupGrid.remove(groupGrid.children[0]);
        }
    }

    // Floor
    const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = false;
    groupGrid.add(floor);

    // Borders
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const borderGeoH = new THREE.BoxGeometry(GRID_SIZE + 1, 1, 0.5);
    const borderGeoV = new THREE.BoxGeometry(0.5, 1, GRID_SIZE + 1);

    const wallTop = new THREE.Mesh(borderGeoH, borderMat);
    wallTop.position.set(0, 0.5, -GRID_SIZE / 2 - 0.25);
    groupGrid.add(wallTop);

    const wallBottom = new THREE.Mesh(borderGeoH, borderMat);
    wallBottom.position.set(0, 0.5, GRID_SIZE / 2 + 0.25);
    groupGrid.add(wallBottom);

    const wallLeft = new THREE.Mesh(borderGeoV, borderMat);
    wallLeft.position.set(-GRID_SIZE / 2 - 0.25, 0.5, 0);
    groupGrid.add(wallLeft);

    const wallRight = new THREE.Mesh(borderGeoV, borderMat);
    wallRight.position.set(GRID_SIZE / 2 + 0.25, 0.5, 0);
    groupGrid.add(wallRight);
}

function resetGame() {
    isGameOver = false;
    score = 0;
    totalFoodsEaten = 0;
    scoreEl.innerText = `Score: 0`;
    gameOverEl.classList.add('hidden');

    // Clear old meshes
    while (groupSnake.children.length > 0) {
        groupSnake.remove(groupSnake.children[0]);
    }
    while (groupFood.children.length > 0) {
        groupFood.remove(groupFood.children[0]);
    }
    while (groupBlood.children.length > 0) {
        groupBlood.remove(groupBlood.children[0]);
    }
    bloodParticles = [];

    // Reset Grid Size
    GRID_SIZE = 20;
    zoomLevel = 20;

    // Reset Lights
    if (ambientLight) ambientLight.intensity = 0.6;
    if (dirLight) dirLight.intensity = 0.8;
    if (scene) {
        scene.background.setHex(0x1a1a2e);
    }

    createGrid();
    // Camera pos will be updated in animate

    // Reset Snake Data
    snake = [
        { x: 0, z: 0 },
        { x: -1, z: 0 },
        { x: -2, z: 0 }
    ];

    foods = []; // Clear data

    direction = { x: 1, z: 0 };
    nextDirection = { x: 1, z: 0 };

    // Create Initial Snake Meshes
    updateSnakeMeshes();

    spawnFoods(1);
}

// addSnakeSegment function removed, logic moved to createDragonSegment in updateSnakeMeshes

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
        // Check collision with snake
        for (let segment of snake) {
            if (segment.x === x && segment.z === z) {
                valid = false;
                break;
            }
        }
        // Check collision with other foods
        for (let f of foods) {
            if (f.x === x && f.z === z) {
                valid = false;
                break;
            }
        }
    }

    const group = new THREE.Group();
    group.position.set(x, 0.5, z);

    // Random Color
    const randomColor = (type === 'bad') ? 0x800080 : Math.random() * 0xffffff;

    // Body
    const radius = (type === 'bad') ? 0.8 : 0.5;
    const geometry = new THREE.DodecahedronGeometry(radius);
    const material = new THREE.MeshStandardMaterial({
        color: randomColor,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = false;
    group.add(body);

    // Eyes (so it looks alive!)
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftEye = new THREE.Group();
    const lBall = new THREE.Mesh(eyeGeo, eyeMat);
    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.z = 0.12;
    leftEye.add(lBall);
    leftEye.add(lPupil);
    leftEye.position.set(-0.2, 0.2, 0.4);
    group.add(leftEye);

    const rightEye = new THREE.Group();
    const rBall = new THREE.Mesh(eyeGeo, eyeMat);
    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.z = 0.12;
    rightEye.add(rBall);
    rightEye.add(rPupil);
    rightEye.position.set(0.2, 0.2, 0.4);
    group.add(rightEye);

    // Random Rotation
    group.rotation.y = Math.random() * Math.PI * 2;

    const f = { x, z, mesh: group, jumpCooldown: 0, id: Math.random(), type: type };
    foods.push(f);
    groupFood.add(group);
}

function onKeyDown(event) {
    if (isGameOver) {
        if (event.code === 'Space') {
            resetGame();
        }
        return;
    }

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (direction.z !== 1) nextDirection = { x: 0, z: -1 };
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (direction.z !== -1) nextDirection = { x: 0, z: 1 };
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (direction.x !== 1) nextDirection = { x: -1, z: 0 };
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (direction.x !== -1) nextDirection = { x: 1, z: 0 };
            break;
    }
}

function update(time) {
    if (isGameOver) return;

    if (time - lastMoveTime > TICK_RATE) {
        lastMoveTime = time;
        moveSnake();
    }

    updateFoodBehavior(time);
}

function updateFoodBehavior(time) {
    if (isGameOver) return;

    // Iterate backwards so we can modify if needed (though we aren't deleting here)
    for (let f of foods) {
        updateSingleFoodBehavior(f, time);
    }
}

function updateSingleFoodBehavior(foodItem, time) {
    if (!foodItem || !foodItem.mesh) return;

    // Cooldown check
    if (foodItem.jumpCooldown > 0) {
        foodItem.jumpCooldown -= 16;
        return;
    }

    const head = snake[0];
    const dist = Math.sqrt(Math.pow(head.x - foodItem.x, 2) + Math.pow(head.z - foodItem.z, 2));

    // Field of View Check
    if (dist < 5) {
        // Calculate vector to snake
        const toSnake = { x: head.x - foodItem.x, z: head.z - foodItem.z };
        const len = Math.sqrt(toSnake.x * toSnake.x + toSnake.z * toSnake.z);
        if (len === 0) return; // on top of it

        // Normalize
        toSnake.x /= len;
        toSnake.z /= len;

        // Get Forward vector of Food (Z axis rotated)
        const rot = foodItem.mesh.rotation.y;
        const forward = {
            x: Math.sin(rot),
            z: Math.cos(rot)
        };

        // Dot Product
        const dot = forward.x * toSnake.x + forward.z * toSnake.z;

        // If Dot > 0.5 (approx 60 degree cone to each side), it sees the snake
        if (dot > 0.5) {
            // SPOTTED!
            foodItem.mesh.lookAt(head.x, 0.5, head.z);

            // JUMP THIS SPECIFIC FOOD
            jumpFood(foodItem);
        }
    }
}

function jumpFood(foodItem) {
    // Remove old mesh from group temporarily or just move it?
    // We need new coords.

    let x, z;
    let valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        z = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
        valid = true;
        // Check snake
        for (let segment of snake) {
            if (segment.x === x && segment.z === z) { valid = false; break; }
        }
        // Check other foods
        for (let f of foods) {
            if (f !== foodItem && f.x === x && f.z === z) { valid = false; break; }
        }
    }

    // Update Data
    foodItem.x = x;
    foodItem.z = z;

    // Update Mesh Position
    foodItem.mesh.position.set(x, 0.5, z);

    // Randomize rotation again?
    foodItem.mesh.rotation.y = Math.random() * Math.PI * 2;

    // Cooldown
    foodItem.jumpCooldown = 2000;
}

function spawnBlood(x, z) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0.5, z);

        // Random Velocity
        const velocity = {
            x: (Math.random() - 0.5) * 0.4,
            y: Math.random() * 0.5 + 0.2,
            z: (Math.random() - 0.5) * 0.4
        };

        const particle = { mesh, velocity, life: 1.0 };
        groupBlood.add(mesh);
        bloodParticles.push(particle);
    }
}

function updateBlood() {
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const p = bloodParticles[i];
        p.life -= 0.02;

        if (p.life <= 0) {
            groupBlood.remove(p.mesh);
            bloodParticles.splice(i, 1);
            continue;
        }

        p.velocity.y -= 0.02; // Gravity
        p.mesh.position.x += p.velocity.x;
        p.mesh.position.y += p.velocity.y;
        p.mesh.position.z += p.velocity.z;

        // Floor collision
        if (p.mesh.position.y < 0.1) {
            p.mesh.position.y = 0.1;
            p.velocity.y *= -0.5; // Bounce
            p.velocity.x *= 0.8; // Friction
            p.velocity.z *= 0.8;
        }

        p.mesh.scale.setScalar(p.life);
        p.mesh.rotation.x += p.velocity.z;
        p.mesh.rotation.z -= p.velocity.x;
    }
}

function moveSnake() {
    direction = nextDirection;

    // Calculate new head position
    const head = snake[0];
    const newHead = {
        x: Math.round(head.x + direction.x), // Round to keep it integer-aligned
        z: Math.round(head.z + direction.z)
    };

    // Check Wall Collision
    const limit = GRID_SIZE / 2;
    if (newHead.x < -limit || newHead.x >= limit || newHead.z < -limit || newHead.z >= limit) {
        gameOver();
        return;
    }

    // Check Self Collision
    for (let segment of snake) {
        if (newHead.x === segment.x && newHead.z === segment.z) {
            gameOver();
            return;
        }
    }

    snake.unshift(newHead); // Add new head

    // Check Food Collision
    let eatenIndex = -1;
    for (let i = 0; i < foods.length; i++) {
        if (newHead.x === foods[i].x && newHead.z === foods[i].z) {
            eatenIndex = i;
            break;
        }
    }

    if (eatenIndex !== -1) {
        const eatenFood = foods[eatenIndex];

        // Remove eaten food visual
        spawnBlood(eatenFood.x, eatenFood.z);
        groupFood.remove(eatenFood.mesh);
        foods.splice(eatenIndex, 1);

        if (eatenFood.type === 'bad') {
            // Bad Food Logic
            score -= 1;
            scoreEl.innerText = `Score: ${score}`;
            // Snake does NOT grow, so we do nothing here, let the else block run?
            // Actually, code structure is if(eaten) { ... } else { pop }.
            // If we eat bad food, we DON'T grow, so we MUST pop.
            snake.pop();
        } else {
            // Normal Food Logic
            score += 10;
            scoreEl.innerText = `Score: ${score}`;
            totalFoodsEaten++;

            // HYDRA LOGIC: Spawn 2 new ones
            spawnFoods(2);

            // EXPANSION LOGIC: Increase Grid
            GRID_SIZE += 2;
            createGrid(); // Rebuild grid

            // Adjust Camera out
            zoomLevel += 1;

            // Check for Big Ball Spawn
            if (totalFoodsEaten % 10 === 0) {
                spawnFoodItem('bad');
            }
        }

    } else { // Remove tail
        snake.pop();
    }

    // Sync Meshes with Data
    updateSnakeMeshes();
}

function updateSnakeMeshes() {
    // Rebuild visual representation every frame to handle Head vs Body switching easily
    // Clear old
    while (groupSnake.children.length > 0) {
        groupSnake.remove(groupSnake.children[0]);
    }

    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        const isHead = (i === 0);
        createDragonSegment(seg, isHead, direction);
    }
}

function createDragonSegment(pos, isHead, dir) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0.5, pos.z);

    // Main Body Block
    const bodyColor = isHead ? 0xcc0000 : 0xaa0000; // Red Dragon
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const material = new THREE.MeshStandardMaterial({ color: bodyColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);

    if (isHead) {
        // Snout
        const snoutGeo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
        const snout = new THREE.Mesh(snoutGeo, snoutMat);

        // Position snout based on direction
        // If dir.x = 1 (Right), Snout at +0.6 x
        snout.position.set(dir.x * 0.6, 0, dir.z * 0.6);
        // Rotate if moving Z
        if (dir.z !== 0) snout.rotation.y = Math.PI / 2;
        group.add(snout);

        // Eyes
        const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow Eyes

        const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
        const eye2 = new THREE.Mesh(eyeGeo, eyeMat);

        // Position relative to snout/head direction
        // Simple: Top of head?
        eye1.position.set(0.2, 0.5, 0.2);
        eye2.position.set(0.2, 0.5, -0.2);

        // Adjust for direction... this is getting complex for simple logic
        // Let's just put them on top near front
        eye1.position.set(dir.x * 0.3 + dir.z * 0.2, 0.5, dir.z * 0.3 + dir.x * 0.2);
        eye2.position.set(dir.x * 0.3 - dir.z * 0.2, 0.5, dir.z * 0.3 - dir.x * 0.2);

        group.add(eye1);
        group.add(eye2);

    } else {
        // Body Spikes
        const spikeGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 }); // Gold spikes
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(0, 0.6, 0);
        group.add(spike);
    }

    groupSnake.add(group);
}

function gameOver() {
    isGameOver = true;

    gameOverEl.classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    update(time);
    updateBlood();

    // Food animation
    for (let f of foods) {
        if (f.mesh) {
            f.mesh.position.y = 0.5 + Math.sin(time / 200 + f.id) * 0.1;
        }
    }

    // Camera Follow
    if (snake.length > 0) {
        const head = snake[0];
        // Smooth follow? Or strict? Strict is fine for grid game
        camera.position.x = head.x;
        camera.position.y = zoomLevel;
        camera.position.z = head.z + (zoomLevel * 0.75); // Offset Z slightly so we aren't looking straight down
        camera.lookAt(head.x, 0, head.z);
    }

    renderer.render(scene, camera);
}

init();
// End of implementation
