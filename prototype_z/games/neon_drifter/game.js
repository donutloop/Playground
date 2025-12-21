// Core Game Engine

class Spaceship {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 400; // Increased size (approx 4x scale visual)
        this.height = 240;
    }

    draw(ctx) {
        // Neo-Retro Spaceship
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(4, 4); // Scale up visual to match new size

        // Thruster flame
        const t = Date.now() / 100;
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(10, 40);
        ctx.lineTo(-20 - Math.sin(t) * 10, 50);
        ctx.lineTo(10, 60);
        ctx.fill();

        // Hull
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(80, 50); // Nose
        ctx.lineTo(0, 60);
        ctx.lineTo(-10, 50);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.ellipse(30, 45, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1; // Thinner line relative to scale
        ctx.beginPath();
        ctx.moveTo(10, 55); ctx.lineTo(0, 70);
        ctx.moveTo(60, 52); ctx.lineTo(65, 70);
        ctx.stroke();

        ctx.restore();
    }
}

class InputHandler {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }
}

class AssetLoader {
    constructor() {
        this.images = {};
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                this.images[key] = null; // Mark as failed
                resolve(null);
            };
        });
    }

    getImage(key) {
        return this.images[key];
    }
}

class Sprite {
    constructor(image, x, y, width, height, frameX = 0, frameY = 0) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.frameX = frameX;
        this.frameY = frameY;
    }

    draw(ctx, x, y, flip = false) {
        if (!this.image) {
            // Fallback for missing image
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x, y, this.width, this.height);
            return;
        }

        ctx.save();
        if (flip) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                this.frameX * 32, this.frameY * 32, 32, 32,
                -x - this.width, y, this.width, this.height
            );
        } else {
            ctx.drawImage(
                this.image,
                this.frameX * 32, this.frameY * 32, 32, 32,
                x, y, this.width, this.height
            );
        }
        ctx.restore();
    }
}


class Player {
    constructor(game) {
        this.game = game;
        this.x = 100;
        this.y = 300;
        this.width = 32;
        this.height = 32;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5.0; // Snappy run
        this.jumpForce = -13.5; // Tuned for ~5 tile high jump
        this.gravity = 0.55; // Heavier gravity for precision
        this.grounded = false;
        this.facingRight = true;
        this.hasWeapon = false;
        this.shotTimer = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this.state = 'IDLE'; // IDLE, RUN, JUMP
    }

    update(input, platforms, enemies) {
        let keys = input.keys;
        if (this.game.aiMode) {
            keys = this.getAIControls(platforms, enemies);
        }

        // Horizontal Movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx = -this.speed;
            this.facingRight = false;
            this.state = 'RUN';
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx = this.speed;
            this.facingRight = true;
            this.state = 'RUN';
        } else {
            this.vx = 0;
            this.state = 'IDLE';
        }

        this.x += this.vx;

        // Camera Scroll Boundary
        if (this.x < 0) this.x = 0;
        // No right boundary for scrolling level, or set a max level width

