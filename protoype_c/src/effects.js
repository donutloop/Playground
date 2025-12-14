import * as THREE from 'three';

export class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createCrashEffect(position) {
        const particleCount = 20;
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // Orange sparks

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            // Random scatter
            particle.position.x += (Math.random() - 0.5) * 1.0;
            particle.position.y += (Math.random() - 0.5) * 1.0;
            particle.position.z += (Math.random() - 0.5) * 1.0;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10 + 2, // Upward bias
                (Math.random() - 0.5) * 10
            );

            this.scene.add(particle);
            this.particles.push({ mesh: particle, velocity: velocity, life: 1.0 });
        }
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                // clean up
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                // Material is shared, don't dispose here unless cloned
            } else {
                // Physics
                p.velocity.y -= 20 * delta; // Gravity
                p.mesh.position.addScaledVector(p.velocity, delta);
                p.mesh.rotation.x += delta * 5;
                p.mesh.rotation.y += delta * 5;
                p.mesh.scale.setScalar(p.life); // Shrink
            }
        }
    }
}
