import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const sharedResources = {
    loaded: false,
    materials: {},
    geometries: {}
};

function initSharedResources() {
    if (sharedResources.loaded) return;

    // ==========================================
    // 1. TEXTURES & MATERIALS
    // ==========================================

    // --- WALL TEXTURE ---
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, 1024, 1024);

    const brickWidth = 40;
    const brickHeight = 16;
    const gap = 3;
    const baseHues = [20, 30, 15];

    for (let y = 0; y < 1024; y += brickHeight + gap) {
        const offset = (Math.floor(y / (brickHeight + gap)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth; x < 1024; x += brickWidth + gap) {
            const hue = baseHues[Math.floor(Math.random() * baseHues.length)] + (Math.random() * 10 - 5);
            const sat = 15 + Math.random() * 25;
            const lit = 20 + Math.random() * 20;

            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
            ctx.fillRect(x + offset, y, brickWidth, brickHeight);

            if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(0,0,0,0.2)`;
                ctx.fillRect(x + offset, y, brickWidth, brickHeight / 2);
            }
        }
    }

    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 40000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 20);
    texture.colorSpace = THREE.SRGBColorSpace;

    // --- NORMAL MAP ---
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 1024;
    normalCanvas.height = 1024;
    const nCtx = normalCanvas.getContext('2d');

    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, 1024, 1024);

    for (let y = 0; y < 1024; y += brickHeight + gap) {
        const offset = (Math.floor(y / (brickHeight + gap)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth; x < 1024; x += brickWidth + gap) {
            nCtx.fillStyle = '#8080ff';
            nCtx.fillRect(x + offset, y, brickWidth, brickHeight);
            nCtx.fillStyle = '#80ff80'; // Top
            nCtx.fillRect(x + offset, y, brickWidth, 1);
            nCtx.fillStyle = '#800080'; // Bottom
            nCtx.fillRect(x + offset, y + brickHeight - 1, brickWidth, 1);
            nCtx.fillStyle = '#0080ff'; // Left
            nCtx.fillRect(x + offset, y, 1, brickHeight);
            nCtx.fillStyle = '#ff80ff'; // Right
            nCtx.fillRect(x + offset + brickWidth - 1, y, 1, brickHeight);
        }
    }

    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 20);

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughness: 0.95,
        metalness: 0.0
    });
    sharedResources.materials.wall = wallMaterial;

    // --- GLASS MATERIAL ---
    const glassCanvas = document.createElement('canvas');
    glassCanvas.width = 512; glassCanvas.height = 512;
    const gCtx = glassCanvas.getContext('2d');
    gCtx.fillStyle = '#000000'; gCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 100; i++) {
        gCtx.beginPath();
        gCtx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 50, 0, Math.PI * 2);
        gCtx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.1})`;
        gCtx.fill();
    }
    const glassRoughness = new THREE.CanvasTexture(glassCanvas);
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        roughnessMap: glassRoughness,
        transparent: false,
        opacity: 1.0,
        side: THREE.FrontSide
    });
    sharedResources.materials.glass = glassMat;

    // --- OTHER MATERIALS ---
    sharedResources.materials.frame = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 });
    sharedResources.materials.decor = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.9, metalness: 0.0 });
    sharedResources.materials.column = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1.0 });
    sharedResources.materials.fireEscape = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.6 });
    sharedResources.materials.cornice = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    sharedResources.materials.brass = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 1.0, roughness: 0.2 });
    sharedResources.materials.doorFrame = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.8 });

    // --- STONE GROUND MAT ---
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512; stoneCanvas.height = 512;
    const sCtx = stoneCanvas.getContext('2d');
    sCtx.fillStyle = '#55504d';
    sCtx.fillRect(0, 0, 512, 512);
    // (Simplified stone tex generation for performance)
    sCtx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 50; i++) sCtx.fillRect(Math.random() * 512, Math.random() * 512, 64, 32);

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(4, 2);
    stoneTex.colorSpace = THREE.SRGBColorSpace;

    sharedResources.materials.stone = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.9,
        bumpMap: stoneTex,
        bumpScale: 0.05
    });


    // ==========================================
    // 2. GEOMETRIES
    // ==========================================

    // Window Frame
    const windowWidth = 1.4;
    const windowHeight = 2.0;
    const frameDepth = 0.2;
    const barThickness = 0.05;
    const frameGeometries = [];
    const topBar = new THREE.BoxGeometry(windowWidth, 0.1, frameDepth); topBar.translate(0, windowHeight / 2 - 0.05, 0); frameGeometries.push(topBar);
    const botBar = new THREE.BoxGeometry(windowWidth, 0.1, frameDepth); botBar.translate(0, -windowHeight / 2 + 0.05, 0); frameGeometries.push(botBar);
    const leftBar = new THREE.BoxGeometry(0.1, windowHeight - 0.2, frameDepth); leftBar.translate(-windowWidth / 2 + 0.05, 0, 0); frameGeometries.push(leftBar);
    const rightBar = new THREE.BoxGeometry(0.1, windowHeight - 0.2, frameDepth); rightBar.translate(windowWidth / 2 - 0.05, 0, 0); frameGeometries.push(rightBar);
    const vMuntin = new THREE.BoxGeometry(barThickness, windowHeight - 0.2, frameDepth / 2); vMuntin.translate(0, 0, 0); frameGeometries.push(vMuntin);
    const hMuntin = new THREE.BoxGeometry(windowWidth - 0.2, barThickness, frameDepth / 2); hMuntin.translate(0, 0.2, 0); frameGeometries.push(hMuntin);
    sharedResources.geometries.frame = mergeGeometries(frameGeometries);

    // Window Decor
    const decorGeometries = [];
    const lintelGeo = new THREE.BoxGeometry(windowWidth + 0.4, 0.35, 0.25); lintelGeo.translate(0, windowHeight / 2 + 0.175, 0.05); decorGeometries.push(lintelGeo);
    const keyGeo = new THREE.BoxGeometry(0.3, 0.45, 0.3); keyGeo.translate(0, windowHeight / 2 + 0.175, 0.08); decorGeometries.push(keyGeo);
    const sillGeo = new THREE.BoxGeometry(windowWidth + 0.2, 0.15, 0.3); sillGeo.translate(0, -windowHeight / 2 - 0.075, 0.1); decorGeometries.push(sillGeo);
    sharedResources.geometries.decor = mergeGeometries(decorGeometries);

    // Glass
    sharedResources.geometries.glass = new THREE.PlaneGeometry(windowWidth - 0.2, windowHeight - 0.2);

    // Balcony Railing
    const balWidth = 12 * 0.5; // Fixed assumption: Width 12. 
    const balDepth = 1.5;
    const railGeos = [];
    const handrailGeo = new THREE.BoxGeometry(balWidth + 0.1, 0.1, 0.1); handrailGeo.translate(0, 1.0, balDepth / 2); railGeos.push(handrailGeo);
    const sideRail1 = new THREE.BoxGeometry(0.1, 0.1, balDepth); sideRail1.translate(-balWidth / 2, 1.0, 0); railGeos.push(sideRail1);
    const sideRail2 = new THREE.BoxGeometry(0.1, 0.1, balDepth); sideRail2.translate(balWidth / 2, 1.0, 0); railGeos.push(sideRail2);
    const numPosts = 10;
    const postGap = balWidth / numPosts;
    for (let j = 0; j <= numPosts; j++) {
        const post = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
        post.translate(-balWidth / 2 + j * postGap, 0.5, balDepth / 2);
        railGeos.push(post);
    }
    for (let j = 0; j < 3; j++) {
        const z = j * (balDepth / 3);
        const postL = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8); postL.translate(-balWidth / 2, 0.5, z); railGeos.push(postL);
        const postR = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8); postR.translate(balWidth / 2, 0.5, z); railGeos.push(postR);
    }
    sharedResources.geometries.balconyRail = mergeGeometries(railGeos);

    // Balcony Stone
    const stoneGeos = [];
    const platGeo = new THREE.BoxGeometry(balWidth, 0.2, balDepth); platGeo.translate(0, 0.1, 0); stoneGeos.push(platGeo);
    const numCorbels = 3;
    for (let j = 0; j < numCorbels; j++) {
        const x = -balWidth / 2 + 0.5 + j * ((balWidth - 1) / (numCorbels - 1));
        const cV = new THREE.BoxGeometry(0.3, 0.6, 0.8); cV.translate(x, -0.4, 0.2); stoneGeos.push(cV);
        const cS = new THREE.BoxGeometry(0.3, 0.3, 0.4); cS.translate(x, -0.8, 0); stoneGeos.push(cS);
    }
    sharedResources.geometries.balconyStone = mergeGeometries(stoneGeos);

    // Column
    const colWidth = 0.6;
    const colDepth = 0.6;
    const floorHeight = 3.5;
    sharedResources.geometries.column = new THREE.BoxGeometry(colWidth, floorHeight, colDepth);

    // Fire Escape Platform
    const fePlatGeos = [];
    const pFrameW = new THREE.BoxGeometry(1.5, 0.1, 0.1); pFrameW.translate(0, 0, 2); fePlatGeos.push(pFrameW.clone());
    pFrameW.translate(0, 0, -4); fePlatGeos.push(pFrameW);
    const pChan = new THREE.BoxGeometry(0.1, 0.15, 4); pChan.translate(-0.75, 0, 0); fePlatGeos.push(pChan.clone());
    pChan.translate(1.5, 0, 0); fePlatGeos.push(pChan);
    const pEnd = new THREE.BoxGeometry(1.3, 0.15, 0.1); pEnd.translate(0, 0, 1.95); fePlatGeos.push(pEnd.clone());
    pEnd.translate(0, 0, -3.9); fePlatGeos.push(pEnd);
    const pBar = new THREE.BoxGeometry(1.4, 0.02, 0.05);
    for (let k = 0; k < 20; k++) {
        const bar = pBar.clone(); bar.translate(0, 0.05, -1.9 + k * 0.2); fePlatGeos.push(bar);
    }
    const rPost = new THREE.BoxGeometry(0.05, 1.0, 0.05);
    for (let k = 0; k <= 4; k++) {
        const post = rPost.clone(); post.translate(-0.75, 0.5, -1.9 + k * 0.95); fePlatGeos.push(post);
    }
    const rTop = new THREE.BoxGeometry(0.05, 0.05, 4); rTop.translate(-0.75, 1.0, 0); fePlatGeos.push(rTop);
    const rMid = new THREE.BoxGeometry(0.05, 0.05, 4); rMid.translate(-0.75, 0.5, 0); fePlatGeos.push(rMid);
    const rEndTop = new THREE.BoxGeometry(1.5, 0.05, 0.05); rEndTop.translate(0, 1.0, 1.95); fePlatGeos.push(rEndTop.clone()); // Front
    rEndTop.translate(0, 1.0, -1.95); fePlatGeos.push(rEndTop); // Back
    sharedResources.geometries.fireEscapePlatform = mergeGeometries(fePlatGeos);

    // Fire Escape Stairs
    const feStairGeos = [];
    const sLen = 3.5; const sHeight = 3.5;
    const sHyp = Math.sqrt(sLen * sLen + sHeight * sHeight);
    const sAngle = Math.atan2(sHeight, sLen);
    const numSteps = 14; const stepRise = sHeight / numSteps; const stepRun = sLen / numSteps;
    for (let s = 0; s < numSteps; s++) {
        const step = new THREE.BoxGeometry(0.8, 0.05, 0.25);
        step.translate(0, s * stepRise, -s * stepRun); feStairGeos.push(step);
    }
    const strGeo = new THREE.BoxGeometry(0.1, 0.15, sHyp + 0.5);
    const sL2 = strGeo.clone(); sL2.rotateX(sAngle); sL2.translate(-0.45, sHeight / 2, -sLen / 2); feStairGeos.push(sL2);
    const sR2 = strGeo.clone(); sR2.rotateX(sAngle); sR2.translate(0.45, sHeight / 2, -sLen / 2); feStairGeos.push(sR2);
    const hrGeo = new THREE.BoxGeometry(0.05, 0.05, sHyp + 0.5);
    const hrL = hrGeo.clone(); hrL.rotateX(sAngle); hrL.translate(-0.45, sHeight / 2 + 0.9, -sLen / 2); feStairGeos.push(hrL);
    for (let k = 0; k < 3; k++) {
        const hPost = new THREE.BoxGeometry(0.04, 0.9, 0.04);
        const t = k / 2;
        const py = t * sHeight; const pz = -t * sLen;
        hPost.translate(-0.45, py + 0.45, pz); feStairGeos.push(hPost);
    }
    sharedResources.geometries.fireEscapeStairs = mergeGeometries(feStairGeos);

    sharedResources.geometries.quoin = new THREE.BoxGeometry(0.6, 0.5, 0.3);

    // --- ROOFTOP ASSETS ---

    // 1. Parapet
    const width = 12; const depth = 12;
    const parapetGeos = [];
    const pWallF = new THREE.BoxGeometry(width, 1.0, 0.3); pWallF.translate(0, 0.5, depth / 2 - 0.15); parapetGeos.push(pWallF);
    const pWallB = new THREE.BoxGeometry(width, 1.0, 0.3); pWallB.translate(0, 0.5, -depth / 2 + 0.15); parapetGeos.push(pWallB);
    const pWallL = new THREE.BoxGeometry(0.3, 1.0, depth - 0.6); pWallL.translate(-width / 2 + 0.15, 0.5, 0); parapetGeos.push(pWallL);
    const pWallR = new THREE.BoxGeometry(0.3, 1.0, depth - 0.6); pWallR.translate(width / 2 - 0.15, 0.5, 0); parapetGeos.push(pWallR);
    // Cornice Cap
    const pCapF = new THREE.BoxGeometry(width + 0.2, 0.1, 0.5); pCapF.translate(0, 1.05, depth / 2 - 0.15); parapetGeos.push(pCapF);
    const pCapB = new THREE.BoxGeometry(width + 0.2, 0.1, 0.5); pCapB.translate(0, 1.05, -depth / 2 + 0.15); parapetGeos.push(pCapB);
    const pCapL = new THREE.BoxGeometry(0.5, 0.1, depth + 0.2); pCapL.translate(-width / 2 + 0.15, 1.05, 0); parapetGeos.push(pCapL);
    const pCapR = new THREE.BoxGeometry(0.5, 0.1, depth + 0.2); pCapR.translate(width / 2 - 0.15, 1.05, 0); parapetGeos.push(pCapR);
    sharedResources.geometries.parapet = mergeGeometries(parapetGeos);

    // 2. HVAC Unit
    const hvacGeos = [];
    const hBox = new THREE.BoxGeometry(2.5, 1.5, 1.5); hBox.translate(0, 0.75, 0); hvacGeos.push(hBox);
    const hFan = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16); hFan.translate(0.5, 1.5, 0); hvacGeos.push(hFan);
    const hGrill = new THREE.BoxGeometry(0.8, 0.8, 0.1); hGrill.translate(-0.6, 1.0, 0.75); hvacGeos.push(hGrill);
    sharedResources.geometries.hvac = mergeGeometries(hvacGeos);

    // 3. Vent Pipe
    const ventGeos = [];
    const vStem = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8); vStem.translate(0, 0.6, 0); ventGeos.push(vStem);
    const vCap = new THREE.CylinderGeometry(0.25, 0.05, 0.2, 8); vCap.translate(0, 1.2, 0); ventGeos.push(vCap); // Conical cap
    sharedResources.geometries.vent = mergeGeometries(ventGeos);

    // 4. Roof Access
    const accessGeos = [];
    const aShed = new THREE.BoxGeometry(1.5, 2.2, 2.0); aShed.translate(0, 1.1, 0); accessGeos.push(aShed);
    const aDoor = new THREE.BoxGeometry(0.9, 2.0, 0.1); aDoor.translate(0, 1.0, 1.0); accessGeos.push(aDoor); // Front door
    sharedResources.geometries.roofAccess = mergeGeometries(accessGeos);

    // 5. Skylight
    const skyGeos = [];
    const sFrame = new THREE.BoxGeometry(2.0, 0.3, 3.0); sFrame.translate(0, 0.15, 0); skyGeos.push(sFrame);
    const sGlass = new THREE.BoxGeometry(1.8, 0.1, 2.8); sGlass.translate(0, 0.25, 0); // Angled? simplified flat
    skyGeos.push(sGlass);
    sharedResources.geometries.skylight = mergeGeometries(skyGeos);

    // Materials
    sharedResources.materials.roofTar = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
    sharedResources.materials.metalIndustrial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.5, metalness: 0.7 });

    sharedResources.loaded = true;
}

