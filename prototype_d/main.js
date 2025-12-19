import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- Configuration ---
const CONFIG = {
    gravity: 0.5,
    jumpForce: 12,
    moveSpeed: 0.5,
    maxSpeed: 8,
    friction: 0.8,
    cameraOffset: new THREE.Vector3(0, 6, 12)
};

// --- Global State ---
const state = {
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false
    },
    player: {
        velocity: new THREE.Vector3(0, 0, 0),
        canJump: false,
        mesh: null
    },
    platforms: [],
    particles: []
};

// --- Initialization ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Mario Sky Blue
scene.fog = new THREE.FogExp2(0x87CEEB, 0.02); // Softer fog

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Antialias might be disabled by composer, but good to have
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows for "Unreal" look
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('game-container').appendChild(renderer.domElement);

// --- Post Processing ---
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 0.4; // Reduced from 0.8
bloomPass.radius = 0.3; // Reduced from 0.5

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced from 0.6
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); // Reduced from 1.5
dirLight.position.set(20, 30, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.bias = -0.0005;
// Increase shadow frustum to cover level
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// --- Game Objects ---

// Score
let score = 0;
const uiScore = document.createElement('div');
uiScore.style.position = 'absolute';
uiScore.style.top = '20px';
uiScore.style.right = '20px';
uiScore.style.color = '#FFF';
uiScore.style.fontFamily = 'Impact, sans-serif';
uiScore.style.fontSize = '32px';
uiScore.style.textShadow = '2px 2px 0 #000';
uiScore.innerText = 'SCORE: 0';
document.body.appendChild(uiScore);

// Player (Mario Logic)
function createMarioMesh() {
    const marioGroup = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFCC99, roughness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.5 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0000FF, roughness: 0.5 });
    const brownMat = new THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.8 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
    head.position.y = 0.7;
    marioGroup.add(head);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    nose.position.set(0, 0.7, 0.25);
    marioGroup.add(nose);

    // Mustache
    const mustache = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), blackMat);
    mustache.rotation.z = Math.PI / 2;
    mustache.position.set(0, 0.65, 0.28);
    // bend it slightly or just place it
    marioGroup.add(mustache);

    // Hat
    const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    hatTop.position.y = 0.75;
    marioGroup.add(hatTop);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), redMat);
    hatBrim.position.set(0, 0.75, 0.1);
    hatBrim.rotation.x = 0.2;
    marioGroup.add(hatBrim);

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 12), redMat);
    body.position.y = 0.25;
    marioGroup.add(body);

    const overalls = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.25, 12), blueMat);
    overalls.position.y = 0.15;
    marioGroup.add(overalls);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4);
    const armL = new THREE.Mesh(armGeo, redMat);
    armL.position.set(-0.35, 0.3, 0);
    armL.rotation.z = 0.5;
    marioGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, redMat);
    armR.position.set(0.35, 0.3, 0);
    armR.rotation.z = -0.5;
    marioGroup.add(armR);

    // Hands
    const whiteHand = new THREE.Mesh(new THREE.SphereGeometry(0.12), whiteMat);
    const handL = whiteHand.clone();
    handL.position.set(0, -0.2, 0);
    armL.add(handL);
    const handR = whiteHand.clone();
    handR.position.set(0, -0.2, 0);
    armR.add(handR);


    // Legs
    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.4);
    const legL = new THREE.Mesh(legGeo, blueMat);
    legL.position.set(-0.15, -0.2, 0);
    marioGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, blueMat);
    legR.position.set(0.15, -0.2, 0);
    marioGroup.add(legR);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.15, 0.15, 0.25);
    const bootL = new THREE.Mesh(bootGeo, brownMat);
    bootL.position.set(0, -0.2, 0.05);
    legL.add(bootL);

    const bootR = new THREE.Mesh(bootGeo, brownMat);
    bootR.position.set(0, -0.2, 0.05);
    legR.add(bootR);

    marioGroup.traverse(o => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
        }
    });

    return marioGroup;
}

function createPlayer() {
    const player = createMarioMesh();
    player.position.set(0, 5, 0);

    scene.add(player);
    state.player.mesh = player;
}

// Platforms
function createPlatform(x, y, z, width, depth, color = 0x8B4513) {
    const geometry = new THREE.BoxGeometry(width, 1, depth);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.1
    });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;

    // Custom property for physics collision
    platform.userData.isPlatform = true;
    platform.userData.collider = new THREE.Box3().setFromObject(platform);

    scene.add(platform);
    state.platforms.push(platform);
    return platform;
}

// Collectibles (Coins)
const coins = [];
function createCoin(x, y, z) {
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.position.set(x, y, z);
    coin.castShadow = true;
    scene.add(coin);
    coins.push(coin);
}

