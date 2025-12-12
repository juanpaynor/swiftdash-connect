'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export function Navbar() {
    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
                    <img src="/assets/logo.png" alt="SwiftDash" className="h-8 w-8 object-contain" />
                    <span>SwiftDash Connect</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden text-sm font-medium text-white/70 hover:text-white sm:block">
                        Login
                    </Link>
                    <Link href="/signup">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
