import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.pool = [];

        // Setup geometry/material for reuse
        this.geometry = new THREE.PlaneGeometry(0.3, 0.3);
        this.material = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
    }

    emit(position, color = 0x00f3ff) {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
        } else {
            p = new THREE.Mesh(this.geometry, this.material.clone());
            this.scene.add(p);
        }

        p.visible = true;
        p.position.copy(position);
        p.material.color.setHex(color);
        p.material.opacity = 1;
        p.scale.set(1, 1, 1);

        // Random velocity
        // Car is facing -Z. Back is +Z.
        // We want them to shoot out the back (+Z) significantly.
        p.userData = {
            life: 1.0,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                2.0 + Math.random() * 2.0 // +Z direction (Backwards), speed ~2-4
            )
        };

        this.particles.push(p);
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.userData.life -= dt * 2.0; // Life decay
            p.position.addScaledVector(p.userData.velocity, dt * 10);
            p.rotation.z += dt * 5;
            p.scale.setScalar(p.userData.life);
            p.material.opacity = p.userData.life;

            if (p.userData.life <= 0) {
                p.visible = false;
                this.pool.push(p);
                this.particles.splice(i, 1);
            }
        }
    }
}
