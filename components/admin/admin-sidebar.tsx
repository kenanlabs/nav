"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AdminAvatar, clearUserCache } from "./admin-avatar"
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

// localStorage key
const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed"

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
    title: "系统管理",
    href: "/admin/users",
    icon: Users,
  },
]

interface SidebarProps {
  className?: string
}

export function AdminSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [siteName, setSiteName] = useState("Conan Nav")
  const [siteLogo, setSiteLogo] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // 从 localStorage 加载折叠状态
  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  // 保存折叠状态到 localStorage
  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newCollapsed))
  }

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

  return (
    <div className={`flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ${
      collapsed ? "w-16" : "w-64"
    } ${className || ""}`}>
      <div className={`flex h-16 items-center border-b ${
        collapsed ? "px-3 justify-center" : "px-6 pr-3 justify-between"
      }`}>
        <Link href="/admin" className="flex items-center space-x-2">
          {!collapsed && (
            <>
              {siteLogo && (
                <img src={siteLogo} alt="Logo" className="h-6 w-6 object-contain" />
              )}
              <span className="font-bold text-xl">{siteName}</span>
            </>
          )}
        </Link>
        {/* Logo 图标作为收起/展开按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className={collapsed ? "text-foreground hover:bg-accent" : "text-muted-foreground hover:bg-accent"}
          onClick={handleToggleCollapse}
        >
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
          <span className="sr-only">
            {collapsed ? "展开侧边栏" : "收起侧边栏"}
          </span>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.title}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <AdminAvatar collapsed={collapsed} />
      </div>
    </div>
  )
}
