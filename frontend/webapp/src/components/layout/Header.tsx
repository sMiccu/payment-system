"use client";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export const Header = () => {
    return (
        <div className="fixed flex justify-between px-8 w-screen h-16 bg-blue-300 items-center drop-shadow-2xl border-b border-gray-300 shadow-md">
            <Link href="/top" className="font-bold text-2xl hover:opacity-80" aria-label="トップへ">
                payment-system
            </Link>
            <div className="flex items-center gap-3">
                <LogoutButton />
            </div>
        </div>
    );
};
