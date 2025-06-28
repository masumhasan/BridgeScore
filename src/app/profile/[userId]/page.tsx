"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, User, Edit, Save, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
    const params = useParams();
    const { toast } = useToast();
    const { user, loading: authLoading, updateUsername } = useAuth();
    
    const userId = params.userId as string;
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    const isOwner = user?.uid === userId;

    useEffect(() => {
        if (userId) {
            getUserProfile(userId)
                .then(profileData => {
                    setProfile(profileData);
                    setNewDisplayName(profileData?.displayName || '');
                })
                .finally(() => setLoading(false));
        }
    }, [userId]);
    
    // When the user object from auth context changes (e.g., after update),
    // update the local profile state to match.
    useEffect(() => {
        if (isOwner && user?.displayName !== profile?.displayName) {
             setProfile(prev => prev ? { ...prev, displayName: user?.displayName || null } : null);
        }
    }, [user?.displayName, isOwner, profile?.displayName]);


    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleSave = async () => {
        if (!newDisplayName.trim()) {
            setEditError("Username cannot be empty.");
            return;
        }
        if (newDisplayName.trim() === (profile?.displayName || '')) {
            setIsEditing(false);
            setEditError(null);
            return;
        }
        
        setIsSaving(true);
        setEditError(null);
        
        const { success, message } = await updateUsername(newDisplayName.trim());
        
        if (success) {
            // Update local state immediately for better UX
            setProfile(prev => prev ? { ...prev, displayName: newDisplayName.trim() } : null);
            setIsEditing(false);
            toast({ title: 'Success', description: message });
        } else {
            setEditError(message);
        }
        
        setIsSaving(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewDisplayName(profile?.displayName || '');
        setEditError(null);
    };

    const renderProfileContent = () => {
        if (isEditing) {
            return (
                 <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName" className="font-semibold">Username</Label>
                            <Input 
                                id="displayName" 
                                value={newDisplayName} 
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                className="text-base"
                                disabled={isSaving}
                            />
                            {editError && <p className="text-sm text-destructive pt-1">{editError}</p>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            );
        }

        return (
            <CardContent className="pt-6">
                <div className="text-center">
                     <h3 className="text-lg font-semibold mb-4">User Activity</h3>
                     <p className="text-muted-foreground">More details about the user's game history could go here.</p>
                      <Link href="/" passHref>
                        <Button variant="outline" className="mt-6">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </CardContent>
        );
    };

    if (loading || authLoading) {
        return (
            <main className="container mx-auto p-4 md:p-8 flex justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-6 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Skeleton className="h-10 w-full mt-4" />
                        <Skeleton className="h-20 w-full mt-4" />
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    if (!profile) {
        return (
            <main className="container mx-auto p-4 md:p-8 text-center">
                <h1 className="text-2xl font-bold">User not found</h1>
                <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
                 <Link href="/" passHref>
                    <Button variant="link" className="mt-4">Go back to Home</Button>
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
             <div className="container mx-auto p-4 md:p-8">
                <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader className="items-center text-center border-b pb-6 relative">
                        {isOwner && !isEditing && (
                            <Button variant="outline" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Profile</span>
                            </Button>
                        )}
                        <Avatar className="h-24 w-24 text-3xl">
                            <AvatarImage src={profile.photoURL ?? ''} alt={profile.displayName ?? ''} />
                            <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="mt-4 text-3xl">{profile.displayName || 'Anonymous User'}</CardTitle>
                        <div className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4" />
                            <span>{profile.email}</span>
                        </div>
                    </CardHeader>
                    {renderProfileContent()}
                </Card>
             </div>
        </main>
    );
}
