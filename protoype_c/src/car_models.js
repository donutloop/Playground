import * as THREE from 'three';

export function createCarMesh(type = 'sedan', color = null) {
    const carGroup = new THREE.Group();

    // Default Color if not provided
    if (!color) {
        color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
    }
    const paintMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    let chassisGeom, cabinGeom;
    let chassisY = 0.5;
    let cabinY = 1.0;

    // Type Configurations
    switch (type) {
        case 'truck':
            chassisGeom = new THREE.BoxGeometry(2.2, 0.8, 5);
            cabinGeom = new THREE.BoxGeometry(2.0, 0.8, 1.5);
            chassisY = 0.8;
            cabinY = 1.6;
            break;
        case 'suv':
            chassisGeom = new THREE.BoxGeometry(2.2, 0.8, 4.5);
            cabinGeom = new THREE.BoxGeometry(2.0, 0.7, 3.0);
            chassisY = 0.7;
            cabinY = 1.45;
            break;
        case 'sport':
            chassisGeom = new THREE.BoxGeometry(2.0, 0.5, 4.2);
            cabinGeom = new THREE.BoxGeometry(1.6, 0.4, 1.8);
            chassisY = 0.4;
            cabinY = 0.85;
            break;
        case 'sedan':
        default:
            chassisGeom = new THREE.BoxGeometry(2.0, 0.6, 4.0);
            cabinGeom = new THREE.BoxGeometry(1.8, 0.6, 2.0);
            chassisY = 0.6;
            cabinY = 1.2;
            break;
    }

    // Chassis
    const chassis = new THREE.Mesh(chassisGeom, paintMat);
    chassis.position.y = chassisY;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(cabinGeom, glassMat); // Using glass mat for contrast, simplified
    cabin.position.y = cabinY;
    cabin.position.z = -0.2; // Slightly back usually
    if (type === 'truck') cabin.position.z = -1.2; // Truck cabin is forward
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12);
    wheelGeom.rotateZ(Math.PI / 2);

    const wheelPositions = [
        { x: -1, z: 1.2 }, { x: 1, z: 1.2 },
        { x: -1, z: -1.2 }, { x: 1, z: -1.2 }
    ];

    if (type === 'truck') {
        wheelPositions[0].z = 1.8; wheelPositions[1].z = 1.8;
        wheelPositions[2].z = -1.8; wheelPositions[3].z = -1.8;
    }

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(pos.x, 0.35, pos.z);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    // Lights
    const headLightGeom = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const leftHead = new THREE.Mesh(headLightGeom, lightMat);
    leftHead.position.set(-0.6, chassisY, chassisGeom.parameters.depth / 2);
    carGroup.add(leftHead);

    const rightHead = new THREE.Mesh(headLightGeom, lightMat);
    rightHead.position.set(0.6, chassisY, chassisGeom.parameters.depth / 2);
    carGroup.add(rightHead);

    const tailLightGeom = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const leftTail = new THREE.Mesh(tailLightGeom, tailMat);
    leftTail.position.set(-0.6, chassisY, -chassisGeom.parameters.depth / 2);
    carGroup.add(leftTail);

    const rightTail = new THREE.Mesh(tailLightGeom, tailMat);
    rightTail.position.set(0.6, chassisY, -chassisGeom.parameters.depth / 2);
    carGroup.add(rightTail);

    return carGroup;
}
