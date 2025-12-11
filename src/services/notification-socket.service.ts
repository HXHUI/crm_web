import { io, Socket } from 'socket.io-client'
import type { Notification, NotificationSetting } from '@/api/notification'
import { useNotificationStore } from '@/stores/modules/notification'
import notificationApi from '@/api/notification'

class NotificationSocketService {
  private socket: Socket | null = null
  private apiBaseUrl: string

  constructor() {
    // Socket.IO 需要连接到服务器根路径，不包含 /api/v1
    // 从 API base URL 中提取服务器地址
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
    // 移除 /api/v1 后缀，获取服务器根地址
    this.apiBaseUrl = apiBaseUrl.replace(/\/api\/v1$/, '') || 'http://localhost:3000'
  }

  /**
   * 获取通知 store（延迟获取，避免在 Pinia 初始化前调用）
   */
  private getNotificationStore() {
    return useNotificationStore()
  }

  /**
   * 连接 WebSocket
   */
  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(`${this.apiBaseUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    // 连接成功
    this.socket.on('connect', () => {
      console.log('通知 WebSocket 连接成功')
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('通知 WebSocket 连接失败:', error)
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('通知 WebSocket 断开连接:', reason)
    })

    // 监听新通知
    this.socket.on('notification', (notification: Notification) => {
      console.log('收到新通知:', notification)
      
      // 更新 store
      this.getNotificationStore().addNotification(notification)
      
      // 显示浏览器桌面通知
      this.showBrowserNotification(notification)
    })

    // 监听未读数量更新
    this.socket.on('unread-count', (data: { count: number }) => {
      console.log('未读数量更新:', data.count)
      this.getNotificationStore().unreadCount = data.count
    })
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * 显示浏览器桌面通知
   */
  private async showBrowserNotification(notification: Notification) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      console.warn('浏览器不支持桌面通知')
      return
    }

    // 检查通知权限
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('用户拒绝了通知权限')
        return
      }
    }

    if (Notification.permission === 'granted') {
      try {
        // 检查用户是否启用了该类型的桌面通知
        // 这里简化处理，默认启用。实际可以从通知设置中获取
        const settings = await this.getNotificationSettings()
        const setting = settings.find(
          (s) => s.type === notification.type && s.channel === 'in_app'
        )

        // 如果用户禁用了该类型的通知，不显示桌面通知
        if (setting && !setting.enabled) {
          return
        }

        const notificationInstance = new Notification(notification.title, {
          body: notification.content,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `notification-${notification.id}`,
          requireInteraction: false,
          silent: false,
        })

        // 点击通知时聚焦窗口
        notificationInstance.onclick = () => {
          window.focus()
          notificationInstance.close()

          // 如果有链接，跳转到对应页面
          if (notification.metadata?.link) {
            window.location.href = notification.metadata.link
          }
        }

        // 自动关闭通知（5秒后）
        setTimeout(() => {
          notificationInstance.close()
        }, 5000)
      } catch (error) {
        console.error('显示桌面通知失败:', error)
      }
    }
  }

  /**
   * 获取通知设置（带缓存）
   */
  private settingsCache: NotificationSetting[] | null = null
  private settingsCacheTime: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private async getNotificationSettings(): Promise<NotificationSetting[]> {
    const now = Date.now()
    if (this.settingsCache && now - this.settingsCacheTime < this.CACHE_DURATION) {
      return this.settingsCache
    }

    try {
      const response = await notificationApi.getSettings()
      // request 工具已经处理了响应，直接返回 data
      if (response && response.data && Array.isArray(response.data)) {
        this.settingsCache = response.data
        this.settingsCacheTime = now
        return response.data
      }
    } catch (error) {
      console.error('获取通知设置失败:', error)
    }

    return []
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * 检查通知权限状态
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }
}

// 导出单例
export const notificationSocketService = new NotificationSocketService()

