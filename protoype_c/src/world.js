import * as THREE from 'three';

const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
const windowGeom = new THREE.PlaneGeometry(0.2, 0.4);
const sidewalkGeom = new THREE.BoxGeometry(1, 0.2, 1); // Normalized size for scaling
const roadGeom = new THREE.PlaneGeometry(1, 1);

// Materials (SharedCache)
// Materials (SharedCache)
const matCache = {
    road: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }),
    building: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.5 }), // Fallback/Dark
    window: new THREE.MeshBasicMaterial({ color: 0xffffaa }),
    lane: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ground: new THREE.MeshStandardMaterial({ color: 0x3a2e26, roughness: 1.0 }),
    // NYC Materials
    stoneA: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }), // Concrete/Limestone
    stoneB: new THREE.MeshStandardMaterial({ color: 0xaa9988, roughness: 0.9 }), // Warm Stone
    glassBlue: new THREE.MeshStandardMaterial({ color: 0x112244, roughness: 0.0, metalness: 0.9 }), // Modern Glass
    glassBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.0, metalness: 0.9 }), // Sleek Glass
    metalGold: new THREE.MeshStandardMaterial({ color: 0xccaa44, roughness: 0.3, metalness: 0.8 }), // Art Deco Trim
    roof: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1.0 })
};

function createProceduralBuilding(x, z, width, chunkGroup, colliders) {
    // 3 Styles: 0=Setback (Classic), 1=Modern (Glass), 2=Art Deco (Stone+Gold)
    const style = Math.floor(Math.random() * 3);
    const height = 15 + Math.random() * 45; // Much Taller: 15 to 60 units

    // Base Collider (Always the full footprint for simplicity in peds logic)
    // We already leave a rim on the sidewalk, so this is safe.
    const box = new THREE.Box3();
    box.min.set(x - width / 2, 0, z - width / 2);
    box.max.set(x + width / 2, height, z + width / 2);
    colliders.push(box);

    if (style === 0) {
        // --- Classic Setback (Empire State style) ---
        // Tier 1: Base (Full width, 40% height)
        const h1 = height * 0.4;
        const b1 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b1.position.set(x, h1 / 2, z);
        b1.scale.set(width, h1, width);
        b1.castShadow = true; b1.receiveShadow = true;
        chunkGroup.add(b1);
        addWindows(b1, width, h1, width, 0.7);

        // Tier 2: Mid (70% width, 30% height)
        const h2 = height * 0.3;
        const w2 = width * 0.7;
        const b2 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b2.position.set(x, h1 + h2 / 2, z);
        b2.scale.set(w2, h2, w2);
        b2.castShadow = true; b2.receiveShadow = true;
        chunkGroup.add(b2);
        addWindows(b2, w2, h2, w2, 0.6);

        // Tier 3: Top (40% width, 30% height)
        const h3 = height * 0.3;
        const w3 = width * 0.4;
        const b3 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b3.position.set(x, h1 + h2 + h3 / 2, z);
        b3.scale.set(w3, h3, w3);
        b3.castShadow = true; b3.receiveShadow = true;
        chunkGroup.add(b3);

        // Spire
        const spireH = 5;
        const spire = new THREE.Mesh(buildingGeom, matCache.metalGold);
        spire.position.set(x, height + spireH / 2, z);
        spire.scale.set(0.5, spireH, 0.5);
        chunkGroup.add(spire);

    } else if (style === 1) {
        // --- Modern Glass Monolith ---
        // Single tall block, maybe chamfered or varying slightly
        const mat = Math.random() > 0.5 ? matCache.glassBlue : matCache.glassBlack;

        const b = new THREE.Mesh(buildingGeom, mat);
        b.position.set(x, height / 2, z);
        b.scale.set(width, height, width);
        b.castShadow = true; b.receiveShadow = true;
        chunkGroup.add(b);

        // Vertical metallic strips (Mullions)
        const numStrips = 3;
        for (let i = 0; i < numStrips; i++) {
            // X-face strips
            const s1 = new THREE.Mesh(buildingGeom, matCache.sidewalk); // Grey metal
            s1.scale.set(0.2, height, width + 0.1);
            s1.position.set(x + (i - 1) * (width / 3), height / 2, z);
            chunkGroup.add(s1);

            // Z-face strips
            const s2 = new THREE.Mesh(buildingGeom, matCache.sidewalk);
            s2.scale.set(width + 0.1, height, 0.2);
            s2.position.set(x, height / 2, z + (i - 1) * (width / 3));
            chunkGroup.add(s2);
        }

    } else {
        // --- Art Deco Block ---
        // Stone with gold corners/trim
        const mat = matCache.stoneB;

        // Main block
        const b = new THREE.Mesh(buildingGeom, mat);
        b.position.set(x, height / 2, z);
        b.scale.set(width, height, width);
        b.castShadow = true; b.receiveShadow = true;
        chunkGroup.add(b);
        addWindows(b, width, height, width, 0.5);

        // Gold Corners (Pillars)
        const pillarW = 0.5;
        const corners = [
            { mx: -1, mz: -1 }, { mx: 1, mz: -1 }, { mx: 1, mz: 1 }, { mx: -1, mz: 1 }
        ];
        corners.forEach(c => {
            const p = new THREE.Mesh(buildingGeom, matCache.metalGold);
            p.position.set(x + c.mx * (width / 2), height / 2, z + c.mz * (width / 2));
            p.scale.set(pillarW, height + 1, pillarW); // Slightly taller
            chunkGroup.add(p);
        });
    }
}

