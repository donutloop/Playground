import * as THREE from 'three';

export class NYChryslerTower {
    constructor() {
        this.visual = new THREE.Group();
        this.init();
    }

    init() {
        // --- MATERIALS ---
        const brickMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, // White/Grey Brick
            roughness: 0.8,
            map: this.createBrickTexture()
        });

        const darkBrickMat = new THREE.MeshStandardMaterial({
            color: 0x555555, // Darker accents
            roughness: 0.9
        });

        const winMat = new THREE.MeshStandardMaterial({
            color: 0x111122,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x000011,
            emissiveIntensity: 0.5
        });

        const steelMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 1.0, // Shiny Chrome/Steel
            flatShading: false
        });

        // --- 1. BASE (The Pedestal) ---
        const baseH = 15;
        const baseW = 14;
        const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseW);
        const base = new THREE.Mesh(baseGeo, brickMat);
        base.position.y = baseH / 2;
        this.visual.add(base);

        // Entrance / Ground Floor details
        const entranceGeo = new THREE.BoxGeometry(baseW + 0.5, 4, baseW + 0.5);
        const entrance = new THREE.Mesh(entranceGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        entrance.position.y = 2;
        this.visual.add(entrance);

        let currentY = baseH;

        // --- 2. SHAFT (Setbacks) ---
        // Typical Chrysler: Tall shaft, then slight setbacks
        const shaftH = 35;
        const shaftW = 10;

        // Main Shaft
        const shaftGeo = new THREE.BoxGeometry(shaftW, shaftH, shaftW);
        const shaft = new THREE.Mesh(shaftGeo, brickMat);
        shaft.position.y = currentY + shaftH / 2;
        this.visual.add(shaft);

        // Vertical Window Strips (Piers)
        // We simulate this with thin vertical boxes protruding slightly
        const strips = 3;
        const spacing = shaftW / (strips + 1);
        for (let i = 1; i <= strips; i++) {
            const x = -shaftW / 2 + i * spacing;

            // Front/Back
            this.addStrip(shaftW, shaftH, x, currentY + shaftH / 2, false, winMat);
            // Left/Right
            this.addStrip(shaftW, shaftH, x, currentY + shaftH / 2, true, winMat);
        }

        currentY += shaftH;

        // --- 3. UPPER SETBACKS & GARGOYLES ---
        // A transition block before the crown
        const transH = 5;
        const transW = 9;
        const transGeo = new THREE.BoxGeometry(transW, transH, transW);
        const trans = new THREE.Mesh(transGeo, brickMat);
        trans.position.y = currentY + transH / 2;
        this.visual.add(trans);

        // Eagles (Corners) - Abstract representations
        this.addGargoyles(currentY + transH, transW);

        currentY += transH;

        // --- 4. THE CROWN (Art Deco Sunburst) ---
        // 7 Arches. Each is a dome-like segment.
        // We will approximate with Cylinder segments scaled non-uniformly.

        const tiers = 7;
        let tierW = transW;
        let totalCrownH = 0;

        for (let i = 0; i < tiers; i++) {
            const tierHeight = 3.0 - (i * 0.2); // Get shorter
            const nextW = tierW * 0.75; // Tapering

            // The Arch Vault
            // A 4-sided "dome" or "pyramid" with curved sides?
            // Let's use a Cylinder with 4 sides (Square) but smoothed normals? 
            // No, Chrysler is distinctly "arched" on the faces.
            // Let's use a simple scaling trick: Box with rounded top?
            // Cylinder is best approximation for the "Curve" of the arch surface if rotated.
            // Actually, let's just stack cylinders that taper, but are "squashed" to look like vaults?
            // Simplest effective method: Stacked Pyramids (4-sided cylinders)

            const radiusTop = nextW * 0.55;
            const radiusBottom = tierW * 0.55;

            const tierGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, tierHeight, 4, 1, true);
            // Rotate so flat side faces forward (45 deg)
            tierGeo.rotateY(Math.PI / 4);

            const tier = new THREE.Mesh(tierGeo, steelMat);
            tier.position.y = currentY + tierHeight / 2;
            this.visual.add(tier);

            // TRIANGULAR WINDOWS
            // Visual flair: Add triangular "cutouts" (actually added meshes) on the faces.
            // Calculate face centers
            const faceOffset = (radiusBottom + radiusTop) / 2 * Math.cos(Math.PI / 4); // Approx dist to face

            // For each of 4 faces
            for (let r = 0; r < 4; r++) {
                const angle = r * Math.PI / 2;
                const tz = Math.cos(angle) * (radiusBottom * 0.6); // Approximate
                const tx = Math.sin(angle) * (radiusBottom * 0.6);

                // Add rows of triangles
                this.addTriangularWindows(tierHeight, currentY, angle, radiusBottom, i, winMat);
            }

            currentY += tierHeight;
            tierW = nextW;
        }

        // --- 5. THE SPIRE ---
        const spireH = 15;
        const spireGeo = new THREE.ConeGeometry(0.5, spireH, 8);
        const spire = new THREE.Mesh(spireGeo, steelMat);
        spire.position.y = currentY + spireH / 2;
        this.visual.add(spire);
    }

    addStrip(width, height, offset, yPos, rotated, material) {
        const d = width / 2 + 0.05; // Slightly protruding
        const w = 1.5; // Window width
        const geo = new THREE.BoxGeometry(w, height * 0.9, 0.1);
        const mesh = new THREE.Mesh(geo, material);

        if (rotated) {
            mesh.rotation.y = Math.PI / 2;
            mesh.position.set(d * (offset > 0 ? 1 : -1) - (offset > 0 ? 0.1 : -0.1), yPos, offset);
            // Correct logic:
            // "offset" is the position along the face. 
            // We need 4 faces.
            // Let's simplify: Helper assumes standard orientation.
            // Actually, simply adding 4 meshes per "strip position" is easier.
        } else {
            mesh.position.set(offset, yPos, d);
            this.visual.add(mesh);

            const meshBack = mesh.clone();
            meshBack.position.set(offset, yPos, -d);
            this.visual.add(meshBack);
        }

        if (rotated) {
            const meshRight = new THREE.Mesh(geo, material);
            meshRight.rotation.y = Math.PI / 2;
            meshRight.position.set(d, yPos, offset);
            this.visual.add(meshRight);

            const meshLeft = meshRight.clone();
            meshLeft.position.set(-d, yPos, offset);
            this.visual.add(meshLeft);
        }
    }

    addGargoyles(yPos, width) {
        // "Eagles" at the corners
        const size = 1.5;
        const dist = width / 2;
        const geo = new THREE.BoxGeometry(size, size / 2, size * 2);
        // Pointing outwards

        const mat = new THREE.MeshStandardMaterial({ color: 0x888899 });

        const corners = [
            { x: dist, z: dist, r: -Math.PI / 4 },
            { x: -dist, z: dist, r: -Math.PI * 3 / 4 },
            { x: dist, z: -dist, r: Math.PI / 4 },
            { x: -dist, z: -dist, r: Math.PI * 3 / 4 },
        ];

        corners.forEach(c => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(c.x, yPos, c.z);
            mesh.rotation.y = c.r;
            this.visual.add(mesh);
        });
    }

    addTriangularWindows(h, yBase, angle, radius, tierIndex, mat) {
        // Simple triangular accents
        // Count decreases with tier index (top tiers have fewer)
        // Actually, Chrysler has a "sunburst" - rows of triangles.
        // Let's simplified: 1 big triangle per face per tier?
        // Or 3 small ones?
        const count = 3;
        const size = h / 3.5;

        const grp = new THREE.Group();
        grp.rotation.y = angle;
        grp.position.y = yBase + h / 2;

        // Position group at the "face" distance
        // For a 4-sided cylinder (rotated 45), the face distance is radius * cos(45)
        const faceDist = radius * 0.707 * 0.9; // .9 to sit slightly in or on

        for (let i = 0; i < count; i++) {
            // Create a triangle shape
            const shape = new THREE.Shape();
            shape.moveTo(0, size / 2);
            shape.lineTo(size / 2, -size / 2);
            shape.lineTo(-size / 2, -size / 2);
            shape.lineTo(0, size / 2);

            const geom = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geom, mat);

            // Arrange vertically or horizontally?
            // Chrysler windows are "arched" rows.
            // We'll just stack them vertically for "shine" effect
            // Or spread them horizontally?
            // Let's do a simple vertical stack for the sunburst ray effect

            mesh.position.set(0, (i - 1) * (size * 1.2), faceDist);
            grp.add(mesh);
        }
        this.visual.add(grp);
    }

    createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#dddddd';
        // Simple noise/pattern
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(Math.random() * 60, Math.random() * 60, 4, 2);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
}