        // No right boundary for scrolling level, or set a max level width

        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && (this.grounded || (this.game.aiMode && this.y > 400))) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.state = 'JUMP';
        }

        this.vy += this.gravity;
        this.y += this.vy;

        // Platform Collision
        this.grounded = false;

        // Floor collision (Bottom of screen relative to camera is tricky, usually strictly platform based in scrolling)
        if (this.y > 620) { // Hit Lava
            if (this.game.aiMode) {
                this.vy = -20; // Super bounce recovery for AI
            } else {
                this.game.resetLevel();
                return;
            }
        }

        // Platform collisions
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.w &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.h &&
                this.y + this.height > platform.y) {

                // Simple collision resolution
                // Check if landing on top
                if (this.vy > 0 && this.y + this.height - this.vy <= platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                }
            }
        });

        // Enemy/Spike Collision
        enemies.forEach(e => {
            if (this.x < e.x + e.width &&
                this.x + this.width > e.x &&
                this.y < e.y + e.height &&
                this.y + this.height > e.y) {

                // Check if jumped on top (Forgiving hitbox: 75% of height)
                if (this.vy > 0 && this.y + this.height - this.vy <= e.y + e.height * 0.75) {
                    // Kill enemy (Even Spikes!)
                    e.dead = true;
                    this.vy = -10; // Big Bounce
                } else {
                    // Die
                    if (!this.game.aiMode) {
                        this.game.resetLevel();
                    }
                }
            }
        });

        // Weapon Pickup Collision
        this.game.pickups.forEach(p => {
            if (!p.dead &&
                this.x < p.x + p.width &&
                this.x + this.width > p.x &&
                this.y < p.y + p.height &&
                this.y + this.height > p.y) {

                this.hasWeapon = true;
                p.dead = true;
            }
        });

        // Shooting
        if (this.shotTimer > 0) this.shotTimer--;
        if (this.hasWeapon && keys['KeyF'] && this.shotTimer === 0) {
            this.game.bullets.push(new Bullet(this.game,
                this.x + (this.facingRight ? this.width : 0),
                this.y + this.height / 2,
                this.facingRight ? 1 : -1
            ));
            this.shotTimer = 20; // Cooldown
        }

        // --- VICTORY CONDITION ---
        // Check collision with Spaceship (Approximate at end of level)
        if (this.x > 12000) {
            this.game.state = 'VICTORY';
        }
    }


    draw(ctx) {
        // Procedural Cyber Ninja - High Fidelity (Thumbnail Style)
        ctx.save();

        // Translate to center for rotation/scaling
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);

        // Visual Scale: 1.8x larger to really pop
        ctx.scale(1.8, 1.8);

        if (!this.facingRight) ctx.scale(-1, 1);

        // --- SCARF (Flowing & Glowing) ---
        // Dynamic sine wave based on movement
        const t = Date.now() / 150;
        const speedFactor = Math.abs(this.vx) > 0 ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(-4, -8); // Neck anchor
        // Longer, more dramatic scarf
        ctx.bezierCurveTo(
            -15, -15 + Math.sin(t * speedFactor) * 5,
            -25, -5 + Math.cos(t * speedFactor) * 5,
            -45, -10 + Math.sin(t * speedFactor + 1) * 10
        );
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#bc13fe'; // Deep Neon Pink (Thumbnail match)
        ctx.stroke();

        // Inner brighter core for scarf
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff55ff';
        ctx.stroke();

        // --- BODY (Dark Cyber Armor) ---
        ctx.fillStyle = '#1a1a2e'; // Dark Blue/Black Armor

        // Torso
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(6, -10);
        ctx.lineTo(4, 9);
        ctx.lineTo(-4, 9);
        ctx.fill();

        // Armor Plate Highlight (Chest)
        ctx.fillStyle = '#303050';
        ctx.fillRect(-3, -6, 6, 6);

        // --- HEAD ---
        ctx.fillStyle = '#0a0a0a'; // Helmet Base
        ctx.beginPath();
        ctx.arc(0, -14, 9, 0, Math.PI * 2);
        ctx.fill();

        // --- VISOR (The Iconic Look) ---
        // Glowing Cyan Visor
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        ctx.fillStyle = '#00f3ff';

        ctx.beginPath();
        // Sleek angular visor
        ctx.moveTo(4, -16);
        ctx.lineTo(9, -16); // Side
        ctx.lineTo(7, -11); // Indent
        ctx.lineTo(2, -11);
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- LIMBS ---
        ctx.fillStyle = '#1a1a2e'; // Dark Armor

        // Arms
        if (this.hasWeapon) {
            // Aiming pose
            ctx.fillRect(2, -6, 12, 4); // Right Arm extended
        } else {
            // Idle/Run
            const armAngle = this.state === 'RUN' ? Math.sin(Date.now() / 100) * 0.8 : 0;
            ctx.save();
            ctx.translate(0, -8);
            ctx.rotate(armAngle);
            ctx.fillRect(-2, 0, 5, 12);
            ctx.restore();
        }

        // Legs
        if (this.state === 'JUMP') {
            // Jump Pose (Tucked)
            ctx.fillRect(-6, 8, 5, 8); // Back leg
            ctx.fillRect(2, 6, 5, 8);  // Front leg tucked
        } else if (this.state === 'RUN') {
            // Run Cycle
            const legPhase = Math.sin(Date.now() / 80);

            // Back Leg
            ctx.save();
            ctx.translate(-2, 8);
            ctx.rotate(-legPhase * 1.0);
            ctx.fillRect(-2, 0, 5, 14);
            ctx.restore();

            // Front Leg
            ctx.save();
            ctx.translate(2, 8);
            ctx.rotate(legPhase * 1.0);
            ctx.fillRect(-2, 0, 5, 14);
            ctx.restore();
        } else {
            // Idle Stance
            ctx.fillRect(-7, 8, 5, 14);
            ctx.fillRect(2, 8, 5, 14);
        }

        // --- KATANA (On Back) ---
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -15); // Handle top left
        ctx.lineTo(8, 5);    // Tip bottom right
        ctx.stroke();

        ctx.restore();
    }

    getAIControls(platforms, enemies) {
        const keys = { 'ArrowRight': true, 'Space': false, 'KeyF': false }; // Always move right

        // 1. Jump Gaps
        // Future check: Look ahead 50px
        const checkX = this.x + (this.facingRight ? 50 : -50);
        let platformUpcoming = false;

        platforms.forEach(p => {
            // Simple AABB check for platform under future feet
            if (checkX >= p.x && checkX <= p.x + p.w &&
                this.y + this.height < p.y + 10) { // Platform is below us (approx)
                platformUpcoming = true;
            }
        });

        // If no platform ahead, or platform is too high -> JUMP
        // Also check if we are AT THE EDGE of current platform
        let onPlatform = false;
        platforms.forEach(p => {
            // Check if we are currently supported
            if (this.x + this.width / 2 >= p.x && this.x + this.width / 2 <= p.x + p.w &&
                this.y + this.height <= p.y + 5 && this.y + this.height >= p.y - 5) {
                onPlatform = true;

                // Check for wall jump (platform ahead is higher)
                // Or if there's a platform ahead but it's higher than current
                const wallAhead = platforms.find(wp =>
                    wp.x > this.x + 20 && wp.x < this.x + 150 && // Ahead
                    wp.y < this.y // Higher
                );
                if (wallAhead) keys['Space'] = true;
            }
        });

        // Jump if we are grounded, reached edge (no platform upcoming), and are safe to jump
        // Also jump if we see a wall
        if (this.grounded) {
            if (!platformUpcoming && onPlatform) keys['Space'] = true;
        }

        // 2. Shoot Enemies
        // 2. Shoot Enemies or Avoid Spikes
        enemies.forEach(e => {
            if (!e.dead) {
                // Shooting Logic
                if (Math.abs(e.y - this.y) < 80 && // Approx same height
                    e.x > this.x && e.x < this.x + 500) { // Ahead and in range
                    keys['KeyF'] = true;
                }

                // Evasion Logic (Spikes/GroundBots close)
                if (e.x > this.x && e.x < this.x + 100 && // Close ahead
                    Math.abs(e.y - this.y) < 50) { // On same ground
                    keys['Space'] = true; // Jump to stomp or avoid
                }
            }
        });

        return keys;
    }
}

