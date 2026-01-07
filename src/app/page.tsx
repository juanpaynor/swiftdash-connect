'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Activity, Gavel, Puzzle, Zap, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { VantaBackground } from '@/components/landing/vanta-background';
import { DynamicInterfaceDemo } from '@/components/landing/DynamicInterfaceDemo';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
            <Navbar />

            {/* Hero Section - The Adaptive Video Experience (Phase 3) */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
                {/* Background Effects */}
                <VantaBackground />

                <div className="container relative z-10 px-4 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-blue-200">The first adaptive video platform</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent"
                    >
                        Video that adapts <br className="hidden md:block" /> to your work.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl text-lg text-slate-400 mb-10"
                    >
                        Stop forcing your workflow into a generic meeting grid.
                        SwiftDash Connect morphs its interface to fit your industry—from HIPAA-compliant exams to high-stakes auctions.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 mb-20"
                    >
                        <Link href="/signup">
                            <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/demos">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10">
                                See Use Cases
                            </Button>
                        </Link>
                    </motion.div>

                    {/* The Dynamic Demo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1, delay: 0.4, type: "spring" }}
                        className="w-full max-w-5xl"
                    >
                        <DynamicInterfaceDemo />
                    </motion.div>
                </div>
            </section>

            {/* "Not Just a Meeting App" Section (Phase 3) */}
            <section className="py-32 bg-slate-950 relative border-t border-white/5">
                <div className="container px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Not just a meeting app. <br />An App Platform.</h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Traditional video tools are static. SwiftDash allows you to "dock" specialized applications directly into the call interface.
                            </p>

                            <div className="space-y-6">
                                <FeatureRow
                                    icon={<Activity className="text-red-400" />}
                                    title="Telehealth Module"
                                    desc="Embed EMR records and live vitals directly alongside patient video."
                                />
                                <FeatureRow
                                    icon={<Gavel className="text-amber-400" />}
                                    title="Live Bidding Engine"
                                    desc="Sub-second latency video with synchronized auction timer and bid ledger."
                                />
                                <FeatureRow
                                    icon={<Puzzle className="text-purple-400" />}
                                    title="Classroom Kit"
                                    desc="Shared whiteboards, pop quizzes, and breakout timer controls."
                                />
                            </div>
                        </div>
                        <div className="relative">
                            {/* Visual representation of "Docking" - Abstract for now */}
                            <div className="aspect-square rounded-3xl bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-white/10 relative overflow-hidden flex items-center justify-center p-8">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                                    <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 animate-pulse">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><Activity className="w-4 h-4 text-red-500" /></div>
                                        <div className="h-2 w-20 bg-white/10 rounded" />
                                        <div className="h-2 w-12 bg-white/10 rounded" />
                                    </div>
                                    <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 translate-y-8">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><Gavel className="w-4 h-4 text-amber-500" /></div>
                                        <div className="h-2 w-20 bg-white/10 rounded" />
                                        <div className="h-2 w-12 bg-white/10 rounded" />
                                    </div>
                                    <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 -translate-y-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Shield className="w-4 h-4 text-blue-500" /></div>
                                        <div className="h-2 w-20 bg-white/10 rounded" />
                                        <div className="h-2 w-12 bg-white/10 rounded" />
                                    </div>
                                    <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 translate-y-4">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><Puzzle className="w-4 h-4 text-purple-500" /></div>
                                        <div className="h-2 w-20 bg-white/10 rounded" />
                                        <div className="h-2 w-12 bg-white/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid (Restored from Previous Design) */}
            <section className="relative z-10 bg-black/50 py-24 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Why Industry Leaders Choose Us</h2>
                        <p className="text-slate-400">Built for speed, security, and scale.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-blue-400" />}
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

            {/* How It Works Section (Restored from Previous Design) */}
            <section className="relative py-24 border-t border-white/5 bg-slate-950">
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

            {/* FAQ & CTA (Restored from Previous Design) */}
            <section className="relative overflow-hidden py-24 border-t border-white/5">
                <div className="absolute inset-0 bg-blue-600/5"></div>
                <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
                    <h2 className="mb-6 text-4xl font-bold">Ready to secure your communications?</h2>
                    <p className="mb-10 text-xl text-slate-400">Join thousands of teams who trust SwiftDash Connect for their critical meetings.</p>
                    <Link href="/signup">
                        <Button size="lg" className="h-14 min-w-[200px] text-lg bg-white text-black hover:bg-slate-200">
                            Get Started Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="container px-4 text-center">
                    <p className="text-sm text-slate-500">© 2025 SwiftDash Connect. The OS for Real-Time Work.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div
            className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-blue-500/50 hover:bg-white/10"
        >
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-110">
                {icon}
            </div>
            <h3 className="mb-3 text-xl font-semibold">{title}</h3>
            <p className="leading-relaxed text-slate-400">{description}</p>
        </div>
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
