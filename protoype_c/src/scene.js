import * as THREE from 'three';


let scene, camera, renderer, controls;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Darker background usually looks more premium initialy
    scene.fog = new THREE.FogExp2(0x111111, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

    // Tone mapping for realistic lighting
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    document.getElementById('app').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    return { scene, camera, renderer };
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function animate(updateCallback) {
    requestAnimationFrame(() => animate(updateCallback));
    if (updateCallback) updateCallback();
    renderer.render(scene, camera);
}
