import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.speed = 40; // DOUBLED SPEED for fast feeling
        this.score = 0;

        // Player state
        this.player = null;
        this.targetX = 0;

        // Terrain state
        this.gridPlanes = [];
        this.chunkSize = 100;

        this.particles = null;
        this.onGameOver = null;
    }

    setParticleSystem(system) {
        this.particles = system;
    }

    init() {
        this._createPlayer();
        this._createInfiniteGrid();
        this._setupInput();
    }

    _createPlayer() {
        const group = new THREE.Group();

        // 1. Sleek Chassis (Wedge shape via scaled Cone/Box)
        // Main Body - Long and low
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.2, 2.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x050505, // Dark Carbon
            roughness: 0.1,
            metalness: 0.9
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.3;
        group.add(body);

        // Nose Cone (Aerodynamic front)
        const noseGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.x = Math.PI / 2;
        nose.rotation.y = Math.PI / 4; // Flat side down
        nose.position.set(0, 0.3, -1.5);
        nose.scale.z = 0.5; // Flatten it
        group.add(nose);

        // Cockpit (Streamlined bubble)
        const cabinGeo = new THREE.BoxGeometry(0.4, 0.15, 1.2);
        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1.0,
            roughness: 0.0,
            emissive: 0x00f3ff,
            emissiveIntensity: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 0.5, -0.2);
        cabin.scale.z = 0.8; // Tapered look logic handled by geometry mostly
        group.add(cabin);

        // Spoiler (High downforce)
        const spoilerGeo = new THREE.BoxGeometry(1.0, 0.05, 0.4);
        const spoilerMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 0.8 });
        const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        spoiler.position.set(0, 0.7, 1.1);
        group.add(spoiler);

        // Spoiler struts
        const strutGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const strutL = new THREE.Mesh(strutGeo, bodyMat);
        strutL.position.set(-0.3, 0.55, 1.1);
        group.add(strutL);
        const strutR = new THREE.Mesh(strutGeo, bodyMat);
        strutR.position.set(0.3, 0.55, 1.1);
        group.add(strutR);

        // Rear Engine Exhausts (Double)
        const exhaustGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.4, 8);
        const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

        const exhaustL = new THREE.Mesh(exhaustGeo, exhaustMat);
        exhaustL.rotation.x = Math.PI / 2;
        exhaustL.position.set(-0.2, 0.35, 1.4);
        group.add(exhaustL);

        const exhaustR = new THREE.Mesh(exhaustGeo, exhaustMat);
        exhaustR.rotation.x = Math.PI / 2;
        exhaustR.position.set(0.2, 0.35, 1.4);
        group.add(exhaustR);

        // GLOWING WHEELS (Tron Cycle style)
        // Two big rear, two smaller front? Or just 4 sleek ones.
        const wheelGeo = new THREE.TorusGeometry(0.25, 0.08, 8, 24);
        const wheelMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

        const wheelPositions = [
            [-0.4, 0.25, -0.8], [0.4, 0.25, -0.8], // Front
            [-0.45, 0.3, 1.0], [0.45, 0.3, 1.0]     // Rear (Staggered)
        ];

        wheelPositions.forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.y = Math.PI / 2;
            w.position.set(...pos);
            group.add(w);
        });

        this.player = group;
        this.player.position.y = 1;
        this.player.position.z = 5;
        this.scene.add(this.player);
    }

    _createInfiniteGrid() {
        // We use two planes to leapfrog each other
        const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, 50, 50);

        // Custom transparent material for that synthwave grid look
        // We'll use a hacky wireframe over solid for now to keep it simple but effective
        const material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8,
            metalness: 0.1
        });

        for (let i = 0; i < 2; i++) {
            const group = new THREE.Group();

            // Solid dark floor
            const floor = new THREE.Mesh(geometry, material);
            group.add(floor);

            // Glowing Grid
            // Using BoxHelper or WireframeGeometry to get lines
            const wireframe = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry),
                new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3 })
            );
            // Fix wireframe z-fighting
            wireframe.position.z = 0.01;
            group.add(wireframe);

            group.rotation.x = -Math.PI / 2;
            group.position.z = -i * this.chunkSize;

            this.scene.add(group);
            this.gridPlanes.push(group);
        }
    }

    _setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.targetX = -3;
            if (e.key === 'ArrowRight' || e.key === 'd') this.targetX = 3;
            if (e.key === 'ArrowDown' || e.key === 's') this.targetX = 0; // Center
        });

        document.addEventListener('keyup', (e) => {
            // Optional: Return to center on release? Maybe not for lanes.
        });
    }

    update(dt, time) {
        // Move Grid
        this.gridPlanes.forEach(plane => {
            plane.position.z += this.speed * dt;
            if (plane.position.z > this.chunkSize) {
                plane.position.z -= this.chunkSize * 2;
            }
        });

        // Update Player movement (Smooth lerp)
        if (this.player) {
            this.player.position.x += (this.targetX - this.player.position.x) * 5 * dt;

            // Banking effect
            this.player.rotation.z = -(this.player.position.x - this.targetX) * 0.1;

            // Floating effect
            this.player.position.y = 1 + Math.sin(time * 3) * 0.1;

            // Emit particles
            if (this.particles) {
                // Find exhaust positions from the group structure
                // Logic: Exhausts are children index 5 and 6 (approx based on order but fragile)
                // Better: rely on world positions relative to player

                const leftExhaust = new THREE.Vector3(-0.2, 0.35, 1.4);
                const rightExhaust = new THREE.Vector3(0.2, 0.35, 1.4);

                leftExhaust.applyMatrix4(this.player.matrixWorld);
                rightExhaust.applyMatrix4(this.player.matrixWorld);

                // Add jitter
                leftExhaust.x += (Math.random() - 0.5) * 0.1;
                leftExhaust.y += (Math.random() - 0.5) * 0.1;
                leftExhaust.z += (Math.random() - 0.5) * 0.1;

                rightExhaust.x += (Math.random() - 0.5) * 0.1;
                rightExhaust.y += (Math.random() - 0.5) * 0.1;
                rightExhaust.z += (Math.random() - 0.5) * 0.1;

                this.particles.emit(leftExhaust, 0x00f3ff);
                this.particles.emit(rightExhaust, 0x00f3ff);
            }
        }

        // Update score
        this.score += this.speed * dt;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = 'SCORE: ' + Math.floor(this.score).toString().padStart(5, '0');

        this._updateObstacles(dt, time);
        this._checkCollisions();
    }

    _updateObstacles(dt, time) {
        // Spawn logic
        if (Math.random() < 0.05) { // 5% chance per frame? Maybe too high for 60fps, let's try.
            this._spawnObstacle();
        }

        // Move and cleanup objects
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.position.z += this.speed * dt;

            // Rotate obstacles for fun
            obj.rotation.x += dt;
            obj.rotation.y += dt;

            if (obj.position.z > 20) { // Passed camera
                this.scene.remove(obj);
                this.objects.splice(i, 1);
            }
        }
    }

    _spawnObstacle() {
        if (this.objects.length > 10) return; // Limit count

        // Spawn at random lane
        const lanes = [-3, 0, 3];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        const type = Math.random() > 0.5 ? 'box' : 'pyramid';
        let mesh;

        if (type === 'box') {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
            mesh = new THREE.Mesh(geo, mat);
        } else {
            const geo = new THREE.ConeGeometry(0.8, 1.5, 4);
            const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8 });
            mesh = new THREE.Mesh(geo, mat);
        }

        mesh.position.set(lane, 1, -50); // Spawn far away
        this.scene.add(mesh);
        this.objects.push(mesh);
    }

    _checkCollisions() {
        if (!this.player) return;

        const playerBox = new THREE.Box3().setFromObject(this.player);
        // Shrink check box slightly to be forgiving
        playerBox.expandByScalar(-0.2);

        for (const obj of this.objects) {
            const objBox = new THREE.Box3().setFromObject(obj);
            if (playerBox.intersectsBox(objBox)) {
                // console.log("CRASH!");
                this.score = 0;
                if (this.onGameOver) this.onGameOver();
            }
        }
    }
}
