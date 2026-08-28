import { NextResponse } from "next/server"
import { getDisplaySettings } from "@/lib/actions"
import { defaultSettings } from "@/lib/client-settings"

// 公开设置接口：展示项（标题/描述/Logo/Favicon）按当前请求的工作区覆盖后返回。
// aboutContent 为 /about 页专用，整篇 Markdown 不随本接口下发（只暴露 enableAboutPage 开关）
export async function GET() {
  try {
    const merged = await getDisplaySettings()
    const { id, aboutContent: _aboutContent, ...publicSettings } = merged as Record<string, unknown> & { id?: string }
    return NextResponse.json({ ...defaultSettings, ...publicSettings })
  } catch (error) {
    console.warn("Using default settings fallback:", error)
    return NextResponse.json(defaultSettings)
  }
}
