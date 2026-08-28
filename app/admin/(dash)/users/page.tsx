"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Info, Zap, Link2, PanelBottom, TriangleAlert, Layers, FileText } from "lucide-react"
import {
  getSystemSettings,
  updateSystemSettings,
  isMemoryMode,
  getWorkspaceDisplaySettings,
  updateWorkspaceDisplaySettings,
} from "@/lib/actions"
import { useTranslations } from "next-intl"
import { locales, localeNames, isLocale, type Locale } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MarkdownContent } from "@/components/markdown-content"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SystemSettingsData {
  id: string
  siteName: string
  siteDescription: string
  siteLogo: string | undefined
  favicon: string | undefined
  // 非默认工作区上下文时，全局设置的回退值（提示用）
  siteLogoFallback?: string | null
  faviconFallback?: string | null
  pageSize: number
  showFooter: boolean
  footerCopyright: string
  footerLinks: Array<{ name: string; url: string }>
  showAdminLink: boolean
  enableVisitTracking: boolean
  enableSiteDetail: boolean
  enablePoetry: boolean
  enableAboutPage: boolean
  aboutContent: string | undefined
  // 非默认工作区上下文时，全局设置的回退值（提示用）
  aboutContentFallback?: string | null
  githubUrl: string | undefined
  showIcp: boolean
  icpNumber: string | undefined
  icpLink: string | undefined
  defaultLanguage: Locale
}

const sections = [
  { id: "basic", titleKey: "secBasic", icon: Info },
  { id: "features", titleKey: "secFeatures", icon: Zap },
  { id: "about", titleKey: "secAbout", icon: FileText },
  { id: "links", titleKey: "secLinks", icon: Link2 },
  { id: "footer", titleKey: "secFooter", icon: PanelBottom },
] as const

