'use client';

import React, { Suspense, useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignContext, FurnitureItem, RoomData } from '@/context/DesignContext';

// Component to load and display a single GLTF model
interface ModelProps {
    item: FurnitureItem;
    scaleFactor: number;
    room: RoomData; // Pass room data for positioning calculation
}

const TARGET_MAX_DIMENSION_3D = 2.5; // Target size for normalization in 3D view
const MIN_FOOTPRINT_DIMENSION_2D = 1.0; // Minimum width/depth for 2D representation

function Model({ item, scaleFactor, room }: ModelProps) {
    const { scene } = useGLTF(item.modelPath);
    const { updateFurnitureDimensions, updateFurniture } = useDesignContext();
    const calculationDone = useRef(false);
    const modelGroupRef = useRef<THREE.Group>(null);
    const loadedSceneRef = useRef<THREE.Group | null>(null);

    useEffect(() => {
        const cloned = scene.clone();
        loadedSceneRef.current = cloned;
        // Initial color setup when model (scene) changes or HSL values are first defined
        // This attempts to set the originalColorHex if not already set.
        if (cloned && !item.originalColorHex && (item.hue !== undefined || item.saturation !== undefined || item.lightness !== undefined)) {
            let initialColorSet = false;
            cloned.traverse((child) => {
                if (!initialColorSet && child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    const originalColor = child.material.color.getHexString();
                    updateFurniture(item.id, { originalColorHex: `#${originalColor}` });
                    initialColorSet = true; // Set for the first material found
                }
            });
        }
    }, [scene, item.id, updateFurniture]); // Depend on scene to re-clone if modelPath changes

    // Effect for HSL adjustments
    useEffect(() => {
        if (loadedSceneRef.current && (item.hue !== undefined || item.saturation !== undefined || item.lightness !== undefined)) {
            const sceneToUpdate = loadedSceneRef.current;
            sceneToUpdate.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    const material = child.material as THREE.MeshStandardMaterial; // Type assertion
                    let baseColor = new THREE.Color();

                    if (item.originalColorHex) {
                        try {
                            baseColor.set(item.originalColorHex);
                        } catch (e) {
                            console.warn("Invalid originalColorHex, defaulting to material color or white", e);
                            baseColor.copy(material.color); // Fallback to current material color
                        }
                    } else {
                        // If originalColorHex is still not set (e.g., first adjustment before context update completes)
                        // For safety, clone the material's current color to avoid direct mutation before original is stored.
                        baseColor.copy(material.color);
                        // Attempt to store it now, but this might be slightly racy if many updates happen fast.
                        // The earlier effect is better for initial storage.
                        if (!item.originalColorHex) { // Double check
                             updateFurniture(item.id, { originalColorHex: `#${material.color.getHexString()}` });
                        }
                    }

                    const h = (item.hue ?? 0) / 360;
                    const s = item.saturation ?? 1.0; // Default to full saturation if undefined
                    const l = item.lightness ?? 0.5; // Default to mid lightness if undefined
                    
                    const newColor = new THREE.Color();
                    newColor.copy(baseColor); // Start from base
                    newColor.setHSL(h, s, l);
                    
                    material.color.set(newColor);
                    // material.needsUpdate = true; // Often not needed with R3F state driving re-renders
                }
            });
        }
    }, [item.hue, item.saturation, item.lightness, item.originalColorHex, item.id, updateFurniture]); // Re-run if HSL or originalColorHex changes

    useEffect(() => {
        // Check if scene is cloned, ref exists, calculation not done, and dimensions are placeholders
        if (loadedSceneRef.current && modelGroupRef.current && !calculationDone.current && item.width === 50 && item.depth === 50) {
             try {
                 // Apply initial scale before measuring for accuracy if normalizedScale is placeholder
                 if (item.normalizedScale === 1) {
                    modelGroupRef.current.scale.set(1, 1, 1);
                 }
                 modelGroupRef.current.updateMatrixWorld(true); // Ensure world matrix is up-to-date

                 const box = new THREE.Box3().setFromObject(modelGroupRef.current, true);
                 const size = new THREE.Vector3();
                 box.getSize(size);

                 if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) {
                     const maxDim = Math.max(size.x, size.y, size.z);
                     let normalizedScale = 1;
                     if (maxDim > 0) {
                         normalizedScale = TARGET_MAX_DIMENSION_3D / maxDim;
                     }
                     
                     // Calculate original dimensions before normalization
                     const originalWidth = size.x; 
                     const originalDepth = size.z;
                     const originalHeight = size.y;

                     // Enforce minimum footprint for 2D representation
                     const finalFootprintWidth = Math.max(originalWidth, MIN_FOOTPRINT_DIMENSION_2D);
                     const finalFootprintDepth = Math.max(originalDepth, MIN_FOOTPRINT_DIMENSION_2D);

                     console.log(`Calculated dims for ${item.modelName || item.id}:`, 
                        { originalWidth, originalDepth, originalHeight, normalizedScale, finalFootprintWidth, finalFootprintDepth }
                     );

                     updateFurnitureDimensions(item.id, {
                         width: finalFootprintWidth,  // Store potentially enforced min width
                         depth: finalFootprintDepth,  // Store potentially enforced min depth
                         height: originalHeight,      // Store original height
                         normalizedScale: normalizedScale, // Store scale based on *original* maxDim
                     });
                     calculationDone.current = true;
                 } else {
                     console.warn(`Invalid size calculated for model ${item.modelName || item.id}:`, size);
                 }
             } catch (error) {
                 console.error(`Error calculating bounding box for ${item.modelName || item.id}:`, error);
             }
        }
        // Mark as done if dimensions are not placeholders
        else if (item.width !== 50 || item.depth !== 50) {
            calculationDone.current = true;
        }
    }, [
        scene, 
        item.id, 
        item.modelName, 
        item.width, 
        item.depth, 
        item.normalizedScale,
        updateFurnitureDimensions
    ]);

    // Final scale combines calculated normalization and user scale
    const finalScale = (item.normalizedScale ?? 1) * (item.scale ?? 1);
    
    // Center the item based on its *calculated* dimensions from context
    // Position relative to the center of the 3D room floor plane
    const position3D: [number, number, number] = [
        (item.x - room.width / 2 + item.width / 2) * scaleFactor, 
        (item.z ?? 0) * scaleFactor, 
        (item.y - room.length / 2 + item.depth / 2) * scaleFactor 
    ];

    // Render only if the scene is loaded
    if (!loadedSceneRef.current) {
        return null; // Or a placeholder/loader
    }

    return (
        <group 
            ref={modelGroupRef} 
            position={position3D} 
            rotation={[0, item.rotationY ?? 0, 0]} 
            scale={finalScale}
        >
            <primitive 
                object={loadedSceneRef.current} 
                castShadow receiveShadow 
            />
        </group>
    );
}

