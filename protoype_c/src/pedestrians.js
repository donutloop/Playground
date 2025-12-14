import * as THREE from 'three';

export class PedestrianSystem {
    constructor(scene, citySize, blockSize, roadWidth) {
        this.scene = scene;
        this.citySize = citySize; // e.g. 10
        this.blockSize = blockSize; // e.g. 20
        this.roadWidth = roadWidth; // e.g. 10
        this.pedestrians = [];
        this.speed = 2;

        this.init();
    }

    init() {
        // Pedestrian Geometry (Simple Capsule-like composed mesh)
        const bodyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        const headGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const legGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);

        const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

        // Spawn N pedestrians per block
        const pedsPerBlock = 3;

        for (let x = -this.citySize / 2; x < this.citySize / 2; x++) {
            for (let z = -this.citySize / 2; z < this.citySize / 2; z++) {

                // Block center position
                const xPos = x * (this.blockSize + this.roadWidth);
                const zPos = z * (this.blockSize + this.roadWidth);

                for (let i = 0; i < pedsPerBlock; i++) {
                    const group = new THREE.Group();

                    // Color variation
                    const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
                    const mat = new THREE.MeshStandardMaterial({ color: color });

                    const body = new THREE.Mesh(bodyGeom, mat);
                    body.position.y = 1.0;
                    body.castShadow = true;
                    group.add(body);

                    const head = new THREE.Mesh(headGeom, new THREE.MeshStandardMaterial({ color: 0xffccaa }));
                    head.position.y = 1.6;
                    head.castShadow = true;
                    group.add(head);

                    const leftLeg = new THREE.Mesh(legGeom, new THREE.MeshStandardMaterial({ color: 0x333333 }));
                    leftLeg.position.set(-0.15, 0.4, 0);
                    group.add(leftLeg);

                    const rightLeg = new THREE.Mesh(legGeom, new THREE.MeshStandardMaterial({ color: 0x333333 }));
                    rightLeg.position.set(0.15, 0.4, 0);
                    group.add(rightLeg);

                    // Random start position on sidewalk ring
                    // Pick a side (0: top, 1: right, 2: bottom, 3: left)
                    const side = Math.floor(Math.random() * 4);
                    const offset = (this.blockSize / 2) - 1.5; // Center of sidewalk strip (2.5 margin, so 1.25 offset from edge? No. innerBound = 7.5, outer = 9.5. Center = 8.5)
                    const centerDist = (this.blockSize / 2) - 1.25;

                    let localX, localZ;

                    if (side === 0) { localX = (Math.random() - 0.5) * this.blockSize; localZ = -centerDist; }
                    else if (side === 1) { localX = centerDist; localZ = (Math.random() - 0.5) * this.blockSize; }
                    else if (side === 2) { localX = (Math.random() - 0.5) * this.blockSize; localZ = centerDist; }
                    else { localX = -centerDist; localZ = (Math.random() - 0.5) * this.blockSize; }

                    group.position.set(xPos + localX, 0, zPos + localZ);

                    // Initial direction along the sidewalk
                    let dirX = 0, dirZ = 0;
                    if (Math.abs(localX) > Math.abs(localZ)) { // Along Top/Bottom edge, move X
                        dirX = Math.random() > 0.5 ? 1 : -1;
                    } else { // Along Left/Right edge, move Z
                        dirZ = Math.random() > 0.5 ? 1 : -1;
                    }

                    // Store state
                    this.pedestrians.push({
                        mesh: group,
                        blockX: xPos,
                        blockZ: zPos,
                        direction: new THREE.Vector3(dirX, 0, dirZ).normalize(),
                        legAnimTimer: Math.random() * 10,
                        leftLeg: leftLeg,
                        rightLeg: rightLeg
                    });

                    this.scene.add(group);
                }
            }
        }
    }

    update(delta) {
        const halfBlock = this.blockSize / 2;
        const outerBound = halfBlock - 0.5; // Sidewalk outer edge
        const innerBound = halfBlock - 2.5; // Sidewalk inner edge (building wall)

        this.pedestrians.forEach(ped => {
            // Move
            ped.mesh.position.add(ped.direction.clone().multiplyScalar(this.speed * delta));

            // Calculate local position relative to block center
            const localX = ped.mesh.position.x - ped.blockX;
            const localZ = ped.mesh.position.z - ped.blockZ;

            // Simple Logic: Walk in a rectangular loop
            // If they hit a corner, turn 90 degrees left or right to stay on sidewalk

            let turn = false;

            // Check boundaries
            if (localX > outerBound && ped.direction.x > 0) turn = true;
            else if (localX < -outerBound && ped.direction.x < 0) turn = true;
            else if (localZ > outerBound && ped.direction.z > 0) turn = true;
            else if (localZ < -outerBound && ped.direction.z < 0) turn = true;

            // Check inner walls (if they drift inside)
            if (Math.abs(localX) < innerBound && Math.abs(localZ) < innerBound) {
                // They are inside the building area! Push them out.
                if (Math.abs(localX) > Math.abs(localZ)) {
                    // Closer to X edge
                    ped.mesh.position.x = ped.blockX + (Math.sign(localX) * innerBound);
                } else {
                    ped.mesh.position.z = ped.blockZ + (Math.sign(localZ) * innerBound);
                }
                turn = true;
            }

            if (turn) {
                // Turn 90 degrees
                const tempX = ped.direction.x;
                ped.direction.x = -ped.direction.z;
                ped.direction.z = tempX;

                // Nudge back in bounds
                ped.mesh.position.x = Math.max(Math.min(ped.mesh.position.x, ped.blockX + outerBound), ped.blockX - outerBound);
                ped.mesh.position.z = Math.max(Math.min(ped.mesh.position.z, ped.blockZ + outerBound), ped.blockZ - outerBound);
            }

            ped.mesh.lookAt(ped.mesh.position.clone().add(ped.direction));

            // Animation (Walk cycle)
            ped.legAnimTimer += delta * 10;
            ped.leftLeg.rotation.x = Math.sin(ped.legAnimTimer) * 0.5;
            ped.rightLeg.rotation.x = Math.sin(ped.legAnimTimer + Math.PI) * 0.5;
        });
    }
}
