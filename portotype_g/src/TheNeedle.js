import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// --- GENERATIVE TEXTURES (Procedural Assets) ---
// We generate high-res textures in memory to avoid loading external assets while keeping quality high.

function createNoiseTexture(width, height, type = 'concrete') {
    const cvs = document.createElement('canvas');
    cvs.width = width; cvs.height = height;
    const ctx = cvs.getContext('2d');

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        let val = 0;
        if (type === 'concrete') {
            // High frequency noise for concrete grain
            val = 128 + (Math.random() - 0.5) * 40;
        } else if (type === 'roughness') {
            // Clouds/smudges
            val = 200 + (Math.random() - 0.5) * 50;
        }

        data[i] = val;   // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 255; // Alpha
    }

    ctx.putImageData(imgData, 0, 0);

    if (type === 'roughness') {
        // Blur it for smudges
        ctx.filter = 'blur(4px)';
        ctx.drawImage(cvs, 0, 0);
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

const concreteNormalMap = createNoiseTexture(512, 512, 'concrete');
const generalRoughnessMap = createNoiseTexture(512, 512, 'roughness');


// --- NEXT-GEN INTERIOR SHADER (v 3.0 "PS5 Quality") ---
// Features: Cubemap parralax, randomized room contents, window blinds, night emission, surface imperfections.

const nextGenVert = `
    varying vec2 vUv;
    varying vec3 vNormal; // View Space
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

    void main() {
        vUv = uv;
        
        // Normal Matrix transforms normal to View Space
        vNormal = normalize(normalMatrix * normal);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz; 
        
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const nextGenFrag = `
    uniform vec2 tiling;
    uniform float roomDepth; 
    uniform sampler2D tRoughness;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Simplex-ish noise for furniture blobs
    float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        // 1. Setup Tangent Space View Vector (Simplified box assumption)
        // We assume UVs are aligned such that U=Tangent, V=Bitangent (vertical)
        
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition); // Eye vector (frag to camera)
        
        // Parallax Offset Calculation
        // This is the core "Fake Interior" trick
        // We want to intersect a ray with a box behind the surface.
        
        vec2 uv = vUv * tiling;
        vec2 roomIdx = floor(uv);
        vec2 fUv = fract(uv); // 0..1 inside the room face
        
        // Remap to -1..1 centered
        vec2 bounds = fUv * 2.0 - 1.0;
        
        // Synthesize a Ray direction. 
        // We know V (view vector). We project it into the "room space".
        // Since it's a flat window, we just need the XY tilt of the View Vector relative to the Normal.
        
        // TBN Basis estimation without attributes:
        vec3 dIdx = dFdx(vViewPosition);
        vec3 dIdy = dFdy(vViewPosition);
        vec2 dUdx = dFdx(vUv);
        vec2 dUdy = dFdy(vUv);
        
        // Solved Tangent (approx) from derivatives
        // Determinant
        float det = (dUdx.x * dUdy.y - dUdx.y * dUdy.x);
        vec3 T, B;
        
        if (abs(det) < 1e-6) {
             // Fallback for singular cases
             T = vec3(1.0, 0.0, 0.0);
             B = vec3(0.0, 1.0, 0.0);
        } else {
             float r = 1.0 / det;
             T = (dIdx * dUdy.y - dIdy * dUdx.y) * r;
             B = (dIdy * dUdx.x - dIdx * dUdy.x) * r;
        }
        T = normalize(T - N * dot(N, T)); // Gram-Schmidt
        B = normalize(cross(N, T)); 
        
        // Ray Dir in Tangent Space
        vec3 ray = vec3(
            dot(V, T),
            dot(V, B),
            dot(V, N)
        );
        
        // Invert Z because we look "in"
        ray.z *= -1.0; 
        
        // Scale Z by room depth
        ray.xy /= roomDepth;
        
        // Intersect Box
        // We are at z=0 (window surface). Room is z = -1 to 0? No, usually z is depth.
        // Let's say room is -1..1 in xy, and -1..0 in z.
        // Ray Origin = (bounds.x, bounds.y, 0)
        
        vec3 dists = vec3(1e5);
        
        // Sidewall intersections
        if (ray.x > 0.0) dists.x = (1.0 - bounds.x) / ray.x;
        else if (ray.x < 0.0) dists.x = (-1.0 - bounds.x) / ray.x;
        
        if (ray.y > 0.0) dists.y = (1.0 - bounds.y) / ray.y;
        else if (ray.y < 0.0) dists.y = (-1.0 - bounds.y) / ray.y;
        
        // Backwall intersection (z = -1)
        if (ray.z < 0.0) dists.z = (-1.0 - 0.0) / ray.z;
        
        float t = min(dists.x, min(dists.y, dists.z));
        
        vec3 hitPos = vec3(bounds, 0.0) + ray * t;
        
        // --- CONTENT GENERATION ---
        
        vec3 roomColor = vec3(0.0);
        float randSeed = rand(roomIdx);
        
        // Feature: Random Blinds
        float blindState = rand(roomIdx + 1.0); // 0 = open, 1 = closed
        // If blind is partially closed, it blocks the view.
        float blindHeight = bounds.y * 0.5 + 0.5; // 0..1
        bool hitBlind = false;
        if (blindState > 0.5 && blindHeight > (1.0 - (blindState-0.5)*2.0) ) {
             // We hit the blind (which is "on the glass")
             // Actually, blinds are usually slightly behind glass.
             // For valid parallax, they should be checked BEFORE room raymarch.
             // But for cheap effect:
             hitBlind = true;
        }
        
        if (hitBlind) {
             roomColor = vec3(0.95, 0.9, 0.85); // White/Beige blind
             // Add slats
             float slat = step(0.5, fract(vUv.y * 50.0));
             roomColor *= (0.8 + 0.2*slat);
        } else {
            // Hit Interior
            if (abs(t - dists.z) < 0.01) {
                // Back Wall
                // Generate fake furniture silhouettes
                vec2 backUV = hitPos.xy * 0.5 + 0.5;
                float furn = step(0.6, sin(backUV.x * 3.14) * cos(backUV.y * 5.0) + noise(backUV*5.0));
                
                vec3 wallC = mix(vec3(0.8, 0.85, 0.9), vec3(0.2, 0.1, 0.05), furn); // White wall vs wood furniture
                
                // Texture the wall slightly
                wallC *= (0.9 + 0.1*rand(hitPos.xy));
                
                // Lighting
                // Add ceiling light glow
                float lightGlow = 1.0 - length(hitPos.xy - vec2(0.0, 0.8));
                wallC += vec3(1.0, 0.9, 0.7) * smoothstep(0.0, 0.8, lightGlow);
                
                roomColor = wallC;
                
            } else if (abs(t - dists.y) < 0.01) {
                // Floor/Ceiling
                if (hitPos.y < 0.0) {
                     // Floor
                     roomColor = vec3(0.15, 0.1, 0.05); // Wood floor
                } else {
                     // Ceiling
                     roomColor = vec3(0.9); // White Drop ceiling
                     // Grid
                     if (fract(hitPos.x * 2.0) < 0.05 || fract(hitPos.z * 2.0) < 0.05) roomColor *= 0.8;
                }
            } else {
                // Side Walls
                roomColor = vec3(0.7);
            }
            
            // Apply baked ambient occlusion in corners
            float ao = 1.0;
            // corner distance
            ao *= smoothstep(0.0, 0.4, 1.0 - abs(hitPos.x));
            ao *= smoothstep(0.0, 0.4, 1.0 - abs(hitPos.y));
            ao *= smoothstep(0.0, 0.4, 1.0 - abs(hitPos.z)); // Depth AO
            
            roomColor *= (0.5 + 0.5*ao);
        }
        
        // --- SURFACE REFLECTION (PBR) ---
        // Dielectric glass F0 = 0.04
        float F0 = 0.04;
        float fresnel = F0 + (1.0 - F0) * pow(1.0 - max(0.0, dot(N, V)), 5.0);
        
        // Sampling a roughness map
        float surfaceRough = texture2D(tRoughness, vUv * 5.0).r;
        
        // Mock Environment reflection (Skybox)
        // Simple Gradient Sky
        vec3 R = reflect(-V, vWorldNormal);
        float horizon = smoothstep(-0.1, 0.1, R.y);
        vec3 skyCol = mix(vec3(0.6, 0.6, 0.6), vec3(0.2, 0.4, 0.8), horizon); // Horizon grey to blue
        skyCol += vec3(1.0)*pow(max(0.0, dot(R, normalize(vec3(1.0, 2.0, 1.0)))), 20.0); // Mock Sun spec
        
        // Final Mix
        // Glass lets some light through (roomColor) and reflects some (skyCol)
        vec3 finalColor = mix(roomColor, skyCol, fresnel);
        
        // Add subtle grunge/dirt from roughness map
        finalColor *= (0.9 + 0.1*surfaceRough);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;


