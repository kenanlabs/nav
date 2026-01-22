"use client"

import * as React from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { AdminMobileNav } from "./admin-mobile-nav"
import { useMediaQuery } from "@/hooks/use-media-query"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面端：固定侧边栏 */}
      {isDesktop && <AdminSidebar />}

      {/* 移动端：Drawer 导航 */}
      {!isDesktop && (
        <AdminMobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto relative">
          <div className="sticky top-0 z-50">
            <AdminHeader
              isMobile={!isDesktop}
              onMenuClick={() => setMobileMenuOpen(true)}
            />
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
