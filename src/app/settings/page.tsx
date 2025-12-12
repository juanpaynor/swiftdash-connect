'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/database.types';
import { Loader2, User as UserIcon, Palette, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const supabase = createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/');
      return;
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      return;
    }

    setUser(userRecord);

    // Check if user is owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('organization_id', userRecord.default_organization_id)
      .single();

    setIsOwner(membership?.role === 'owner');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and organization preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {isOwner && <TabsTrigger value="branding">Branding</TabsTrigger>}
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Manage your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Update your profile information, including your name and avatar.
                  </p>
                  <Link href="/profile">
                    <Button>Go to Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab (Owner Only) */}
          {isOwner && (
            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    White-Label Branding
                  </CardTitle>
                  <CardDescription>
                    Customize colors, logo, and fonts for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      As an organization owner, you can customize the branding to match
                      your company identity (if enabled by the platform admin).
                    </p>
                    <Link href="/settings/branding">
                      <Button>Manage Branding</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Application preferences and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Account Info */}
                  <div>
                    <h3 className="mb-2 font-semibold">Account Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        <span className="font-medium">{user?.email}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Role:</span>{' '}
                        <span className="font-medium">{isOwner ? 'Owner' : 'Member'}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Joined:</span>{' '}
                        <span className="font-medium">
                          {new Date(user?.created_at || '').toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Notifications (Placeholder) */}
                  <div>
                    <h3 className="mb-2 font-semibold">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Notification preferences coming soon...
                    </p>
                  </div>

                  {/* Preferences (Placeholder) */}
                  <div>
                    <h3 className="mb-2 font-semibold">Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Additional settings coming soon...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
