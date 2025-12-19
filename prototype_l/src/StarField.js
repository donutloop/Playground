import * as THREE from 'three';

const vertexShader = `
uniform float time;
attribute float size;
attribute float brightness;
varying float vBrightness;

void main() {
    vBrightness = brightness;
    
    // Simple twinkle effect
    float twinkle = sin(time * 2.0 + position.x + position.y);
    vBrightness *= (0.8 + 0.4 * twinkle);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
varying float vBrightness;

void main() {
    // Circular star
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if(ll > 0.5) discard;
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, ll);
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vBrightness);
}
`;

export class StarField {
    constructor(scene) {
        this.scene = scene;
        this.initStars();
    }

    initStars() {
        const count = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        const brightness = [];

        for (let i = 0; i < count; i++) {
            // Random sphere distribution
            const r = 400 + Math.random() * 400; // Far away (400-800 units)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions.push(x, y, z);
            sizes.push(1.0 + Math.random() * 2.0);
            brightness.push(0.5 + Math.random() * 0.5);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('brightness', new THREE.Float32BufferAttribute(brightness, 1));

        this.uniforms = {
            time: { value: 0 }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false // Stars shine through fog
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    update(dt) {
        if (this.uniforms) {
            this.uniforms.time.value += dt;
        }
        // Rotate sky slowly
        if (this.stars) {
            this.stars.rotation.y += dt * 0.005;
        }
    }
}
