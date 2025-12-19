import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const sharedResources = {
    loaded: false,
    materials: {},
    geometries: {}
};

function initSharedResources() {
    if (sharedResources.loaded) return;

    // --- MATERIALS ---

    // 1. High-Tech Glass
    const glassCanvas = document.createElement('canvas');
    glassCanvas.width = 512; glassCanvas.height = 512;
    const gCtx = glassCanvas.getContext('2d');
    // Subtle bluish/teal tint gradient
    const grd = gCtx.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#102030');
    grd.addColorStop(1, '#153040');
    gCtx.fillStyle = grd;
    gCtx.fillRect(0, 0, 512, 512);
    // Grid lines for panels
    gCtx.strokeStyle = 'rgba(0,0,0,0.5)';
    gCtx.lineWidth = 2;
    gCtx.beginPath();
    // Vertical lines
    for (let i = 0; i <= 16; i++) {
        const x = (i / 16) * 512;
        gCtx.moveTo(x, 0); gCtx.lineTo(x, 512);
    }
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * 512;
        gCtx.moveTo(0, y); gCtx.lineTo(512, y);
    }
    gCtx.stroke();

    // Noise for slight imperfection/reflection breakup
    for (let i = 0; i < 4000; i++) {
        gCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
        gCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const glassTex = new THREE.CanvasTexture(glassCanvas);
    glassTex.wrapS = THREE.RepeatWrapping;
    glassTex.wrapT = THREE.RepeatWrapping;
    glassTex.colorSpace = THREE.SRGBColorSpace;

    const glassMat = new THREE.MeshStandardMaterial({
        map: glassTex,
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.9,
        envMapIntensity: 2.0,
        transparent: false,
        side: THREE.FrontSide
    });
    sharedResources.materials.glass = glassMat;

    // 2. Dark Steel Structure
    sharedResources.materials.steel = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.8
    });

    // 3. Concrete Core/Floor
    const concCanvas = document.createElement('canvas');
    concCanvas.width = 256; concCanvas.height = 256;
    const cCtx = concCanvas.getContext('2d');
    cCtx.fillStyle = '#606060'; cCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1000; i++) {
        cCtx.fillStyle = Math.random() > 0.5 ? '#555' : '#777';
        cCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const concTex = new THREE.CanvasTexture(concCanvas);
    concTex.wrapS = THREE.RepeatWrapping;
    concTex.wrapT = THREE.RepeatWrapping;

    sharedResources.materials.concrete = new THREE.MeshStandardMaterial({
        map: concTex,
        roughness: 0.9,
        metalness: 0.1
    });

    // 4. Detailed Helipad Texture
    const heliCanvas = document.createElement('canvas');
    heliCanvas.width = 512; heliCanvas.height = 512;
    const hCtx = heliCanvas.getContext('2d');

    // Abstract Concrete Base
    hCtx.fillStyle = '#444444';
    hCtx.fillRect(0, 0, 512, 512);
    // Noise
    for (let i = 0; i < 10000; i++) {
        hCtx.fillStyle = Math.random() > 0.5 ? '#3a3a3a' : '#4e4e4e';
        hCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }

    // Yellow Circle
    hCtx.strokeStyle = '#eebb00';
    hCtx.lineWidth = 20;
    hCtx.beginPath();
    hCtx.arc(256, 256, 200, 0, Math.PI * 2);
    hCtx.stroke();

    // White "H"
    hCtx.fillStyle = '#dddddd';
    hCtx.font = "bold 250px Arial";
    hCtx.textAlign = "center";
    hCtx.textBaseline = "middle";
    hCtx.fillText("H", 256, 256);

    // Weathering/Dirt on top
    hCtx.globalAlpha = 0.3;
    for (let i = 0; i < 5000; i++) {
        hCtx.fillStyle = '#222222';
        hCtx.beginPath();
        hCtx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 10, 0, Math.PI * 2);
        hCtx.fill();
    }
    hCtx.globalAlpha = 1.0;

    const heliTex = new THREE.CanvasTexture(heliCanvas);
    heliTex.colorSpace = THREE.SRGBColorSpace;

    sharedResources.materials.helipad = new THREE.MeshStandardMaterial({
        map: heliTex,
        roughness: 0.8,
        bumpMap: heliTex,
        bumpScale: 0.05
    });

    // 5. Landing Light Material
    sharedResources.materials.landingLight = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 2.0
    });

    // --- GEOMETRIES ---

    // 1. Structural Column
    sharedResources.geometries.column = new THREE.CylinderGeometry(0.4, 0.4, 4.0, 16);

    // 2. Floor Plate
    // We'll proceedurally gen this, but maybe a wedge for instancing?
    // Let's use a full cylinder slice for simplicity in stacking
    sharedResources.geometries.floorPlate = new THREE.CylinderGeometry(6.8, 6.8, 0.3, 32);

    // 3. Central Core
    sharedResources.geometries.core = new THREE.CylinderGeometry(2.5, 2.5, 4.0, 16);

    // 4. Landing Light Geo
    sharedResources.geometries.landingLight = new THREE.SphereGeometry(0.15, 8, 8);

    sharedResources.loaded = true;
}

