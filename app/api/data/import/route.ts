import { NextRequest, NextResponse } from 'next/server'
import { importData } from '@/lib/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = (formData.get('mode') as string) === 'overwrite' ? 'overwrite' : 'append'

    if (!file) {
      return NextResponse.json(
        { error: '未选择文件' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const text = await file.text()

    // 解析JSON
    let jsonData
    try {
      jsonData = JSON.parse(text)
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON格式错误，请检查文件内容' },
        { status: 400 }
      )
    }

    // 导入数据
    const result = await importData(jsonData, mode)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      importedCount: result.importedCount,
    })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: '导入失败，请检查文件格式' },
      { status: 500 }
    )
  }
}
