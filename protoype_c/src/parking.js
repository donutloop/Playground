import * as THREE from 'three';
import { createCarMesh } from './car_models.js';

export class ParkingSystem {
    constructor(scene, citySize, blockSize, roadWidth) {
        this.scene = scene;
        this.citySize = citySize;
        this.blockSize = blockSize;
        this.roadWidth = roadWidth;

        this.init();
    }

    init() {
        const carTypes = ['sedan', 'suv', 'truck', 'sport'];
        const tileSize = this.blockSize + this.roadWidth;
        // Padding from block edge to parking lane center
        // Block edge is at +/- blockSize/2
        // Road edge is at +/- (blockSize/2 + roadWidth/2)
        // Parking lane should be next to sidewalk.
        // Sidewalk ends at blockSize/2.
        // Car width is ~2.
        // So parking lane center is blockSize/2 + 1.5 (approx).

        const parkingOffset = this.blockSize / 2 + 1.5;

        for (let x = -this.citySize / 2; x < this.citySize / 2; x++) {
            for (let z = -this.citySize / 2; z < this.citySize / 2; z++) {

                const xPos = x * tileSize;
                const zPos = z * tileSize;

                // For each block, try to park cars on the 4 road segments surrounding it?
                // Actually, roads are shared. It's easier to iterate the grid.
                // Let's park on the +X and +Z sides of the block, similar to how we generate roads.
                // Or better: Just go through the road centers.

                // Let's iterate intersections.
                // Actually, just placing cars RELATIVE to the block is easiest.

                // Park on the +X side of this block (Road running along Z)
                // Road center is xPos + tileSize/2
                // Sidewalk edge is xPos + blockSize/2
                // We want to park at xPos + blockSize/2 + 1.5

                // But we should only park if we aren't at the city edge? 
                // Checks are fine.

                // +X Side (Road runs Z)
                if (x < this.citySize / 2 - 1) {
                    this.spawnRow(
                        xPos + this.blockSize / 2 + 1.5, // X
                        zPos, // Z center
                        false // isXAxis (Cars align with Z)
                    );
                    // Also park on the other side of that same road?
                    // That would be xPos + tileSize - (blockSize/2 + 1.5)
                    // = xPos + blockSize + 14 - 10 - 1.5 = wait.
                    // Tile = 20+14 = 34.
                    // Road starts at 10. Road width 14.
                    // Road center = 17.
                    // Correct.

                    // Let's just do "Right side of the block" and "Top side of the block".
                    // And maybe "Left" and "Bottom" if it's the edge of the city.
                }

                // +Z Side (Road runs X)
                if (z < this.citySize / 2 - 1) {
                    this.spawnRow(
                        xPos, // X center
                        zPos + this.blockSize / 2 + 1.5, // Z
                        true // isXAxis (Cars align with X)
                    );
                }
            }
        }
    }

    spawnRow(xCoord, zCoord, isXRow) {
        // Try to spawn 2-3 cars along the block length
        // Block is 20 units long.
        // Avoid corners (intersections).
        const validRange = this.blockSize - 8; // Leave 4 units empty on corners

        const count = 2;

        for (let i = 0; i < count; i++) {
            if (Math.random() > 0.4) continue; // 60% empty spots

            const type = ['sedan', 'suv', 'truck', 'sport'][Math.floor(Math.random() * 4)];
            const car = createCarMesh(type);

            // Random offset along the lane
            const offset = (Math.random() - 0.5) * validRange;

            if (isXRow) { // Road runs X, car aligns X
                car.position.set(xCoord + offset, 0.75, zCoord);
                car.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2; // Face east or west
            } else { // Road runs Z, car aligns Z
                car.position.set(xCoord, 0.75, zCoord + offset);
                car.rotation.y = Math.random() > 0.5 ? 0 : Math.PI; // Face north or south
            }

            this.scene.add(car);
        }
    }

    update(delta) {
        // Static cars don't update
    }
}
