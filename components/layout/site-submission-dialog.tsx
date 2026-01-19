"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { submitSite } from "@/lib/actions"

// 表单验证 Schema
const formSchema = z.object({
  name: z.string().min(1, "网站名称不能为空").max(50, "网站名称不能超过50个字符"),
  url: z.string().min(1, "网站链接不能为空").url("请输入有效的URL"),
  description: z.string().min(1, "网站描述不能为空").max(200, "描述不能超过200个字符"),
  categoryId: z.string().min(1, "请选择分类"),
  submitterContact: z.string().max(100, "联系方式不能超过100个字符").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SiteSubmissionDialogProps {
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

export function SiteSubmissionDialog({ categories }: SiteSubmissionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
      categoryId: "",
      submitterContact: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await submitSite({
        ...values,
      })

      if (result.success) {
        toast.success(result.message || "提交成功！我们会尽快审核，感谢您的贡献")
        form.reset()
        setOpen(false)
      } else {
        toast.error(result.error || "提交失败")
      }
    } catch (error) {
      toast.error("提交失败，请稍后重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="提交网站">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-archive h-[1.2rem] w-[1.2rem]"
          >
            <rect width="20" height="5" x="2" y="3" rx="1"></rect>
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
            <path d="M10 12h4"></path>
          </svg>
          <span className="sr-only">提交网站</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>提交网站收录</DialogTitle>
          <DialogDescription>
            填写网站信息，管理员审核通过后会发布到导航站
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：GitHub" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站链接 *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站描述 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="简要描述网站的功能和特点"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value.length}/200 字符
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitterContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系方式（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="邮箱或微信，方便审核联系" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    管理员审核时可能需要联系您
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交审核
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