export class UrbanHighrise {
    constructor() {
        initSharedResources();
        this.visual = new THREE.Group();
        this.generateBuilding();
    }

    generateBuilding() {
        const width = 12;
        const depth = 12;
        const floorHeight = 3.5;
        const numFloors = 10;
        const groundFloorHeight = 4.5;
        const roofY = groundFloorHeight + (numFloors * floorHeight);

        // Reuse Geometries
        const floorGeo = new THREE.BoxGeometry(width * 0.95, floorHeight, depth * 0.95);

        // INSTANCED MESHES
        const maxCount = numFloors * 4 * 3 + 100;
        const frameMesh = new THREE.InstancedMesh(sharedResources.geometries.frame, sharedResources.materials.frame, maxCount);
        const decorMesh = new THREE.InstancedMesh(sharedResources.geometries.decor, sharedResources.materials.decor, maxCount);
        const glassMesh = new THREE.InstancedMesh(sharedResources.geometries.glass, sharedResources.materials.glass, maxCount);

        const balRailMesh = new THREE.InstancedMesh(sharedResources.geometries.balconyRail, sharedResources.materials.frame, 50);
        const balStoneMesh = new THREE.InstancedMesh(sharedResources.geometries.balconyStone, sharedResources.materials.decor, 50);

        frameMesh.castShadow = true; frameMesh.receiveShadow = true;
        decorMesh.castShadow = true; decorMesh.receiveShadow = true;
        glassMesh.receiveShadow = true;
        balRailMesh.castShadow = true; balRailMesh.receiveShadow = true;
        balStoneMesh.castShadow = true; balStoneMesh.receiveShadow = true;

        const colMaxCount = numFloors * 4 + 40;
        const colMesh = new THREE.InstancedMesh(sharedResources.geometries.column, sharedResources.materials.column, colMaxCount);
        colMesh.castShadow = true; colMesh.receiveShadow = true;

        let winIdx = 0;
        let colIdx = 0;
        let balIdx = 0;
        const tempObj = new THREE.Object3D();

        const fePlatMesh = new THREE.InstancedMesh(sharedResources.geometries.fireEscapePlatform, sharedResources.materials.fireEscape, numFloors);
        fePlatMesh.castShadow = true; fePlatMesh.receiveShadow = true;

        const feStairMesh = new THREE.InstancedMesh(sharedResources.geometries.fireEscapeStairs, sharedResources.materials.fireEscape, numFloors);
        feStairMesh.castShadow = true; feStairMesh.receiveShadow = true;

        let feIdx = 0;
        this.visual.add(fePlatMesh);
        this.visual.add(feStairMesh);

        // Ground Floor
        const groundGeo = new THREE.BoxGeometry(width + 0.2, groundFloorHeight, depth + 0.2);
        const groundMesh = new THREE.Mesh(groundGeo, sharedResources.materials.stone);
        groundMesh.position.y = groundFloorHeight / 2;
        groundMesh.receiveShadow = true;
        this.visual.add(groundMesh);

        // Belt Course
        const beltGeo = new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4);
        const belt = new THREE.Mesh(beltGeo, sharedResources.materials.decor);
        belt.position.set(0, groundFloorHeight, 0);
        belt.castShadow = true; belt.receiveShadow = true;
        this.visual.add(belt);

