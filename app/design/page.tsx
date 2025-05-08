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
         return <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-200">Redirecting to login...</div>; // Placeholder
    }

    const inputStyles = "bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60";
    const sidebarHeaderStyles = "text-sm font-semibold mb-3 flex items-center gap-2 text-slate-200";
    const labelStyles = "text-slate-400 text-xs";
    const destructiveAlertStyles = "bg-red-900/20 border-red-700/50 text-red-300";
    const tooltipContentStyles = "bg-slate-700 text-slate-200 border-slate-600";
    const alertDialogContentStyles = "bg-slate-800 border-slate-700 text-slate-50";
    const destructiveButtonStyles = "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500";
    const orangeButtonStyles = "bg-orange-600 hover:bg-orange-500 text-white focus:ring-orange-500 disabled:opacity-70";
    // const outlineButtonStyles = "border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-slate-100 focus:ring-slate-500";
    // New orange outline style for header buttons that should have accent
    const orangeAccentOutlineButtonStyles = "border-orange-600/70 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 focus:ring-orange-500 focus:ring-offset-slate-800";
    // Neutral outline style for less prominent actions if needed, or for cancel buttons
    const neutralOutlineButtonStyles = "border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-slate-100 focus:ring-slate-500 focus:ring-offset-slate-800";

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-col h-screen bg-slate-900 text-slate-50 selection:bg-orange-500 selection:text-white">
                {/* --- Top Navigation --- */}
                <header className="flex h-14 items-center gap-4 border-b border-slate-700 bg-slate-800 px-4 lg:h-[60px] lg:px-6 z-20 sticky top-0">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-50 hover:text-orange-400 transition-colors">
                        <Layout className="h-5 w-5 text-orange-400" />
                        <span className="">Room Planner</span>
                    </Link>
                     <div className="flex-1">
                        {/* Placeholder for central nav items or breadcrumbs */}
                     </div>
                     <div className="flex items-center gap-2">
                         {/* Reset Layout Button */} 
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className={`h-8 w-8 ${orangeAccentOutlineButtonStyles}`} onClick={handleResetLayout}>
                                    <Layout className="h-4 w-4" />
                                    <span className="sr-only">Reset Layout</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className={tooltipContentStyles}>Reset Layout</TooltipContent>
                        </Tooltip>
                        <Separator orientation="vertical" className="h-6 bg-slate-700" />
                         {/* Save Input & Button - Simplified for now */}
                         <Input 
                             type="text" 
                             placeholder="Enter design name to save..." 
                             className={`h-8 w-48 text-xs ${inputStyles}`} 
                             value={saveDesignName}
                             onChange={(e) => setSaveDesignName(e.target.value)}
                             disabled={isSaving}
                         />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className={`h-8 w-8 ${isSaving || !saveDesignName.trim() ? 'bg-slate-600 text-slate-400' : orangeButtonStyles}`}
                                    onClick={handleSaveDesign}
                                    disabled={isSaving || !saveDesignName.trim()}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                    <span className="sr-only">Save Design</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className={tooltipContentStyles}>Save Design</TooltipContent>
                        </Tooltip>
                         {/* Maybe add Load button triggering a Dialog? */}
                         {/* User/Logout Button */}
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className={`h-8 w-8 ${orangeAccentOutlineButtonStyles}`} onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" />
                                    <span className="sr-only">Logout</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className={tooltipContentStyles}>Logout</TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                {/* --- Main Content Area (Sidebars + Center) --- */}
                <div className="flex flex-1 overflow-hidden"> {/* Main area below nav */} 
                    {/* --- Left Sidebar --- (Now Room Settings & Edit Item) */}
                    <aside className="w-72 border-r border-slate-700 flex flex-col bg-slate-800 overflow-y-auto">
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-6">
                                <section>
                                    <h3 className={sidebarHeaderStyles}><Settings className="h-4 w-4 text-orange-400"/> Room Settings</h3>
                                    <div className="space-y-3">
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="roomWidth" className={labelStyles}>Width (cm)</Label>
                                            <Input id="roomWidth" type="number" value={localWidth} onChange={(e) => setLocalWidth(e.target.value)} onBlur={handleRoomUpdate} min="100" className={inputStyles} />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="roomLength" className={labelStyles}>Length (cm)</Label>
                                            <Input id="roomLength" type="number" value={localLength} onChange={(e) => setLocalLength(e.target.value)} onBlur={handleRoomUpdate} min="100" className={inputStyles} />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="wallHeight" className={labelStyles}>Wall Height (cm)</Label>
                                            <Input id="wallHeight" type="number" value={localWallHeight} onChange={(e) => setLocalWallHeight(e.target.value)} onBlur={handleRoomUpdate} min="50" className={inputStyles} />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="wallColor" className={labelStyles}><Palette className="h-3 w-3 inline mr-1 text-orange-400"/> Wall Color</Label>
                                            <Input id="wallColor" type="color" value={localWallColor} onChange={handleColorChange} className={`h-8 p-0.5 cursor-pointer ${inputStyles}`} />
                                        </div>
                                    </div>
                                </section>
                                <Separator className="bg-slate-700"/>
                                {/* Selected Item Editor - MOVED HERE */}
                                {selectedItem ? (
                                <section>
                                    <h3 className={sidebarHeaderStyles}><Settings className="h-4 w-4 text-orange-400"/> Edit Item</h3>
                                    <div className={`space-y-4 rounded-md border border-slate-700 p-3 bg-slate-700/30`}>
                                        <p className="text-sm font-medium text-slate-100 truncate"> 
                                            Selected: {selectedItem.modelName || `Item ID: ${typeof selectedItem.id === 'string' ? selectedItem.id.substring(0,6) : selectedItem.id}...`}
                                        </p>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemScale" className={`flex items-center justify-between ${labelStyles}`}>
                                                <span className="flex items-center gap-1"><Scale className="h-3 w-3 text-orange-400/80"/> Scale</span>
                                                <span className="text-slate-200">{(selectedItem.scale ?? 1).toFixed(2)}x</span>
                                            </Label>
                                            <Slider id="itemScale" min={0.1} max={3.0} step={0.05} value={[selectedItem.scale ?? 1]} onValueChange={handleScaleChange} className="my-2 [&>span:first-child]:bg-orange-500 [&>span:first-child_span]:bg-slate-50"/>
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemRotation" className={`flex items-center justify-between ${labelStyles}`}>
                                                <span className="flex items-center gap-1"><RotateCw className="h-3 w-3 text-orange-400/80"/> Rotation</span>
                                                <span className="text-slate-200">{THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0).toFixed(0)}°</span>
                                            </Label>
                                            <Slider id="itemRotation" min={0} max={360} step={1} value={[THREE.MathUtils.radToDeg(selectedItem.rotationY ?? 0)]} onValueChange={handleRotationChange} className="my-2 [&>span:first-child]:bg-orange-500 [&>span:first-child_span]:bg-slate-50"/>
                                        </div>
                                        {/* --- HSL Controls --- */}
                                        <Separator className="bg-slate-600 my-2" />
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemHue" className={`flex items-center justify-between ${labelStyles}`}>
                                                <span className="flex items-center gap-1"><Palette className="h-3 w-3 text-orange-400/80"/> Hue</span>
                                                <span className="text-slate-200">{selectedItem.hue ?? 0}°</span>
                                            </Label>
                                            <Slider 
                                                id="itemHue" 
                                                min={0} max={360} step={1} 
                                                value={[selectedItem.hue ?? 0]} 
                                                onValueChange={(value) => updateFurniture(selectedItem.id, { hue: value[0] })} 
                                                className="my-2 [&>span:first-child]:bg-orange-500 [&>span:first-child_span]:bg-slate-50"/>
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemSaturation" className={`flex items-center justify-between ${labelStyles}`}>
                                                <span className="flex items-center gap-1"><Palette className="h-3 w-3 text-orange-400/80"/> Saturation</span>
                                                <span className="text-slate-200">{((selectedItem.saturation ?? 1) * 100).toFixed(0)}%</span>
                                            </Label>
                                            <Slider 
                                                id="itemSaturation" 
                                                min={0} max={100} step={1} 
                                                value={[(selectedItem.saturation ?? 1) * 100]} 
                                                onValueChange={(value) => updateFurniture(selectedItem.id, { saturation: value[0] / 100 })} 
                                                className="my-2 [&>span:first-child]:bg-orange-500 [&>span:first-child_span]:bg-slate-50"/>
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="itemLightness" className={`flex items-center justify-between ${labelStyles}`}>
                                                <span className="flex items-center gap-1"><Palette className="h-3 w-3 text-orange-400/80"/> Lightness</span>
                                                <span className="text-slate-200">{((selectedItem.lightness ?? 0.5) * 100).toFixed(0)}%</span> 
                                            </Label>
                                            <Slider 
                                                id="itemLightness" 
                                                min={0} max={100} step={1} 
                                                value={[(selectedItem.lightness ?? 0.5) * 100]} // Default to 50% if not set
                                                onValueChange={(value) => updateFurniture(selectedItem.id, { lightness: value[0] / 100 })} 
                                                className="my-2 [&>span:first-child]:bg-orange-500 [&>span:first-child_span]:bg-slate-50"/>
                                        </div>
                                        <Separator className="bg-slate-700"/>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className={`w-full ${destructiveButtonStyles}`}><Eraser className="mr-2 h-4 w-4" /> Delete Item</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className={alertDialogContentStyles}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-slate-50">Delete Item?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        Are you sure you want to delete "{selectedItem.modelName || 'this item'}" from the design?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="border-t border-slate-700 pt-4 mt-4">
                                                    <AlertDialogCancel className={`border-slate-600 hover:bg-slate-700 text-slate-300 ${neutralOutlineButtonStyles}`}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteSelectedItem} className={destructiveButtonStyles}>Yes, delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </section>
                                ) : (
                                    <div className="text-center text-sm text-slate-500 p-4 pt-10">
                                        <p>Select an item in the 2D or 3D view to edit its properties.</p>
                                    </div>
                                )} 
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* --- Center Area --- Adjusted for collapsible panes */}
                    <main className="flex-1 flex flex-col p-4 space-y-4 bg-slate-950 overflow-auto">
                        {/* 2D View - Conditionally render size/visibility */} 
                        <Card className={`shadow-md overflow-hidden transition-all duration-300 ease-in-out bg-slate-800 border-slate-700 ${isFloorPlanMinimized ? 'flex-none h-14' : (isCanvas3DMinimized ? 'flex-1' : 'flex-1 min-h-[300px]')}`}> 
                            <CardHeader className="border-b border-slate-700 flex flex-row items-center justify-between h-6"> {/* Fixed header height */} 
                                <CardTitle className="text-sm font-medium text-slate-200">2D Floor Plan</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {/* Button toggles state, icon changes based on state */} 
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700" onClick={toggleFloorPlan}>
                                            {isFloorPlanMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                            <span className="sr-only">{isFloorPlanMinimized ? 'Maximize' : 'Minimize'} 2D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className={tooltipContentStyles}>{isFloorPlanMinimized ? 'Maximize' : 'Minimize'} 2D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            {/* Hide content when minimized */} 
                            <CardContent className={`p-0 h-full w-full relative bg-slate-850 ${isFloorPlanMinimized ? 'hidden' : 'block'}`}> 
                                <FloorPlanView /> 
                            </CardContent>
                        </Card>
                        {/* 3D View - Conditionally render size/visibility */} 
                        <Card className={`shadow-md overflow-hidden transition-all duration-300 ease-in-out bg-slate-800 border-slate-700 ${isCanvas3DMinimized ? 'flex-none h-14' : (isFloorPlanMinimized ? 'flex-1' : 'h-1/3 min-h-[200px]')}`}> 
                             <CardHeader className="border-b border-slate-700 flex flex-row items-center justify-between h-6"> {/* Fixed header height */} 
                                <CardTitle className="text-sm font-medium text-slate-200">3D Preview</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {/* Button toggles state, icon changes based on state */} 
                                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700" onClick={toggleCanvas3D}>
                                            {isCanvas3DMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                            <span className="sr-only">{isCanvas3DMinimized ? 'Maximize' : 'Minimize'} 3D View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className={tooltipContentStyles}>{isCanvas3DMinimized ? 'Maximize' : 'Minimize'} 3D</TooltipContent>
                                </Tooltip>
                            </CardHeader>
                             {/* Hide content when minimized */} 
                            <CardContent className={`p-0 h-full w-full bg-slate-850 ${isCanvas3DMinimized ? 'hidden' : 'block'}`}> 
                                 <Canvas3D />
                            </CardContent>
                        </Card>
                    </main>

                    {/* --- Right Sidebar --- (Now Upload Model & Add Furniture) */}
                    <aside className="w-64 border-l border-slate-700 flex flex-col bg-slate-800 overflow-y-auto">
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-6">
                                {/* Upload Model - MOVED HERE */} 
                                <section>
                                    <h3 className={sidebarHeaderStyles}><Upload className="h-4 w-4 text-orange-400"/> Upload Model</h3>
                                    <div className="space-y-3">
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="modelName" className={labelStyles}>Model Name</Label>
                                            <Input id="modelName" type="text" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Enter unique name..." disabled={uploading} className={inputStyles} />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <Label htmlFor="modelFile" className={labelStyles}>GLTF/GLB File</Label>
                                            <Input ref={fileInputRef} id="modelFile" type="file" accept=".gltf,.glb" onChange={handleFileChange} disabled={uploading} className={`text-sm ${inputStyles} file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-500 file:text-xs file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500`} />
                                        </div>
                                        <Button onClick={handleUpload} disabled={uploading || !selectedFile || !newModelName} className={`w-full ${uploading || !selectedFile || !newModelName ? 'bg-slate-600 text-slate-400' : orangeButtonStyles}`}>
                                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>} {uploading ? 'Uploading...' : 'Upload Model'}
                                        </Button>
                                        {uploadError && <Alert variant="destructive" className={`mt-2 ${destructiveAlertStyles}`}><FileWarning className="h-4 w-4"/><AlertTitle className="text-red-200">Upload Error</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>}
                                    </div>
                                </section>
                                <Separator className="bg-slate-700" />
                                {/* Add Furniture - MOVED HERE */} 
                                <section>
                                    <h3 className={sidebarHeaderStyles}><List className="h-4 w-4 text-orange-400"/> Add Furniture</h3>
                                    {deleteModelError && <Alert variant="destructive" className={`mb-2 text-xs ${destructiveAlertStyles}`}><FileWarning className="h-4 w-4"/><AlertTitle className="text-red-200">Delete Error</AlertTitle><AlertDescription>{deleteModelError}</AlertDescription></Alert>}
                                     <ScrollArea className="h-48 w-full rounded-md border border-slate-700 p-2 bg-slate-900/30">
                                         {availableModels.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center p-2">No models uploaded</p>
                                        ) : (
                                            <div className="space-y-1">
                                            {availableModels.map((model) => (
                                                <div key={model.id} className="flex items-center justify-between gap-1 group p-1 rounded hover:bg-slate-700/70">
                                                    <Button 
                                                        onClick={() => handleAddFurniture(model)} 
                                                        variant="ghost" 
                                                        className="flex-grow justify-start text-left h-8 px-2 text-slate-300 hover:text-slate-100 hover:bg-transparent"
                                                    >
                                                        <PackagePlus className="mr-2 h-4 w-4 flex-shrink-0 text-orange-400/80"/>
                                                        <span className="truncate text-sm">{model.name}</span>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 text-slate-500 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                                disabled={isDeletingModel === model.id}
                                                            >
                                                                {isDeletingModel === model.id ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Trash2 className="h-4 w-4" />}
                                                                <span className="sr-only">Delete {model.name}</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className={alertDialogContentStyles}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-slate-50">Delete Model?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400">
                                                                    This will permanently delete the model "{model.name}" from the library.
                                                                    This action cannot be undone. Furniture using this model in saved designs might not render correctly.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="border-t border-slate-700 pt-4 mt-4">
                                                                <AlertDialogCancel className={`border-slate-600 hover:bg-slate-700 text-slate-300 ${neutralOutlineButtonStyles}`}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => handleDeleteModel(model.id)} 
                                                                    className={destructiveButtonStyles}
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
                                {/* Placeholder if right sidebar becomes empty otherwise */}
                                { !selectedItem && availableModels.length === 0 && (
                                    <div className="text-center text-sm text-slate-500 p-4 pt-10">
                                        <p>Upload models or select items to add to your design.</p>
                                    </div>
                                )} 
                            </div>
                        </ScrollArea>
                    </aside>
                </div> 
            </div>
        </TooltipProvider>
    );
} 