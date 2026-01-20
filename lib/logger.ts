/**
 * 日志工具函数
 * 在开发环境输出日志，生产环境静默
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  }
}
