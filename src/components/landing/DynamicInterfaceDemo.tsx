'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Scale,
    Gavel,
    FileText,
    ShieldCheck,
    Users,
    Mic,
    Video
} from 'lucide-react';

type Mode = 'default' | 'medical' | 'legal' | 'auction';

export function DynamicInterfaceDemo() {
    const [mode, setMode] = useState<Mode>('default');

    useEffect(() => {
        const modes: Mode[] = ['default', 'medical', 'legal', 'auction'];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % modes.length;
            setMode(modes[index]);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto p-4 perspective-[1000px]">
            <motion.div
                layout
                className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl aspect-video flex"
                initial={{ rotateX: 5, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Main Interface Content */}
                <div className="flex-1 flex flex-col relative p-4">
                    {/* Header / Mode Indicator */}
                    <motion.div
                        layout
                        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                    >
                        <AnimatePresence mode="wait">
                            {mode === 'default' && (
                                <motion.div
                                    key="default"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-medium text-white/70">Standard Meeting</span>
                                </motion.div>
                            )}
                            {mode === 'medical' && (
                                <motion.div
                                    key="medical"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <Activity className="w-3 h-3 text-red-400" />
                                    <span className="text-xs font-medium text-red-100">Telehealth Secure</span>
                                </motion.div>
                            )}
                            {mode === 'legal' && (
                                <motion.div
                                    key="legal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <Scale className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs font-medium text-blue-100">Legal Deposition</span>
                                </motion.div>
                            )}
                            {mode === 'auction' && (
                                <motion.div
                                    key="auction"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <Gavel className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs font-medium text-amber-100">Live Auction</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Video Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-4 h-full p-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode === 'auction' ? 'auction-p1' : (mode === 'legal' ? 'legal-p1' : 'med-p1')}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full"
                            >
                                <MockVideoTile
                                    name={mode === 'auction' ? 'Auctioneer' : (mode === 'legal' ? 'Attorney' : 'Dr. Sarah Chen')}
                                    role="Host"
                                    imageSrc={mode === 'legal' ? '/images/demo/lawyer.png' : (mode === 'auction' ? '/images/demo/lawyer.png' : '/images/demo/doctor.png')}
                                />
                            </motion.div>
                            <motion.div
                                key={mode === 'auction' ? 'auction-p2' : (mode === 'legal' ? 'legal-p2' : 'med-p2')}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="w-full h-full"
                            >
                                <MockVideoTile
                                    name={mode === 'auction' ? 'Bidder #402' : (mode === 'legal' ? 'Witness' : 'John Doe')}
                                    role="Guest"
                                    imageSrc={mode === 'auction' ? '/images/demo/bidder.png' : '/images/demo/patient.png'}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Bottom Controls (Always present) */}
                    <div className="h-16 mt-4 flex items-center justify-center gap-4">
                        <div className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-md"><Mic className="w-5 h-5 text-white" /></div>
                        <div className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-md"><Video className="w-5 h-5 text-white" /></div>
                        <div className="p-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer shadow-lg shadow-red-500/20"><PhoneOff className="w-5 h-5 text-white" /></div>
                    </div>
                </div>

                {/* Dynamic Sidebar / Overlay Area */}
                <AnimatePresence mode="popLayout">
                    {mode === 'medical' && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-slate-900/90 backdrop-blur-xl border-l border-white/10 p-4 overflow-hidden flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Vitals
                                </h3>
                                <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">LIVE</span>
                            </div>
                            <div className="space-y-3">
                                <MetricCard label="Heart Rate" value="72 bpm" color="text-emerald-400" />
                                <MetricCard label="Blood Pressure" value="120/80" color="text-white" />
                                <MetricCard label="O2 Saturation" value="98%" color="text-blue-400" />
                            </div>
                            <div className="mt-auto p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Integration Status</p>
                                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                                    <ShieldCheck className="w-3 h-3" /> Synced to Epic EMR
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === 'legal' && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 300, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-slate-900/90 backdrop-blur-xl border-l border-white/10 p-4 overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Transcript
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] text-red-400 font-medium">REC</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 text-xs text-slate-300 font-mono overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none z-10" />
                                <p className="opacity-50"><span className="text-blue-300">Attorney:</span> Did you see the defendant?</p>
                                <p className="opacity-75"><span className="text-slate-500">Witness:</span> Yes, I arrived at 10 PM.</p>
                                <p><span className="text-blue-300">Attorney:</span> And the lights were on?</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-slate-500">Witness:</span>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        className="w-1.5 h-3 bg-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button className="w-full py-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-300 font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Mark as Exhibit A
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {mode === 'auction' && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 260, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-slate-900/90 backdrop-blur-xl border-l border-white/10 p-4 overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay pointer-events-none" />
                            <div className="text-center mb-6 relative z-10">
                                <h3 className="text-[10px] text-amber-200/70 uppercase tracking-widest mb-1">Current Highest Bid</h3>
                                <div className="text-3xl font-bold text-amber-400 font-mono tracking-tight">$1,250,000</div>
                                <div className="text-[10px] text-emerald-400 mt-1 font-medium bg-emerald-500/10 inline-block px-2 py-0.5 rounded-full">Reserve Met</div>
                            </div>

                            <div className="space-y-2 relative z-10">
                                <BidRow user="Bidder #402" amount="$1.25M" time="Just now" active />
                                <BidRow user="Bidder #118" amount="$1.15M" time="15s ago" />
                                <BidRow user="Bidder #099" amount="$1.10M" time="32s ago" />
                            </div>

                            <button className="mt-auto w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all text-sm relative z-10">
                                Place Bid
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function MockVideoTile({ name, role, imageSrc }: { name: string, role: string, imageSrc?: string }) {
    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center group">
            {imageSrc ? (
                <img src={imageSrc} alt={name} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl text-white/50">
                    {name[0]}
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

            <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1">
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-2">
                    {role === 'Host' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />}
                    <span className="text-xs font-semibold text-white/90">{name}</span>
                </div>
            </div>

            <div className="absolute top-3 right-3">
                <div className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
                    {role === 'Host' ? <Mic className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-red-500" />}
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="bg-white/5 rounded p-2 border border-white/5">
            <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
            <p className={`text-lg font-mono font-medium ${color}`}>{value}</p>
        </div>
    )
}

function BidRow({ user, amount, time, active }: { user: string, amount: string, time: string, active?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-2 rounded ${active ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}`}>
            <div>
                <p className={`text-xs font-medium ${active ? 'text-amber-200' : 'text-slate-300'}`}>{user}</p>
                <p className="text-[10px] text-slate-500">{time}</p>
            </div>
            <span className={`text-sm font-mono ${active ? 'text-amber-400' : 'text-slate-400'}`}>{amount}</span>
        </div>
    )
}

function PhoneOff({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="22" y1="2" x2="2" y2="22" /></svg>
    )
}
