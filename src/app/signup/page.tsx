'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOrganizationAndUser, joinOrganization } from '@/app/actions/signup';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Create Organization state
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Join Organization state
  const [joinCode, setJoinCode] = useState('');
  const [joinFullName, setJoinFullName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await createOrganizationAndUser({
      email,
      password,
      fullName,
      orgName,
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Organization Creation Failed',
        description: result.error,
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Success!',
      description: 'Account and organization created successfully',
    });

    router.push('/dashboard');
    router.refresh();
  };

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await joinOrganization({
      email: joinEmail,
      password: joinPassword,
      fullName: joinFullName,
      joinCode,
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Join Organization Failed',
        description: result.error,
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Success!',
      description: `You've joined ${result.orgName} successfully`,
    });

    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">SwiftDash Connect</h1>
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Organization</TabsTrigger>
            <TabsTrigger value="join">Join Organization</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Organization</CardTitle>
                <CardDescription>
                  Start your own organization and invite team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      placeholder="Acme Corporation"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Organization'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                  >
                    Sign up with Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/" className="underline">
                      Login
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Join Organization</CardTitle>
                <CardDescription>
                  Join an existing organization using an invite code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Organization Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="acme-corporation"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the organization's slug (e.g., acme-corporation)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinFullName">Full Name</Label>
                    <Input
                      id="joinFullName"
                      placeholder="John Doe"
                      value={joinFullName}
                      onChange={(e) => setJoinFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinEmail">Email</Label>
                    <Input
                      id="joinEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={joinEmail}
                      onChange={(e) => setJoinEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinPassword">Password</Label>
                    <Input
                      id="joinPassword"
                      type="password"
                      placeholder="••••••••"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Joining...' : 'Join Organization'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/" className="underline">
                      Login
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
