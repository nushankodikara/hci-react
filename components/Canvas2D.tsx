'use client';

import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { useDesignContext, FurnitureItem } from '@/context/DesignContext'; // Import FurnitureItem type

// Removed props interface as we'll use context directly

const Canvas2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { room, furniture, updateFurniture } = useDesignContext(); // Get state and update function

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FurnitureItem | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // --- Drawing Logic (moved into a reusable function) ---
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear canvas
    context.fillStyle = '#ffffff';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, room.width, room.height);

    // Draw furniture items
    furniture.forEach(item => {
      context.fillStyle = item.color || '#cccccc'; // Use default color if needed
      // Simple rectangle representation
      context.fillRect(item.x, item.y, item.width, item.height);

      // Outline if hovered or dragged
      if (item.id === hoveredItemId || item.id === draggedItem?.id) {
        context.strokeStyle = '#007bff'; // Blue outline
        context.lineWidth = 2;
        context.strokeRect(item.x, item.y, item.width, item.height);
        context.lineWidth = 1; // Reset line width
      }

      // Optional: Add text label
      context.fillStyle = '#000000';
      context.font = '10px Arial';
      context.textAlign = 'center';
      const label = item.modelName || item.id.substring(0, 4); // Use modelName or short ID
      context.fillText(label, item.x + item.width / 2, item.y + item.height / 2 + 4); // Adjust Y for centering
    });

    // Room border
    context.strokeStyle = '#cccccc';
    context.strokeRect(0, 0, room.width, room.height);
  };

  useEffect(() => {
    drawCanvas(); // Initial draw and redraw on changes
  }, [room, furniture, hoveredItemId, draggedItem]); // Add drag/hover state dependencies

  // --- Helper to get mouse position relative to canvas ---
  const getMousePos = (e: MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    // Adjust for canvas scaling if display size != internal size
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // --- Event Handlers ---
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    // Check if clicked on any furniture item (iterate backwards for top-most)
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      if (
        pos.x >= item.x &&
        pos.x <= item.x + item.width &&
        pos.y >= item.y &&
        pos.y <= item.y + item.height
      ) {
        setIsDragging(true);
        setDraggedItem(item);
        setOffset({ x: pos.x - item.x, y: pos.y - item.y });
        setHoveredItemId(null); // Clear hover state on drag start
        return; // Stop after finding the first item
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    let isHovering = false;
    
    if (isDragging && draggedItem) {
      const newX = pos.x - offset.x;
      const newY = pos.y - offset.y;
      // Update the item's position in the context
      updateFurniture(draggedItem.id, { x: newX, y: newY });
      // No need to redraw explicitly, useEffect handles it
    } else {
       // Check for hover
       let currentlyHovered: string | null = null;
       for (let i = furniture.length - 1; i >= 0; i--) {
           const item = furniture[i];
           if (
               pos.x >= item.x &&
               pos.x <= item.x + item.width &&
               pos.y >= item.y &&
               pos.y <= item.y + item.height
           ) {
               currentlyHovered = item.id;
               isHovering = true;
               break; 
           }
       }
       setHoveredItemId(currentlyHovered);
    }

    // Update cursor style
    if (canvasRef.current) {
        if (isDragging) {
            canvasRef.current.style.cursor = 'grabbing';
        } else if (isHovering) {
            canvasRef.current.style.cursor = 'grab';
        } else {
            canvasRef.current.style.cursor = 'default';
        }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
    if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredItemId ? 'grab' : 'default'; // Set back to grab if still hovering
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) { // Stop dragging if mouse leaves canvas
        setIsDragging(false);
        setDraggedItem(null);
    }
    setHoveredItemId(null); // Clear hover state
     if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default'; // Reset cursor
    }
  };

  // Set canvas internal resolution based on room data
  // Use CSS classes for display size (w-full h-full)
  return (
    <canvas
      ref={canvasRef}
      width={room.width} // Set internal canvas size
      height={room.height}
      className="w-full h-full object-contain border border-gray-400" // Use object-contain if scaling needed, else just w-full h-full
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave} // Stop dragging if mouse leaves
    />
  );
};

export default Canvas2D; 