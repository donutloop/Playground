import * as THREE from 'three';

export function deformMesh(mesh, impactPoint, radius = 1.0, strength = 0.5) {
    if (!mesh.geometry) return;

    // Ensure geometry works with vertex manipulation
    // If it's a primitive BufferGeometry (like BoxGeometry), we can modify position attribute directly.

    const positions = mesh.geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const localImpact = impactPoint.clone();
    mesh.worldToLocal(localImpact); // Convert impact to local space

    let damaged = false;

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);

        const dist = vertex.distanceTo(localImpact);

        if (dist < radius) {
            // Apply deformation: push vertex inward/randomly
            // 1. Direction from impact to vertex
            const direction = vertex.clone().sub(localImpact).normalize();

            // 2. Random variation to look like crumpled metal
            const noise = (Math.random() - 0.5) * strength;

            // 3. Push vertex
            // We want a "dent", so usually push AWAY from impact force (in direction of impact velocity)
            // But here we just simulate "crumple" by adding noise and contracting slightly towards center of damage

            vertex.addScaledVector(direction, -strength * (1 - dist / radius)); // Dent IN towards impact center? No, that pulls.
            // Let's just randomize it heavily within radius

            vertex.x += (Math.random() - 0.5) * strength;
            vertex.y += (Math.random() - 0.5) * strength;
            vertex.z += (Math.random() - 0.5) * strength;

            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            damaged = true;
        }
    }

    if (damaged) {
        positions.needsUpdate = true;
        mesh.geometry.computeVertexNormals(); // Re-calculate lighting
    }
}
