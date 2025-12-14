import * as THREE from 'three';

export class AirplaneSystem {
    constructor(scene, citySize) {
        this.scene = scene;
        this.citySize = citySize;
        this.airplane = null;
        // Spawn timer: start immediately for testing
        this.spawnTimer = 0;
        this.flightSpeed = 40; // Faster
        this.flightHeight = 50; // Taller
    }

    update(delta) {
        if (this.airplane) {
            this.moveAirplane(delta);
        } else {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                this.spawnAirplane();
            }
        }
    }

    spawnAirplane() {
        // Create mesh
        this.airplane = this.createAirplaneMesh();

        // Visual Range (independent of huge CitySize)
        const spawnDistance = 300;

        // Randomly choose axis: X or Z
        const axis = Math.random() > 0.5 ? 'x' : 'z';
        const direction = Math.random() > 0.5 ? 1 : -1;

        this.currentFlightData = {
            axis,
            direction,
            limit: spawnDistance + 50 // Despawn slightly after spawn point
        };

        // Position
        const range = 100; // Crosstrack variance
        const randomCrosstrack = (Math.random() - 0.5) * range;

        if (axis === 'x') {
            this.airplane.position.set(
                -direction * spawnDistance,
                this.flightHeight,
                randomCrosstrack
            );
            this.airplane.rotation.y = direction > 0 ? 0 : Math.PI;
        } else {
            this.airplane.position.set(
                randomCrosstrack,
                this.flightHeight,
                -direction * spawnDistance
            );
            this.airplane.rotation.y = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
        }

        // console.log('Spawning airplane at', this.airplane.position); // Debug
        this.scene.add(this.airplane);
    }

    moveAirplane(delta) {
        if (!this.airplane) return;

        const move = this.currentFlightData.direction * this.flightSpeed * delta;
        const limit = this.currentFlightData.limit;

        if (this.currentFlightData.axis === 'x') {
            this.airplane.position.x += move;
            // Check bounds
            if (Math.abs(this.airplane.position.x) > limit) {
                this.removeAirplane();
            }
        } else {
            this.airplane.position.z += move;
            // Check bounds
            if (Math.abs(this.airplane.position.z) > limit) {
                this.removeAirplane();
            }
        }
    }

    removeAirplane() {
        if (this.airplane) {
            this.scene.remove(this.airplane);
            this.airplane = null;
        }
        // Reset timer for next plane: 15 to 20 seconds
        this.spawnTimer = 15 + Math.random() * 5;
    }

    createAirplaneMesh() {
        const group = new THREE.Group();

        // Materials
        const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 });
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.1 });
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Fuselage
        const fuselageGeo = new THREE.CapsuleGeometry(0.8, 4, 4, 8);
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselage.rotation.z = Math.PI / 2;
        group.add(fuselage);

        // Wings
        const wingGeo = new THREE.BoxGeometry(1.5, 0.1, 8);
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0); // Centered on fuselage
        group.add(wings);

        // Tail
        const tailGeo = new THREE.BoxGeometry(1, 0.1, 3);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(-1.8, 0, 0);
        group.add(tail);

        const rudderGeo = new THREE.BoxGeometry(0.8, 1.2, 0.1);
        const rudder = new THREE.Mesh(rudderGeo, wingMat);
        rudder.position.set(-1.8, 0.6, 0);
        group.add(rudder);

        // Cockpit
        const cockpitGeo = new THREE.BoxGeometry(1, 0.6, 0.8);
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0.5, 0.5, 0);
        group.add(cockpit);

        // Lights (Blinking? Maybe later. Just static for now)
        const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), lightMat);
        leftLight.position.set(0, 0, 4);
        group.add(leftLight);

        const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        rightLight.position.set(0, 0, -4);
        group.add(rightLight);

        // Engines (Optional, simple cylinders)
        const engineGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const engineL = new THREE.Mesh(engineGeo, fuselageMat);
        engineL.rotation.z = Math.PI / 2;
        engineL.position.set(0, -0.2, 2);
        group.add(engineL);

        const engineR = new THREE.Mesh(engineGeo, fuselageMat);
        engineR.rotation.z = Math.PI / 2;
        engineR.position.set(0, -0.2, -2);
        group.add(engineR);

        // Point the whole group to face +X by default
        // Currently Fuselage is Z rotated, so length is along X.
        // Wings are along Z.
        // This seems correct for +X facing.

        return group;
    }
}
