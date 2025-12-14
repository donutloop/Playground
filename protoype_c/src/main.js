import * as THREE from 'three';
import { initScene, animate } from './scene.js';
import { createWorld } from './world.js?v=102';
import { Player } from './player.js?v=103';
import { TrafficSystem } from './traffic.js?v=102';
import { WeatherSystem } from './weather.js?v=100';
import { PedestrianSystem } from './pedestrians.js?v=100';
import { ParkingSystem } from './parking.js?v=102';
import { AirplaneSystem } from './airplanes.js';
import { EffectSystem } from './effects.js';
import { ChunkManager } from './chunk_manager.js?v=2';

let player;
let prevTime = performance.now();
let cubes = [];
let score = 0;
let scoreElement;
let trafficSystem;
let weatherSystem;
let pedestrianSystem;
let parkingSystem;
let airplaneSystem;
let effectSystem;
let chunkManager; // [NEW]

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
    // document.body.style.background = 'red'; // DEBUG: Verify JS runs
    try {
        const { scene, camera, renderer } = initScene();

        // Create World (Just lighting and metadata now)
        const worldData = await createWorld(scene);

        // Effect System
        effectSystem = new EffectSystem(scene);

        // Initialize Systems (Chunk-Aware, so they don't auto-spawn globally)
        trafficSystem = new TrafficSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);
        parkingSystem = new ParkingSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);
        pedestrianSystem = new PedestrianSystem(scene, worldData.citySize, worldData.blockSize, worldData.roadWidth);

        // Create Player
        player = new Player(camera, document.body, [], null, null, effectSystem);

        // Chunk Manager (Infinite World)
        // Pass systems so ChunkManager can trigger spawning per chunk
        chunkManager = new ChunkManager(
            scene,
            player,
            worldData,
            trafficSystem,
            parkingSystem,
            pedestrianSystem
        );
        chunkManager.update(); // Initial load

        // Update player colliders immediately
        player.colliders = chunkManager.getColliders();

        // Pass systems to Player (for interaction/collision logic)
        player.trafficSystem = trafficSystem;
        player.parkingSystem = parkingSystem;

        // Weather
        weatherSystem = new WeatherSystem(scene, worldData.directionalLight, worldData.ambientLight, worldData.materials);

        // Airplanes
        airplaneSystem = new AirplaneSystem(scene, worldData.citySize);
        window.airplaneSystem = airplaneSystem; // Debug: Expose to console

        console.log('Game Initialized with Infinite World + Populated Chunks');

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

        // Version Indicator to debug cache issues
        const verDiv = document.createElement('div');
        verDiv.style.position = 'absolute';
        verDiv.style.top = '10px';
        verDiv.style.right = '10px';
        verDiv.style.color = 'white';
        verDiv.style.background = 'rgba(0,0,0,0.5)';
        verDiv.style.padding = '5px';
        verDiv.style.fontFamily = 'monospace';
        verDiv.innerHTML = 'v4.2 - AIR TRAFFIC CONTROL';
        document.body.appendChild(verDiv);

        animate(() => {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;

            if (player) player.update(delta);
            if (trafficSystem) trafficSystem.update(delta);
            if (weatherSystem) weatherSystem.update(delta);
            if (pedestrianSystem) pedestrianSystem.update(delta);
            if (airplaneSystem) airplaneSystem.update(delta);

            if (chunkManager) {
                chunkManager.update();
                // Update player colliders continuously as chunks load/unload
                if (player) {
                    player.colliders = chunkManager.getColliders();
                }
            }

            // Update Effects
            if (player && player.effectSystem) player.effectSystem.update(delta); // Update effects

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

            if (cubes.length === 0 && score > 0) {
                // Only show win if we actually played and cleared cubes
                // For infinite world, we might never "win"
                // scoreElement.innerHTML = `You Win! Final Score: ${score}`;
                // scoreElement.style.color = '#00ff00';
            }

            prevTime = time;
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}
init();
