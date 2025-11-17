import request from '@/utils/request'

export interface ContractItem {
  id: string
  contractId: string
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

export interface Contract {
  id: string
  contractNumber: string
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
  quoteId?: string
  quote?: {
    id: string
    quoteNumber: string
  }
  opportunityId?: string
  opportunity?: {
    id: string
    name: string
  }
  type: 'sales' | 'service' | 'maintenance' | 'other'
  status: 'draft' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
  totalAmount: number
  signDate?: string
  effectiveDate?: string
  expiryDate?: string
  content?: string
  attachments?: string[]
  templateId?: string
  notes?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  items?: ContractItem[]
  tenantId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateContractItemDto {
  productId: number
  quantity: number
  unitPrice: number
  discount?: number
  notes?: string
}

export interface CreateContractDto {
  contractNumber: string
  customerId: number
  contactId?: number
  quoteId?: number
  opportunityId?: number
  type?: 'sales' | 'service' | 'maintenance' | 'other'
  status?: 'draft' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
  signDate?: string
  effectiveDate?: string
  expiryDate?: string
  content?: string
  attachments?: string[]
  templateId?: number
  notes?: string
  items: CreateContractItemDto[]
}

export interface UpdateContractDto {
  contractNumber?: string
  customerId?: number
  contactId?: number
  quoteId?: number
  opportunityId?: number
  type?: 'sales' | 'service' | 'maintenance' | 'other'
  status?: 'draft' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
  signDate?: string
  effectiveDate?: string
  expiryDate?: string
  content?: string
  attachments?: string[]
  templateId?: number
  notes?: string
  items?: CreateContractItemDto[]
}

export interface QueryContractDto {
  search?: string
  customerId?: number
  quoteId?: number
  opportunityId?: number
  type?: 'sales' | 'service' | 'maintenance' | 'other'
  status?: 'draft' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
  page?: number
  limit?: number
}

export interface ContractListResponse {
  contracts: Contract[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const contractApi = {
  // 获取合同列表
  getList: (
    params?: QueryContractDto,
  ): Promise<{ code: number; message: string; data: ContractListResponse }> => {
    return request.get('/contracts', { params })
  },

  // 获取合同详情
  getDetail: (id: string): Promise<{ code: number; message: string; data: Contract }> => {
    return request.get(`/contracts/${id}`)
  },

  // 创建合同
  create: (
    data: CreateContractDto,
  ): Promise<{ code: number; message: string; data: Contract }> => {
    return request.post('/contracts', data)
  },

  // 更新合同
  update: (
    id: string,
    data: UpdateContractDto,
  ): Promise<{ code: number; message: string; data: Contract }> => {
    return request.patch(`/contracts/${id}`, data)
  },

  // 删除合同
  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/contracts/${id}`)
  },

  // 从报价单创建合同
  createFromQuote: (
    quoteId: string,
  ): Promise<{ code: number; message: string; data: Contract }> => {
    return request.post(`/contracts/from-quote/${quoteId}`)
  },
}

export default contractApi