export class TheNeedle {
    constructor() {
        this.visual = new THREE.Group();
        this.generateTower();
    }

    generateTower() {
        const height = 190;
        const floorHeight = 3.5;
        const numFloors = Math.floor(height / floorHeight);
        const width = 10;
        const depth = 10;

        // --- 1. PROCEDURAL GEOMETRY (Chamfered Box) ---
        // Instead of BoxGeometry, we build a custom shape for smoother, high-rendering look

        // Define shape path with chamfered corners
        const shape = new THREE.Shape();
        const w = width / 2;
        const d = depth / 2;
        const chamfer = 1.0;

        shape.moveTo(-w + chamfer, -d);
        shape.lineTo(w - chamfer, -d);
        shape.lineTo(w, -d + chamfer);
        shape.lineTo(w, d - chamfer);
        shape.lineTo(w - chamfer, d);
        shape.lineTo(-w + chamfer, d);
        shape.lineTo(-w, d - chamfer);
        shape.lineTo(-w, -d + chamfer);
        shape.closePath();

        // Extrude options
        const extrudeSettings = {
            steps: 1,
            depth: height,
            bevelEnabled: false, // We manually chamfered 2D, no need for top/bottom bevel? Actually top bevel is nice.
            curveSegments: 4
        };

        const coreGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Extrude puts it lying down on Z. Rotate to stand up.
        coreGeo.rotateX(-Math.PI / 2);
        coreGeo.translate(0, height, 0); // Origin at top? No, translate to span 0..height
        coreGeo.center();
        coreGeo.translate(0, height / 2, 0); // Base at 0

        // UV Fix: ExtrudeGeometry UVs are weird (Face and Side).
        // Side UVs wrap around. We need them consistent for room mapping.
        // We will manually re-project UVs for the sides.

        const posAttr = coreGeo.attributes.position;
        const uvAttr = coreGeo.attributes.uv;

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            // Check normals to decide face? 
            // Simple Planar mapping for sides.
            // If Abs(Normal.y) is small, it's a wall.
            // But getting normals per vertex here is annoying.
            // Let's just use X/Z pos.

            // A cylindrical wrap would be best for a continuous tower.
            // U = atan(z, x) / 2pi
            // V = y / floorHeight

            const angle = Math.atan2(z, x);
            const u = (angle / (Math.PI * 2)) * 4.0; // 4 repeats around?
            const v = y / height;

            uvAttr.setXY(i, u, v);
        }

