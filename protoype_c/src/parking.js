import * as THREE from 'three';
import { createCarMesh } from './car_models.js';

export class ParkingSystem {
    constructor(scene, citySize, blockSize, roadWidth) {
        this.scene = scene;
        this.citySize = citySize;
        this.blockSize = blockSize;
        this.roadWidth = roadWidth;
        this.chunkCars = new Map(); // "cx,cz" -> Array of car meshes (or objects)
        this.cars = [];
        // No init loop
    }

    loadChunk(cx, cz) {
        // Spawn parked cars for this chunk
        // Reuse logic but applied to single chunk

        const carsList = [];

        const tileSize = this.blockSize + this.roadWidth;
        const xPos = cx * tileSize;
        const zPos = cz * tileSize;

        // Logic from before:
        // Park on the +X side of this block (Road running along Z)
        // Park on the +Z side of this block (Road running along X)

        // Note: Creating chunks based on center xPos, zPos which is the "Block" center?
        // createCityChunk (world.js) treats xPos, zPos as center of tile.
        // So xPos, zPos is center of block.

        // +X Axis Road (Horizontal)
        // Road runs along X.
        this.spawnRowInChunk(
            xPos, zPos,
            true, // isXRow
            carsList,
            tileSize
        );

        // +Z Axis Road (Vertical)
        // Road runs along Z.
        this.spawnRowInChunk(
            xPos, zPos,
            false, // isXRow
            carsList,
            tileSize
        );

        this.chunkCars.set(`${cx},${cz}`, carsList);
        // Sync flat list
        carsList.forEach(c => this.cars.push(c));
    }

    unloadChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunkCars.has(key)) {
            const cars = this.chunkCars.get(key);
            cars.forEach(car => {
                this.scene.remove(car);

                // Remove from flat list
                const idx = this.cars.indexOf(car);
                if (idx > -1) this.cars.splice(idx, 1);
            });
            this.chunkCars.delete(key);
        }
    }

    // Helper to get all parking colliders for active chunks
    getColliders() {
        const colliders = [];
        for (const cars of this.chunkCars.values()) {
            cars.forEach(car => {
                colliders.push(new THREE.Box3().setFromObject(car));
            });
        }
        return colliders;
    }

    spawnRowInChunk(chunkX, chunkZ, isXRow, list, size) {
        // Safe zones relative to center: [-17, -8] and [8, 17]
        // Intersection is roughly [-7, 7].
        // We will try to spawn 1 car in each valid zone per side if possible.

        const safeZones = [
            { start: -15, end: -9 },
            { start: 9, end: 15 }
        ];

        safeZones.forEach(zone => {
            if (Math.random() < 0.4) return; // 60% chance to spawn in a zone

            const type = ['sedan', 'suv', 'truck', 'sport'][Math.floor(Math.random() * 4)];
            const car = createCarMesh(type);

            // Random pos within zone
            const offsetAlongRoad = zone.start + Math.random() * (zone.end - zone.start);

            // Parking offset from center line (Curb is at 7)
            // Park at +/- 6.0 (flush with sidewalk edge 7 - 1.0 width)
            const sideOffset = Math.random() > 0.5 ? 6.0 : -6.0;

            if (isXRow) {
                // Road runs along X axis.
                // Car main axis is Z. To align with X road, rotate 90 deg (PI/2).
                // Wait, car model forward is -Z? Or Z?
                // Usually cars are long along Z.
                // If I want it parallel to X axis, I need to rotate 90.

                car.position.set(chunkX + offsetAlongRoad, 0, chunkZ + sideOffset);
                car.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
            } else {
                // Road runs along Z axis.
                // Car is Z aligned. So 0 or PI is parallel to Z axis.

                car.position.set(chunkX + sideOffset, 0, chunkZ + offsetAlongRoad);
                car.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
            }

            this.scene.add(car);
            list.push(car);
        });
    }

    update(delta) {
        // Static
    }
}