// Preload models for better performance
// availableModels.forEach(model => useGLTF.preload(model.filePath)); // Cannot run hooks here

// --- Room Component --- 
const RoomGeometry = () => {
    const { room } = useDesignContext();
    const wallHeight = room.wallHeight || 250; 
    const scaleFactor = 0.02;
    const scaledWidth = room.width * scaleFactor;
    const scaledLength = room.length * scaleFactor;
    const scaledWallHeight = wallHeight * scaleFactor;
    
    // Revert wall material side to default (FrontSide)
    const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: room.wallColor, 
        roughness: 0.8, 
        metalness: 0.1 
    }), [room.wallColor]);

    // Floor material implicitly uses FrontSide (default)
    const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: '#d2b48c', roughness: 0.9, metalness: 0 
    }), []);

    return (
        <group position={[0, 0, 0]}>
            {/* Floor */}
            <Plane args={[scaledWidth, scaledLength]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial} receiveShadow />
            {/* Walls */}
            <Plane args={[scaledWidth, scaledWallHeight]} position={[0, scaledWallHeight / 2, -scaledLength / 2]} material={wallMaterial} castShadow receiveShadow />
            <Plane args={[scaledLength, scaledWallHeight]} position={[-scaledWidth / 2, scaledWallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} castShadow receiveShadow />
            <Plane args={[scaledLength, scaledWallHeight]} position={[scaledWidth / 2, scaledWallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial} castShadow receiveShadow />
            <Plane args={[scaledWidth, scaledWallHeight]} position={[0, scaledWallHeight / 2, scaledLength / 2]} rotation={[0, Math.PI, 0]} material={wallMaterial} castShadow receiveShadow/>
        </group>
    );
};

// --- Camera Controller (Update to use length) ---
const CameraController = () => {
  const { camera } = useThree();
  const { room } = useDesignContext();
  const scaleFactor = 0.02;

  useEffect(() => {
    const scaledWidth = room.width * scaleFactor;
    const scaledLength = room.length * scaleFactor; // Use length
    const scaledWallHeight = (room.wallHeight || 250) * scaleFactor; // Use wallHeight
    
    // Base camera position on max horizontal dimension + height
    const maxHorizontal = Math.max(scaledWidth, scaledLength);
    const cameraDistance = maxHorizontal * 1.8; // Adjust multiplier as needed
    const cameraHeight = scaledWallHeight * 1.5; // Position above wall height

    camera.position.set(0, cameraHeight, cameraDistance); 
    camera.far = cameraDistance * 3; // Adjust far plane based on distance
    camera.lookAt(0, scaledWallHeight * 0.2 , 0); // Look slightly down towards center of room space
    camera.updateProjectionMatrix();

  }, [camera, room.width, room.length, room.wallHeight]); // Update dependencies

  return null; 
};

// --- Main 3D Canvas --- 
const Canvas3D: React.FC = () => {
  const { furniture, room } = useDesignContext();
  const scaleFactor = 0.02;

  return (
    <div className="w-full h-full bg-gradient-to-br from-sky-100 to-slate-200 border border-slate-300"> {/* Nicer Background */}
      <Canvas shadows camera={{ fov: 50 }}> {/* Enable shadows */}
        <CameraController /> {/* Add camera controller */} 
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight 
            position={[15, 20, 10]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize-width={1024} // Improve shadow quality
            shadow-mapSize-height={1024}
        />
        <Environment preset="city" />
        
        {/* Room Geometry */}
        <RoomGeometry />
        
        {/* Render furniture models from context */}
        <Suspense fallback={null}> 
           {furniture.map((item) => (
                <Model 
                    key={item.id} 
                    item={item} 
                    scaleFactor={scaleFactor}
                    room={room} // Pass updated room object
                />
            ))}
        </Suspense>
        
        {/* Controls */}
        <OrbitControls 
            target={[0, (room.wallHeight || 250) * scaleFactor * 0.3, 0]} /* Adjust target based on wall height */
        />

      </Canvas>
    </div>
  );
};

// Ensure GLTF models are loaded
// Consider preloading models for performance
// useDesignContext().availableModels.forEach(model => useGLTF.preload(model.filePath));

export default Canvas3D; 