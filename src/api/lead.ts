import request from '@/utils/request'

export interface Lead {
  id: string
  tenantId: string
  ownerId: string
  owner?: {
    id: string
    username: string
  }
  name?: string
  company?: string
  title?: string
  phone?: string
  email?: string
  leadSource?: string
  industry?: string
  level?: string
  province?: string
  city?: string
  district?: string
  addressDetail?: string
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  rating: 'hot' | 'warm' | 'cold'
  lastContactedAt?: string
  convertedAt?: string
  unqualifiedReason?: string
  unqualifiedAt?: string
  lostStage?: string
  lostType?: string
}

export interface QueryLeadDto {
  search?: string
  status?: string | string[] // 支持单个状态或多个状态（多选）
  rating?: string
  source?: string
  ownerId?: string | null // 负责人ID，'null'字符串表示没有负责人（线索池）
  page?: number
  limit?: number
}

export interface LeadListResponse {
  leads: Lead[]
  total: number
  page: number
  limit: number
}

const leadApi = {
  getList: (params: QueryLeadDto) =>
    request.get<{ code: number; message: string; data: LeadListResponse }>('/leads', { params }),
  create: (data: Partial<Lead>) =>
    request.post<{ code: number; message: string; data: Lead }>('/leads', data),
  update: (id: string, data: Partial<Lead>) =>
    request.put<{ code: number; message: string; data: Lead }>(`/leads/${id}`, data),
  convert: (
    id: string,
    data: {
      convertToCustomer?: boolean
      convertToOpportunity?: boolean
      opportunityName?: string
      amount?: number
      stage?: string
      status?: string
      probability?: number
      expectedCloseDate?: string
      assignToMemberId?: string
      planNextActivity?: boolean
      activityTitle?: string
      activityType?: string
      activityStartTime?: string
      activityEndTime?: string
      activityDescription?: string
      activityLocation?: string
      planNextVisit?: boolean
      visitDescription?: string
      visitType?: string
      visitStartTime?: string
      visitEndTime?: string
      visitPurpose?: string
      visitRegion?: string[]
      visitAddress?: string
    },
  ) => request.post<{ code: number; message: string; data: any }>(`/leads/${id}/convert`, data),
  transfer: (leadIds: string[] | number[], newOwnerId: string | number) =>
    request.post<{ code: number; message: string; data: { affected: number; leadIds: number[] } }>('/leads/transfer', {
      leadIds,
      newOwnerId,
    }),
  moveToPool: (leadIds: string[] | number[]) =>
    request.post<{ code: number; message: string; data: { affected: number; leadIds: number[] } }>('/leads/move-to-pool', {
      leadIds,
    }),
  claim: (leadIds: string[] | number[]) =>
    request.post<{ code: number; message: string; data: { affected: number; leadIds: number[] } }>('/leads/claim', {
      leadIds,
    }),
  delete: (id: string) =>
    request.delete<{ code: number; message: string; data: { affected: number; leadIds: number[] } }>(`/leads/${id}`),
  deleteBatch: (leadIds: string[] | number[]) =>
    request.delete<{ code: number; message: string; data: { affected: number; leadIds: number[] } }>('/leads/batch', {
      data: { leadIds },
    }),
  sources: () =>
    request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(
      `/leads/sources`,
    ),
  getStatistics: () =>
    request.get<{
      code: number
      message: string
      data: {
        overview: {
          totalLeads: number
          todayNewLeads: number
          pendingLeads: number
          qualifiedLeads: number
          convertedLeads: number
          conversionRate: number
        }
        statusDistribution: Array<{ status: string; count: number; label: string }>
        sourceDistribution: Array<{
          source: string
          count: number
          convertedCount: number
          conversionRate: number
        }>
        ratingDistribution: Array<{ rating: string; count: number; label: string }>
        ownerDistribution: Array<{
          ownerId: number
          ownerName: string
          count: number
          convertedCount: number
          conversionRate: number
        }>
        industryDistribution: Array<{
          industry: string
          count: number
          convertedCount: number
          conversionRate: number
        }>
        regionDistribution: Array<{
          province: string
          count: number
          convertedCount: number
          conversionRate: number
        }>
        cityDistribution: Array<{
          province: string
          city: string
          count: number
          convertedCount: number
          conversionRate: number
        }>
        churnAnalysis: {
          reasonDistribution: Array<{
            reason: string
            count: number
          }>
          stageDistribution: Array<{
            stage: string
            stageLabel: string
            count: number
          }>
          typeDistribution: Array<{
            type: string
            count: number
          }>
          trend: Array<{
            date: string
            count: number
          }>
        }
      }
    }>('/leads/statistics'),
}

export default leadApi
