import { useState, useEffect, useCallback } from 'react';

// Type definitions for the experimental Document Picture-in-Picture API
interface DocumentPictureInPicture {
    requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
    window: Window | null;
}

declare global {
    interface Window {
        documentPictureInPicture?: DocumentPictureInPicture;
    }
}

interface UsePictureInPictureOptions {
    onEnter?: () => void;
    onExit?: () => void;
}

export function usePictureInPicture({ onEnter, onExit }: UsePictureInPictureOptions = {}) {
    const [isActive, setIsActive] = useState(false);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check support on mount
        if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
            setIsSupported(true);
        }
    }, []);

    const togglePiP = useCallback(async (elementContainerId: string) => {
        // If already active, close it
        if (isActive && pipWindow) {
            pipWindow.close();
            return;
        }

        // Check support
        if (!window.documentPictureInPicture) {
            console.warn('Document Picture-in-Picture API is not supported in this browser.');
            return;
        }

        const container = document.getElementById(elementContainerId);
        if (!container) {
            console.error(`Element with id '${elementContainerId}' not found.`);
            return;
        }

        try {
            // 1. Request the PiP window
            // We explicitly cast here because the API is experimental/new in TS
            const pipWin = await window.documentPictureInPicture.requestWindow({
                width: container.clientWidth || 800,
                height: container.clientHeight || 600,
            });

            // 2. Copy styles from the main document to the PiP window
            // This is crucial so the content looks the same
            const styles = Array.from(document.styleSheets);
            styles.forEach((styleSheet) => {
                try {
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.type = 'text/css';
                        link.href = styleSheet.href;
                        pipWin.document.head.appendChild(link);
                    } else if (styleSheet.cssRules) {
                        const style = document.createElement('style');
                        Array.from(styleSheet.cssRules).forEach((rule) => {
                            style.appendChild(document.createTextNode(rule.cssText));
                        });
                        pipWin.document.head.appendChild(style);
                    }
                } catch (e) {
                    // Accessing rules might fail for cross-origin stylesheets (CORS)
                    // We silently ignore them or could fetch them manually if strictly needed
                    // console.warn('Could not copy stylesheet', e);
                }
            });

            // Also copy specific style tags (like Tailwind injections usually found in head)
            Array.from(document.head.getElementsByTagName('style')).forEach((style) => {
                pipWin.document.head.appendChild(style.cloneNode(true));
            });

            // 3. Move the container into the PiP window body
            pipWin.document.body.appendChild(container);

            // 4. Update state
            setPipWindow(pipWin);
            setIsActive(true);
            onEnter?.();

            // 5. Handle closing (User clicks X on PiP window)
            pipWin.addEventListener('pagehide', () => {
                // Move the container back to the original parent in the main window
                // Note: For React, if the component re-renders while in PiP, it might lose reference?
                // Actually, since we moved the DOM node, React still holds the reference to it.
                // We just need to put it back where it belongs.
                // However, standard React behavior requires the `container` to be in the DOM for updates.
                // A common pattern is to have a "placeholder" or simply append it back to a known root.

                // For simplicity, we assume the specific container was a direct child of a known wrapper 
                // OR we just put it back into the main document body and let React portal logic handle it?
                // Actually, the cleanest way in React without Portals is:
                // We moved the DOM node. When PiP closes, we move it back to a 'mount point' we prepared.

                const mountPoint = document.getElementById(`${elementContainerId}-mount`);
                if (mountPoint) {
                    mountPoint.appendChild(container);
                } else {
                    // Fallback: This might happen if the meeting ended while in PiP.
                    // In that case, we don't strictly need to append it back if the component is unmounting.
                }

                setPipWindow(null);
                setIsActive(false);
                onExit?.();
            });

        } catch (error) {
            console.error('Failed to open Picture-in-Picture window:', error);
        }
    }, [isActive, pipWindow, onEnter, onExit]);

    return {
        isSupported,
        isActive,
        togglePiP
    };
}
