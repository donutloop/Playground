import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class Graphics {
    constructor() {
        this.container = document.body;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050510, 0.0025);

        this.camera = null;
        this.renderer = null;
        this.composer = null;
    }

    init() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);


        // Post-Processing
        this.initPostProcessing();
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Unreal Bloom - High intensity for that neon look
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(bloomPass);

        // Film Grain for retro feel
        const filmPass = new FilmPass(
            0.35,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false   // grayscale
        );
        this.composer.addPass(filmPass);

        // Output Pass for tone mapping correction
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    render() {
        if (this.composer) {
            this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (this.camera && this.renderer && this.composer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}
