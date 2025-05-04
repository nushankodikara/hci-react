'use client';

import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Grid, Plane, Box, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignContext, FurnitureItem, RoomData } from '@/context/DesignContext';

// --- Constants --- 
const DEFAULT_SIZE = 40; // Original default size, reuse for marker?
const GRID_SPACING = 50;
const SCALE_FACTOR = 0.02; // Define scale factor globally within the component
const DEFAULT_2D_MARKER_SIZE = 30; // Define a specific size for the 2D square marker

// --- Floor Plane Component --- 
// Removed: Now integrated into FloorPlanScene for easier handler access

// --- Furniture Item Component --- 
interface FurnitureItemMeshProps {
    item: FurnitureItem;
    isSelected: boolean;
    room: RoomData;
    onDragStart: (id: string, event: ThreeEvent<PointerEvent>) => void;
}

const FurnitureItemMesh: React.FC<FurnitureItemMeshProps> = ({ item, isSelected, room, onDragStart }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    // Calculate the scaled size for the 2D marker
    const MARKER_SIZE_SCALED = DEFAULT_2D_MARKER_SIZE * SCALE_FACTOR;

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: isSelected ? '#007bff' : (item.color || '#aaaaaa'),
        transparent: true, // Enable transparency
        opacity: isSelected ? 0.9 : 0.75, // Slightly different opacity
        roughness: 0.8,
        metalness: 0.1,
    }), [isSelected, item.color]);

    const position: [number, number, number] = [
        (item.x - room.width / 2) * SCALE_FACTOR,
        0.05, // Slightly above the floor plane to avoid z-fighting
        (item.y - room.length / 2) * SCALE_FACTOR
    ];
    
    const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation(); // *** Crucial: Prevent OrbitControls Panning ***
        onDragStart(item.id, event); // Notify parent about drag start
    };

    // Determine text label
    const labelText = item.modelName || `Item`; // Fallback label

    return (
        // Group the Box and Text together
        <group position={position}>
            {/* The Box marker */}
            <Box 
                ref={meshRef} 
                args={[MARKER_SIZE_SCALED, 0.1, MARKER_SIZE_SCALED]} 
                rotation={[0, item.rotationY ?? 0, 0]} 
                material={material}
                onPointerDown={handlePointerDown}
                castShadow
            />
             {/* The Text Label */}
             <Text
                position={[0, 0.1, 0]} // Position slightly above the box center
                rotation={[-Math.PI / 2, 0, 0]} // Rotate to lay flat facing up
                fontSize={MARKER_SIZE_SCALED * 0.5} // Adjust font size relative to marker size
                color={isSelected ? "#0000ff" : "#333333"} // Darker color for readability, blue when selected
                anchorX="center" // Center horizontally
                anchorY="middle" // Center vertically
                maxWidth={MARKER_SIZE_SCALED * 2} // Limit text width
            >
                {/* Pass text content as children */}
                {labelText}
            </Text>
        </group>
    );
};

