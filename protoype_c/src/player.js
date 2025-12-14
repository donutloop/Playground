import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, colliders = [], trafficSystem = null) {
        this.camera = camera;
        this.domElement = domElement;
        this.colliders = colliders;
        this.trafficSystem = trafficSystem;
        this.controls = new PointerLockControls(camera, domElement);

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

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
