import * as THREE from 'three';
import { ModernGlassTower } from './ModernGlassTower.js';
import { UrbanHighrise } from './UrbanHighrise.js';

export class World {
    constructor(scene) {
        this.scene = scene;

        this.tower = new ModernGlassTower();
        this.tower.visual.position.set(-15, 0, 0);
        this.scene.add(this.tower.visual);

        this.highrise = new UrbanHighrise();
        this.highrise.visual.position.set(15, 0, 0);
        this.scene.add(this.highrise.visual);

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