class Drone {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.vx = 1; // Slowed from 2
        this.patrolStart = x;
        this.patrolDist = 100;
        this.type = 'DRONE';
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        if (this.x > this.patrolStart + this.patrolDist || this.x < this.patrolStart) {
            this.vx *= -1;
        }
    }

    draw(ctx) {
        // Procedural Drone Enemy
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const hover = Math.sin(Date.now() / 300) * 5;

        ctx.save();
        ctx.translate(cx, cy + hover);

        // Main Body
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Eye
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.vx > 0 ? 4 : -4, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Propeller
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-16, -24, 32, 2);

        ctx.restore();
    }
}

class GroundBot {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.vx = 2.0; // Faster patrol
        this.patrolStart = x;
        this.patrolDist = 150;
        this.type = 'BOT';
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        if (this.x > this.patrolStart + this.patrolDist || this.x < this.patrolStart) {
            this.vx *= -1;
        }
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        if (this.vx < 0) ctx.scale(-1, 1);

        // Track/Wheels
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-8, 12, 6, 0, Math.PI * 2);
        ctx.arc(8, 12, 6, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#cc6600'; // Orange Industrial
        ctx.fillRect(-12, -8, 24, 20);

        // Eye
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(4, -4, 6, 4);

        ctx.restore();
    }
}

class Spike {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = 'SPIKE';
        this.dead = false;
    }

    update() { } // Static

    draw(ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 32);
        ctx.lineTo(this.x + 16, this.y);
        ctx.lineTo(this.x + 32, this.y + 32);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}


