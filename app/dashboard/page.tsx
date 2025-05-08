'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// No Link import needed directly here if actions are through buttons/router.push

import { useDesignContext, DesignState } from "@/context/DesignContext";

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
// Re-add Table related imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// --- Lucide Icons --- 
import {
    Loader2,
    Trash2,
    Download, // Keep for Load button
    Plus,
    FileWarning,
    LayoutDashboard, // Changed from Construction for a more general dashboard icon
    FolderOpen,
    ImageIcon, // For thumbnail placeholder - will be replaced
} from 'lucide-react';

// Import the new preview component
import RotatingDesignPreview from '@/components/previews/RotatingDesignPreview'; 

// --- Define RoomData and FurnitureItem interfaces (can be moved to a shared types file) ---
// These should mirror or be compatible with what RotatingDesignPreview expects
// and what your API will provide for each design in the list.
interface RoomData {
  width: number;
  depth: number;
  height: number;
}

interface FurnitureItem {
  id: string | number;
  type: 'sofa' | 'table' | 'chair' | 'lamp' | 'generic'; 
  x: number;
  y: number; 
  z: number;
  width: number;
  height: number;
  depth: number;
}
// --- End Interface Definitions ---

interface DesignListItem {
    id: number;
    name: string;
    createdAt?: string;
    roomData?: RoomData; // Added for 3D preview
    furnitureData?: FurnitureItem[]; // Added for 3D preview
}

export default function DashboardPage() {
    const [savedDesigns, setSavedDesigns] = useState<DesignListItem[]>([]);
    const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const router = useRouter();
    const { loadDesign, resetDesign } = useDesignContext();

    const fetchSavedDesigns = async () => {
        setIsLoadingDesigns(true);
        setLoadError(null);
        try {
            const res = await fetch('/api/designs');
            if (!res.ok) throw new Error('Failed to fetch saved designs. Ensure API returns roomData and furnitureData for previews.');
            const designs: DesignListItem[] = await res.json();
            // --- Mock Data Example (Remove when API provides real data) ---
            // REMOVED MOCK DATA GENERATION
            // The API (/api/designs) MUST now return roomData and furnitureData for each design item.
            setSavedDesigns(designs); // Use this once API returns full data
        } catch (error: any) {
            console.error('Load list error:', error);
            setLoadError(error.message || 'Could not load designs');
            setSavedDesigns([]);
        } finally {
            setIsLoadingDesigns(false);
        }
    };

    useEffect(() => {
        fetchSavedDesigns();
        // TODO: Add auth check here - redirect to /login if not authenticated
    }, []);

    const handleCreateNew = () => {
        resetDesign();
        router.push('/design');
    };

    const handleLoadDesign = async (id: number) => {
        setLoadError(null);
        // Add a per-card loading state if desired, or a global one
        try {
            const res = await fetch(`/api/designs/${id}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to load design');
            }
            const loadedData = await res.json();
            const designToLoad: Pick<DesignState, 'room' | 'furniture'> = {
                room: loadedData.room,
                furniture: loadedData.furniture
            };
            loadDesign(designToLoad);
            router.push('/design');
        } catch (error: any) {
            console.error('Load specific design error:', error);
            setLoadError(error.message || 'Failed to load selected design');
        }
    };

    const handleDeleteDesign = async (id: number) => {
        setLoadError(null);
        try {
            const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete design');
            }
            fetchSavedDesigns(); 
        } catch(error: any) {
            console.error('Delete design error:', error);
            setLoadError(error.message || 'Failed to delete selected design');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
            <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <Card className="w-full max-w-7xl mx-auto bg-slate-800 border-slate-700 shadow-2xl z-10 relative">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
                    <div>
                        <CardTitle className="text-3xl font-bold flex items-center gap-3 text-slate-50">
                             <LayoutDashboard className="h-8 w-8 text-orange-400"/> 
                            My Designs
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-1">Create, load, or manage your room designs.</CardDescription>
                    </div>
                    <Button 
                        onClick={handleCreateNew} 
                        className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 text-base"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Create New Design
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                     {loadError && (
                        <Alert variant="destructive" className="mb-6 bg-red-900/30 border-red-700 text-red-300">
                            <FileWarning className="h-5 w-5 text-red-400" />
                            <AlertTitle className="font-semibold text-red-200">Error Loading Designs</AlertTitle>
                            <AlertDescription>{loadError}</AlertDescription>
                        </Alert>
                    )}
                    {isLoadingDesigns ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-16 w-16 animate-spin text-orange-500"/>
                        </div>
                     ) : savedDesigns.length === 0 && !loadError ? (
                        <div className="text-center py-20 text-slate-400">
                            <FolderOpen className="mx-auto h-16 w-16 mb-4 text-slate-500" />
                            <p className="text-xl font-semibold">No saved designs found.</p>
                            <p className="text-md mt-2">Click "Create New Design" to get started.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-240px)] pr-3">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-700">
                                        <TableHead className="w-[100px] text-slate-300">Preview</TableHead>
                                        <TableHead className="text-slate-300">Name</TableHead>
                                        <TableHead className="text-slate-300">Saved On</TableHead>
                                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savedDesigns.map(design => {
                                        // --- DEBUG LOG --- 
                                        console.log('Dashboard - Design object for preview:', JSON.stringify(design, null, 2));
                                        // --- END DEBUG LOG ---
                                        return (
                                            <TableRow key={design.id} className="border-slate-700 hover:bg-slate-700/50">
                                                <TableCell className="p-2">
                                                    <div className="w-28 h-20 bg-slate-600/50 rounded overflow-hidden">
                                                        {design.roomData && design.furnitureData ? (
                                                            <RotatingDesignPreview 
                                                                roomData={design.roomData} 
                                                                furnitureData={design.furnitureData} 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                                <ImageIcon className="h-8 w-8 mb-1" />
                                                                <p className="text-xs text-center">No Preview</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-100 py-4 px-3 truncate" title={design.name}>{design.name}</TableCell>
                                                <TableCell className="text-slate-300 py-4 px-3">
                                                    {new Date(design.createdAt || Date.now()).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right space-x-1 py-4 px-3">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleLoadDesign(design.id)}
                                                        className="text-orange-400 border-orange-400/50 hover:bg-orange-400/10 hover:text-orange-300 h-8 px-2"
                                                    >
                                                        <Download className="mr-1.5 h-3 w-3"/> Load
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="destructive"
                                                                size="sm"
                                                                className="bg-red-600/80 hover:bg-red-600 text-white h-8 px-2"
                                                            >
                                                                <Trash2 className="mr-1.5 h-3 w-3"/> Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-50">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-slate-50">Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400">
                                                                    This action cannot be undone. This will permanently delete the design "{design.name}".
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="border-slate-600 hover:bg-slate-700 text-slate-300">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => handleDeleteDesign(design.id)} 
                                                                    className="bg-red-600 hover:bg-red-500 text-white"
                                                                >
                                                                    Yes, delete design
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
                {savedDesigns.length > 0 && !isLoadingDesigns && !loadError && (
                    <CardFooter className="p-4 border-t border-slate-700 text-sm text-slate-400">
                        Showing {savedDesigns.length} saved design(s).
                    </CardFooter>
                )}
            </Card>
        </div>
    );
} 