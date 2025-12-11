import request from '@/utils/request'

export interface SalesBriefData {
  newCustomers: {
    current: number
    previous: number
    changePercent: number
  }
  newContacts: {
    current: number
    previous: number
    changePercent: number
  }
  newOpportunities: {
    current: number
    previous: number
    changePercent: number
  }
  newActivities: {
    current: number
    previous: number
    changePercent: number
  }
  opportunityAmount: {
    current: number
    previous: number
    changePercent: number
  }
  contractAmount: {
    current: number
    previous: number
    changePercent: number
  }
  orderAmount: {
    current: number
    previous: number
    changePercent: number
  }
}

export interface SalesBriefTrendData {
  [key: string]: {
    months: string[]
    values: number[]
  }
}

export interface DataSummaryData {
  customerSummary: {
    newCustomers: number
    convertedCustomers: number
    publicPoolCustomers: number
    claimedFromPublicPool: number
    totalCustomers: number
    unconvertedCustomers: number
    convertedCustomersTotal: number
  }
  opportunitySummary: {
    newOpportunities: number
    wonOpportunities: number
    lostOpportunities: number
    totalAmount: number
  }
  contractSummary: {
    signedContracts: number
    expiringSoon: number
    expired: number
    totalAmount: number
  }
}

export interface CustomerReminderData {
  over7Days: number
  over15Days: number
  over30Days: number
  over3Months: number
  over6Months: number
  overdue: number
}

export interface SalesFunnelData {
  leads: {
    count: number
    amount: number
  }
  qualified: {
    count: number
    amount: number
  }
  proposal: {
    count: number
    amount: number
  }
  negotiation: {
    count: number
    amount: number
  }
  closed: {
    count: number
    amount: number
  }
}

export interface CustomerSourceDistributionData {
  source: string
  count: number
  percentage: number
}

export interface CustomerMapData {
  province: string
  count: number
}

export interface CustomerCityMapData {
  province: string
  city: string
  count: number
}

export interface RankingItem {
  memberId: string
  memberName: string
  position?: string
  value: number
  rank?: number
  isCurrentUser?: boolean
}

export interface RankingListData {
  ranking: RankingItem[]
  currentUser: RankingItem | null
}