export class ModernGlassTower {
    constructor() {
        initSharedResources();
        this.visual = new THREE.Group();
        this.generateBuilding();
    }

    generateBuilding() {
        const floorHeight = 4.0;
        const numFloors = 18; // Taller than the brick one
        const radius = 7.0;

        // --- 1. CORE & FLOORS (Instanced) ---
        const floorCount = numFloors + 1; // +Roof
        const floorMesh = new THREE.InstancedMesh(sharedResources.geometries.floorPlate, sharedResources.materials.concrete, floorCount);
        const coreMesh = new THREE.InstancedMesh(sharedResources.geometries.core, sharedResources.materials.concrete, floorCount);

        // Columns: 8 around the radius per floor
        const colsPerFloor = 8;
        const colMesh = new THREE.InstancedMesh(sharedResources.geometries.column, sharedResources.materials.steel, floorCount * colsPerFloor);

        const tempObj = new THREE.Object3D();
        let colIdx = 0;

        for (let i = 0; i < numFloors; i++) {
            const y = (i * floorHeight) + (floorHeight / 2);

            // Floor Plate (at bottom of floor volume)
            tempObj.position.set(0, y - floorHeight / 2 + 0.15, 0);
            tempObj.rotation.set(0, 0, 0);
            tempObj.scale.set(1, 1, 1);
            tempObj.updateMatrix();
            floorMesh.setMatrixAt(i, tempObj.matrix);

            // Core
            tempObj.position.set(0, y, 0);
            tempObj.updateMatrix();
            coreMesh.setMatrixAt(i, tempObj.matrix);

            // Columns Ring
            for (let c = 0; c < colsPerFloor; c++) {
                const angle = (c / colsPerFloor) * Math.PI * 2;
                const cX = Math.cos(angle) * (radius - 1.0);
                const cZ = Math.sin(angle) * (radius - 1.0);
                tempObj.position.set(cX, y, cZ);
                tempObj.updateMatrix();
                colMesh.setMatrixAt(colIdx++, tempObj.matrix);
            }
        }

        floorMesh.castShadow = true; floorMesh.receiveShadow = true;
        coreMesh.castShadow = true; coreMesh.receiveShadow = true;
        colMesh.castShadow = true; colMesh.receiveShadow = true;

        this.visual.add(floorMesh);
        this.visual.add(coreMesh);
        this.visual.add(colMesh);

        // --- 2. GLASS FACADE ---
        // One large cylinder? Or segments?
        // A single continuous cylinder looks best for "sleek modern".
        // We make it slightly larger than floor plates.
        const glassGeo = new THREE.CylinderGeometry(radius, radius, numFloors * floorHeight, 64, numFloors, true);
        const glassMesh = new THREE.Mesh(glassGeo, sharedResources.materials.glass);
        glassMesh.position.y = (numFloors * floorHeight) / 2;
        this.visual.add(glassMesh);

        // --- 3. HELIPAD ROOF ---
        const roofY = numFloors * floorHeight;
        const heliGeo = new THREE.CylinderGeometry(6, 6.5, 0.5, 32);
        // Correct UVs for top face to map the texture properly
        const posAttribute = heliGeo.attributes.position;
        const uvAttribute = heliGeo.attributes.uv;
        // Simple planar projection for top cap (which are the first 33 vertices + center typically, or simpler: just re-map based on x,z)
        // Cylinder geometry vertices layout is complicated. Let's just rely on basic mapping or create a Plane for the top decal?
        // Actually, cylinder top UVs are often radial. Let's make a separate "Cap" mesh for the texture to ensure it's planar.

        // Base structure
        const heliBase = new THREE.Mesh(heliGeo, sharedResources.materials.concrete);
        heliBase.position.set(0, roofY, 0);
        heliBase.receiveShadow = true;
        this.visual.add(heliBase);

        // Textured Top Cap
        const capGeo = new THREE.CircleGeometry(6, 32);
        const heliCap = new THREE.Mesh(capGeo, sharedResources.materials.helipad);
        heliCap.rotation.x = -Math.PI / 2;
        heliCap.position.set(0, roofY + 0.26, 0);
        heliCap.receiveShadow = true;
        this.visual.add(heliCap);

        // Landing Lights Ring
        const numLights = 12;
        const lightRingRadius = 6.2;
        for (let l = 0; l < numLights; l++) {
            const angle = (l / numLights) * Math.PI * 2;
            const lx = Math.cos(angle) * lightRingRadius;
            const lz = Math.sin(angle) * lightRingRadius;

            const light = new THREE.Mesh(sharedResources.geometries.landingLight, sharedResources.materials.landingLight);
            light.position.set(lx, roofY + 0.1, lz);
            this.visual.add(light);
        }

        // --- 4. GROUND LOBBY ---
        // Subtract glass from bottom? The cylinder geometry is one piece.
        // Actually, let's keep it simple: The glass goes to ground, but we add a canopy.
        const canGeo = new THREE.CylinderGeometry(9, 9, 0.2, 32);
        const canopy = new THREE.Mesh(canGeo, sharedResources.materials.steel);
        canopy.position.set(0, 5.0, 0); // Above first floor
        this.visual.add(canopy);

        // Entrance pillars
        const entCol = new THREE.CylinderGeometry(0.5, 0.5, 5.0, 16);
        for (let k = 0; k < 4; k++) {
            const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
            const pm = new THREE.Mesh(entCol, sharedResources.materials.steel);
            pm.position.set(Math.cos(ang) * 8, 2.5, Math.sin(ang) * 8);
            pm.castShadow = true; pm.receiveShadow = true;
            this.visual.add(pm);
        }

        // --- 5. REVOLVING DOOR ENTRANCE ---
        const doorZ = radius; // On the rim

        // Vestibule Frame
        const vestGeo = new THREE.BoxGeometry(4, 3.5, 3);
        const vest = new THREE.Mesh(vestGeo, sharedResources.materials.steel);
        vest.position.set(0, 1.75, doorZ);
        this.visual.add(vest);

        // Internal "Air" (Cutout visual) - for now just slightly smaller dark box
        const vestIn = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.1, 3.1), sharedResources.materials.concrete);
        vestIn.position.set(0, 1.75, doorZ);
        this.visual.add(vestIn);

        // Revolving Door Cylinder
        const revGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
        const revDoor = new THREE.Mesh(revGeo, sharedResources.materials.glass); // Uses the glass material
        // We need a transparent glass for the door so we can see the "fins" inside, 
        // but our main glass is opaque now. Let's make a specific transparent glass for the door.
        // Or just use the steel for the fins and existing glass which is opaque... 
        // Opaque revolving door is weird. Let's make a quick transparent material locally or in shared.

        // Let's assume we modify shared resources or just create one here for the door spec
        const clearGlass = new THREE.MeshStandardMaterial({
            color: 0xccffff, roughness: 0.1, metalness: 0.9,
            transparent: true, opacity: 0.3
        });
        revDoor.material = clearGlass;
        revDoor.position.set(0, 1.5, doorZ + 0.5);
        this.visual.add(revDoor);

        // Revolving Fins (The actual door leaves)
        const finGeo = new THREE.BoxGeometry(2.2, 2.8, 0.1);
        const fins1 = new THREE.Mesh(finGeo, sharedResources.materials.steel);
        fins1.position.set(0, 1.5, doorZ + 0.5);
        this.visual.add(fins1);

        const fins2 = new THREE.Mesh(finGeo, sharedResources.materials.steel);
        fins2.rotation.y = Math.PI / 2;
        fins2.position.set(0, 1.5, doorZ + 0.5);
        this.visual.add(fins2);
    }
}
