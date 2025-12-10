<template>
  <div class="calendar-page">
    <div class="calendar-layout">
      <!-- 左侧筛选区域 -->
      <div class="calendar-sidebar">
        <!-- 创建活动按钮 -->
        <div class="sidebar-section">
          <el-button type="primary" :icon="Plus" style="width: 100%" @click="handleCreateActivity">
            创建活动
          </el-button>
        </div>
        <!-- 日历选择器 -->
        <div class="sidebar-section">
          <div class="section-title">选择日期</div>
          <div class="inline-calendar">
            <!-- 月份切换头部 -->
            <div class="calendar-header">
              <el-button
                :icon="ArrowUp"
                circle
                size="small"
                @click="changeCalendarMonth(-1)"
              />
              <span class="calendar-month-year">{{ getCalendarMonthYear() }}</span>
              <el-button
                :icon="ArrowDown"
                circle
                size="small"
                @click="changeCalendarMonth(1)"
              />
            </div>
            <!-- 星期标题 -->
            <div class="calendar-weekdays">
              <div v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="weekday">
                {{ day }}
              </div>
            </div>
            <!-- 日期网格 -->
            <div class="calendar-days">
              <div
                v-for="day in calendarDays"
                :key="day.fullDate"
                class="calendar-day-cell"
                :class="{
                  'is-today': day.isToday,
                  'is-selected': day.isSelected,
                  'is-other-month': !day.isCurrentMonth,
                }"
                @click="handleCalendarDayClick(day.fullDate)"
              >
                {{ day.date }}
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="section-title">用户</div>
          <el-select
            v-model="selectedUserIds"
            multiple
            placeholder="请选择用户"
            filterable
            clearable
            style="width: 100%"
            @change="handleUserChange"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            >
              <div style="display: flex; align-items: center; justify-content: space-between">
                <span>{{ user.name }}</span>
                <el-tag v-if="user.isManager" type="warning" size="small" style="margin-left: 8px">负责人</el-tag>
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="sidebar-section">
          <div class="section-title">活动类型</div>
          <el-checkbox-group v-model="selectedTypes" @change="handleTypeChange">
            <el-checkbox label="call">
              <el-icon class="type-icon type-icon-call"><Phone /></el-icon>
              <span>电话</span>
            </el-checkbox>
            <el-checkbox label="meeting">
              <el-icon class="type-icon type-icon-meeting"><VideoCamera /></el-icon>
              <span>会议</span>
            </el-checkbox>
            <el-checkbox label="email">
              <el-icon class="type-icon type-icon-email"><Message /></el-icon>
              <span>邮件</span>
            </el-checkbox>
            <el-checkbox label="task">
              <el-icon class="type-icon type-icon-task"><List /></el-icon>
              <span>任务</span>
            </el-checkbox>
            <el-checkbox label="note">
              <el-icon class="type-icon type-icon-note"><EditPen /></el-icon>
              <span>备注</span>
            </el-checkbox>
            <el-checkbox label="visit">
              <el-icon class="type-icon type-icon-visit"><Location /></el-icon>
              <span>拜访</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="sidebar-section">
          <div class="section-title">事件提醒</div>
          <el-checkbox-group v-model="selectedReminders" @change="handleReminderChange">
            <el-checkbox label="contract-expiry">
              <el-icon class="type-icon type-icon-contract"><Document /></el-icon>
              <span>即将到期的合同</span>
            </el-checkbox>
            <el-checkbox label="opportunity-close">
              <el-icon class="type-icon type-icon-opportunity"><TrendCharts /></el-icon>
              <span>预计成交的商机</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 右侧日历区域 -->
      <div class="calendar-content">
        <!-- 视图切换工具栏 -->
        <div class="calendar-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button
                :type="viewMode === 'day' ? 'primary' : ''"
                @click="viewMode = 'day'"
              >
                日
              </el-button>
              <el-button
                :type="viewMode === 'week' ? 'primary' : ''"
                @click="viewMode = 'week'"
              >
                周
              </el-button>
              <el-button
                :type="viewMode === 'month' ? 'primary' : ''"
                @click="viewMode = 'month'"
              >
                月
              </el-button>
            </el-button-group>
            <el-button :icon="ArrowLeft" circle @click="navigateDate(-1)" />
            <el-button :icon="ArrowRight" circle @click="navigateDate(1)" />
            <el-button @click="goToToday">今天</el-button>
          </div>
          <div class="toolbar-right">
            <div class="status-filter">
              <span class="filter-label">状态：</span>
              <el-checkbox-group v-model="selectedStatuses" @change="handleStatusChange">
                <el-checkbox label="planned">计划中</el-checkbox>
                <el-checkbox label="in_progress">进行中</el-checkbox>
                <el-checkbox label="completed">已完成</el-checkbox>
                <el-checkbox label="cancelled">已取消</el-checkbox>
              </el-checkbox-group>
            </div>
            <span class="current-date-text">{{ getCurrentDateText() }}</span>
          </div>
        </div>

        <!-- 月视图 -->
        <div v-if="viewMode === 'month'" class="calendar-view month-view">
          <div class="month-calendar">
            <!-- 星期标题 -->
            <div class="month-header">
              <div
                v-for="dayName in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']"
                :key="dayName"
                class="month-header-cell"
              >
                {{ dayName }}
              </div>
            </div>
            <!-- 日期格子 -->
            <div class="month-body">
              <div
                v-for="(day, index) in monthDays"
                :key="`${day.fullDate}-${index}`"
                class="month-day-cell"
                :class="{
                  'is-today': day.isToday,
                  'is-current-month': day.isCurrentMonth,
                  'is-other-month': !day.isCurrentMonth
                }"
              >
                <div class="calendar-day">
                  <div class="day-header">
                    <span class="day-number">{{ day.date }}</span>
                    <span class="lunar-date">{{ getLunarDate(day.fullDate) }}</span>
                  </div>
                  <div class="day-events">
                    <div
                      v-for="event in getFilteredEventsByDate(day.fullDate)"
                      :key="`${event.type}-${event.id}`"
                      class="event-item"
                      :class="getEventClass(event)"
                      @click.stop="handleEventClick(event)"
                    >
                      <el-avatar :size="12" :src="getEventOwnerAvatar(event)" class="event-avatar">
                        {{ getEventOwnerName(event)?.charAt(0) || 'U' }}
                      </el-avatar>
                      <span class="event-time">{{ formatTime(event.plannedStartTime) }}</span>
                      <el-icon class="event-type-icon" :style="{ color: getEventTypeIconColor(event) }">
                        <component :is="getEventTypeIcon(event)" />
                      </el-icon>
                      <span class="event-title-text">{{ getEventTitle(event) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周视图 -->
        <div v-else-if="viewMode === 'week'" class="calendar-view week-view">
          <div class="week-header">
            <div
              v-for="day in weekDays"
              :key="`header-${day.fullDate}`"
              class="week-day-header"
              :class="{ 'is-today': day.isToday }"
            >
              <div class="day-name">{{ day.dayName }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>
          <div class="week-body">
            <div
              v-for="day in weekDays"
              :key="`column-${day.fullDate}`"
              class="week-day-column"
              :class="{ 'is-today': day.isToday }"
            >
              <div class="day-events">
                <div
                  v-for="event in getFilteredEventsByDate(day.fullDate)"
                  :key="`${event.type}-${event.id}`"
                  class="event-item"
                  :class="getEventClass(event)"
                  @click.stop="handleEventClick(event)"
                >
                  <div class="event-header">
                    <el-avatar :size="18" :src="getEventOwnerAvatar(event)" class="event-avatar">
                      {{ getEventOwnerName(event)?.charAt(0) || 'U' }}
                    </el-avatar>
                  <div class="event-time">{{ formatTime(event.plannedStartTime) }}</div>
                  </div>
                  <div class="event-title">
                    <el-icon class="event-type-icon" :style="{ color: getEventTypeIconColor(event) }">
                      <component :is="getEventTypeIcon(event)" />
                    </el-icon>
                    <span>{{ getEventTitle(event) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 日视图 -->
        <div v-else class="calendar-view day-view">
          <div class="day-header">
            <div class="day-name">{{ getDayName(currentDate) }}</div>
            <div class="day-date">{{ formatDate(currentDate) }}</div>
          </div>
          <div class="day-body">
            <div class="time-slots">
              <div
                v-for="hour in 24"
                :key="hour"
                class="time-slot"
              >
                <div class="time-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
                <div class="time-content">
                  <div
                    v-for="event in getEventsForHour(hour - 1)"
                    :key="`${event.type}-${event.id}`"
                    class="event-item"
                    :class="getEventClass(event)"
                    @click="handleEventClick(event)"
                  >
                    <div class="event-header">
                      <el-avatar :size="20" :src="getEventOwnerAvatar(event)" class="event-avatar">
                        {{ getEventOwnerName(event)?.charAt(0) || 'U' }}
                      </el-avatar>
                    <div class="event-time">{{ formatTime(event.plannedStartTime) }}</div>
                    </div>
                    <div class="event-title">
                      <el-icon class="event-type-icon" :style="{ color: getEventTypeIconColor(event) }">
                        <component :is="getEventTypeIcon(event)" />
                      </el-icon>
                      <span>{{ getEventTitle(event) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建活动对话框 -->
    <el-dialog v-model="createActivityDialogVisible" title="创建活动" width="800px" @close="handleCreateDialogClose">
      <ActivityForm ref="activityFormRef" @submit="handleActivitySubmit" @cancel="createActivityDialogVisible = false" />
      <template #footer>
        <el-button @click="createActivityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleActivityFormSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="eventDialogVisible" :title="eventDialogTitle" width="600px">
      <div v-if="selectedEvent" class="event-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="类型">
            <el-tag :type="getEventTypeColor(selectedEvent)" size="small">
              {{ getEventTypeName(selectedEvent) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusColor(selectedEvent.status)" size="small">
              {{ getStatusName(selectedEvent.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划开始时间">
            {{ formatDateTime(selectedEvent.plannedStartTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="计划结束时间">
            {{ selectedEvent.plannedEndTime ? formatDateTime(selectedEvent.plannedEndTime) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="负责人">
            {{ selectedEvent.owner?.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'visit'" label="拜访目的">
            {{ getPurposeName(selectedEvent.purpose) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'activity'" label="关联对象">
            <span v-if="selectedEvent.customer">客户：{{ selectedEvent.customer.name }}</span>
            <span v-else-if="selectedEvent.opportunity">商机：{{ selectedEvent.opportunity.title }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'visit'" label="拜访对象">
            <span v-if="selectedEvent.customer">客户：{{ selectedEvent.customer.name }}</span>
            <span v-else-if="selectedEvent.contact">联系人：{{ selectedEvent.contact.name }}</span>
            <span v-else-if="selectedEvent.opportunity">商机：{{ selectedEvent.opportunity.name }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'contract-expiry'" label="合同编号">
            {{ selectedEvent.contractNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'contract-expiry'" label="客户">
            {{ selectedEvent.customer?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'contract-expiry'" label="到期日期">
            {{ selectedEvent.expiryDate ? formatDateTime(selectedEvent.expiryDate) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'contract-expiry'" label="剩余天数">
            {{ selectedEvent.daysRemaining !== undefined ? `${selectedEvent.daysRemaining} 天` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'opportunity-close'" label="商机名称">
            {{ selectedEvent.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'opportunity-close'" label="客户">
            {{ selectedEvent.customer?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'opportunity-close'" label="预计成交日期">
            {{ selectedEvent.expectedCloseDate ? formatDateTime(selectedEvent.expectedCloseDate) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'opportunity-close'" label="剩余天数">
            {{ selectedEvent.daysRemaining !== undefined ? `${selectedEvent.daysRemaining} 天` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.type === 'opportunity-close'" label="预计金额">
            {{ selectedEvent.amount ? `¥${selectedEvent.amount}` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedEvent.description" label="描述" :span="2">
            {{ selectedEvent.description }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Phone,
  VideoCamera,
  Message,
  List,
  EditPen,
  Location,
  Plus,
  Document,
  TrendCharts,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import activityApi, { type Activity, type CreateActivityDto } from '@/api/activity'
import visitApi, { type Visit } from '@/api/visit'
import contractApi, { type Contract } from '@/api/contract'
import opportunityApi, { type Opportunity } from '@/api/opportunity'
import { getDepartmentTree, getDepartmentMembers, type Department, type Member } from '@/api/department'
import ActivityForm from '@/components/activity/ActivityForm.vue'
import { formatLunarDate } from '@/utils/lunar'

const authStore = useAuthStore()
const currentMemberId = computed(() => {
  return (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
})

const currentTenantId = computed(() => {
  return (authStore as any)?.currentTenant?.id || (authStore as any)?.user?.tenantId
})

// 当前用户的部门信息
const currentUserDepartment = ref<Department | null>(null)
const isDepartmentManager = ref(false)

// 可用用户列表
const availableUsers = ref<Array<{ id: string; name: string; isManager?: boolean; avatar?: string }>>([])

// 选中的用户ID列表
const selectedUserIds = ref<string[]>([])

type CalendarEvent =
  | (Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] })
  | (Visit & { type: 'visit' })
  | (Contract & { type: 'contract-expiry'; daysRemaining: number })
  | (Opportunity & { type: 'opportunity-close'; daysRemaining: number })

const currentDate = ref(new Date())
const selectedDate = ref<string>('')

// 日历选择器显示的月份
const calendarMonth = ref(new Date())
const events = ref<CalendarEvent[]>([])
const eventDialogVisible = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)

// 创建活动相关
const createActivityDialogVisible = ref(false)
const activityFormRef = ref<InstanceType<typeof ActivityForm> | null>(null)

// 视图模式：日、周、月
const viewMode = ref<'day' | 'week' | 'month'>('month')

// 活动类型筛选
const selectedTypes = ref<string[]>(['call', 'meeting', 'email', 'task', 'note', 'visit'])

// 事件提醒筛选
const selectedReminders = ref<string[]>(['contract-expiry', 'opportunity-close'])

// 状态筛选（用于活动和拜访）
const selectedStatuses = ref<string[]>(['planned', 'in_progress'])

// 处理类型变化
const handleTypeChange = () => {
  // 筛选逻辑在 getFilteredEventsByDate 中实现
}

// 处理事件提醒变化
const handleReminderChange = () => {
  // 筛选逻辑在 getFilteredEventsByDate 中实现
}

// 处理状态变化
const handleStatusChange = () => {
  // 筛选逻辑在 getFilteredEventsByDate 中实现
}

// 处理用户变化
const handleUserChange = () => {
  loadData()
}

// 加载可用用户列表
const loadAvailableUsers = async () => {
  try {
    const memberId = currentMemberId.value
    const tenantId = currentTenantId.value

    if (!memberId || !tenantId) {
      ElMessage.warning('无法获取用户信息')
      return
    }

    // 获取部门树
    const deptTreeRes = await getDepartmentTree()
    const departmentTree = deptTreeRes.data || []

    // 遍历所有部门，查找包含当前用户的部门
    const findDepartmentByMember = async (depts: Department[]): Promise<Department | null> => {
      for (const dept of depts) {
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members = membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          if (members.some((m: Member) => String(m.id) === String(memberId))) {
            return dept
          }
        } catch (error) {
          // 忽略错误，继续查找
        }

        if (dept.children) {
          const found = await findDepartmentByMember(dept.children)
          if (found) return found
        }
      }
      return null
    }

    const userDepartment = await findDepartmentByMember(departmentTree)
    currentUserDepartment.value = userDepartment

    // 判断是否是部门负责人
    if (userDepartment && userDepartment.managerId && String(userDepartment.managerId) === String(memberId)) {
      isDepartmentManager.value = true

      // 获取当前部门及所有下级部门的成员
      const allMembers: Member[] = []
      const collectDepartmentMembers = async (dept: Department) => {
        // 获取当前部门的成员
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members = membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          allMembers.push(...members)
        } catch (error) {
          console.error(`获取部门 ${dept.name} 成员失败:`, error)
        }

        // 递归获取子部门成员
        if (dept.children && dept.children.length > 0) {
          for (const child of dept.children) {
            await collectDepartmentMembers(child)
          }
        }
      }

      if (userDepartment) {
        await collectDepartmentMembers(userDepartment)
      }

      // 去重并格式化
      const memberMap = new Map<string, Member>()
      allMembers.forEach((m: Member) => {
        if (!memberMap.has(m.id)) {
          memberMap.set(m.id, m)
        }
      })

      availableUsers.value = Array.from(memberMap.values()).map((m: Member) => ({
        id: String(m.id),
        name: m.user?.username || m.nickname || m.user?.realName || '未知用户',
        isManager: m.isManager,
        avatar: m.user?.avatar,
      }))
    } else {
      // 不是部门负责人，只能看到自己
      isDepartmentManager.value = false
      availableUsers.value = [
        {
          id: String(memberId),
          name: (authStore as any)?.user?.username || '当前用户',
          isManager: false,
          avatar: (authStore as any)?.user?.avatar,
        },
      ]
    }

    // 默认选中当前用户
    if (selectedUserIds.value.length === 0) {
      selectedUserIds.value = [String(memberId)]
    }
  } catch (error: any) {
    console.error('加载用户列表失败:', error)
    // 失败时至少显示当前用户
    const memberId = currentMemberId.value
    if (memberId) {
      availableUsers.value = [
        {
          id: String(memberId),
          name: (authStore as any)?.user?.username || '当前用户',
          isManager: false,
          avatar: (authStore as any)?.user?.avatar,
        },
      ]
      selectedUserIds.value = [String(memberId)]
    }
  }
}

// 格式化日期为 YYYY-MM-DD（使用本地时间）
const formatDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取周视图的日期数组
const weekDays = computed(() => {
  const date = new Date(currentDate.value)
  const day = date.getDay()
  // 获取本周周一（周一为第一天）
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    days.push({
      fullDate: formatDateString(d),
      date: d.getDate(),
      dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
      isToday,
    })
  }
  return days
})

// 获取月视图的日期数组（包括上月末和下月初的日期，确保6行）
const monthDays = computed(() => {
  const date = new Date(currentDate.value)
  const year = date.getFullYear()
  const month = date.getMonth()

  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)

  // 获取当月第一天是星期几（0=周日，1=周一，...）
  const firstDayOfWeek = firstDay.getDay()
  // 转换为周一为第一天（0=周一，1=周二，...）
  const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const days = []

  // 添加上个月末的日期
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      fullDate: formatDateString(d),
      date: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
    })
  }

  // 添加当月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    days.push({
      fullDate: formatDateString(d),
      date: i,
      isCurrentMonth: true,
      isToday,
    })
  }

  // 添加下个月初的日期，确保总共42天（6行×7列）
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      fullDate: formatDateString(d),
      date: i,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  return days
})

// 导航日期
const navigateDate = (direction: number) => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'day') {
    date.setDate(date.getDate() + direction)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() + direction * 7)
  } else {
    date.setMonth(date.getMonth() + direction)
  }
  currentDate.value = date
}

// 跳转到今天
const goToToday = () => {
  currentDate.value = new Date()
}

// 获取当前日期文本
const getCurrentDateText = () => {
  const date = currentDate.value
  if (viewMode.value === 'day') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } else if (viewMode.value === 'week') {
    const start = weekDays.value[0]
    const end = weekDays.value[6]
    return `${start.fullDate} ~ ${end.fullDate}`
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  }
}

// 获取日期名称
const getDayName = (date: Date) => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNames[date.getDay()]
}

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 获取指定小时的事件
const getEventsForHour = (hour: number): CalendarEvent[] => {
  const dateStr = formatDateString(currentDate.value)
  return getFilteredEventsByDate(dateStr).filter((event) => {
    const eventDate = new Date(event.plannedStartTime)
    return eventDate.getHours() === hour
  })
}

// 加载数据
const loadData = async () => {
  // 防止重复加载
  if (isLoadingData.value) {
    console.log('数据正在加载中，跳过重复请求')
    return
  }

  try {
    isLoadingData.value = true

    if (selectedUserIds.value.length === 0) {
      events.value = []
      console.log('未选择用户，清空事件列表')
      isLoadingData.value = false
      return
    }

    console.log('开始加载数据，选中的用户ID:', selectedUserIds.value)

    // 加载所有活动（后端可能不支持批量查询，先加载全部然后前端过滤）
    let allActivities: Activity[] = []
    try {
      const activityRes = await activityApi.getList({ page: 1, limit: 1000 })
      console.log('活动API响应:', activityRes)
      allActivities = activityRes.data?.activities || activityRes.data || []
      console.log('加载的活动总数:', allActivities.length)
    } catch (error) {
      console.error('加载活动失败:', error)
    }

    // 过滤选中用户的活动
    const userActivities = allActivities.filter((a: Activity) => {
      const match = selectedUserIds.value.some((userId) => {
        const aOwnerId = String(a.ownerId || a.owner?.id || '')
        const uId = String(userId)
        return aOwnerId === uId
      })
      return match
    })
    console.log('过滤后的活动数量:', userActivities.length)

    const activities: CalendarEvent[] = userActivities.map((a: Activity) => ({
      ...a,
      type: 'activity' as const,
      activityType: a.type, // 保存 Activity 的原始类型（call, meeting, email, task, note）
    }))

    // 加载所有选中用户的拜访（拜访API支持按ownerId过滤，可以逐个查询）
    const allVisits: Visit[] = []
    const visitPromises = selectedUserIds.value.map(async (userId): Promise<Visit[]> => {
      try {
        const visitRes = await visitApi.getList({ ownerId: Number(userId), page: 1, limit: 1000 })
        const visits = (visitRes.data as any)?.visits || (visitRes.data as any) || []
        console.log(`用户 ${userId} 的拜访数量:`, visits.length)
        return visits as Visit[]
      } catch (error) {
        console.error(`加载用户 ${userId} 的拜访失败:`, error)
        return []
      }
    })

    const visitResults = await Promise.all(visitPromises)
    visitResults.forEach((visits: Visit[]) => {
      allVisits.push(...visits)
    })

    const visits: CalendarEvent[] = allVisits.map((v: Visit) => ({
      ...v,
      type: 'visit' as const,
    }))

    // 加载合同到期提醒
    let contractExpiryEvents: CalendarEvent[] = []
    try {
      const contractResponse = await contractApi.getExpiring()
      if (contractResponse.code === 200 && contractResponse.data) {
        contractExpiryEvents = contractResponse.data.map((contract: Contract & { daysRemaining: number }) => ({
          ...contract,
          type: 'contract-expiry' as const,
          daysRemaining: contract.daysRemaining,
          plannedStartTime: contract.expiryDate || new Date().toISOString(),
          plannedEndTime: contract.expiryDate || new Date().toISOString(),
          ownerId: contract.ownerId,
          owner: contract.owner,
        }))
      }
    } catch (error) {
      console.error('加载合同到期提醒失败:', error)
    }

    // 加载商机预计成交提醒
    let opportunityCloseEvents: CalendarEvent[] = []
    try {
      const opportunityResponse = await opportunityApi.getUpcomingClose()
      if (opportunityResponse.code === 200 && opportunityResponse.data) {
        opportunityCloseEvents = opportunityResponse.data.map((opportunity: Opportunity & { daysRemaining: number }) => ({
          ...opportunity,
          type: 'opportunity-close' as const,
          daysRemaining: opportunity.daysRemaining,
          plannedStartTime: opportunity.expectedCloseDate || new Date().toISOString(),
          plannedEndTime: opportunity.expectedCloseDate || new Date().toISOString(),
          ownerId: opportunity.ownerId,
          owner: opportunity.owner,
        }))
      }
    } catch (error) {
      console.error('加载商机预计成交提醒失败:', error)
    }

    events.value = [...activities, ...visits, ...contractExpiryEvents, ...opportunityCloseEvents]
    console.log('最终事件总数:', events.value.length)
    console.log('事件列表:', events.value)


    // 调试：显示前几个事件的日期信息
    if (events.value.length > 0) {
      console.log('前3个事件的日期信息:')
      events.value.slice(0, 3).forEach((event, index) => {
        if (event.plannedStartTime) {
          const eventDate = new Date(event.plannedStartTime)
          const dateStr = formatDateString(eventDate)
          const activity = event.type === 'activity' ? (event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }) : null
          console.log(`事件${index + 1}:`, {
            title: activity ? activity.title : '拜访',
            plannedStartTime: event.plannedStartTime,
            formattedDate: dateStr,
            type: event.type,
            activityType: activity ? activity.activityType : 'visit'
          })
        }
      })
    }
  } catch (error: any) {
    console.error('加载数据异常:', error)
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    isLoadingData.value = false
  }
}

// 根据日期获取事件（带筛选）
const getFilteredEventsByDate = (date: string): CalendarEvent[] => {
  if (events.value.length === 0) {
    return []
  }

  const filtered = events.value.filter((event) => {
    if (!event.plannedStartTime) {
      return false
    }

    // 处理日期匹配，使用本地时间
    const eventDate = new Date(event.plannedStartTime)
    const eventDateStr = formatDateString(eventDate)

    // 如果日期不匹配，直接返回false
    if (eventDateStr !== date) {
      return false
    }

    // 根据选中的类型进行筛选
    if (event.type === 'visit') {
      // 拜访类型，需要检查类型和状态
      if (!selectedTypes.value.includes('visit')) {
        return false
      }
      // 检查状态过滤
      const visit = event as Visit
      return selectedStatuses.value.includes(visit.status)
    } else if (event.type === 'activity') {
      // 活动类型，需要检查活动的具体类型（call, meeting, email, task, note）和状态
      const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
      const activityType = activity.activityType
      if (!selectedTypes.value.includes(activityType)) {
        return false
      }
      // 检查状态过滤
      return selectedStatuses.value.includes(activity.status)
    } else if (event.type === 'contract-expiry') {
      // 合同到期提醒，使用事件提醒筛选
      return selectedReminders.value.includes('contract-expiry')
    } else if (event.type === 'opportunity-close') {
      // 商机成交提醒，使用事件提醒筛选
      return selectedReminders.value.includes('opportunity-close')
    }
    return false
  })

  if (filtered.length > 0) {
    console.log(`日期 ${date} 找到 ${filtered.length} 个事件`)
  }
  return filtered
}

// 获取事件标题
const getEventTitle = (event: CalendarEvent): string => {
  if (event.type === 'activity') {
    return event.title
  } else if (event.type === 'contract-expiry') {
    return `合同到期：${event.contractNumber || '未知'} (${event.customer?.name || '未知客户'})`
  } else if (event.type === 'opportunity-close') {
    return `商机成交：${event.name || '未知商机'} (${event.customer?.name || '未知客户'})`
  } else {
    // 拜访没有标题，使用客户/联系人/商机名称
    return (
      event.customer?.name ||
      event.contact?.name ||
      event.opportunity?.name ||
      '拜访'
    )
  }
}

// 获取事件负责人头像
const getEventOwnerAvatar = (event: CalendarEvent): string | undefined => {
  let ownerId: string = ''
  if (event.type === 'activity') {
    ownerId = String(event.ownerId || event.owner?.id || '')
  } else {
    // Visit 的 ownerId 是 number
    ownerId = String(event.ownerId || event.owner?.id || '')
  }

  if (!ownerId) return undefined

  // 尝试匹配 availableUsers 中的 id
  const user = availableUsers.value.find(u => String(u.id) === ownerId)
  return user?.avatar
}

// 获取事件负责人名称（用于头像显示）
const getEventOwnerName = (event: CalendarEvent): string => {
  let ownerId: string = ''
  if (event.type === 'activity') {
    ownerId = String(event.ownerId || event.owner?.id || '')
  } else {
    ownerId = String(event.ownerId || event.owner?.id || '')
  }

  if (ownerId) {
    const user = availableUsers.value.find(u => String(u.id) === ownerId)
    if (user) {
      return user.name
    }
  }

  // 如果没有找到，尝试从事件本身获取
  if (event.type === 'activity') {
    return event.owner?.username || 'U'
  } else {
    return event.owner?.user?.username || 'U'
  }
}

// 获取事件样式类
const getEventClass = (event: CalendarEvent): string => {
  const statusClass = `status-${event.status}`
  let typeClass = ''
  if (event.type === 'activity') {
    const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
    typeClass = `type-${activity.activityType}`
  } else {
    typeClass = `type-${event.type}`
  }
  return `${statusClass} ${typeClass}`.trim()
}

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取事件类型颜色
const getEventTypeColor = (event: CalendarEvent | string): string => {
  let type: string
  if (typeof event === 'string') {
    type = event
  } else {
    if (event.type === 'visit') {
      return 'success'
    }
    if (event.type === 'activity') {
      const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
      type = activity.activityType
    } else {
      return ''
    }
  }

  if (type === 'visit') {
    return 'success'
  }
  const map: Record<string, string> = {
    call: 'primary',
    meeting: 'warning',
    email: 'info',
    task: 'success',
    note: '',
  }
  return map[type] || ''
}

// 获取事件类型图标组件
const getEventTypeIcon = (event: CalendarEvent) => {
  if (event.type === 'visit') {
    return Location
  }
  if (event.type === 'contract-expiry') {
    return Document
  }
  if (event.type === 'opportunity-close') {
    return TrendCharts
  }
  if (event.type === 'activity') {
    const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
    const activityType = activity.activityType
    const iconMap: Record<string, any> = {
      call: Phone,
      meeting: VideoCamera,
      email: Message,
      task: List,
      note: EditPen,
    }
    return iconMap[activityType] || List
  }
  return List
}

// 获取事件类型图标颜色
const getEventTypeIconColor = (event: CalendarEvent): string => {
  if (event.type === 'visit') {
    return '#f56c6c' // 红色
  }
  if (event.type === 'contract-expiry') {
    return '#e6a23c' // 橙色
  }
  if (event.type === 'opportunity-close') {
    return '#409eff' // 蓝色
  }
  if (event.type === 'activity') {
    const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
    const activityType = activity.activityType
    const colorMap: Record<string, string> = {
      call: '#409eff', // 蓝色
      meeting: '#67c23a', // 绿色
      email: '#909399', // 灰色
      task: '#e6a23c', // 橙色
      note: '#9c27b0', // 紫色
    }
    return colorMap[activityType] || '#606266'
  }
  return '#606266'
}

// 获取事件类型名称
const getEventTypeName = (event: CalendarEvent): string => {
  if (event.type === 'visit') {
    return '拜访'
  }
  if (event.type === 'activity') {
    const activity = event as Omit<Activity, 'type'> & { type: 'activity'; activityType: Activity['type'] }
    const activityType = activity.activityType
  const map: Record<string, string> = {
    call: '电话',
    meeting: '会议',
    email: '邮件',
    task: '任务',
    note: '备注',
  }
    return map[activityType] || '活动'
  }
  return '活动'
}

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || ''
}

// 获取状态名称
const getStatusName = (status: string): string => {
  const map: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

// 获取拜访目的名称
const getPurposeName = (purpose?: string): string => {
  if (!purpose) return ''
  const map: Record<string, string> = {
    understand_needs: '了解需求',
    monthly_performance: '月度履约',
    performance_increment: '业绩增量',
    product_promotion: '产品推广',
    holiday_visit: '节日走访',
    contract_signing: '合同签订',
    sign_statement: '签对账单',
    price_policy: '价格政策',
    after_sales_service: '售后服务',
    negotiate_cooperation: '协商合作细节',
    understand_business: '了解客户经营状况',
    sample_tracking: '样品跟踪测试',
  }
  return map[purpose] || purpose
}

// 获取农历日期
const getLunarDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return formatLunarDate(date)
  } catch (error) {
    return ''
  }
}

// 点击事件
const handleEventClick = (event: CalendarEvent) => {
  selectedEvent.value = event
  eventDialogVisible.value = true
}

// 处理创建活动
const handleCreateActivity = () => {
  createActivityDialogVisible.value = true
}

// 日历选择器的日期数组
const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()

  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)

  // 获取当月第一天是星期几（0=周日，1=周一，...，6=周六）
  const firstDayOfWeek = firstDay.getDay()
  // 转换为周一为第一天（0=周一，1=周二，...，6=周日）
  const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const days = []
  const today = new Date()
  const todayStr = formatDateString(today)
  const selectedDateStr = selectedDate.value

  // 添加上个月末的日期
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    const dateStr = formatDateString(d)
    days.push({
      fullDate: dateStr,
      date: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
    })
  }

  // 添加当月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDateString(d)
    days.push({
      fullDate: dateStr,
      date: i,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
    })
  }

  // 添加下个月初的日期，确保总共42天（6行×7列）
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i)
    const dateStr = formatDateString(d)
    days.push({
      fullDate: dateStr,
      date: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
    })
  }

  return days
})

// 获取日历显示的月份和年份文本
const getCalendarMonthYear = () => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth() + 1
  return `${year}年${month}月`
}

// 切换日历月份
const changeCalendarMonth = (delta: number) => {
  const newDate = new Date(calendarMonth.value)
  newDate.setMonth(newDate.getMonth() + delta)
  calendarMonth.value = newDate
}

// 处理日历日期点击
const handleCalendarDayClick = (dateStr: string) => {
  selectedDate.value = dateStr
  // 更新日历月份为选中日期的月份
  const selectedDateObj = new Date(dateStr)
  calendarMonth.value = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
  handleDateSelect(dateStr)
}

// 处理日期选择
const handleDateSelect = (date: string) => {
  if (date) {
    // 切换到日视图
    viewMode.value = 'day'
    // 设置当前日期
    currentDate.value = new Date(date)
  }
}

// 处理活动表单提交
const handleActivityFormSubmit = async () => {
  if (!activityFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }

  const success = await activityFormRef.value.submit()
  if (success) {
    // 提交成功，表单组件会触发 submit 事件，由 handleActivitySubmit 处理
  }
}

// 处理活动提交（从表单组件发出的事件）
const handleActivitySubmit = async (data: CreateActivityDto | CreateActivityDto[]) => {
  try {
    const activities = Array.isArray(data) ? data : [data]

    // 批量创建活动
    const promises = activities.map(activity => activityApi.create(activity))
    await Promise.all(promises)

    // 刷新数据
    await loadData()
    ElMessage.success('活动创建成功')
    createActivityDialogVisible.value = false
  } catch (error: any) {
    console.error('创建活动失败:', error)
    ElMessage.error(error.message || '创建活动失败')
  }
}

// 处理创建对话框关闭
const handleCreateDialogClose = () => {
  if (activityFormRef.value) {
    activityFormRef.value.resetForm()
  }
}

const eventDialogTitle = computed(() => {
  if (!selectedEvent.value) return '事件详情'
  return selectedEvent.value.type === 'visit' ? '拜访详情' : '活动详情'
})

// 防止重复加载的标志
const isLoadingData = ref(false)
const isInitialized = ref(false)

// 格式化日期为 YYYY-MM-DD
const formatDateForPicker = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


onMounted(async () => {
  // 初始化日历选择器的默认值为当前日期
  selectedDate.value = formatDateForPicker(currentDate.value)
  // 初始化日历月份为当前月份
  calendarMonth.value = new Date(currentDate.value)

  await loadAvailableUsers()
  // 初始化完成后，设置标志并加载数据
  isInitialized.value = true
  // 确保有选中的用户时才加载数据
  if (selectedUserIds.value.length > 0) {
  await loadData()
  }

})

// 监听用户选择变化，自动重新加载数据
watch(selectedUserIds, () => {
  // 只在初始化完成后才响应变化，避免初始化时重复调用
  if (isInitialized.value && !isLoadingData.value) {
  loadData()
  }
}, { deep: true })

// 监听类型筛选变化
watch(selectedTypes, () => {
  // 类型筛选变化时不需要重新加载数据，只需要重新渲染即可
  // Vue会自动响应式更新
}, { deep: true })

// 监听当前日期变化（用于日视图和周视图）
watch([currentDate, viewMode], () => {
  // 日期或视图模式变化时，Vue会自动重新计算和渲染
  // 同步更新日历选择器的值
  selectedDate.value = formatDateForPicker(currentDate.value)
})
</script>

<style scoped lang="scss">
.calendar-page {
  background: white;
  border-radius: 4px;
  height: calc(100vh - 56px - 32px); /* 100vh - 顶部栏高度 - page-main的padding */
  display: flex;
  flex-direction: column;

  .calendar-layout {
    display: flex;
    height: 100%;
    gap: 20px;

    .calendar-sidebar {
      width: 280px;
      flex-shrink: 0;
      background: #f5f6f8;
      border-radius: 4px;
      padding: 20px 10px;
      overflow-y: auto;

      .sidebar-section {
        margin-bottom: 24px;

        .inline-calendar {
          background: white;
          border-radius: 4px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;

            .calendar-month-year {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
          }

          .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            margin-bottom: 8px;

            .weekday {
              text-align: center;
              font-size: 12px;
              color: #909399;
              font-weight: 500;
              padding: 4px 0;
            }
          }

          .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;

            .calendar-day-cell {
              aspect-ratio: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              color: #606266;
              cursor: pointer;
              border-radius: 4px;
              transition: all 0.2s;

              &:hover {
                background-color: #f5f7fa;
              }

              &.is-today {
                background-color: #ecf5ff;
                color: #409eff;
                font-weight: 600;
              }

              &.is-selected {
                background-color: #409eff;
                color: white;
                font-weight: 600;
              }

              &.is-other-month {
                color: #c0c4cc;
              }
            }
          }
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 12px;
        }

        :deep(.el-select) {
          .el-select__tags {
            max-height: 100px;
            overflow-y: auto;
          }
        }

        :deep(.el-checkbox-group) {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .el-checkbox {
            margin: 0;
            display: flex;
            align-items: center;

            .el-checkbox__label {
              display: flex;
              align-items: center;
              gap: 8px;
              padding-left: 8px;

              .type-icon {
                font-size: 16px;
                flex-shrink: 0;
                transition: color 0.2s;
              }

              // 为不同活动类型设置不同颜色
              .type-icon-call {
                color: #409eff; // 蓝色 - 电话
              }

              .type-icon-meeting {
                color: #67c23a; // 绿色 - 会议
              }

              .type-icon-email {
                color: #909399; // 灰色 - 邮件
              }

              .type-icon-task {
                color: #e6a23c; // 橙色 - 任务
              }

              .type-icon-note {
                color: #9c27b0; // 紫色 - 备注
              }

              .type-icon-visit {
                color: #f56c6c; // 红色 - 拜访
              }

              .type-icon-contract {
                color: #e6a23c; // 橙色 - 合同到期
              }

              .type-icon-opportunity {
                color: #409eff; // 蓝色 - 商机成交
              }

              span {
                line-height: 1;
              }
            }
          }
        }
      }
    }

    .calendar-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .calendar-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: white;
        border-bottom: 1px solid #ebeef5;
        margin-bottom: 0;

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 20px;

          .status-filter {
            display: flex;
            align-items: center;
            gap: 8px;

            .filter-label {
              font-size: 14px;
              color: #606266;
              font-weight: 500;
            }

            :deep(.el-checkbox-group) {
              display: flex;
              align-items: center;
              gap: 16px;

              .el-checkbox {
                margin: 0;

                .el-checkbox__label {
                  font-size: 14px;
                  color: #606266;
                  padding-left: 8px;
                }
              }
            }
          }

          .current-date-text {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }
      }

      .calendar-view {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: white;

        &.month-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          padding: 0;

          .month-calendar {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;

            .month-header {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              background: #fafafa;
              border-bottom: 2px solid #ebeef5;
              flex-shrink: 0;

              .month-header-cell {
                padding: 12px;
                text-align: center;
                font-weight: 600;
                color: #606266;
                font-size: 14px;
                border-right: 1px solid #ebeef5;

                &:last-child {
                  border-right: none;
                }
              }
            }

            .month-body {
              flex: 1;
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              grid-template-rows: repeat(6, 1fr);
              height: 100%;
              overflow: hidden;
              border: 1px solid #ebeef5;
              border-top: none;

              .month-day-cell {
                border-right: 1px solid #ebeef5;
                border-bottom: 1px solid #ebeef5;
                min-height: 0;
                min-width: 0;
                overflow: hidden;
                position: relative;
                background: white;

                &:nth-child(7n) {
                  border-right: none;
                }

                &:nth-child(n + 36) {
                  border-bottom: none;
                }

                &.is-today {
                  background: #f0f9ff;

                  .calendar-day {
                    .day-header {
                      .day-number {
                        color: #1890ff;
                        font-weight: 600;
                      }
                    }
                  }
                }

                &.is-other-month {
                  background: #fafafa;
                  opacity: 0.6;
                }

                .calendar-day {
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  padding: 8px;
                  box-sizing: border-box;
                  overflow: hidden;

                  .day-header {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 4px;
                    flex-shrink: 0;
                    width: 100%;

                    .day-number {
                      font-size: 14px;
                      font-weight: normal;
                      line-height: 1.2;
                      color: #303133;
                    }

                    .lunar-date {
                      font-size: 10px;
                      color: #909399;
                      line-height: 1.2;
                    }
                  }

                  .day-events {
                    flex: 1;
                    min-height: 0;
                    width: 100%;
                    overflow-y: auto;
                    overflow-x: hidden;
                    box-sizing: border-box;

                    &::-webkit-scrollbar {
                      width: 4px;
                    }

                    &::-webkit-scrollbar-track {
                      background: transparent;
                    }

                    &::-webkit-scrollbar-thumb {
                      background: #c0c4cc;
                      border-radius: 2px;

                      &:hover {
                        background: #909399;
                      }
                    }

                    .event-item {
                      background-color: #e6f7ff;
                      color: #1890ff;
                      border-radius: 3px;
                      padding: 2px 4px;
                      margin-bottom: 2px;
                      font-size: 11px;
                      cursor: pointer;
                      width: 100%;
                      max-width: 100%;
                      display: flex;
                      align-items: center;
                      gap: 2px;
                      overflow: hidden;
                      line-height: 1.2;
                      min-height: 18px;
                      box-sizing: border-box;
                      position: relative;
                      flex-shrink: 0;

                      &.type-visit {
                        background-color: #f6ffed;
                        color: #52c41a;
                      }

                      &.type-contract-expiry {
                        background-color: #fff7e6;
                        color: #e6a23c;
                        border-left: 3px solid #e6a23c;
                      }

                      &.type-opportunity-close {
                        background-color: #e6f7ff;
                        color: #409eff;
                        border-left: 3px solid #409eff;
                      }

                      &.status-planned {
                        background-color: #e6f7ff;
                        color: #1890ff;
                      }

                      &.status-in-progress {
                        background-color: #fffbe6;
                        color: #faad14;
                      }

                      &.status-completed {
                        background-color: #f6ffed;
                        color: #52c41a;
                      }

                      &.status-cancelled {
                        background-color: #fff0f6;
                        color: #eb2f96;
                      }

                      &:hover {
                        opacity: 0.8;
                      }

                      .event-avatar {
                        flex-shrink: 0;
                        flex-grow: 0;
                        width: 12px;
                        height: 12px;
                        min-width: 12px;
                        :deep(.el-avatar) {
                          width: 12px !important;
                          height: 12px !important;
                          line-height: 12px;
                          font-size: 8px;
                        }
                      }

                      .event-time {
                        font-weight: bold;
                        font-size: 10px;
                        flex-shrink: 0;
                        white-space: nowrap;
                      }

                      .event-type-icon {
                        font-size: 12px;
                        flex-shrink: 0;
                      }

                      .event-title-text {
                        flex: 1 1 0;
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        line-height: 1.2;
                        display: block;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        &.week-view {
          display: flex;
          flex-direction: column;
          height: 100%;

          .week-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 2px solid #ebeef5;
            background: #fafafa;

            .week-day-header {
              padding: 12px;
              text-align: center;
              border-right: 1px solid #ebeef5;

              &:last-child {
                border-right: none;
              }

              &.is-today {
                background: #e6f7ff;
                color: #1890ff;
              }

              .day-name {
                font-size: 12px;
                color: #909399;
                margin-bottom: 4px;
              }

              .day-date {
                font-size: 18px;
                font-weight: 600;
              }
            }
          }

          .week-body {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            overflow-y: auto;

            .week-day-column {
              border-right: 1px solid #ebeef5;
              border-bottom: 1px solid #ebeef5;
              min-height: 100%;
              padding: 10px 8px;
              background: #fafafa;

              &:last-child {
                border-right: none;
              }

              &.is-today {
                background: #f0f9ff;
                border-left: 3px solid #1890ff;
                padding-left: 5px;
              }

              .day-events {
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-height: 0;

                // 周视图专用事件样式
                .event-item {
                  margin-bottom: 0;
                  padding: 10px 12px;
                  border-left: 3px solid;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                  transition: all 0.2s ease;
                  border-radius: 4px;
                  background: white;
                  white-space: normal;
                  overflow: visible;
                  font-size: 12px;
                  line-height: 1.5;

                  // 活动类型颜色（左边框）
                  &.type-call {
                    background-color: #e6f4ff;
                    color: #1890ff;
                    border-left-color: #409eff;
                  }

                  &.type-meeting {
                    background-color: #f0f9ff;
                    color: #52c41a;
                    border-left-color: #67c23a;
                  }

                  &.type-email {
                    background-color: #f5f5f5;
                    color: #606266;
                    border-left-color: #909399;
                  }

                  &.type-task {
                    background-color: #fff7e6;
                    color: #fa8c16;
                    border-left-color: #e6a23c;
                  }

                  &.type-note {
                    background-color: #f9f0ff;
                    color: #722ed1;
                    border-left-color: #9c27b0;
                  }

                  &.type-visit {
                    background-color: #fff1f0;
                    color: #f5222d;
                    border-left-color: #f56c6c;
                  }

                  // 状态颜色（覆盖类型颜色）
                  &.status-planned {
                    background-color: #e6f4ff;
                    color: #1890ff;
                    border-left-color: #409eff;
                  }

                  &.status-in-progress {
                    background-color: #fff7e6;
                    color: #fa8c16;
                    border-left-color: #faad14;
                  }

                  &.status-completed {
                    background-color: #f6ffed;
                    color: #52c41a;
                    border-left-color: #67c23a;
                  }

                  &.status-cancelled {
                    background-color: #fff0f6;
                    color: #eb2f96;
                    border-left-color: #f5222d;
                  }

                  &:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
                    transform: translateX(2px);
                  }

                  .event-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 6px;
                  }

                  .event-avatar {
                    flex-shrink: 0;
                  }

                  .event-time {
                    font-size: 11px;
                    font-weight: 600;
                    opacity: 0.75;
                    letter-spacing: 0.3px;
                  }

                  .event-title {
                    font-size: 12px;
                    line-height: 1.5;

                    .event-type-icon {
                      font-size: 14px;
                    }

                    span {
                      font-weight: 500;
                    }
                  }
                }
              }
            }
          }
        }

        &.day-view {
          display: flex;
          flex-direction: column;
          height: 100%;

          .day-header {
            padding: 16px 20px;
            border-bottom: 2px solid #ebeef5;
            background: #fafafa;
            text-align: center;

            .day-name {
              font-size: 14px;
              color: #909399;
              margin-bottom: 4px;
            }

            .day-date {
              font-size: 20px;
              font-weight: 600;
              color: #303133;
            }
          }

          .day-body {
            flex: 1;
            overflow-y: auto;

            .time-slots {
              .time-slot {
                display: flex;
                border-bottom: 1px solid #ebeef5;
                min-height: 80px;
                background: white;
                transition: background-color 0.2s;

                &:hover {
                  background: #fafafa;
                }

                .time-label {
                  width: 90px;
                  padding: 12px 16px;
                  font-size: 13px;
                  color: #606266;
                  text-align: right;
                  border-right: 2px solid #ebeef5;
                  background: #fafafa;
                  flex-shrink: 0;
                  font-weight: 500;
                }

                .time-content {
                  flex: 1;
                  padding: 8px 16px;
                  position: relative;
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  background: white;

                  // 日视图专用事件样式
                  .event-item {
                    margin-bottom: 0;
                    padding: 12px 14px;
                    border-left: 4px solid;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                    transition: all 0.2s ease;
                    border-radius: 6px;
                    background: white;
                    white-space: normal;
                    overflow: visible;
                    font-size: 14px;
                    line-height: 1.6;

                    // 活动类型颜色（左边框）
                    &.type-call {
                      background-color: #e6f4ff;
                      color: #1890ff;
                      border-left-color: #409eff;
                    }

                    &.type-meeting {
                      background-color: #f0f9ff;
                      color: #52c41a;
                      border-left-color: #67c23a;
                    }

                    &.type-email {
                      background-color: #f5f5f5;
                      color: #606266;
                      border-left-color: #909399;
                    }

                    &.type-task {
                      background-color: #fff7e6;
                      color: #fa8c16;
                      border-left-color: #e6a23c;
                    }

                    &.type-note {
                      background-color: #f9f0ff;
                      color: #722ed1;
                      border-left-color: #9c27b0;
                    }

                    &.type-visit {
                      background-color: #fff1f0;
                      color: #f5222d;
                      border-left-color: #f56c6c;
                    }

                    // 状态颜色（覆盖类型颜色）
                    &.status-planned {
                      background-color: #e6f4ff;
                      color: #1890ff;
                      border-left-color: #409eff;
                    }

                    &.status-in-progress {
                      background-color: #fff7e6;
                      color: #fa8c16;
                      border-left-color: #faad14;
                    }

                    &.status-completed {
                      background-color: #f6ffed;
                      color: #52c41a;
                      border-left-color: #67c23a;
                    }

                    &.status-cancelled {
                      background-color: #fff0f6;
                      color: #eb2f96;
                      border-left-color: #f5222d;
                    }

                    &:hover {
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                      transform: translateX(3px);
                    }

                    .event-header {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      margin-bottom: 8px;
                    }

                    .event-avatar {
                      flex-shrink: 0;
                    }

                    .event-time {
                      font-size: 12px;
                      font-weight: 600;
                      opacity: 0.8;
                      letter-spacing: 0.3px;
                    }

                    .event-title {
                      font-size: 14px;
                      line-height: 1.6;

                      .event-type-icon {
                        font-size: 16px;
                      }

                      span {
                        font-weight: 500;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  :deep(.el-calendar) {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 4px;
    border: none;

    .el-calendar__header {
      padding: 10px 20px;
      border-bottom: 1px solid #ebeef5;
      flex-shrink: 0;
      display: none; // 隐藏默认头部，使用自定义工具栏
    }

    .el-calendar__body {
      padding: 10px 20px 20px;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .el-calendar-table {
      flex: 1;
      display: table;
      table-layout: fixed;
      width: 100%;
      height: 100% !important;
      max-height: 100% !important;
      border-collapse: collapse;
      border-spacing: 0;
      overflow: hidden;

      thead {
        display: table-header-group;

      tr {
          display: table-row;
          height: 50px; // 固定表头高度
      }

      th {
          display: table-cell;
        padding: 10px 0;
        color: #606266;
        font-weight: 500;
          text-align: center;
          width: calc(100% / 7);
          box-sizing: border-box;
          border: none;
          height: 50px; // 固定表头单元格高度
        }
      }

      tbody {
        display: table-row-group;
        height: calc(100% - 50px) !important; // 减去表头高度
        max-height: calc(100% - 50px) !important;
        overflow: hidden;

        tr {
          display: table-row;
          height: calc((100% - 50px) / 6) !important; // 6行平均分配，使用!important确保生效
          max-height: calc((100% - 50px) / 6) !important; // 限制最大高度
          min-height: calc((100% - 50px) / 6) !important; // 限制最小高度，确保等分
          overflow: hidden;

          td {
            display: table-cell;
            width: calc(100% / 7);
            vertical-align: top;
            box-sizing: border-box;
            border-right: 1px solid #ebeef5;
            border-bottom: 1px solid #ebeef5;
            padding: 0 !important;
            height: calc((100% - 50px) / 6) !important; // 与tr高度一致
            max-height: calc((100% - 50px) / 6) !important; // 限制最大高度
            min-height: calc((100% - 50px) / 6) !important; // 限制最小高度
            overflow: hidden !important; // 防止内容溢出
            position: relative;

            &:last-child {
              border-right: none;
            }
          }
        }
      }
    }

    .el-calendar-day {
      height: 100% !important;
      max-height: 100% !important;
      min-height: 0 !important;
      padding: 8px;
      box-sizing: border-box;
      position: relative;
      vertical-align: top;
      display: flex !important;
      flex-direction: column;
      width: 100%;
      margin: 0 !important;
      overflow: hidden !important; // 防止内容溢出
    }


    .current .calendar-day {
      color: #303133;
    }

    .prev,
    .next {
      .calendar-day {
        color: #c0c4cc;
      }
    }
  }

  .calendar-day {
    height: 100% !important;
    max-height: 100% !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column;
    align-items: flex-start;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden !important; // 防止内容溢出
    position: relative;

    .day-header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-bottom: 4px;
      width: 100%;
      flex-shrink: 0; // 防止被压缩
    }

    .day-number {
      font-size: 14px;
      font-weight: normal;
      line-height: 1.2;
    }

    .lunar-date {
      font-size: 10px;
      color: #909399;
      line-height: 1.2;
    }

    .day-events {
      width: 100%;
      flex: 1;
      min-height: 0 !important;
      min-width: 0;
      max-height: 100% !important; // 限制最大高度
      overflow-y: auto !important;
      overflow-x: hidden !important;
      box-sizing: border-box;
      position: relative;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #c0c4cc;
        border-radius: 2px;

        &:hover {
          background: #909399;
        }
      }

      // 月视图事件样式（保持原样，紧凑样式）
      .event-item {
        background-color: #e6f7ff;
        color: #1890ff;
        border-radius: 3px;
        padding: 2px 4px;
        margin-bottom: 2px;
        font-size: 11px;
        cursor: pointer;
        width: 100%;
        max-width: 100%;
        display: flex;
        align-items: center;
        gap: 2px;
        overflow: hidden;
        line-height: 1.2;
        min-height: 18px;
        box-sizing: border-box;
        position: relative;

        &.type-visit {
          background-color: #f6ffed;
          color: #52c41a;
        }

        &.type-contract-expiry {
          background-color: #fff7e6;
          color: #e6a23c;
          border-left: 3px solid #e6a23c;
        }

        &.type-opportunity-close {
          background-color: #e6f7ff;
          color: #409eff;
          border-left: 3px solid #409eff;
        }

        &.status-planned {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        &.status-in-progress {
          background-color: #fffbe6;
          color: #faad14;
        }

        &.status-completed {
          background-color: #f6ffed;
          color: #52c41a;
        }

        &.status-cancelled {
          background-color: #fff0f6;
          color: #eb2f96;
        }

        &:hover {
          opacity: 0.8;
        }

        .event-avatar {
          flex-shrink: 0;
          flex-grow: 0;
          width: 12px;
          height: 12px;
          min-width: 12px;
          :deep(.el-avatar) {
            width: 12px !important;
            height: 12px !important;
            line-height: 12px;
            font-size: 8px;
          }
        }

        .event-time {
          font-weight: bold;
          font-size: 10px;
          flex-shrink: 0;
          flex-grow: 0;
          white-space: nowrap;
          line-height: 1;
          width: 35px;
          min-width: 35px;
        }

          .event-type-icon {
          font-size: 10px;
            flex-shrink: 0;
          flex-grow: 0;
          line-height: 1;
          width: 10px;
          min-width: 10px;
          }

        .event-title-text {
          flex: 1 1 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
          display: block;
        }
      }
    }
  }

  .event-detail {
    padding: 10px 0;
  }
}

</style>

