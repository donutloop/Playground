import * as THREE from 'three';

export class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.emitters = [];
    }

    addEmitter(object, type) {
        // Check if emitter already exists
        const exists = this.emitters.find(e => e.object === object && e.type === type);
        if (exists) return;

        this.emitters.push({
            object: object,
            type: type,
            timer: 0
        });
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

    createFireEffect(parentObject) {
        // Create a fire emitter attached to the car
        // We add single particles every frame in update() for "emitters", or just chunks here.
        // Simple approach: Add static fire particles relative to parent

        const count = 5;
        const geom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff4400 });

        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(geom, mat);
            // Position relative to car center (engine bay?)
            p.position.set((Math.random() - 0.5) * 1, 1 + Math.random(), 2 + (Math.random() - 0.5));
            p.userData = {
                parent: parentObject,
                offset: p.position.clone(),
                type: 'fire',
                life: 2.0 + Math.random()
            };
            this.scene.add(p);
            this.particles.push({ mesh: p, velocity: new THREE.Vector3(0, 5, 0), life: p.userData.life, isAttached: true });
        }
    }

    createSmokeEffect(parentObject) {
        const count = 5;
        const geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const mat = new THREE.MeshBasicMaterial({ color: 0x555555 });

        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(geom, mat);
            p.position.set((Math.random() - 0.5) * 1, 1.5 + Math.random(), 2);
            p.userData = {
                parent: parentObject,
                offset: p.position.clone(),
                type: 'smoke',
                life: 3.0 + Math.random()
            };
            this.scene.add(p);
            this.particles.push({ mesh: p, velocity: new THREE.Vector3(0, 3, 0), life: p.userData.life, isAttached: true });
        }
    }

    update(delta) {
        // Update Emitters
        for (const emitter of this.emitters) {
            emitter.timer -= delta;
            if (emitter.timer <= 0) {
                if (emitter.type === 'fire') {
                    this.createFireEffect(emitter.object);
                    emitter.timer = 0.1; // Spawn every 0.1s
                } else if (emitter.type === 'smoke') {
                    this.createSmokeEffect(emitter.object);
                    emitter.timer = 0.2; // Spawn every 0.2s
                }
            }
        }

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
                if (p.isAttached) {
                    // Emitter style: Reset life if attached to simulate continuous fire?
                    // Or just float up from current position
                    // Complex. Let's make them float UP from world position, but SPAWN attached.
                    // Actually, if we want them to follow the car, they need to update position based on parent.

                    // For now: "Attached" particles spawn once and float away. 
                    // To sustain fire, caller needs to call createFireEffect repeatedly?
                    // Better: Player calls it every few frames if damaged.

                    p.velocity.y += delta * 2; // Smoke/Fire rises
                    p.mesh.position.addScaledVector(p.velocity, delta);

                    // If it was attached, we set initial position in world space based on parent
                    if (p.mesh.userData.parent && p.life > p.mesh.userData.life - 0.1) {
                        // only sync on first frame? No, we spawn them in world space.
                        // Let's just treat them as normal particles after spawn
                        const worldPos = p.mesh.userData.offset.clone();
                        worldPos.applyMatrix4(p.mesh.userData.parent.matrixWorld);
                        p.mesh.position.copy(worldPos);
                        p.isAttached = false; // Detach immediately so it leaves a trail
                    }
                } else {
                    p.velocity.y -= 20 * delta; // Gravity (sparks)
                    p.mesh.position.addScaledVector(p.velocity, delta);
                }

                p.mesh.rotation.x += delta * 5;
                p.mesh.rotation.y += delta * 5;
                p.mesh.scale.setScalar(p.life); // Shrink
            }
        }
    }
}