// Particles/Explosions
function createExplosion(position, color = 0x8B4513) {
    const particleCount = 8;
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        // Random velocity
        mesh.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() * 0.5) + 0.2, // Upward burst
            (Math.random() - 0.5) * 0.5
        );
        mesh.userData.life = 1.0; // 1 second life

        scene.add(mesh);
        state.particles.push(mesh);
    }
}

// Enemies (Goomba-like)
const enemies = [];
function createEnemyMesh() {
    const group = new THREE.Group();

    const brownMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFCC99 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    // Head/Body
    // Triangle-ish shape? Or just a flattened sphere top, cylinder bottom
    const headTop = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), brownMat);
    headTop.position.y = 0.1;
    group.add(headTop);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.4, 16), skinMat);
    stem.position.y = -0.1;
    group.add(stem);

    // Feet
    const footGeo = new THREE.SphereGeometry(0.12);
    const footL = new THREE.Mesh(footGeo, blackMat);
    footL.position.set(-0.2, -0.3, 0.1);
    group.add(footL);

    const footR = new THREE.Mesh(footGeo, blackMat);
    footR.position.set(0.2, -0.3, 0.1);
    group.add(footR);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-0.12, 0, 0.3);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeR.position.set(0.12, 0, 0.3);
    group.add(eyeR);

    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyePupilMat);
    pupilL.position.set(0, 0, 0.07);
    eyeL.add(pupilL);

    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyePupilMat);
    pupilR.position.set(0, 0, 0.07);
    eyeR.add(pupilR);

    group.traverse(o => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
        }
    });

    return group;
}

function createEnemy(platform) {
    // Enemy sits on top of a platform
    const enemy = createEnemyMesh();

    // Position relative to platform
    const y = platform.position.y + 0.5 + 0.4;
    enemy.position.set(platform.position.x, y, 0);

    // AI State
    enemy.userData = {
        direction: 1,
        speed: 0.03, // Slower
        startX: platform.position.x,
        range: platform.geometry.parameters.width / 2 - 0.5
    };

    scene.add(enemy);
    enemies.push(enemy);
}

// --- Level Generation ---
function buildLevel() {
    // Ground
    createPlatform(0, -1, 0, 100, 20, 0x228B22);

    // Platforms with some variety
    const p1 = createPlatform(-6, 2, 0, 4, 3, 0xCD853F);
    createCoin(-6, 3.5, 0);
    createEnemy(p1);

    const p2 = createPlatform(6, 4, 0, 4, 3, 0xCD853F);
    createCoin(6, 5.5, 0);
    createEnemy(p2);

    createPlatform(0, 7, 0, 3, 3, 0xFFD700); // Higher, golden platform
    createCoin(0, 8.5, 0);

    // Random blocks
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 40;
        const y = 2 + Math.random() * 5;
        const p = createPlatform(x, y, (Math.random() - 0.5) * 5, 3, 3, 0xA0522D);

        if (Math.random() > 0.5) createCoin(x, y + 1.5, p.position.z);
    }
}

// --- Input Handling ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') state.keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') state.keys.ArrowRight = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') state.keys.Space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') state.keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') state.keys.ArrowRight = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') state.keys.Space = false;
});