        // Quoins
        const qCount = numFloors * 40;
        const quoinInst = new THREE.InstancedMesh(sharedResources.geometries.quoin, sharedResources.materials.decor, qCount);
        quoinInst.castShadow = true; quoinInst.receiveShadow = true;
        let qIdx = 0;

        const placeQuoinColumn = (cX, cZ) => {
            const startY = groundFloorHeight + 0.25;
            const endY = roofY;
            let toggle = false;
            for (let h = startY; h < endY; h += 0.55) {
                toggle = !toggle;
                if (toggle) {
                    tempObj.rotation.set(0, 0, 0);
                    tempObj.scale.set(1.5, 1, 1);
                    tempObj.position.set(cX - (cX > 0 ? 0.45 : -0.45), h, cZ);
                } else {
                    tempObj.rotation.set(0, Math.PI / 2, 0);
                    tempObj.scale.set(1.5, 1, 1);
                    tempObj.position.set(cX, h, cZ - (cZ > 0 ? 0.45 : -0.45));
                }
                tempObj.updateMatrix();
                quoinInst.setMatrixAt(qIdx++, tempObj.matrix);
            }
        };

        const w2 = (width * 0.95) / 2;
        const d2 = (depth * 0.95) / 2;
        placeQuoinColumn(-w2, -d2);
        placeQuoinColumn(w2, -d2);
        placeQuoinColumn(-w2, d2);
        placeQuoinColumn(w2, d2);

