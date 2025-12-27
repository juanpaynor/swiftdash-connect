"use client";

import { Loader2 } from "lucide-react";
import { useBranding } from "@/lib/branding/theme-provider";

interface BrandedLoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    logoUrl?: string; // Optional override, otherwise uses context
    color?: string; // Optional override
}

export function BrandedLoader({ className = "", size = "md", text, logoUrl, color }: BrandedLoaderProps) {
    const { branding } = useBranding();

    const activeLogo = logoUrl || branding?.logo_url;
    const activeColor = color || branding?.primary_color || "currentColor";

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-16 w-16",
        xl: "h-24 w-24",
    };

    const containerClasses = {
        sm: "gap-2",
        md: "gap-3",
        lg: "gap-4",
        xl: "gap-6",
    };

    if (activeLogo) {
        return (
            <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
                <div className={`relative ${sizeClasses[size]} animate-pulse`}>
                    <img
                        src={activeLogo}
                        alt="Loading..."
                        className="w-full h-full object-contain"
                    />
                </div>
                {text && (
                    <p className="text-muted-foreground animate-pulse font-medium text-sm">
                        {text}
                    </p>
                )}
            </div>
        );
    }

    // Fallback to standard spinner if no logo
    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
            <Loader2
                className={`${sizeClasses[size]} animate-spin`}
                style={{ color: activeColor !== 'currentColor' ? activeColor : undefined }}
            />
            {text && (
                <p className="text-muted-foreground font-medium text-sm">
                    {text}
                </p>
            )}
        </div>
    );
}
