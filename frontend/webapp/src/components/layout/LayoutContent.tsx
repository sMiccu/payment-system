"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {!isLoginPage && <Header />}
      <main className={isLoginPage ? "" : "pt-16"}>
        {children}
      </main>
    </>
  );
}