        quoinInst.count = qIdx;
        this.visual.add(quoinInst);

        // Entrance
        const entZ = depth / 2 + 1.0;
        const colHeight = 3.5;
        const entColGeo = new THREE.CylinderGeometry(0.4, 0.4, colHeight, 16);
        const col1 = new THREE.Mesh(entColGeo, sharedResources.materials.decor);
        col1.position.set(-2, groundFloorHeight / 2 + 0.5, entZ);
        col1.castShadow = true; col1.receiveShadow = true;
        this.visual.add(col1);

        const col2 = new THREE.Mesh(entColGeo, sharedResources.materials.decor);
        col2.position.set(2, groundFloorHeight / 2 + 0.5, entZ);
        col2.castShadow = true; col2.receiveShadow = true;
        this.visual.add(col2);

        const canGeo = new THREE.BoxGeometry(5.5, 0.5, 2.5);
        const canopy = new THREE.Mesh(canGeo, sharedResources.materials.decor);
        canopy.position.set(0, groundFloorHeight / 2 + 0.5 + colHeight / 2 + 0.25, entZ);
        canopy.castShadow = true; canopy.receiveShadow = true;
        this.visual.add(canopy);

        const stepsGeo = new THREE.BoxGeometry(4, 0.5, 2);
        const steps = new THREE.Mesh(stepsGeo, sharedResources.materials.decor);
        steps.position.set(0, 0.25, entZ);
        steps.receiveShadow = true;
        this.visual.add(steps);

