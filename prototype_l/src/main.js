import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { World } from './World.js';
import { SunSystem } from './SunSystem.js';
import { MoonSystem } from './MoonSystem.js';
import { StarField } from './StarField.js';

class App {
    constructor() {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000005); // Deep Space
        // No Fog? Or Fog only on planet?
        // Traditional FogExp2 covers everything. For space view, generally no fog or black fog.
        // Let's use black fog for deep space fade.
        this.scene.fog = new THREE.FogExp2(0x000005, 0.0002); // Very light fog

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
        this.camera.position.set(0, 400, 1200); // Space View

        // OPTIMIZATION: High-performance mode
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5; // Rotate planet view

        this.clock = new THREE.Clock();

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environmentIntensity = 0.5;

        // --- SYSTEMS ---

        // Static Sun
        this.sunSystem = new SunSystem(this.scene);
        // Position Sun far away
        this.sunSystem.group.position.set(1000, 500, 1000);
        this.sunSystem.group.lookAt(0, 0, 0);
        this.sunSystem.mainLight.position.copy(this.sunSystem.group.position);

        // Static Moon (Visible? Sure)
        this.moonSystem = new MoonSystem(this.scene);
        this.moonSystem.group.position.set(-1000, -200, -500);
        this.moonSystem.group.lookAt(0, 0, 0);
        this.moonSystem.mainLight.position.copy(this.moonSystem.group.position);

        this.starField = new StarField(this.scene);

        this.world = new World(this.scene);

        // POST-PROCESSING
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 8;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        this.composer.addPass(ssaoPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.7;
        bloomPass.strength = 0.5;
        bloomPass.radius = 0.5;
        this.composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        // Update Systems
        this.sunSystem.update(delta);
        this.moonSystem.update(delta);
        this.starField.update(delta);
        this.world.update(); // Rotates clouds

        this.controls.update();
        this.composer.render();
    }
}

new App();
