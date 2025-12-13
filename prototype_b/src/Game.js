import { Graphics } from './Graphics.js';
import { World } from './World.js';
import { ParticleSystem } from './Particles.js';

export class Game {
    constructor() {
        this.graphics = new Graphics();
        this.world = new World(this.graphics.scene);
        this.particles = new ParticleSystem(this.graphics.scene);

        this.world.setParticleSystem(this.particles);
        this.world.onGameOver = this._onGameOver.bind(this);

        this.isRunning = false;

        this._onWindowResize = this._onWindowResize.bind(this);
        this._update = this._update.bind(this);

        window.addEventListener('resize', this._onWindowResize);
    }

    start() {
        console.log("Game Loaded. Waiting for start...");
        const startScreen = document.getElementById('start-screen');

        const onStart = () => {
            if (this.isRunning) return;
            this.isRunning = true;
            this.graphics.init(); // Renderer init
            this.world.init();

            startScreen.style.display = 'none';
            this._update();
        };

        if (startScreen) {
            startScreen.addEventListener('click', onStart);
            // Also listen for Enter key maybe?
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') onStart();
            });
        } else {
            // Fallback if no UI
            onStart();
        }
    }

    _onGameOver() {
        // Reset or Pause
        // For now, just reset world? Or show screen?
        this.world.objects.forEach(obj => this.graphics.scene.remove(obj));
        this.world.objects = [];
        this.world.score = 0;

        // Flash screen red?
        document.body.style.backgroundColor = 'red';
        setTimeout(() => document.body.style.backgroundColor = '', 100);
    }

    _update(time) {
        if (!this.isRunning) return;

        requestAnimationFrame(this._update);

        const deltaTime = 0.016; // Fixed step for now, will implement clock later

        this.world.update(deltaTime, time * 0.001);
        this.particles.update(deltaTime);
        this.graphics.render();
    }

    _onWindowResize() {
        this.graphics.onResize();
    }
}
