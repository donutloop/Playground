import * as THREE from 'three';

const CITY_SIZE = 10; // 10x10 blocks
const BLOCK_SIZE = 20;
const ROAD_WIDTH = 14;

export async function createWorld(scene) {
    // Lighting (Keep as is)
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -250;
    directionalLight.shadow.camera.right = 250;
    directionalLight.shadow.camera.top = 250;
    directionalLight.shadow.camera.bottom = -250;
    scene.add(directionalLight);

    const city = new THREE.Group();
    scene.add(city);

    // Materials
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.5
    });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const laneMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });


    // Geometries (Shared)
    const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
    const windowGeom = new THREE.PlaneGeometry(0.2, 0.4);
    const sidewalkGeom = new THREE.BoxGeometry(BLOCK_SIZE, 0.2, BLOCK_SIZE);
    // Ground plane is still individual or just one big plane? 
    // Optimization: One massive plane for ground if uniform, but here it's per block.
    // Let's instance the ground tiles too? Or just make one giant plane.
    // Given the grid structure, instancing the ground tiles (road) is better to match the loop.
    const roadGeom = new THREE.PlaneGeometry(BLOCK_SIZE + ROAD_WIDTH, BLOCK_SIZE + ROAD_WIDTH);
    const laneGeom = new THREE.PlaneGeometry(2, 0.5);

    // Helpers for Instancing
    const dummy = new THREE.Object3D();
    const cubes = [];
    const colliders = [];

    // Arrays to store instance data
    const buildingInstances = [];
    const windowInstances = [];
    const roadInstances = [];
    const sidewalkInstances = [];
    const dashInstances = [];

    // Pre-calculate Loop
    for (let x = -CITY_SIZE / 2; x < CITY_SIZE / 2; x++) {
        for (let z = -CITY_SIZE / 2; z < CITY_SIZE / 2; z++) {
            const xPos = x * (BLOCK_SIZE + ROAD_WIDTH);
            const zPos = z * (BLOCK_SIZE + ROAD_WIDTH);
            const tileTotalSize = BLOCK_SIZE + ROAD_WIDTH;

            // 1. Road (Ground)
            dummy.position.set(xPos, 0, zPos);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            roadInstances.push(dummy.matrix.clone());

            // 2. Road Markings
            // +X Side
            if (x < CITY_SIZE / 2 - 1) {
                const numDashes = 4;
                for (let d = 0; d < numDashes; d++) {
                    const dashZ = zPos - (tileTotalSize / 2) + (tileTotalSize / (numDashes + 1)) * (d + 1);
                    dummy.position.set(xPos + tileTotalSize / 2, 0.05, dashZ);
                    dummy.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    dashInstances.push(dummy.matrix.clone());
                }
            }
            // +Z Side
            if (z < CITY_SIZE / 2 - 1) {
                const numDashes = 4;
                for (let d = 0; d < numDashes; d++) {
                    const dashX = xPos - (tileTotalSize / 2) + (tileTotalSize / (numDashes + 1)) * (d + 1);
                    dummy.position.set(dashX, 0.05, zPos + tileTotalSize / 2);
                    dummy.rotation.set(-Math.PI / 2, 0, 0);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    dashInstances.push(dummy.matrix.clone());
                }
            }

            // 3. Sidewalk
            dummy.position.set(xPos, 0.1, zPos);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            sidewalkInstances.push(dummy.matrix.clone());

            // 4. Buildings
            for (let bx = -1; bx <= 1; bx += 2) {
                for (let bz = -1; bz <= 1; bz += 2) {
                    if (Math.random() > 0.2) { // 80% chance
                        const height = Math.random() * 20 + 5;
                        const width = (BLOCK_SIZE / 2) - 2.5;

                        const bX = xPos + bx * (width / 2 + 0.5);
                        const bY = height / 2 + 0.2;
                        const bZ = zPos + bz * (width / 2 + 0.5);

                        dummy.position.set(bX, bY, bZ);
                        dummy.rotation.set(0, 0, 0);
                        dummy.scale.set(width, height, width);
                        dummy.updateMatrix();
                        buildingInstances.push(dummy.matrix.clone());

                        // Collider (Explicit Box3)
                        const box = new THREE.Box3();
                        // Box3 is min/max. 
                        // Center is (bX, bY, bZ). Size is (width, height, width)
                        box.min.set(bX - width / 2, bY - height / 2, bZ - width / 2);
                        box.max.set(bX + width / 2, bY + height / 2, bZ + width / 2);
                        colliders.push(box);

                        // Windows
                        for (let w = 0; w < 5; w++) {
                            if (Math.random() > 0.5) {
                                const side = Math.floor(Math.random() * 4);
                                dummy.position.set(bX, Math.random() * height, bZ);
                                dummy.rotation.set(0, 0, 0);
                                dummy.scale.set(1, 1, 1); // Geom is 0.2x0.4

                                if (side === 0) dummy.position.z += width / 2 + 0.01;
                                else if (side === 1) dummy.position.z -= width / 2 + 0.01;
                                else if (side === 2) { dummy.position.x += width / 2 + 0.01; dummy.rotation.y = Math.PI / 2; }
                                else { dummy.position.x -= width / 2 + 0.01; dummy.rotation.y = Math.PI / 2; }

                                dummy.updateMatrix();
                                windowInstances.push(dummy.matrix.clone());
                            }
                        }

                        // Collectibles (Keep as separate meshes for rotation/anim logic or instance them?)
                        // Collectibles need individual rotation in update loop. 
                        // InstancedMesh supports updating matrices, but keeping 50 cubes as separate meshes is fine.
                        // Optimization focus is on thousands of static buildings/windows.
                        if (Math.random() > 0.7) {
                            const size = 1;
                            const cubeMat = new THREE.MeshStandardMaterial({
                                color: 0x00ffcc,
                                emissive: 0x00ffcc,
                                emissiveIntensity: 0.8
                            });
                            const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMat);
                            cube.position.set(bX, height + 1, bZ);
                            cube.castShadow = true;
                            city.add(cube);
                            cubes.push(cube);
                        }
                    }
                }
            }
        }
    }

    // Function to create and add InstancedMesh
    function createInstancedMesh(geometry, material, instances, transparent = false) {
        if (instances.length === 0) return;
        const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Or Static? Static is better for buildings.
        // Actually StaticDrawUsage is default hint, but let's stick to default.

        for (let i = 0; i < instances.length; i++) {
            mesh.setMatrixAt(i, instances[i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = true; // Buildings cast shadow
        mesh.receiveShadow = true; // Road receives
        city.add(mesh);
        return mesh;
    }

    // Create the actual meshes
    const roads = createInstancedMesh(roadGeom, roadMaterial, roadInstances);
    if (roads) roads.castShadow = false; // Roads don't mostly cast shadow on things below them

    createInstancedMesh(laneGeom, laneMarkingMat, dashInstances);
    createInstancedMesh(sidewalkGeom, sidewalkMaterial, sidewalkInstances);
    createInstancedMesh(buildingGeom, buildingMaterial, buildingInstances);
    createInstancedMesh(windowGeom, windowMaterial, windowInstances);

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
