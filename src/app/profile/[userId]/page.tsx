"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            getUserProfile(userId)
                .then(setProfile)
                .finally(() => setLoading(false));
        }
    }, [userId]);

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    if (loading) {
        return (
            <main className="container mx-auto p-4 md:p-8 flex justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-6 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full mt-4" />
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
                    <CardHeader className="items-center text-center border-b pb-6">
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
                    <CardContent className="pt-6">
                        <div className="text-center">
                             <h3 className="text-lg font-semibold mb-4">User Profile</h3>
                             <p className="text-muted-foreground">More details about the user's game history could go here.</p>
                              <Link href="/" passHref>
                                <Button variant="outline" className="mt-6">
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
             </div>
        </main>
    );
}
