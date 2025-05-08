'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// Define the shapes of our data
export interface RoomData {
  width: number;
  length: number; // Renamed from height
  wallColor: string;
  wallHeight: number; // Add wall height
}

// Model interface from DB (can reuse or define separately)
export interface AvailableModel {
    id: number;
    name: string;
    filePath: string;
}

// Exporting FurnitureItem
export interface FurnitureItem {
  id: string; 
  modelPath: string; // Path to the GLTF/GLB file (relative to /public)
  modelName?: string; // Optional: store name for display
  x: number; // Position on 2D canvas (top-left)
  y: number; // Position on 2D canvas (top-left)
  // Dimensions below are calculated from the 3D model's bounding box
  width: number; // Footprint width (X-axis in 3D)
  depth: number; // Footprint depth (Z-axis in 3D) - Used as height in 2D
  height?: number; // Optional: Actual 3D height
  normalizedScale?: number; // Scale factor applied in 3D for consistent size
  z?: number; // 3D vertical position offset (relative to floor)
  scale?: number; // User-defined scale multiplier (applied on top of normalizedScale)
  color?: string; // Tint/fallback color
  rotationY?: number; // Rotation around vertical axis
  hue?: number; // 0-360
  saturation?: number; // 0-1 (representing 0-100%)
  lightness?: number; // 0-1 (representing 0-100%)
  originalColorHex?: string; // To store the base color of the material
  // Properties for the preview/fallback box if model fails or not specified
  width?: number; 
  depth?: number;
  height?: number;
  type?: 'sofa' | 'table' | 'chair' | 'lamp' | 'generic'; // For fallback box color
}

// Define and Export the context state
export interface DesignState {
  room: RoomData;
  furniture: FurnitureItem[];
  availableModels: AvailableModel[]; // Add available models list
  selectedItemId: string | null; // Add selected item ID
}

// --- Default State --- 
const DEFAULT_ROOM: RoomData = { 
    width: 800, 
    length: 600, // Renamed from height
    wallColor: '#f0f0f0', 
    wallHeight: 250 // Default wall height
};

// Define the context value type including setters
interface DesignContextType extends DesignState {
  setRoom: (room: Partial<RoomData>) => void; // Allow partial updates for color
  addFurniture: (item: Omit<FurnitureItem, 'id' | 'width' | 'depth' | 'height' | 'normalizedScale'>) => void; // Remove calculated fields from input
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  updateFurnitureDimensions: (id: string, dimensions: { width: number, depth: number, height: number, normalizedScale: number }) => void; // New function
  loadDesign: (state: Omit<DesignState, 'availableModels' | 'selectedItemId'>) => void; // Don't load models list
  fetchAvailableModels: () => Promise<void>; // Action to fetch models
  setSelectedItemId: (id: string | null) => void; // Add setter for selection
  resetDesign: () => void; // Add reset function type
}

// Create the context
const DesignContext = createContext<DesignContextType | undefined>(undefined);

// Create the provider component
interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const [room, setRoomState] = useState<RoomData>(DEFAULT_ROOM);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]); // State for models
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // Selection state

  // Fetch models on initial load
  const fetchAvailableModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) {
        throw new Error('Failed to fetch models');
      }
      const models = await res.json();
      setAvailableModels(models);
      console.log('Available models fetched:', models);
    } catch (error) {
      console.error('Error fetching available models:', error);
      setAvailableModels([]); // Reset or keep stale data?
    }
  }, []);

  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  // Update setRoom to handle partial updates
  const setRoom = (updates: Partial<RoomData>) => {
    // Validate numeric fields if provided
    const validatedUpdates: Partial<RoomData> = { ...updates };
    if (updates.width !== undefined && (isNaN(updates.width) || updates.width <= 0)) {
        delete validatedUpdates.width; // Ignore invalid width
    }
    if (updates.length !== undefined && (isNaN(updates.length) || updates.length <= 0)) {
        delete validatedUpdates.length; // Ignore invalid length
    }
    if (updates.wallHeight !== undefined && (isNaN(updates.wallHeight) || updates.wallHeight <= 0)) {
        delete validatedUpdates.wallHeight; // Ignore invalid wallHeight
    }
    setRoomState(prev => ({ ...prev, ...validatedUpdates }));
  };

  const addFurniture = (item: Omit<FurnitureItem, 'id' | 'width' | 'depth' | 'height' | 'normalizedScale'>) => {
    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      // Set initial placeholder dimensions - these will be updated once the model loads
      width: 50, // Placeholder width
      depth: 50, // Placeholder depth
      ...item,
      scale: item.scale ?? 1,
      rotationY: item.rotationY ?? 0,
      z: item.z ?? 0, 
      normalizedScale: 1, // Default normalized scale before calculation
    };
    setFurniture((prev) => [...prev, newItem]);
  };

  const updateFurniture = (id: string, updates: Partial<FurnitureItem>) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // New function to specifically update calculated dimensions and scale
  const updateFurnitureDimensions = (id: string, dimensions: { width: number, depth: number, height: number, normalizedScale: number }) => {
    setFurniture((prev) =>
        prev.map((item) => 
            item.id === id 
            ? { ...item, ...dimensions } // Overwrite placeholders with calculated values
            : item
        )
    );
  };

  const removeFurniture = (id: string) => {
    setFurniture((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) {
        setSelectedItemId(null);
    }
  };

  const loadDesign = (state: Omit<DesignState, 'availableModels' | 'selectedItemId'>) => {
    // Load with defaults for all fields
    const loadedRoomData = {
      width: state.room?.width ?? DEFAULT_ROOM.width,
      length: state.room?.length ?? DEFAULT_ROOM.length, // Use length
      wallColor: state.room?.wallColor ?? DEFAULT_ROOM.wallColor,
      wallHeight: state.room?.wallHeight ?? DEFAULT_ROOM.wallHeight, // Load wallHeight
    };
    setRoomState(loadedRoomData);
    setFurniture(state.furniture ?? []);
    setSelectedItemId(null);
  };

  const resetDesign = () => {
      setRoomState(DEFAULT_ROOM); // Reset using the default object
      setFurniture([]);
      setSelectedItemId(null);
      console.log('Design context reset to defaults.');
  };

  const value = {
    room,
    furniture,
    availableModels,
    setRoom,
    addFurniture,
    updateFurniture,
    removeFurniture,
    updateFurnitureDimensions,
    loadDesign,
    fetchAvailableModels,
    selectedItemId,
    setSelectedItemId,
    resetDesign,
  };

  return (
    <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
  );
};

// Create a custom hook for easy context usage
export const useDesignContext = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesignContext must be used within a DesignProvider');
  }
  return context;
}; 