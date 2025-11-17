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
}

export interface QueryLeadDto {
  search?: string
  status?: string
  rating?: string
  source?: string
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
  convert: (
    id: string,
    data: { amount?: number; expectedCloseDate?: string; assignToMemberId?: string },
  ) => request.post<{ code: number; message: string; data: any }>(`/leads/${id}/convert`, data),
  sources: () =>
    request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(
      `/leads/sources`,
    ),
}

export default leadApi