        // Door Frame
        const doorZ = depth / 2 + 0.25;
        const dFrameGeos = [];
        const dPostL = new THREE.BoxGeometry(0.2, 4, 0.4); dPostL.translate(-1.6, 2, 0); dFrameGeos.push(dPostL);
        const dPostR = new THREE.BoxGeometry(0.2, 4, 0.4); dPostR.translate(1.6, 2, 0); dFrameGeos.push(dPostR);
        const dHead = new THREE.BoxGeometry(3.4, 0.2, 0.4); dHead.translate(0, 4.1, 0); dFrameGeos.push(dHead);
        const dTransom = new THREE.BoxGeometry(3.4, 0.15, 0.4); dTransom.translate(0, 3.2, 0); dFrameGeos.push(dTransom);
        const mergedDoorFrame = mergeGeometries(dFrameGeos);
        const doorFrameMesh = new THREE.Mesh(mergedDoorFrame, sharedResources.materials.doorFrame);
        doorFrameMesh.position.set(0, 0, doorZ);
        doorFrameMesh.castShadow = true; doorFrameMesh.receiveShadow = true;
        this.visual.add(doorFrameMesh);

        // Transom Glass
        const transomGlass = new THREE.PlaneGeometry(3.2, 0.8);
        const tGlassMesh = new THREE.Mesh(transomGlass, sharedResources.materials.glass);
        tGlassMesh.position.set(0, 3.65, doorZ + 0.05);
        this.visual.add(tGlassMesh);
        const tGridGeo = new THREE.BoxGeometry(0.05, 0.8, 0.1);
        const tGridMesh = new THREE.Mesh(tGridGeo, sharedResources.materials.doorFrame);
        tGridMesh.position.set(0, 3.65, doorZ + 0.05);
        this.visual.add(tGridMesh);