function addWindows(mesh, w, h, d, density) {
    // Simple scattered windows on faces
    // We can just add child meshes relative to the parent? No, logic is separated.
    // Let's spawn new global meshes to avoid hierarchy complexity with scaling.
    const numWin = Math.floor(w * h * density * 0.5);
    for (let i = 0; i < numWin; i++) {
        const win = new THREE.Mesh(windowGeom, matCache.window);
        const side = Math.floor(Math.random() * 4);

        // Random Y
        const y = mesh.position.y - h / 2 + Math.random() * h;
        // Random Offset
        const off = (Math.random() - 0.5) * (side % 2 === 0 ? w : d);

        // Adjust for window size to stay inside
        if (Math.abs(off) > (side % 2 === 0 ? w / 2 - 0.5 : d / 2 - 0.5)) continue;

        if (side === 0) { // Front (+Z)
            win.position.set(mesh.position.x + off, y, mesh.position.z + d / 2 + 0.05);
        } else if (side === 1) { // Back (-Z)
            win.position.set(mesh.position.x + off, y, mesh.position.z - d / 2 - 0.05);
            win.rotation.y = Math.PI;
        } else if (side === 2) { // Right (+X)
            win.position.set(mesh.position.x + w / 2 + 0.05, y, mesh.position.z + off);
            win.rotation.y = Math.PI / 2;
        } else { // Left (-X)
            win.position.set(mesh.position.x - w / 2 - 0.05, y, mesh.position.z + off);
            win.rotation.y = -Math.PI / 2;
        }
        // Don't modify chunks inside this loop helper directly, need access to chunkGroup.
        // Quick hack: pass chunkGroup or just return arrays?
        // Actually, createProceduralBuilding has scope.
        // Let's inline this logic or pass group.
    }
}
// REDEFINING addWindows properly to take group
function spawnWindows(x, y, z, w, h, d, group) {
    const floors = Math.floor(h / 1.5);
    const cols = Math.floor(w / 1.5);

    // Grid pattern instead of random
    for (let f = 0; f < floors; f++) {
        if (Math.random() > 0.8) continue; // Skip some floors
        const yPos = y - h / 2 + 1 + f * 1.5;

        for (let c = 0; c < cols; c++) {
            // 4 Sides
            const offset = -w / 2 + 1 + c * 1.5;

            // +Z
            if (Math.random() < 0.7) {
                const win = new THREE.Mesh(windowGeom, matCache.window);
                win.position.set(x + offset, yPos, z + d / 2 + 0.05);
                group.add(win);
            }
            // -Z
            if (Math.random() < 0.7) {
                const win = new THREE.Mesh(windowGeom, matCache.window);
                win.position.set(x + offset, yPos, z - d / 2 - 0.05);
                win.rotation.y = Math.PI;
                group.add(win);
            }
            // +X
            if (Math.random() < 0.7) {
                const win = new THREE.Mesh(windowGeom, matCache.window);
                win.position.set(x + w / 2 + 0.05, yPos, z + offset);
                win.rotation.y = Math.PI / 2;
                group.add(win);
            }
            // -X
            if (Math.random() < 0.7) {
                const win = new THREE.Mesh(windowGeom, matCache.window);
                win.position.set(x - w / 2 - 0.05, yPos, z + offset);
                win.rotation.y = -Math.PI / 2;
                group.add(win);
            }
        }
    }
}

