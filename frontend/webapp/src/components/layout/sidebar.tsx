"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from "../ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar className="flex flex-col h-screen">
        <SidebarHeader>
          <h2 className="text-lg font-semibold">
            Side Menu
          </h2>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto min-h-0">
          <SidebarGroup>
            <div className="py-1 px-2 hover:bg-gray-100 rounded cursor-pointer">
              hogehoge
            </div>
          </SidebarGroup>
          <SidebarGroup>
            <div className="py-1 px-2 hover:bg-gray-100 rounded cursor-pointer">
              fugafuga
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
