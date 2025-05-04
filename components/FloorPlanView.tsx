'use client';

import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Grid, Plane, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignContext, FurnitureItem, RoomData } from '@/context/DesignContext';

// Floor Plane Component for Interactions
const FloorPlane = () => {
    const { room } = useDesignContext();
    const scaleFactor = 0.02; // Consistent scale factor
    const scaledWidth = room.width * scaleFactor;
    const scaledHeight = room.height * scaleFactor;

    return (
        <Plane 
            args={[scaledWidth * 1.1, scaledHeight * 1.1]} // Slightly larger than room for easier interaction
            rotation={[-Math.PI / 2, 0, 0]} // Rotate to be flat on XZ plane
            position={[0, -0.01, 0]} // Position slightly below items
            visible={false} // Make it invisible, only used for raycasting
        >
            {/* <meshStandardMaterial color="#ff00ff"/> */}
        </Plane>
    );
};

// Furniture Item Component
interface FurnitureItemMeshProps {
    item: FurnitureItem;
    scaleFactor: number;
    isSelected: boolean;
    room: RoomData;
}

const FurnitureItemMesh: React.FC<FurnitureItemMeshProps> = ({ item, scaleFactor, isSelected, room }) => {
    const { setSelectedItemId } = useDesignContext();
    const meshRef = useRef<THREE.Mesh>(null);
    const DEFAULT_SIZE_3D = DEFAULT_SIZE * scaleFactor; // Use the same default size scaled

    // Memoize material to avoid recreation
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: isSelected ? '#007bff' : (item.color || '#aaaaaa'), // Blue when selected
        // emissive: isSelected ? '#007bff' : '#000000',
        // emissiveIntensity: isSelected ? 0.5 : 0,
        roughness: 0.8,
        metalness: 0.1,
    }), [isSelected, item.color]);

    const position: [number, number, number] = [
        (item.x - room.width / 2) * scaleFactor,
        0, // Position directly on the floor (XZ plane)
        (item.y - room.height / 2) * scaleFactor
    ];
    
    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation(); // Prevent click from reaching floor/deselecting
        setSelectedItemId(item.id);
        console.log('Selected:', item.id);
    };

    return (
        <Box 
            ref={meshRef} 
            args={[DEFAULT_SIZE_3D, 0.1, DEFAULT_SIZE_3D]} // Flat box representation (width, height, depth)
            position={position} 
            rotation={[0, item.rotationY ?? 0, 0]} 
            scale={item.scale ?? 1} // Apply user scale
            material={material}
            onClick={handleClick}
            castShadow
        >
            {/* Using Box geometry directly, no need for separate material unless complex */}
            {/* <meshStandardMaterial color={isSelected ? 'blue' : 'gray'} /> */}
        </Box>
    );
};

// Main Floor Plan Component
const FloorPlanView: React.FC = () => {
    const { room, furniture, selectedItemId } = useDesignContext();
    const scaleFactor = 0.02; // Consistent scale factor
    const scaledWidth = room.width * scaleFactor;
    const scaledHeight = room.height * scaleFactor;
    
    // Calculate a suitable zoom factor based on room size
    const zoom = Math.min(150 / scaledWidth, 150 / scaledHeight, 1); // Adjust 150 based on desired initial view

    return (
        <div className="w-full h-full bg-white border border-slate-300 relative"> {/* Added relative positioning */}
             <Canvas>
                {/* Use Orthographic Camera */}
                 <OrthographicCamera 
                    makeDefault 
                    position={[0, 100, 0]} // Positioned high above, looking down
                    zoom={zoom} // Adjust zoom based on room size
                    near={0.1} 
                    far={1000} 
                 />
                <ambientLight intensity={1.0} /> {/* Brighter ambient light for 2D look */}
                <directionalLight position={[0, 10, 5]} intensity={0.5} />

                {/* Grid Helper */}
                <Grid 
                    position={[0, 0, 0]} // Centered at origin
                    args={[scaledWidth, scaledHeight]} // Grid size based on room
                    cellSize={GRID_SPACING * scaleFactor} // Cell size based on original grid spacing
                    cellThickness={0.5}
                    cellColor={new THREE.Color('#cccccc')}
                    sectionSize={GRID_SPACING * 5 * scaleFactor} // Thicker lines every 5 cells
                    sectionThickness={1}
                    sectionColor={new THREE.Color('#999999')}
                    fadeDistance={150} // Fade grid towards edges
                    fadeStrength={1}
                    infiniteGrid={false} // Don't make it infinite
                    followCamera={false}
                />
                
                {/* Invisible floor plane for raycasting drag events */}
                <FloorPlane />

                {/* Render Furniture Items */}
                <Suspense fallback={null}>
                    {furniture.map((item) => (
                        <FurnitureItemMesh 
                            key={item.id}
                            item={item}
                            scaleFactor={scaleFactor}
                            isSelected={item.id === selectedItemId}
                            room={room}
                        />
                    ))}
                </Suspense>
                
                {/* Controls - Limit to panning/zooming */}
                <OrbitControls 
                    makeDefault 
                    enableRotate={false} // Disable rotation
                    mouseButtons={{
                        LEFT: THREE.MOUSE.PAN, // Pan with left click
                        MIDDLE: THREE.MOUSE.DOLLY, // Zoom with middle mouse/scroll
                        RIGHT: THREE.MOUSE.PAN // Pan with right click as well (optional)
                    }}
                    touches={{
                        ONE: THREE.TOUCH.PAN, // Pan with one finger
                        TWO: THREE.TOUCH.DOLLY_PAN // Zoom/Pan with two fingers
                    }}
                 />
            </Canvas>
             {/* Optional: Add coordinate display or rulers here using absolute positioning */}
        </div>
    );
};

const DEFAULT_SIZE = 40; // Original default size constant
const GRID_SPACING = 50; // Keep original grid spacing constant for reference

export default FloorPlanView; 