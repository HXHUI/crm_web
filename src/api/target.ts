import request from '@/utils/request'

export interface TargetTrendData {
  months: string[]
  targets: number[]
}

export interface TargetRankingItem {
  ownerType: string
  ownerId: number
  ownerName: string
  totalTarget: number
}

const targetApi = {
  list(params: any) {
    return request.get('/targets', { params })
  },
  saveYearTargets(data: any) {
    return request.post('/targets/save-year', data)
  },
  ownerOptions(params: any) {
    return request.get('/targets/owner-options', { params })
  },
  getTargetTrend(
    targetType: 'contract_amount' | 'sales_amount' | 'new_leads' | 'new_customers' | 'new_opportunities' | 'won_opportunities',
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) {
    const params: any = { targetType, year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<TargetTrendData>('/targets/trend', { params })
  },
  getTargetRanking(
    targetType: 'contract_amount' | 'sales_amount' | 'new_leads' | 'new_customers' | 'new_opportunities' | 'won_opportunities',
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) {
    const params: any = { targetType, year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<TargetRankingItem[]>('/targets/ranking', { params })
  },
  delete(data: { ownerType: string; ownerId: number; targetType: string; year: number }) {
    return request.delete('/targets', { data })
  },
}

export default targetApi
