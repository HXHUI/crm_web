import request from '@/utils/request'

export enum SolutionResult {
  WON = 'won',
  LOST = 'lost',
  ON_HOLD = 'on_hold',
}

export enum SolutionSourceType {
  CUSTOMER = 'customer',
  OPPORTUNITY = 'opportunity',
}

export enum WinReason {
  PRICE = 'price',
  TECHNOLOGY = 'technology',
  DELIVERY = 'delivery',
  RELATIONSHIP = 'relationship',
  SERVICE = 'service',
  OTHER = 'other',
}

export enum LoseReason {
  PRICE = 'price',
  TECHNOLOGY = 'technology',
  DELIVERY = 'delivery',
  RELATIONSHIP = 'relationship',
  BUDGET_CHANGE = 'budget_change',
  COMPETITOR = 'competitor',
  OTHER = 'other',
}

export interface ProductListItem {
  productId: number
  productName?: string
  spec?: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface CompetitorInfo {
  id: number
  manufacturer: string
  productName?: string
  annualUsageAmount?: number
  unit?: string
  unitPrice?: number
  policy?: string
  advantages?: string
  problems?: string
}

export interface AlternativeInfo {
  id: number
  competitorId: number
  productName: string
  spec?: string
  unit?: string
  unitPrice?: number
  annualPotentialAmount?: number
  advantages?: string
  disadvantages?: string
  strategy?: string
  notes?: string
}

export interface SolutionLibrary {
  id: number
  tenantId: number
  sourceType: SolutionSourceType
  sourceId: number
  title: string
  industry?: string
  customerType?: string
  applicationScenario?: string
  requirementTags?: string[]
  competitorIds?: number[]
  competitors?: CompetitorInfo[]
  alternativeIds?: number[]
  alternatives?: AlternativeInfo[]
  productList?: ProductListItem[]
  pricingStrategy?: string
  serviceStrategy?: string
  technicalSolution?: string
  result: SolutionResult
  winReasons?: WinReason[]
  loseReasons?: LoseReason[]
  keyFeedback?: string
  lessonsLearned?: string
  usageCount: number
  successRate: number
  lastUsedAt?: string
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export interface CreateSolutionDto {
  title: string
  industry?: string
  customerType?: string
  applicationScenario?: string
  pricingStrategy?: string
  serviceStrategy?: string
  technicalSolution?: string
  result: SolutionResult
  winReasons?: WinReason[]
  loseReasons?: LoseReason[]
  keyFeedback?: string
  lessonsLearned?: string
}

export interface ExtractedData {
  customer?: {
    id: number
    name: string
    industry?: string
    type?: string
  }
  opportunity?: {
    id: number
    name: string
  }
  requirementTags: string[]
  competitorIds: number[]
  alternativeIds: number[]
  productList: ProductListItem[]
}

// 方案库管理API
export const solutionLibraryApi = {
  // 从客户创建方案
  createFromCustomer: (
    customerId: number,
    data: CreateSolutionDto,
  ): Promise<{ code: number; message: string; data: SolutionLibrary }> => {
    return request.post(`/solution-library/from-customer/${customerId}`, data)
  },

  // 从商机创建方案
  createFromOpportunity: (
    opportunityId: number,
    data: CreateSolutionDto,
  ): Promise<{ code: number; message: string; data: SolutionLibrary }> => {
    return request.post(`/solution-library/from-opportunity/${opportunityId}`, data)
  },

  // 提取客户数据
  extractCustomerData: (
    customerId: number,
  ): Promise<{ code: number; message: string; data: ExtractedData }> => {
    return request.get(`/solution-library/extract/customer/${customerId}`)
  },

  // 提取商机数据
  extractOpportunityData: (
    opportunityId: number,
  ): Promise<{ code: number; message: string; data: ExtractedData }> => {
    return request.get(`/solution-library/extract/opportunity/${opportunityId}`)
  },

  // 获取方案详情
  getDetail: (id: number): Promise<{ code: number; message: string; data: SolutionLibrary }> => {
    return request.get(`/solution-library/${id}`)
  },

  // 更新方案
  update: (
    id: number,
    data: Partial<CreateSolutionDto>,
  ): Promise<{ code: number; message: string; data: SolutionLibrary }> => {
    return request.patch(`/solution-library/${id}`, data)
  },

  // 查询方案列表
  getList: (params?: {
    search?: string
    industry?: string
    result?: SolutionResult
    sourceType?: SolutionSourceType
    page?: number
    limit?: number
  }): Promise<{ code: number; message: string; data: { list: SolutionLibrary[]; total: number } }> => {
    return request.get('/solution-library', { params })
  },

  // 删除方案
  delete: (id: number): Promise<{ code: number; message: string }> => {
    return request.post(`/solution-library/${id}/delete`)
  },
}

export default solutionLibraryApi

