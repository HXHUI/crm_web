<template>
  <div class="notification-list">
    <div class="notification-header" v-if="unreadCount > 0">
      <span class="unread-text">您有 {{ unreadCount }} 条未读通知</span>
      <el-button type="text" size="small" @click="handleMarkAllAsRead">
        全部标记为已读
      </el-button>
    </div>

    <el-scrollbar height="calc(100vh - 120px)">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="notifications.length === 0" class="empty-container">
        <el-empty description="暂无通知" />
      </div>

      <div v-else class="notification-items">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: notification.status === 'unread' }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content">
            <div class="notification-title">
              <span>{{ notification.title }}</span>
              <el-tag
                v-if="notification.status === 'unread'"
                type="danger"
                size="small"
                effect="plain"
              >
                未读
              </el-tag>
            </div>
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-meta">
              <span class="notification-time">
                {{ formatTime(notification.createdAt) }}
              </span>
              <div class="notification-actions">
                <el-button
                  v-if="notification.status === 'unread'"
                  type="text"
                  size="small"
                  @click.stop="handleMarkAsRead(notification.id)"
                >
                  标记已读
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  @click.stop="handleDelete(notification.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <div v-if="total > pageSize" class="notification-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/modules/notification'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const loading = computed(() => notificationStore.loading)
const total = computed(() => notificationStore.total)
const currentPage = ref(1)
const pageSize = computed(() => notificationStore.pageSize)

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).fromNow()
}

// 处理通知点击
const handleNotificationClick = async (notification: any) => {
  // 如果未读，先标记为已读
  if (notification.status === 'unread') {
    await handleMarkAsRead(notification.id)
  }

  // 如果有链接，跳转到对应页面
  if (notification.metadata?.link) {
    router.push(notification.metadata.link)
  }
}

// 标记为已读
const handleMarkAsRead = async (id: number) => {
  try {
    await notificationStore.markAsRead(id)
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 全部标记为已读
const handleMarkAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除通知
const handleDelete = async (id: number) => {
  try {
    await notificationStore.deleteNotification(id)
    ElMessage.success('已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  notificationStore.fetchNotifications({ page })
}

// 监听当前页变化
watch(
  () => notificationStore.currentPage,
  (newPage) => {
    if (newPage !== currentPage.value) {
      currentPage.value = newPage
    }
  }
)
</script>

<style scoped lang="scss">
.notification-list {
  display: flex;
  flex-direction: column;
  height: 100%;

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .unread-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .loading-container {
    padding: 20px;
  }

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .notification-items {
    .notification-item {
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      &.unread {
        background-color: var(--el-color-primary-light-9);
      }

      .notification-content {
        .notification-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .notification-text {
          margin-bottom: 8px;
          font-size: 13px;
          color: var(--el-text-color-regular);
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--el-text-color-secondary);

          .notification-time {
            flex: 1;
          }

          .notification-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }

  .notification-pagination {
    padding: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: center;
  }
}
</style>

