import request from '@/utils/request'

export interface Notification {
  id: number
  tenantId: number
  receiverId: number
  type: 'workflow' | 'system' | 'task' | 'message' | 'reminder'
  title: string
  content: string
  metadata?: {
    businessType?: string
    businessId?: number
    instanceId?: number
    link?: string
    [key: string]: any
  }
  status: 'unread' | 'read'
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface QueryNotificationParams {
  type?: 'workflow' | 'system' | 'task' | 'message' | 'reminder'
  status?: 'unread' | 'read'
  page?: number
  limit?: number
}

export interface NotificationListResponse {
  data: Notification[]
  total: number
  page: number
  limit: number
}

export interface NotificationSetting {
  id: number
  userId: number
  type: 'workflow' | 'system' | 'task' | 'message' | 'reminder'
  channel: 'in_app' | 'email' | 'sms'
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const notificationApi = {
  // 获取通知列表
  getList: (params?: QueryNotificationParams) =>
    request.get<{ code: number; message: string; data: NotificationListResponse }>(
      `/notifications`,
      { params }
    ),

  // 获取未读数量
  getUnreadCount: () =>
    request.get<{ code: number; message: string; data: { count: number } }>(
      `/notifications/unread-count`
    ),

  // 标记为已读
  markAsRead: (id: number) =>
    request.patch<{ code: number; message: string }>(`/notifications/${id}/read`),

  // 全部标记为已读
  markAllAsRead: () =>
    request.patch<{ code: number; message: string }>(`/notifications/read-all`),

  // 删除通知
  delete: (id: number) =>
    request.delete<{ code: number; message: string }>(`/notifications/${id}`),

  // 获取通知设置
  getSettings: () =>
    request.get<{ code: number; message: string; data: NotificationSetting[] }>(
      `/notifications/settings`
    ),

  // 更新通知设置
  updateSettings: (settings: Omit<NotificationSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) =>
    request.put<{ code: number; message: string; data: NotificationSetting[] }>(
      `/notifications/settings`,
      settings
    ),
}

export default notificationApi

