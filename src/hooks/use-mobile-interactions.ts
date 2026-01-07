import { useState, useEffect, useCallback, useRef } from 'react';

export function useMobileInteractions(autoHideDelay = 3000) {
    const [isMobile, setIsMobile] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Detect mobile device on mount
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            ) || window.innerWidth < 768; // Also treat small screens as mobile
            setIsMobile(isMobileDevice);

            // On desktop, controls are always "shown" (handled by hover CSS), 
            // but we keep state true to allow manual toggle overrides if needed.
            if (!isMobileDevice) {
                setShowControls(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const resetHideTimer = useCallback(() => {
        if (!isMobile) return;

        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        // Only auto-hide if controls are currently shown
        hideTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, autoHideDelay);
    }, [isMobile, autoHideDelay]);

    const toggleControls = useCallback(() => {
        if (!isMobile) return;

        setShowControls(prev => {
            const newState = !prev;
            if (newState) {
                resetHideTimer();
            } else {
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            }
            return newState;
        });
    }, [isMobile, resetHideTimer]);

    // Handle user activity to keep controls visible
    const handleInteraction = useCallback(() => {
        if (isMobile && showControls) {
            resetHideTimer();
        }
    }, [isMobile, showControls, resetHideTimer]);

    return {
        isMobile,
        showControls,
        toggleControls,
        handleInteraction, // Call this on touch/click of controls to prevent them from hiding immediately
    };
}
