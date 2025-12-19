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

    // 1. High-Quality Limestone
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 1024; stoneCanvas.height = 1024;
    const sCtx = stoneCanvas.getContext('2d');

    // Warm beige base
    sCtx.fillStyle = '#e6dabb';
    sCtx.fillRect(0, 0, 1024, 1024);

    // Detailed Noise
    for (let i = 0; i < 200000; i++) {
        const val = Math.random();
        sCtx.fillStyle = val > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(80,60,40,0.05)';
        sCtx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Vertical weathering stains
    sCtx.globalAlpha = 0.05;
    sCtx.fillStyle = '#332211';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1024;
        const w = 5 + Math.random() * 20;
        sCtx.fillRect(x, 0, w, 1024);
    }
    sCtx.globalAlpha = 1.0;

    // Running bond block pattern
    sCtx.strokeStyle = 'rgba(60,50,40,0.15)';
    sCtx.lineWidth = 2;
    const bh = 40; // block height
    const bw = 80; // block width

    for (let y = 0; y <= 1024; y += bh) {
        sCtx.beginPath();
        sCtx.moveTo(0, y); sCtx.lineTo(1024, y);
        sCtx.stroke();

        const offset = (y / bh) % 2 === 0 ? 0 : bw / 2;
        for (let x = offset; x < 1024; x += bw) {
            sCtx.beginPath();
            sCtx.moveTo(x, y); sCtx.lineTo(x, y + bh);
            sCtx.stroke();
        }
    }

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.colorSpace = THREE.SRGBColorSpace;
    stoneTex.anisotropy = 4;

    sharedResources.materials.limestone = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.8,
        metalness: 0.0,
        bumpMap: stoneTex,
        bumpScale: 0.05
    });

    // 2. Oxidized Bronze
    sharedResources.materials.bronze = new THREE.MeshStandardMaterial({
        color: 0x3d3226,
        roughness: 0.4,
        metalness: 0.6
    });

    // 3. Polished Gold/Steel (Art Deco Metal)
    sharedResources.materials.decoMetal = new THREE.MeshStandardMaterial({
        color: 0xffeebb,
        roughness: 0.2,
        metalness: 1.0,
        emissive: 0xaa8844,
        emissiveIntensity: 0.1
    });

    // 4. Windows (Lit/Unlit)
    sharedResources.materials.windowLit = new THREE.MeshStandardMaterial({
        color: 0xffebcc, emissive: 0xffebcc, emissiveIntensity: 2.5, roughness: 0.2
    });
    sharedResources.materials.windowDark = new THREE.MeshStandardMaterial({
        color: 0x050a10, roughness: 0.1, metalness: 0.9
    });

    // 5. Clear Glass (For Revolving Door)
    sharedResources.materials.glassClear = new THREE.MeshStandardMaterial({
        color: 0xaaccff,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    // --- GEOMETRIES ---
    sharedResources.geometries.winGlass = new THREE.PlaneGeometry(0.8, 1.8);
    sharedResources.geometries.fin = new THREE.BoxGeometry(0.25, 1.0, 0.6);

    sharedResources.loaded = true;
}

export class NYArtDecoTower {
    constructor() {
        initSharedResources();
        this.visual = new THREE.Group();
        this.lights = [];
        this.generateBuilding();
    }

    createCruciformPrism(width, height, wingProtrusion, material) {
        const group = new THREE.Group();

        // 1. Central Core
        const coreGeo = new THREE.BoxGeometry(width, height, width);
        const core = new THREE.Mesh(coreGeo, material);
        core.castShadow = true; core.receiveShadow = true;
        group.add(core);

        if (wingProtrusion > 0.01) {
            const wingWidth = width * 0.6;

            // 2. Wings (X-axis)
            const wingXGeo = new THREE.BoxGeometry(width + wingProtrusion * 2, height, wingWidth);
            const wingX = new THREE.Mesh(wingXGeo, material);
            wingX.castShadow = true; wingX.receiveShadow = true;
            group.add(wingX);

            // 3. Wings (Z-axis)
            const wingZGeo = new THREE.BoxGeometry(wingWidth, height, width + wingProtrusion * 2);
            const wingZ = new THREE.Mesh(wingZGeo, material);
            wingZ.castShadow = true; wingZ.receiveShadow = true;
            group.add(wingZ);
        }

        return group;
    }

    addFloodlight(x, y, z, intensity = 15, distance = 40) {
        const spot = new THREE.SpotLight(0xffaa55, intensity, distance, Math.PI / 4, 0.5, 1);
        spot.position.set(x, y, z);
        spot.target.position.set(x, y + 20, z); // Point UP
        this.visual.add(spot);
        this.visual.add(spot.target);

        const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), sharedResources.materials.bronze);
        fixture.position.set(x, y, z);
        this.visual.add(fixture);

        this.lights.push(spot);
    }

    generateBuilding() {
        // Dimensions
        const baseW = 16;
        const baseH = 14;

        const midW = 11;
        const midH = 80;

        const topW = 7;
        const topH = 25;

        // --- 1. THE BASE (Podium) ---
        // Solid grounding
        const podium = this.createCruciformPrism(baseW, baseH, 1.0, sharedResources.materials.limestone);
        podium.position.y = baseH / 2;
        this.visual.add(podium);

        // --- GRAND ENTRANCE (IMPROVED) ---
        const entZ = baseW / 2 + 1.0; // The face of the protrusion

        // 1. Vestibule Frame (Bronze Box Frame)
        const frameW = 6.0;
        const frameH = 5.0;
        const frameD = 1.0;

        const vFrameGroup = new THREE.Group();
        vFrameGroup.position.set(0, 0, entZ);

        const topBar = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.5, frameD), sharedResources.materials.bronze);
        topBar.position.set(0, frameH - 0.25, frameD / 2);
        vFrameGroup.add(topBar);

        const sideBarGeo = new THREE.BoxGeometry(0.5, frameH, frameD);
        const leftBar = new THREE.Mesh(sideBarGeo, sharedResources.materials.bronze);
        leftBar.position.set(-frameW / 2 + 0.25, frameH / 2, frameD / 2);
        vFrameGroup.add(leftBar);

        const rightBar = new THREE.Mesh(sideBarGeo, sharedResources.materials.bronze);
        rightBar.position.set(frameW / 2 - 0.25, frameH / 2, frameD / 2);
        vFrameGroup.add(rightBar);

        // Backing (The "Interior" Dark Void)
        const voidGeo = new THREE.PlaneGeometry(frameW - 1, frameH - 0.5);
        const voidMesh = new THREE.Mesh(voidGeo, sharedResources.materials.windowDark);
        voidMesh.position.set(0, frameH / 2, 0.05); // Just in front of stone
        vFrameGroup.add(voidMesh);

        this.visual.add(vFrameGroup);

        // 2. Revolving Door
        const revGroup = new THREE.Group();
        revGroup.position.set(0, 0, entZ + 1.2);

        // Cylinder Glass Shell
        const revH = 3.5;
        const revR = 1.6;
        const shellGeo = new THREE.CylinderGeometry(revR, revR, revH, 32, 1, true);
        const shell = new THREE.Mesh(shellGeo, sharedResources.materials.glassClear);
        shell.position.y = revH / 2;
        revGroup.add(shell);

        // Metal Cap
        const capGeo = new THREE.CylinderGeometry(revR + 0.1, revR + 0.1, 0.2, 32);
        const rTop = new THREE.Mesh(capGeo, sharedResources.materials.decoMetal);
        rTop.position.y = revH;
        revGroup.add(rTop);

        // Rotating Fins (The Door Itself)
        const finGroup = new THREE.Group();
        finGroup.position.y = revH / 2;

        const doorFinGeo = new THREE.BoxGeometry(revR * 1.8, revH - 0.2, 0.1);
        const f1 = new THREE.Mesh(doorFinGeo, sharedResources.materials.bronze);
        finGroup.add(f1);
        const f2 = f1.clone();
        f2.rotation.y = Math.PI / 2;
        finGroup.add(f2);

        // Rotate the door slightly to look "in use"
        finGroup.rotation.y = Math.PI / 4;
        revGroup.add(finGroup);

        this.visual.add(revGroup);

        // 3. New Canopy
        const canopyGeo = new THREE.BoxGeometry(6, 0.2, 4);
        const canopy = new THREE.Mesh(canopyGeo, sharedResources.materials.bronze);
        canopy.position.set(0, frameH + 0.2, entZ + 2.0);
        this.visual.add(canopy);

        // 4. Sconces (Flanking Lights)
        const sX = frameW / 2 + 1.0;
        const sY = frameH * 0.6;

        const sconceGeo = new THREE.CylinderGeometry(0.0, 0.3, 0.8, 8);
        const sconceL = new THREE.Mesh(sconceGeo, sharedResources.materials.decoMetal);
        sconceL.position.set(-sX, sY, entZ + 0.2);
        sconceL.rotation.x = -0.2; // Tilt up
        this.visual.add(sconceL);

        const slLight = new THREE.PointLight(0xffaa00, 5, 5);
        slLight.position.set(0, 0.2, 0.2);
        sconceL.add(slLight);

        const sconceR = sconceL.clone();
        sconceR.position.set(sX, sY, entZ + 0.2);
        this.visual.add(sconceR);


        // --- 2. THE SHAFT (Tower) ---
        const shaftY = baseH + midH / 2;
        const shaft = this.createCruciformPrism(midW, midH, 1.5, sharedResources.materials.limestone);
        shaft.position.y = shaftY;
        this.visual.add(shaft);

        // Floodlights
        const lightOffset = baseW * 0.4;
        this.addFloodlight(lightOffset, baseH, lightOffset);
        this.addFloodlight(-lightOffset, baseH, lightOffset);
        this.addFloodlight(lightOffset, baseH, -lightOffset);
        this.addFloodlight(-lightOffset, baseH, -lightOffset);

        // INSTANCED WINDOWS
        const winLitMesh = new THREE.InstancedMesh(sharedResources.geometries.winGlass, sharedResources.materials.windowLit, 3000);
        const winDarkMesh = new THREE.InstancedMesh(sharedResources.geometries.winGlass, sharedResources.materials.windowDark, 3000);
        const dummy = new THREE.Object3D();
        let litCount = 0, darkCount = 0;

        const fillWindowColumn = (x, z, faceRotY) => {
            for (let y = baseH + 2; y < baseH + midH - 2; y += 3) {
                dummy.position.set(x, y, z);
                dummy.rotation.set(0, faceRotY, 0);
                dummy.updateMatrix();
                if (Math.random() > 0.75) winLitMesh.setMatrixAt(litCount++, dummy.matrix);
                else winDarkMesh.setMatrixAt(darkCount++, dummy.matrix);
            }
        };

        fillWindowColumn(-2, midW / 2 + 1.5 + 0.1, 0);
        fillWindowColumn(0, midW / 2 + 1.5 + 0.1, 0);
        fillWindowColumn(2, midW / 2 + 1.5 + 0.1, 0);

        fillWindowColumn(-2, -(midW / 2 + 1.5 + 0.1), Math.PI);
        fillWindowColumn(0, -(midW / 2 + 1.5 + 0.1), Math.PI);
        fillWindowColumn(2, -(midW / 2 + 1.5 + 0.1), Math.PI);

        this.visual.add(winLitMesh);
        this.visual.add(winDarkMesh);


        // --- 3. THE UPPER SETBACK ---
        const upperY = baseH + midH + topH / 2;
        const upper = this.createCruciformPrism(topW, topH, 0.5, sharedResources.materials.limestone);
        upper.position.y = upperY;
        this.visual.add(upper);

        // Eagles
        const eagleGeo = new THREE.ConeGeometry(0.5, 2, 4);
        const cOffset = midW / 2;
        const cornerY = baseH + midH;
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2 + Math.PI / 4;
            const ex = Math.cos(angle) * cOffset * 1.2;
            const ez = Math.sin(angle) * cOffset * 1.2;
            const eagle = new THREE.Mesh(eagleGeo, sharedResources.materials.decoMetal);
            eagle.position.set(ex, cornerY, ez);
            eagle.rotation.set(0.5, angle, 0);
            this.visual.add(eagle);
        }


        // --- 4. THE SUNBURST CROWN ---
        let crownBaseY = baseH + midH + topH;

        const arches = 5;
        const maxRad = topW * 0.7;

        for (let i = 0; i < arches; i++) {
            const progress = i / arches;
            const rad = maxRad * (1.0 - progress * 0.6);
            const height = 3.0;
            const yPos = crownBaseY + (i * height);

            const segs = 16;
            const geo = new THREE.CylinderGeometry(rad * 0.8, rad, height, segs);
            const mesh = new THREE.Mesh(geo, sharedResources.materials.decoMetal);
            mesh.position.y = yPos + height / 2;
            this.visual.add(mesh);

            // Sunburst Triangles
            const triGeo = new THREE.ConeGeometry(0.3, height * 0.8, 4);
            const numTris = 8;
            for (let t = 0; t < numTris; t++) {
                const ang = (t / numTris) * Math.PI * 2;
                const tx = Math.cos(ang) * (rad - 0.1);
                const tz = Math.sin(ang) * (rad - 0.1);
                const tri = new THREE.Mesh(triGeo, sharedResources.materials.windowLit);
                tri.position.set(tx, yPos + height / 2, tz);
                tri.lookAt(0, yPos + height / 2, 0);
                tri.rotateX(-Math.PI / 2);
                this.visual.add(tri);
            }
        }

        // Final Spire
        const spireH = 25;
        const spireBaseY = crownBaseY + (arches * 3.0);
        const needle = new THREE.Mesh(new THREE.ConeGeometry(0.2, spireH, 8), sharedResources.materials.decoMetal);
        needle.position.y = spireBaseY + spireH / 2;
        this.visual.add(needle);

        const crownLight = new THREE.PointLight(0xffaa00, 30, 30);
        crownLight.position.y = spireBaseY - 5;
        this.visual.add(crownLight);
    }
}
