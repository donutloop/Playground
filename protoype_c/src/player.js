import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, colliders = [], trafficSystem = null, parkingSystem = null, effectSystem = null) {
        this.camera = camera;
        this.domElement = domElement;
        this.colliders = colliders;
        this.trafficSystem = trafficSystem;
        this.parkingSystem = parkingSystem;
        this.effectSystem = effectSystem;
        this.controls = new PointerLockControls(camera, domElement);

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.isDriving = false;
        this.currentCar = null;
        this.carVelocity = 0;
        this.carSteering = 0;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.init();
    }

    init() {
        const instructions = document.createElement('div');
        instructions.style.position = 'absolute';
        instructions.style.top = '0';
        instructions.style.left = '0';
        instructions.style.width = '100%';
        instructions.style.height = '100%';
        instructions.style.display = 'flex';
        instructions.style.alignItems = 'center';
        instructions.style.justifyContent = 'center';
        instructions.style.background = 'rgba(0,0,0,0.5)';
        instructions.style.color = '#ffffff';
        instructions.style.fontSize = '24px';
        instructions.style.fontFamily = 'sans-serif';
        instructions.innerHTML = 'Click to Play';
        // DEBUG OVERLAY
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'absolute';
        debugDiv.style.bottom = '10px';
        debugDiv.style.left = '10px';
        debugDiv.style.color = '#00ff00';
        debugDiv.style.fontFamily = 'monospace';
        debugDiv.style.fontWeight = 'bold';
        debugDiv.style.fontSize = '16px';
        debugDiv.innerHTML = 'STATUS: WAITING FOR CLICK';
        document.body.appendChild(debugDiv);

        const updateDebug = (msg) => {
            debugDiv.innerHTML = msg;
            console.log(msg);
        };

        if (!('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document)) {
            instructions.innerHTML = 'Pointer Lock not supported in this browser';
            instructions.style.color = 'red';
            return;
        }

        const lock = () => {
            updateDebug('ATTEMPTING LOCK...');
            this.controls.lock();
        };

        instructions.addEventListener('click', () => {
            lock();
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            updateDebug('LOCKED - USE WASD');
        });

        this.controls.addEventListener('unlock', () => {
            instructions.style.display = 'flex';
            updateDebug('UNLOCKED - CLICK TO PLAY');
        });

        document.addEventListener('keydown', (event) => {
            // Also log key presses to see if keyboard is working
            if (this.controls.isLocked) {
                updateDebug(`KEY: ${event.code}`);
            }
            if (event.code === 'Enter') {
                lock();
            }
            this.onKeyDown(event)
        });
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'KeyE':
                if (this.isDriving) {
                    this.exitCar();
                } else {
                    this.tryEnterCar();
                }
                break;
            case 'Space':
                if (this.canJump === true) this.velocity.y += 20; // Jump force
                this.canJump = false;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update(delta) {
        if (this.controls.isLocked === true) {
            if (this.isDriving && this.currentCar) {
                this.updateCarPhysics(delta);
                return;
            }

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 5.0 * delta; // Gravity - tweaked for feel

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 150.0 * delta; // Move speed
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 150.0 * delta;

            // Apply movement step-by-step to handle collision
            const intendedX = -this.velocity.x * delta;
            const intendedZ = -this.velocity.z * delta;

            // Move X
            this.controls.moveRight(intendedX);
            if (this.checkCollision()) {
                this.controls.moveRight(-intendedX);
                this.velocity.x = 0;
            }

            // Move Z
            this.controls.moveForward(intendedZ);
            if (this.checkCollision()) {
                this.controls.moveForward(-intendedZ);
                this.velocity.z = 0;
            }

            this.camera.position.y += (this.velocity.y * delta);

            if (this.camera.position.y < 2) { // Floor height
                this.velocity.y = 0;
                this.camera.position.y = 2;
                this.canJump = true;
            }
        }
    }

    tryEnterCar() {
        const playerPos = this.camera.position;
        let closestCar = null;
        let minDistance = 5; // Interaction range

        // Check Traffic
        if (this.trafficSystem) {
            for (const car of this.trafficSystem.cars) {
                const dist = playerPos.distanceTo(car.mesh.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestCar = car;
                }
            }
        }

        // Check Parked Cars
        if (this.parkingSystem) {
            for (const carMesh of this.parkingSystem.cars) {
                const dist = playerPos.distanceTo(carMesh.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    // Wrap parked car in similar object structure if needed
                    closestCar = { mesh: carMesh, isParked: true };
                }
            }
        }

        if (closestCar) {
            this.enterCar(closestCar);
        }
    }

    enterCar(car) {
        this.isDriving = true;
        this.currentCar = car;
        car.isPlayerDriven = true; // Flag for traffic system

        // If it's a parked car, we must remove its static collider from the world
        // otherwise we will immediately collide with it.
        if (car.isParked) {
            const carBox = new THREE.Box3().setFromObject(car.mesh);
            // Find matching box in colliders
            // We use a small epsilon for float comparison or just 'intersects' and verify size
            const index = this.colliders.findIndex(box => {
                return box.intersectsBox(carBox) && box.containsBox(carBox);
            });

            if (index !== -1) {
                this.colliders.splice(index, 1);
            }
        }

        // Initial parameters
        this.carVelocity = 0;
        this.carSteering = 0;

        console.log("Entered car");
    }

    exitCar() {
        if (!this.currentCar) return;

        this.currentCar.isPlayerDriven = false;
        this.isDriving = false;

        // If it was a parked car, re-add its collider at the new position
        if (this.currentCar.isParked) {
            const newBox = new THREE.Box3().setFromObject(this.currentCar.mesh);
            this.colliders.push(newBox);
        }

        // Place player slightly to the side
        const offset = new THREE.Vector3(3, 0, 0);
        offset.applyEuler(this.currentCar.mesh.rotation);
        this.camera.position.copy(this.currentCar.mesh.position).add(offset);
        this.camera.position.y = 2; // Reset height

        this.currentCar = null;
        console.log("Exited car");
    }

    updateCarPhysics(delta) {
        if (!this.currentCar) return;

        const maxSpeed = 40;
        const acceleration = 30;
        const friction = 10;
        const turnSpeed = 2.0;

        // Acceleration
        if (this.moveForward) {
            this.carVelocity += acceleration * delta;
        } else if (this.moveBackward) {
            this.carVelocity -= acceleration * delta;
        } else {
            // Drag
            if (this.carVelocity > 0) this.carVelocity -= friction * delta;
            if (this.carVelocity < 0) this.carVelocity += friction * delta;
            // Stop creeping
            if (Math.abs(this.carVelocity) < 0.1) this.carVelocity = 0;
        }

        // Clamp speed
        this.carVelocity = Math.max(-maxSpeed / 2, Math.min(maxSpeed, this.carVelocity));

        // Steering
        if (Math.abs(this.carVelocity) > 0.1) {
            if (this.moveLeft) {
                this.currentCar.mesh.rotation.y += turnSpeed * delta * Math.sign(this.carVelocity); // Reverse steering when reversing
            }
            if (this.moveRight) {
                this.currentCar.mesh.rotation.y -= turnSpeed * delta * Math.sign(this.carVelocity);
            }
        }

        // Apply Velocity
        const forward = new THREE.Vector3(0, 0, 1); // Assuming cars face +Z or +X initially? 
        // Traffic cars: axis 'x' -> rotated Y by +/- PI/2. axis 'z' -> Y 0 or PI.
        // Standard Model Front: Usually +Z or -Z. 
        // Let's assume +Z is forward for the logic, but we need to check the model.
        // Actually, let's just use use local Z axis.
        forward.applyEuler(this.currentCar.mesh.rotation);

        // If the car model was built facing +X (as usually done in typical ThreeJS tutorials?)
        // Let's check traffic.js:
        // if axis='x', rotation is PI/2 (+X facing if 0 is +Z?). 
        // Wait, if rotation 0 is +Z, then PI/2 is +X.
        // So yes, forward vector (0,0,1) rotated by PI/2 is (1,0,0).
        // So standard forward is (0,0,1).

        this.currentCar.mesh.position.add(forward.multiplyScalar(this.carVelocity * delta));

        // Check for collisions after moving
        const crash = this.checkCarCollision();
        if (crash) {
            // Collision response
            // 1. Move back
            this.currentCar.mesh.position.add(forward.multiplyScalar(-this.carVelocity * delta));

            // 2. Trigger Effect
            if (this.effectSystem) {
                // Approximate contact point (front of car)
                const contactPoint = this.currentCar.mesh.position.clone().add(forward.multiplyScalar(2));
                this.effectSystem.createCrashEffect(contactPoint);
            }

            // 3. Stop or Bounce
            this.carVelocity = -this.carVelocity * 0.5; // Bounce back at half speed
        }

        // Update Camera to follow car
        // Third person view
        const camOffset = new THREE.Vector3(0, 5, -10); // Behind and up
        camOffset.applyEuler(this.currentCar.mesh.rotation);

        const targetPos = this.currentCar.mesh.position.clone().add(camOffset);

        // Smooth follow
        this.camera.position.lerp(targetPos, 5 * delta);
        this.camera.lookAt(this.currentCar.mesh.position);
    }

    checkCarCollision() {
        if (!this.currentCar) return false;

        const carBox = new THREE.Box3().setFromObject(this.currentCar.mesh);
        // Shrink slightly to avoid colliding with itself or weird ground issues
        carBox.expandByScalar(-0.2);

        // 1. Check Buildings (Static Colliders)
        if (this.colliders) {
            for (const box of this.colliders) {
                if (carBox.intersectsBox(box)) return true;
            }
        }

        // 2. Check Traffic
        if (this.trafficSystem) {
            for (const otherCar of this.trafficSystem.cars) {
                if (otherCar === this.currentCar) continue;
                // Simple distance check first optimization
                if (otherCar.mesh.position.distanceTo(this.currentCar.mesh.position) > 10) continue;

                const otherBox = new THREE.Box3().setFromObject(otherCar.mesh);
                if (carBox.intersectsBox(otherBox)) return true;
            }
        }

        // 3. Check Parked Cars
        if (this.parkingSystem) {
            for (const otherCar of this.parkingSystem.cars) {
                if (this.currentCar.mesh === otherCar) continue; // if we are driving a parked car
                if (otherCar.position.distanceTo(this.currentCar.mesh.position) > 10) continue;

                const otherBox = new THREE.Box3().setFromObject(otherCar);
                if (carBox.intersectsBox(otherBox)) return true;
            }
        }

        return false;
    }

    checkCollision() {
        if (!this.colliders) return false;

        const playerBox = new THREE.Box3();
        const position = this.camera.position.clone();
        // Player radius reduced to 0.2 for easier movement
        playerBox.min.set(position.x - 0.2, position.y - 0.5, position.z - 0.2);
        playerBox.max.set(position.x + 0.2, position.y + 0.5, position.z + 0.2);

        for (const collider of this.colliders) {
            if (playerBox.intersectsBox(collider)) {
                return true;
            }
        }

        if (this.trafficSystem) {
            const carBox = new THREE.Box3();
            for (const car of this.trafficSystem.cars) {
                // Moving cars need dynamic box update
                carBox.setFromObject(car.mesh);
                // Expand slightly for safety
                carBox.expandByScalar(0.2);

                if (playerBox.intersectsBox(carBox)) {
                    return true;
                }
            }
        }

        return false;
    }
}
