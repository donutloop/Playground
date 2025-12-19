import * as THREE from 'three';

export class DayNightCycle {
    constructor(scene, sunSystem, moonSystem, starField, cloudSystem, skySystem) {
        this.scene = scene;
        this.sunSystem = sunSystem;
        this.moonSystem = moonSystem;
        this.starField = starField;
        this.cloudSystem = cloudSystem;
        this.skySystem = skySystem;

        this.cycleDuration = 600;
        this.elapsedTime = 200;
    }

    update(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime >= this.cycleDuration) {
            this.elapsedTime = 0;
        }

        const progress = this.elapsedTime / this.cycleDuration;
        const sunAngle = (progress * Math.PI * 2);
        const r = 200; // REVERTED: City Scale Orbit

        const sx = Math.cos(sunAngle) * r;
        const sy = Math.sin(sunAngle) * r;

        this.sunSystem.group.position.set(sx, sy, -50);
        this.sunSystem.group.lookAt(0, 0, 0);
        this.sunSystem.mainLight.position.copy(this.sunSystem.group.position);

        this.moonSystem.group.position.set(-sx, -sy, 50);
        this.moonSystem.group.lookAt(0, 0, 0);

        const moonLightOffset = new THREE.Vector3(100, 50, 0);
        const moonLightPos = this.moonSystem.group.position.clone().add(moonLightOffset);
        this.moonSystem.mainLight.position.copy(moonLightPos);

        // --- ATMOSPHERE & LIGHTING ---

        if (this.skySystem) this.skySystem.update(this.sunSystem.group.position);
        if (this.cloudSystem) this.cloudSystem.updateSun(this.sunSystem.group.position);

        let sunIntensity = 0;
        let moonIntensity = 0;
        let starOpacity = 1;

        if (sy > 0) { // Day
            sunIntensity = Math.max(0, sy / r) * 2.0;
            moonIntensity = 0;
            starOpacity = Math.max(0, 1.0 - (sy / r) * 4.0);
        } else { // Night
            sunIntensity = 0;
            moonIntensity = 0.5;
            starOpacity = 1;
        }

        this.sunSystem.mainLight.intensity = THREE.MathUtils.lerp(this.sunSystem.mainLight.intensity, sunIntensity, dt * 2);
        this.moonSystem.mainLight.intensity = THREE.MathUtils.lerp(this.moonSystem.mainLight.intensity, moonIntensity, dt * 2);

        this.starField.stars.material.uniforms['time'] = { value: this.elapsedTime };
        this.starField.stars.material.opacity = starOpacity;

        let targetFog = new THREE.Color(0x000000);
        if (sy > 50) { // Day
            targetFog.set(0xaaccff);
        } else if (sy > -50) { // Twilight/Horizon
            if (sx > 0) targetFog.set(0xffaa55);
            else targetFog.set(0xff7744);

            const heightFactor = (sy + 50) / 100;
            targetFog.multiplyScalar(heightFactor);
        } else { // Night
            targetFog.set(0x050510);
        }
        this.scene.fog.color.lerp(targetFog, dt);
    }
}
