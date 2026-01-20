"use client"

import { useState, useEffect } from "react"
import { usePoetryToggle } from "@/hooks/use-poetry-toggle"
import { JinrishiciCard } from "@/components/layout/jinrishici-card"

// 动画持续时间常量
const ANIMATION_DURATION = 300 // ms

export function JinrishiciCardWrapper() {
  const { isVisible, mounted, setVisible } = usePoetryToggle()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // 当用户点击切换按钮时触发展开动画
  useEffect(() => {
    if (isVisible && mounted) {
      setIsExpanded(true)
      setIsAnimating(true)
      setHasLoadedOnce(true) // 标记已加载过
      // 动画完成后设置 isAnimating 为 false
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
    } else if (!isVisible && mounted) {
      // 收起动画
      setIsAnimating(true)
      setTimeout(() => setIsExpanded(false), ANIMATION_DURATION)
    }
  }, [isVisible, mounted])

  // 处理关闭按钮点击
  const handleClose = () => {
    setIsAnimating(true)
    // 先执行收起动画，然后更新状态
    setTimeout(() => {
      setIsExpanded(false)
      setIsAnimating(false)
      setVisible(false) // 使用 hook 提供的方法更新状态
    }, ANIMATION_DURATION)
  }

  // 未挂载时不显示（避免闪烁）
  if (!mounted) {
    return null
  }

  // 用户选择隐藏且动画结束后不显示
  // 但如果已经加载过一次，就保持组件挂载，只隐藏显示
  if (!hasLoadedOnce) {
    return null
  }

  return (
    <div
      className={`fixed top-20 right-4 z-40 hidden lg:block transition-all duration-300 ease-in-out origin-top-right ${
        isExpanded
          ? 'opacity-100 scale-100 translate-x-0'
          : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
      }`}
    >
      <JinrishiciCard onClose={handleClose} />
    </div>
  )
}