// --- NEW: Inner component for Canvas contents --- 
const FloorPlanScene = () => {
    const { room, furniture, selectedItemId, setSelectedItemId, updateFurniture } = useDesignContext();
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false); 
    const dragOffset = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
    const { raycaster, camera, scene, gl } = useThree(); // Get gl renderer for target element
    
    // Store refs to avoid stale closures in window listeners
    const stateRef = useRef({
      isDragging,
      draggingItemId,
      camera,
      scene,
      raycaster,
      room,
      furniture,
      dragOffset,
      updateFurniture
    });
    // Keep refs updated
    useEffect(() => {
        stateRef.current = { 
            isDragging, draggingItemId, camera, scene, raycaster, room, 
            furniture,
            dragOffset, updateFurniture 
        };
    }, [isDragging, draggingItemId, camera, scene, raycaster, room, furniture, dragOffset, updateFurniture]);

    const scaledWidth = room.width * SCALE_FACTOR;
    const scaledLength = room.length * SCALE_FACTOR;
    const zoom = Math.min(150 / scaledWidth, 150 / scaledLength, 1); 

    // --- Pointer calculation (adjust to work with raw window events) ---
    const updatePointerFromWindowEvent = (event: PointerEvent): THREE.Vector2 => {
        const rect = gl.domElement.getBoundingClientRect(); // Use renderer's canvas
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        return new THREE.Vector2(x, y);
    };

    // --- Window Event Handlers --- 
    const handleWindowPointerMove = useCallback((event: PointerEvent) => {
        // Use refs to get current state/objects
        const { isDragging, draggingItemId, camera, scene, raycaster, room, dragOffset, updateFurniture } = stateRef.current;
        
        if (!isDragging || !draggingItemId) return;

        const pointer = updatePointerFromWindowEvent(event);
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const floorIntersection = intersects.find((hit) => (hit.object.userData as any)?.isFloorPlane === true);

        if (floorIntersection) {
            const intersectionPoint = floorIntersection.point;
            const newX_R3F = intersectionPoint.x - dragOffset.current.x;
            const newZ_R3F = intersectionPoint.z - dragOffset.current.z;
            const newX_Context = (newX_R3F / SCALE_FACTOR) + room.width / 2;
            const newY_Context = (newZ_R3F / SCALE_FACTOR) + room.length / 2;
            // TODO: Boundary checks
            updateFurniture(draggingItemId, { x: newX_Context, y: newY_Context });
        }
    }, []); // Empty dependency array, uses refs

    const handleWindowPointerUp = useCallback((event: PointerEvent) => {
        // Use refs
         const { isDragging } = stateRef.current;
         if (isDragging) {
            // Clean up state and listeners
            setIsDragging(false);
            setDraggingItemId(null);
            stateRef.current.dragOffset.current = { x: 0, z: 0 }; // Reset offset via ref
            
            window.removeEventListener('pointermove', handleWindowPointerMove);
            window.removeEventListener('pointerup', handleWindowPointerUp);
        }
    }, []); // Empty dependency array

    // --- Drag Start Handler (on item) --- 
    const handleItemDragStart = (itemId: string, event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        
        setSelectedItemId(itemId);
        setDraggingItemId(itemId);
        setIsDragging(true); 

        const pointer = updatePointerFromWindowEvent(event.nativeEvent);
        stateRef.current.raycaster.setFromCamera(pointer, stateRef.current.camera);
        const intersects = stateRef.current.raycaster.intersectObjects(stateRef.current.scene.children, true);
        const floorIntersection = intersects.find((hit) => (hit.object.userData as any)?.isFloorPlane === true);
        
        // Now this access should be valid
        const currentItemState = stateRef.current.furniture?.find((f: FurnitureItem) => f.id === itemId);

        // Ensure room is also available in ref if needed for calculation (it is)
        const currentItemPosR3F = {
             x: currentItemState && stateRef.current.room ? (currentItemState.x - stateRef.current.room.width / 2) * SCALE_FACTOR : 0,
             z: currentItemState && stateRef.current.room ? (currentItemState.y - stateRef.current.room.length / 2) * SCALE_FACTOR : 0,
        };

        if (floorIntersection && currentItemState) { 
             stateRef.current.dragOffset.current = {
                 x: floorIntersection.point.x - currentItemPosR3F.x, 
                 z: floorIntersection.point.z - currentItemPosR3F.z
            };
        } else {
            console.warn("Could not calculate initial drag offset. Floor or item not found?");
            stateRef.current.dragOffset.current = { x: 0, z: 0 };
        }

        window.addEventListener('pointermove', handleWindowPointerMove);
        window.addEventListener('pointerup', handleWindowPointerUp);
    };

    // --- Effect for Camera Zoom --- 
    useEffect(() => {
        if (camera instanceof THREE.OrthographicCamera) {
            camera.zoom = zoom;
            camera.updateProjectionMatrix();
        }
    }, [camera, zoom]);

    // --- Ref and userData for Floor Plane --- 
    const floorPlaneRef = useRef<THREE.Mesh>(null!);
    useEffect(() => {
        if (floorPlaneRef.current) {
            floorPlaneRef.current.userData = { isFloorPlane: true };
        }
    }, []);

    // --- Floor Outline Points --- 
    const outlinePoints = useMemo(() => {
        const halfW = scaledWidth / 2;
        const halfL = scaledLength / 2;
        return [
            new THREE.Vector3(-halfW, 0.01, -halfL),
            new THREE.Vector3( halfW, 0.01, -halfL),
            new THREE.Vector3( halfW, 0.01,  halfL),
            new THREE.Vector3(-halfW, 0.01,  halfL),
            new THREE.Vector3(-halfW, 0.01, -halfL), // Close the loop
        ];
    }, [scaledWidth, scaledLength]);

    return (
        <> {/* Use Fragment to avoid adding extra DOM elements */} 
             <OrthographicCamera makeDefault position={[0, 100, 0]} near={0.1} far={1000} />
            <ambientLight intensity={1.0} />
            <directionalLight position={[0, 10, 5]} intensity={0.5} castShadow />

            <Grid 
                position={[0, 0, 0]}
                args={[scaledWidth, scaledLength]} 
                cellSize={GRID_SPACING * SCALE_FACTOR}
                cellThickness={0.5}
                cellColor={new THREE.Color('#cccccc')}
                sectionSize={GRID_SPACING * 5 * SCALE_FACTOR} 
                sectionThickness={1}
                sectionColor={new THREE.Color('#999999')}
                fadeDistance={150} 
                fadeStrength={1}
                infiniteGrid={false} 
                followCamera={false}
            />
            
            {/* --- Floor Outline --- */}
            <Line 
                points={outlinePoints}
                color="#666666" 
                lineWidth={1}
            />

            {/* Raycasting Plane */}
            <Plane 
                ref={floorPlaneRef}
                args={[scaledWidth * 1.1, scaledLength * 1.1]} 
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]} 
                visible={false}
                receiveShadow
            >
                <meshStandardMaterial side={THREE.DoubleSide} transparent opacity={0} />
            </Plane>

            <Suspense fallback={null}>
                {furniture.map((item) => (
                    <FurnitureItemMesh 
                        key={item.id}
                        item={item}
                        isSelected={item.id === selectedItemId}
                        room={room}
                        onDragStart={handleItemDragStart}
                    />
                ))}
            </Suspense>
            
            <OrbitControls 
                makeDefault 
                enabled={!isDragging} // Disable during drag
                enableRotate={false}
                mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
                touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
             />
        </>
    );
}


// --- Main Exported Component --- 
const FloorPlanView: React.FC = () => {
    // This component now only sets up the Canvas
    return (
        <div className="w-full h-full bg-white border border-slate-300 relative cursor-grab active:cursor-grabbing">
             <Canvas>
                 {/* Render the inner component containing all R3F elements and logic */}
                 <FloorPlanScene />
             </Canvas>
         </div>
    );
};

export default FloorPlanView; 