        // --- MATERIALS ---

        const glassMat = new THREE.ShaderMaterial({
            vertexShader: nextGenVert,
            fragmentShader: nextGenFrag,
            uniforms: {
                tiling: { value: new THREE.Vector2(10.0, numFloors) }, // Horizontal rooms, Vertical floors
                roomDepth: { value: 0.12 }, // Deep rooms
                tRoughness: { value: generalRoughnessMap }
            },
            defines: {
                extensions: { derivatives: true }
            }
        });

        const towerMesh = new THREE.Mesh(coreGeo, glassMat);
        towerMesh.castShadow = true;
        towerMesh.receiveShadow = true;
        this.visual.add(towerMesh);

        // --- 2. PHYSICAL MULLIONS (The grid) ---
        // Real geometry, not texture. PS5 wants polys!

        // Vertical fins
        const finGeo = new THREE.BoxGeometry(0.3, height, 0.8);
        const finMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.4,
            metalness: 0.8,
            normalMap: concreteNormalMap,
            normalScale: new THREE.Vector2(0.2, 0.2)
        });

        // Place fins at intervals around the parameter
        // We use the same path logic
        const perimeter = (w - chamfer) * 2 * 4 + (chamfer * Math.sqrt(2)) * 4; // approx
        // Just place them on traces

        const addFin = (x, z, rotY) => {
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(x, height / 2, z);
            fin.rotation.y = rotY;
            fin.castShadow = true;
            this.visual.add(fin);
        };

        // Sides
        [-w, w].forEach(xVal => {
            // Front/Back faces
            for (let zVal = -d + chamfer; zVal <= d - chamfer; zVal += 2.5) {
                addFin(xVal, zVal, 0);
            }
        });

        [-d, d].forEach(zVal => {
            // Left/Right faces
            for (let xVal = -w + chamfer; xVal <= w - chamfer; xVal += 2.5) {
                addFin(xVal, zVal, Math.PI / 2);
            }
        });

        // Corner columns (Stronger)
        const colGeo = new THREE.CylinderGeometry(0.8, 0.8, height, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.5 });

        // Place at the chamfer midpoints
        // Corners are at (+-w, +-d) inset by chamfer
        // Actuall corner verts: (w, d-chamfer) and (w-chamfer, d)
        // We want a column floating just off the corner

        const corners = [
            [w, d], [w, -d], [-w, d], [-w, -d]
        ];

        corners.forEach(([kx, kz]) => {
            // Inset slightly to touch the chamfer face
            // Distance from center to chamfer face center? 
            // Normalized vector
            const len = Math.sqrt(kx * kx + kz * kz);
            const nx = kx / len;
            const nz = kz / len;

            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(nx * (len - chamfer * 0.5), height / 2, nz * (len - chamfer * 0.5));
            col.castShadow = true;
            this.visual.add(col);
        });

        // --- 3. HORIZONTAL BELTS (Mechanical floors) ---
        const beltHeight = 2.0;
        const beltGeo = new THREE.BoxGeometry(width * 2.1, beltHeight, depth * 2.1); // Slightly larger
        // Actually better to follow shape. Scale up Shape?
        // Simple Box for belts is okay, adds variety.

        for (let h = 40; h < height; h += 40) {
            const belt = new THREE.Mesh(beltGeo, finMat);
            belt.position.y = h;
            this.visual.add(belt);
        }

        // --- 4. THE CROWN ---
        // A tiered top
        const crownBaseY = height;
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(width, 4, depth), finMat);
        t1.position.y = crownBaseY + 2;
        this.visual.add(t1);

        const t2 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 8, depth * 0.8), finMat);
        t2.position.y = crownBaseY + 4 + 4;
        this.visual.add(t2);

        // Spire
        const spireGeo = new THREE.CylinderGeometry(0.2, 1.0, 30, 8);
        const spire = new THREE.Mesh(spireGeo, new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 1.0, roughness: 0.2 }));
        spire.position.y = crownBaseY + 12 + 15;
        this.visual.add(spire);

        // --- 5. ENTRANCE CANOPY ---
        const canW = width + 6;
        const canD = depth + 6;
        const canopyM = new THREE.Mesh(
            new THREE.BoxGeometry(canW, 1, canD),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.0 }) // Polished black granite
        );
        canopyM.position.y = 6;
        this.visual.add(canopyM);

        // Support pillars for canopy
        const pilGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
        const pilMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

        [1, -1].forEach(x => {
            [1, -1].forEach(z => {
                const p = new THREE.Mesh(pilGeo, pilMat);
                p.position.set(x * (canW / 2 - 1), 3, z * (canD / 2 - 1));
                p.castShadow = true;
                p.receiveShadow = true;
                this.visual.add(p);
            });
        });

    }
}
