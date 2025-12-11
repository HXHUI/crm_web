<template>
  <div class="notification-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知设置</span>
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存设置
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="!browserNotificationSupported"
        title="您的浏览器不支持桌面通知"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-alert
        v-else-if="notificationPermission === 'denied'"
        title="您已拒绝浏览器通知权限，无法接收桌面通知"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div>
            <p>如需启用桌面通知，请在浏览器设置中允许通知权限</p>
            <el-button type="text" @click="handleRequestPermission">
              重新请求权限
            </el-button>
          </div>
        </template>
      </el-alert>

      <el-table :data="settingsData" border>
        <el-table-column prop="typeLabel" label="通知类型" width="150" />
        <el-table-column label="站内通知" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.inAppEnabled"
              @change="handleSettingChange"
            />
          </template>
        </el-table-column>
        <el-table-column label="桌面通知" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.desktopEnabled"
              :disabled="!browserNotificationSupported || notificationPermission !== 'granted'"
              @change="handleSettingChange"
            />
            <div v-if="!browserNotificationSupported" class="setting-tip">
              不支持
            </div>
            <div v-else-if="notificationPermission !== 'granted'" class="setting-tip">
              未授权
            </div>
          </template>
        </el-table-column>
        <el-table-column label="邮件通知" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.emailEnabled"
              @change="handleSettingChange"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import notificationApi, { type NotificationSetting } from '@/api/notification'
import { notificationSocketService } from '@/services/notification-socket.service'

const saving = ref(false)
const settings = ref<NotificationSetting[]>([])
const browserNotificationSupported = 'Notification' in window
const notificationPermission = ref<NotificationPermission>(
  browserNotificationSupported ? Notification.permission : 'denied'
)

// 通知类型映射
const typeLabels: Record<string, string> = {
  workflow: '审批流程',
  system: '系统通知',
  task: '任务提醒',
  message: '消息',
  reminder: '提醒',
}

// 通知类型列表
const notificationTypes: Array<{
  type: NotificationSetting['type']
  label: string
}> = [
  { type: 'workflow', label: '审批流程' },
  { type: 'system', label: '系统通知' },
  { type: 'task', label: '任务提醒' },
  { type: 'message', label: '消息' },
  { type: 'reminder', label: '提醒' },
]

// 处理后的设置数据
const settingsData = computed(() => {
  return notificationTypes.map(({ type, label }) => {
    const inAppSetting = settings.value.find(
      (s) => s.type === type && s.channel === 'in_app'
    )
    const emailSetting = settings.value.find(
      (s) => s.type === type && s.channel === 'email'
    )

    // 桌面通知默认跟随站内通知设置，但可以单独控制
    // 这里简化处理，桌面通知和站内通知使用同一个设置
    const defaultEnabled = inAppSetting?.enabled ?? true

    return {
      type,
      typeLabel: label,
      inAppEnabled: defaultEnabled,
      desktopEnabled: defaultEnabled && notificationPermission.value === 'granted',
      emailEnabled: emailSetting?.enabled ?? false,
    }
  })
})

// 加载设置
const loadSettings = async () => {
  try {
    const response = await notificationApi.getSettings()
    if (response.code === 200) {
      settings.value = response.data
    }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}

// 保存设置
const handleSave = async () => {
  saving.value = true
  try {
    const updateData: Array<{
      type: NotificationSetting['type']
      channel: NotificationSetting['channel']
      enabled: boolean
    }> = []

    settingsData.value.forEach((row) => {
      // 站内通知
      updateData.push({
        type: row.type,
        channel: 'in_app',
        enabled: row.inAppEnabled,
      })

      // 邮件通知
      updateData.push({
        type: row.type,
        channel: 'email',
        enabled: row.emailEnabled,
      })
    })

    const response = await notificationApi.updateSettings(updateData)
    if (response.code === 200) {
      settings.value = response.data
      ElMessage.success('设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存设置失败')
    console.error('保存通知设置失败:', error)
  } finally {
    saving.value = false
  }
}

// 设置变化
const handleSettingChange = () => {
  // 可以在这里添加实时保存逻辑
}

// 请求通知权限
const handleRequestPermission = async () => {
  const granted = await notificationSocketService.requestPermission()
  notificationPermission.value = notificationSocketService.getPermissionStatus()

  if (granted) {
    ElMessage.success('已启用桌面通知')
  } else {
    ElMessage.warning('已拒绝桌面通知权限')
  }
}

onMounted(() => {
  loadSettings()
  if (browserNotificationSupported) {
    notificationPermission.value = notificationSocketService.getPermissionStatus()
  }
})
</script>

<style scoped lang="scss">
.notification-settings {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}
</style>

