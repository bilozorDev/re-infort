import { describe, expect, it } from 'vitest'

import { cn } from '../utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('flex', 'items-center')).toBe('flex items-center')
    })

    it('should handle conditional classes', () => {
      expect(cn('flex', true && 'items-center', false && 'hidden')).toBe('flex items-center')
    })

    it('should handle undefined and null values', () => {
      expect(cn('flex', undefined, null, 'items-center')).toBe('flex items-center')
    })

    it('should merge conflicting tailwind classes', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['flex', 'items-center'], 'justify-between')).toBe('flex items-center justify-between')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle object syntax', () => {
      expect(cn({
        'flex': true,
        'items-center': true,
        'hidden': false,
      })).toBe('flex items-center')
    })
  })
})