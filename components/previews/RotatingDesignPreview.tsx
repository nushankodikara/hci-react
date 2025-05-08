'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Define a basic structure for room and furniture data
// This should ideally match or be derived from your DesignState context
interface RoomData {
  width: number;
  depth: number;
  height: number;
  // color?: string; // Optional: if you want to pass room color
}

interface FurnitureItem {
  id: string | number;
  type: 'sofa' | 'table' | 'chair' | 'lamp' | 'generic'; // Example types
  x: number;
  y: number; // Ground y-position
  z: number;
  width: number;
  height: number;
  depth: number;
  modelPath?: string; // Path to the GLB/GLTF model
  scale?: number; // Overall scale for the model
  rotationY?: number; // Rotation for the model
  // modelUrl?: string; // Future: path to 3D model
  // color?: string;    // Optional: specific color for this item
}

interface RotatingDesignPreviewProps {
  roomData: RoomData; 
  furnitureData: FurnitureItem[];
}

// Component to load and display a single furniture model
const FurnitureModel: React.FC<{ item: FurnitureItem }> = ({ item }) => {
  if (!item.modelPath) {
    // Fallback to Box if no modelPath is provided
    return (
      <Box args={[item.width, item.height, item.depth]} position={[0, item.height / 2, 0]}>
        <meshStandardMaterial color={item.type === 'sofa' ? '#8B4513' : item.type === 'table' ? '#A0522D' : '#D2B48C'} />
      </Box>
    );
  }

  // Preload the model - helps with initial display
  useGLTF.preload(item.modelPath);
  const { scene } = useGLTF(item.modelPath);

  // Clone the scene to avoid issues if the same model is used multiple times
  const clonedScene = scene.clone();

  return (
    <primitive 
      object={clonedScene} 
      scale={item.scale || 1} 
      rotation-y={item.rotationY || 0}
      // Position is handled by the parent group in SceneContent
    />
  );
};

const SceneContent: React.FC<RotatingDesignPreviewProps> = ({ roomData, furnitureData }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Basic rotation animation
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3; // Slightly slower rotation
    }
  });

  // Calculate room center for positioning furniture relative to it
  const roomCenterOffset = { x: 0, y: -roomData.height / 2, z: 0 }; 

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      <hemisphereLight args={[0x888888, 0x444444, 0.6]} />

      <group ref={groupRef}>
        {/* Room Placeholder (transparent box) */}
        <Box args={[roomData.width, roomData.height, roomData.depth]} position={[0, 0, 0]}>
          <meshStandardMaterial transparent opacity={0.08} color="#888" />
        </Box>

        {/* Furniture Placeholders */}
        {furnitureData.map((item) => {
          const itemBaseYPosition = roomCenterOffset.y + item.y;
          return (
            <group key={item.id} position={[item.x + roomCenterOffset.x, itemBaseYPosition, item.z + roomCenterOffset.z]}>
              <Suspense fallback={
                <Html center>
                  <div style={{ color: 'white', fontSize: '0.5rem' }}>Loading...</div>
                </Html>
              }>
                <FurnitureModel item={item} />
              </Suspense>
            </group>
          );
        })}
      </group>
      
      <OrbitControls 
        enableZoom={true} // Allow zoom for closer inspection in previews
        enablePan={true}
        minDistance={Math.min(roomData.width, roomData.depth) * 0.5} // Adjust min distance based on room size
        maxDistance={Math.max(roomData.width, roomData.depth) * 3}   // Adjust max distance
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.1}
      />
    </>
  );
};

const RotatingDesignPreview: React.FC<RotatingDesignPreviewProps> = ({ roomData, furnitureData }) => {
  // Handle cases where data might not be fully loaded or is missing
  if (!roomData || !furnitureData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300 text-xs">
        <p>Preview data missing.</p>
      </div>
    );
  }
  
  // Crude check for basic validity of room dimensions
  if (roomData.width <= 0 || roomData.height <= 0 || roomData.depth <= 0) {
     return (
      <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300 text-xs">
        <p>Invalid room data.</p>
      </div>
    );
  }

  return (
    <Canvas 
        shadows // Enable shadows
        camera={{ 
            position: [Math.max(roomData.width, roomData.depth) * 1.2, roomData.height * 1, Math.max(roomData.width, roomData.depth) * 1.2], 
            fov: 50 
        }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }} // Improve visuals
        frameloop="demand" // Render on demand, good for mostly static previews
    >
      <SceneContent roomData={roomData} furnitureData={furnitureData} />
    </Canvas>
  );
};

export default RotatingDesignPreview; 