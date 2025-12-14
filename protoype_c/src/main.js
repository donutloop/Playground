import * as THREE from 'three';
import { initScene, animate } from './scene.js';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { TrafficSystem } from './traffic.js?v=26';
import { WeatherSystem } from './weather.js';
import { PedestrianSystem } from './pedestrians.js';
import { ParkingSystem } from './parking.js?v=27';

let player;
let prevTime = performance.now();
let cubes = [];
let score = 0;
let scoreElement;
let trafficSystem;
let weatherSystem;
let pedestrianSystem;
let parkingSystem;

function initScore() {
    scoreElement = document.createElement('div');
    scoreElement.style.position = 'absolute';
    scoreElement.style.top = '20px';
    scoreElement.style.left = '20px';
    scoreElement.style.color = '#fff';
    scoreElement.style.fontSize = '24px';
    scoreElement.style.fontFamily = 'monospace';
    scoreElement.innerHTML = 'Score: 0';
    document.body.appendChild(scoreElement);
}

window.addEventListener('error', (e) => {
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'absolute';
    errorMsg.style.top = '10px';
    errorMsg.style.left = '10px';
    errorMsg.style.color = 'red';
    errorMsg.style.background = 'rgba(0,0,0,0.8)';
    errorMsg.style.padding = '10px';
    errorMsg.textContent = `Error: ${e.message}`;
    document.body.appendChild(errorMsg);
});

async function init() {
    initScore();
    try {
        const { scene, camera, renderer } = initScene();

        // Setup Fog for atmosphere
        scene.fog = new THREE.FogExp2(0x111111, 0.01);

        const worldData = await createWorld(scene);
        cubes = worldData.cubes;

        trafficSystem = new TrafficSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);

        weatherSystem = new WeatherSystem(scene, worldData.directionalLight, worldData.ambientLight, worldData.materials);

        pedestrianSystem = new PedestrianSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);

        parkingSystem = new ParkingSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);

        player = new Player(camera, renderer.domElement, worldData.colliders);
        // Start player on the road to avoid being stuck in an alley
        player.camera.position.set(12, 2, 12);

        // Weather Controls
        window.addEventListener('keydown', (e) => {
            if (weatherSystem) { // Safety check
                if (e.key === '1') weatherSystem.setSunny();
                if (e.key === '2') weatherSystem.setRain();
                if (e.key === '3') weatherSystem.setSnow();
            }
        });

        // Instructions for weather
        const weatherInfo = document.createElement('div');
        weatherInfo.style.position = 'absolute';
        weatherInfo.style.top = '20px';
        weatherInfo.style.right = '20px';
        weatherInfo.style.color = '#fff';
        weatherInfo.style.fontFamily = 'monospace';
        weatherInfo.innerHTML = '[1] Sunny [2] Rain [3] Snow';
        document.body.appendChild(weatherInfo);

        animate(() => {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;

            if (player) player.update(delta);
            if (trafficSystem) trafficSystem.update(delta);
            if (weatherSystem) weatherSystem.update(delta);
            if (pedestrianSystem) pedestrianSystem.update(delta);

            // Simple collision detection
            if (player && cubes.length > 0) {
                const playerPos = player.camera.position;
                for (let i = cubes.length - 1; i >= 0; i--) {
                    const cube = cubes[i];
                    const distance = playerPos.distanceTo(cube.position);

                    // Rotate cube for visual effect
                    cube.rotation.x += delta;
                    cube.rotation.y += delta;

                    if (distance < 2) {
                        // Collect
                        scene.remove(cube);
                        cubes.splice(i, 1);
                        score += 10;
                        scoreElement.innerHTML = `Score: ${score}`;
                    }
                }
            }

            if (cubes.length === 0) {
                scoreElement.innerHTML = `You Win! Final Score: ${score}`;
                scoreElement.style.color = '#00ff00';
            }

            prevTime = time;
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}

init();