// --- Physics ---
function updatePhysics() {
    const p = state.player;
    const mesh = p.mesh;

    if (!mesh) return;

    // Application of forces
    if (state.keys.ArrowLeft) p.velocity.x -= CONFIG.moveSpeed;
    if (state.keys.ArrowRight) p.velocity.x += CONFIG.moveSpeed;

    // Jump
    if (state.keys.Space && p.canJump) {
        p.velocity.y = CONFIG.jumpForce;
        p.canJump = false;
    }

    // Limit Speed
    p.velocity.x = Math.max(Math.min(p.velocity.x, CONFIG.maxSpeed), -CONFIG.maxSpeed);

    // Friction & Gravity
    p.velocity.x *= CONFIG.friction;
    p.velocity.y -= CONFIG.gravity;

    // Apply
    // Move
    mesh.position.x += p.velocity.x * 0.1; // Simple time step
    mesh.position.y += p.velocity.y * 0.1;

    // Rotation (Face direction)
    if (Math.abs(p.velocity.x) > 0.1) {
        // Smooth rotation
        const targetRotation = p.velocity.x > 0 ? Math.PI / 2 : -Math.PI / 2;
        // Basic snap for now or lerp
        mesh.rotation.y = targetRotation;
    }

    // Collision Detection (Simple AABB)
    // Re-calculate player box
    const playerBox = new THREE.Box3();
    const center = mesh.position.clone();

    // Mario Model Properties:
    // Feet are roughly at local Y = -0.5
    // Top is roughly at local Y = +0.8
    // Width is roughly 0.5

    // We want the box to encapsulate this.
    // Center of box should be at (-0.5 + 0.8) / 2 = 0.15 relative to mesh
    // Height = 1.3

    center.y += 0.15;
    const size = new THREE.Vector3(0.5, 1.3, 0.5);

    playerBox.setFromCenterAndSize(center, size);

    p.canJump = false;

    // Platform Collisions (Physics)
    for (const platform of state.platforms) {
        const platformBox = platform.userData.collider;

        if (playerBox.intersectsBox(platformBox)) {
            // Precise separate axis checks would be better, but sticking to simple logic for now
            // Check if we are falling onto the top

            // Platform top is box max Y
            const platformTop = platformBox.max.y;
            // Player bottom is box min Y
            const playerBottom = playerBox.min.y;
            const previousPlayerBottom = playerBottom - p.velocity.y * 0.1; // Estimate prev position

            // Tolerance for "staying on top" vs "hitting side"
            // If we were previously above the platform (or close to it) AND we are falling
            if (p.velocity.y <= 0 && previousPlayerBottom >= platformTop - 0.2) {
                // Snap physics
                // We want playerBottom to be at platformTop
                // playerBottom = mesh.position.y - 0.5 (approx half height from center logic above)
                // Actually: playerBottom = (mesh.position.y + 0.15) - (1.3 / 2) = mesh.position.y - 0.5

                mesh.position.y = platformTop + 0.5;
                p.velocity.y = 0;
                p.canJump = true;
            }
        }
    }

    // Coin Collection
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.rotation.y += 0.05; // Animation

        const coinBox = new THREE.Box3().setFromObject(coin);
        if (playerBox.intersectsBox(coinBox)) {
            scene.remove(coin);
            coins.splice(i, 1);
            score += 100;
            uiScore.innerText = 'SCORE: ' + score;
        }
    }

    // Enemy Collision & Logic
    for (const enemy of enemies) {
        // AI Movement
        enemy.position.x += enemy.userData.direction * enemy.userData.speed;
        if (Math.abs(enemy.position.x - enemy.userData.startX) > enemy.userData.range) {
            enemy.userData.direction *= -1;
        }

        // Collision
        const enemyBox = new THREE.Box3().setFromObject(enemy);
        if (playerBox.intersectsBox(enemyBox)) {
            // Check if jumping on top
            // Use bounding box max Y for more accuracy
            const enemyTop = enemyBox.max.y;
            const enemyBottom = enemyBox.min.y;
            const enemyHeight = enemyTop - enemyBottom;
            const playerBottom = playerBox.min.y;

            // Allow kill if player's feet are above the enemy's vertical center
            // This is very forgiving for "stomps"
            if (p.velocity.y <= 0 && playerBottom > (enemyBottom + enemyHeight * 0.4)) {
                // Kill Enemy
                console.log("Enemy Killed!");
                createExplosion(enemy.position); // BOOM
                scene.remove(enemy);
                enemies.splice(enemies.indexOf(enemy), 1);
                p.velocity.y = 8; // Bounce
                score += 200;
                uiScore.innerText = 'SCORE: ' + score;
            } else {
                // Player Hit Side -> Die / Reset
                console.log("Player Died! Bottom:", playerBottom, "Enemy Top:", enemyTop);
                mesh.position.set(0, 5, 0);
                p.velocity.set(0, 0, 0);
                score = 0;
                uiScore.innerText = 'SCORE: ' + score;
            }
        }
    }

    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const particle = state.particles[i];
        const v = particle.userData.velocity;

        particle.position.add(v);
        v.y -= 0.02; // Gravity

        particle.rotation.x += 0.1;
        particle.rotation.y += 0.1;

        particle.userData.life -= 0.02;

        if (particle.userData.life <= 0) {
            scene.remove(particle);
            state.particles.splice(i, 1);
        }
    }

    // Fail safe floor
    if (mesh.position.y < -20) {
        mesh.position.set(0, 5, 0);
        p.velocity.set(0, 0, 0);
        score = 0;
        uiScore.innerText = 'SCORE: ' + score;
    }
}

// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);

    updatePhysics();

    // Camera Follow
    if (state.player.mesh) {
        // Smooth follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.player.mesh.position.x, 0.1);

        // Clamp Y to not go too low
        const targetY = Math.max(state.player.mesh.position.y + 2, 2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);

        camera.position.z = CONFIG.cameraOffset.z;
        camera.lookAt(state.player.mesh.position.x, state.player.mesh.position.y, 0);
    }

    // Use composer instead of renderer
    composer.render();
}

// --- Init ---
createPlayer();
buildLevel();
animate();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
