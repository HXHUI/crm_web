<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/modules/auth'
import { notificationSocketService } from '@/services/notification-socket.service'

const authStore = useAuthStore()

onMounted(async () => {
  // 初始化认证状态
  await authStore.initAuth()

  // 如果用户已登录，连接 WebSocket
  if (authStore.isAuthenticated && authStore.token) {
    try {
      notificationSocketService.connect(authStore.token)
      // 请求浏览器通知权限
      notificationSocketService.requestPermission().catch(() => {
        // 用户拒绝权限，静默失败
      })
    } catch (error) {
      console.error('连接通知 WebSocket 失败:', error)
    }
  }
})

// 监听登录状态变化
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated && authStore.token) {
      // 用户登录后连接 WebSocket
      notificationSocketService.connect(authStore.token)
      notificationSocketService.requestPermission().catch(() => {})
    } else {
      // 用户登出后断开连接
      notificationSocketService.disconnect()
    }
  }
)
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

#app {
  height: 100%;
}

/* 全局样式重置 */
.el-button {
  border-radius: 6px;
}

.el-input__wrapper {
  border-radius: 6px;
}

.el-card {
  border-radius: 8px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
