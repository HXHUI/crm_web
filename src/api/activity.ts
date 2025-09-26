import request from '@/utils/request'

// 活动类型定义
export interface Activity {
  id: string
  title: string
  description?: string
  type: 'call' | 'meeting' | 'email' | 'task' | 'note'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  plannedStartTime: string
  plannedEndTime?: string
  actualStartTime?: string
  actualEndTime?: string
  location?: string
  outcome?: string
  attachments?: string[]
  participants?: string[]
  relatedToType: 'customer' | 'contact' | 'opportunity' | 'lead'
  relatedToId: string
  ownerId: string
  customer?: {
    id: string
    name: string
  }
  opportunity?: {
    id: string
    title: string
  }
  owner?: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  content?: string
}

export interface CreateActivityDto {
  title: string
  description?: string
  type: 'call' | 'meeting' | 'email' | 'task' | 'note'
  plannedStartTime: string
  plannedEndTime?: string
  location?: string
  participants?: string[]
  relatedToType: 'customer' | 'contact' | 'opportunity' | 'lead'
  relatedToId: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  content?: string
  assignedBy?: string
}

export interface UpdateActivityDto {
  title?: string
  description?: string
  type?: 'call' | 'meeting' | 'email' | 'task' | 'note'
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  plannedStartTime?: string
  plannedEndTime?: string
  location?: string
  outcome?: string
  participants?: string[]
  relatedToType?: 'customer' | 'contact' | 'opportunity' | 'lead'
  relatedToId?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  content?: string
  assignedBy?: string
}

export interface QueryActivityDto {
  title?: string
  type?: string
  status?: string
  relatedToType?: string
  relatedToId?: string
  page?: number
  limit?: number
}

export interface ActivityListResponse {
  activities: Activity[]
  total: number
  page: number
  limit: number
}

export interface ActivityStats {
  totalActivities: number
  completedActivities: number
  plannedActivities: number
  overdueActivities: number
  typeStats: Array<{
    type: string
    count: number
  }>
  statusStats: Array<{
    status: string
    count: number
  }>
}

// 活动API
export const activityApi = {
  // 获取活动列表
  getList: (params?: QueryActivityDto): Promise<{ code: number; message: string; data: ActivityListResponse }> => {
    return request.get('/activities', { params })
  },

  // 获取活动详情
  getDetail: (id: string): Promise<{ code: number; message: string; data: Activity }> => {
    return request.get(`/activities/${id}`)
  },

  // 创建活动
  create: (data: CreateActivityDto): Promise<{ code: number; message: string; data: Activity }> => {
    return request.post('/activities', data)
  },

  // 更新活动
  update: (id: string, data: UpdateActivityDto): Promise<{ code: number; message: string; data: Activity }> => {
    return request.patch(`/activities/${id}`, data)
  },

  // 删除活动
  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/activities/${id}`)
  },

  // 批量删除活动
  deleteBatch: (ids: string[]): Promise<{ code: number; message: string }> => {
    return request.delete('/activities/batch', { data: { ids } })
  },

  // 获取活动统计
  getStats: (): Promise<{ code: number; message: string; data: ActivityStats }> => {
    return request.get('/activities/stats')
  },

  // 获取即将到来的活动
  getUpcoming: (days?: number): Promise<{ code: number; message: string; data: Activity[] }> => {
    return request.get('/activities/upcoming', { params: { days } })
  },

  // 开始活动
  start: (id: string): Promise<{ code: number; message: string; data: Activity }> => {
    return request.patch(`/activities/${id}/start`)
  },

  // 完成活动
  complete: (id: string, outcome: string): Promise<{ code: number; message: string; data: Activity }> => {
    return request.patch(`/activities/${id}/complete`, { outcome })
  }
}

export default activityApi
