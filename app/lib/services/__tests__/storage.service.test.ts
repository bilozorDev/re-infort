import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  cleanupOrphanedImages,
  deleteProductImage,
  downloadImage,
  getSignedUrl,
  getSignedUrls,
  uploadProductImage,
  validateImage,
} from '../storage.service'

// Mock Supabase client
const mockStorage = {
  from: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
  download: vi.fn(),
  list: vi.fn(),
}

const mockSupabase = {
  storage: mockStorage,
}

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.from.mockReturnValue(mockStorage)
  })

  describe('validateImage', () => {
    it('should validate correct image files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      const result = validateImage(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      const result = validateImage(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File must be an image')
    })

    it('should reject unsupported image types', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })

      const result = validateImage(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only JPEG, PNG, WebP, and AVIF images are allowed')
    })

    it('should reject files that are too large', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }) // 6MB

      const result = validateImage(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File size must be less than 5MB')
    })
  })

  describe('uploadProductImage', () => {
    it('should upload a valid image file', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const mockUploadData = { path: 'org123/product456/timestamp_random.jpg' }
      mockStorage.upload.mockResolvedValue({ data: mockUploadData, error: null })

      const onProgress = vi.fn()
      const result = await uploadProductImage(mockSupabase as unknown as SupabaseClient, file, 'org123', 'product456', onProgress)

      expect(mockStorage.from).toHaveBeenCalledWith('product-images')
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^org123\/product456\/\d+_[a-z0-9]+\.jpg$/),
        file,
        { cacheControl: '3600', upsert: false }
      )
      expect(onProgress).toHaveBeenCalledWith(100)
      expect(result.path).toBe(mockUploadData.path)
      expect(result.url).toMatch(/^org123\/product456\/\d+_[a-z0-9]+\.jpg$/)
    })

    it('should reject files that are too large', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })

      await expect(uploadProductImage(mockSupabase as unknown as SupabaseClient, file, 'org123', 'product456'))
        .rejects.toThrow('File size must be less than 5MB')
    })

    it('should reject unsupported file types', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })

      await expect(uploadProductImage(mockSupabase as unknown as SupabaseClient, file, 'org123', 'product456'))
        .rejects.toThrow('Only JPEG, PNG, WebP, and AVIF images are allowed')
    })

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      mockStorage.upload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

      await expect(uploadProductImage(mockSupabase as unknown as SupabaseClient, file, 'org123', 'product456'))
        .rejects.toThrow('Upload failed: Upload failed')
    })
  })

  describe('deleteProductImage', () => {
    it('should delete an image file', async () => {
      const filePath = 'org123/product456/image.jpg'
      mockStorage.remove.mockResolvedValue({ error: null })

      await deleteProductImage(mockSupabase as unknown as SupabaseClient, filePath)

      expect(mockStorage.from).toHaveBeenCalledWith('product-images')
      expect(mockStorage.remove).toHaveBeenCalledWith([filePath])
    })

    it('should handle delete errors', async () => {
      const filePath = 'org123/product456/image.jpg'
      mockStorage.remove.mockResolvedValue({ error: { message: 'Delete failed' } })

      await expect(deleteProductImage(mockSupabase as unknown as SupabaseClient, filePath))
        .rejects.toThrow('Delete failed: Delete failed')
    })
  })

  describe('getSignedUrl', () => {
    it('should create a signed URL', async () => {
      const filePath = 'org123/product456/image.jpg'
      const mockUrl = 'https://example.com/signed-url'
      mockStorage.createSignedUrl.mockResolvedValue({ 
        data: { signedUrl: mockUrl }, 
        error: null 
      })

      const result = await getSignedUrl(mockSupabase as unknown as SupabaseClient, filePath)

      expect(mockStorage.from).toHaveBeenCalledWith('product-images')
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(filePath, 3600)
      expect(result).toBe(mockUrl)
    })

    it('should handle signed URL errors', async () => {
      const filePath = 'org123/product456/image.jpg'
      mockStorage.createSignedUrl.mockResolvedValue({ 
        data: null, 
        error: { message: 'URL creation failed' } 
      })

      await expect(getSignedUrl(mockSupabase as unknown as SupabaseClient, filePath))
        .rejects.toThrow('Failed to get signed URL: URL creation failed')
    })
  })

  describe('getSignedUrls', () => {
    it('should create multiple signed URLs', async () => {
      const filePaths = ['path1.jpg', 'path2.jpg', 'path3.jpg']
      const mockUrls = ['url1', 'url2', 'url3']
      
      mockStorage.createSignedUrl
        .mockResolvedValueOnce({ data: { signedUrl: mockUrls[0] }, error: null })
        .mockResolvedValueOnce({ data: { signedUrl: mockUrls[1] }, error: null })
        .mockResolvedValueOnce({ data: { signedUrl: mockUrls[2] }, error: null })

      const result = await getSignedUrls(mockSupabase as unknown as SupabaseClient, filePaths)

      expect(result).toEqual(mockUrls)
      expect(mockStorage.createSignedUrl).toHaveBeenCalledTimes(3)
    })

    it('should filter out failed URLs', async () => {
      const filePaths = ['path1.jpg', 'path2.jpg', 'path3.jpg']
      
      mockStorage.createSignedUrl
        .mockResolvedValueOnce({ data: { signedUrl: 'url1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } })
        .mockResolvedValueOnce({ data: { signedUrl: 'url3' }, error: null })

      const result = await getSignedUrls(mockSupabase as unknown as SupabaseClient, filePaths)

      expect(result).toEqual(['url1', 'url3'])
    })
  })

  describe('downloadImage', () => {
    it('should download an image file', async () => {
      const filePath = 'org123/product456/image.jpg'
      const mockBlob = new Blob(['image data'])
      mockStorage.download.mockResolvedValue({ data: mockBlob, error: null })

      const result = await downloadImage(mockSupabase as unknown as SupabaseClient, filePath)

      expect(mockStorage.from).toHaveBeenCalledWith('product-images')
      expect(mockStorage.download).toHaveBeenCalledWith(filePath)
      expect(result).toBe(mockBlob)
    })

    it('should handle download errors', async () => {
      const filePath = 'org123/product456/image.jpg'
      mockStorage.download.mockResolvedValue({ data: null, error: { message: 'Download failed' } })

      await expect(downloadImage(mockSupabase as unknown as SupabaseClient, filePath))
        .rejects.toThrow('Download failed: Download failed')
    })
  })

  describe('cleanupOrphanedImages', () => {
    it('should remove orphaned images', async () => {
      const orgId = 'org123'
      const activeImagePaths = ['org123/product1/image1.jpg', 'org123/product2/image2.jpg']
      const allFiles = [
        { name: 'product1/image1.jpg' },
        { name: 'product2/image2.jpg' },
        { name: 'product3/orphaned.jpg' },
      ]

      mockStorage.list.mockResolvedValue({ data: allFiles, error: null })
      mockStorage.remove.mockResolvedValue({ error: null })

      await cleanupOrphanedImages(mockSupabase as unknown as SupabaseClient, orgId, activeImagePaths)

      expect(mockStorage.list).toHaveBeenCalledWith(orgId, { limit: 1000, offset: 0 })
      expect(mockStorage.remove).toHaveBeenCalledWith(['org123/product3/orphaned.jpg'])
    })

    it('should handle no orphaned files', async () => {
      const orgId = 'org123'
      const activeImagePaths = ['org123/product1/image1.jpg']
      const allFiles = [{ name: 'product1/image1.jpg' }]

      mockStorage.list.mockResolvedValue({ data: allFiles, error: null })

      await cleanupOrphanedImages(mockSupabase as unknown as SupabaseClient, orgId, activeImagePaths)

      expect(mockStorage.remove).not.toHaveBeenCalled()
    })

    it('should handle list errors gracefully', async () => {
      const orgId = 'org123'
      const activeImagePaths = ['org123/product1/image1.jpg']

      mockStorage.list.mockResolvedValue({ data: null, error: { message: 'List failed' } })

      // Should not throw
      await cleanupOrphanedImages(mockSupabase as unknown as SupabaseClient, orgId, activeImagePaths)

      expect(mockStorage.remove).not.toHaveBeenCalled()
    })
  })
})