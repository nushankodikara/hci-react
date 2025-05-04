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
// Potentially needed later: Dialog, Table, etc. for Save/Load integrated here?

// --- Lucide Icons --- 
import {
    Loader2, LogOut, Upload, Save, Trash2, Settings, Palette,
    Plus, Minus, RotateCw, Scale, X, FileWarning, List, Download, 
    PackagePlus, Eraser, Construction, Undo, Redo, /* Add more as needed */
    PanelLeft, PanelRight, // For potentially toggling sidebars
    Home, // For linking back to dashboard
    Minimize2, Maximize2, // Icons for pane controls
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
    const [localHeight, setLocalHeight] = useState(room.height.toString());
    const [localWallColor, setLocalWallColor] = useState(room.wallColor);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [newModelName, setNewModelName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saveDesignName, setSaveDesignName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
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
        setLocalHeight(room.height.toString());
        setLocalWallColor(room.wallColor);
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
        const newHeight = parseInt(localHeight, 10);
        const updates: Partial<RoomData> = {};
        if (!isNaN(newWidth) && newWidth > 0) updates.width = newWidth;
        if (!isNaN(newHeight) && newHeight > 0) updates.height = newHeight;
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
        addFurniture({ modelPath: model.filePath, modelName: model.name, x: room.width / 2, y: room.height / 2 });
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
        // If minimizing floor plan, ensure 3D is maximized
        if (minimizing) {
            setIsCanvas3DMinimized(false);
        }
    };

    const toggleCanvas3D = () => {
        const minimizing = !isCanvas3DMinimized;
        setIsCanvas3DMinimized(minimizing);
        // If minimizing 3D, ensure floor plan is maximized
        if (minimizing) {
            setIsFloorPlanMinimized(false);
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
                    <aside className="w-72 border-r flex flex-col bg-card overflow-hidden">
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
                                            <Label htmlFor="roomHeight">Height</Label>
                                            <Input id="roomHeight" type="number" value={localHeight} onChange={(e) => setLocalHeight(e.target.value)} onBlur={handleRoomUpdate} min="100" />
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
                                     <ScrollArea className="h-48 w-full rounded-md border p-2">
                                         {availableModels.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center p-2">No models</p>
                                        ) : (
                                            <div className="space-y-1">
                                            {availableModels.map((model) => (
                                                <Button key={model.id} onClick={() => handleAddFurniture(model)} variant="ghost" className="w-full justify-start">
                                                 <PackagePlus className="mr-2 h-4 w-4"/>{model.name}
                                                </Button>
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
                        <Card className={`shadow-sm overflow-hidden ${isFloorPlanMinimized ? 'hidden' : (isCanvas3DMinimized ? 'flex-1' : 'flex-1 min-h-[300px]')}`}> 
                            <CardHeader className="p-2 border-b flex flex-row items-center justify-between"> {/* Flex header */} 
                                <CardTitle className="text-sm font-medium">2D Floor Plan</CardTitle>
                                {/* Minimize Button */} 
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleFloorPlan}>
                                            <Minimize2 className="h-4 w-4" />
                                            <span className="sr-only">Minimize 2D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Minimize 2D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent className="p-0 h-full w-full relative">
                                <FloorPlanView /> 
                            </CardContent>
                        </Card>
                        {/* 3D View - Conditionally render size/visibility */} 
                        <Card className={`shadow-sm overflow-hidden ${isCanvas3DMinimized ? 'hidden' : (isFloorPlanMinimized ? 'flex-1' : 'h-1/3 min-h-[200px]')}`}> 
                             <CardHeader className="p-2 border-b flex flex-row items-center justify-between"> {/* Flex header */} 
                                <CardTitle className="text-sm font-medium">3D Preview</CardTitle>
                                 {/* Minimize Button */} 
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleCanvas3D}>
                                            <Minimize2 className="h-4 w-4" />
                                            <span className="sr-only">Minimize 3D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Minimize 3D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent className="p-0 h-full w-full">
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