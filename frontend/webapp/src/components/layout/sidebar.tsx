"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarProvider,
} from "../ui/sidebar"
import Link from "next/link"
import { Users, UserCheck, Menu, FolderOpen, Clock } from "lucide-react"

export function AppSidebar() {
  const menuItems = [
    { href: "/top", label: "来店中のお客様", icon: Users },
    { href: "/membership-register", label: "会員管理", icon: UserCheck },
    { href: "/menu-admin", label: "メニュー管理", icon: Menu },
    { href: "/category-admin", label: "カテゴリー管理", icon: FolderOpen },
    { href: "/duration-rate-register", label: "時間料金管理", icon: Clock },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="flex flex-col h-screen border-r border-border bg-sidebar">
        <SidebarContent className="flex-1 overflow-y-auto min-h-0 pt-6">
          <SidebarGroup className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="flex items-center gap-3 py-3 px-4 hover:bg-sidebar-accent rounded-lg transition-all duration-300 group hover:translate-x-1"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <span className="text-sm font-medium text-sidebar-foreground group-hover:text-primary transition-colors duration-300">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
