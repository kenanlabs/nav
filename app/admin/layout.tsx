import type { Metadata } from "next"
import { getSystemSettings } from "@/lib/actions"

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSystemSettings()
  const settings = result.success && result.data ? result.data : null

  return {
    title: `${settings?.siteName || "Conan Nav"} - 管理后台`,
    description: settings?.siteDescription || "简洁现代化的网址导航系统",
    icons: {
      icon: settings?.favicon || "/favicon.ico",
      apple: settings?.favicon || "/apple-touch-icon.png",
    },
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
