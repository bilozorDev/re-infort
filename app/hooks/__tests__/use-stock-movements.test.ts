import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock React Query
const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
}))

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('../use-supabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useStockMovements hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useStockMovements', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useStockMovements } = await import('../use-stock-movements')
      
      const filters = { type: 'receipt', startDate: '2024-01-01' }
      useStockMovements('prod-1', filters)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['stock-movements', 'prod-1', filters],
        queryFn: expect.any(Function),
      })
    })

    it('should build query with product filter', async () => {
      const { useStockMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: 'mov-1', product_id: 'prod-1', movement_type: 'receipt' },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })

      useStockMovements('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements_details')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('product_id', 'prod-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should apply all filters correctly', async () => {
      const { useStockMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockGte = vi.fn().mockReturnThis()
      const mockLte = vi.fn().mockReturnThis()
      const mockOr = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        or: mockOr,
        order: mockOrder,
      })

      const filters = {
        type: 'transfer',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        warehouseId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'completed',
      }

      useStockMovements('prod-1', filters)
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockEq).toHaveBeenCalledWith('product_id', 'prod-1')
      expect(mockEq).toHaveBeenCalledWith('movement_type', 'transfer')
      expect(mockGte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(mockLte).toHaveBeenCalledWith('created_at', '2024-01-31')
      expect(mockOr).toHaveBeenCalledWith(
        'from_warehouse_id.eq.a1b2c3d4-e5f6-7890-abcd-ef1234567890,to_warehouse_id.eq.a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      )
      expect(mockEq).toHaveBeenCalledWith('status', 'completed')
    })

    it('should handle query without product filter', async () => {
      const { useStockMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: 'mov-1', product_id: 'prod-1' },
          { id: 'mov-2', product_id: 'prod-2' },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      })

      useStockMovements(undefined, {})
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements_details')
      expect(result).toHaveLength(2)
    })

    it('should handle query errors', async () => {
      const { useStockMovements } = await import('../use-stock-movements')
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        }),
      })

      useStockMovements('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Query failed')
    })
  })

  describe('useRecentMovements', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useRecentMovements } = await import('../use-stock-movements')
      
      useRecentMovements('prod-1', 10)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['recent-movements', 'prod-1', 10],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should use default limit of 5', async () => {
      const { useRecentMovements } = await import('../use-stock-movements')
      
      useRecentMovements('prod-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['recent-movements', 'prod-1', 5],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be disabled when productId is empty', async () => {
      const { useRecentMovements } = await import('../use-stock-movements')
      
      useRecentMovements('')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['recent-movements', '', 5],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should query with limit', async () => {
      const { useRecentMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockLimit = vi.fn().mockResolvedValue({
        data: [
          { id: 'mov-1', created_at: '2024-01-20' },
          { id: 'mov-2', created_at: '2024-01-19' },
          { id: 'mov-3', created_at: '2024-01-18' },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
      })

      useRecentMovements('prod-1', 3)
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(mockEq).toHaveBeenCalledWith('product_id', 'prod-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockLimit).toHaveBeenCalledWith(3)
      expect(result).toHaveLength(3)
    })
  })

  describe('useOrganizationMovements', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useOrganizationMovements } = await import('../use-stock-movements')
      
      const filters = { type: 'sale' }
      useOrganizationMovements(filters)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['organization-movements', filters],
        queryFn: expect.any(Function),
      })
    })

    it('should apply filters without product constraint', async () => {
      const { useOrganizationMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockGte = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: 'mov-1', product_id: 'prod-1', movement_type: 'sale' },
          { id: 'mov-2', product_id: 'prod-2', movement_type: 'sale' },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
      })

      const filters = {
        type: 'sale',
        startDate: '2024-01-01',
      }

      useOrganizationMovements(filters)
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(mockEq).toHaveBeenCalledWith('movement_type', 'sale')
      expect(mockGte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(result).toHaveLength(2)
      expect(result[0].product_id).toBe('prod-1')
      expect(result[1].product_id).toBe('prod-2')
    })

    it('should handle empty filters', async () => {
      const { useOrganizationMovements } = await import('../use-stock-movements')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      })

      useOrganizationMovements()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements_details')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('useMovementStatistics', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      useMovementStatistics('30d')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['movement-statistics', '30d'],
        queryFn: expect.any(Function),
      })
    })

    it('should use default period of 30d', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      useMovementStatistics()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['movement-statistics', '30d'],
        queryFn: expect.any(Function),
      })
    })

    it('should calculate statistics correctly', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      const mockData = [
        { 
          product_id: 'prod-1', 
          quantity: 10, 
          movement_type: 'receipt',
          created_at: '2024-01-15',
        },
        { 
          product_id: 'prod-1', 
          quantity: 5, 
          movement_type: 'sale',
          created_at: '2024-01-16',
        },
        { 
          product_id: 'prod-2', 
          quantity: 8, 
          movement_type: 'receipt',
          created_at: '2024-01-17',
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      })

      useMovementStatistics('7d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(result).toMatchObject({
        totalMovements: 3,
        movementsByType: {
          receipt: 2,
          sale: 1,
        },
        totalQuantityMoved: 23,
        avgMovementSize: 23 / 3,
        productMovements: {
          'prod-1': { count: 2, quantity: 15 },
          'prod-2': { count: 1, quantity: 8 },
        },
        period: '7d',
      })
    })

    it('should handle different period formats', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      useMovementStatistics('90d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      const gteCall = mockSupabase.from.mock.calls[0]
      expect(gteCall).toBeDefined()
    })

    it('should handle empty movement data', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      useMovementStatistics('30d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(result).toMatchObject({
        totalMovements: 0,
        movementsByType: {},
        totalQuantityMoved: 0,
        avgMovementSize: 0,
        productMovements: {},
        period: '30d',
      })
    })

    it('should handle query errors', async () => {
      const { useMovementStatistics } = await import('../use-stock-movements')
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Statistics query failed'),
        }),
      })

      useMovementStatistics('30d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Statistics query failed')
    })
  })
})