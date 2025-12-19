import * as THREE from 'three';
import { ModernGlassTower } from './ModernGlassTower.js';
import { UrbanHighrise } from './UrbanHighrise.js';
import { NYArtDecoTower } from './NYArtDecoTower.js';
import { NYChryslerTower } from './NYChryslerTower.js';
import { TheNeedle } from './TheNeedle.js';

export class World {
    constructor(scene) {
        this.scene = scene;

        this.tower = new ModernGlassTower();
        this.tower.visual.position.set(-20, 0, 5); // Left, forward
        this.scene.add(this.tower.visual);

        this.highrise = new UrbanHighrise();
        this.highrise.visual.position.set(20, 0, 5); // Right, forward
        this.scene.add(this.highrise.visual);

        this.deco = new NYArtDecoTower();
        this.deco.visual.position.set(0, 0, -10); // Center, slightly back
        this.scene.add(this.deco.visual);

        this.chrysler = new NYChryslerTower();
        this.chrysler.visual.position.set(30, 0, -20); // Back Right
        this.scene.add(this.chrysler.visual);

        this.needle = new TheNeedle();
        this.needle.visual.position.set(-35, 0, -30); // Back Left, towering over
        this.scene.add(this.needle.visual);

        // Ground plane
        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Grid helper for reference
        const gridHelper = new THREE.GridHelper(200, 20);
        this.scene.add(gridHelper);
    }

    update() {
        // Update world objects if needed
    }
}
