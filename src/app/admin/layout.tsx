'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Building2, LogOut, LayoutDashboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutPlatformAdmin, getAdminSession } from '@/lib/admin-auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const session = await getAdminSession();
      if (session) {
        setAdminEmail(session.email);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await logoutPlatformAdmin();
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg">Platform Admin</span>
          </div>

          <nav className="ml-10 flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{adminEmail}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>
    </div>
  );
}
