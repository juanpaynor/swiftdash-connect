'use client';

import { motion } from 'framer-motion';

export function AuroraBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-950 -z-10">
            {/* Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
            <div className="absolute top-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />

            {/* Grid Overlay for texture (static, lightweight) */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20" />
        </div>
    );
}
