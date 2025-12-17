import request from '@/utils/request'

export enum RequirementType {
  EXPLICIT = 'explicit',    // 显性需求
  IMPLICIT = 'implicit',    // 隐性需求
  INTANGIBLE = 'intangible', // 无形需求
}

export enum RequirementRelatedType {
  CUSTOMER = 'customer',
  OPPORTUNITY = 'opportunity',
}

export interface CustomerRequirement {
  id: number
  relatedType: RequirementRelatedType
  relatedId: number
  customerId?: number // 兼容字段
  customer?: {
    id: number
    name: string
  }
  type: RequirementType
  content: string
  problemToSolve?: string
  tags?: string[]
  priority: number
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  resolvedAt?: string
  resolvedBy?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRequirementDto {
  // 支持多态关联
  relatedType?: RequirementRelatedType
  relatedId?: number
  customerId?: number // 兼容字段，如果提供则自动转换为 relatedType='customer', relatedId=customerId
  type: RequirementType
  content: string
  problemToSolve?: string
  tags?: string[]
  priority?: number
  status?: string
  notes?: string
}

export interface UpdateRequirementDto {
  type?: RequirementType
  content?: string
  problemToSolve?: string
  tags?: string[]
  priority?: number
  status?: string
  notes?: string
}

export interface QueryRequirementDto {
  // 支持多态查询
  relatedType?: RequirementRelatedType
  relatedId?: number
  customerId?: number // 兼容字段
  type?: RequirementType
  status?: string
  priority?: number
  search?: string
  page?: number
  limit?: number
}

export interface RequirementListResponse {
  requirements: CustomerRequirement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 需求管理API
export const customerRequirementApi = {
  getList: (
    params?: QueryRequirementDto,
  ): Promise<{ code: number; message: string; data: RequirementListResponse }> => {
    return request.get('/customer-requirements', { params })
  },

  getDetail: (id: number): Promise<{ code: number; message: string; data: CustomerRequirement }> => {
    return request.get(`/customer-requirements/${id}`)
  },

  create: (data: CreateRequirementDto): Promise<{ code: number; message: string; data: CustomerRequirement }> => {
    return request.post('/customer-requirements', data)
  },

  update: (
    id: number,
    data: UpdateRequirementDto,
  ): Promise<{ code: number; message: string; data: CustomerRequirement }> => {
    return request.patch(`/customer-requirements/${id}`, data)
  },

  delete: (id: number): Promise<{ code: number; message: string }> => {
    return request.delete(`/customer-requirements/${id}`)
  },

  getByCustomer: (customerId: number): Promise<{ code: number; message: string; data: CustomerRequirement[] }> => {
    return request.get(`/customer-requirements/customer/${customerId}`)
  },

  getByOpportunity: (opportunityId: number): Promise<{ code: number; message: string; data: CustomerRequirement[] }> => {
    return request.get(`/customer-requirements/opportunity/${opportunityId}`)
  },
}

export default customerRequirementApi

