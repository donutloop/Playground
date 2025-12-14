import * as THREE from 'three';
import { SimplexNoise } from './noise.js';
import { createCityChunk, createWastelandChunk } from './world.js'; // We will assume these exist

export class ChunkManager {
    constructor(scene, player, worldData, trafficSystem, parkingSystem, pedestrianSystem) {
        this.scene = scene;
        this.player = player;
        this.worldData = worldData;
        this.trafficSystem = trafficSystem;
        this.parkingSystem = parkingSystem;
        this.pedestrianSystem = pedestrianSystem;

        this.chunks = new Map(); // "x,z" -> chunkData
        this.chunkSize = 34; // 20 block + 14 road
        this.renderDistance = 4; // chunks radius

        // Seed randomness
        this.noise = SimplexNoise;
    }

    update() {
        if (!this.player) return;

        const playerPos = this.player.camera.position;
        const currentChunkX = Math.floor(playerPos.x / this.chunkSize);
        const currentChunkZ = Math.floor(playerPos.z / this.chunkSize);

        // Identify coords that should be loaded
        const activeIds = new Set();

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const cx = currentChunkX + x;
                const cz = currentChunkZ + z;
                const id = `${cx},${cz}`;
                activeIds.add(id);

                if (!this.chunks.has(id)) {
                    this.loadChunk(cx, cz);
                }
            }
        }

        // Unload old chunks
        for (const [id, chunk] of this.chunks) {
            if (!activeIds.has(id)) {
                this.unloadChunk(id);
            }
        }
    }

    loadChunk(cx, cz) {
        // Determine Biome
        // Use noise scale 0.1 for broad biomes
        const noiseVal = this.noise.noise2D(cx * 0.1, cz * 0.1);

        // Center (0,0) is always city
        // Center (0,0) is always city
        const dist = Math.sqrt(cx * cx + cz * cz);
        const isCity = dist < 2 || noiseVal > 0.6;

        // Offset position
        const xPos = cx * this.chunkSize;
        const zPos = cz * this.chunkSize;

        let chunkData;

        if (isCity) {
            chunkData = createCityChunk(xPos, zPos, this.chunkSize);

            // Spawn City Population
            if (this.trafficSystem) this.trafficSystem.loadChunk(cx, cz);
            if (this.parkingSystem) this.parkingSystem.loadChunk(cx, cz);
            if (this.pedestrianSystem) this.pedestrianSystem.loadChunk(cx, cz);
        } else {
            chunkData = createWastelandChunk(xPos, zPos, this.chunkSize);
            // Maybe spawn sparse traffic/elements in wasteland later?
        }

        // Add meshes to scene
        if (chunkData.mesh) this.scene.add(chunkData.mesh);

        this.chunks.set(`${cx},${cz}`, chunkData);
    }

    unloadChunk(id) {
        const chunk = this.chunks.get(id);
        if (chunk) {
            if (chunk.mesh) {
                this.scene.remove(chunk.mesh);
            }

            // Unload population
            // Parse id back to cx, cz
            const parts = id.split(',');
            const cx = parseInt(parts[0]);
            const cz = parseInt(parts[1]);

            if (this.trafficSystem) this.trafficSystem.unloadChunk(cx, cz);
            if (this.parkingSystem) this.parkingSystem.unloadChunk(cx, cz);
            if (this.pedestrianSystem) this.pedestrianSystem.unloadChunk(cx, cz);
        }
        this.chunks.delete(id);
    }

    getColliders() {
        // Gather all colliders from active chunks
        let allColliders = [];
        for (const chunk of this.chunks.values()) {
            if (chunk.colliders) {
                allColliders = allColliders.concat(chunk.colliders);
            }
        }

        // Add Parking colliders (they are dynamic but static relative to physics)
        if (this.parkingSystem) {
            const parkingColliders = this.parkingSystem.getColliders();
            allColliders = allColliders.concat(parkingColliders);
        }

        return allColliders;
    }
}