        // Doors
        const leafWidth = 1.45; const leafHeight = 3.2;
        const createLeaf = (xPos, isRight) => {
            const grp = new THREE.Group();
            grp.position.set(xPos, 0, doorZ);

            const railGeos = [];
            const stileGeo = new THREE.BoxGeometry(0.15, leafHeight, 0.15);
            const sL = stileGeo.clone(); sL.translate(-leafWidth / 2 + 0.075, leafHeight / 2, 0); railGeos.push(sL);
            const sR = stileGeo.clone(); sR.translate(leafWidth / 2 - 0.075, leafHeight / 2, 0); railGeos.push(sR);
            const railGeo = new THREE.BoxGeometry(leafWidth, 0.15, 0.15);
            const rTop = railGeo.clone(); rTop.translate(0, leafHeight - 0.075, 0); railGeos.push(rTop);
            const rBot = railGeo.clone(); rBot.translate(0, 0.075, 0); railGeos.push(rBot);
            const rMid = railGeo.clone(); rMid.translate(0, 1.2, 0); railGeos.push(rMid);
            const leafFrame = new THREE.Mesh(mergeGeometries(railGeos), sharedResources.materials.doorFrame);
            grp.add(leafFrame);

            const panelGeo = new THREE.BoxGeometry(leafWidth - 0.3, 1.05, 0.05);
            const panel = new THREE.Mesh(panelGeo, sharedResources.materials.doorFrame);
            panel.position.set(0, 0.6, 0);
            grp.add(panel);

            const leafGlassGeo = new THREE.PlaneGeometry(leafWidth - 0.3, 1.85);
            const lGlass = new THREE.Mesh(leafGlassGeo, sharedResources.materials.glass);
            lGlass.position.set(0, 1.2 + 0.075 + 1.85 / 2, 0);
            grp.add(lGlass);

            const kickGeo = new THREE.PlaneGeometry(leafWidth - 0.05, 0.25);
            const kick = new THREE.Mesh(kickGeo, sharedResources.materials.brass);
            kick.position.set(0, 0.13, 0.08);
            grp.add(kick);

            const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
            const handle = new THREE.Mesh(handleGeo, sharedResources.materials.brass);
            const hX = isRight ? -leafWidth / 2 + 0.25 : leafWidth / 2 - 0.25;
            handle.position.set(hX, 1.6, 0.15);
            grp.add(handle);

            this.visual.add(grp);
        }
        createLeaf(-leafWidth / 2 - 0.02, false);
        createLeaf(leafWidth / 2 + 0.02, true);

