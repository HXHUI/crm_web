<template>
  <div class="notification-bell">
    <el-badge
      :value="unreadCount"
      :hidden="unreadCount === 0"
      :max="99"
      class="notification-badge"
    >
      <el-icon class="bell-icon" @click="showDrawer = true">
        <Bell />
      </el-icon>
    </el-badge>

    <el-drawer
      v-model="showDrawer"
      title="通知"
      :size="400"
      @open="handleDrawerOpen"
    >
      <NotificationList />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/modules/notification'
import { useAuthStore } from '@/stores/modules/auth'
import { notificationSocketService } from '@/services/notification-socket.service'
import NotificationList from '@/components/NotificationList.vue'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const showDrawer = ref(false)

const unreadCount = computed(() => notificationStore.unreadCount)

// 打开抽屉时刷新数据
const handleDrawerOpen = () => {
  notificationStore.fetchNotifications()
  notificationStore.fetchUnreadCount()
}

// 组件挂载时连接 WebSocket 并获取未读数量
onMounted(() => {
  // 获取未读数量
  notificationStore.fetchUnreadCount()

  // 连接 WebSocket（如果已登录）
  const token = localStorage.getItem('token')
  if (token && authStore.isAuthenticated) {
    notificationSocketService.connect(token)

    // 请求浏览器通知权限
    notificationSocketService.requestPermission().catch(() => {
      // 用户拒绝权限，静默失败
    })
  }
})

onUnmounted(() => {
  // 组件卸载时不断开连接，因为可能在其他地方还需要
  // notificationSocketService.disconnect()
})
</script>

<style scoped lang="scss">
.notification-bell {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  position: relative;

  .bell-icon {
    font-size: 24px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.05);
    }
  }

  :deep(.el-badge) {
    .el-badge__content {
      border-color: #1677ff;
      background-color: #ff4d4f;
      color: #fff;
      font-weight: 600;
    }
  }
}
</style>

