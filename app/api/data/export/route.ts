import { NextResponse } from 'next/server'
import { exportData } from '@/lib/actions'

export async function GET() {
  try {
    const result = await exportData()

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // 返回JSON文件下载
    return new NextResponse(JSON.stringify(result.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Disposition': `attachment; filename="nav_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
