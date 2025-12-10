import request from '@/utils/request'

// 拜访接口类型定义
export interface Visit {
  id: number
  description?: string
  type: 'first_visit' | 'follow_up' | 'maintenance' | 'business_negotiation' | 'technical_support' | 'training' | 'other'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  plannedStartTime: string
  plannedEndTime: string
  actualStartTime?: string
  actualEndTime?: string
  checkInTime?: string
  region?: string[]
  detailAddress?: string
  purpose?: 'understand_needs' | 'monthly_performance' | 'performance_increment' | 'product_promotion' | 'holiday_visit' | 'contract_signing' | 'sign_statement' | 'price_policy' | 'after_sales_service' | 'negotiate_cooperation' | 'understand_business' | 'sample_tracking'
  result?: string
  feedback?: string
  nextAction?: string
  customerId?: number
  contactId?: number
  opportunityId?: number
  activityId?: number
  expenses?: {
    travel?: number
    entertainment?: number
    other?: number
    total?: number
    currency?: string
    [key: string]: any
  }
  attachments?: string[]
  checkInPhoto?: string
  checkInRemark?: string
  participants?: number[]
  ownerId: number
  assignedBy?: number
  customer?: {
    id: number
    name: string
  }
  contact?: {
    id: number
    name: string
  }
  opportunity?: {
    id: number
    name: string
  }
  owner?: {
    id: number
    user?: {
    id: number
    username: string
    }
  }
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateVisitDto {
  description?: string
  type?: 'first_visit' | 'follow_up' | 'maintenance' | 'business_negotiation' | 'technical_support' | 'training' | 'other'
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  plannedStartTime: string
  plannedEndTime: string
  region?: string[]
  detailAddress?: string
  purpose?: 'understand_needs' | 'monthly_performance' | 'performance_increment' | 'product_promotion' | 'holiday_visit' | 'contract_signing' | 'sign_statement' | 'price_policy' | 'after_sales_service' | 'negotiate_cooperation' | 'understand_business' | 'sample_tracking'
  customerId?: number
  contactId?: number
  opportunityId?: number
  activityId?: number
  expenses?: {
    travel?: number
    entertainment?: number
    other?: number
    total?: number
    currency?: string
    [key: string]: any
  }
  attachments?: string[]
  participants?: number[]
  ownerId?: number
  assignedBy?: number
}

export interface UpdateVisitDto {
  description?: string
  type?: 'first_visit' | 'follow_up' | 'maintenance' | 'business_negotiation' | 'technical_support' | 'training' | 'other'
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  plannedStartTime?: string
  plannedEndTime?: string
  actualStartTime?: string
  actualEndTime?: string
  region?: string[]
  detailAddress?: string
  purpose?: 'understand_needs' | 'monthly_performance' | 'performance_increment' | 'product_promotion' | 'holiday_visit' | 'contract_signing' | 'sign_statement' | 'price_policy' | 'after_sales_service' | 'negotiate_cooperation' | 'understand_business' | 'sample_tracking'
  result?: string
  feedback?: string
  nextAction?: string
  customerId?: number
  contactId?: number
  opportunityId?: number
  activityId?: number
  expenses?: {
    travel?: number
    entertainment?: number
    other?: number
    total?: number
    currency?: string
    [key: string]: any
  }
  attachments?: string[]
  participants?: number[]
  assignedBy?: number
}

export interface QueryVisitDto {
  type?: 'first_visit' | 'follow_up' | 'maintenance' | 'business_negotiation' | 'technical_support' | 'training' | 'other'
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  customerId?: number
  contactId?: number
  opportunityId?: number
  ownerId?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CheckInDto {
  checkInPhoto?: string
  remark?: string
}

export interface VisitListResponse {
  visits: Visit[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VisitStats {
  total: number
  completed: number
  inProgress: number
  planned: number
  cancelled: number
  completionRate: string
  totalExpenses: number
  typeStats: Array<{
    type: string
    count: string
  }>
}

const visitApi = {
  // 创建拜访
  create: (data: CreateVisitDto) =>
    request.post<{ code: number; message: string; data: Visit }>('/visits', data),

  // 获取拜访列表
  getList: (params?: QueryVisitDto) =>
    request.get<{ code: number; message: string; data: VisitListResponse }>('/visits', { params }),

  // 获取拜访详情
  getById: (id: number) =>
    request.get<{ code: number; message: string; data: Visit }>(`/visits/${id}`),

  // 更新拜访
  update: (id: number, data: UpdateVisitDto) =>
    request.patch<{ code: number; message: string; data: Visit }>(`/visits/${id}`, data),

  // 删除拜访
  delete: (id: number) =>
    request.delete<{ code: number; message: string }>(`/visits/${id}`),

  // 批量删除拜访
  batchDelete: (ids: number[]) =>
    request.post<{ code: number; message: string }>('/visits/batch-delete', { ids }),

  // 获取拜访统计
  getStats: (params?: { ownerId?: number; startDate?: string; endDate?: string }) =>
    request.get<{ code: number; message: string; data: VisitStats }>('/visits/stats', { params }),

  // 获取即将到来的拜访
  getUpcoming: (days?: number) =>
    request.get<{ code: number; message: string; data: Visit[] }>('/visits/upcoming', { params: { days } }),

  // 获取客户的拜访记录
  getByCustomer: (customerId: number) =>
    request.get<{ code: number; message: string; data: Visit[] }>(`/visits/customer/${customerId}`),

  // 获取联系人的拜访记录
  getByContact: (contactId: number) =>
    request.get<{ code: number; message: string; data: Visit[] }>(`/visits/contact/${contactId}`),

  // 位置签到
  checkIn: (id: number, data: CheckInDto) =>
    request.post<{ code: number; message: string; data: Visit }>(`/visits/${id}/check-in`, data),

  // 开始拜访
  start: (id: number) =>
    request.post<{ code: number; message: string; data: Visit }>(`/visits/${id}/start`),

  // 完成拜访
  complete: (id: number, data?: { result?: string; feedback?: string; nextAction?: string }) =>
    request.post<{ code: number; message: string; data: Visit }>(`/visits/${id}/complete`, data),

  // 取消拜访
  cancel: (id: number) =>
    request.post<{ code: number; message: string; data: Visit }>(`/visits/${id}/cancel`),
}

export default visitApi

