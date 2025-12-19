import * as THREE from 'three';
import { ModernGlassTower } from './ModernGlassTower.js';
import { UrbanHighrise } from './UrbanHighrise.js';
import { NYArtDecoTower } from './NYArtDecoTower.js';

// --- ATMOSPHERE SHADER ---
const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
}
`;

export class World {
    constructor(scene) {
        this.scene = scene;
        this.radius = 500;

        this.initPlanet();
        this.initAtmosphere();
        this.initCities();
    }

    initPlanet() {
        const geo = new THREE.SphereGeometry(this.radius, 128, 128);
        const maps = this.createPlanetMaps();

        const mat = new THREE.MeshStandardMaterial({
            map: maps.diffuse,
            roughnessMap: maps.roughness,
            bumpMap: maps.bump,
            bumpScale: 5.0, // Mountain height
            metalness: 0.1,
            color: 0xffffff
        });

        this.planet = new THREE.Mesh(geo, mat);
        this.planet.receiveShadow = true;
        this.scene.add(this.planet);
    }

    initAtmosphere() {
        // 1. Cloud Layer (Moving)
        const cloudGeo = new THREE.SphereGeometry(this.radius + 5, 128, 128);
        const cloudTex = this.createCloudTexture();
        const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false, // Avoid z-fighting with glow
            blending: THREE.AdditiveBlending
        });
        this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
        this.scene.add(this.clouds);

        // 2. Atmosphere Glow (Fresnel)
        const glowGeo = new THREE.SphereGeometry(this.radius + 20, 128, 128); // Slightly larger
        const glowMat = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        this.atmosphere = new THREE.Mesh(glowGeo, glowMat);
        this.scene.add(this.atmosphere);
    }

    createPlanetMaps() {
        const size = 2048; // High Res
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');

        // --- NOISE ---
        // Robust 3D Noise Implementation
        const p = new Uint8Array(512);
        const perm = new Uint8Array([151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]);
        for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
        function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        function lerp(t, a, b) { return a + t * (b - a); }
        function grad(hash, x, y, z) {
            const h = hash & 15;
            const u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
            return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
        }
        function noise(x, y, z) {
            const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            const u = fade(x), v = fade(y), w = fade(z);
            const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
            return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
                lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
                lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
                    lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
        }

        // --- MAP GENERATION LOOP ---
        const diffData = ctx.createImageData(size, size);

        // We will generate Height first, then derive diffuse/roughness
        const heightMap = new Float32Array(size * size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Sphere Mapping (Equirectangular-ish for texture on sphere)
                const nx = x / size * 8.0;
                const ny = y / size * 4.0;

                // FBM
                let n = 0;
                n += noise(nx, ny, 0) * 0.5;    // Continents
                n += noise(nx * 2, ny * 2, 10) * 0.25;   // Details
                n += noise(nx * 4, ny * 4, 20) * 0.125;  // Mountains
                n += noise(nx * 8, ny * 8, 30) * 0.06;   // Textures

                let h = n + 0.5; // 0 to 1 ideally

                const idx = y * size + x;
                heightMap[idx] = h;
            }
        }

        // 1. Diffuse & Roughness
        const roughData = ctx.createImageData(size, size);

        for (let i = 0; i < size * size; i++) {
            let h = heightMap[i];

            let r, g, b, roughness;

            if (h < 0.45) {
                // Deep Ocean
                r = 10; g = 30; b = 80;
                roughness = 0.2; // Shiny
            } else if (h < 0.5) {
                // Shallow Water
                r = 20; g = 60; b = 120;
                roughness = 0.3;
            } else if (h < 0.52) {
                // Beach
                r = 210; g = 190; b = 130;
                roughness = 0.9;
            } else if (h < 0.7) {
                // Grass / Forest
                r = 30; g = 100; b = 30;
                roughness = 1.0;
            } else if (h < 0.85) {
                // Mountain / Rock
                r = 90; g = 80; b = 70;
                roughness = 0.9;
            } else {
                // Snow
                r = 250; g = 250; b = 255;
                roughness = 0.6;
            }

            const idx = i * 4;
            // Diffuse
            diffData.data[idx] = r;
            diffData.data[idx + 1] = g;
            diffData.data[idx + 2] = b;
            diffData.data[idx + 3] = 255;

            // Roughness (Greyscale)
            const rVal = Math.floor(roughness * 255);
            roughData.data[idx] = rVal;
            roughData.data[idx + 1] = rVal;
            roughData.data[idx + 2] = rVal;
            roughData.data[idx + 3] = 255;
        }

        ctx.putImageData(diffData, 0, 0);
        const diffTex = new THREE.CanvasTexture(canvas);
        diffTex.colorSpace = THREE.SRGBColorSpace;

        const cRough = document.createElement('canvas');
        cRough.width = size; cRough.height = size;
        cRough.getContext('2d').putImageData(roughData, 0, 0);
        const roughTex = new THREE.CanvasTexture(cRough);

        // Bump Map (Height)
        const bumpData = ctx.createImageData(size, size);
        for (let i = 0; i < size * size; i++) {
            let h = heightMap[i];
            let val = h;
            if (h < 0.5) val = 0.5; // Flatten Ocean

            const c = Math.floor(val * 255);
            const idx = i * 4;
            bumpData.data[idx] = c;
            bumpData.data[idx + 1] = c;
            bumpData.data[idx + 2] = c;
            bumpData.data[idx + 3] = 255;
        }
        const cBump = document.createElement('canvas');
        cBump.width = size; cBump.height = size;
        cBump.getContext('2d').putImageData(bumpData, 0, 0);
        const bumpTex = new THREE.CanvasTexture(cBump);

        return { diffuse: diffTex, roughness: roughTex, bump: bumpTex };
    }

    createCloudTexture() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000'; // Transparent base
        ctx.fillRect(0, 0, size, size);

        const imgData = ctx.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Simple Noise Pattern (Sinusoidal approximation)
                const v = (Math.sin(x * 0.02) + Math.cos(y * 0.02 + x * 0.01)) * 0.5 + 0.5;
                let alpha = 0;
                if (v > 0.6) alpha = (v - 0.6) * 2.0; // 0 to 0.8

                const idx = (y * size + x) * 4;
                imgData.data[idx] = 255;
                imgData.data[idx + 1] = 255;
                imgData.data[idx + 2] = 255;
                imgData.data[idx + 3] = Math.floor(alpha * 255);
            }
        }
        ctx.putImageData(imgData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    initCities() {
        const towers = [
            new ModernGlassTower(),
            new UrbanHighrise(),
            new NYArtDecoTower()
        ];

        const angleStep = (Math.PI * 2) / 3;

        towers.forEach((towerObj, index) => {
            const angle = index * angleStep;

            const x = Math.sin(angle) * this.radius;
            const z = Math.cos(angle) * this.radius;
            const y = 0;

            const pos = new THREE.Vector3(x, y, z);

            this.scene.add(towerObj.visual);
            towerObj.visual.position.copy(pos);

            const up = new THREE.Vector3(0, 1, 0);
            const normal = pos.clone().normalize();
            towerObj.visual.quaternion.setFromUnitVectors(up, normal);
        });
    }

    update() {
        if (this.clouds) {
            this.clouds.rotation.y += 0.0002;
        }
        if (this.planet) {
            this.planet.rotation.y += 0.0001;
        }
    }
}
