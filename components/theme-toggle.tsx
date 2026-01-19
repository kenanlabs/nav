"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Moon, Sun, Laptop } from "lucide-react"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 循环切换：浅色 → 深色 → 跟随系统 → 浅色 ...
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  // 获取当前主题的显示名称
  const getThemeLabel = () => {
    if (theme === "system") {
      return `跟随系统 (${resolvedTheme === "dark" ? "深色" : "浅色"})`
    }
    if (theme === "light") return "浅色模式"
    return "深色模式"
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  // 判断实际应用的主题（考虑 system 模式）
  const effectiveTheme = theme === "system" ? resolvedTheme : theme

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
          >
            <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <Laptop className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'system' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <span className="sr-only">切换主题</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getThemeLabel()} - 点击切换</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