type SectionId = (typeof sections)[number]["id"]

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings")
  const tc = useTranslations("common")
  const [settings, setSettings] = useState<SystemSettingsData>({
    id: "",
    siteName: "Conan Nav",
    siteDescription: "简洁现代化的网址导航系统",
    siteLogo: undefined,
    favicon: undefined,
    pageSize: 20,
    showFooter: true,
    footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
    footerLinks: [],
    showAdminLink: true,
    enableVisitTracking: true,
    enableSiteDetail: false,
    enablePoetry: true,
    enableAboutPage: false,
    aboutContent: undefined,
    githubUrl: undefined,
    showIcp: false,
    icpNumber: undefined,
    icpLink: undefined,
    defaultLanguage: "zh",
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("basic")
  const [memoryMode, setMemoryMode] = useState(false)
  const [aboutPreview, setAboutPreview] = useState(false)
  // 当前设置页生效的工作区上下文（基本信息区块按其读写）
  const [workspaceCtx, setWorkspaceCtx] = useState<{
    id: string
    name: string
    isDefault: boolean
  } | null>(null)

  // 加载数据
  useEffect(() => {
    loadSettings()
    isMemoryMode().then((result) => {
      if (result.success) setMemoryMode(result.data)
    })
  }, [])

  // 顶栏切换工作区后重新加载当前工作区的设置
  useEffect(() => {
    const onWorkspaceChanged = () => loadSettings()
    window.addEventListener("workspace-context-changed", onWorkspaceChanged)
    return () =>
      window.removeEventListener("workspace-context-changed", onWorkspaceChanged)
  }, [])

  // 向顶栏切换器声明当前区块作用域：基本信息与关于页随工作区，其余区块全局
  // （切换器据此切换可用/禁用态，替代区块内提示条）
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("admin-scope-changed", {
        detail: {
          scope: activeSection === "basic" || activeSection === "about" ? "workspace" : "global",
        },
      })
    )
  }, [activeSection])

  const loadSettings = async () => {
    const [result, displayResult] = await Promise.all([
      getSystemSettings(),
      getWorkspaceDisplaySettings(),
    ])
    const global = result.success && result.data ? result.data : null
    const display =
      displayResult.success && displayResult.data ? displayResult.data : null
    if (global) {
      setSettings(prev => ({
        ...prev,
        ...global,
        // 基本信息四项按当前工作区上下文取值（非默认工作区为覆盖值，空即回退全局）
        siteName: display ? display.display.siteName : global.siteName,
        siteDescription: display ? display.display.siteDescription : global.siteDescription,
        siteLogo: (display ? display.display.siteLogo : global.siteLogo) || undefined,
        favicon: (display ? display.display.favicon : global.favicon) || undefined,
        siteLogoFallback: global.siteLogo,
        faviconFallback: global.favicon,
        aboutContent: (display ? display.display.aboutContent : global.aboutContent) || undefined,
        aboutContentFallback: global.aboutContent,
        enableAboutPage: global.enableAboutPage ?? false,
        footerLinks: (global.footerLinks as Array<{ name: string; url: string }>) || [],
        githubUrl: global.githubUrl || undefined,
        showIcp: global.showIcp || false,
        icpNumber: global.icpNumber || undefined,
        icpLink: global.icpLink || undefined,
        enableSiteDetail: global.enableSiteDetail ?? false,
        enablePoetry: global.enablePoetry ?? true,
        defaultLanguage: isLocale(global.defaultLanguage) ? global.defaultLanguage : "zh",
      }))
    }
    if (display) {
      setWorkspaceCtx(display.workspace)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      // 基本信息四项按工作区上下文分流：默认工作区并入全局设置一次写入；
      // 非默认工作区写覆盖字段（其余设置仍写全局）
      let result
      if (workspaceCtx && !workspaceCtx.isDefault) {
        result = await updateWorkspaceDisplaySettings({
          siteName: settings.siteName || "",
          siteDescription: settings.siteDescription || "",
          siteLogo: settings.siteLogo || "",
          favicon: settings.favicon || "",
          aboutContent: settings.aboutContent || "",
        })
        if (result.success) {
          const {
            siteName: _n,
            siteDescription: _d,
            siteLogo: _l,
            favicon: _f,
            aboutContent: _a,
            ...rest
          } = settings
          result = await updateSystemSettings(rest)
        }
      } else {
        result = await updateSystemSettings(settings)
      }
      if (result.success) {
        toast.success(t("saveSuccess"), {
          description: t("saveSuccessDesc"),
        })
        if (memoryMode) {
          toast.warning(t("memoryModeToastTitle"), {
            description: t("memoryModeToastDesc"),
          })
        }
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error(t("saveFailed"), {
          description: (result as { error?: string }).error || t("saveFailedDesc"),
        })
      }
    } catch (error) {
      toast.error(t("saveFailed"), {
        description: tc("retryLater"),
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const addFooterLink = () => {
    setSettings({
      ...settings,
      footerLinks: [...settings.footerLinks, { name: "", url: "" }],
    })
  }

  const removeFooterLink = (index: number) => {
    const newLinks = settings.footerLinks.filter((_, i) => i !== index)
    setSettings({ ...settings, footerLinks: newLinks })
  }

  const updateFooterLink = (index: number, field: "name" | "url", value: string) => {
    const newLinks = [...settings.footerLinks]
    newLinks[index][field] = value
    setSettings({ ...settings, footerLinks: newLinks })
  }

  const sectionMeta: Record<SectionId, { title: string; description: string }> = {
    basic: { title: t("secBasic"), description: t("secBasicDesc") },
    features: { title: t("secFeatures"), description: t("secFeaturesDesc") },
    about: { title: t("secAbout"), description: t("secAboutDesc") },
    links: { title: t("secLinks"), description: t("secLinksDesc") },
    footer: { title: t("secFooter"), description: t("secFooterDesc") },
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("pageTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("pageDesc")}
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={savingSettings} className="shrink-0">
          {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveBtn")}
        </Button>
      </div>
      <Separator />

      {/* 内容区：左侧选项 + 右侧表单 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左侧选项导航 */}
        <nav className="shrink-0 lg:w-48" aria-label={t("navLabel")}>
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors w-full",
                    activeSection === section.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {t(section.titleKey as never)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 右侧表单内容 */}
        <div className="min-w-0 flex-1">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1">
              <h4 className="text-base font-semibold">{sectionMeta[activeSection].title}</h4>
              <p className="text-sm text-muted-foreground">
                {sectionMeta[activeSection].description}
              </p>
            </div>
            <Separator />

            {/* 基本信息 */}
            {activeSection === "basic" && (
              <div className="space-y-8">
                {/* 工作区上下文提示 */}
                {workspaceCtx && (
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p>
                        {t("workspaceContext", { name: workspaceCtx.name })}
                        {workspaceCtx.isDefault ? t("workspaceIsDefault") : ""}
                      </p>
                      {!workspaceCtx.isDefault && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("workspaceOverrideHint")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="site-name">{t("siteNameLabel")}</Label>
                  <Input
                    id="site-name"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder={t("siteNamePlaceholder")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("siteNameHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">{t("siteDescLabel")}</Label>
                  <Textarea
                    id="site-description"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder={t("siteDescPlaceholder")}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("siteDescHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-logo">{t("logoLabel")}</Label>
                  <Input
                    id="site-logo"
                    value={settings.siteLogo || ""}
                    onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("logoHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    value={settings.favicon || ""}
                    onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("faviconHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-language">{t("defaultLanguageLabel")}</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultLanguage: value as Locale })
                    }
                  >
                    <SelectTrigger id="default-language" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locales.map((l) => (
                        <SelectItem key={l} value={l}>
                          {localeNames[l]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {t("defaultLanguageHint")}
                  </p>
                </div>
              </div>
            )}

            {/* 功能开关 */}
            {activeSection === "features" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-tracking">{t("trackingLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("trackingHint")}
                    </p>
                  </div>
                  <Switch
                    id="enable-tracking"
                    checked={settings.enableVisitTracking}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableVisitTracking: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-site-detail">{t("siteDetailLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("siteDetailHint")}
                    </p>
                    {memoryMode && (
                      <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{t("siteDetailMemoryWarning")}</span>
                      </p>
                    )}
                  </div>
                  <Switch
                    id="enable-site-detail"
                    checked={settings.enableSiteDetail}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableSiteDetail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-poetry">{t("poetryLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("poetryHint")}
                    </p>
                  </div>
                  <Switch
                    id="enable-poetry"
                    checked={settings.enablePoetry}
                    onCheckedChange={(checked) => setSettings({ ...settings, enablePoetry: checked })}
                  />
                </div>
              </div>
            )}

            {/* 关于页面 */}
            {activeSection === "about" && (
              <div className="space-y-8">
                {/* 工作区上下文提示 */}
                {workspaceCtx && (
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p>
                        {t("workspaceContext", { name: workspaceCtx.name })}
                        {workspaceCtx.isDefault ? t("workspaceIsDefault") : ""}
                      </p>
                      {!workspaceCtx.isDefault && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("workspaceOverrideHint")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-about-page">{t("aboutEnableLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("aboutEnableHint")}
                    </p>
                  </div>
                  <Switch
                    id="enable-about-page"
                    checked={settings.enableAboutPage}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableAboutPage: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Tabs value={aboutPreview ? "preview" : "edit"} onValueChange={(v) => setAboutPreview(v === "preview")}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="about-content">{t("aboutContentLabel")}</Label>
                      <TabsList className="h-8">
                        <TabsTrigger value="edit" className="px-3 text-xs">
                          {t("aboutTabEdit")}
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="px-3 text-xs">
                          {t("aboutTabPreview")}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </Tabs>
                  {aboutPreview ? (
                    <div className="min-h-[240px] rounded-md border border-border/60 bg-background p-3">
                      {settings.aboutContent ? (
                        <MarkdownContent content={settings.aboutContent} />
                      ) : (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                          {t("aboutEmptyPreview")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      id="about-content"
                      value={settings.aboutContent || ""}
                      onChange={(e) => setSettings({ ...settings, aboutContent: e.target.value })}
                      placeholder={t("aboutContentPlaceholder")}
                      rows={12}
                      className="font-mono text-xs"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t("aboutContentHint")}
                  </p>
                  {!workspaceCtx?.isDefault && !settings.aboutContent && (
                    <p className="text-xs text-muted-foreground">
                      {t("aboutFallbackHint")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 外部链接 */}
            {activeSection === "links" && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="github-url">{t("githubLabel")}</Label>
                  <Input
                    id="github-url"
                    value={settings.githubUrl || ""}
                    onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("githubHint")}
                  </p>
                </div>
              </div>
            )}

            {/* 页脚与版权 */}
            {activeSection === "footer" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-footer">{t("footerLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("footerHint")}
                    </p>
                  </div>
                  <Switch
                    id="show-footer"
                    checked={settings.showFooter}
                    onCheckedChange={(checked) => setSettings({ ...settings, showFooter: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-admin-link">{t("adminLinkLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("adminLinkHint")}
                    </p>
                  </div>
                  <Switch
                    id="show-admin-link"
                    checked={settings.showAdminLink}
                    onCheckedChange={(checked) => setSettings({ ...settings, showAdminLink: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">{t("copyrightLabel")}</Label>
                  <Textarea
                    id="footer-copyright"
                    value={settings.footerCopyright}
                    onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                    rows={2}
                    placeholder={t("copyrightPlaceholder")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("copyrightHint")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-icp">{t("icpLabel")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("icpHint")}
                      </p>
                    </div>
                    <Switch
                      id="show-icp"
                      checked={settings.showIcp}
                      onCheckedChange={(checked) => setSettings({ ...settings, showIcp: checked })}
                    />
                  </div>
                  {settings.showIcp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="icp-number">{t("icpNumberLabel")}</Label>
                        <Input
                          id="icp-number"
                          value={settings.icpNumber || ""}
                          onChange={(e) => setSettings({ ...settings, icpNumber: e.target.value })}
                          placeholder={t("icpNumberPlaceholder")}
                        />
                        <p className="text-sm text-muted-foreground">
                          {t("icpNumberHint")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icp-link">{t("icpLinkLabel")}</Label>
                        <Input
                          id="icp-link"
                          value={settings.icpLink || ""}
                          onChange={(e) => setSettings({ ...settings, icpLink: e.target.value })}
                          placeholder="https://beian.miit.gov.cn"
                        />
                        <p className="text-sm text-muted-foreground">
                          {t("icpLinkHint")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("friendLinksLabel")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("friendLinksHint")}
                      </p>
                    </div>
                    <Button onClick={addFooterLink} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      {t("addLink")}
                    </Button>
                  </div>
                  {settings.footerLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder={t("linkNamePlaceholder")}
                        value={link.name}
                        onChange={(e) => updateFooterLink(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder={t("linkUrlPlaceholder")}
                        value={link.url}
                        onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFooterLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
