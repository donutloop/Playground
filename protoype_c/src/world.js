import * as THREE from 'three';

const CITY_SIZE = 10; // 10x10 blocks
const BLOCK_SIZE = 20;
const ROAD_WIDTH = 14;

export async function createWorld(scene) {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3); // Night blueish
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.5); // Moon
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);

    // City Group
    const city = new THREE.Group();
    scene.add(city);

    // Materials
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.5
    });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });

    const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
    const windowGeom = new THREE.PlaneGeometry(0.2, 0.4);

    // Generate City
    const cubes = []; // Collectibles
    const colliders = [];

    for (let x = -CITY_SIZE / 2; x < CITY_SIZE / 2; x++) {
        for (let z = -CITY_SIZE / 2; z < CITY_SIZE / 2; z++) {
            const xPos = x * (BLOCK_SIZE + ROAD_WIDTH);
            const zPos = z * (BLOCK_SIZE + ROAD_WIDTH);

            // Ground/Road
            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE + ROAD_WIDTH, BLOCK_SIZE + ROAD_WIDTH),
                roadMaterial
            );
            ground.rotation.x = -Math.PI / 2;
            ground.position.set(xPos, 0, zPos);
            ground.receiveShadow = true;
            city.add(ground);

            // Road Markings (Procedural)
            const laneMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const laneGeom = new THREE.PlaneGeometry(2, 0.5); // Dash size
            const tileTotalSize = BLOCK_SIZE + ROAD_WIDTH;

            // X-Axis Dashes (along the top/bottom boundary? No, we need center lines)
            // The roads are effectively between blocks.
            // Let's add dashes on the +X and +Z sides of this block.

            // +X Side Road Center Line
            if (x < CITY_SIZE / 2 - 1) { // Don't draw on the very edge of city
                const numDashes = 4;
                for (let d = 0; d < numDashes; d++) {
                    const dash = new THREE.Mesh(laneGeom, laneMarkingMat);
                    dash.rotation.x = -Math.PI / 2;
                    dash.rotation.z = Math.PI / 2; // Rotate to run along Z
                    // Position: Right edge of tile, distributed along Z
                    const dashZ = zPos - (tileTotalSize / 2) + (tileTotalSize / (numDashes + 1)) * (d + 1);
                    dash.position.set(xPos + tileTotalSize / 2, 0.05, dashZ);
                    city.add(dash);
                }
            }

            // +Z Side Road Center Line
            if (z < CITY_SIZE / 2 - 1) {
                const numDashes = 4;
                for (let d = 0; d < numDashes; d++) {
                    const dash = new THREE.Mesh(laneGeom, laneMarkingMat);
                    dash.rotation.x = -Math.PI / 2;
                    // Position: Bottom edge of tile, distributed along X
                    const dashX = xPos - (tileTotalSize / 2) + (tileTotalSize / (numDashes + 1)) * (d + 1);
                    dash.position.set(dashX, 0.05, zPos + tileTotalSize / 2);
                    city.add(dash);
                }
            }

            // Crosswalks (Intersection corners)
            // Draw crosswalk bars at the corners where sidewalk meets road?
            // Since we are iterating tiles, we can add a crosswalk piece relative to the sidewalk.
            // Sidewalk extends to +/- BLOCK_SIZE/2. Road is beyond that.
            // Let's add a crosswalk pattern on the "Road" part adjacent to the sidewalk.
            const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
            const barGeom = new THREE.PlaneGeometry(0.5, 3);

            // Only draw some to look cool, maybe not every single corner.
            // Actually, simplest is to draw 4 bars on each side of the sidewalk block.
            // But that's a lot of geometry. Let's just do dashes.

            // Building Block (Sidewalk + Skyscrapers)
            const sidewalk = new THREE.Mesh(
                new THREE.BoxGeometry(BLOCK_SIZE, 0.2, BLOCK_SIZE),
                sidewalkMaterial
            );
            sidewalk.position.set(xPos, 0.1, zPos);
            sidewalk.receiveShadow = true;
            sidewalk.castShadow = true;
            city.add(sidewalk);

            // Skyscrapers on the block
            // 4 buildings per block
            for (let bx = -1; bx <= 1; bx += 2) {
                for (let bz = -1; bz <= 1; bz += 2) {
                    if (Math.random() > 0.2) { // 80% chance of building
                        const height = Math.random() * 20 + 5;
                        const width = (BLOCK_SIZE / 2) - 2.5; // Reduced width for wider sidewalks (2.5 margin)

                        const building = new THREE.Mesh(buildingGeom, buildingMaterial);
                        building.scale.set(width, height, width);
                        building.position.set(
                            xPos + bx * (width / 2 + 0.5),
                            height / 2 + 0.2,
                            zPos + bz * (width / 2 + 0.5)
                        );
                        building.castShadow = false; // Optimization
                        building.receiveShadow = true;
                        city.add(building);

                        // Collider
                        const box = new THREE.Box3().setFromObject(building);
                        colliders.push(box);

                        // Randomly light up windows (simulated with emissive texture or multiple meshes - using simple boxes for now for performance)
                        // Actually, let's add some glowing "windows" as simple planes
                        for (let w = 0; w < 5; w++) {
                            if (Math.random() > 0.5) {
                                const win = new THREE.Mesh(windowGeom, windowMaterial);
                                const side = Math.floor(Math.random() * 4);
                                win.position.copy(building.position);
                                win.position.y = Math.random() * height;

                                if (side === 0) win.position.z += width / 2 + 0.01;
                                else if (side === 1) win.position.z -= width / 2 + 0.01;
                                else if (side === 2) { win.position.x += width / 2 + 0.01; win.rotation.y = Math.PI / 2; }
                                else { win.position.x -= width / 2 + 0.01; win.rotation.y = Math.PI / 2; }

                                city.add(win);
                            }
                        }

                        // Add collectible on top of some buildings
                        if (Math.random() > 0.7) {
                            const size = 1;
                            const cubeMat = new THREE.MeshStandardMaterial({
                                color: 0x00ffcc,
                                emissive: 0x00ffcc,
                                emissiveIntensity: 0.8
                            });
                            const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMat);
                            cube.position.set(
                                building.position.x,
                                height + 1,
                                building.position.z
                            );
                            cube.castShadow = true;
                            city.add(cube);
                            cubes.push(cube);
                        }
                    }
                }
            }
        }
    }

    const materials = {
        road: roadMaterial,
        sidewalk: sidewalkMaterial,
        building: buildingMaterial
    };

    return {
        cubes,
        citySize: CITY_SIZE,
        blockSize: BLOCK_SIZE,
        roadWidth: ROAD_WIDTH,
        colliders,
        directionalLight,
        ambientLight,
        materials
    };
}
