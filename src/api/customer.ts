import request from '@/utils/request'

export interface Customer {
  id: string
  name: string
  code?: string
  type: 'individual' | 'company'
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  companyName?: string
  industry?: string
  size?: string
  description?: string
  tags?: string[]
  estimatedValue?: number
  source?: string
  level?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  contacts?: Contact[]
  province?: string
  city?: string
  district?: string
  addressDetail?: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  name: string
  position?: string
  department?: string
  email?: string
  phone?: string
  telephone?: string
  type?: 'primary' | 'secondary'
  isPrimary?: boolean
  notes?: string
  otherContacts?: Record<string, string>
  customerId: string
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerDto {
  name: string
  code?: string
  type: 'individual' | 'company'
  status?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  companyName?: string
  industry?: string
  size?: string
  description?: string
  tags?: string[]
  estimatedValue?: number
  source?: string
  level?: string
  province?: string
  city?: string
  district?: string
  addressDetail?: string
  ownerId?: number
}

export interface UpdateCustomerDto {
  name?: string
  code?: string
  type?: 'individual' | 'company'
  status?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  companyName?: string
  industry?: string
  size?: string
  description?: string
  tags?: string[]
  estimatedValue?: number
  source?: string
  level?: string
  province?: string
  city?: string
  district?: string
  addressDetail?: string
  ownerId?: number
}

export interface QueryCustomerDto {
  search?: string
  type?: 'individual' | 'company'
  status?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  source?: string
  industry?: string
  province?: string
  city?: string
  district?: string
  page?: number
  limit?: number
}

export interface CustomerListResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateContactDto {
  name: string
  position?: string
  department?: string
  email?: string
  phone?: string
  telephone?: string
  type?: 'primary' | 'secondary'
  isPrimary?: boolean
  notes?: string
  otherContacts?: Record<string, string>
}

export interface CustomerProfile {
  id: string
  customerId: string
  invoiceRequirement?: 'special_vat' | 'normal_invoice' | 'no_invoice'
  invoiceRemark?: string
  shippingMethods?: string[]
  mainCategoryIds?: number[]
  competitorBrands?: string[]
  creditLimit?: number
  creditTier?: 'tier_150k' | 'tier_100k' | 'tier_50k' | 'none'
  createdAt: string
  updatedAt: string
}

export interface CustomerCreditHistory {
  id: string
  customerId: string
  oldLimit?: number
  newLimit?: number
  oldTier?: string
  newTier?: string
  oldRating?: string
  newRating?: string
  changeReason?: string
  changedBy?: number
  changer?: {
    id: string
    username: string
  }
  createdAt: string
}

export interface CreateCustomerProfileDto {
  invoiceRequirement?: 'special_vat' | 'normal_invoice' | 'no_invoice'
  invoiceRemark?: string
  shippingMethods?: string[]
  mainCategoryIds?: number[]
  competitorBrands?: string[]
  creditLimit?: number
  creditTier?: 'tier_150k' | 'tier_100k' | 'tier_50k' | 'none'
}

export interface UpdateCreditInfoDto {
  creditLimit?: number
  creditTier?: 'tier_150k' | 'tier_100k' | 'tier_50k' | 'none'
  level?: string
  changeReason: string
}

// 客户管理API
export const customerApi = {
  getList: (
    params?: QueryCustomerDto,
  ): Promise<{ code: number; message: string; data: CustomerListResponse }> => {
    return request.get('/customers', { params })
  },

  getDetail: (id: string): Promise<{ code: number; message: string; data: Customer }> => {
    return request.get(`/customers/${id}`)
  },

  create: (data: CreateCustomerDto): Promise<{ code: number; message: string; data: Customer }> => {
    return request.post('/customers', data)
  },

  update: (
    id: string,
    data: UpdateCustomerDto,
  ): Promise<{ code: number; message: string; data: Customer }> => {
    return request.patch(`/customers/${id}`, data)
  },

  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/customers/${id}`)
  },

  deleteBatch: (ids: string[]): Promise<{ code: number; message: string }> => {
    return request.delete('/customers/batch', { data: { ids } })
  },

  getStats: (): Promise<{ code: number; message: string; data: any }> => {
    return request.get('/customers/stats')
  },

  // 联系人相关API
  createContact: (
    customerId: string,
    data: CreateContactDto,
  ): Promise<{ code: number; message: string; data: Contact }> => {
    return request.post(`/customers/${customerId}/contacts`, data)
  },

  updateContact: (
    contactId: string,
    data: Partial<CreateContactDto>,
  ): Promise<{ code: number; message: string; data: Contact }> => {
    return request.patch(`/customers/contacts/${contactId}`, data)
  },

  deleteContact: (contactId: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/customers/contacts/${contactId}`)
  },

  // 公海、私海管理API
  getPublicList: (
    params?: QueryCustomerDto,
  ): Promise<{ code: number; message: string; data: CustomerListResponse }> => {
    return request.get('/customers/public', { params })
  },

  claimCustomer: (id: string): Promise<{ code: number; message: string }> => {
    return request.post(`/customers/${id}/claim`)
  },

  releaseCustomer: (id: string): Promise<{ code: number; message: string }> => {
    return request.post(`/customers/${id}/release`)
  },

  // 更新客户状态
  updateStatus: (
    id: string,
    status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
  ): Promise<{ code: number; message: string; data: Customer }> => {
    return request.patch(`/customers/${id}/status`, { status })
  },

  // 合作与信用信息相关API
  getCustomerProfile: (
    customerId: string,
  ): Promise<{ code: number; message: string; data: CustomerProfile | null }> => {
    return request.get(`/customers/${customerId}/profile`)
  },

  updateCustomerProfile: (
    customerId: string,
    data: CreateCustomerProfileDto,
  ): Promise<{ code: number; message: string; data: CustomerProfile }> => {
    return request.patch(`/customers/${customerId}/profile`, data)
  },

  updateCreditInfo: (
    customerId: string,
    data: UpdateCreditInfoDto,
  ): Promise<{ code: number; message: string; data: { profile: CustomerProfile; customer: Customer; history: CustomerCreditHistory } }> => {
    return request.patch(`/customers/${customerId}/profile/credit`, data)
  },

  getCreditHistory: (
    customerId: string,
  ): Promise<{ code: number; message: string; data: CustomerCreditHistory[] }> => {
    return request.get(`/customers/${customerId}/profile/credit-history`)
  },
}

export default customerApi
