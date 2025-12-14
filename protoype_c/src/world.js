import * as THREE from 'three';

const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
const windowGeom = new THREE.PlaneGeometry(0.2, 0.4);
const sidewalkGeom = new THREE.BoxGeometry(1, 0.2, 1); // Normalized size for scaling
const roadGeom = new THREE.PlaneGeometry(1, 1);

// Materials (SharedCache)
const matCache = {
    road: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }),
    building: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.5 }),
    window: new THREE.MeshBasicMaterial({ color: 0xffffaa }),
    lane: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ground: new THREE.MeshStandardMaterial({ color: 0x3a2e26, roughness: 1.0 }) // Wasteland ground
};

export function createCityChunk(xPos, zPos, size) {
    const chunkGroup = new THREE.Group();
    const colliders = [];

    // 1. Road (Ground) - Base layer
    const road = new THREE.Mesh(roadGeom, matCache.road);
    road.position.set(xPos, 0, zPos);
    road.rotation.x = -Math.PI / 2;
    road.scale.set(size, size, 1);
    road.receiveShadow = true;
    chunkGroup.add(road);

    // 2. Markings (Cross at center)
    const laneH = new THREE.Mesh(roadGeom, matCache.lane);
    laneH.position.set(xPos, 0.02, zPos);
    laneH.rotation.x = -Math.PI / 2;
    laneH.scale.set(size, 0.5, 1);
    chunkGroup.add(laneH);

    const laneV = new THREE.Mesh(roadGeom, matCache.lane);
    laneV.position.set(xPos, 0.02, zPos);
    laneV.rotation.x = -Math.PI / 2;
    laneV.scale.set(0.5, size, 1);
    chunkGroup.add(laneV);

    // 3. Sidewalks (4 Corners)
    // Size = 34, RoadWidth ~ 14. Corner Block ~ 10x10.
    const cornerSize = (size - 14) / 2; // ~10
    const offset = 7 + cornerSize / 2; // 7 + 5 = 12

    const corners = [
        { x: -offset, z: -offset },
        { x: offset, z: -offset },
        { x: offset, z: offset },
        { x: -offset, z: offset }
    ];

    corners.forEach(corner => {
        const sw = new THREE.Mesh(sidewalkGeom, matCache.sidewalk);
        sw.position.set(xPos + corner.x, 0.1, zPos + corner.z);
        sw.scale.set(cornerSize, 1, cornerSize);
        sw.receiveShadow = true;
        chunkGroup.add(sw);

        // 4. Buildings (One per corner, maybe?)
        if (Math.random() > 0.3) { // 70% chance of building
            const height = Math.random() * 20 + 5;
            const width = cornerSize - 4; // Leave 2m rim on sidewalk stride

            const building = new THREE.Mesh(buildingGeom, matCache.building);
            building.position.set(xPos + corner.x, height / 2 + 0.1, zPos + corner.z);
            building.scale.set(width, height, width);
            building.castShadow = true;
            building.receiveShadow = true;
            chunkGroup.add(building);

            // Collider
            const box = new THREE.Box3();
            box.min.set(xPos + corner.x - width / 2, 0, zPos + corner.z - width / 2);
            box.max.set(xPos + corner.x + width / 2, height, zPos + corner.z + width / 2);
            colliders.push(box);

            // Windows
            for (let i = 0; i < 4; i++) {
                const win = new THREE.Mesh(windowGeom, matCache.window);
                const side = Math.floor(Math.random() * 4);
                win.position.copy(building.position);
                win.position.y = Math.random() * height * 0.8 + 2;

                if (side === 0) win.position.z += width / 2 + 0.05;
                else if (side === 1) win.position.z -= width / 2 + 0.05;
                else if (side === 2) { win.position.x += width / 2 + 0.05; win.rotation.y = Math.PI / 2; }
                else { win.position.x -= width / 2 + 0.05; win.rotation.y = Math.PI / 2; }

                chunkGroup.add(win);
            }
        }
    });

    return { mesh: chunkGroup, colliders: colliders };
}

export function createWastelandChunk(xPos, zPos, size) {
    const chunkGroup = new THREE.Group();
    const colliders = [];

    // Uneven Ground
    const ground = new THREE.Mesh(roadGeom, matCache.ground);
    ground.position.set(xPos, -0.5, zPos); // Slightly lower
    ground.rotation.x = -Math.PI / 2;
    ground.scale.set(size, size, 1);
    ground.receiveShadow = true;
    chunkGroup.add(ground);

    // Rocks / Debris
    const numRocks = Math.floor(Math.random() * 3);
    for (let i = 0; i < numRocks; i++) {
        const rSize = Math.random() * 3 + 1;
        const rock = new THREE.Mesh(buildingGeom, matCache.sidewalk); // Use gray material
        rock.position.set(
            xPos + (Math.random() - 0.5) * size * 0.8,
            rSize / 2 - 0.5,
            zPos + (Math.random() - 0.5) * size * 0.8
        );
        rock.scale.set(rSize, rSize, rSize);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        chunkGroup.add(rock);

        const box = new THREE.Box3().setFromObject(rock);
        colliders.push(box);
    }

    return { mesh: chunkGroup, colliders: colliders };
}

export async function createWorld(scene) {
    // Lighting setup only
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xaaccff, 0.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -250;
    directionalLight.shadow.camera.right = 250;
    directionalLight.shadow.camera.top = 250;
    directionalLight.shadow.camera.bottom = -250;
    scene.add(directionalLight);

    // We return empty world data, main.js will use ChunkManager
    return {
        citySize: 1000, // Virtual size
        blockSize: 20, // Was 34 (Incorrect, 34 is total size)
        roadWidth: 14,
        colliders: [], // No static colliders upfront
        cubes: [], // Empty for now, NMS world doesn't have static collectibles yet
        materials: matCache,
        directionalLight,
        ambientLight
    };
}
