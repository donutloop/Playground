import * as THREE from 'three';

// --- SHADERS (Currently Unused in Debug Mode) ---

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sunFragmentShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
// Simplex Noise (Minimal)
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ; m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main() {
    float noise1 = snoise(vUv * 10.0 + time * 0.2);
    float noise2 = snoise(vUv * 25.0 - time * 0.5);
    float intensity = (noise1 * 0.7 + noise2 * 0.3); 
    intensity = intensity * 0.5 + 0.5; 
    vec3 brightColor = vec3(1.0, 0.9, 0.5); 
    vec3 darkColor = vec3(1.0, 0.3, 0.0);   
    vec3 surfaceColor = mix(darkColor, brightColor, intensity);
    gl_FragColor = vec4(surfaceColor * 5.0, 1.0); 
}
`;

export class SunSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.initSun();
    }

    initSun() {
        // DEBUG: Position closer and center
        // (0, 100, -50) should be easily visible above center
        const pos = new THREE.Vector3(0, 100, -50);

        this.group.position.copy(pos);
        this.group.lookAt(0, 0, 0);

        // 1. The Physical Sun Mesh
        const geo = new THREE.SphereGeometry(20, 32, 32);

        // DEBUG: Use Basic Material to ensure visibility NO SHADER
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            fog: false
        });

        this.sunMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.sunMesh);

        // 3. The Light Source
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.mainLight = sunLight;
        this.mainLight.position.copy(pos);
        this.mainLight.castShadow = true;

        this.mainLight.shadow.mapSize.width = 4096;
        this.mainLight.shadow.mapSize.height = 4096;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 1000;
        const d = 200;
        this.mainLight.shadow.camera.left = -d;
        this.mainLight.shadow.camera.right = d;
        this.mainLight.shadow.camera.top = d;
        this.mainLight.shadow.camera.bottom = -d;
        this.mainLight.shadow.bias = -0.00005;

        this.scene.add(this.mainLight);

        // Ambient helper
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);
    }

    createGlowTexture() {
        // Unused in Debug
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
        grad.addColorStop(0, 'rgba(255, 200, 100, 1)');
        grad.addColorStop(0.2, 'rgba(255, 100, 0, 0.5)');
        grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        // No shader update needed
    }
}
