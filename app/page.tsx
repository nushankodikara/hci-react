'use client'; // Add this for client-side hooks and interaction

import Image from "next/image";
import Link from 'next/link';
// import Canvas2D from '@/components/Canvas2D'; // Remove old import
import FloorPlanView from '@/components/FloorPlanView'; // Import new component
import Canvas3D from '@/components/Canvas3D';
import { useDesignContext, DesignState, RoomData, FurnitureItem } from "@/context/DesignContext"; // Import the context hook and RoomData type
import { useState, useEffect, ChangeEvent, useRef, useMemo } from 'react'; // Import hooks for local state
import { useRouter } from 'next/navigation'; // Import useRouter
import * as THREE from 'three';

// TODO: Import authentication check logic

// --- Shadcn/ui Imports --- 
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For errors

// --- Lucide Icons --- 
import {
    Loader2,
    LogOut,
    Upload,
    Save,
    Trash2,
    FolderOpen,
    Settings,
    Palette,
    Plus,
    Minus,
    RotateCw, // Changed from RotateCcw for clarity
    Scale,
    X,
    FileWarning,
    List,
    Download, // Changed from FolderOpen for Load Button icon
    PackagePlus, // For Add Furniture Button
    Eraser, // For Delete Selected Item
    Construction, // App Title Icon
} from 'lucide-react';

// Type for the list of designs fetched from API
interface DesignListItem {
    id: number;
    name: string;
    createdAt?: string;
}