export const statisticsApi = {
  // 获取销售简报数据
  getSalesBriefs: (
    period: 'week' | 'month' | 'quarter' | 'year' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom' = 'month',
    viewType?: 'tenant' | 'group',
    startDate?: string,
    endDate?: string,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { period, viewType }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<SalesBriefData>('/statistics/sales-briefs', { params })
  },
  // 获取销售简报趋势数据（近6个月）
  getSalesBriefsTrend: (viewType?: 'tenant' | 'group') => {
    return request.get<SalesBriefTrendData>('/statistics/sales-briefs/trend', {
      params: { viewType },
    })
  },
  // 获取数据汇总
  getDataSummary: (
    period: 'week' | 'month' | 'quarter' | 'year' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom' = 'month',
    viewType?: 'tenant' | 'group',
    startDate?: string,
    endDate?: string,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { period, viewType }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<DataSummaryData>('/statistics/data-summary', { params })
  },
  // 获取客户遗忘提醒
  getCustomerReminders: (
    scope: 'me' | 'all' = 'me',
    viewType?: 'tenant' | 'group',
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { scope, viewType }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<CustomerReminderData>('/statistics/customer-reminders', { params })
  },
  // 获取销售漏斗
  getSalesFunnel: (
    scope: 'me' | 'all' = 'me',
    viewType?: 'tenant' | 'group',
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { scope, viewType }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<SalesFunnelData>('/statistics/sales-funnel', { params })
  },
  // 获取客户来源分布
  getCustomerSourceDistribution: (
    scope: 'me' | 'all' = 'me',
    viewType?: 'tenant' | 'group',
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { scope, viewType }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<CustomerSourceDistributionData[]>(
      '/statistics/customer-source-distribution',
      { params },
    )
  },
  // 获取客户地图数据
  getCustomerMapData: (
    scope: 'me' | 'all' = 'me',
    onlyConverted: boolean = false,
    viewType?: 'tenant' | 'group',
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { scope, onlyConverted: onlyConverted ? 'true' : 'false', viewType }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<CustomerMapData[]>('/statistics/customer-map', { params })
  },
  // 获取客户城市地图数据
  getCustomerCityMapData: (
    onlyConverted: boolean = false,
    viewType?: 'tenant' | 'group',
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { onlyConverted: onlyConverted ? 'true' : 'false', viewType }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<CustomerCityMapData[]>('/statistics/customer-city-map', { params })
  },
  // 获取排行榜数据
  getRankingList: (
    scope: 'me' | 'all' = 'me',
    period: 'week' | 'month' | 'quarter' | 'year' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom' = 'month',
    metric:
      | 'newCustomers'
      | 'newContacts'
      | 'newActivities'
      | 'paymentAmount'
      | 'contractAmount'
      | 'contractCount' = 'newCustomers',
    viewType?: 'tenant' | 'group',
    startDate?: string,
    endDate?: string,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { scope, period, metric, viewType }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<RankingListData>('/statistics/ranking-list', { params })
  },
  // 获取月度合同金额
  getMonthlyContractAmount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-contract-amount', { params })
  },
  // 获取月度订单金额
  getMonthlyOrderAmount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-order-amount', { params })
  },
  // 获取合同金额排行榜
  getContractAmountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalAmount: number }>>(
      '/statistics/contract-amount-ranking',
      { params }
    )
  },
  // 获取订单金额排行榜
  getOrderAmountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalAmount: number }>>(
      '/statistics/order-amount-ranking',
      { params }
    )
  },
  // 获取月度新增线索数
  getMonthlyLeadCount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-lead-count', { params })
  },
  // 获取月度新增客户数
  getMonthlyCustomerCount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-customer-count', { params })
  },
  // 获取月度新增商机数
  getMonthlyOpportunityCount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-opportunity-count', { params })
  },
  // 获取月度赢单商机数
  getMonthlyWonOpportunityCount: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<number[]>('/statistics/monthly-won-opportunity-count', { params })
  },
  // 获取新增线索数排行榜
  getLeadCountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalCount: number }>>(
      '/statistics/lead-count-ranking',
      { params }
    )
  },
  // 获取新增客户数排行榜
  getCustomerCountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalCount: number }>>(
      '/statistics/customer-count-ranking',
      { params }
    )
  },
  // 获取新增商机数排行榜
  getOpportunityCountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalCount: number }>>(
      '/statistics/opportunity-count-ranking',
      { params }
    )
  },
  // 获取赢单商机数排行榜
  getWonOpportunityCountRanking: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<Array<{ ownerType: string; ownerId: number; ownerName: string; totalCount: number }>>(
      '/statistics/won-opportunity-count-ranking',
      { params }
    )
  },
  // 获取月度合同金额（含同比）
  getMonthlyContractAmountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-contract-amount-with-yoy',
      { params }
    )
  },
  // 获取月度订单金额（含同比）
  getMonthlyOrderAmountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-order-amount-with-yoy',
      { params }
    )
  },
  // 获取月度新增线索数（含同比）
  getMonthlyLeadCountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-lead-count-with-yoy',
      { params }
    )
  },
  // 获取月度新增客户数（含同比）
  getMonthlyCustomerCountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-customer-count-with-yoy',
      { params }
    )
  },
  // 获取月度新增商机数（含同比）
  getMonthlyOpportunityCountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-opportunity-count-with-yoy',
      { params }
    )
  },
  // 获取月度赢单商机数（含同比）
  getMonthlyWonOpportunityCountWithYOY: (
    year: number,
    scopeType?: 'me_and_subordinates' | 'all' | 'department' | 'member',
    departmentId?: number,
    memberId?: number,
  ) => {
    const params: any = { year }
    if (scopeType) params.scopeType = scopeType
    if (departmentId) params.departmentId = departmentId
    if (memberId) params.memberId = memberId
    return request.get<{ current: number[]; yearOverYear: number[] }>(
      '/statistics/monthly-won-opportunity-count-with-yoy',
      { params }
    )
  },
}

// 确保导出正确
export default statisticsApi
