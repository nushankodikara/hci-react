'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// Define the shapes of our data
export interface RoomData {
  width: number;
  height: number;
  // Add shape, color later
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
  // type: 'chair' | 'table'; // Replaced by modelPath
  modelPath: string; // Path to the GLTF/GLB file (relative to /public)
  modelName?: string; // Optional: store name for display
  x: number;
  y: number; // 2D position on the floor plan
  width: number;
  height: number;
  z?: number; // Optional: 3D vertical position offset
  scale?: number; // Optional: Uniform scaling
  // width: number; // Dimensions might come from model bounds later
  // height: number;
  color?: string; // Can be used for tinting or default if model lacks materials
  rotationY?: number; // Rotation around vertical axis
}

// Define and Export the context state
export interface DesignState {
  room: RoomData;
  furniture: FurnitureItem[];
  availableModels: AvailableModel[]; // Add available models list
}

// Define the context value type including setters
interface DesignContextType extends DesignState {
  setRoom: (room: RoomData) => void;
  addFurniture: (item: Omit<FurnitureItem, 'id' | 'width' | 'height'> & { width?: number, height?: number }) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  loadDesign: (state: Omit<DesignState, 'availableModels'>) => void; // Don't load models list
  fetchAvailableModels: () => Promise<void>; // Action to fetch models
}

// Create the context
const DesignContext = createContext<DesignContextType | undefined>(undefined);

// Create the provider component
interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const [room, setRoom] = useState<RoomData>({ width: 800, height: 600 }); // Default room
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]); // State for models

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

  const addFurniture = (item: Omit<FurnitureItem, 'id' | 'width' | 'height'> & { width?: number, height?: number }) => {
    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      width: item.width ?? 50,
      height: item.height ?? 50,
      ...item,
      scale: item.scale ?? 1,
      rotationY: item.rotationY ?? 0,
      z: item.z ?? 0, 
    };
    setFurniture((prev) => [...prev, newItem]);
  };

  const updateFurniture = (id: string, updates: Partial<FurnitureItem>) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeFurniture = (id: string) => {
    setFurniture((prev) => prev.filter((item) => item.id !== id));
  };

  const loadDesign = (state: Omit<DesignState, 'availableModels'>) => {
    setRoom(state.room);
    setFurniture(state.furniture);
    // Don't overwrite availableModels fetched from API
  };

  const value = {
    room,
    furniture,
    availableModels, // Expose available models
    setRoom,
    addFurniture,
    updateFurniture,
    removeFurniture,
    loadDesign,
    fetchAvailableModels, // Expose fetch function
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