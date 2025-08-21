import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  cn,
  debounce,
  formatCurrency,
  formatDate,
  formatDateTime,
  fuzzyFilter,
  getRowDensityStyles,
  getStatusBadgeStyles,
  isMobileDevice,
} from '../table'

describe('Table Utils', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('test')
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous execution when called again', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      vi.advanceTimersByTime(50)
      debouncedFn('second')
      
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })

    it('should handle multiple arguments', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2', 'arg3')
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle null values', () => {
      expect(formatCurrency(null)).toBe('-')
    })

    it('should handle undefined values', () => {
      expect(formatCurrency(undefined)).toBe('-')
    })

    it('should add trailing zeros for whole numbers', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatDate', () => {
    it('should format string dates correctly', () => {
      expect(formatDate('2024-01-15T12:00:00Z')).toBe('Jan 15, 2024')
    })

    it('should format Date objects correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('should handle null values', () => {
      expect(formatDate(null)).toBe('-')
    })

    it('should handle undefined values', () => {
      expect(formatDate(undefined)).toBe('-')
    })

    it('should handle empty strings', () => {
      expect(formatDate('')).toBe('-')
    })

    it('should format ISO date strings correctly', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format string dates with time correctly', () => {
      expect(formatDateTime('2024-01-15T10:30:00')).toMatch(/Jan 15, 2024/)
    })

    it('should format Date objects with time correctly', () => {
      const date = new Date('2024-01-15T10:30:00')
      expect(formatDateTime(date)).toMatch(/Jan 15, 2024/)
    })

    it('should handle null values', () => {
      expect(formatDateTime(null)).toBe('-')
    })

    it('should handle undefined values', () => {
      expect(formatDateTime(undefined)).toBe('-')
    })

    it('should include time in the output', () => {
      const result = formatDateTime('2024-01-15T10:30:00')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('isMobileDevice', () => {
    const originalWindow = global.window
    const originalNavigator = global.navigator

    beforeEach(() => {
      // Reset globals before each test
      Object.defineProperty(global, 'window', {
        value: {
          innerWidth: 1024,
        },
        writable: true,
      })
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        writable: true,
      })
    })

    afterEach(() => {
      global.window = originalWindow
      global.navigator = originalNavigator
    })

    it('should return false for desktop width', () => {
      global.window.innerWidth = 1024
      expect(isMobileDevice()).toBe(false)
    })

    it('should return true for mobile width', () => {
      global.window.innerWidth = 500
      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for mobile user agents', () => {
      global.window.innerWidth = 1024
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        configurable: true
      })
      expect(isMobileDevice()).toBe(true)
    })

    it('should return false when window is undefined', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      })
      expect(isMobileDevice()).toBe(false)
    })

    it('should detect Android devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
        configurable: true
      })
      expect(isMobileDevice()).toBe(true)
    })

    it('should detect iPad devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
        configurable: true
      })
      expect(isMobileDevice()).toBe(true)
    })
  })

  describe('getRowDensityStyles', () => {
    it('should return compact styles', () => {
      expect(getRowDensityStyles('compact')).toBe('py-1 text-sm')
    })

    it('should return normal styles', () => {
      expect(getRowDensityStyles('normal')).toBe('py-2')
    })

    it('should return comfortable styles', () => {
      expect(getRowDensityStyles('comfortable')).toBe('py-3')
    })

    it('should default to normal when no density provided', () => {
      expect(getRowDensityStyles()).toBe('py-2')
    })
  })

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('flex', 'items-center')).toBe('flex items-center')
    })

    it('should handle conditional classes', () => {
      expect(cn('flex', true && 'items-center', false && 'hidden')).toBe('flex items-center')
    })

    it('should merge conflicting tailwind classes', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6')
    })
  })

  describe('getStatusBadgeStyles', () => {
    it('should return green styles for active status', () => {
      expect(getStatusBadgeStyles('active')).toBe('bg-green-100 text-green-800')
    })

    it('should return gray styles for inactive status', () => {
      expect(getStatusBadgeStyles('inactive')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return red styles for discontinued status', () => {
      expect(getStatusBadgeStyles('discontinued')).toBe('bg-red-100 text-red-800')
    })

    it('should return yellow styles for pending status', () => {
      expect(getStatusBadgeStyles('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return blue styles for completed status', () => {
      expect(getStatusBadgeStyles('completed')).toBe('bg-blue-100 text-blue-800')
    })

    it('should handle case insensitive input', () => {
      expect(getStatusBadgeStyles('ACTIVE')).toBe('bg-green-100 text-green-800')
      expect(getStatusBadgeStyles('Active')).toBe('bg-green-100 text-green-800')
    })

    it('should return default gray styles for unknown status', () => {
      expect(getStatusBadgeStyles('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('fuzzyFilter', () => {
    it('should return true when search is empty', () => {
      expect(fuzzyFilter('test value', '')).toBe(true)
    })

    it('should return false when value is empty', () => {
      expect(fuzzyFilter('', 'search')).toBe(false)
    })

    it('should return true for exact matches', () => {
      expect(fuzzyFilter('test', 'test')).toBe(true)
    })

    it('should return true for partial matches', () => {
      expect(fuzzyFilter('test value', 'val')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(fuzzyFilter('Test Value', 'test')).toBe(true)
      expect(fuzzyFilter('test value', 'VALUE')).toBe(true)
    })

    it('should return false for non-matches', () => {
      expect(fuzzyFilter('test', 'xyz')).toBe(false)
    })

    it('should handle number values', () => {
      expect(fuzzyFilter(123, '12')).toBe(true)
      expect(fuzzyFilter(123, '45')).toBe(false)
    })

    it('should handle null and undefined values', () => {
      expect(fuzzyFilter(null, 'search')).toBe(false)
      expect(fuzzyFilter(undefined, 'search')).toBe(false)
    })
  })
})