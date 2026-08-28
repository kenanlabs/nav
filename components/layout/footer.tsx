"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Separator } from "@/components/ui/separator"
import { fetchPublicSettings, type PublicSettings } from "@/lib/client-settings"

// 获取动态版权信息
function getDefaultCopyright(): string {
  const year = new Date().getFullYear()
  return `© ${year} Conan Nav. All rights reserved.`
}

export function Footer() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const t = useTranslations("footer")

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const data = await fetchPublicSettings()
      if (!cancelled) {
        setSettings(data)
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
  }, [])

  // 如果设置为不显示底部，返回 null
  if (settings && !settings.showFooter) {
    return null
  }

  return (
    <footer className="w-full border-t bg-background px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] w-full py-6">
        <div className="lg:pr-36 lg:pl-2">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex flex-col items-center space-y-1 sm:items-start">
              <p className="text-sm text-muted-foreground">
                {settings?.footerCopyright || getDefaultCopyright()}
              </p>
              {/* 备案信息 */}
              {settings?.showIcp && settings.icpNumber && (
                <p className="text-xs text-muted-foreground">
                  {settings.icpLink ? (
                    <a
                      href={settings.icpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground"
                    >
                      {settings.icpNumber}
                    </a>
                  ) : (
                    <span>{settings.icpNumber}</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
              {/* 友情链接 */}
              {settings?.footerLinks && settings.footerLinks.length > 0 && (
                <>
                  {settings.footerLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  ))}
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}
              {/* 关于页面 - 根据设置显示或隐藏 */}
              {settings?.enableAboutPage && (
                <>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("about")}
                  </Link>
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}
              {/* 管理后台链接 - 根据设置显示或隐藏 */}
              {settings?.showAdminLink && (
                <a
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("admin")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
