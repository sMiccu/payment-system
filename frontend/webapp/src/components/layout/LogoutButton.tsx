"use client";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const LogoutButton = () => {
    const router = useRouter();

    async function onLogout() {
        try {
            await apiFetch("control/api/logout/", { method: "POST" });
        } catch (e) {   
            // ignore
        } finally {
            router.replace("/login");
        }
    }

    return (
        <Button
            variant="outline"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            onClick={onLogout}
        >
            ログアウト
        </Button>
    );
};