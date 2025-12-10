import request from '@/utils/request'

export interface ContractItem {
  id: string
  contractId: string
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
  priceComponents?: Record<string, number>
  amount: number
  discount?: number
  taxRate?: number  // 税率(%)
  unitPriceExclTax?: number  // 不含税单价
  taxAmount?: number  // 税金
  amountExclTax?: number  // 不含税金额
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
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
  totalAmount: number
  totalAmountExclTax?: number  // 不含税总金额
  totalTaxAmount?: number  // 总税金
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
  createdBy?: string
  creator?: {
    id: string
    username?: string
    nickname?: string
    user?: {
      id: string
      username: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateContractItemDto {
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

export interface CreateContractDto {
  contractNumber?: string  // 可选，如果不提供则后端自动生成
  customerId: number
  contactId?: number
  quoteId?: number
  opportunityId?: number
  type?: 'sales' | 'service' | 'maintenance' | 'other'
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
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
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
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
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending_sign' | 'signed' | 'active' | 'expired' | 'terminated'
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

  // 获取即将到期的合同
  getExpiring: (
    days?: number,
  ): Promise<{ code: number; message: string; data: Array<Contract & { daysRemaining: number }> }> => {
    return request.get('/contracts/expiring', { params: days ? { days } : {} })
  },
}

export default contractApi

