import * as THREE from 'three';

const geomCache = {
    // Shared
    wheel: new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12).rotateZ(Math.PI / 2),
    headLight: new THREE.BoxGeometry(0.4, 0.2, 0.1),
    tailLight: new THREE.BoxGeometry(0.4, 0.2, 0.1),

    // Per Type (Lazy init)
    sedan: { chassis: new THREE.BoxGeometry(2.0, 0.6, 4.0), cabin: new THREE.BoxGeometry(1.8, 0.6, 2.0) },
    suv: { chassis: new THREE.BoxGeometry(2.2, 0.8, 4.5), cabin: new THREE.BoxGeometry(2.0, 0.7, 3.0) },
    truck: { chassis: new THREE.BoxGeometry(2.2, 0.8, 5), cabin: new THREE.BoxGeometry(2.0, 0.8, 1.5) },
    sport: { chassis: new THREE.BoxGeometry(2.0, 0.5, 4.2), cabin: new THREE.BoxGeometry(1.6, 0.4, 1.8) }
};

const matCache = {
    glass: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8 }),
    wheel: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }),
    light: new THREE.MeshBasicMaterial({ color: 0xffffcc }),
    tail: new THREE.MeshBasicMaterial({ color: 0xff0000 })
};
Object.values(matCache).forEach(m => m.userData.isShared = true);

export function createCarMesh(type = 'sedan', color = null) {
    const carGroup = new THREE.Group();

    // Default Color if not provided
    if (!color) {
        color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
    }
    // Unique paint material (Must be disposed later!)
    const paintMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.6 });

    // Shared materials
    const glassMat = matCache.glass;
    const wheelMat = matCache.wheel;
    const lightMat = matCache.light;
    const tailMat = matCache.tail;

    let chassisGeom, cabinGeom;
    let chassisY = 0.5;
    let cabinY = 1.0;

    const geoms = geomCache[type] || geomCache.sedan;
    chassisGeom = geoms.chassis;
    cabinGeom = geoms.cabin;

    // Type Configurations for Y positions
    switch (type) {
        case 'truck': chassisY = 0.8; cabinY = 1.6; break;
        case 'suv': chassisY = 0.7; cabinY = 1.45; break;
        case 'sport': chassisY = 0.4; cabinY = 0.85; break;
        case 'sedan': default: chassisY = 0.6; cabinY = 1.2; break;
    }

    // Chassis
    const chassis = new THREE.Mesh(chassisGeom, paintMat);
    chassis.position.y = chassisY;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.y = cabinY;
    cabin.position.z = -0.2;
    if (type === 'truck') cabin.position.z = -1.2;
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Wheels - Reuse Geom
    const wheelPositions = [
        { x: -1, z: 1.2 }, { x: 1, z: 1.2 },
        { x: -1, z: -1.2 }, { x: 1, z: -1.2 }
    ];

    if (type === 'truck') {
        wheelPositions[0].z = 1.8; wheelPositions[1].z = 1.8;
        wheelPositions[2].z = -1.8; wheelPositions[3].z = -1.8;
    }

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(geomCache.wheel, wheelMat);
        wheel.position.set(pos.x, 0.35, pos.z);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    // Lights - Reuse Geoms
    const leftHead = new THREE.Mesh(geomCache.headLight, lightMat);
    leftHead.position.set(-0.6, chassisY, chassisGeom.parameters.depth / 2);
    carGroup.add(leftHead);

    const rightHead = new THREE.Mesh(geomCache.headLight, lightMat);
    rightHead.position.set(0.6, chassisY, chassisGeom.parameters.depth / 2);
    carGroup.add(rightHead);

    const leftTail = new THREE.Mesh(geomCache.tailLight, tailMat);
    leftTail.position.set(-0.6, chassisY, -chassisGeom.parameters.depth / 2);
    carGroup.add(leftTail);

    const rightTail = new THREE.Mesh(geomCache.tailLight, tailMat);
    rightTail.position.set(0.6, chassisY, -chassisGeom.parameters.depth / 2);
    carGroup.add(rightTail);

    return carGroup;
}
