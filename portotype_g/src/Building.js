import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export class Building {
    constructor() {
        this.visual = new THREE.Group();
        this.generateBuilding();
    }

    generateBuilding() {
        const width = 12;
        const depth = 12;
        const floorHeight = 3.5;
        const numFloors = 10;
        const groundFloorHeight = 4.5;
        const roofY = groundFloorHeight + (numFloors * floorHeight); // MOVED HERE FOR SCOPE VISIBILITY

        // ==========================================
        // 1. IMPROVED TEXTURE GENERATION
        // ==========================================
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
        texture.repeat.set(4, numFloors);
        texture.colorSpace = THREE.SRGBColorSpace;

        // Normal Map
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
        normalMap.repeat.set(4, numFloors);

        const wallMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(1.5, 1.5),
            roughness: 0.95,
            metalness: 0.0
        });

        const floorGeo = new THREE.BoxGeometry(width * 0.95, floorHeight, depth * 0.95);

        // ==========================================
        // 2. FANCY WINDOWS (Merged Geometry)
        // ==========================================
        const windowWidth = 1.4;
        const windowHeight = 2.0;
        const frameDepth = 0.2;
        const barThickness = 0.05;

        // A. COMPLEX FRAME 
        const frameGeometries = [];
        const topBar = new THREE.BoxGeometry(windowWidth, 0.1, frameDepth);
        topBar.translate(0, windowHeight / 2 - 0.05, 0);
        frameGeometries.push(topBar);
        const botBar = new THREE.BoxGeometry(windowWidth, 0.1, frameDepth);
        botBar.translate(0, -windowHeight / 2 + 0.05, 0);
        frameGeometries.push(botBar);
        const leftBar = new THREE.BoxGeometry(0.1, windowHeight - 0.2, frameDepth);
        leftBar.translate(-windowWidth / 2 + 0.05, 0, 0);
        frameGeometries.push(leftBar);
        const rightBar = new THREE.BoxGeometry(0.1, windowHeight - 0.2, frameDepth);
        rightBar.translate(windowWidth / 2 - 0.05, 0, 0);
        frameGeometries.push(rightBar);
        const vMuntin = new THREE.BoxGeometry(barThickness, windowHeight - 0.2, frameDepth / 2);
        vMuntin.translate(0, 0, 0);
        frameGeometries.push(vMuntin);
        const hMuntin = new THREE.BoxGeometry(windowWidth - 0.2, barThickness, frameDepth / 2);
        hMuntin.translate(0, 0.2, 0);
        frameGeometries.push(hMuntin);

        const mergedFrameGeo = mergeGeometries(frameGeometries);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 });

        // B. STONE DECOR 
        const decorGeometries = [];
        const lintelGeo = new THREE.BoxGeometry(windowWidth + 0.4, 0.35, 0.25);
        lintelGeo.translate(0, windowHeight / 2 + 0.175, 0.05);
        decorGeometries.push(lintelGeo);
        const keyGeo = new THREE.BoxGeometry(0.3, 0.45, 0.3);
        keyGeo.translate(0, windowHeight / 2 + 0.175, 0.08);
        decorGeometries.push(keyGeo);
        const sillGeo = new THREE.BoxGeometry(windowWidth + 0.2, 0.15, 0.3);
        sillGeo.translate(0, -windowHeight / 2 - 0.075, 0.1);
        decorGeometries.push(sillGeo);

        const mergedDecorGeo = mergeGeometries(decorGeometries);
        const decorMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.9, metalness: 0.0 });

        // C. GLASS (OPTIMIZED)
        const glassGeo = new THREE.PlaneGeometry(windowWidth - 0.2, windowHeight - 0.2);
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
        // CRITICAL FIX: Opaque glass for performance
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x111111, // Very dark grey
            metalness: 0.9,
            roughness: 0.1, // Shiny
            roughnessMap: glassRoughness,
            transparent: false, // OPAQUE = FAST
            opacity: 1.0,
            side: THREE.FrontSide
        });

        // ==========================================
        // 3. FANCY BALCONY 
        // ==========================================
        const balWidth = width * 0.5;
        const balDepth = 1.5;

        // A. WROUGHT IRON RAILING
        const railGeos = [];
        const handrailGeo = new THREE.BoxGeometry(balWidth + 0.1, 0.1, 0.1);
        handrailGeo.translate(0, 1.0, balDepth / 2);
        railGeos.push(handrailGeo);
        const sideRail1 = new THREE.BoxGeometry(0.1, 0.1, balDepth);
        sideRail1.translate(-balWidth / 2, 1.0, 0);
        railGeos.push(sideRail1);
        const sideRail2 = new THREE.BoxGeometry(0.1, 0.1, balDepth);
        sideRail2.translate(balWidth / 2, 1.0, 0);
        railGeos.push(sideRail2);
        const numPosts = 10;
        const postGap = balWidth / numPosts;
        for (let j = 0; j <= numPosts; j++) {
            const post = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
            const x = -balWidth / 2 + j * postGap;
            post.translate(x, 0.5, balDepth / 2);
            railGeos.push(post);
        }
        for (let j = 0; j < 3; j++) {
            const z = j * (balDepth / 3);
            const postL = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
            postL.translate(-balWidth / 2, 0.5, z);
            railGeos.push(postL);
            const postR = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
            postR.translate(balWidth / 2, 0.5, z);
            railGeos.push(postR);
        }
        const mergedRailGeo = mergeGeometries(railGeos);

        // B. STONE PLATFORM + CORBELS
        const stoneGeos = [];
        const platGeo = new THREE.BoxGeometry(balWidth, 0.2, balDepth);
        platGeo.translate(0, 0.1, 0);
        stoneGeos.push(platGeo);
        const numCorbels = 3;
        for (let j = 0; j < numCorbels; j++) {
            const x = -balWidth / 2 + 0.5 + j * ((balWidth - 1) / (numCorbels - 1));
            const cV = new THREE.BoxGeometry(0.3, 0.6, 0.8);
            cV.translate(x, -0.4, 0.2);
            stoneGeos.push(cV);
            const cS = new THREE.BoxGeometry(0.3, 0.3, 0.4);
            cS.translate(x, -0.8, 0);
            stoneGeos.push(cS);
        }
        const mergedBalStoneGeo = mergeGeometries(stoneGeos);

        // INSTANCED MESHES
        const maxCount = numFloors * 4 * 3 + 100;
        const frameMesh = new THREE.InstancedMesh(mergedFrameGeo, frameMat, maxCount);
        const decorMesh = new THREE.InstancedMesh(mergedDecorGeo, decorMat, maxCount);
        const glassMesh = new THREE.InstancedMesh(glassGeo, glassMat, maxCount);

        const balRailMesh = new THREE.InstancedMesh(mergedRailGeo, frameMat, 50);
        const balStoneMesh = new THREE.InstancedMesh(mergedBalStoneGeo, decorMat, 50);

        frameMesh.castShadow = true; frameMesh.receiveShadow = true;
        decorMesh.castShadow = true; decorMesh.receiveShadow = true;
        glassMesh.receiveShadow = true;
        balRailMesh.castShadow = true; balRailMesh.receiveShadow = true;
        balStoneMesh.castShadow = true; balStoneMesh.receiveShadow = true;

        const colWidth = 0.6;
        const colDepth = 0.6;
        const colGeo = new THREE.BoxGeometry(colWidth, floorHeight, colDepth);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1.0 });
        const colMaxCount = numFloors * 4 + 40;
        const colMesh = new THREE.InstancedMesh(colGeo, colMat, colMaxCount);
        colMesh.castShadow = true; colMesh.receiveShadow = true;

        let winIdx = 0;
        let colIdx = 0;
        let balIdx = 0;
        const tempObj = new THREE.Object3D();

        // ==========================================
        // 7. FANCY FIRE ESCAPE (Instanced)
        // ==========================================
        const feMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, // Dark Iron
            roughness: 0.7,
            metalness: 0.6
        });

        // A. FIRE ESCAPE PLATFORM (1.5m wide x 4m long)
        const fePlatGeos = [];
        // Frame
        const pFrameW = new THREE.BoxGeometry(1.5, 0.1, 0.1);
        pFrameW.translate(0, 0, 2); fePlatGeos.push(pFrameW.clone());
        pFrameW.translate(0, 0, -4); fePlatGeos.push(pFrameW); // Front/Back? No, translate relative.
        // Actually, let's build relative to center.
        // Side Channels (4m long)
        const pChan = new THREE.BoxGeometry(0.1, 0.15, 4);
        pChan.translate(-0.75, 0, 0); fePlatGeos.push(pChan.clone());
        pChan.translate(1.5, 0, 0); fePlatGeos.push(pChan);
        // End Channels (1.3m wide)
        const pEnd = new THREE.BoxGeometry(1.3, 0.15, 0.1);
        pEnd.translate(0, 0, 1.95); fePlatGeos.push(pEnd.clone());
        pEnd.translate(0, 0, -3.9); fePlatGeos.push(pEnd); // Length is 4m? +/- 2m.

        // Grating (Simulated with bars)
        const pBar = new THREE.BoxGeometry(1.4, 0.02, 0.05);
        for (let k = 0; k < 20; k++) {
            const bar = pBar.clone();
            bar.translate(0, 0.05, -1.9 + k * 0.2);
            fePlatGeos.push(bar);
        }

        // Railings (1m high)
        const rPost = new THREE.BoxGeometry(0.05, 1.0, 0.05);
        for (let k = 0; k <= 4; k++) { // 5 posts along length
            const post = rPost.clone();
            post.translate(-0.75, 0.5, -1.9 + k * 0.95);
            fePlatGeos.push(post);
        }
        // Top Rail
        const rTop = new THREE.BoxGeometry(0.05, 0.05, 4);
        rTop.translate(-0.75, 1.0, 0);
        fePlatGeos.push(rTop);
        // Mid Rail
        const rMid = new THREE.BoxGeometry(0.05, 0.05, 4);
        rMid.translate(-0.75, 0.5, 0);
        fePlatGeos.push(rMid);

        // End Railings (Short side)
        const rEndTop = new THREE.BoxGeometry(1.5, 0.05, 0.05);
        rEndTop.translate(0, 1.0, 1.95); fePlatGeos.push(rEndTop.clone()); // Front
        rEndTop.translate(0, 1.0, -1.95); fePlatGeos.push(rEndTop); // Back

        const mergedFePlat = mergeGeometries(fePlatGeos);
        const fePlatMesh = new THREE.InstancedMesh(mergedFePlat, feMat, numFloors);
        fePlatMesh.castShadow = true; fePlatMesh.receiveShadow = true;
        this.visual.add(fePlatMesh);

        // B. FIRE ESCAPE STAIRS (Zig Zag)
        // Floor height is 3.5m. Stair covers that height.
        // Length 3m? Angle ~45 deg.
        const feStairGeos = [];
        const sLen = 3.5; // Horizontal run
        const sHeight = 3.5; // Vertical rise
        const sHyp = Math.sqrt(sLen * sLen + sHeight * sHeight);
        const sAngle = Math.atan2(sHeight, sLen);

        // Stringers
        const stringer = new THREE.BoxGeometry(0.1, 0.2, sHyp);
        const strL = stringer.clone();
        strL.translate(-0.4, sHeight / 2, 0); // Center relative
        strL.rotateX(-sAngle); // Rotate to pitch
        // Need to anchor at bottom?
        // Let's model flat and rotate instance? easier.
        // Model a straight stair 4m long, 3.5m high.

        const numSteps = 14;
        const stepRise = sHeight / numSteps;
        const stepRun = sLen / numSteps; // ~0.25m

        for (let s = 0; s < numSteps; s++) {
            const step = new THREE.BoxGeometry(0.8, 0.05, 0.25);
            // Position: Going UP and BACK.
            // x=0. y = s*rise. z = s*run.
            step.translate(0, s * stepRise, -s * stepRun);
            feStairGeos.push(step);
        }
        // Stringers (Diagonal box)
        const strGeo = new THREE.BoxGeometry(0.1, 0.15, sHyp + 0.5);
        const sL2 = strGeo.clone();
        sL2.rotateX(sAngle); // Picth up
        sL2.translate(-0.45, sHeight / 2, -sLen / 2);
        feStairGeos.push(sL2);
        const sR2 = strGeo.clone();
        sR2.rotateX(sAngle);
        sR2.translate(0.45, sHeight / 2, -sLen / 2);
        feStairGeos.push(sR2);

        // Handrail
        const hrGeo = new THREE.BoxGeometry(0.05, 0.05, sHyp + 0.5);
        const hrL = hrGeo.clone();
        hrL.rotateX(sAngle);
        hrL.translate(-0.45, sHeight / 2 + 0.9, -sLen / 2); // +0.9m height
        feStairGeos.push(hrL);
        // Posts for handrail
        for (let k = 0; k < 3; k++) {
            const hPost = new THREE.BoxGeometry(0.04, 0.9, 0.04);
            // Interpolate pos
            const t = k / 2;
            const py = t * sHeight;
            const pz = -t * sLen;
            hPost.translate(-0.45, py + 0.45, pz);
            feStairGeos.push(hPost);
        }

        const mergedFeStair = mergeGeometries(feStairGeos);
        const feStairMesh = new THREE.InstancedMesh(mergedFeStair, feMat, numFloors);
        feStairMesh.castShadow = true; feStairMesh.receiveShadow = true;
        this.visual.add(feStairMesh);

        let feIdx = 0;

        // --- A. GROUND FLOOR RUSTICATION TEXTURE ---
        const stoneCanvas = document.createElement('canvas');
        stoneCanvas.width = 512; stoneCanvas.height = 512;
        const sCtx = stoneCanvas.getContext('2d');

        // Base Stone
        sCtx.fillStyle = '#55504d'; // Dark Grey Stone
        sCtx.fillRect(0, 0, 512, 512);

        // Blocks (Large, Rusticated)
        const sBlockH = 64;
        const sBlockW = 128;
        const sGap = 4;

        for (let y = 0; y < 512; y += sBlockH) {
            const rowOff = (y / sBlockH) % 2 === 0 ? 0 : sBlockW / 2;
            for (let x = -sBlockW; x < 512; x += sBlockW) {
                // Block Face (Lighter center)
                const bHue = 30 + Math.random() * 5;
                const bLit = 35 + Math.random() * 10;
                sCtx.fillStyle = `hsl(${bHue}, 10%, ${bLit}%)`;
                sCtx.fillRect(x + rowOff, y, sBlockW - sGap, sBlockH - sGap);

                // Deep Groove Highlight
                sCtx.fillStyle = 'rgba(0,0,0,0.5)';
                sCtx.fillRect(x + rowOff, y, sBlockW - sGap, 2); // Top Shadow
                sCtx.fillRect(x + rowOff, y, 2, sBlockH - sGap); // Left Shadow
            }
        }
        // Noise
        for (let i = 0; i < 10000; i++) {
            sCtx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.2})`;
            sCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        const stoneTex = new THREE.CanvasTexture(stoneCanvas);
        stoneTex.wrapS = THREE.RepeatWrapping;
        stoneTex.wrapT = THREE.RepeatWrapping;
        stoneTex.repeat.set(4, 2);
        stoneTex.colorSpace = THREE.SRGBColorSpace;

        const stoneMat = new THREE.MeshStandardMaterial({
            map: stoneTex,
            roughness: 0.9,
            bumpMap: stoneTex,
            bumpScale: 0.05
        });

        // REPLACEMENT GROUND MESH
        const groundGeo = new THREE.BoxGeometry(width + 0.2, groundFloorHeight, depth + 0.2); // Slightly wider for base feel
        const groundMesh = new THREE.Mesh(groundGeo, stoneMat);
        groundMesh.position.y = groundFloorHeight / 2;
        groundMesh.receiveShadow = true;
        this.visual.add(groundMesh);

        // --- B. BELT COURSE (Separation) ---
        const beltGeo = new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4);
        const belt = new THREE.Mesh(beltGeo, decorMat);
        belt.position.set(0, groundFloorHeight, 0); // Top of ground floor
        belt.castShadow = true; belt.receiveShadow = true;
        this.visual.add(belt);

        // --- C. CORNER QUOINS (Instanced) ---
        // Alternating blocks: Large (Long) and Small (Short)
        const qLargeGeo = new THREE.BoxGeometry(0.5, 0.6, 1.0); // Long on Z
        const qSmallGeo = new THREE.BoxGeometry(0.5, 0.6, 0.6); // Square-ish

        const quoinMat = decorMat;
        const qMesh = new THREE.InstancedMesh(qLargeGeo, quoinMat, 200); // Re-use one geo or... 
        // Actually, classic Quoins alternate orientation. 
        // Let's make a merged "Quoin Unit" (2 blocks high) to simplify? 
        // Or just place 2 different meshes.
        // Let's use 1 Mesh and scale/rotate it. A specific block shape.

        // Quoin Block Geometry
        const qBlock = new THREE.BoxGeometry(0.6, 0.5, 0.3); // 0.3 depth, 0.6 width, 0.5 height
        // We need them to wrap around the corner.
        // Usually it's "Long-Short" pattern on one face, and "Short-Long" on the other.
        // Implementation: Just put blocks on the corners.

        const qCount = numFloors * 40; // Increased buffer: ~64 blocks/col * 4 cols = ~256. 400 is safe.
        const quoinInst = new THREE.InstancedMesh(qBlock, decorMat, qCount);
        quoinInst.castShadow = true; quoinInst.receiveShadow = true;

        let qIdx = 0;

        const placeQuoinColumn = (cX, cZ, rotY) => {
            // Go up the building
            const startY = groundFloorHeight + 0.25;
            const endY = roofY;
            let toggle = false;
            for (let h = startY; h < endY; h += 0.55) { // 0.5 height + gap
                toggle = !toggle;

                // Wrapper 1 (One side of corner)
                const qLen1 = toggle ? 0.8 : 0.4;
                tempObj.scale.set(qLen1 / 0.6, 1, 1);
                // Center position: Corner is at +/- width/2. 
                // If cX is positive, we are at right. Block should stick out leftwards? No, flush with corner.

                // Let's try a simpler procedural placement:
                // Block A: Face X. Block B: Face Z.

                if (toggle) {
                    // Block 1: Long along X (Face X)
                    tempObj.rotation.set(0, 0, 0);
                    tempObj.scale.set(1.5, 1, 1); // 0.9m long (X), 0.6m wide (unscaled), 0.3m depth (Z)
                    // Geo is 0.6 width, 0.5 height, 0.3 depth.
                    // Scaled X by 1.5 -> 0.9 width.
                    // We want it flush with the corner at cX.
                    // So center X = cX - sign(cX) * (0.9/2)
                    tempObj.position.set(cX - (cX > 0 ? 0.45 : -0.45), h, cZ);
                } else {
                    // Block 2: Long along Z (Face Z)
                    tempObj.rotation.set(0, Math.PI / 2, 0);
                    tempObj.scale.set(1.5, 1, 1); // 0.9m long (Z because rotated), 0.3m depth (X)
                    // We want it flush with the corner at cZ.
                    // So center Z = cZ - sign(cZ) * (0.9/2)
                    tempObj.position.set(cX, h, cZ - (cZ > 0 ? 0.45 : -0.45));
                }

                tempObj.updateMatrix();
                quoinInst.setMatrixAt(qIdx++, tempObj.matrix);
            }
        };

        const w2 = (width * 0.95) / 2;
        const d2 = (depth * 0.95) / 2;

        placeQuoinColumn(-w2, -d2, 0); // Back Left
        placeQuoinColumn(w2, -d2, 0);  // Back Right
        placeQuoinColumn(-w2, d2, 0);  // Front Left
        placeQuoinColumn(w2, d2, 0);   // Front Right

        quoinInst.count = qIdx;
        this.visual.add(quoinInst);

        // ==========================================
        // 4. GRAND ENTRANCE (Geometry)
        // ==========================================
        const entZ = depth / 2 + 1.0;
        // Stone Portico
        // Columns
        const colHeight = 3.5;
        const entColGeo = new THREE.CylinderGeometry(0.4, 0.4, colHeight, 16);
        const col1 = new THREE.Mesh(entColGeo, decorMat);
        col1.position.set(-2, groundFloorHeight / 2 + 0.5, entZ);
        col1.castShadow = true; col1.receiveShadow = true;
        this.visual.add(col1);

        const col2 = new THREE.Mesh(entColGeo, decorMat);
        col2.position.set(2, groundFloorHeight / 2 + 0.5, entZ);
        col2.castShadow = true; col2.receiveShadow = true;
        this.visual.add(col2);

        // Canopy (Stone)
        const canGeo = new THREE.BoxGeometry(5.5, 0.5, 2.5);
        const canopy = new THREE.Mesh(canGeo, decorMat);
        canopy.position.set(0, groundFloorHeight / 2 + 0.5 + colHeight / 2 + 0.25, entZ);
        canopy.castShadow = true; canopy.receiveShadow = true;
        this.visual.add(canopy);

        // Stairs
        const stepsGeo = new THREE.BoxGeometry(4, 0.5, 2);
        const steps = new THREE.Mesh(stepsGeo, decorMat);
        steps.position.set(0, 0.25, entZ);
        steps.receiveShadow = true;
        this.visual.add(steps);

        // ==========================================
        // 5. DETAILED ENTRANCE DOOR
        // ==========================================

        // Materials
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 1.0,
            roughness: 0.2
        });

        const doorFrameMat = new THREE.MeshStandardMaterial({
            color: 0x0f0f0f, // Almost black
            roughness: 0.8
        });

        const doorZ = depth / 2 + 0.25;

        // --- A. MAIN FRAME ---
        const dFrameGeos = [];
        // Side Posts
        const dPostL = new THREE.BoxGeometry(0.2, 4, 0.4);
        dPostL.translate(-1.6, 2, 0);
        dFrameGeos.push(dPostL);
        const dPostR = new THREE.BoxGeometry(0.2, 4, 0.4);
        dPostR.translate(1.6, 2, 0);
        dFrameGeos.push(dPostR);
        // Top Header
        const dHead = new THREE.BoxGeometry(3.4, 0.2, 0.4);
        dHead.translate(0, 4.1, 0);
        dFrameGeos.push(dHead);
        // Transom Bar (Horizontal divider)
        const dTransom = new THREE.BoxGeometry(3.4, 0.15, 0.4);
        dTransom.translate(0, 3.2, 0); // @ 3.2m height
        dFrameGeos.push(dTransom);

        const mergedDoorFrame = mergeGeometries(dFrameGeos);
        const doorFrameMesh = new THREE.Mesh(mergedDoorFrame, doorFrameMat);
        doorFrameMesh.position.set(0, 0, doorZ);
        doorFrameMesh.castShadow = true; doorFrameMesh.receiveShadow = true;
        this.visual.add(doorFrameMesh);

        // --- B. TRANSOM WINDOW (Above) ---
        const transomGlass = new THREE.PlaneGeometry(3.2, 0.8);
        const tGlassMesh = new THREE.Mesh(transomGlass, glassMat);
        tGlassMesh.position.set(0, 3.65, doorZ + 0.05);
        this.visual.add(tGlassMesh);
        // Grid for Transom
        const tGridGeo = new THREE.BoxGeometry(0.05, 0.8, 0.1);
        const tGridMesh = new THREE.Mesh(tGridGeo, doorFrameMat);
        tGridMesh.position.set(0, 3.65, doorZ + 0.05);
        this.visual.add(tGridMesh);

        // --- C. DOUBLE DOORS ---
        const leafWidth = 1.45;
        const leafHeight = 3.2;

        // Helper to create one leaf
        const createLeaf = (xPos, isRight) => {
            const grp = new THREE.Group();
            grp.position.set(xPos, 0, doorZ);

            // 1. Stile & Rail Structure (Frame of the door leaf)
            const railGeos = [];
            // Stiles (Sides)
            const stileGeo = new THREE.BoxGeometry(0.15, leafHeight, 0.15);
            const sL = stileGeo.clone(); sL.translate(-leafWidth / 2 + 0.075, leafHeight / 2, 0);
            const sR = stileGeo.clone(); sR.translate(leafWidth / 2 - 0.075, leafHeight / 2, 0);
            railGeos.push(sL, sR);
            // Rails (Top/Bot/Mid)
            const railGeo = new THREE.BoxGeometry(leafWidth, 0.15, 0.15);
            const rTop = railGeo.clone(); rTop.translate(0, leafHeight - 0.075, 0);
            const rBot = railGeo.clone(); rBot.translate(0, 0.075, 0);
            const rMid = railGeo.clone(); rMid.translate(0, 1.2, 0); // Divider
            railGeos.push(rTop, rBot, rMid);

            const leafFrame = new THREE.Mesh(mergeGeometries(railGeos), doorFrameMat);
            grp.add(leafFrame);

            // 2. Bottom Panel (Recessed)
            const panelGeo = new THREE.BoxGeometry(leafWidth - 0.3, 1.05, 0.05);
            const panel = new THREE.Mesh(panelGeo, doorFrameMat);
            panel.position.set(0, 0.6, 0);
            grp.add(panel);

            // 3. Top Glass
            const leafGlassGeo = new THREE.PlaneGeometry(leafWidth - 0.3, 1.85);
            const lGlass = new THREE.Mesh(leafGlassGeo, glassMat);
            lGlass.position.set(0, 1.2 + 0.075 + 1.85 / 2, 0);
            grp.add(lGlass);

            // 4. Brass Kickplate
            const kickGeo = new THREE.PlaneGeometry(leafWidth - 0.05, 0.25);
            const kick = new THREE.Mesh(kickGeo, brassMat);
            kick.position.set(0, 0.13, 0.08); // Slightly front
            grp.add(kick);

            // 5. Brass Handle
            const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
            const handle = new THREE.Mesh(handleGeo, brassMat);
            const hX = isRight ? -leafWidth / 2 + 0.25 : leafWidth / 2 - 0.25;
            handle.position.set(hX, 1.6, 0.15);
            grp.add(handle);
            // Handle brackets
            const brackGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
            const brackTop = new THREE.Mesh(brackGeo, brassMat);
            brackTop.rotation.x = Math.PI / 2;
            brackTop.position.set(hX, 1.8, 0.1);
            grp.add(brackTop);
            const brackBot = brackTop.clone();
            brackBot.position.set(hX, 1.4, 0.1);
            grp.add(brackBot);

            this.visual.add(grp);
        };

        createLeaf(-leafWidth / 2 - 0.02, false); // Left Door
        createLeaf(leafWidth / 2 + 0.02, true);  // Right Door

        // Entrance Railings (Iron)
        const entRailGeo = new THREE.BoxGeometry(0.1, 1.5, 3); // Simple side rails
        const railL = new THREE.Mesh(entRailGeo, frameMat);
        railL.position.set(-2.2, 0.75, entZ);
        this.visual.add(railL);
        const railR = new THREE.Mesh(entRailGeo, frameMat);
        railR.position.set(2.2, 0.75, entZ);
        this.visual.add(railR);


        for (let i = 0; i < numFloors; i++) {
            const y = groundFloorHeight + (i * floorHeight) + (floorHeight / 2);
            const mainWall = new THREE.Mesh(floorGeo, wallMaterial);
            mainWall.position.y = y;
            mainWall.castShadow = true; mainWall.receiveShadow = true;
            this.visual.add(mainWall);

            const positions = [
                { x: width / 2 - colWidth / 2, z: depth / 2 - colDepth / 2 },
                { x: -width / 2 + colWidth / 2, z: depth / 2 - colDepth / 2 },
                { x: width / 2 - colWidth / 2, z: -depth / 2 + colDepth / 2 },
                { x: -width / 2 + colWidth / 2, z: -depth / 2 + colDepth / 2 }
            ];
            positions.forEach(pos => {
                tempObj.position.set(pos.x, y, pos.z);
                tempObj.rotation.set(0, 0, 0);
                tempObj.scale.set(1, 1, 1);
                tempObj.updateMatrix();
                colMesh.setMatrixAt(colIdx++, tempObj.matrix);
            });

            const numWindows = 3;
            const spacingX = (width * 0.95) / (numWindows + 1);

            const addWindow = (px, py, pz, ry) => {
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

            const winY = y - 0.35; // Lowered to increase gap with balcony above
            const zOffset = (depth * 0.95) / 2 + 0.05;
            const xOffset = (width * 0.95) / 2 + 0.05;

            for (let k = 1; k <= numWindows; k++) {
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, zOffset, 0);
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, -zOffset, Math.PI);
            }
            const spacingZ = (depth * 0.95) / (numWindows + 1);
            for (let k = 1; k <= numWindows; k++) {
                addWindow(xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, Math.PI / 2);
                addWindow(-xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, -Math.PI / 2);
            }

            if (i % 2 !== 0 && i < numFloors - 1) {
                tempObj.position.set(0, y - floorHeight / 2, depth / 2 + 0.05);
                tempObj.rotation.set(0, 0, 0);
                tempObj.updateMatrix();

                balRailMesh.setMatrixAt(balIdx, tempObj.matrix);
                balStoneMesh.setMatrixAt(balIdx, tempObj.matrix);
                balIdx++;
            }

            if (i < numFloors - 1) { // Fire Escape
                // Platform
                const platY = y;
                const platX = -width / 2 - 1.0; // Left side of building
                const platZ = 0;

                tempObj.rotation.set(0, 0, 0);
                tempObj.position.set(platX, platY, platZ);
                tempObj.scale.set(1, 1, 1);
                tempObj.updateMatrix();
                fePlatMesh.setMatrixAt(feIdx, tempObj.matrix);

                // Stair (Connecting this floor to next)
                // Zig Zag: Even floors go South-North, Odd floors go North-South?
                // Our stair geometry goes Up and Back (-Z).

                tempObj.position.set(platX, platY, platZ + 1.5); // Start at front of platform?

                if (i % 2 === 0) {
                    // Go Back (-Z)
                    tempObj.position.set(platX, platY, 1.5);
                    tempObj.rotation.set(0, 0, 0);
                } else {
                    // Go Forward (+Z)
                    // Rotate 180
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


        const corniceGeo = new THREE.BoxGeometry(width + 1, 0.8, depth + 1);
        const corniceMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const cornice = new THREE.Mesh(corniceGeo, corniceMat);
        cornice.position.set(0, roofY, 0);
        cornice.castShadow = true; cornice.receiveShadow = true;
        this.visual.add(cornice);

        const tankRadius = 2.0;
        const tankHeight = 3.0;
        const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 12);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(2, roofY + 3 + tankHeight / 2, -2);
        tank.castShadow = true; tank.receiveShadow = true;
        this.visual.add(tank);

        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const legPositions = [
            { x: 2 + tankRadius * 0.7, z: -2 + tankRadius * 0.7 },
            { x: 2 - tankRadius * 0.7, z: -2 + tankRadius * 0.7 },
            { x: 2 + tankRadius * 0.7, z: -2 - tankRadius * 0.7 },
            { x: 2 - tankRadius * 0.7, z: -2 - tankRadius * 0.7 }
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos.x, roofY + 1.5, pos.z);
            this.visual.add(leg);
        });
    }
}
