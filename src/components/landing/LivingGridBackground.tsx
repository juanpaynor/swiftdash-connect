'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function LivingGridBackground() {
    const [columns, setColumns] = useState(0);
    const [rows, setRows] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use a single shared mouse motion value
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const calculateGrid = () => {
            if (!containerRef.current) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const tileSize = 60; // Smaller tiles for more density
            setColumns(Math.ceil(width / tileSize));
            setRows(Math.ceil(height / tileSize));
        };

        calculateGrid();
        window.addEventListener('resize', calculateGrid);
        return () => window.removeEventListener('resize', calculateGrid);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            mouseX.set(e.clientX - rect.left);
            mouseY.set(e.clientY - rect.top);
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden bg-slate-950 -z-10 perspective-[1000px]"
            onMouseMove={handleMouseMove}
        >
            <div
                className="grid w-full h-full opacity-60"
                style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
            >
                {Array.from({ length: columns * rows }).map((_, i) => (
                    <GridTile
                        key={i}
                        index={i}
                        mouseX={mouseX}
                        mouseY={mouseY}
                    />
                ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950 pointer-events-none" />
        </div>
    );
}

function GridTile({ index, mouseX, mouseY }: { index: number, mouseX: any, mouseY: any }) {
    const tileRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    // Randomly active tiles (simulating "live" users)
    useEffect(() => {
        if (Math.random() > 0.95) {
            setActive(true);
        }
    }, []);

    // Distance calculation using Framer Motion
    // We need to use a layout effect to get the rect after render
    const [tileCenter, setTileCenter] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (tileRef.current) {
            const rect = tileRef.current.getBoundingClientRect();
            setTileCenter({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        }
    }, []);

    const distance = useTransform(mouseX, (val: number) => {
        const dx = val - tileCenter.x;
        const dy = mouseY.get() - tileCenter.y;
        return Math.sqrt(dx * dx + dy * dy);
    });

    const scale = useTransform(distance, [0, 200], [1.15, 1]);
    const opacity = useTransform(distance, [0, 300], [0.5, 0.1]);
    const borderColor = useTransform(distance, [0, 150], ['rgba(59, 130, 246, 0.4)', 'rgba(255, 255, 255, 0.05)']);

    const springScale = useSpring(scale, { stiffness: 150, damping: 15 });
    const springOpacity = useSpring(opacity, { stiffness: 150, damping: 15 });

    return (
        <motion.div
            ref={tileRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.random() * 1 }} // Random Stagger Entrance
            style={{
                scale: springScale,
                borderColor: borderColor,
            }}
            className="relative border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-colors"
        >
            <motion.div
                style={{ opacity: springOpacity }}
                className="absolute inset-0 bg-blue-500/10"
            />

            {active && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                </div>
            )}
        </motion.div>
    );
}
