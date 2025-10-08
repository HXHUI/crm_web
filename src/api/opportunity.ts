import request from '@/utils/request'

export interface Opportunity {
  id: string
  title: string
  description?: string
  value: number
  currency: string
  stage:
    | 'initial_contact'
    | 'needs_analysis'
    | 'proposal_quote'
    | 'negotiation_review'
    | 'closed_won'
    | 'closed_lost'
  status: 'active' | 'waiting_client' | 'on_hold' | 'at_risk' | 'closed'
  probability: number
  expectedCloseDate: string
  customerId: string
  ownerId: string
  tenantId: string
  customer?: {
    id: string
    name: string
  }
  owner?: {
    id: string
    username: string
  }
  tenant?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateOpportunityDto {
  title: string
  description?: string
  value: number
  currency?: string
  stage?:
    | 'initial_contact'
    | 'needs_analysis'
    | 'proposal_quote'
    | 'negotiation_review'
    | 'closed_won'
    | 'closed_lost'
  status?: 'active' | 'waiting_client' | 'on_hold' | 'at_risk' | 'closed'
  probability?: number
  expectedCloseDate: string
  customerId: string
}

export interface UpdateOpportunityDto {
  title?: string
  description?: string
  value?: number
  currency?: string
  stage?:
    | 'initial_contact'
    | 'needs_analysis'
    | 'proposal_quote'
    | 'negotiation_review'
    | 'closed_won'
    | 'closed_lost'
  status?: 'active' | 'waiting_client' | 'on_hold' | 'at_risk' | 'closed'
  probability?: number
  expectedCloseDate?: string
  customerId?: string
}

export interface QueryOpportunityDto {
  search?: string
  stage?: string
  status?: string
  customerId?: string
  page?: number
  limit?: number
}

export interface OpportunityListResponse {
  opportunities: Opportunity[]
  total: number
  page: number
  limit: number
}

export const opportunityApi = {
  // 获取商机列表
  getList: (params: QueryOpportunityDto) =>
    request.get<{ code: number; message: string; data: OpportunityListResponse }>(
      '/opportunities',
      { params },
    ),

  // 获取商机详情
  getDetail: (id: string) =>
    request.get<{ code: number; message: string; data: Opportunity }>(`/opportunities/${id}`),

  // 创建商机
  create: (data: CreateOpportunityDto) =>
    request.post<{ code: number; message: string; data: Opportunity }>('/opportunities', data),

  // 更新商机
  update: (id: string, data: UpdateOpportunityDto) =>
    request.patch<{ code: number; message: string; data: Opportunity }>(
      `/opportunities/${id}`,
      data,
    ),

  // 删除商机
  delete: (id: string) => request.delete<{ code: number; message: string }>(`/opportunities/${id}`),

  // 批量删除商机
  deleteBatch: (ids: string[]) =>
    request.delete<{ code: number; message: string }>('/opportunities/batch', { data: { ids } }),

  // 更新商机阶段
  updateStage: (id: string, stage: string) =>
    request.patch<{ code: number; message: string; data: Opportunity }>(
      `/opportunities/${id}/stage`,
      { stage },
    ),

  // 更新商机状态
  updateStatus: (
    id: string,
    status: 'active' | 'waiting_client' | 'on_hold' | 'at_risk' | 'closed',
  ) =>
    request.patch<{ code: number; message: string; data: Opportunity }>(
      `/opportunities/${id}/status`,
      { status },
    ),

  // 关闭商机
  close: (id: string, status: 'closed_won' | 'closed_lost') =>
    request.patch<{ code: number; message: string; data: Opportunity }>(
      `/opportunities/${id}/close`,
      { status },
    ),

  // 获取商机统计
  getStats: () => request.get<{ code: number; message: string; data: any }>('/opportunities/stats'),
}

export default opportunityApi
