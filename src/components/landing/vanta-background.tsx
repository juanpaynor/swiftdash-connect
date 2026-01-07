'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        VANTA: any;
        THREE: any;
    }
}

export function VantaBackground() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);

    useEffect(() => {
        const initVanta = () => {
            if (!vantaEffect.current && window.VANTA && window.THREE && vantaRef.current) {
                vantaEffect.current = window.VANTA.NET({
                    el: vantaRef.current,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x3b82f6,      // Blue-ish
                    backgroundColor: 0x0f172a, // Slate-900 match
                    points: 12.00,
                    maxDistance: 22.00,
                    spacing: 18.00
                });
            }
        };

        if (window.VANTA && window.THREE) {
            initVanta();
        } else {
            const interval = setInterval(() => {
                if (window.VANTA && window.THREE) {
                    initVanta();
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }

        return () => {
            if (vantaEffect.current) vantaEffect.current.destroy();
        };
    }, []);

    return (
        <>
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" strategy="beforeInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js" strategy="lazyOnload" />
            <div ref={vantaRef} className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" />
        </>
    );
}
