import request from '@/utils/request'

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string
  product?: {
    id: string
    name: string
    code?: string
  }
  quantity: number
  unitPrice: number
  amount: number
  discount?: number
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
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  items?: QuoteItem[]
  tenantId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQuoteItemDto {
  productId: number
  quantity: number
  unitPrice: number
  discount?: number
  notes?: string
}

export interface CreateQuoteDto {
  quoteNumber: string
  customerId: number
  contactId?: number
  opportunityId?: number
  quoteDate: string
  expiryDate?: string
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
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
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  items?: CreateQuoteItemDto[]
}

export interface QueryQuoteDto {
  search?: string
  customerId?: number
  opportunityId?: number
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
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

