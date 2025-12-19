import * as THREE from 'three';
import { Building } from './Building.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.building = new Building();
        this.scene.add(this.building.visual);

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
