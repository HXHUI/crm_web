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
}

export interface DataSummaryData {
  customerSummary: {
    newCustomers: number
    convertedCustomers: number
    publicPoolCustomers: number
    claimedFromPublicPool: number
  }
  opportunitySummary: {
    newOpportunities: number
    wonOpportunities: number
    lostOpportunities: number
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
  getSalesBriefs: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    return request.get<SalesBriefData>('/statistics/sales-briefs', {
      params: { period },
    })
  },
  // 获取数据汇总
  getDataSummary: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    return request.get<DataSummaryData>('/statistics/data-summary', {
      params: { period },
    })
  },
  // 获取客户遗忘提醒
  getCustomerReminders: (scope: 'me' | 'all' = 'me') => {
    return request.get<CustomerReminderData>('/statistics/customer-reminders', {
      params: { scope },
    })
  },
  // 获取销售漏斗
  getSalesFunnel: (scope: 'me' | 'all' = 'me') => {
    return request.get<SalesFunnelData>('/statistics/sales-funnel', {
      params: { scope },
    })
  },
  // 获取客户来源分布
  getCustomerSourceDistribution: (scope: 'me' | 'all' = 'me') => {
    return request.get<CustomerSourceDistributionData[]>(
      '/statistics/customer-source-distribution',
      {
        params: { scope },
      },
    )
  },
  // 获取客户地图数据
  getCustomerMapData: (scope: 'me' | 'all' = 'me') => {
    return request.get<CustomerMapData[]>('/statistics/customer-map', {
      params: { scope },
    })
  },
  // 获取排行榜数据
  getRankingList: (
    scope: 'me' | 'all' = 'me',
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    metric:
      | 'newCustomers'
      | 'newContacts'
      | 'newActivities'
      | 'paymentAmount'
      | 'contractAmount'
      | 'contractCount' = 'newCustomers',
  ) => {
    return request.get<RankingListData>('/statistics/ranking-list', {
      params: { scope, period, metric },
    })
  },
}
