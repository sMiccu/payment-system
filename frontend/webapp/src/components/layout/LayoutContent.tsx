 "use client";
 
 import { usePathname } from "next/navigation";
 import { Header } from "./Header";
 import { AppSidebar } from "./sidebar";
 
 export function LayoutContent({ children }: { children: React.ReactNode }) {
   const pathname = usePathname();
   const isLoginPage = pathname === "/login";
 
   return (
     <>
       {!isLoginPage && <Header />}
       <main className={isLoginPage ? "" : "pt-16"}>
         {isLoginPage ? (
           children
         ) : (
           <div className="flex h-[calc(100vh-4rem)] bg-background">
             <AppSidebar />
             <div className="flex-1 p-8 overflow-y-auto">
               {children}
             </div>
           </div>
         )}
       </main>
     </>
   );
 }

