import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const [weekNewSites, missingIcons] = await Promise.all([
      // 近 7 天新增网站
      prisma.site.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 缺少图标的网站数
      prisma.site.count({
        where: {
          OR: [{ iconUrl: null }, { iconUrl: "" }],
        },
      }),
    ])

    return NextResponse.json({ weekNewSites, missingIcons })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json(
      { weekNewSites: 0, missingIcons: 0 },
      { status: 500 }
    )
  }
}
