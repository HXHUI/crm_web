import request from '@/utils/request'

export type RelatedType = 'customer' | 'opportunity' | 'contract' | 'order'

export interface CompetitorAlternative {
  id: string
  tenantId: number
  competitorId: number
  relatedType?: RelatedType
  relatedId?: number
  productId?: number | null
  productName: string
  spec?: string | null
  unit?: string | null
  unitPrice?: number | null
  annualPotentialAmount?: number | null
  advantages?: string | null
  disadvantages?: string | null
  strategy?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface QueryCompetitorAlternativeDto {
  competitorId: number | string
  relatedType?: RelatedType
  relatedId?: number | string
}

export interface CreateCompetitorAlternativeDto {
  competitorId: number | string
  relatedType?: RelatedType
  relatedId?: number | string
  productId?: number | string | null
  productName: string
  spec?: string | null
  unit?: string | null
  unitPrice?: number | null
  annualPotentialAmount?: number | null
  advantages?: string | null
  disadvantages?: string | null
  strategy?: string | null
  notes?: string | null
}

export interface UpdateCompetitorAlternativeDto extends Partial<CreateCompetitorAlternativeDto> {}

export const competitorAlternativeApi = {
  list: (
    params: QueryCompetitorAlternativeDto,
  ): Promise<{ code: number; message: string; data: CompetitorAlternative[] }> => {
    return request.get('/competitor-alternatives', { params })
  },

  create: (
    data: CreateCompetitorAlternativeDto,
  ): Promise<{ code: number; message: string; data: CompetitorAlternative }> => {
    return request.post('/competitor-alternatives', data)
  },

  update: (
    id: string | number,
    data: UpdateCompetitorAlternativeDto,
  ): Promise<{ code: number; message: string; data: CompetitorAlternative }> => {
    return request.patch(`/competitor-alternatives/${id}`, data)
  },

  remove: (id: string | number): Promise<{ code: number; message: string }> => {
    return request.delete(`/competitor-alternatives/${id}`)
  },
}


