import * as THREE from 'three';

export class MoonSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.initMoon();
    }

    initMoon() {
        // Position: High and visible
        const pos = new THREE.Vector3(0, 150, 200);

        this.group.position.copy(pos);
        this.group.lookAt(0, 0, 0);

        // 1. Procedural High-Res Moon Texture (Color + Bump)
        const moonMaps = this.createMoonTextures();

        // 2. The Physical Moon Mesh
        const geo = new THREE.SphereGeometry(30, 128, 128);

        const mat = new THREE.MeshStandardMaterial({
            map: moonMaps.colorMap,
            bumpMap: moonMaps.bumpMap,
            bumpScale: 1.5,
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.0,
            fog: false
        });

        this.moonMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.moonMesh);

        // 3. Corona
        const spriteMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture(),
            color: 0xaaddff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(180, 180, 1);
        this.group.add(sprite);

        // 4. Moonlight
        const moonLight = new THREE.DirectionalLight(0xaaccff, 0.5); // Lower intensity for simpler static lighting
        this.mainLight = moonLight;
        this.mainLight.position.copy(pos);
        this.mainLight.castShadow = true;

        this.mainLight.shadow.mapSize.width = 2048; // OPTIMIZED
        this.mainLight.shadow.mapSize.height = 2048;

        // PLANET SCALE SHADOWS
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 3000;
        const d = 800; // Big box
        this.mainLight.shadow.camera.left = -d;
        this.mainLight.shadow.camera.right = d;
        this.mainLight.shadow.camera.top = d;
        this.mainLight.shadow.camera.bottom = -d;
        this.mainLight.shadow.bias = -0.00005;

        this.scene.add(this.mainLight);

        // Night Ambient
        const ambient = new THREE.AmbientLight(0x050515, 0.4);
        this.scene.add(ambient);
    }

    createMoonTextures() {
        const size = 2048; // Texture Quality
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');

        // --- NOISE HELPER ---
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

        // --- GENERATION ---

        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size * 10.0;
                const ny = y / size * 10.0;
                // Layered Noise
                let n = 0;
                n += noise(nx, ny, 0) * 0.5;
                n += noise(nx * 2, ny * 2, 10) * 0.25;
                let val = n + 0.5;
                val = Math.max(0, Math.min(1, val));
                const c = Math.floor(val * 100 + 150);
                const idx = (y * size + x) * 4;
                data[idx] = c;
                data[idx + 1] = c;
                data[idx + 2] = c;
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Maria (Large Dark Spots)
        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = size * (0.1 + Math.random() * 0.2);

            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(150, 150, 160, 1)');
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Capture Color Map
        const colorTex = new THREE.CanvasTexture(canvas);
        colorTex.colorSpace = THREE.SRGBColorSpace;

        // Bump Map (Similar)
        const bumpTex = new THREE.CanvasTexture(canvas);
        return { colorMap: colorTex, bumpMap: bumpTex };
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
        grad.addColorStop(0, 'rgba(200, 220, 255, 1)');
        grad.addColorStop(1, 'rgba(0, 20, 100, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        if (this.moonMesh) {
            this.moonMesh.rotation.y += dt * 0.01;
        }
    }
}
