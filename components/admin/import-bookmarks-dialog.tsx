"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { importBookmarks } from "@/lib/actions"

interface ImportBookmarksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportBookmarksDialog({
  open,
  onOpenChange,
}: ImportBookmarksDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append')
  const [isImporting, setIsImporting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm')
      const isJson = file.name.endsWith('.json')

      if (!isHtml && !isJson) {
        toast({
          variant: "destructive",
          title: "文件格式错误",
          description: "请选择JSON备份文件或Chrome书签文件（.html/.htm）",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "未选择文件",
        description: "请先选择要导入的书签文件",
      })
      return
    }

    // 如果是覆盖模式，显示确认对话框
    if (importMode === 'overwrite') {
      setShowConfirmDialog(true)
      return
    }

    // 追加模式直接导入
    await performImport()
  }

  const performImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setShowConfirmDialog(false)

    try {
      const isJson = selectedFile.name.endsWith('.json')
      const text = await selectedFile.text()

      let result
      if (isJson) {
        // JSON格式：调用数据导入API
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('mode', importMode)

        const response = await fetch('/api/data/import', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        result = data
      } else {
        // HTML格式：调用书签导入函数
        result = await importBookmarks(text, importMode)
      }

      if (result.success) {
        toast({
          title: "导入成功",
          description: result.message,
        })
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // 刷新数据并关闭对话框
        router.refresh()
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "导入失败",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>
              支持从浏览器导入书签，或导入本系统JSON备份文件
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 文件选择 - 主要操作 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">1. 选择文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="bookmark-file"
              />
              <label htmlFor="bookmark-file">
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed border-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  type="button"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">
                        {selectedFile ? selectedFile.name : "点击选择文件"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                          : "支持 .json 或 .html/.htm 格式"}
                      </p>
                    </div>
                  </div>
                </Button>
              </label>
            </div>

            {/* 导入模式选择 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">2. 选择导入模式</label>

              {/* 追加模式 */}
              <button
                onClick={() => setImportMode('append')}
                className={`w-full text-left p-4 border rounded-lg transition-colors ${
                  importMode === 'append'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                disabled={isImporting}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                    importMode === 'append'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`} />
                  <div>
                    <p className="font-medium">追加到现有数据</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      保留现有的所有网站和分类，将新书签添加到末尾。如果分类名称相同，网站会添加到该分类下。
                    </p>
                  </div>
                </div>
              </button>

              {/* 覆盖模式 */}
              <button
                onClick={() => setImportMode('overwrite')}
                className={`w-full text-left p-4 border rounded-lg transition-colors ${
                  importMode === 'overwrite'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                disabled={isImporting}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                    importMode === 'overwrite'
                      ? 'border-destructive bg-destructive'
                      : 'border-muted-foreground'
                  }`} />
                  <div>
                    <p className="font-medium">覆盖现有数据</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      删除所有现有的网站和分类，仅保留导入的书签数据。
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* 覆盖模式警告 */}
            {importMode === 'overwrite' && selectedFile && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-semibold">危险操作警告</AlertTitle>
                <AlertDescription className="mt-2">
                  您选择了<strong>覆盖模式</strong>，这将永久删除所有现有的网站和分类数据！
                  此操作<strong>不可撤销</strong>，请确保您有备份。
                </AlertDescription>
              </Alert>
            )}

            {/* 格式说明 */}
            <Alert>
              <AlertTitle className="font-semibold">支持的文件格式</AlertTitle>
              <AlertDescription className="mt-2 text-sm space-y-3">
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">JSON格式（推荐）</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    本系统完整备份格式，包含描述、排序、发布状态等所有字段。导入后不会丢失任何数据，适合数据迁移和恢复。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Chrome书签</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    从Chrome等浏览器导入的书签格式，仅包含名称、URL和图标。如果浏览器书签包含多层嵌套文件夹（如 <code className="px-1 py-0.5 rounded bg-background font-mono">/云服务/Cloudflare</code>），
                    系统会自动将每个文件夹拆分为独立分类。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  导入数据
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 覆盖确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认覆盖所有数据？
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 pt-2">
            <div className="font-semibold text-destructive">
              此操作将永久删除所有现有的网站和分类！
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>删除所有网站数据</li>
              <li>删除所有分类数据</li>
              <li>删除所有访问统计记录（⚠️ 无法恢复）</li>
              <li>此操作<span className="font-semibold">不可撤销</span></li>
            </ul>
            <div className="text-sm font-medium pt-2">
              建议在覆盖前先导出当前数据作为备份。
            </div>
            <div className="mt-2 p-2 rounded bg-muted border-l-2 border-muted-foreground">
              <p className="text-xs text-muted-foreground">
                💡 <strong>提示</strong>：导出的JSON文件不包含访问统计数据，导入后访问记录将丢失。如需保留统计数据，请使用数据库备份。
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={performImport}
              disabled={isImporting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                "确认覆盖"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
