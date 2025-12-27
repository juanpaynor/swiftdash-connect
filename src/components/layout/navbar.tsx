'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { ModeToggle } from '@/components/theme-toggle';

export function Navbar() {
    return (
        <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <img src="/assets/logo.png" alt="SwiftDash" className="h-8 w-8 object-contain" />
                    <span>SwiftDash Connect</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
                        Login
                    </Link>
                    <Link href="/signup">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Get Started
                        </Button>
                    </Link>
                    <div className="ml-2">
                        <ModeToggle />
                    </div>
                </div>
            </div>
        </nav>
    );
}
