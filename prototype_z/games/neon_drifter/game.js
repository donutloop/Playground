// Core Game Engine

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
        this.speed = 4.5; // Fast run for long jumps
        this.jumpForce = -13; // HIGH jump
        this.gravity = 0.25; // LOW gravity (Moon physics)
        this.grounded = false;
        this.facingRight = true;
        this.hasWeapon = false;
        this.shotTimer = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this.state = 'IDLE'; // IDLE, RUN, JUMP
    }

    update(input, platforms, enemies) {
        // Horizontal Movement
        if (input.keys['ArrowLeft'] || input.keys['KeyA']) {
            this.vx = -this.speed;
            this.facingRight = false;
            this.state = 'RUN';
        } else if (input.keys['ArrowRight'] || input.keys['KeyD']) {
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

        if ((input.keys['Space'] || input.keys['ArrowUp'] || input.keys['KeyW']) && this.grounded) {
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
            this.game.resetLevel();
            return;
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
                    this.game.resetLevel();
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
        if (this.hasWeapon && input.keys['KeyF'] && this.shotTimer === 0) {
            this.game.bullets.push(new Bullet(this.game,
                this.x + (this.facingRight ? this.width : 0),
                this.y + this.height / 2,
                this.facingRight ? 1 : -1
            ));
            this.shotTimer = 20; // Cooldown
        }
    }


    draw(ctx) {
        // Procedural Cyber Ninja
        ctx.save();

        // Translate to center of sprite for rotation/scaling
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);
        if (!this.facingRight) ctx.scale(-1, 1);

        // --- SCARF/CAPE PHYSICS (Simple Sine Wave) ---
        const t = Date.now() / 200;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.bezierCurveTo(-15, -5 + Math.sin(t) * 5, -25, -5 + Math.cos(t) * 5, -35, -5 + Math.sin(t + 1) * 10);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff00ff'; // Neon Pink Scarf
        ctx.stroke();

        // --- BODY ---
        ctx.fillStyle = '#2d2d2d'; // Dark Grey Armor
        ctx.fillRect(-10, -10, 20, 26);

        // --- LEGS ---
        ctx.fillStyle = '#1a1a1a';
        if (this.state === 'RUN') {
            // Run cycle leg bob
            const runOffset = Math.sin(Date.now() / 50) * 5;
            ctx.fillRect(-10, 16, 8, 10 + runOffset);
            ctx.fillRect(2, 16, 8, 10 - runOffset);
        } else {
            ctx.fillRect(-10, 16, 8, 16);
            ctx.fillRect(2, 16, 8, 16);
        }

        // --- HEAD ---
        ctx.fillStyle = '#111'; // Black Helmet
        ctx.beginPath();
        ctx.arc(0, -12, 12, 0, Math.PI * 2);
        ctx.fill();

        // --- VISOR (Glowing) ---
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff'; // Cyan Visor
        ctx.fillRect(2, -14, 10, 4);
        ctx.shadowBlur = 0;

        // --- SWORD ---
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-12, -5, 4, 30); // Sheath on back

        ctx.restore();
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
        this.vx = 0.8; // Slowed from 1.5
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
        this.assets.loadImage('player', 'sprites/player_idle.png');
        this.assets.loadImage('enemy', 'sprites/enemy.png');
        this.assets.loadImage('tiles', 'sprites/tiles.png');

        this.player = new Player(this);
        this.camera = { x: 0, y: 0 };
        this.bullets = [];
        this.pickups = [
            new WeaponPickup(this, 300, 500) // Early pistol
        ];

        // --- LEVEL DESIGN (3 Phases) ---
        // Phase 1: Outskirts (0-1000)
        // Phase 2: Industrial (1000-2500)
        // Phase 3: Core (2500-4000)

        this.platforms = [
            // Safe Start (Super long)
            { x: 0, y: 500, w: 800, h: 50 },

            // Phase 1: Platforms & Gaps (Super Easy)
            { x: 850, y: 450, w: 200, h: 20 },
            { x: 1100, y: 400, w: 150, h: 20 }, // Bridge to Ph2

            // Phase 2: Industrial (Longer floor for fighting)
            { x: 1200, y: 500, w: 800, h: 50 }, // Extended floor
            { x: 1300, y: 350, w: 150, h: 20 }, // Safety platform
            { x: 1600, y: 300, w: 150, h: 20 },

            // Phase 3: The Core (Verticality - kept hard but wider)
            { x: 2100, y: 500, w: 300, h: 50 },
            { x: 2400, y: 400, w: 120, h: 20 },
            { x: 2600, y: 300, w: 120, h: 20 },
            { x: 2800, y: 200, w: 120, h: 20 },
            { x: 3000, y: 150, w: 400, h: 20 }, // Final Platform
        ];

        this.enemies = [
            // Outskirts
            new Drone(this, 950, 300),

            // Industrial
            new GroundBot(this, 1300, 468),
            new GroundBot(this, 1600, 468),
            new Spike(this, 1500, 468),

            // Core
            new Drone(this, 2400, 200),
            new Drone(this, 2600, 150)
        ];

        // Game State
        this.state = 'MENU'; // MENU, MAP, LEVEL
        this.mapNode = 0; // 0 = Start, 1 = Level 1

        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resetLevel() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hasWeapon = false; // Lose weapon on death
        this.camera.x = 0;
        this.bullets = [];
        this.pickups = [new WeaponPickup(this, 300, 500)]; // Respawn Item

        // Reset enemies (Hack: Re-create them)
        this.enemies = [
            new Drone(this, 950, 300),
            new GroundBot(this, 1300, 468),
            new GroundBot(this, 1600, 468),
            new Spike(this, 1500, 468),
            new Drone(this, 2400, 200),
            new Drone(this, 2600, 150)
        ];
    }

    update(dt) {
        if (this.state === 'MENU') {
            if (this.input.keys['Enter'] || this.input.keys['Space']) {
                this.state = 'MAP';
                this.input.keys['Enter'] = false;
                this.input.keys['Space'] = false;
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
        }
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
        this.ctx.fillText('ARROWS to Move, ENTER to Select', this.width / 2, this.height - 40);
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
        let bgStart = '#0f0c29';
        let bgMid = '#302b63';
        let bgEnd = '#24243e';

        const phase = Math.floor(this.player.x / 1000); // 0=Outskirts, 1=Industrial, 2=Core
        if (phase === 1) { // Industrial (Orange/Red)
            bgStart = '#290c0c';
            bgMid = '#632b2b';
            bgEnd = '#3e2424';
        } else if (phase >= 2) { // Core (Green)
            bgStart = '#0c290c';
            bgMid = '#2b632b';
            bgEnd = '#243e24';
        }

        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, bgStart);
        gradient.addColorStop(0.5, bgMid);
        gradient.addColorStop(1, bgEnd);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        // Grid Floor Perspective (Fixed to camera for parallax feel)
        this.ctx.strokeStyle = phase === 1 ? '#ffaa00' : (phase >= 2 ? '#00ff00' : '#00ffff');
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
            this.ctx.shadowBlur = 10;
            let glowColor = '#00ffff';
            if (phase === 1) glowColor = '#ffaa00';
            if (phase >= 2) glowColor = '#00ff00';

            this.ctx.shadowColor = glowColor;
            this.ctx.strokeStyle = glowColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);
            this.ctx.shadowBlur = 0;
        });

        // --- LAVA / FIRE FLOOR (Visualizing Death Zone) ---
        const lavaY = 600;
        const time = Date.now() / 500;

        // Lava Base
        this.ctx.fillStyle = '#aa0000';
        this.ctx.fillRect(this.camera.x, lavaY, this.width, 200);

        // Lava Waves
        this.ctx.fillStyle = '#ff4400';
        this.ctx.beginPath();
        this.ctx.moveTo(this.camera.x, lavaY);
        for (let i = 0; i <= this.width; i += 20) {
            const waveH = Math.sin((i + this.camera.x) * 0.02 + time) * 10;
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
            const py = lavaY + Math.sin(i + time) * 10;
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
        if (phase >= 2) phaseName = "CORE";

        this.ctx.fillText(`SECTOR: ${phaseName}`, 20, 40);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${Math.floor(this.player.x)}m`, this.width - 20, 40);

        // Controls Display
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        let controlsText = "ARROWS: MOVE  SPACE: JUMP";
        if (this.player.hasWeapon) {
            controlsText += "  F: SHOOT";
            this.ctx.fillStyle = '#00ffff'; // Highlight when weapon active
        }
        this.ctx.fillText(controlsText, 20, this.height - 20);
    }

    animate(timeStamp) {
        const dt = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.animate);
    }
}

window.onload = () => {
    new Game(800, 600);
};

