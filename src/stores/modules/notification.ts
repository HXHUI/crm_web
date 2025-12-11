import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, QueryNotificationParams } from '@/api/notification'
import notificationApi from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 计算属性
  const hasUnread = computed(() => unreadCount.value > 0)
  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => n.status === 'unread')
  )

  // 获取通知列表
  const fetchNotifications = async (params?: QueryNotificationParams) => {
    try {
      loading.value = true
      const response = await notificationApi.getList({
        page: currentPage.value,
        limit: pageSize.value,
        ...params,
      })
      if (response.code === 200) {
        notifications.value = response.data.data
        total.value = response.data.total
        currentPage.value = response.data.page
        pageSize.value = response.data.limit
      }
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount()
      if (response.code === 200) {
        unreadCount.value = response.data.count
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }

  // 标记为已读
  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      // 更新本地状态
      const notification = notifications.value.find((n) => n.id === id)
      if (notification) {
        notification.status = 'read'
        notification.readAt = new Date().toISOString()
        if (unreadCount.value > 0) {
          unreadCount.value--
        }
      }
    } catch (error) {
      console.error('标记为已读失败:', error)
      throw error
    }
  }

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      // 更新本地状态
      notifications.value.forEach((n) => {
        if (n.status === 'unread') {
          n.status = 'read'
          n.readAt = new Date().toISOString()
        }
      })
      unreadCount.value = 0
    } catch (error) {
      console.error('全部标记为已读失败:', error)
      throw error
    }
  }

  // 删除通知
  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id)
      // 更新本地状态
      const index = notifications.value.findIndex((n) => n.id === id)
      if (index > -1) {
        const notification = notifications.value[index]
        if (notification.status === 'unread' && unreadCount.value > 0) {
          unreadCount.value--
        }
        notifications.value.splice(index, 1)
        total.value--
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      throw error
    }
  }

  // 添加新通知（用于实时推送）
  const addNotification = (notification: Notification) => {
    notifications.value.unshift(notification)
    if (notification.status === 'unread') {
      unreadCount.value++
    }
    total.value++
  }

  // 重置状态
  const reset = () => {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    total.value = 0
    currentPage.value = 1
    pageSize.value = 20
  }

  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    total,
    currentPage,
    pageSize,
    // 计算属性
    hasUnread,
    unreadNotifications,
    // 方法
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    reset,
  }
})

