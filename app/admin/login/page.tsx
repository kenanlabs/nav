"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Github, ArrowRight, BarChart3, FolderTree, Search, Smartphone, Moon, Scroll, Palette, ImageIcon } from "lucide-react"
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
import { fetchPublicSettings } from "@/lib/client-settings"
import { useTranslations } from "next-intl"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("admin.login")
  const redirectParam = searchParams.get("redirect")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [siteName, setSiteName] = useState("Conan Nav")
  const [siteDescription, setSiteDescription] = useState("")
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const settings = await fetchPublicSettings()
      if (!cancelled) {
        if (settings.siteName) setSiteName(settings.siteName)
        setSiteDescription(settings.siteDescription || t("descriptionFallback"))
        if (settings.githubUrl) setGithubUrl(settings.githubUrl)
        setSettingsLoaded(true)
      }
    }

    loadSettings()

    const handleFocus = () => {
      loadSettings()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [t])

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
        // 同源校验 redirect 参数，防止开放重定向钓鱼；
        // 仅保留路径部分，丢弃外域 origin，非法值回退后台首页
        let redirectUrl = "/admin/dashboard"
        if (redirectParam) {
          try {
            const parsed = new URL(redirectParam, window.location.origin)
            if (parsed.origin === window.location.origin) {
              redirectUrl = parsed.pathname + parsed.search + parsed.hash
            }
          } catch {
            // 解析失败保持默认后台首页
          }
        }
        // 使用 window.location.href 进行硬重定向，确保浏览器环境完整同步 Cookie 状态
        window.location.href = redirectUrl
      } else {
        setError(data.error || t("loginFailed"))
      }
    } catch (err) {
      setError(t("retry"))
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
              <span className="text-xs font-medium">{t("featureCategories")}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">{t("featureTagTech")}</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">{t("featureTagDesign")}</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">{t("featureTagTools")}</span>
            </div>
          </div>

          {/* 2. 响应式设计 */}
          <div className="absolute top-[10.5%] right-[16%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featureResponsive")}</span>
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
              <span className="text-xs font-medium">{t("featureStats")}</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary/60 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{t("featureVisits")}</span>
                <span>+12.5%</span>
              </div>
            </div>
          </div>

          {/* 4. 实时搜索 */}
          <div className="absolute top-[23.5%] right-[14%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Search className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featureSearch")}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="size-1.5 bg-green-500 rounded-full" />
                <span className="text-[9px] text-muted-foreground">{t("featureMsResponse")}</span>
              </div>
            </div>
          </div>

          {/* 5. 古诗词 */}
          <div className="absolute top-[30%] right-[8%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Scroll className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featurePoetry")}</span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-tight">
              海内存知己<br />天涯若比邻
            </p>
          </div>

          {/* 6. 暗黑模式 */}
          <div className="absolute top-[36.5%] right-[18%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featureDark")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">{t("featureLight")}</span>
              <div className="h-3 w-px bg-primary/20" />
              <span className="text-[9px] text-muted-foreground">{t("featureDarkShort")}</span>
              <div className="h-3 w-px bg-primary/20" />
              <span className="text-[9px] text-muted-foreground">{t("featureSystem")}</span>
            </div>
          </div>

          {/* 8. 简洁优雅 */}
          <div className="absolute top-[49.5%] right-[15%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featureElegant")}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">{t("featureTagRestraint")}</span>
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">{t("featureTagModern")}</span>
              <span className="border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full text-[8px]">{t("featureTagRefined")}</span>
            </div>
          </div>

          {/* 9. 智能图标 */}
          <div className="absolute top-[56%] right-[9%] bg-background/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-xl opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="size-4 text-primary" />
              <span className="text-xs font-medium">{t("featureIcons")}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-green-500" />
                </div>
                <span className="text-[9px] text-muted-foreground">{t("featureAutoFetch")}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground">{t("featureFallback")}</span>
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
                  {t("welcomeBack")}
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
                {t("subtitle")}
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
                      <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
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
                      <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
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
                            {t("loggingIn")}
                          </>
                        ) : (
                          <>
                            {t("login")}
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
                {t("subtitle")}
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
                      <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
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
                      <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
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
                            {t("loggingIn")}
                          </>
                        ) : (
                          <>
                            {t("login")}
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

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
