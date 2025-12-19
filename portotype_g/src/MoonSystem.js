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
        const pos = new THREE.Vector3(0, 150, -200);

        this.group.position.copy(pos);
        this.group.lookAt(0, 0, 0);

        // 1. Procedural Moon Texture
        const moonTex = this.createMoonTexture();

        // 2. The Physical Moon Mesh
        const geo = new THREE.SphereGeometry(30, 64, 64);

        // Use Standard material for some roughness/lighting play
        const mat = new THREE.MeshStandardMaterial({
            map: moonTex,
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.0,
            emissive: 0x222233, // Slight self-illumination
            emissiveIntensity: 0.2,
            fog: false
        });

        this.moonMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.moonMesh);

        // 3. The Corona / Glow 
        const spriteMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture(),
            color: 0xaaddff, // Cool Blue Glow
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(180, 180, 1);
        this.group.add(sprite);

        // 4. The Moonlight
        // Cool blue directional light
        const moonLight = new THREE.DirectionalLight(0xaaccff, 1.2);
        this.mainLight = moonLight;
        this.mainLight.position.copy(pos);
        this.mainLight.castShadow = true;

        this.mainLight.shadow.mapSize.width = 4096;
        this.mainLight.shadow.mapSize.height = 4096;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 1000;
        const d = 200;
        this.mainLight.shadow.camera.left = -d;
        this.mainLight.shadow.camera.right = d;
        this.mainLight.shadow.camera.top = d;
        this.mainLight.shadow.camera.bottom = -d;
        this.mainLight.shadow.bias = -0.00005;
        this.mainLight.shadow.normalBias = 0.002;

        this.scene.add(this.mainLight);

        // Night Ambient
        // Dark blue/purple
        const ambient = new THREE.AmbientLight(0x050515, 0.6);
        this.scene.add(ambient);
    }

    createMoonTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Base Grey
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, 1024, 1024);

        // Noise / Dust
        for (let i = 0; i < 100000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
        }

        // Craters
        const drawCrater = (x, y, r) => {
            const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
            grad.addColorStop(0, 'rgba(100, 100, 100, 1)'); // Dark Center
            grad.addColorStop(0.8, 'rgba(180, 180, 180, 1)'); // Rim
            grad.addColorStop(1, 'rgba(200, 200, 200, 0)'); // fade

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Rim Shadow (fake 3D)
            ctx.strokeStyle = 'rgba(50,50,50,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 2, y + 2, r * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        };

        // Large Maria (Dark Spots)
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const r = 50 + Math.random() * 100;
            ctx.fillStyle = 'rgba(80, 80, 90, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Random Craters
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const r = 5 + Math.random() * 20;
            drawCrater(x, y, r);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
        grad.addColorStop(0, 'rgba(200, 220, 255, 1)'); // Blue-White center
        grad.addColorStop(0.3, 'rgba(100, 150, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 20, 100, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        // Rotate moon slowly
        if (this.moonMesh) {
            this.moonMesh.rotation.y += dt * 0.02;
        }
    }
}