class Bullet {
    constructor(game, x, y, direction) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = direction * 10;
        this.width = 10;
        this.height = 4;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        // Cull if off camera
        if (this.x < this.game.camera.x || this.x > this.game.camera.x + this.game.width) {
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class WeaponPickup {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.dead = false;
        this.baseY = y;
    }

    update() {
        // Float animation
        this.y = this.baseY + Math.sin(Date.now() / 300) * 5;
    }

    draw(ctx) {
        ctx.font = '24px "Arial"';
        ctx.fillText('🔫', this.x, this.y + 24);

        // Glow ring
        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 12, 20, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Game {
    constructor(width, height) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.input = new InputHandler();
        this.assets = new AssetLoader();

        // Preload Assets (Async but we start game anyway)
        this.assets.loadImage('player', 'sprites/player_sheet.png');
        this.assets.loadImage('city', 'sprites/city_bg.png'); // Keep fallback
        this.assets.loadImage('bg_industrial', 'sprites/bg_industrial.png');
        this.assets.loadImage('bg_core', 'sprites/bg_core.png');
        this.assets.loadImage('bg_glitch', 'sprites/bg_glitch.png');
        this.assets.loadImage('enemy', 'sprites/enemy.png');
        this.assets.loadImage('tiles', 'sprites/tiles.png');

        this.player = new Player(this);
        this.camera = { x: 0, y: 0 };
        this.bullets = [];
        this.aiMode = false; // AI Auto-play flag
        this.pickups = [
            new WeaponPickup(this, 300, 500) // Early pistol
        ];

        // --- LEVEL DESIGN (3 Phases) ---
        // Phase 1: Outskirts (0-1000)
        // Phase 2: Industrial (1000-2500)
        // Phase 3: Core (2500-4000)

        this.initLevel();

        // Game State
        this.state = 'MENU'; // MENU, MAP, LEVEL
        this.mapNode = 0; // 0 = Start, 1 = Level 1

        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resetLevel() {
        this.initLevel();
    }

    initLevel() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hasWeapon = false;
        this.camera.x = 0;
        this.bullets = [];
        this.pickups = [new WeaponPickup(this, 300, 500)];

        // --- EXTENDED LEVEL DESIGN ---
        this.platforms = [];
        this.enemies = [];

        // --- PHASE 1: OUTSKIRTS (0 - 2000) ---
        // Easy platforming, learning controls.
        this.platforms.push(
            { x: 0, y: 500, w: 950, h: 50 }, // Start
            { x: 900, y: 450, w: 450, h: 20 }, // Massive
            { x: 1200, y: 400, w: 450, h: 20 }, // Massive overlap
            { x: 1500, y: 350, w: 450, h: 20 }, // Massive overlap
            { x: 1800, y: 400, w: 500, h: 50 } // Checkpoint floor
        );
        this.enemies.push(
            new Drone(this, 1300, 380), // Lowered
            new Drone(this, 1900, 380)  // Lowered
        );

        // --- PHASE 2: INDUSTRIAL (2000 - 4500) ---
        // GroundBots, Spikes, tighter jumps.
        this.platforms.push(
            { x: 2200, y: 450, w: 350, h: 20 }, // Longer to reach
            { x: 2400, y: 500, w: 800, h: 50 }, // Combat Arena (Huge)
            { x: 3100, y: 450, w: 300, h: 20 }, // Longer
            { x: 3300, y: 400, w: 300, h: 20 }, // Longer
            { x: 3500, y: 500, w: 1000, h: 50 }, // Long Gauntlet
            { x: 4400, y: 400, w: 400, h: 20 }  // Longer
        );
        this.enemies.push(
            new GroundBot(this, 2500, 468),
            new Spike(this, 2700, 468),
            new GroundBot(this, 2800, 468),
            new GroundBot(this, 3600, 468),
            new Spike(this, 3800, 468),
            new Spike(this, 4000, 468),
            new GroundBot(this, 4100, 468)
        );

        // --- PHASE 3: THE CORE (4500 - 7000) ---
        // Verticality, Drones everywhere.
        this.platforms.push(
            { x: 4700, y: 350, w: 350, h: 20 }, // Longer
            { x: 4900, y: 300, w: 350, h: 20 }, // Longer overlap
            { x: 5100, y: 250, w: 350, h: 20 }, // Longer overlap
            { x: 5300, y: 200, w: 350, h: 20 }, // Longer overlap
            { x: 5500, y: 500, w: 1200, h: 50 }, // Floor catch (Huge)
            { x: 6000, y: 380, w: 350, h: 20 }, // Longer
            { x: 6200, y: 330, w: 350, h: 20 }, // Longer
            { x: 6400, y: 280, w: 350, h: 20 }, // Longer
            { x: 6700, y: 400, w: 600, h: 50 } // Rest (Huge)
        );
        this.enemies.push(
            new Drone(this, 5000, 230), // Lowered
            new Drone(this, 5200, 180), // Lowered
            new GroundBot(this, 5600, 468),
            new GroundBot(this, 5800, 468),
            new Drone(this, 6100, 310), // Adjusted
            new Drone(this, 6300, 260)  // Adjusted
        );

        // --- PHASE 4: ASCENSION (7000 - 10000) ---
        // New Phase. High risk.
        this.platforms.push(
            { x: 7200, y: 350, w: 400, h: 20 }, // Staircase step (Huge)
            { x: 7500, y: 300, w: 400, h: 20 }, // Staircase step
            { x: 7800, y: 250, w: 400, h: 20 }, // Staircase step
            { x: 8100, y: 200, w: 400, h: 20 }, // Staircase step
            { x: 8400, y: 150, w: 400, h: 20 }, // Staircase step
            { x: 8700, y: 400, w: 800, h: 50 }, // Landing (Huge)
            { x: 9400, y: 300, w: 500, h: 20 }
        );
        this.enemies.push(
            new Drone(this, 7500, 280), // Lowered
            new Drone(this, 7800, 230), // Lowered
            new Drone(this, 8100, 180)  // Lowered
        );

        // --- PHASE 5: GLITCH CORE (10000+) ---
        // Disjointed, chaotic platforms.
        this.platforms.push(
            { x: 9950, y: 400, w: 300, h: 10 }, // Longer
            { x: 10300, y: 300, w: 150, h: 50 },  // Longer
            { x: 10500, y: 500, w: 150, h: 50 },  // Longer
            { x: 10680, y: 380, w: 200, h: 20 }, // Stepper (Longer)
            { x: 10850, y: 250, w: 400, h: 10 }, // Longer
            { x: 11200, y: 400, w: 300, h: 10 }, // Longer
            { x: 11450, y: 350, w: 1000, h: 50 } // END
        );
        this.enemies.push(
            new Drone(this, 10300, 200),
            new Drone(this, 10850, 150),
            new Spike(this, 11500, 318),
            new GroundBot(this, 11600, 318),
            new Spike(this, 11700, 318)
        );

        // --- VICTORY SHIP ---
        // Y Position calculated: Platform Y (350) - Ship Leg Height (280) = 70
        this.spaceship = new Spaceship(this, 11800, 70);
    }

    update(dt) {
        if (this.state === 'MENU') {
            if (this.input.keys['Enter'] || this.input.keys['Space']) {
                this.state = 'MAP';
                this.input.keys['Enter'] = false;
                this.input.keys['Space'] = false;
            }
            // Return to Launcher
            if (this.input.keys['Escape']) {
                window.location.href = '../../index.html';
                this.input.keys['Escape'] = false;
            }
        } else if (this.state === 'MAP') {
            if (this.input.keys['Enter']) {
                if (this.mapNode === 1) {
                    this.state = 'LEVEL';
                    this.player.x = 100;
                    this.player.y = 300;
                    this.player.vx = 0;
                    this.player.vy = 0;
                }
                this.input.keys['Enter'] = false;
            }

            // Move on map
            if (this.input.keys['ArrowRight'] && this.mapNode === 0) {
                this.mapNode = 1;
                this.input.keys['ArrowRight'] = false; // Debounce
            }
            if (this.input.keys['ArrowLeft'] && this.mapNode === 1) {
                this.mapNode = 0;
                this.input.keys['ArrowLeft'] = false;
            }

            // Return to Menu
            if (this.input.keys['Escape']) {
                this.state = 'MENU';
                this.input.keys['Escape'] = false;
            }

        } else if (this.state === 'LEVEL') {
            this.player.update(this.input, this.platforms, this.enemies);

            this.enemies.forEach(e => e.update());
            this.enemies = this.enemies.filter(e => !e.dead);

            this.pickups.forEach(p => p.update());
            this.pickups = this.pickups.filter(p => !p.dead);

            this.bullets.forEach(b => b.update());
            this.bullets = this.bullets.filter(b => !b.dead);

            // Bullet Collisions
            this.bullets.forEach(b => {
                this.enemies.forEach(e => {
                    if (!b.dead && !e.dead &&
                        b.x < e.x + e.width &&
                        b.x + b.width > e.x &&
                        b.y < e.y + e.height &&
                        b.y + b.height > e.y) {

                        e.dead = true;
                        b.dead = true;
                    }
                });
            });

            // Camera follow player
            if (this.player.x > this.width * 0.4) {
                this.camera.x = this.player.x - this.width * 0.4;
            }
            if (this.camera.x < 0) this.camera.x = 0;

            if (this.input.keys['Escape']) {
                this.state = 'MAP';
                this.input.keys['Escape'] = false;
            }

            // AI Toggle (Shift + A)
            if (this.input.keys['ShiftLeft'] && this.input.keys['KeyA']) {
                this.aiMode = !this.aiMode;
                this.input.keys['KeyA'] = false; // Debounce
                console.log("AI Mode:", this.aiMode);
            }
        } else if (this.state === 'VICTORY') {
            if (this.input.keys['Space']) {
                this.state = 'MAP';
                this.input.keys['Space'] = false;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.state === 'MENU') {
            this.drawMenu();
        } else if (this.state === 'MAP') {
            this.drawMap();
        } else if (this.state === 'LEVEL') {
            this.drawLevel();
        } else if (this.state === 'VICTORY') {
            this.drawVictory();
        }
    }

    drawVictory() {
        // Clear logic to stop game loop visual noise
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MISSION COMPLETE', this.width / 2, this.height / 2 - 50);

        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('You escaped the Neon City.', this.width / 2, this.height / 2 + 20);

        this.ctx.fillStyle = '#555';
        this.ctx.fillText('SPACE: RETURN TO MAP | ESC: MENU', this.width / 2, this.height / 2 + 80);
    }

    drawMenu() {
        // --- BACKGROUND ---
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#020024');
        gradient.addColorStop(1, '#090979');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Grid
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.width; i += 40) {
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
        }
        for (let i = 0; i < this.height; i += 40) {
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width, i);
        }
        this.ctx.stroke();

        // Title
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '60px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NEON', this.width / 2, this.height / 2 - 50);

        this.ctx.shadowColor = '#ff00ff';
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText('DRIFTER', this.width / 2, this.height / 2 + 20);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px "Press Start 2P"';

        // Blink effect
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = '#fff';
            this.ctx.fillText('PRESS SPACE TO START', this.width / 2, this.height / 2 + 100);

            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText('ESC: EXIT TO LAUNCHER', this.width / 2, this.height / 2 + 130);

            this.ctx.shadowBlur = 0;
        }

