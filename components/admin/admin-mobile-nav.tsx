"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { AdminAvatar } from "./admin-avatar"
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  Users,
  Database,
} from "lucide-react"

// 系统设置缓存类型
interface SettingsCache {
  siteName?: string
  siteLogo?: string | null
}

// 缓存设置数据，避免每次页面切换都重新加载
let settingsCache: SettingsCache | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

const navItems = [
  {
    title: "数据统计",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "网站管理",
    href: "/admin/sites",
    icon: Globe,
  },
  {
    title: "分类管理",
    href: "/admin/categories",
    icon: FolderKanban,
  },
  {
    title: "数据管理",
    href: "/admin/data",
    icon: Database,
  },
  {
    title: "系统设置",
    href: "/admin/users",
    icon: Users,
  },
]

interface AdminMobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [siteName, setSiteName] = useState("Conan Nav")
  const [siteLogo, setSiteLogo] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      // 检查缓存
      const now = Date.now()
      if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (settingsCache.siteName) setSiteName(settingsCache.siteName)
        if (settingsCache.siteLogo) setSiteLogo(settingsCache.siteLogo)
        return
      }

      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const settings = await res.json()
          settingsCache = settings
          cacheTimestamp = now
          if (settings.siteName) setSiteName(settings.siteName)
          if (settings.siteLogo) setSiteLogo(settings.siteLogo)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  // 点击导航项后关闭 Drawer
  const handleNavClick = () => {
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent className="h-full w-[280px] rounded-none border-r">
        <DrawerHeader className="sr-only">
          <DrawerTitle>导航菜单</DrawerTitle>
          <DrawerDescription>管理后台导航菜单</DrawerDescription>
        </DrawerHeader>

        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" onClick={handleNavClick} className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            <span className="text-lg font-bold">{siteName}</span>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} onClick={handleNavClick}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* 用户信息 */}
        <div className="p-3">
          <AdminAvatar
            onLogout={() => {
              onOpenChange(false)
              router.push("/admin/login")
              router.refresh()
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
