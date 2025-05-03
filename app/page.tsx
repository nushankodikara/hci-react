'use client'; // Add this for client-side hooks and interaction

import Image from "next/image";
import Link from 'next/link';
import Canvas2D from '@/components/Canvas2D';
import Canvas3D from '@/components/Canvas3D';
import { useDesignContext, DesignState } from "@/context/DesignContext"; // Import the context hook
import { useState, useEffect, ChangeEvent, useRef } from 'react'; // Import hooks for local state
import { useRouter } from 'next/navigation'; // Import useRouter

// TODO: Import authentication check logic

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
  } = useDesignContext();

  // Local state for controlled inputs to avoid re-rendering context on every keystroke
  const [localWidth, setLocalWidth] = useState(room.width.toString());
  const [localHeight, setLocalHeight] = useState(room.height.toString());

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

  // Update context only when local state changes significantly or on blur/enter
  useEffect(() => {
    setLocalWidth(room.width.toString());
    setLocalHeight(room.height.toString());
  }, [room]);

  const handleRoomUpdate = () => {
    const newWidth = parseInt(localWidth, 10);
    const newHeight = parseInt(localHeight, 10);
    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      setRoom({ width: newWidth, height: newHeight });
    }
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar/Toolbar */}
      <div className="w-72 bg-white shadow-md p-4 flex flex-col space-y-4 overflow-y-auto"> {/* Increased width & scroll */}
        <h2 className="text-xl font-semibold mb-2">Controls</h2>

        {/* Room Params Section */}
        <div>
            <h3 className="text-lg font-medium mb-2">Room Dimensions</h3>
            <label htmlFor="roomWidth" className="block text-sm">Width:</label>
            <input
              id="roomWidth"
              type="number"
              value={localWidth}
              onChange={(e) => setLocalWidth(e.target.value)}
              onBlur={handleRoomUpdate} // Update context on blur
              onKeyDown={(e) => e.key === 'Enter' && handleRoomUpdate()} // Update context on Enter
              className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., 800"
            />
            <label htmlFor="roomHeight" className="block text-sm mt-2">Height:</label>
            <input
              id="roomHeight"
              type="number"
              value={localHeight}
              onChange={(e) => setLocalHeight(e.target.value)}
              onBlur={handleRoomUpdate}
              onKeyDown={(e) => e.key === 'Enter' && handleRoomUpdate()}
              className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., 600"
            />
        </div>

        {/* --- Model Upload Section --- */}
        <div>
          <h3 className="text-lg font-medium mb-2">Upload Model</h3>
          <div className="space-y-2">
             <label htmlFor="modelName" className="block text-sm">Model Name:</label>
             <input
               id="modelName"
               type="text"
               value={newModelName}
               onChange={(e) => setNewModelName(e.target.value)}
               placeholder="Enter model name..."
               className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
               disabled={uploading}
             />
             <label htmlFor="modelFile" className="block text-sm">GLTF/GLB File:</label>
             <input
               ref={fileInputRef} // Assign ref
               id="modelFile"
               type="file"
               accept=".gltf,.glb"
               onChange={handleFileChange}
               className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
               disabled={uploading}
             />
             <button
               onClick={handleUpload}
               disabled={uploading || !selectedFile || !newModelName}
               className="w-full px-3 py-2 text-sm rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {uploading ? 'Uploading...' : 'Upload Model'}
             </button>
             {uploadError && <p className="text-xs text-red-600 mt-1">Error: {uploadError}</p>}
          </div>
        </div>

        {/* --- Add Furniture Section (Uses Available Models) --- */}
        <div>
            <h3 className="text-lg font-medium mb-2">Add Furniture</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto"> {/* Scrollable list */}
              {availableModels.length === 0 && (
                <p className="text-sm text-gray-500">No models uploaded yet.</p>
              )}
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleAddFurniture(model)}
                  className="w-full text-left px-3 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                >
                  {model.name}
                </button>
              ))}
            </div>
        </div>

        {/* Save/Load Section */}
        <div>
             <h3 className="text-lg font-medium mb-2">Save/Load Design</h3>
            <div className="space-y-2">
                <label htmlFor="saveName" className="block text-sm">Save As:</label>
                <input
                   id="saveName"
                   type="text"
                   value={saveDesignName}
                   onChange={(e) => setSaveDesignName(e.target.value)}
                   placeholder="Enter design name..."
                   className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                   disabled={isSaving}
                />
                <button
                   onClick={handleSaveDesign}
                   disabled={isSaving || !saveDesignName.trim()}
                   className="w-full px-3 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isSaving ? 'Saving...' : 'Save Current Design'}
                </button>
                {saveError && <p className="text-xs text-red-600 mt-1">Error: {saveError}</p>}
                
                <button
                    onClick={handleOpenLoadModal}
                    className="w-full mt-4 px-3 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                 >
                    Load Saved Design
                 </button>
            </div>
        </div>

        {/* Logout Button (at the bottom) */}
        <div className="mt-auto pt-4 border-t border-gray-200">
            <button 
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600"
            >
                Logout
            </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* 2D Canvas Component */}
        <div className="flex-1 bg-white border border-gray-300 overflow-hidden"> {/* Added overflow-hidden */}
          {/* Pass room dimensions or let Canvas2D use context */}
          <Canvas2D />
        </div>
        {/* 3D Canvas Component */}
        <div className="h-1/3 bg-white border border-gray-300">
           {/* Pass furniture data or let Canvas3D use context */}
           <Canvas3D />
        </div>
      </div>

      {/* Load Design Modal */}
      {showLoadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
                  <h2 className="text-xl font-semibold mb-4">Load Design</h2>
                  {loadError && <p className="text-sm text-red-600 mb-2">Error: {loadError}</p>}
                  {isLoadingDesigns ? (
                      <p>Loading designs...</p>
                  ) : savedDesigns.length > 0 ? (
                      <ul className="space-y-2 max-h-80 overflow-y-auto">
                          {savedDesigns.map(design => (
                              <li key={design.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                                  <span>
                                      {design.name} 
                                      <span className="text-xs text-gray-500 ml-2">
                                          ({new Date(design.createdAt || Date.now()).toLocaleDateString()})
                                      </span>
                                  </span>
                                  <div>
                                      <button 
                                          onClick={() => handleLoadSpecificDesign(design.id)}
                                          className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 mr-1"
                                      >
                                          Load
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteDesign(design.id)}
                                          className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                      >
                                          Delete
                                      </button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p>No saved designs found.</p>
                  )}
                  <button
                      onClick={() => setShowLoadModal(false)}
                      className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                      Close
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
