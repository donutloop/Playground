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

        // Sky Elements
        this.sun = null;
        this.clouds = null;

        this.currentWeather = 'sunny';

        this.initParticles();
        this.initSky();

        // Apply default
        this.setSunny();
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

    initSky() {
        // Sun
        const sunGeom = new THREE.SphereGeometry(10, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Bright Yellow
        this.sun = new THREE.Mesh(sunGeom, sunMat);
        // Align with initial lighting
        this.sun.position.set(50, 100, 50);
        this.scene.add(this.sun);

        // Clouds
        this.clouds = new THREE.Group();
        const cloudGeom = new THREE.BoxGeometry(1, 1, 1);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            flatShading: true,
            transparent: true,
            opacity: 0.9
        });

        const numClouds = 20;
        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Group();

            // Compose a cloud from cubes
            const blobs = Math.floor(Math.random() * 5) + 3;
            for (let b = 0; b < blobs; b++) {
                const mesh = new THREE.Mesh(cloudGeom, cloudMat);
                mesh.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 6
                );
                mesh.scale.set(
                    Math.random() * 5 + 2,
                    Math.random() * 3 + 2,
                    Math.random() * 4 + 2
                );
                cloud.add(mesh);
            }

            cloud.position.set(
                (Math.random() - 0.5) * 400,
                50 + Math.random() * 30,
                (Math.random() - 0.5) * 400
            );

            this.clouds.add(cloud);
        }
        this.scene.add(this.clouds);
    }

    setSunny() {
        console.log('Weather: Sunny');
        this.currentWeather = 'sunny';

        // Lighting
        this.directionalLight.intensity = 2;
        this.directionalLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.6;
        this.ambientLight.color.setHex(0xffffff);

        // Fog & Sky
        const skyColor = 0x87CEEB;
        this.scene.fog = new THREE.FogExp2(skyColor, 0.002);
        this.scene.background = new THREE.Color(skyColor);

        // Sky Elements
        this.sun.visible = true;
        this.clouds.visible = true;
        this.clouds.children.forEach(c => c.children.forEach(m => m.material.color.setHex(0xffffff)));

        // Particles
        this.particleSystem.visible = false;

        // Materials
        this.materials.road.roughness = 0.9;
        this.materials.road.color.setHex(0x222222); // Fixed: Dark Grey, NOT Black (prevents hovering bug)
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

        // Fog & Sky
        const rainColor = 0x050510;
        this.scene.fog = new THREE.FogExp2(rainColor, 0.02);
        this.scene.background = new THREE.Color(rainColor);

        // Sky Elements
        this.sun.visible = false;
        this.clouds.visible = true; // Dark rain clouds?
        this.clouds.children.forEach(c => c.children.forEach(m => m.material.color.setHex(0x333344))); // Dark Grey clouds

        // Particles
        this.particleSystem.visible = true;
        this.particleSystem.material.color.setHex(0xaaccff);
        this.particleSystem.material.size = 0.8;
        this.particleSystem.material.opacity = 0.6;

        // Materials (Wet look)
        this.materials.road.roughness = 0.1; // Glossy
        this.materials.road.color.setHex(0x050505); // Wet asphalt is very dark
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

        // Fog & Sky
        const snowColor = 0xeeeeee;
        this.scene.fog = new THREE.FogExp2(snowColor, 0.03);
        this.scene.background = new THREE.Color(snowColor);

        // Sky Elements
        this.sun.visible = false; // Overcast
        this.clouds.visible = false; // Hidden in fog/whiteout

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
        // Move clouds
        if (this.clouds && this.clouds.visible) {
            this.clouds.children.forEach(cloud => {
                cloud.position.x += delta * 2;
                if (cloud.position.x > 200) cloud.position.x = -200;
            });
        }

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
