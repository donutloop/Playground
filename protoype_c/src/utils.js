export function disposeCar(carGroup) {
    if (!carGroup) return;
    carGroup.traverse(child => {
        if (child.isMesh) {
            // Dispose Geometry? No, we reuse global cache now!
            // Dispose Material? Only if it's the unique paint material.
            // How to know? Check if it's in our global cache or just check generic properties.
            // Actually, safe way:
            // if (child.material && !child.material.isShared) ...

            // Simpler: Just rely on the fact that paintMat is the only one we create new.
            // But we don't have easy access to know which one is paintMat on the mesh.
            // We can trust JS GC if we remove from scene?
            // "Three.js materials stay in memory".
            // We need to dispose.

            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else if (child.material) {
                // HACK: Shared materials are in a closure in car_models.js, not exported.
                // But we can check names or just assume `child.material` with a specific color is the paint.
                // BETTER: In car_models.js, mark the shared materials as `userData.isShared = true`.

                if (!child.material.userData.isShared) {
                    child.material.dispose();
                }
            }
        }
    });
}
