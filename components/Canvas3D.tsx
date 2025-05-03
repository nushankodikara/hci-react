'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment } from '@react-three/drei';
import { useDesignContext } from '@/context/DesignContext'; // Import context hook

// Component to load and display a single GLTF model
interface ModelProps {
    path: string;
    position?: [number, number, number];
    rotationY?: number;
    scale?: number;
}

function Model({ path, position = [0,0,0], rotationY = 0, scale = 1 }: ModelProps) {
    // useGLTF handles loading and caching
    const { scene } = useGLTF(path);
    // Note: You might need to clone the scene if using it multiple times
    // const clonedScene = scene.clone(); 
    return <primitive 
        object={scene} 
        position={position}
        rotation={[0, rotationY, 0]} // Assuming Y is the up-axis for rotation control
        scale={scale}
    />;
}

// Preload models for better performance
// availableModels.forEach(model => useGLTF.preload(model.filePath)); // Cannot run hooks here

const Canvas3D: React.FC = () => {
  const { furniture, room } = useDesignContext(); // Get furniture list from context

  // Preload models - best done where useDesignContext is available
  // and where it won't cause re-renders, maybe in a useEffect in the provider or page
  // furniture.forEach(item => useGLTF.preload(item.modelPath)); 

  return (
    <div className="w-full h-full bg-gray-200 border border-gray-400">
      <Canvas camera={{ position: [0, room.height / 200, room.width / 100], fov: 50 }}> {/* Adjust camera based on room */}
        {/* Lighting */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 15, 5]} intensity={1} />
        <Environment preset="city" /> {/* Add environment lighting */}

        {/* Floor Plane (Optional visualization) */}
        {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}> 
          <planeGeometry args={[room.width / 50, room.height / 50]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh> */}

        {/* Render furniture models from context */}
        <Suspense fallback={null}> {/* Suspense needed for useGLTF */}
           {furniture.map((item) => (
                <Model 
                    key={item.id} 
                    path={item.modelPath} 
                    position={[item.x - room.width / 2, item.z ?? 0, item.y - room.height / 2]} // Center origin in 3D space
                    rotationY={item.rotationY}
                    scale={item.scale}
                />
            ))}
        </Suspense>
        
        {/* Controls */}
        <OrbitControls />

      </Canvas>
    </div>
  );
};

// Ensure GLTF models are loaded
// Consider preloading models for performance
// useDesignContext().availableModels.forEach(model => useGLTF.preload(model.filePath));


export default Canvas3D; 