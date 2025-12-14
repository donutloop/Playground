import * as THREE from 'three';

export class PedestrianSystem {
    constructor(scene, citySize, blockSize, roadWidth) {
        this.scene = scene;
        this.citySize = citySize; // e.g. 10
        this.blockSize = blockSize; // e.g. 20
        this.roadWidth = roadWidth; // e.g. 10
        this.chunkPeds = new Map(); // "cx,cz" -> Array of peds
        this.speed = 2;

        // Shared Geometries/Materials/Cache
        this.bodyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        this.headGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.legGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        this.headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        this.legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    }

    loadChunk(cx, cz) {
        // Only spawn in city chunks?
        // Let's assume passed coords are valid places to spawn.
        const pedsList = [];
        const pedsPerChunk = 3;

        const chunkSize = this.blockSize + this.roadWidth;
        const xOffset = cx * chunkSize;
        const zOffset = cz * chunkSize;

        for (let i = 0; i < pedsPerChunk; i++) {
            const group = this.createPedMesh();

            // Position within chunk (Sidewalks are roughly around center of block)
            // Block is centered at xOffset, zOffset in our simplified chunk logic?
            // Actually createCityChunk uses xOffset, zOffset as center of the 34x34 tile.
            // Sidewalk is around the buildings.

            const state = this.spawnPedInChunk(group, xOffset, zOffset, this.blockSize);

            this.scene.add(group);
            pedsList.push({
                mesh: group,
                chunkX: xOffset,
                chunkZ: zOffset,
                direction: state.direction,
                bounds: { minX: state.minX, maxX: state.maxX, minZ: state.minZ, maxZ: state.maxZ },
                legAnimTimer: Math.random() * 10,
                leftLeg: group.children[2], // Hacky index access, but fast
                rightLeg: group.children[3],
                blockSize: this.blockSize
            });
        }
        this.chunkPeds.set(`${cx},${cz}`, pedsList);
    }

    unloadChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunkPeds.has(key)) {
            const peds = this.chunkPeds.get(key);
            peds.forEach(ped => {
                this.scene.remove(ped.mesh);
            });
            this.chunkPeds.delete(key);
        }
    }

    createPedMesh() {
        const group = new THREE.Group();

        // Color variation
        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
        const mat = new THREE.MeshStandardMaterial({ color: color });

        const body = new THREE.Mesh(this.bodyGeom, mat);
        body.position.y = 1.0;
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(this.headGeom, this.headMat);
        head.position.y = 1.6;
        head.castShadow = true;
        group.add(head);

        const leftLeg = new THREE.Mesh(this.legGeom, this.legMat);
        leftLeg.position.set(-0.15, 0.4, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(this.legGeom, this.legMat);
        rightLeg.position.set(0.15, 0.4, 0);
        group.add(rightLeg);

        return group;
    }

    spawnPedInChunk(group, chunkX, chunkZ, blockSize) {
        // Pick one of the 4 corners
        // Sidewalks are 10x10, centered at +/- 12.
        // Bounds: 7 to 17.
        const cornerIdx = Math.floor(Math.random() * 4);
        const signs = [
            { x: -1, z: -1 }, // Top-Left
            { x: 1, z: -1 },  // Top-Right
            { x: 1, z: 1 },   // Bottom-Right
            { x: -1, z: 1 }   // Bottom-Left
        ];
        const sign = signs[cornerIdx];

        // Random position within this corner
        // Range 7 to 17. Center 12. Width 10.
        // Random -5 to 5 offset from 12.
        const offsetX = (Math.random() - 0.5) * 8; // Keep slightly inside
        const offsetZ = (Math.random() - 0.5) * 8;

        const localX = (12 + offsetX) * sign.x;
        const localZ = (12 + offsetZ) * sign.z;

        group.position.set(chunkX + localX, 0, chunkZ + localZ);

        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

        // Store bounds for this ped
        return {
            direction,
            minX: sign.x > 0 ? 7 : -17,
            maxX: sign.x > 0 ? 17 : -7,
            minZ: sign.z > 0 ? 7 : -17,
            maxZ: sign.z > 0 ? 17 : -7
        };
    }

    update(delta) {
        // Iterate all active chunks
        for (const peds of this.chunkPeds.values()) {
            peds.forEach(ped => {
                // Move
                ped.mesh.position.add(ped.direction.clone().multiplyScalar(this.speed * delta));

                // Check bounds (local coords)
                const localX = ped.mesh.position.x - ped.chunkX;
                const localZ = ped.mesh.position.z - ped.chunkZ;

                let turned = false;

                if (localX < ped.bounds.minX || localX > ped.bounds.maxX ||
                    localZ < ped.bounds.minZ || localZ > ped.bounds.maxZ) {

                    // Turn around (simple bounce)
                    ped.direction.negate();

                    // Turn random amount to avoid sticking to lines
                    const randomTurn = (Math.random() - 0.5) * 1.0;
                    ped.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomTurn);

                    // Clamp position back
                    ped.mesh.position.x = Math.max(ped.bounds.minX, Math.min(ped.bounds.maxX, localX)) + ped.chunkX;
                    ped.mesh.position.z = Math.max(ped.bounds.minZ, Math.min(ped.bounds.maxZ, localZ)) + ped.chunkZ;

                    turned = true;
                }

                // Random wandering turn
                if (!turned && Math.random() < 0.02) {
                    const randomTurn = (Math.random() - 0.5) * 1.5;
                    ped.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomTurn);
                }

                ped.mesh.lookAt(ped.mesh.position.clone().add(ped.direction));

                // Animation
                ped.legAnimTimer += delta * 10;
                ped.leftLeg.rotation.x = Math.sin(ped.legAnimTimer) * 0.5;
                ped.rightLeg.rotation.x = Math.sin(ped.legAnimTimer + Math.PI) * 0.5;
            });
        }
    }
}
