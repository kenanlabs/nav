"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserEditDialog } from "./user-edit-dialog"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UserData {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
}

// 缓存用户数据（模块级缓存，不要持久化到 localStorage）
let userCache: UserData | null = null

// 清除缓存的辅助函数（用于调试或登出后）
export function clearUserCache() {
  userCache = null
}

interface AdminAvatarProps {
  onLogout?: () => void
  collapsed?: boolean
}

export function AdminAvatar({ onLogout, collapsed = false }: AdminAvatarProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    // 从缓存获取用户信息
    if (userCache) {
      setUser(userCache)
      setIsLoading(false)
      return
    }

    // 从 cookie 获取用户 ID
    const getUserId = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include", // 确保发送 cookie
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            userCache = data.user
            setUser(data.user)
          } else {
            console.error("No user data in response:", data)
          }
        } else if (res.status !== 401) {
          // 只在非 401 错误时打印日志 (401 是未登录,属于正常情况)
          console.error("Failed to fetch user, status:", res.status)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [])

  // 退出登录处理
  const handleLogout = async () => {
    try {
      // 清除用户缓存
      clearUserCache()
      // 调用退出 API
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
      // 跳转到登录页
      router.push("/admin/login")
      router.refresh()
      // 调用父组件的回调（如果有）
      onLogout?.()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // 加载中显示 skeleton
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 w-full px-2 py-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 生成用户名首字母作为 fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()

  const handleEdit = () => {
    setEditDialogOpen(true)
  }

  return (
    <>
      {collapsed ? (
        // 收起状态：只显示头像和退出按钮（垂直排列）
        <div className="flex flex-col items-center gap-2 w-full">
          <div onClick={handleEdit} className="cursor-pointer hover:bg-accent rounded-md transition-colors p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>退出登录</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        // 展开状态：显示头像、姓名、邮箱和退出按钮
        <div className="flex items-center gap-3 w-full">
          <div
            onClick={handleEdit}
            className="flex items-center gap-3 flex-1 min-w-0 hover:bg-accent rounded-md transition-colors cursor-pointer -mx-2 -my-2 px-2 py-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {user.name || "管理员"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground -mr-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>退出登录</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {editDialogOpen && (
        <UserEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={user.id}
          userEmail={user.email}
          userName={user.name}
          onUpdate={(updatedUser) => {
            userCache = updatedUser
            setUser(updatedUser)
          }}
        />
      )}
    </>
  )
}
