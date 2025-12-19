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

        const groundFloorHeight = 4.5;
        const groundGeo = new THREE.BoxGeometry(width, groundFloorHeight, depth);
        const groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1.0 }));
        groundMesh.position.y = groundFloorHeight / 2;
        groundMesh.receiveShadow = true;
        this.visual.add(groundMesh);

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

        // Entrance Door Frame (Simple)
        const doorFrameGeo = new THREE.BoxGeometry(3, 4, 0.5);
        const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
        doorFrame.position.set(0, 2, depth / 2 + 0.25);
        this.visual.add(doorFrame);

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

            const winY = y;
            const zOffset = (depth * 0.95) / 2 + 0.05;
            const xOffset = (width * 0.95) / 2 + 0.05;

            for (let k = 1; k <= numWindows; k++) {
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, zOffset, 0);
                addWindow(-(width * 0.95) / 2 + k * spacingX, winY, -zOffset, 0);
            }
            const spacingZ = (depth * 0.95) / (numWindows + 1);
            for (let k = 1; k <= numWindows; k++) {
                addWindow(xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, Math.PI / 2);
                addWindow(-xOffset, winY, -(depth * 0.95) / 2 + k * spacingZ, Math.PI / 2);
            }

            if (i % 2 !== 0 && i < numFloors - 1) {
                tempObj.position.set(0, y - floorHeight / 2, depth / 2 + 0.05);
                tempObj.rotation.set(0, 0, 0);
                tempObj.updateMatrix();

                balRailMesh.setMatrixAt(balIdx, tempObj.matrix);
                balStoneMesh.setMatrixAt(balIdx, tempObj.matrix);
                balIdx++;
            }

            if (i < numFloors - 1) {
                const stairGeo = new THREE.BoxGeometry(0.8, floorHeight * 1.3, 0.1);
                const stair = new THREE.Mesh(stairGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
                stair.position.set(-width / 2 - 0.8, y + floorHeight / 2, 0);
                stair.rotation.z = Math.PI / 5.5;
                if (i % 2 === 0) stair.rotation.z *= -1;
                stair.castShadow = true;
                this.visual.add(stair);

                const platGeo = new THREE.BoxGeometry(1.5, 0.1, 4);
                const plat = new THREE.Mesh(platGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
                plat.position.set(-width / 2 - 0.8, y, 0);
                plat.castShadow = true;
                this.visual.add(plat);
            }
        }

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

        const roofY = groundFloorHeight + (numFloors * floorHeight);
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
