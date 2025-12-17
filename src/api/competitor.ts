import request from '@/utils/request'

export type RelatedType = 'customer' | 'opportunity' | 'contract' | 'order'

export interface Competitor {
  id: string
  tenantId?: string
  relatedType: RelatedType
  relatedId: number
  // 由后端根据 relatedType/relatedId 解析出的关联对象信息（只在列表中使用，非必填）
  relatedObjectLabel?: string | null
  relatedObjectName?: string | null
  manufacturer: string
  productName?: string | null
  annualUsageAmount?: number | null // 单位：万元
  unit?: string | null
  unitPrice?: number | null // 单位：万元
  policy?: string | null
  advantages?: string | null
  problems?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateCompetitorDto {
  relatedType: RelatedType
  relatedId: number
  manufacturer: string
  productName?: string | null
  annualUsageAmount?: number | null
  unit?: string | null
  unitPrice?: number | null
  policy?: string | null
  advantages?: string | null
  problems?: string | null
}

export type UpdateCompetitorDto = Partial<CreateCompetitorDto>

export interface CompetitorListQuery {
  relatedType?: RelatedType
  relatedId?: number | string
}

const competitorApi = {
  list: (params: CompetitorListQuery) =>
    request.get<{ code: number; message: string; data: Competitor[] }>('/customer-competitors', {
      params,
    }),
  create: (data: CreateCompetitorDto) =>
    request.post<{ code: number; message: string; data: Competitor }>('/customer-competitors', data),
  update: (id: string | number, data: UpdateCompetitorDto) =>
    request.put<{ code: number; message: string; data: Competitor }>(`/customer-competitors/${id}`, data),
  remove: (id: string | number) =>
    request.delete<{ code: number; message: string; data: { affected: number } }>(`/customer-competitors/${id}`),
  detail: (id: string | number) =>
    request.get<{ code: number; message: string; data: Competitor }>(`/customer-competitors/${id}`),
}

export default competitorApi