        // Ent Railings
        const entRailGeo = new THREE.BoxGeometry(0.1, 1.5, 3);
        const railL = new THREE.Mesh(entRailGeo, sharedResources.materials.frame);
        railL.position.set(-2.2, 0.75, entZ);
        this.visual.add(railL);
        const railR = new THREE.Mesh(entRailGeo, sharedResources.materials.frame);
        railR.position.set(2.2, 0.75, entZ);
        this.visual.add(railR);

        // Floors Logic
        const colWidthCol = 0.6; const colDepthCol = 0.6;
        const numWindows = 3;
        const spacingX = (width * 0.95) / (numWindows + 1);

        for (let i = 0; i < numFloors; i++) {
            const y = groundFloorHeight + (i * floorHeight) + (floorHeight / 2);

            const mainWall = new THREE.Mesh(floorGeo, sharedResources.materials.wall);
            mainWall.position.y = y;
            mainWall.castShadow = true; mainWall.receiveShadow = true;
            this.visual.add(mainWall);

            // Columns
            const positions = [
                { x: width / 2 - colWidthCol / 2, z: depth / 2 - colDepthCol / 2 },
                { x: -width / 2 + colWidthCol / 2, z: depth / 2 - colDepthCol / 2 },
                { x: width / 2 - colWidthCol / 2, z: -depth / 2 + colDepthCol / 2 },
                { x: -width / 2 + colWidthCol / 2, z: -depth / 2 + colDepthCol / 2 }
            ];
            positions.forEach(pos => {
                tempObj.position.set(pos.x, y, pos.z);
                tempObj.rotation.set(0, 0, 0);
                tempObj.scale.set(1, 1, 1);
                tempObj.updateMatrix();
                colMesh.setMatrixAt(colIdx++, tempObj.matrix);
            });

            // Windows
            const addWindow = (px, py, pz, ry) => {
                // Shared materials, so randomization of tint is trickier.
                // We typically use instanceColor attribute for color variation.
                // For now, let's just make them all uniform or use setColorAt if using Color attribute.
                // Since our glassMat uses `color`, we can use `setColorAt`.
                const rTint = 1 + (Math.random() - 0.5) * 0.2;
                glassMesh.setColorAt(winIdx, new THREE.Color(0x111111).multiplyScalar(rTint));

                tempObj.position.set(px, py, pz);
                tempObj.rotation.set(0, ry, 0);
                tempObj.updateMatrix();

                frameMesh.setMatrixAt(winIdx, tempObj.matrix);
                decorMesh.setMatrixAt(winIdx, tempObj.matrix);
                glassMesh.setMatrixAt(winIdx, tempObj.matrix);
                winIdx++;
            };

            const winY = y - 0.35;
            const zOffset = (depth * 0.95) / 2 + 0.05;
            const xOffset = (width * 0.95) / 2 + 0.05;

            // Updated Rotation Logic (consistent with previous fix)
            for (let k = 1; k <= numWindows; k++) {
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, zOffset, 0);
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, -zOffset, Math.PI);
            }
            const spacingZ = (depth * 0.95) / (numWindows + 1);
            for (let k = 1; k <= numWindows; k++) {
                addWindow(xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, Math.PI / 2);
                addWindow(-xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, -Math.PI / 2);
            }

            // Balconies
            if (i % 2 !== 0 && i < numFloors - 1) {
                tempObj.position.set(0, y - floorHeight / 2, depth / 2 + 0.05);
                tempObj.rotation.set(0, 0, 0);
                tempObj.updateMatrix();
                balRailMesh.setMatrixAt(balIdx, tempObj.matrix);
                balStoneMesh.setMatrixAt(balIdx, tempObj.matrix);
                balIdx++;
            }

            // Fire Escape
            if (i < numFloors - 1) {
                const platY = y;
                const platX = -width / 2 - 1.0;
                const platZ = 0;
                tempObj.rotation.set(0, 0, 0);
                tempObj.position.set(platX, platY, platZ);
                tempObj.scale.set(1, 1, 1);
                tempObj.updateMatrix();
                fePlatMesh.setMatrixAt(feIdx, tempObj.matrix);

                // Stair
                tempObj.position.set(platX, platY, platZ + 1.5);
                if (i % 2 === 0) {
                    tempObj.position.set(platX, platY, 1.5);
                    tempObj.rotation.set(0, 0, 0);
                } else {
                    tempObj.position.set(platX, platY, -1.5);
                    tempObj.rotation.set(0, Math.PI, 0);
                }
                tempObj.updateMatrix();
                feStairMesh.setMatrixAt(feIdx, tempObj.matrix);
                feIdx++;
            }
        }

        fePlatMesh.count = feIdx;
        feStairMesh.count = feIdx;

        frameMesh.count = winIdx;
        decorMesh.count = winIdx;
        glassMesh.count = winIdx;
        colMesh.count = colIdx;
        balRailMesh.count = balIdx;
        balStoneMesh.count = balIdx;

        this.visual.add(frameMesh);
        this.visual.add(decorMesh);
        this.visual.add(glassMesh);
        this.visual.add(colMesh);
        this.visual.add(balRailMesh);
        this.visual.add(balStoneMesh);

        // Cornice
        const corniceGeo = new THREE.BoxGeometry(width + 1, 0.8, depth + 1);
        const cornice = new THREE.Mesh(corniceGeo, sharedResources.materials.cornice);
        cornice.position.set(0, roofY, 0);
        cornice.castShadow = true; cornice.receiveShadow = true;
        this.visual.add(cornice);

        // --- ROOFTOP DETAILS ---
        const rY = roofY + 0.4; // Base height for roof items (Cornice top)

        // 1. Parapet
        const parapet = new THREE.Mesh(sharedResources.geometries.parapet, sharedResources.materials.wall);
        parapet.position.set(0, rY, 0);
        parapet.castShadow = true; parapet.receiveShadow = true;
        this.visual.add(parapet);

        // 2. Roof Floor (Tar/Gravel)
        const roofFloorGeo = new THREE.PlaneGeometry(width - 0.6, depth - 0.6);
        const roofFloor = new THREE.Mesh(roofFloorGeo, sharedResources.materials.roofTar);
        roofFloor.rotation.x = -Math.PI / 2;
        roofFloor.position.set(0, rY + 0.05, 0); // Slightly above cornice
        roofFloor.receiveShadow = true;
        this.visual.add(roofFloor);

        // 3. Roof Access Shed
        const rAccess = new THREE.Mesh(sharedResources.geometries.roofAccess, sharedResources.materials.wall);
        rAccess.position.set(-3, rY, 3); // Back Left corner area
        rAccess.castShadow = true; rAccess.receiveShadow = true;
        this.visual.add(rAccess);

        // 4. Instanced Clutter (HVAC, Vents, Skylight)
        const clutterY = rY;

        // HVAC Units (1 or 2)
        const numHvac = 1 + Math.floor(Math.random() * 2);
        for (let h = 0; h < numHvac; h++) {
            const hvac = new THREE.Mesh(sharedResources.geometries.hvac, sharedResources.materials.metalIndustrial);
            let hX = (Math.random() - 0.5) * 6;
            let hZ = (Math.random() - 0.5) * 6;
            // Simple collision check (distance from access)
            if (Math.abs(hX + 3) < 2.5 && Math.abs(hZ - 3) < 2.5) hZ *= -1; // Avoid Access

            hvac.position.set(hX, clutterY, hZ);
            hvac.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
            hvac.castShadow = true; hvac.receiveShadow = true;
            this.visual.add(hvac);
        }

        // Vents (2-4)
        const numVents = 2 + Math.floor(Math.random() * 3);
        for (let v = 0; v < numVents; v++) {
            const vent = new THREE.Mesh(sharedResources.geometries.vent, sharedResources.materials.metalIndustrial);
            let vX = (Math.random() - 0.5) * 8;
            let vZ = (Math.random() - 0.5) * 8;
            vent.position.set(vX, clutterY, vZ);
            vent.castShadow = true; vent.receiveShadow = true;
            this.visual.add(vent);
        }

        // Skylight (Maybe)
        if (Math.random() > 0.3) {
            const skylight = new THREE.Mesh(sharedResources.geometries.skylight, sharedResources.materials.frame);
            skylight.material = sharedResources.materials.frame;
            let sX = (Math.random() - 0.5) * 4;
            let sZ = 0;
            if (Math.abs(sX) < 2) sZ = 3;
            skylight.position.set(sX, clutterY, sZ);
            skylight.castShadow = true; skylight.receiveShadow = true;
            this.visual.add(skylight);
        }



    }
}
