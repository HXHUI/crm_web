<template>
  <div class="customer-reminder">
    <!-- 标题区域 -->
    <div class="reminder-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><Clock /></el-icon>
          <h3 class="reminder-title">客户遗忘提醒</h3>
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </div>
        <div class="filter-display">{{ scopeFilterText }} | 今天</div>
      </div>
    </div>

    <!-- 提醒内容 -->
    <div class="reminder-content" v-if="reminderData">
      <div class="reminder-grid">
        <!-- 超过7天未联系 -->
        <div class="reminder-item" :class="{ highlight: reminderData.over7Days > 0 }">
          <div class="item-text">超过7天未联系</div>
          <div class="item-count">{{ reminderData.over7Days }}个</div>
        </div>

        <!-- 超过15天未联系 -->
        <div class="reminder-item">
          <div class="item-text">超过15天未联系</div>
          <div class="item-count">{{ reminderData.over15Days }}个</div>
        </div>

        <!-- 超过30天未联系 -->
        <div class="reminder-item">
          <div class="item-text">超过30天未联系</div>
          <div class="item-count">{{ reminderData.over30Days }}个</div>
        </div>

        <!-- 超过3个月未联系 -->
        <div class="reminder-item orange">
          <div class="item-text">超过3个月未联系</div>
          <div class="item-count">{{ reminderData.over3Months }}个</div>
        </div>

        <!-- 超过6个月未联系 -->
        <div class="reminder-item orange">
          <div class="item-text">超过6个月未联系</div>
          <div class="item-count">{{ reminderData.over6Months }}个</div>
        </div>

        <!-- 逾期未联系 -->
        <div class="reminder-item red">
          <div class="item-text">逾期未联系</div>
          <div class="item-count">{{ reminderData.overdue }}个</div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-icon><Warning /></el-icon>
      <span>加载失败，请重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { statisticsApi, type CustomerReminderData } from '@/api/statistics'
import { Clock, QuestionFilled, Loading, Warning } from '@element-plus/icons-vue'

// Props
const props = defineProps<{
  scopeFilter?: string
}>()

// 响应式数据
const reminderData = ref<CustomerReminderData | null>(null)
const loading = ref(false)
const error = ref(false)

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

// 方法
const loadCustomerReminders = async () => {
  try {
    loading.value = true
    error.value = false
    const scope = props.scopeFilter === 'all' ? 'all' : 'me'
    const response = await statisticsApi.getCustomerReminders(scope)
    reminderData.value = response.data
  } catch (err) {
    console.error('加载客户遗忘提醒失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 监听过滤条件变化
watch(
  () => props.scopeFilter,
  () => {
    loadCustomerReminders()
  },
)

onMounted(() => {
  loadCustomerReminders()
})
</script>

<style scoped>
.customer-reminder {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.reminder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
}

.title-with-icon {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 8px;
}

.reminder-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.help-icon {
  font-size: 16px;
  color: #c0c4cc;
  margin-left: 8px;
  cursor: help;
}

.filter-display {
  font-size: 12px;
  color: #909399;
}

.illustration {
  display: flex;
  align-items: center;
}

.clock-illustration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clock-icon {
  font-size: 24px;
}

.calendar-icon {
  font-size: 20px;
}

.reminder-content {
  display: flex;
  flex-direction: column;
}

.reminder-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.reminder-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.reminder-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.reminder-item.highlight {
  background: #f0f9ff;
  border-color: #409eff;
}

.reminder-item.orange .item-text {
  color: #e6a23c;
}

.reminder-item.orange .item-count {
  color: #e6a23c;
}

.reminder-item.red {
  border-color: #f56c6c;
}

.reminder-item.red .item-text {
  color: #f56c6c;
}

.reminder-item.red .item-count {
  color: #f56c6c;
}

.item-text {
  font-size: 12px;
  color: #409eff;
  margin-bottom: 8px;
  font-weight: 500;
}

.item-count {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #909399;
}

.error-state {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .reminder-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .reminder-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .reminder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
