"use client";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export const Header = () => {
    return (
        <div className="fixed flex justify-between px-8 w-screen h-16 surface-elevated items-center border-b border-border backdrop-blur-xl z-50">
            <Link 
                href="/top" 
                className="font-bold text-2xl hover:opacity-80 transition-opacity glow-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" 
                aria-label="トップへ"
            >
                payment-system
            </Link>
            <div className="flex items-center gap-3">
                <LogoutButton />
            </div>
        </div>
    );
};
