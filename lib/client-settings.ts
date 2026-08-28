export interface PublicSettings {
  siteName: string
  siteDescription: string
  siteLogo: string | null
  favicon: string | null
  pageSize: number
  showFooter: boolean
  footerCopyright: string
  footerLinks: Array<{ name: string; url: string }>
  showAdminLink: boolean
  showIcp: boolean
  icpNumber: string | null
  icpLink: string | null
  enableVisitTracking: boolean
  enableSubmission: boolean
  enableSiteDetail: boolean
  enablePoetry: boolean
  enableAboutPage: boolean
  submissionMaxPerDay: number
  githubUrl: string | null
  defaultLanguage: string
}

export const defaultSettings: PublicSettings = {
  siteName: "Conan Nav",
  siteDescription: "简洁现代化的网址导航系统",
  siteLogo: null,
  favicon: null,
  pageSize: 20,
  showFooter: true,
  footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
  footerLinks: [{ name: "GitHub", url: "https://github.com/kenanlabs/nav" }],
  showAdminLink: true,
  showIcp: false,
  icpNumber: null,
  icpLink: null,
  enableVisitTracking: true,
  enableSubmission: true,
  enableSiteDetail: false,
  enablePoetry: true,
  enableAboutPage: false,
  submissionMaxPerDay: 3,
  githubUrl: "https://github.com/kenanlabs/nav",
  defaultLanguage: "zh",
}

let cachedSettings: PublicSettings | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const now = Date.now()
  if (cachedSettings && now - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    const res = await fetch("/api/settings", {
      cache: "no-cache",
      headers: { Accept: "application/json" },
    })

    if (res.ok) {
      const data = await res.json()
      if (data && typeof data === "object" && !data.error) {
        const merged: PublicSettings = { ...defaultSettings, ...data }
        cachedSettings = merged
        cacheTimestamp = now
        return merged
      }
    }
  } catch {
    // Gracefully fallback on network or parse error without throwing
  }

  return cachedSettings || defaultSettings
}
