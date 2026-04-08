"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AdminAvatar, clearUserCache } from "./admin-avatar"
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  Users,
  Database,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className={cn(
      "flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
      collapsed ? "w-[60px]" : "w-60",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex h-14 items-center border-b transition-all duration-300",
        collapsed ? "px-2 justify-center" : "px-4 justify-between"
      )}>
        <Link 
          href="/admin" 
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            collapsed && "opacity-0 w-0"
          )}
        >
          {siteLogo && (
            <img src={siteLogo} alt="Logo" className="h-6 w-6 object-contain flex-shrink-0" />
          )}
          <span className="font-semibold text-base whitespace-nowrap">{siteName}</span>
        </Link>
        
        {/* 折叠按钮 */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleToggleCollapse}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {collapsed ? "展开侧边栏" : "折叠侧边栏"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <p>{collapsed ? "展开侧边栏" : "折叠侧边栏"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            const button = (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full transition-all duration-200",
                  collapsed ? "justify-center px-2" : "justify-start px-3",
                  isActive && "shadow-sm"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", !collapsed && "mr-2")} />
                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Button>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      {button}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                {button}
              </Link>
            )
          })}
        </TooltipProvider>
      </nav>

      <Separator />

      {/* Footer - User Avatar */}
      <div className="p-2">
        <AdminAvatar collapsed={collapsed} />
      </div>
    </div>
  )
}
