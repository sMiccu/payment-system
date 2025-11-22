"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from "../ui/sidebar"
import Link from "next/link"

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
            <Link href="/top" className="block py-1 px-2 hover:bg-gray-100 rounded">
              トップ
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href="/customer-register" className="block py-1 px-2 hover:bg-gray-100 rounded">
              来店登録
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href="/membership-register" className="block py-1 px-2 hover:bg-gray-100 rounded">
              会員登録
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href="/menu-admin" className="block py-1 px-2 hover:bg-gray-100 rounded">
              メニュー管理
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href="/category-admin" className="block py-1 px-2 hover:bg-gray-100 rounded">
              カテゴリー管理
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href="/duration-rate-register" className="block py-1 px-2 hover:bg-gray-100 rounded">
              時間料金登録
            </Link>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
