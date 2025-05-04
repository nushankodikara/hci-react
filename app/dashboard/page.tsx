'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // For delete confirmation

// --- Lucide Icons --- 
import {
    Loader2,
    Trash2,
    Download,
    Plus,
    FileWarning,
    Construction,
    FolderOpen, // Or similar for empty state
} from 'lucide-react';

// Type for the list of designs fetched from API
interface DesignListItem {
    id: number;
    name: string;
    createdAt?: string;
}

export default function DashboardPage() {
    const [savedDesigns, setSavedDesigns] = useState<DesignListItem[]>([]);
    const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const router = useRouter();
    const { loadDesign, resetDesign } = useDesignContext(); // Need loadDesign and a way to reset

    // --- Fetch Designs --- 
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

    useEffect(() => {
        fetchSavedDesigns();
        // TODO: Add auth check here - redirect to /login if not authenticated
    }, []);

    // --- Handlers --- 
    const handleCreateNew = () => {
        resetDesign(); // Reset context state to defaults
        router.push('/design'); // Navigate to the designer page
    };

    const handleLoadDesign = async (id: number) => {
        console.log(`Loading design ID: ${id}`);
        // Consider adding a loading state here
        setLoadError(null);
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
            loadDesign(designToLoad); // Update context 
            router.push('/design'); // Navigate to designer
        } catch (error: any) {
            console.error('Load specific design error:', error);
            setLoadError(error.message || 'Failed to load selected design');
            // Show error to user (e.g., using Toast)
        }
    };

    const handleDeleteDesign = async (id: number) => {
        console.log(`Deleting design ID: ${id}`);
        // Consider adding a loading state
        setLoadError(null); 
        try {
            const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete design');
            }
            console.log('Design deleted successfully');
            // Refresh the list after delete
            fetchSavedDesigns(); 
        } catch(error: any) {
            console.error('Delete design error:', error);
            setLoadError(error.message || 'Failed to delete selected design');
            // Show error to user
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                             <Construction className="h-6 w-6"/> 
                            My Designs
                        </CardTitle>
                        <CardDescription>Create, load, or manage your room designs.</CardDescription>
                    </div>
                    <Button onClick={handleCreateNew}>
                        <Plus className="mr-2 h-4 w-4" /> Create New Design
                    </Button>
                </CardHeader>
                <CardContent>
                     {loadError && (
                        <Alert variant="destructive" className="mb-4">
                            <FileWarning className="h-4 w-4" />
                            <AlertTitle>Error Loading Designs</AlertTitle>
                            <AlertDescription>{loadError}</AlertDescription>
                        </Alert>
                    )}
                    {isLoadingDesigns ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground"/>
                        </div>
                     ) : savedDesigns.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FolderOpen className="mx-auto h-12 w-12 mb-4" />
                            <p>No saved designs found.</p>
                            <p className="text-sm">Click "Create New Design" to get started.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[60vh]"> 
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Saved On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savedDesigns.map(design => (
                                    <TableRow key={design.id}>
                                        <TableCell className="font-medium">{design.name}</TableCell>
                                        <TableCell>{new Date(design.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button 
                                                variant="default" 
                                                size="sm"
                                                onClick={() => handleLoadDesign(design.id)}
                                            >
                                                <Download className="mr-1 h-3 w-3"/> Load
                                            </Button>
                                            
                                            {/* Delete Confirmation Dialog */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="mr-1 h-3 w-3"/> Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the design "{design.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteDesign(design.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Yes, delete design
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
                {savedDesigns.length > 0 && (
                    <CardFooter className="text-sm text-muted-foreground">
                        Showing {savedDesigns.length} saved design(s).
                    </CardFooter>
                )}
            </Card>
        </div>
    );
} 