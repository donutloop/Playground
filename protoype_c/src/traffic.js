import * as THREE from 'three';
import { createCarMesh } from './car_models.js';

export class TrafficSystem {
    constructor(scene, citySize, blockSize, roadWidth) {
        this.scene = scene;
        this.citySize = citySize;
        this.blockSize = blockSize;
        this.roadWidth = roadWidth;
        this.cars = [];
        this.carSpeed = 10;

        this.init();
    }

    init() {
        // Create a pool of cars
        const numCars = 20;
        const carTypes = ['sedan', 'suv', 'truck', 'sport'];

        for (let i = 0; i < numCars; i++) {
            const type = carTypes[Math.floor(Math.random() * carTypes.length)];
            const carGroup = createCarMesh(type); // Use new helper

            // Position randomly on roads
            const state = this.respawnCar(carGroup);

            this.scene.add(carGroup);
            this.cars.push({
                mesh: carGroup,
                axis: state.axis,
                direction: state.direction
            });
        }
    }

    respawnCar(car) {
        // 1. Choose Layout Logic
        const axis = Math.random() > 0.5 ? 'x' : 'z';
        const direction = Math.random() > 0.5 ? 1 : -1;

        // 2. Road Grid Math
        // Blocks are centered at k * tileSize
        // Roads are centered at k * tileSize + tileSize/2
        // Try to pick a valid road index from -CITY_SIZE/2 to CITY_SIZE/2 - 1
        // We range a bit wider to use outer roads too
        const tileSize = this.blockSize + this.roadWidth;
        const gridIndex = Math.floor(Math.random() * this.citySize) - this.citySize / 2;
        const roadCenter = gridIndex * tileSize + tileSize / 2;

        // 3. Lane Logic (Drive on Right)
        // If Axis X, Road runs along X. We need a fixed Z position.
        // If Axis Z, Road runs along Z. We need a fixed X position.

        // "Right side" logic:
        // Travels +X -> needs +Z side of road (if Z is 'up' on screen... wait standard varies)
        // Travels +Z -> needs -X side of road
        // Travels -X -> needs -Z side of road
        // Travels -Z -> needs +X side of road

        const laneWidth = this.roadWidth / 4;
        let laneOffset = 0;

        if (axis === 'x') {
            // Road runs East-West (X). Fixed Z.
            // +X is Right. +Z is Down.
            if (direction === 1) laneOffset = laneWidth; // Bottom lane
            else laneOffset = -laneWidth; // Top lane

            car.position.set(
                (Math.random() - 0.5) * this.citySize * tileSize, // Random position along road
                0,
                roadCenter + laneOffset
            );
            car.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
            // Road runs North-South (Z). Fixed X.
            // +Z is Down. +X is Right.
            if (direction === 1) laneOffset = -laneWidth; // Left lane
            else laneOffset = laneWidth; // Right lane

            car.position.set(
                roadCenter + laneOffset,
                0,
                (Math.random() - 0.5) * this.citySize * tileSize
            );
            car.rotation.y = direction > 0 ? 0 : Math.PI;
        }

        return { axis, direction };
    }

    update(delta) {
        const bound = (this.citySize * (this.blockSize + this.roadWidth)) / 2;

        this.cars.forEach(car => {
            const move = car.direction * this.carSpeed * delta;

            if (car.axis === 'x') {
                car.mesh.position.x += move;
                if (Math.abs(car.mesh.position.x) > bound) {
                    car.mesh.position.x = -Math.sign(move) * bound;
                }
                // Simple turn logic? No, keep it simple straight lines for now
                car.mesh.rotation.y = car.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
            } else {
                car.mesh.position.z += move;
                if (Math.abs(car.mesh.position.z) > bound) {
                    car.mesh.position.z = -Math.sign(move) * bound;
                }
                car.mesh.rotation.y = car.direction > 0 ? 0 : Math.PI;
            }
        });
    }
}
