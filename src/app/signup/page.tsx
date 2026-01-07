'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOrganizationAndUser, joinOrganization } from '@/app/actions/signup';
import { Navbar } from '@/components/layout/navbar';
import { createClient } from '@/lib/supabase/client';

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
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
      <Navbar />

      <div className="flex min-h-screen w-full lg:grid lg:grid-cols-2">
        {/* Left Side: Form */}
        <div className="flex items-center justify-center px-4 py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[450px]"
          >
            <div className="mb-8 text-center">
              <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
                <div className="flex items-center gap-2 font-medium">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <img src="/assets/logo.png" alt="SwiftDash" className="h-4 w-4 object-contain brightness-0 invert" />
                  </div>
                  SwiftDash Live
                </div>
              </h1>
              <p className="mt-2 text-slate-400">Create your account</p>
            </div>

            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1">
                <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400">Create Organization</TabsTrigger>
                <TabsTrigger value="join" className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400">Join Organization</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="create">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Create New Organization</CardTitle>
                      <CardDescription className="text-slate-400">
                        Start your own organization and invite team members
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateOrganization} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgName" className="text-white">Organization Name</Label>
                          <Input
                            id="orgName"
                            placeholder="Acme Corporation"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-white">Full Name</Label>
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : 'Create Organization'}
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-950 px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
                          onClick={handleGoogleSignup}
                          disabled={isLoading}
                        >
                          Sign up with Google
                        </Button>

                        <p className="text-center text-sm text-slate-400">
                          Already have an account?{' '}
                          <Link href="/login" className="text-primary hover:underline">
                            Login
                          </Link>
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="join">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Join Organization</CardTitle>
                      <CardDescription className="text-slate-400">
                        Join an existing organization using an invite code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleJoinOrganization} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="joinCode" className="text-white">Organization Code</Label>
                          <Input
                            id="joinCode"
                            placeholder="acme-corporation"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                          <p className="text-xs text-slate-500">
                            Enter the organization's slug (e.g., acme-corporation)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="joinFullName" className="text-white">Full Name</Label>
                          <Input
                            id="joinFullName"
                            placeholder="John Doe"
                            value={joinFullName}
                            onChange={(e) => setJoinFullName(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="joinEmail" className="text-white">Email</Label>
                          <Input
                            id="joinEmail"
                            type="email"
                            placeholder="john@example.com"
                            value={joinEmail}
                            onChange={(e) => setJoinEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="joinPassword" className="text-white">Password</Label>
                          <Input
                            id="joinPassword"
                            type="password"
                            placeholder="••••••••"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Joining...
                            </>
                          ) : 'Join Organization'}
                        </Button>

                        <p className="text-center text-sm text-slate-400">
                          Already have an account?{' '}
                          <Link href="/login" className="text-primary hover:underline">
                            Login
                          </Link>
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </div>

        {/* Right Side: Animated Portal Visual */}
        <div className="relative hidden w-full overflow-hidden bg-slate-900 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80" />

          {/* Different Animation Pattern for Signup */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -45, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [0, 45, 0],
              y: [0, 50, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[80%] w-[80%] rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-4 shadow-2xl">
              {/* Abstract UI Representation of "Organization" */}
              <div className="grid h-full w-full grid-cols-2 gap-4">
                <div className="col-span-2 h-1/3 rounded-xl bg-slate-950/50 p-6">
                  <div className="h-full w-full rounded-lg bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-white/10" />
                        <div className="h-2 w-20 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2/3 rounded-xl bg-slate-950/50" />
                <div className="h-2/3 rounded-xl bg-slate-950/50" />
              </div>

              {/* Floating "Team Growth" Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-8 w-8 rounded-full border-2 border-slate-900 bg-primary/${40 + (i * 10)}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-white">+ Team Ready</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
