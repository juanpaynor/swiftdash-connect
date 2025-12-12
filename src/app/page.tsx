'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Globe, Users, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

declare global {
    interface Window {
        THREE: any;
        VANTA: any;
    }
}

export default function LandingPage() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffectRef = useRef<any>(null);

    const initVanta = () => {
        if (vantaEffectRef.current) {
            vantaEffectRef.current.destroy();
        }
        if (window.VANTA && window.VANTA.NET && vantaRef.current) {
            vantaEffectRef.current = window.VANTA.NET({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x3be8,
                backgroundColor: 0x1a1939,
                points: 11.00,
                maxDistance: 30.00,
                spacing: 14.00
            });
        }
    };

    useEffect(() => {
        // Attempt init if scripts are already loaded (navigation fallback)
        if (window.VANTA && window.VANTA.NET) {
            initVanta();
        }

        return () => {
            if (vantaEffectRef.current) {
                vantaEffectRef.current.destroy();
                vantaEffectRef.current = null;
            }
        };
    }, []);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            },
        },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
                strategy="beforeInteractive"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
                strategy="afterInteractive"
                onLoad={() => {
                    // Initialize once Vanta is loaded
                    initVanta();
                }}
            />
            <Navbar />

            {/* Hero Section */}
            <section ref={vantaRef} className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
                <div className="container relative z-10 px-4 text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="mx-auto max-w-4xl"
                    >
                        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                                Next-Gen Secure Conferencing
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="font-headline mb-8 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl mix-blend-overlay"
                        >
                            Secure Connections for the{' '}
                            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                                Modern Enterprise
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl"
                        >
                            Bank-grade encryption meets crystal clear video. The reliable choice for critical team communications.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                        >
                            <Link href="/signup">
                                <Button size="lg" className="h-12 min-w-[160px] text-base shadow-lg shadow-primary/20">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="h-12 min-w-[160px] border-white/10 bg-white/5 text-base hover:bg-white/10 backdrop-blur-sm">
                                    Login
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 bg-slate-900/50 py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Why Industry Leaders Choose Us</h2>
                        <p className="text-slate-400">Built for speed, security, and scale.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-primary" />}
                            title="Military-Grade Security"
                            description="End-to-end encryption ensures your conversations stay private. Always."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-yellow-400" />}
                            title="99.99% Reliability"
                            description="Redundant global infrastructure guarantees uptime when it matters most."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-purple-400" />}
                            title="Team-Centric"
                            description="Seamlessly integrated workspaces, channels, and instant huddles."
                        />
                    </div>
                </div>
            </section>



            {/* How It Works Section */}
            <section className="relative py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Seamless Integration</h2>
                        <p className="text-slate-400">Get started in minutes, not days.</p>
                    </div>

                    <div className="grid gap-12 md:grid-cols-3">
                        <StepCard
                            number="01"
                            title="Create Organization"
                            description="Sign up and create your secure workspace in less than 30 seconds."
                        />
                        <StepCard
                            number="02"
                            title="Invite Team"
                            description="Send secure invite links to your team members and set permissions."
                        />
                        <StepCard
                            number="03"
                            title="Start Collaborating"
                            description="Launch HD video meetings and encrypted chats instantly."
                        />
                    </div>
                </div>
            </section>



            {/* FAQ & CTA */}
            <section className="relative overflow-hidden py-24">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
                    <h2 className="mb-6 text-4xl font-bold">Ready to secure your communications?</h2>
                    <p className="mb-10 text-xl text-slate-400">Join thousands of teams who trust SwiftDash Connect for their critical meetings.</p>
                    <Link href="/signup">
                        <Button size="lg" className="h-14 min-w-[200px] text-lg shadow-xl shadow-primary/20">
                            Get Started Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 text-center text-sm text-slate-500">
                <p>© 2025 SwiftDash Connect. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-primary/50 hover:bg-white/10"
        >
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-110">
                {icon}
            </div>
            <h3 className="mb-3 text-xl font-semibold">{title}</h3>
            <p className="leading-relaxed text-slate-400">{description}</p>
        </motion.div>
    );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="relative p-6">
            <div className="mb-4 text-6xl font-bold text-white/5">{number}</div>
            <h3 className="mb-2 text-xl font-bold">{title}</h3>
            <p className="text-slate-400">{description}</p>
        </div>
    );
}


