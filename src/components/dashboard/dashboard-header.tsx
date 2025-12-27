"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/database.types";
import { Sun, Moon, CloudSun } from "lucide-react";

interface DashboardHeaderProps {
    user: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const [greeting, setGreeting] = useState("Welcome back");
    const [icon, setIcon] = useState(<Sun className="h-6 w-6 text-amber-500" />);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting("Good morning");
            setIcon(<Sun className="h-6 w-6 text-amber-400" />);
        } else if (hour < 18) {
            setGreeting("Good afternoon");
            setIcon(<CloudSun className="h-6 w-6 text-amber-500" />);
        } else {
            setGreeting("Good evening");
            setIcon(<Moon className="h-6 w-6 text-indigo-400" />);
        }
    }, []);

    const date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                {date}
            </div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    {greeting}, <span className="text-primary">{user?.full_name?.split(" ")[0] || "there"}</span>
                </h1>
                <div className="animate-in fade-in zoom-in duration-500">{icon}</div>
            </div>
        </div>
    );
}