        // Draw Player for style
        this.player.x = this.width / 2 - 16;
        this.player.y = this.height / 2 + 130;
        this.player.facingRight = true;
        this.player.state = 'IDLE';
        this.player.draw(this.ctx);
    }

    drawMap() {
        // --- CYBER CITY MAP ---
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // City Skyline Silhouette
        this.ctx.fillStyle = '#111';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        for (let i = 0; i < this.width; i += 50) {
            const h = Math.random() * 100 + 50;
            this.ctx.lineTo(i, this.height - h);
            this.ctx.lineTo(i + 40, this.height - h);
        }
        this.ctx.lineTo(this.width, this.height);
        this.ctx.fill();

        // City Lights
        this.ctx.fillStyle = '#00ffff';
        for (let i = 0; i < 50; i++) {
            if (Math.random() > 0.9) {
                const x = Math.random() * this.width;
                const y = this.height - Math.random() * 100;
                this.ctx.fillRect(x, y, 2, 2);
            }
        }

        // Render Paths
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineDashOffset = -Date.now() / 20; // Animated Dash
        this.ctx.beginPath();
        this.ctx.moveTo(100, 300);
        this.ctx.lineTo(400, 300);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '30px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SECTOR SELECT', this.width / 2, 80);
        this.ctx.shadowBlur = 0;

        // Nodes
        this.drawNode(100, 300, 'S', this.mapNode === 0, false);
        this.drawNode(400, 300, '1', this.mapNode === 1, false);
        this.drawNode(600, 200, '2', false, true); // Locked Node
        this.drawNode(550, 400, '3', false, true); // Locked Node

        // Dev Labels
        this.ctx.fillStyle = '#ff5555';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText('IN DEVELOPMENT', 600, 160);
        this.ctx.fillText('IN DEVELOPMENT', 550, 440);

        // Locked Paths
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(400, 300);
        this.ctx.lineTo(600, 200);
        this.ctx.moveTo(400, 300);
        this.ctx.lineTo(550, 400);
        this.ctx.stroke();

        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('ARROWS: MOVE | ENTER: SELECT | ESC: MENU', this.width / 2, this.height - 40);
    }

    drawNode(x, y, label, isSelected, isLocked) {
        if (isLocked) {
            this.ctx.strokeStyle = '#555';
            this.ctx.fillStyle = '#222';
        } else {
            this.ctx.strokeStyle = isSelected ? '#fff' : '#00ffff';
            this.ctx.fillStyle = isSelected ? '#ff00ff' : '#000';
        }

        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = isLocked ? '#555' : '#fff';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y);
        this.ctx.textBaseline = 'alphabetic';

        if (isSelected) {
            // Player Icon (Cyber Triangle)
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 40);
            this.ctx.lineTo(x - 10, y - 25);
            this.ctx.lineTo(x + 10, y - 25);
            this.ctx.fill();
        }
    }

    drawLevel() {
        // --- DYNAMIC BACKGROUND & PHASES ---
        // --- DYNAMIC BACKGROUND & PHASES ---
        let bgStart = '#0f0c29';
        let bgMid = '#302b63';
        let bgEnd = '#24243e';
        let phase = 0;

        if (this.player.x > 2000 && this.player.x < 4500) phase = 1; // Industrial
        if (this.player.x >= 4500 && this.player.x < 7000) phase = 2; // Core
        if (this.player.x >= 7000 && this.player.x < 10000) phase = 3; // Ascension
        if (this.player.x >= 10000) phase = 4; // Glitch Core

        if (phase === 1) { // Industrial -> Deep Magenta/Purple (Synthwave Factory)
            bgStart = '#240b36'; // Dark Purple
            bgMid = '#c31432';   // Deep Red/Magenta
            bgEnd = '#1a0b2e';
        } else if (phase === 2) { // Core -> Deep Indigo/Cyan (Data Center)
            bgStart = '#020024';
            bgMid = '#00d4ff';   // Cyan
            bgEnd = '#090979';
        } else if (phase === 3) { // Ascension -> Royal Gold/Purple
            bgStart = '#240046';
            bgMid = '#7b2cbf';
            bgEnd = '#ff9e00';
        } else if (phase === 4) { // Glitch Core -> Pure Glitch
            bgStart = '#000000';
            bgMid = '#ff00ff';
            bgEnd = '#ffffff';
            // Random glitch flicker logic could go here later
        }

        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, bgStart);
        gradient.addColorStop(0.5, bgMid);
        gradient.addColorStop(1, bgEnd);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // --- PARALLAX CITY SKYLINE (Dynamic Phase Sprite) ---
        let bgKey = 'bg_industrial';
        if (phase === 1) bgKey = 'bg_industrial';
        if (phase === 2) bgKey = 'bg_core'; // Transition to Core earlier
        if (phase === 3) bgKey = 'bg_core';
        if (phase === 4) bgKey = 'bg_glitch';

        const citySprite = this.assets.getImage(bgKey) || this.assets.getImage('city');

        this.ctx.save();
        const scrollFactor = 0.2;
        const cityOffset = -(this.camera.x * scrollFactor);

        if (citySprite) {
            // Draw Tiled Background
            const bgWidth = 512; // Assumed width of generated sprite
            const bgHeight = 400; // Desired height

            // Calculate start tile
            const startTile = Math.floor(-cityOffset / bgWidth);
            const offsetX = cityOffset % bgWidth;

            // Draw enough tiles to cover screen
            // Note: Images have transparency processed, so normal blend is fine.
            for (let i = -1; i < (this.width / bgWidth) + 1; i++) {
                this.ctx.drawImage(
                    citySprite,
                    i * bgWidth + offsetX, this.height - bgHeight,
                    bgWidth, bgHeight
                );
            }
        } else {
            // Fallback (Silhouette)
            this.ctx.translate(cityOffset % 200, 0);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = -200; i < this.width + 200; i += 80) {
                const h = 100 + Math.abs(Math.sin(i * 99)) * 150;
                this.ctx.fillRect(i, this.height - h, 60, h);
            }
        }

        // --- FLICKERING LIGHTS OVERLAY (User Requested) ---
        // Overlay procedural lights to keep the "alive/flickering" chaos
        this.ctx.globalCompositeOperation = 'lighten';
        for (let i = 0; i < this.width; i += 40) {
            if (Math.random() > 0.8) {
                const h = Math.random() * 300;
                this.ctx.fillStyle = Math.random() > 0.5 ? '#ff00ff' : '#00ffff';
                this.ctx.globalAlpha = Math.random() * 0.8;
                // Random little window rect
                this.ctx.fillRect(i + Math.random() * 20, this.height - h, 4 + Math.random() * 6, 4 + Math.random() * 6);
            }
        }
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1.0;

        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        // Grid Floor Perspective (Fixed to camera for parallax feel)
        // Grid Floor Perspective (Fixed to camera for parallax feel)
        let gridColor = '#00ffff'; // Default
        if (phase === 1) gridColor = '#ff00ff'; // Magenta
        if (phase === 2) gridColor = '#00d4ff'; // Cyan
        if (phase === 3) gridColor = '#ffd700'; // Gold
        if (phase === 4) gridColor = '#ffffff'; // White

        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Offset grid by camera for pseudo-3D
        const gridOffset = this.camera.x % 40;

        for (let i = -40; i < this.width + 40; i += 40) {
            // Slanted vertical lines
            this.ctx.moveTo(this.camera.x + i - gridOffset, this.height / 2);
            this.ctx.lineTo(this.camera.x + i - (this.width / 2 - i) * 2 - gridOffset, this.height);
        }
        // Horizontal lines
        for (let i = this.height / 2; i < this.height; i += 20) {
            this.ctx.moveTo(this.camera.x, i);
            this.ctx.lineTo(this.camera.x + this.width, i);
        }
        this.ctx.globalAlpha = 0.2;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;

        // Draw Platforms
        this.platforms.forEach(p => {
            // Cull off-screen
            if (p.x + p.w < this.camera.x || p.x > this.camera.x + this.width) return;

            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.fillRect(p.x, p.y, p.w, p.h);

            // Content Glow
            this.ctx.shadowBlur = 15; // Increased glow
            let glowColor = '#00ffff';
            if (phase === 1) glowColor = '#ff00ff';
            if (phase === 2) glowColor = '#00d4ff';
            if (phase === 3) glowColor = '#ffd700';
            if (phase === 4) glowColor = '#ffffff';

            this.ctx.shadowColor = glowColor;
            this.ctx.strokeStyle = glowColor;
            this.ctx.lineWidth = 3; // Thicker lines
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);
            this.ctx.shadowBlur = 0;
        });

        // --- LAVA / FIRE FLOOR (Visualizing Death Zone) ---
        const lavaY = 600;
        const lavaTime = Date.now() / 500; // Renamed to avoid local scope conflict

        // Lava Base
        this.ctx.fillStyle = '#aa0000';
        this.ctx.fillRect(this.camera.x, lavaY, this.width, 200);

        // Lava Waves
        this.ctx.fillStyle = '#ff4400';
        this.ctx.beginPath();
        this.ctx.moveTo(this.camera.x, lavaY);
        for (let i = 0; i <= this.width; i += 20) {
            // Use camera x in sin calculation for continuous wave feeling
            const waveH = Math.sin((i + this.camera.x) * 0.02 + lavaTime) * 10;
            this.ctx.lineTo(this.camera.x + i, lavaY + waveH);
        }
        this.ctx.lineTo(this.camera.x + this.width, lavaY + 200);
        this.ctx.lineTo(this.camera.x, lavaY + 200);
        this.ctx.fill();

        // Lava Glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.fillStyle = '#ffaa00'; // Hot tops
        for (let i = 0; i < 10; i++) {
            const px = this.camera.x + (Date.now() / 2 + i * 200) % this.width;
            const py = lavaY + Math.sin(i + lavaTime) * 10;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 5 + Math.random() * 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // Pickups
        this.pickups.forEach(p => {
            if (p.x + p.width < this.camera.x || p.x > this.camera.x + this.width) return;
            p.draw(this.ctx);
        });

        // Bullets
        this.bullets.forEach(b => b.draw(this.ctx));

        // Enemies
        this.enemies.forEach(e => {
            if (e.x + e.width < this.camera.x || e.x > this.camera.x + this.width) return;
            e.draw(this.ctx);
        });

        // Spaceship (if exists)
        if (this.spaceship) {
            this.spaceship.draw(this.ctx);
        }

        // Player
        this.player.draw(this.ctx);
        if (this.player.hasWeapon) {
            // Draw pistol on player
            this.ctx.fillStyle = '#ff00ff';
            const px = this.player.x + (this.player.facingRight ? 20 : -10);
            this.ctx.fillRect(px, this.player.y + 15, 10, 5);
        }

        this.ctx.restore();

        // HUD
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'left';

        let phaseName = "OUTSKIRTS";
        if (phase === 1) phaseName = "INDUSTRIAL";
        if (phase === 2) phaseName = "CORE";
        if (phase === 3) phaseName = "ASCENSION";
        if (phase === 4) phaseName = "GLITCH CORE";

        this.ctx.fillText(`SECTOR: ${phaseName}`, 20, 40);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${Math.floor(this.player.x)}m`, this.width - 20, 40);

        // Controls Display
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        let controlsText = "ARROWS: MOVE  SPACE: JUMP  ESC: MAP";
        if (this.player.hasWeapon) {
            controlsText += "  F: SHOOT";
            this.ctx.fillStyle = '#00ffff'; // Highlight when weapon active
        }
        this.ctx.fillText(controlsText, 20, this.height - 20);
    }

    animate(timeStamp) {
        if (!this.lastTime) this.lastTime = timeStamp;
        const dt = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        // Cumulative logic for fixed timestep (60 FPS)
        if (!this.accumulator) this.accumulator = 0;
        this.accumulator += dt;

        // Cap accumulator to prevent spiral of death
        if (this.accumulator > 200) this.accumulator = 200;

        const TIME_STEP = 1000 / 60; // 16.66ms

        while (this.accumulator >= TIME_STEP) {
            this.update(TIME_STEP);
            this.accumulator -= TIME_STEP;
        }

        this.draw();
        requestAnimationFrame(this.animate);
    }
}

window.onload = () => {
    new Game(800, 600);
};

