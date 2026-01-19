"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BookOpen } from "lucide-react"
import { usePoetryToggle } from "@/hooks/use-poetry-toggle"

export function PoetryToggle() {
  const { isVisible, toggle, mounted } = usePoetryToggle()

  // 古诗词显示时，不显示按钮（避免逻辑冲突）
  if (!mounted || isVisible) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
          >
            <BookOpen className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">显示古诗词</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>显示古诗词 - 点击展开</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
