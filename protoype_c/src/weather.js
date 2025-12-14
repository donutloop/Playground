import * as THREE from 'three';

export class WeatherSystem {
    constructor(scene, directionalLight, ambientLight, materials) {
        this.scene = scene;
        this.directionalLight = directionalLight;
        this.ambientLight = ambientLight;
        this.materials = materials; // { road, sidewalk, building }

        this.particles = null;
        this.particleCount = 15000;
        this.particleSystem = null;

        this.currentWeather = 'sunny';

        this.initParticles();
    }

    initParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < this.particleCount; i++) {
            positions.push((Math.random() - 0.5) * 400); // x
            positions.push(Math.random() * 200);       // y
            positions.push((Math.random() - 0.5) * 400); // z

            velocities.push(0); // vy
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
        this.particles = geometry;
    }

    setSunny() {
        console.log('Weather: Sunny');
        this.currentWeather = 'sunny';

        // Lighting
        this.directionalLight.intensity = 2;
        this.directionalLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.5;
        this.ambientLight.color.setHex(0xffffff);

        // Fog
        this.scene.fog = new THREE.FogExp2(0x111111, 0.005);
        this.scene.background = new THREE.Color(0x111111);

        // Particles
        this.particleSystem.visible = false;

        // Materials
        this.materials.road.roughness = 0.9;
        this.materials.road.color.setHex(0x111111);
        this.materials.sidewalk.color.setHex(0x444444);
    }

    setRain() {
        console.log('Weather: Rain');
        this.currentWeather = 'rain';

        // Lighting
        this.directionalLight.intensity = 0.5;
        this.directionalLight.color.setHex(0xaaccff);
        this.ambientLight.intensity = 0.2;
        this.ambientLight.color.setHex(0x222233);

        // Fog
        this.scene.fog = new THREE.FogExp2(0x050510, 0.02);
        this.scene.background = new THREE.Color(0x050510);

        // Particles
        this.particleSystem.visible = true;
        this.particleSystem.material.color.setHex(0xaaccff);
        this.particleSystem.material.size = 0.8;
        this.particleSystem.material.opacity = 0.6;

        // Materials (Wet look)
        this.materials.road.roughness = 0.1; // Glossy
        this.materials.road.color.setHex(0x050505);
        this.materials.sidewalk.color.setHex(0x333333);
    }

    setSnow() {
        console.log('Weather: Snow');
        this.currentWeather = 'snow';

        // Lighting
        this.directionalLight.intensity = 1.5;
        this.directionalLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.8;
        this.ambientLight.color.setHex(0xeeeeee);

        // Fog
        this.scene.fog = new THREE.FogExp2(0xeeeeee, 0.03);
        this.scene.background = new THREE.Color(0xeeeeee);

        // Particles
        this.particleSystem.visible = true;
        this.particleSystem.material.color.setHex(0xffffff);
        this.particleSystem.material.size = 1.5; // Flakes
        this.particleSystem.material.opacity = 0.9;

        // Materials (Snowy)
        this.materials.road.roughness = 1.0;
        this.materials.road.color.setHex(0xeeeeee); // White roads
        this.materials.sidewalk.color.setHex(0xdddddd);
    }

    update(delta) {
        if (!this.particleSystem.visible) return;

        const positions = this.particles.attributes.position.array;

        const fallSpeed = this.currentWeather === 'rain' ? 80 : 15; // Rain fast, snow slow
        const windX = this.currentWeather === 'rain' ? 10 : 5;

        for (let i = 0; i < this.particleCount; i++) {
            // y
            positions[i * 3 + 1] -= fallSpeed * delta;
            // x (wind)
            positions[i * 3] -= windX * delta;

            // Reset if below ground
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 200;
                positions[i * 3] = (Math.random() - 0.5) * 400;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
            }
        }

        this.particles.attributes.position.needsUpdate = true;
    }
}
