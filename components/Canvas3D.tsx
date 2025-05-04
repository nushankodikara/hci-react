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
    const { updateFurnitureDimensions } = useDesignContext();
    const calculationDone = useRef(false);
    const modelGroupRef = useRef<THREE.Group>(null); // Use a separate ref for the group applying transforms
    const loadedSceneRef = useRef<THREE.Group | null>(null); // Ref for the actual loaded scene object

    useEffect(() => {
        loadedSceneRef.current = scene.clone(); // Clone scene on load
    }, [scene]);

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
        (-250 / 2 * scaleFactor) + ((item.z ?? 0) * scaleFactor), // Base on floor + Z offset
        (item.y - room.height / 2 + item.depth / 2) * scaleFactor 
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
    const wallHeight = 250; // Define a standard wall height (adjust as needed)
    const scaleFactor = 0.02; // Factor to scale room dimensions for 3D view

    const scaledWidth = room.width * scaleFactor;
    const scaledHeight = room.height * scaleFactor;
    
    // Use memoization to avoid recreating materials on every render
    const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: room.wallColor,
        side: THREE.DoubleSide, // Render both sides for visibility
        roughness: 0.8, 
        metalness: 0.1 
    }), [room.wallColor]);

    const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: '#d2b48c', // Tan color for floor
        roughness: 0.9, 
        metalness: 0 
    }), []);

    return (
        <group position={[0, -wallHeight / 2 * scaleFactor, 0]}> {/* Center room vertically */} 
            {/* Floor */}
            <Plane args={[scaledWidth, scaledHeight]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial} receiveShadow>
                {/* <meshStandardMaterial color="#cccccc" side={THREE.DoubleSide}/> */}
            </Plane>
            {/* Walls */}
            {/* Back Wall */}
            <Plane args={[scaledWidth, wallHeight * scaleFactor]} position={[0, 0, -scaledHeight / 2]} material={wallMaterial} castShadow receiveShadow />
             {/* Front Wall (Optional - often omitted for visibility) */}
             {/* <Plane args={[scaledWidth, wallHeight * scaleFactor]} position={[0, 0, scaledHeight / 2]} rotation={[0, Math.PI, 0]} material={wallMaterial} /> */}
            {/* Left Wall */}
            <Plane args={[scaledHeight, wallHeight * scaleFactor]} position={[-scaledWidth / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} castShadow receiveShadow />
            {/* Right Wall */}
            <Plane args={[scaledHeight, wallHeight * scaleFactor]} position={[scaledWidth / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial} castShadow receiveShadow />
        </group>
    );
};

// --- Camera Controller (Adjusts based on room size) ---
const CameraController = () => {
  const { camera } = useThree();
  const { room } = useDesignContext();
  const scaleFactor = 0.02;

  useEffect(() => {
    const maxDim = Math.max(room.width * scaleFactor, room.height * scaleFactor, 250 * scaleFactor); // Consider wall height too
    // Adjust position based on the largest dimension to fit room in view
    camera.position.set(0, maxDim * 0.75, maxDim * 1.5); 
    camera.far = maxDim * 5; // Set far plane based on room size
    camera.lookAt(0, 0, 0); // Look at the center
    camera.updateProjectionMatrix();
  }, [camera, room.width, room.height]);

  return null; // This component doesn't render anything itself
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
                    room={room} // Pass room data
                />
            ))}
        </Suspense>
        
        {/* Controls */}
        <OrbitControls 
            target={[0, 0, 0]} // Ensure controls target the center
            // enablePan={false} // Optional: disable panning
            // maxPolarAngle={Math.PI / 2.1} // Optional: Limit vertical rotation
        />

      </Canvas>
    </div>
  );
};

// Ensure GLTF models are loaded
// Consider preloading models for performance
// useDesignContext().availableModels.forEach(model => useGLTF.preload(model.filePath));

export default Canvas3D; 