export default function HomePage() {
  // TODO: Replace with actual authentication check
  const isAuthenticated = true;

  // Get context state and setters
  const {
    room,
    setRoom,
    furniture,
    addFurniture,
    availableModels,      // Get models list
    fetchAvailableModels, // Get fetch function
    loadDesign, // Get loadDesign from context
    selectedItemId, 
    setSelectedItemId, 
    updateFurniture, // Need this for scaling
    removeFurniture // Need this for delete Button
  } = useDesignContext();

  // Local state for controlled inputs to avoid re-rendering context on every keystroke
  const [localWidth, setLocalWidth] = useState(room.width.toString());
  const [localHeight, setLocalHeight] = useState(room.height.toString());
  // Add local state for color input to avoid rapid context updates
  const [localWallColor, setLocalWallColor] = useState(room.wallColor);

  // State for model upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newModelName, setNewModelName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // State for Save/Load
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<DesignListItem[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [saveDesignName, setSaveDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const router = useRouter(); // Initialize router

  // State for selected item
  const [isLoading, setIsLoading] = useState(false); // Added for potential actions

  // --- Find Selected Item --- 
  const selectedItem = useMemo(() => { 
    return furniture.find(item => item.id === selectedItemId) || null;
  }, [furniture, selectedItemId]);

  // Update context only when local state changes significantly or on blur/enter
  useEffect(() => {
    setLocalWidth(room.width.toString());
    setLocalHeight(room.height.toString());
    setLocalWallColor(room.wallColor);
  }, [room]);

  const handleRoomUpdate = () => {
    const newWidth = parseInt(localWidth, 10);
    const newHeight = parseInt(localHeight, 10);
    const updates: Partial<RoomData> = {};
    if (!isNaN(newWidth) && newWidth > 0) updates.width = newWidth; // Add validation
    if (!isNaN(newHeight) && newHeight > 0) updates.height = newHeight; // Add validation
    if (Object.keys(updates).length > 0) {
      setRoom(updates);
    }
  };

  // Handler for color change
  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalWallColor(newColor);
    // Update context immediately for color picker
    setRoom({ wallColor: newColor }); 
  };

  // --- Upload Logic ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Auto-fill model name from filename (without extension)
      setNewModelName(file.name.replace(/\.(gltf|glb)$/i, '')); 
      setUploadError(null);
    } else {
      setSelectedFile(null);
      setNewModelName('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newModelName) {
      setUploadError('Please select a file and enter a model name.');
      return;
    }
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('modelFile', selectedFile);
    formData.append('modelName', newModelName);

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Success!
      console.log('Upload successful:', await response.json());
      setSelectedFile(null); // Clear selection
      setNewModelName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      fetchAvailableModels(); // Refresh the list of models

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  // --- Add Furniture Logic (now uses selected model) ---
  const handleAddFurniture = (model: { name: string, filePath: string }) => {
    addFurniture({
        modelPath: model.filePath,
        modelName: model.name,
        x: room.width / 2, // Center horizontally
        y: room.height / 2, // Center vertically
        // Other defaults (scale, rotation) are set in context
    });
  };

  // --- Save/Load Logic ---
  const handleSaveDesign = async () => {
    if (!saveDesignName.trim()) {
        setSaveError('Please enter a name for the design.');
        return;
    }
    setIsSaving(true);
    setSaveError(null);

    try {
        const designDataToSave = { name: saveDesignName, room, furniture };
        const res = await fetch('/api/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(designDataToSave),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to save design');
        }
        console.log('Design saved successfully', await res.json());
        setSaveDesignName(''); // Clear name input on success
        // Optionally refresh saved designs list if modal is open
         if (showLoadModal) fetchSavedDesigns();

    } catch (error: any) {
        console.error('Save error:', error);
        setSaveError(error.message || 'An unknown error occurred');
    } finally {
        setIsSaving(false);
    }
  };

  const fetchSavedDesigns = async () => {
    setIsLoadingDesigns(true);
    setLoadError(null);
    try {
        const res = await fetch('/api/designs');
        if (!res.ok) throw new Error('Failed to fetch saved designs');
        const designs: DesignListItem[] = await res.json();
        setSavedDesigns(designs);
    } catch (error: any) {
        console.error('Load list error:', error);
        setLoadError(error.message || 'Could not load designs');
        setSavedDesigns([]);
    } finally {
        setIsLoadingDesigns(false);
    }
  };

  const handleOpenLoadModal = () => {
    setShowLoadModal(true);
    fetchSavedDesigns(); // Fetch list when modal opens
  };

  const handleLoadSpecificDesign = async (id: number) => {
    console.log(`Loading design ID: ${id}`);
    setLoadError(null);
    try {
         const res = await fetch(`/api/designs/${id}`);
         if (!res.ok) {
             const errorData = await res.json();
             throw new Error(errorData.error || 'Failed to load design');
         }
         // API returns { id, name, createdAt, room, furniture }
         // We only need room and furniture for loadDesign
         const loadedData = await res.json(); 
         
         // Type assertion for safety (ensure room and furniture exist)
         const designToLoad: Pick<DesignState, 'room' | 'furniture'> = {
             room: loadedData.room,
             furniture: loadedData.furniture
         };

         loadDesign(designToLoad); // Update context 
         setShowLoadModal(false); // Close modal on success

    } catch(error: any) {
        console.error('Load specific design error:', error);
        setLoadError(error.message || 'Failed to load selected design');
    }
  };
  
   const handleDeleteDesign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    console.log(`Deleting design ID: ${id}`);
    setLoadError(null); // Clear previous errors
    try {
         const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
         if (!res.ok) {
             const errorData = await res.json();
             throw new Error(errorData.error || 'Failed to delete design');
         }
        console.log('Design deleted successfully');
        // Refresh the list in the modal
        fetchSavedDesigns(); 

    } catch(error: any) {
        console.error('Delete design error:', error);
        setLoadError(error.message || 'Failed to delete selected design');
    }
  };

  // --- Logout Logic ---
  const handleLogout = async () => {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (!res.ok) {
            throw new Error('Logout failed');
        }
        console.log('Logout successful');
        router.push('/login'); // Redirect to login page
        router.refresh(); // Ensure state is cleared
    } catch (error) {
        console.error('Logout error:', error);
        // Optionally show an error message to the user
    }
  };

  // --- Handlers ---
  const handleScaleChange = (value: number[]) => {
    if (selectedItem) {
      const newScale = value[0];
      if (!isNaN(newScale)) {
        updateFurniture(selectedItem.id, { scale: newScale });
      }
    }
  };

  const handleRotationChange = (value: number[]) => {
    if (selectedItem) {
      const newRotationDeg = value[0];
      if (!isNaN(newRotationDeg)) {
        updateFurniture(selectedItem.id, { rotationY: THREE.MathUtils.degToRad(newRotationDeg) });
      }
    }
  };

  const handleDeleteSelectedItem = () => {
    if (selectedItem) {
      if (confirm(`Delete ${selectedItem.modelName || 'this item'}?`)) {
        removeFurniture(selectedItem.id);
        // setSelectedItemId(null); // removeFurniture should trigger redraw which clears selection implicitly if needed, or manage explicitly
      }
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-semibold mb-4">Please Log In</h1>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-100"> {/* Lighter background */}
      {/* Sidebar */} 
      <aside className="w-72 bg-white shadow-lg p-4 flex flex-col h-full"> {/* Use aside, better shadow */} 
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Designer Tool</h1> {/* App Title */}
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6"> {/* Scrollable area with padding */} 
          {/* Room Params Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Room Settings</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="roomWidth" className="block text-xs font-medium text-slate-500">Width:</label>
                <input
                  id="roomWidth"
                  type="number"
                  value={localWidth}
                  onChange={(e) => setLocalWidth(e.target.value)}
                  onBlur={handleRoomUpdate} 
                  onKeyDown={(e) => e.key === 'Enter' && handleRoomUpdate()}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 800"
                />
              </div>
              <div>
                <label htmlFor="roomHeight" className="block text-xs font-medium text-slate-500">Height:</label>
                <input
                  id="roomHeight"
                  type="number"
                  value={localHeight}
                  onChange={(e) => setLocalHeight(e.target.value)}
                  onBlur={handleRoomUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoomUpdate()}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 600"
                />
              </div>
              <div>
                <label htmlFor="wallColor" className="block text-xs font-medium text-slate-500">Wall Color:</label>
                <input
                  id="wallColor"
                  type="color"
                  value={localWallColor}
                  onChange={handleColorChange}
                  className="mt-1 block w-full h-8 px-1 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Model Upload Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Upload Model</h3>
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200"> {/* Boxed section */}
              <div>
                <label htmlFor="modelName" className="block text-xs font-medium text-slate-500 mb-1">Model Name:</label>
                <input
                  id="modelName"
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter unique name..."
                  className="block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                  disabled={uploading}
                />
              </div>
              <div>
                <label htmlFor="modelFile" className="block text-xs font-medium text-slate-500 mb-1">GLTF/GLB File:</label>
                <input
                  ref={fileInputRef}
                  id="modelFile"
                  type="file"
                  accept=".gltf,.glb"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 file:cursor-pointer transition duration-150 ease-in-out"
                  disabled={uploading}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !newModelName}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {uploading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {uploading ? 'Uploading...' : 'Upload Model'}
              </Button>
              {uploadError && <p className="text-xs text-red-600 mt-1">Error: {uploadError}</p>}
            </div>
          </section>

          {/* Add Furniture Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Add Furniture</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50"> 
              {availableModels.length === 0 && (
                <p className="text-xs text-slate-500 italic p-2">No models uploaded yet.</p>
              )}
              {availableModels.map((model) => (
                <Button
                  key={model.id}
                  onClick={() => handleAddFurniture(model)}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-md bg-white border border-slate-300 hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  {model.name}
                </Button>
              ))}
            </div>
          </section>

          {/* --- Selected Item Editor --- */}
          {selectedItem && (
            <section>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Edit Item</h3>
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-800 truncate"> 
                  Selected: {selectedItem.modelName || selectedItem.id}
                </p>
                {/* Scale Control - Use Slider component */} 
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="itemScale" className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><Scale className="h-3 w-3"/> Scale</span>
                        <span>{(selectedItem.scale ?? 1).toFixed(2)}x</span>
                    </Label>
                     <Slider // Replace input with Slider
                        id="itemScale"
                        min={0.1} 
                        max={3.0} 
                        step={0.05}
                        value={[selectedItem.scale ?? 1]} // Pass value as array
                        onValueChange={handleScaleChange} // Use correct prop
                        className="my-2" // Apply styling class
                    />
                </div>
                {/* Rotation Control - Use Slider component */} 
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="itemRotation" className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><RotateCw className="h-3 w-3"/> Rotation (Y)</span>
                        <span>{THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0).toFixed(0)}°</span>
                    </Label>
                     <Slider // Replace input with Slider
                        id="itemRotation"
                        min={0} 
                        max={360}
                        step={1}
                        // Pass value as array (degrees)
                        value={[THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0)]} 
                        onValueChange={handleRotationChange} // Use correct prop
                        className="my-2" // Apply styling class
                    />
                </div>
                {/* Delete Button */}
                <Button 
                  onClick={handleDeleteSelectedItem}
                  className="w-full mt-2 flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-500 transition duration-150 ease-in-out"
                >
                  Delete Selected Item
                </Button>
              </div>
            </section>
          )}

          {/* Save/Load Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Save / Load</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="saveName" className="block text-xs font-medium text-slate-500 mb-1">Save As:</label>
                <input
                  id="saveName"
                  type="text"
                  value={saveDesignName}
                  onChange={(e) => setSaveDesignName(e.target.value)}
                  placeholder="Enter design name..."
                  className="block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                  disabled={isSaving}
                />
              </div>
              <Button
                onClick={handleSaveDesign}
                disabled={isSaving || !saveDesignName.trim()}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {isSaving && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isSaving ? 'Saving...' : 'Save Current Design'}
              </Button>
              {saveError && <p className="text-xs text-red-600 mt-1">Error: {saveError}</p>}
              
              <Button
                onClick={handleOpenLoadModal}
                className="w-full mt-1 px-3 py-2 text-sm font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
              >
                Load Saved Design
              </Button>
            </div>
          </section>
        </div>

        {/* Logout Button */} 
        <div className="mt-auto pt-4 border-t border-slate-200"> {/* Use slate color */} 
          <Button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
          >
            {/* Optional: Add logout icon here */} 
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col p-4 space-y-4 bg-slate-100"> {/* Use main tag, match bg */} 
        {/* 2D Floor Plan Component */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden border border-slate-200">
           <FloorPlanView /> {/* Use the new component */}
        </div>
        {/* 3D Canvas Component */}
        <div className="h-1/3 bg-white rounded-lg shadow overflow-hidden border border-slate-200"> {/* Add rounding/shadow */}
          <Canvas3D />
        </div>
      </main>

      {/* Load Design Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"> {/* Darker overlay, padding */} 
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"> {/* Increased max-w, max-h, flex-col */} 
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Load Design</h2>
              <Button 
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </Button>
            </div>
            
            <div className="flex-grow overflow-y-auto mb-4 pr-2"> {/* Scrollable content area */} 
              {loadError && <p className="text-sm text-red-600 mb-3 p-2 bg-red-50 border border-red-200 rounded">Error: {loadError}</p>}
              {isLoadingDesigns ? (
                <p className="text-slate-500">Loading designs...</p>
              ) : savedDesigns.length > 0 ? (
                <ul className="space-y-2">
                  {savedDesigns.map(design => (
                    <li key={design.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition duration-150 ease-in-out">
                      <span className="text-sm text-slate-700 font-medium">
                        {design.name} 
                        <span className="text-xs text-slate-400 ml-2 block sm:inline">
                          ({new Date(design.createdAt || Date.now()).toLocaleDateString()})
                        </span>
                      </span>
                      <div className="flex-shrink-0 space-x-1.5">
                        <Button 
                          onClick={() => handleLoadSpecificDesign(design.id)}
                          className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-md hover:bg-green-200 transition duration-150 ease-in-out"
                        >
                          Load
                        </Button>
                        <Button 
                          onClick={() => handleDeleteDesign(design.id)}
                          className="text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-md hover:bg-red-200 transition duration-150 ease-in-out"
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No saved designs found.</p>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-200 text-right"> {/* Footer area */} 
              <Button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 transition duration-150 ease-in-out"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
