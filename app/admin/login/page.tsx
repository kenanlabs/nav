"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Github, ArrowRight, BarChart3, FolderTree, Search, Smartphone, Moon, Scroll, FileEdit, Palette, Image } from "lucide-react"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { logger } from "@/lib/logger"

// 系统设置缓存类型
interface SettingsCache {
  siteName?: string
  siteDescription?: string
  githubUrl?: string | null
}

// 缓存设置数据
let settingsCache: SettingsCache | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [siteName, setSiteName] = useState("Conan Nav")
  const [siteDescription, setSiteDescription] = useState("简洁现代化的网址导航系统")
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      // 检查缓存
      const now = Date.now()
      if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (!cancelled) {
          if (settingsCache.siteName) setSiteName(settingsCache.siteName)
          if (settingsCache.siteDescription) setSiteDescription(settingsCache.siteDescription)
          if (settingsCache.githubUrl) setGithubUrl(settingsCache.githubUrl)
        }
        return
      }

      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const settings = await res.json()
          if (!cancelled) {
            settingsCache = settings
            cacheTimestamp = now
            if (settings.siteName) setSiteName(settings.siteName)
            if (settings.siteDescription) setSiteDescription(settings.siteDescription)
            if (settings.githubUrl) setGithubUrl(settings.githubUrl)
            setSettingsLoaded(true)
          }
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("Failed to load settings:", error)
          setSettingsLoaded(true)
        }
      }
    }

    loadSettings()

    // 窗口焦点时检查缓存是否过期
    const handleFocus = () => {
      const now = Date.now()
      if (!settingsCache || (now - cacheTimestamp) > CACHE_DURATION) {
        loadSettings()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/admin/dashboard")
        router.refresh()
      } else {
        setError(data.error || "登录失败")
      }
    } catch (err) {
      setError("登录失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
      {/* 桌面端两列布局 */}
      <div className="relative hidden w-full md:grid lg:grid-cols-2">
        {/* 左侧列 - 高级设计感背景 */}
        <div className="relative hidden h-full min-h-screen flex-col p-10 lg:flex overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          {/* 背景网格图案 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />

          {/* 点阵背景 */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />

          {/* 动态光晕效果 */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/2 rounded-full blur-[150px]" />

          {/* 装饰性几何图形 - 避开右上角卡片区域 */}
          <div className="absolute top-[65%] left-16 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
          <div className="absolute top-[70%] left-32 w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse delay-75" />
          <div className="absolute bottom-20 left-24 w-2.5 h-2.5 bg-primary/20 rounded-full animate-pulse delay-150" />
          <div className="absolute bottom-32 left-48 w-1 h-1 bg-primary/30 rounded-full animate-pulse delay-300" />
          <div className="absolute top-[75%] left-40 w-1 h-1 bg-primary/20 rounded-full animate-pulse delay-500" />

          {/* 浮动特性卡片 - 统一在右上角区域错落排列，间距加大 */}
          {/* 1. 分类导航 */}
          <div className="absolute top-[4%] right-[6%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="size-4 text-primary" />
              <span className="text-xs font-medium">分类导航</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">技术</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">设计</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">工具</span>
            </div>
          </div>

          {/* 2. 响应式设计 */}
          <div className="absolute top-[10.5%] right-[16%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="size-4 text-primary" />
              <span className="text-xs font-medium">响应式设计</span>
            </div>
            <div className="flex gap-1">
              <div className="bg-primary/20 px-1.5 py-0.5 rounded text-[8px]">📱</div>
              <div className="bg-primary/20 px-1.5 py-0.5 rounded text-[8px]">💻</div>
              <div className="bg-primary/20 px-1.5 py-0.5 rounded text-[8px]">🖥️</div>
            </div>
          </div>

          {/* 3. 数据统计 */}
          <div className="absolute top-[17%] right-[4%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="size-4 text-primary" />
              <span className="text-xs font-medium">数据统计</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary/60 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>访问量</span>
                <span>+12.5%</span>
              </div>
            </div>
          </div>

          {/* 4. 实时搜索 */}
          <div className="absolute top-[23.5%] right-[14%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Search className="size-4 text-primary" />
              <span className="text-xs font-medium">实时搜索</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="size-1.5 bg-green-500 rounded-full" />
                <span className="text-[9px] text-muted-foreground">毫秒级响应</span>
              </div>
            </div>
          </div>

          {/* 5. 古诗词 */}
          <div className="absolute top-[30%] right-[8%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Scroll className="size-4 text-primary" />
              <span className="text-xs font-medium">古诗词展示</span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-tight">
              海内存知己<br />天涯若比邻
            </p>
          </div>

          {/* 6. 暗黑模式 */}
          <div className="absolute top-[36.5%] right-[18%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="size-4 text-primary" />
              <span className="text-xs font-medium">暗黑模式</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">浅色</span>
              <div className="h-3 w-px bg-primary/20" />
              <span className="text-[9px] text-muted-foreground">深色</span>
              <div className="h-3 w-px bg-primary/20" />
              <span className="text-[9px] text-muted-foreground">系统</span>
            </div>
          </div>

          {/* 7. 网站收录 */}
          <div className="absolute top-[43%] right-[5%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <FileEdit className="size-4 text-primary" />
              <span className="text-xs font-medium">网站收录</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] text-muted-foreground">今日收录</span>
                <span className="text-[9px] font-medium text-primary">+3</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] text-muted-foreground">待审核</span>
                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[8px]">2</span>
              </div>
            </div>
          </div>

          {/* 8. 简洁优雅 */}
          <div className="absolute top-[49.5%] right-[15%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="size-4 text-primary" />
              <span className="text-xs font-medium">简洁优雅</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">克制</span>
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">现代</span>
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">精致</span>
            </div>
          </div>

          {/* 9. 智能图标 */}
          <div className="absolute top-[56%] right-[9%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Image className="size-4 text-primary" />
              <span className="text-xs font-medium">智能图标</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-green-500" />
                </div>
                <span className="text-[9px] text-muted-foreground">自动获取</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground">首字母降级</span>
              </div>
            </div>
          </div>

          {/* 品牌信息 */}
          <div className="relative z-10 flex flex-col h-full">
            {/* 顶部 Logo */}
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-8 text-primary"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <div>
                <h1 className="text-foreground text-xl font-bold tracking-tight">{siteName}</h1>
                <p className="text-muted-foreground text-xs">Admin Console</p>
              </div>
            </div>

            {/* 中间内容 */}
            <div className="flex-1 flex flex-col justify-center my-12 space-y-8">
              {/* 欢迎语 */}
              <div className="space-y-4">
                <h2 className="text-foreground text-5xl font-bold leading-tight tracking-tight">
                  欢迎回来
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  {siteDescription}
                </p>
              </div>

              {/* 装饰线 */}
              <div className="flex items-center gap-3 max-w-xs">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                <div className="bg-primary/20 w-1.5 h-1.5 rounded-full" />
                <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
              </div>
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground/50 text-xs">
                © {new Date().getFullYear()} {siteName}
              </p>
            </div>
          </div>

          {/* 右侧渐变边框 */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        </div>

        {/* 右侧列 - 登录表单 */}
        <div className="flex items-center justify-center lg:min-h-screen lg:p-8 bg-background/50">
          <div className="mx-auto w-full max-w-[400px] px-6">
            {/* 品牌区域 */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 text-primary"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
              </div>
              <p className="mt-2 text-muted-foreground">
                登录以管理您的导航站点
              </p>
            </div>

            {/* 登录表单卡片 */}
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                  <FieldGroup className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <Field>
                      <FieldLabel htmlFor="email">邮箱</FieldLabel>
                      <Input
                        id="email"
                        placeholder="admin@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                    </Field>
                    <Field>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            登录中
                          </>
                        ) : (
                          <>
                            登录
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            {/* 底部信息 */}
            {githubUrl && (
              <div className="mt-6 text-center animate-in fade-in duration-500">
                <Separator className="mb-4" />
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                  <span>Star on GitHub</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端单列布局 */}
      {!mounted ? null : (
        <div className="w-full max-w-md px-4 md:hidden">
          <div className="flex flex-col gap-6 mx-auto w-full">
            {/* 品牌区域 */}
            <div className="mb-4 text-center">
              <div className="mb-4 flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 text-primary"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
              </div>
              <p className="mt-2 text-muted-foreground">
                登录以管理您的导航站点
              </p>
            </div>

            {/* 登录表单卡片 */}
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                  <FieldGroup className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <Field>
                      <FieldLabel htmlFor="email">邮箱</FieldLabel>
                      <Input
                        id="email"
                        placeholder="admin@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                    </Field>
                    <Field>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            登录中
                          </>
                        ) : (
                          <>
                            登录
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            {/* 底部信息 */}
            {githubUrl && (
              <div className="mt-6 text-center animate-in fade-in duration-500">
                <Separator className="mb-4" />
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                  <span>Star on GitHub</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
