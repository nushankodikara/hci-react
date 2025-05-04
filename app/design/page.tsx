'use client';

import { useState, useEffect, ChangeEvent, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as THREE from 'three';
import { useDesignContext, RoomData, FurnitureItem, AvailableModel } from "@/context/DesignContext";
import FloorPlanView from '@/components/FloorPlanView'; // Your 2D R3F view
import Canvas3D from '@/components/Canvas3D'; // Your 3D view

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // For icon buttons
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Potentially needed later: Dialog, Table, etc. for Save/Load integrated here?

// --- Lucide Icons --- 
import {
    Loader2, LogOut, Upload, Save, Trash2, Settings, Palette,
    Plus, Minus, RotateCw, Scale, X, FileWarning, List, Download, 
    PackagePlus, Eraser, Construction, Undo, Redo, /* Add more as needed */
    PanelLeft, PanelRight, // For potentially toggling sidebars
    Home, // For linking back to dashboard
    Minimize2, Maximize2, // Icons for pane controls
    Layout, // Icon for Reset Layout button
} from 'lucide-react';

export default function DesignPage() {
    // TODO: Add auth check - redirect to /login if not authenticated
    const isAuthenticated = true; 

    const {
        room, setRoom, furniture, addFurniture, availableModels,
        fetchAvailableModels, loadDesign, selectedItemId, setSelectedItemId,
        updateFurniture, removeFurniture, resetDesign // Assuming resetDesign exists now
    } = useDesignContext();

    // --- Local State for Controls (Migrated from app/page.tsx) --- 
    const [localWidth, setLocalWidth] = useState(room.width.toString());
    const [localLength, setLocalLength] = useState(room.length.toString());
    const [localWallColor, setLocalWallColor] = useState(room.wallColor);
    const [localWallHeight, setLocalWallHeight] = useState(room.wallHeight.toString());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [newModelName, setNewModelName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saveDesignName, setSaveDesignName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDeletingModel, setIsDeletingModel] = useState<number | null>(null); // Store ID of model being deleted
    const [deleteModelError, setDeleteModelError] = useState<string | null>(null);
    // Note: Load functionality might live primarily on the dashboard now

    // State for pane visibility
    const [isFloorPlanMinimized, setIsFloorPlanMinimized] = useState(false);
    const [isCanvas3DMinimized, setIsCanvas3DMinimized] = useState(false);

    const router = useRouter();

    // --- Derived State --- 
    const selectedItem = useMemo(() => {
        return furniture.find(item => item.id === selectedItemId) || null;
    }, [furniture, selectedItemId]);

    // --- Effects --- 
    useEffect(() => {
        setLocalWidth(room.width.toString());
        setLocalLength(room.length.toString());
        setLocalWallColor(room.wallColor);
        setLocalWallHeight(room.wallHeight.toString());
    }, [room]); // Update local state when context changes (e.g., after loading a design)

     useEffect(() => {
        // Fetch models if the list is empty (e.g., on first load of this page)
        if (availableModels.length === 0) {
             fetchAvailableModels();
        }
    }, [availableModels, fetchAvailableModels]);

    // --- Handlers (Migrated and adapted from app/page.tsx) --- 
    const handleRoomUpdate = () => {
        const newWidth = parseInt(localWidth, 10);
        const newLength = parseInt(localLength, 10);
        const newWallHeight = parseInt(localWallHeight, 10);
        const updates: Partial<RoomData> = {};
        if (!isNaN(newWidth) && newWidth > 0) updates.width = newWidth;
        if (!isNaN(newLength) && newLength > 0) updates.length = newLength;
        if (!isNaN(newWallHeight) && newWallHeight > 0) updates.wallHeight = newWallHeight;
        if (Object.keys(updates).length > 0) setRoom(updates);
    };

    const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
        setLocalWallColor(e.target.value);
        setRoom({ wallColor: e.target.value });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setNewModelName(file.name.replace(/\.(gltf|glb)$/i, ''));
            setUploadError(null);
        } else {
            setSelectedFile(null);
            setNewModelName('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !newModelName) return setUploadError('Select file and enter name.');
        setUploading(true); setUploadError(null);
        const formData = new FormData();
        formData.append('modelFile', selectedFile); formData.append('modelName', newModelName);
        try {
            const response = await fetch('/api/models', { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.json()).error || 'Upload failed');
            console.log('Upload successful:', await response.json());
            setSelectedFile(null); setNewModelName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchAvailableModels(); // Refresh list
        } catch (error: any) { setUploadError(error.message); }
        finally { setUploading(false); }
    };

    const handleAddFurniture = (model: AvailableModel) => {
        addFurniture({ modelPath: model.filePath, modelName: model.name, x: room.width / 2, y: room.length / 2 });
    };

    const handleSaveDesign = async () => {
        if (!saveDesignName.trim()) return setSaveError('Enter a name.');
        setIsSaving(true); setSaveError(null);
        try {
            const designDataToSave = { name: saveDesignName, room, furniture };
            const res = await fetch('/api/designs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(designDataToSave) });
            if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
            console.log('Design saved:', await res.json());
            setSaveDesignName('');
            // Optionally show a success message (e.g., Toast)
        } catch (error: any) { setSaveError(error.message); }
        finally { setIsSaving(false); }
    };

    const handleScaleChange = (value: number[]) => {
        if (selectedItem) updateFurniture(selectedItem.id, { scale: value[0] });
    };

    const handleRotationChange = (value: number[]) => {
        if (selectedItem) updateFurniture(selectedItem.id, { rotationY: THREE.MathUtils.degToRad(value[0]) });
    };

    const handleDeleteSelectedItem = () => {
        if (selectedItem) {
            // TODO: Use Shadcn AlertDialog here for better confirmation
            if (confirm(`Delete ${selectedItem.modelName || 'this item'}?`)) {
                removeFurniture(selectedItem.id);
            }
        }
    };
    
    const handleLogout = async () => {
        // ... (Logout logic - maybe move to a dedicated auth hook/component)
        try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); } catch (e) { console.error(e); /* Show error */ }
    };

    // Handlers for toggling panes
    const toggleFloorPlan = () => {
        const minimizing = !isFloorPlanMinimized;
        setIsFloorPlanMinimized(minimizing);
        if (minimizing) setIsCanvas3DMinimized(false);
    };

    const toggleCanvas3D = () => {
        const minimizing = !isCanvas3DMinimized;
        setIsCanvas3DMinimized(minimizing);
        if (minimizing) setIsFloorPlanMinimized(false);
    };

    // New Handler to reset layout
    const handleResetLayout = () => {
        setIsFloorPlanMinimized(false);
        setIsCanvas3DMinimized(false);
    };

    const handleDeleteModel = async (modelId: number) => {
        setIsDeletingModel(modelId); // Show loading state for specific button
        setDeleteModelError(null);
        try {
            const res = await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete model');
            }
            console.log('Model deleted successfully');
            fetchAvailableModels(); // Refresh the list
        } catch (error: any) {
            console.error('Delete model error:', error);
            setDeleteModelError(error.message || 'An unknown error occurred');
            // Optionally show error via Toast
        } finally {
            setIsDeletingModel(null); // Clear loading state
        }
    };

    if (!isAuthenticated) {
        // Or better, use middleware or a Higher-Order Component for auth protection
        // router.push('/login');
        // return null; // Or a loading spinner
         return <div>Redirecting to login...</div>; // Placeholder
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-col h-screen bg-background text-foreground">
                {/* --- Top Navigation --- */}
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Construction className="h-5 w-5" />
                        <span className="">Room Designer Pro</span>
                    </Link>
                    {/* Add other nav items like Save, User menu etc. */}
                     <div className="flex-1">
                        {/* Placeholder for central nav items or breadcrumbs */}
                     </div>
                     <div className="flex items-center gap-2">
                         {/* Reset Layout Button */} 
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetLayout}>
                                    <Maximize2 className="h-4 w-4" /> {/* Using Maximize icon for reset */} 
                                    <span className="sr-only">Reset Layout</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset Layout</TooltipContent>
                        </Tooltip>
                        <Separator orientation="vertical" className="h-6" />
                         {/* Save Input & Button - Simplified for now */}
                         <Input 
                             type="text" 
                             placeholder="Enter design name to save..." 
                             className="h-8 w-48 text-xs" 
                             value={saveDesignName}
                             onChange={(e) => setSaveDesignName(e.target.value)}
                             disabled={isSaving}
                         />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={handleSaveDesign}
                                    disabled={isSaving || !saveDesignName.trim()}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                    <span className="sr-only">Save Design</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Save Design</TooltipContent>
                        </Tooltip>
                         {/* Maybe add Load button triggering a Dialog? */}
                         {/* User/Logout Button */}
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" />
                                    <span className="sr-only">Logout</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Logout</TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                {/* --- Main Content Area (Sidebars + Center) --- */}
                <div className="flex flex-1 overflow-hidden"> {/* Main area below nav */} 
                    {/* --- Left Sidebar --- */}
                    <aside className="w-72 border-r flex flex-col bg-card overflow-scroll">
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-6">
                                {/* Room Settings */}
                                <section>
                                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Settings className="h-4 w-4"/> Room Settings</h3>
                                    <div className="space-y-3">
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="roomWidth">Width</Label>
                                            <Input id="roomWidth" type="number" value={localWidth} onChange={(e) => setLocalWidth(e.target.value)} onBlur={handleRoomUpdate} min="100" />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="roomLength">Length</Label>
                                            <Input id="roomLength" type="number" value={localLength} onChange={(e) => setLocalLength(e.target.value)} onBlur={handleRoomUpdate} min="100" />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="wallHeight">Wall Height</Label>
                                            <Input id="wallHeight" type="number" value={localWallHeight} onChange={(e) => setLocalWallHeight(e.target.value)} onBlur={handleRoomUpdate} min="50" />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="wallColor"><Palette className="h-3 w-3 inline mr-1"/> Wall Color</Label>
                                            <Input id="wallColor" type="color" value={localWallColor} onChange={handleColorChange} className="h-8 cursor-pointer p-1" />
                                        </div>
                                    </div>
                                </section>
                                <Separator />
                                {/* Upload Model */}
                                <section>
                                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Upload className="h-4 w-4"/> Upload Model</h3>
                                    <div className="space-y-3">
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="modelName">Model Name</Label>
                                            <Input id="modelName" type="text" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Enter unique name..." disabled={uploading} />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="modelFile">GLTF/GLB File</Label>
                                            <Input ref={fileInputRef} id="modelFile" type="file" accept=".gltf,.glb" onChange={handleFileChange} disabled={uploading} className="text-sm file:button-styling..." />
                                        </div>
                                        <Button onClick={handleUpload} disabled={uploading || !selectedFile || !newModelName} className="w-full">
                                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>} {uploading ? 'Uploading...' : 'Upload Model'}
                                        </Button>
                                        {uploadError && <Alert variant="destructive" className="mt-2"><FileWarning className="h-4 w-4"/><AlertTitle>Upload Error</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>}
                                    </div>
                                </section>
                                <Separator />
                                {/* Add Furniture */}
                                <section>
                                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><List className="h-4 w-4"/> Add Furniture</h3>
                                    {/* Display overall delete error if any */} 
                                    {deleteModelError && <Alert variant="destructive" className="mb-2 text-xs"><FileWarning className="h-4 w-4"/><AlertTitle>Delete Error</AlertTitle><AlertDescription>{deleteModelError}</AlertDescription></Alert>}
                                     <ScrollArea className="h-48 w-full rounded-md border p-2">
                                         {availableModels.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center p-2">No models uploaded</p>
                                        ) : (
                                            <div className="space-y-1">
                                            {availableModels.map((model) => (
                                                <div key={model.id} className="flex items-center justify-between gap-1 group p-1 rounded hover:bg-muted">
                                                    {/* Add Button */} 
                                                    <Button 
                                                        onClick={() => handleAddFurniture(model)} 
                                                        variant="ghost" 
                                                        className="flex-grow justify-start text-left h-8 px-2" // Adjust padding/height
                                                    >
                                                        <PackagePlus className="mr-2 h-4 w-4 flex-shrink-0"/>
                                                        <span className="truncate">{model.name}</span>
                                                    </Button>
                                                    {/* Delete Button - Conditionally visible or always visible */} 
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" // Style for subtle delete
                                                                disabled={isDeletingModel === model.id} // Disable while deleting this specific model
                                                            >
                                                                {isDeletingModel === model.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                <span className="sr-only">Delete {model.name}</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Model?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the model "{model.name}" from the library.
                                                                    This action cannot be undone. Furniture using this model in saved designs might not render correctly.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => handleDeleteModel(model.id)} 
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Yes, delete model
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </section>
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* --- Center Area --- Adjusted for collapsible panes */}
                    <main className="flex-1 flex flex-col p-4 space-y-4 bg-muted/30 overflow-auto">
                        {/* 2D View - Conditionally render size/visibility */} 
                        <Card className={`shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${isFloorPlanMinimized ? 'flex-none h-14' : (isCanvas3DMinimized ? 'flex-1' : 'flex-1 min-h-[300px]')}`}> 
                            <CardHeader className="p-2 border-b flex flex-row items-center justify-between h-14"> {/* Fixed header height */} 
                                <CardTitle className="text-sm font-medium">2D Floor Plan</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {/* Button toggles state, icon changes based on state */} 
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleFloorPlan}>
                                            {isFloorPlanMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                            <span className="sr-only">{isFloorPlanMinimized ? 'Maximize' : 'Minimize'} 2D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isFloorPlanMinimized ? 'Maximize' : 'Minimize'} 2D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            {/* Hide content when minimized */} 
                            <CardContent className={`p-0 h-full w-full relative ${isFloorPlanMinimized ? 'hidden' : 'block'}`}> 
                                <FloorPlanView /> 
                            </CardContent>
                        </Card>
                        {/* 3D View - Conditionally render size/visibility */} 
                        <Card className={`shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${isCanvas3DMinimized ? 'flex-none h-14' : (isFloorPlanMinimized ? 'flex-1' : 'h-1/3 min-h-[200px]')}`}> 
                             <CardHeader className="p-2 border-b flex flex-row items-center justify-between h-14"> {/* Fixed header height */} 
                                <CardTitle className="text-sm font-medium">3D Preview</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {/* Button toggles state, icon changes based on state */} 
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleCanvas3D}>
                                            {isCanvas3DMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                            <span className="sr-only">{isCanvas3DMinimized ? 'Maximize' : 'Minimize'} 3D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isCanvas3DMinimized ? 'Maximize' : 'Minimize'} 3D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                             {/* Hide content when minimized */} 
                            <CardContent className={`p-0 h-full w-full ${isCanvas3DMinimized ? 'hidden' : 'block'}`}> 
                                 <Canvas3D />
                            </CardContent>
                        </Card>
                    </main>

                    {/* --- Right Sidebar --- */}
                    <aside className="w-64 border-l flex flex-col bg-card overflow-hidden">
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-6">
                                {/* Selected Item Editor */}
                                {selectedItem ? (
                                <section>
                                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Settings className="h-4 w-4"/> Edit Item</h3>
                                    <div className="space-y-4 rounded-md border p-3">
                                        <p className="text-sm font-medium text-foreground truncate"> 
                                            Selected: {selectedItem.modelName || `Item ID: ${selectedItem.id.substring(0,6)}...`}
                                        </p>
                                        {/* Scale */} 
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemScale" className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1"><Scale className="h-3 w-3"/> Scale</span>
                                                <span>{(selectedItem.scale ?? 1).toFixed(2)}x</span>
                                            </Label>
                                            <Slider id="itemScale" min={0.1} max={3.0} step={0.05} value={[selectedItem.scale ?? 1]} onValueChange={handleScaleChange} className="my-2"/>
                                        </div>
                                        {/* Rotation */} 
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemRotation" className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1"><RotateCw className="h-3 w-3"/> Rotation</span>
                                                <span>{THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0).toFixed(0)}°</span>
                                            </Label>
                                            <Slider id="itemRotation" min={0} max={360} step={1} value={[THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0)]} onValueChange={handleRotationChange} className="my-2"/>
                                        </div>
                                        <Separator/>
                                        {/* Delete */} 
                                        <Button onClick={handleDeleteSelectedItem} variant="destructive" size="sm" className="w-full">
                                            <Eraser className="mr-2 h-4 w-4" /> Delete Item
                                        </Button>
                                    </div>
                                </section>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4 pt-10">
                                        <p>Select an item in the 2D or 3D view to edit its properties.</p>
                                    </div>
                                )} 
                                {/* Add other right-sidebar sections here later if needed */}
                            </div>
                        </ScrollArea>
                    </aside>
                </div> 
            </div>
        </TooltipProvider>
    );
} 