// Rewriting createProceduralBuilding to use clean spawnWindows
function createNYCBuilding(x, z, width, chunkGroup, colliders) {
    const style = Math.floor(Math.random() * 3);
    const height = 20 + Math.random() * 50; // Taller! 20-70

    // Collider (Base)
    const box = new THREE.Box3();
    box.min.set(x - width / 2, 0, z - width / 2);
    box.max.set(x + width / 2, height, z + width / 2);
    colliders.push(box);

    if (style === 0) {
        // Setback
        const h1 = height * 0.45;
        const b1 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b1.position.set(x, h1 / 2, z);
        b1.scale.set(width, h1, width);
        b1.receiveShadow = true; b1.castShadow = true;
        chunkGroup.add(b1);
        spawnWindows(x, h1 / 2, z, width, h1, width, chunkGroup);

        const h2 = height * 0.35;
        const w2 = width * 0.7;
        const b2 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b2.position.set(x, h1 + h2 / 2, z);
        b2.scale.set(w2, h2, w2);
        b2.receiveShadow = true; b2.castShadow = true;
        chunkGroup.add(b2);
        spawnWindows(x, h1 + h2 / 2, z, w2, h2, w2, chunkGroup);

        const h3 = height * 0.2;
        const w3 = width * 0.4;
        const b3 = new THREE.Mesh(buildingGeom, matCache.stoneA);
        b3.position.set(x, h1 + h2 + h3 / 2, z);
        b3.scale.set(w3, h3, w3);
        b3.receiveShadow = true; b3.castShadow = true;
        chunkGroup.add(b3);

        // Antenna
        const ant = new THREE.Mesh(buildingGeom, matCache.metalGold);
        ant.position.set(x, height + 4, z);
        ant.scale.set(0.3, 8, 0.3);
        chunkGroup.add(ant);

    } else if (style === 1) {
        // Glass
        const mat = Math.random() > 0.5 ? matCache.glassBlue : matCache.glassBlack;
        const b = new THREE.Mesh(buildingGeom, mat);
        b.position.set(x, height / 2, z);
        b.scale.set(width, height, width);
        b.castShadow = true; b.receiveShadow = true;
        chunkGroup.add(b);

        // Roof
        const roof = new THREE.Mesh(buildingGeom, matCache.sidewalk);
        roof.position.set(x, height + 0.5, z);
        roof.scale.set(width, 1, width);
        chunkGroup.add(roof);

    } else {
        // Art Deco
        const mat = matCache.stoneB;
        const b = new THREE.Mesh(buildingGeom, mat);
        b.position.set(x, height / 2, z);
        b.scale.set(width, height, width);
        b.castShadow = true; b.receiveShadow = true;
        chunkGroup.add(b);
        spawnWindows(x, height / 2, z, width, height, width, chunkGroup);

        // Gold Trim Corners
        const pw = 0.6;
        const corners = [{ x: -1, z: -1 }, { x: 1, z: -1 }, { x: 1, z: 1 }, { x: -1, z: 1 }];
        corners.forEach(c => {
            const p = new THREE.Mesh(buildingGeom, matCache.metalGold);
            p.position.set(x + c.x * width / 2, height / 2, z + c.z * width / 2);
            p.scale.set(pw, height, pw);
            chunkGroup.add(p);
        });
    }
}

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

    // 3. Sidewalks & Buildings (4 Corners)
    const cornerSize = (size - 14) / 2; // ~10
    const offset = 7 + cornerSize / 2; // 12

    const corners = [
        { x: -offset, z: -offset },
        { x: offset, z: -offset },
        { x: offset, z: offset },
        { x: -offset, z: offset }
    ];

    corners.forEach(corner => {
        // Sidewalk
        const sw = new THREE.Mesh(sidewalkGeom, matCache.sidewalk);
        sw.position.set(xPos + corner.x, 0.1, zPos + corner.z);
        sw.scale.set(cornerSize, 1, cornerSize);
        sw.receiveShadow = true;
        chunkGroup.add(sw);

        // NYC Building
        if (Math.random() > 0.2) { // 80% density
            const width = cornerSize - 4; // 6
            createNYCBuilding(xPos + corner.x, zPos + corner.z, width, chunkGroup, colliders);
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
