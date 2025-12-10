import request from '@/utils/request'

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string
  product?: {
    id: string
    name: string
    code?: string
    unit?: string
    auxiliaryUnits?: Array<{
      unit: string
      conversionRate: number
      purpose: 'sales' | 'purchase' | 'internal' | 'external'
      description?: string
    }>
  }
  quantity: number
  packagingUnit?: string  // 包装单位（显示用）
  packagingSpec?: string   // 包装规格说明（显示用）
  unitPrice: number
  amount: number
  priceComponents?: Record<string, number>
  discount?: number
  taxRate?: number  // 税率(%)
  unitPriceExclTax?: number  // 不含税单价
  taxAmount?: number  // 税金
  amountExclTax?: number  // 不含税金额
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customer?: {
    id: string
    name: string
  }
  contactId?: string
  contact?: {
    id: string
    name: string
    position?: string
  }
  opportunityId?: string
  opportunity?: {
    id: string
    name: string
  }
  quoteDate: string
  expiryDate?: string
  totalAmount: number
  totalAmountExclTax?: number  // 不含税总金额
  totalTaxAmount?: number  // 总税金
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  createdBy?: number
  creator?: {
    id: number
    username?: string
    nickname?: string
    user?: {
      id: number
      username: string
    }
  }
  items?: QuoteItem[]
  tenantId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQuoteItemDto {
  productId: number
  quantity: number
  packagingUnit?: string  // 包装单位（显示用）
  packagingSpec?: string   // 包装规格说明（显示用）
  unitPrice: number
  priceComponents?: Record<string, number>
  discount?: number
  taxRate?: number  // 税率(%)
  unitPriceExclTax?: number  // 不含税单价
  taxAmount?: number  // 税金
  amountExclTax?: number  // 不含税金额
  notes?: string
}

export interface CreateQuoteDto {
  quoteNumber?: string  // 可选，如果不提供则后端自动生成
  customerId: number
  contactId?: number
  opportunityId?: number
  quoteDate: string
  expiryDate?: string
  status?: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  items: CreateQuoteItemDto[]
}

export interface UpdateQuoteDto {
  quoteNumber?: string
  customerId?: number
  contactId?: number
  opportunityId?: number
  quoteDate?: string
  expiryDate?: string
  status?: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  items?: CreateQuoteItemDto[]
}

export interface QueryQuoteDto {
  search?: string
  customerId?: number
  opportunityId?: number
  status?: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
  page?: number
  limit?: number
}

export interface QuoteListResponse {
  quotes: Quote[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 报价管理API
export const quoteApi = {
  getList: (
    params?: QueryQuoteDto,
  ): Promise<{ code: number; message: string; data: QuoteListResponse }> => {
    return request.get('/quotes', { params })
  },

  getDetail: (id: string): Promise<{ code: number; message: string; data: Quote }> => {
    return request.get(`/quotes/${id}`)
  },

  create: (data: CreateQuoteDto): Promise<{ code: number; message: string; data: Quote }> => {
    return request.post('/quotes', data)
  },

  update: (
    id: string,
    data: UpdateQuoteDto,
  ): Promise<{ code: number; message: string; data: Quote }> => {
    return request.patch(`/quotes/${id}`, data)
  },

  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/quotes/${id}`)
  },
}

export default quoteApi

