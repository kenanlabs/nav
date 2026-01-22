"use client"

import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// 路径到标题的映射
const pageTitleMap: Record<string, string> = {
  "/admin/dashboard": "数据统计",
  "/admin/sites": "网站管理",
  "/admin/categories": "分类管理",
  "/admin/data": "数据管理",
  "/admin/users": "系统设置",
}

interface AdminHeaderProps {
  isMobile?: boolean
  onMenuClick?: () => void
}

export function AdminHeader({ isMobile = false, onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname()

  // 获取当前页面的标题，默认为"管理后台"
  const title = pageTitleMap[pathname] || "管理后台"

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* 移动端：菜单按钮 */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
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
              <span className="sr-only">打开菜单</span>
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">访问网站首页</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>访问网站首页</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
