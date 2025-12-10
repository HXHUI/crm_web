<template>
  <div class="activity-list">
    <!-- 活动筛选工具栏和新建按钮 -->
    <div class="activity-toolbar" style="margin-bottom: 16px">
      <div>
        <el-input
          v-model="filters.keyword"
          placeholder="搜索标题/描述"
          clearable
          style="width: 220px"
          @keyup.enter="refreshActivities"
        />
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          style="width: 140px"
          @change="refreshActivities"
        >
          <el-option
            v-for="s in statusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
        <el-select
          v-model="filters.ownerId"
          placeholder="负责人(全部)"
          clearable
          filterable
          style="width: 180px"
          :loading="assigneeLoading"
          @visible-change="(v: boolean) => { if (v) loadAssignees() }"
          @change="refreshActivities"
        >
          <el-option :label="'全部'" :value="''" />
          <el-option
            v-for="m in assigneeOptions"
            :key="m.id"
            :label="m.name"
            :value="m.id"
          />
        </el-select>
        <el-button :icon="Search" @click="refreshActivities">查询</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建</el-button>
    </div>

    <div v-if="groupedActivities.length === 0" class="empty-timeline">
      <el-empty description="暂无活动记录" />
    </div>
    <div v-else class="activity-groups">
      <div
        v-for="group in groupedActivities"
        :key="group.date"
        class="activity-group"
      >
        <div class="group-header">{{ group.date }}</div>
        <div class="group-items">
          <div
            v-for="act in group.items"
            :key="act.id"
            class="group-item"
            @mouseenter="hoveredActivityId = act.id"
            @mouseleave="hoveredActivityId = ''"
          >
            <div class="line1">
              <div class="user-avatar">
                <img
                  v-if="getUserAvatar(act.owner)"
                  :src="getUserAvatar(act.owner)"
                  :alt="getUserName(act.owner)"
                  class="avatar-img"
                />
                <span v-else class="avatar-text">
                  {{ getSurname(act.owner) }}
                </span>
              </div>
              <div class="user-info">
                <span class="user-name">{{
                  (act as any).ownerDisplay || getUserName((act as any).owner)
                }}</span>
                <el-tag
                  class="activity-type"
                  size="small"
                  :type="getTypeColor(act.type)"
                  effect="dark"
                >
                  <el-icon class="type-icon" style="margin-right: 4px">
                    <component :is="getTypeIcon(act.type)" />
                  </el-icon>
                  {{ getTypeName(act.type) }}
                </el-tag>
              </div>
            </div>
            <div class="line2">
              {{ formatTime(act.actualStartTime || act.plannedStartTime || act.createdAt) }}
              <el-tag
                size="small"
                class="status-tag"
                :type="getStatusType(act.status)"
                style="margin-left: 8px"
              >{{ getStatusName(act.status) }}</el-tag>
            </div>
            <div class="line3 title-line">{{ act.title }}</div>
            <div v-if="act.description" class="desc-line">{{ act.description }}</div>

            <!-- 活动信息：地点、时长、优先级 -->
            <div class="activity-info">
              <div v-if="act.location" class="info-item">
                <el-icon class="info-icon"><Location /></el-icon>
                <span class="info-text">{{ act.location }}</span>
              </div>
              <div v-if="getActivityDuration(act)" class="info-item">
                <el-icon class="info-icon"><Clock /></el-icon>
                <span class="info-text">{{ getActivityDuration(act) }}</span>
              </div>
              <div class="info-item">
                <el-tag
                  size="small"
                  :type="getPriorityType(act.priority)"
                  effect="plain"
                >
                  {{ getPriorityName(act.priority) }}
                </el-tag>
              </div>
            </div>

            <!-- 完成结果和完成笔记（仅已完成的活动显示） -->
            <template v-if="act.status === 'completed'">
              <div v-if="act.outcome" class="outcome-line">
                <span class="label">完成结果：</span>
                <span class="value">{{ act.outcome }}</span>
              </div>
              <div v-if="act.content" class="content-line">
                <span class="label">完成笔记：</span>
                <span class="value">{{ act.content }}</span>
              </div>
            </template>

            <div
              class="activity-actions"
              :class="{ visible: hoveredActivityId === act.id }"
            >
              <template v-if="act.status === 'planned' && isOwner(act)">
                <el-button type="primary" size="small" @click="startActivity(act)">开始</el-button>
              </template>
              <template v-else-if="act.status === 'in_progress' && isOwner(act)">
                <el-button type="success" size="small" @click="openCompleteDialog(act)">完成</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建活动弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建活动"
      width="800px"
      :close-on-click-modal="false"
    >
      <ActivityForm
        ref="activityFormRef"
        :default-related-to-type="relatedToType"
        :default-related-to-id="relatedToId"
        @submit="handleSubmit"
        @cancel="createDialogVisible = false"
      />
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleFormSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 完成活动弹窗 -->
    <el-dialog v-model="completeDialog.visible" title="完成活动" width="480px">
      <el-form :model="completeDialog" label-width="100px">
        <el-form-item label="完成结果">
          <el-input
            v-model="completeDialog.outcome"
            type="textarea"
            :rows="3"
            placeholder="请输入完成结果"
          />
        </el-form-item>
        <el-form-item label="完成笔记">
          <el-input
            v-model="completeDialog.content"
            type="textarea"
            :rows="3"
            placeholder="可记录完成细节"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Plus, Search, Refresh, Phone, VideoCamera, Message, EditPen, Document, Location, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import activityApi, { type Activity, type CreateActivityDto, type UpdateActivityDto } from '@/api/activity'
import ActivityForm from './ActivityForm.vue'
import { useAuthStore } from '@/stores/modules/auth'
import { getDepartmentMembers, getDepartmentTree, type Department, type Member } from '@/api/department'

interface Props {
  // 关联类型
  relatedToType: 'customer' | 'contact' | 'opportunity' | 'lead'
  // 关联对象ID
  relatedToId: string
  // 是否自动加载（默认true）
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true,
})

const emit = defineEmits<{
  refresh: []
}>()

const authStore = useAuthStore()
const activities = ref<Activity[]>([])
const hoveredActivityId = ref<string>('')
const filters = reactive<{ keyword?: string; status?: string; ownerId?: string }>({
  keyword: '',
  status: '',
  ownerId: '',
})

const statusOptions = [
  { label: '计划中', value: 'planned' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

// 负责人选项
const assigneeOptions = ref<Array<{ id: string; name: string }>>([])
const assigneeLoading = ref(false)

// 新建活动相关
const createDialogVisible = ref(false)
const activityFormRef = ref<InstanceType<typeof ActivityForm>>()
const saving = ref(false)

// 完成活动相关
const completeDialog = reactive({ visible: false, id: '', outcome: '', content: '' })

// 格式化日期（仅日期）
const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}


// 格式化时间
const formatTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取用户名
const getUserName = (owner: any) => {
  if (!owner) return '未知'
  if (typeof owner === 'string') return owner
  return owner.username || owner.nickname || owner.name || '未知'
}

// 获取用户头像
const getUserAvatar = (owner: any) => {
  if (!owner) return null
  if (typeof owner === 'string') return null
  return owner.avatar || owner.user?.avatar || null
}

// 获取姓（名字的第一个字符）
const getSurname = (owner: any) => {
  const name = getUserName(owner)
  if (!name || name === '未知') return '未'
  // 返回名字的第一个字符作为姓
  return name.charAt(0)
}

// 活动按日期分组
const groupedActivities = computed(() => {
  const acts = activities.value || []
  const map: Record<string, any[]> = {}
  acts.forEach((a) => {
    const day = formatDateOnly(a.actualStartTime || a.plannedStartTime || a.createdAt)
    // 统一owner显示字段
    ;(a as any).ownerDisplay = getUserName((a as any).owner || (a as any).ownerName || (a as any).owner_username)
    if (!map[day]) map[day] = []
    map[day].push(a)
  })
  const groups = Object.keys(map)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => ({
      date,
      items: map[date].sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      ),
    }))
  return groups
})

// 活动类型相关
const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    call: '电话',
    meeting: '会议',
    email: '邮件',
    task: '任务',
    note: '备注',
  }
  return typeMap[type] || type
}

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    call: 'primary',
    meeting: 'success',
    email: 'info',
    task: 'warning',
    note: 'default',
  }
  return colorMap[type] || 'default'
}

const getTypeIcon = (type: string) => {
  const map: Record<string, any> = {
    call: Phone,
    meeting: VideoCamera,
    email: Message,
    task: EditPen,
    note: Document,
  }
  return map[type] || Document
}

// 活动状态相关
const getStatusName = (status?: string) => {
  const map: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status || ''] || '-'
}

const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status || ''] || 'default'
}

// 判断是否是活动负责人
const isOwner = (act: Activity) => {
  const currentMemberId = (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
  return String(act.ownerId) === String(currentMemberId)
}

// 优先级相关
const getPriorityName = (priority?: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority || ''] || '中'
}

const getPriorityType = (priority?: string) => {
  const map: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger',
  }
  return map[priority || ''] || ''
}

// 计算活动时长
const getActivityDuration = (act: Activity) => {
  const startTime = act.actualStartTime || act.plannedStartTime
  const endTime = act.actualEndTime || act.plannedEndTime

  if (!startTime || !endTime) return null

  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

    if (diffMinutes < 0) return null

    if (diffMinutes < 60) {
      return `${diffMinutes}分钟`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
    } else {
      const days = Math.floor(diffMinutes / 1440)
      const hours = Math.floor((diffMinutes % 1440) / 60)
      return hours > 0 ? `${days}天${hours}小时` : `${days}天`
    }
  } catch (e) {
    return null
  }
}

// 加载活动列表
const loadActivities = async () => {
  if (!props.relatedToId) return
  try {
    const resp = await activityApi.getList({
      relatedToType: props.relatedToType,
      relatedToId: props.relatedToId,
      page: 1,
      limit: 100,
      title: filters.keyword || undefined,
      status: filters.status || undefined,
      ownerId: filters.ownerId || undefined,
    } as any)
    const list = (resp as any).data?.activities || (resp as any).data || []
    // 统一owner结构
    activities.value = list.map((a: any) => ({
      ...a,
      ownerId: a.ownerId || a.owner?.id,
      owner: a.owner
        ? {
            id: a.owner.id,
            username:
              a.owner.username ||
              a.owner.nickname ||
              a.owner.name ||
              a.ownerUsername ||
              a.ownerName ||
              '-',
            avatar: a.owner.avatar || a.owner.user?.avatar || null,
            user: a.owner.user, // 保留完整的user对象，以便访问avatar
          }
        : a.ownerUsername || a.ownerName
          ? { id: a.ownerId || undefined, username: a.ownerUsername || a.ownerName, avatar: null }
          : null,
    }))
    emit('refresh')
  } catch (e) {
    console.error('加载活动失败:', e)
  }
}

// 刷新活动
const refreshActivities = () => {
  loadActivities()
}

// 重置筛选
const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.ownerId = ''
  loadActivities()
}

// 加载负责人选项
const loadAssignees = async () => {
  if (assigneeOptions.value.length > 0) return // 已加载过
  assigneeLoading.value = true
  try {
    const memberId = (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
    if (!memberId) {
      assigneeOptions.value = []
      return
    }

    const deptTreeRes = await getDepartmentTree()
    const departmentTree = deptTreeRes.data || []

    const findDepartmentByMember = async (depts: Department[]): Promise<Department | null> => {
      for (const dept of depts) {
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members =
            membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          if (members.some((m: Member) => String(m.id) === String(memberId))) {
            return dept
          }
        } catch {
          // 忽略错误，继续遍历
        }

        if (dept.children && dept.children.length > 0) {
          const found = await findDepartmentByMember(dept.children)
          if (found) return found
        }
      }
      return null
    }

    const userDepartment = await findDepartmentByMember(departmentTree)
    const isManager = userDepartment && userDepartment.managerId && String(userDepartment.managerId) === String(memberId)

    const memberMap = new Map<string, { id: string; name: string }>()
    const getCurrentUserName = () =>
      (authStore as any)?.user?.username ||
      (authStore as any)?.user?.realName ||
      (authStore as any)?.user?.nickname ||
      '当前用户'

    if (isManager && userDepartment) {
      const collectDepartmentMembers = async (dept: Department) => {
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members =
            membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          members.forEach((m: Member) => {
            const id = String(m.id)
            if (!memberMap.has(id)) {
              memberMap.set(id, {
                id,
                name: m.user?.username || m.nickname || m.user?.realName || '未知用户',
              })
            }
          })
        } catch (error) {
          console.error(`获取部门 ${dept.name} 成员失败:`, error)
        }

        if (dept.children && dept.children.length > 0) {
          for (const child of dept.children) {
            await collectDepartmentMembers(child)
          }
        }
      }

      await collectDepartmentMembers(userDepartment)
    }

    const currentUserOption = { id: String(memberId), name: getCurrentUserName() }
    if (!memberMap.has(currentUserOption.id)) {
      memberMap.set(currentUserOption.id, currentUserOption)
    }

    assigneeOptions.value = Array.from(memberMap.values())
  } catch (error) {
    console.error('加载负责人列表失败:', error)
    const memberId = (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
    if (memberId) {
      const getCurrentUserName = () =>
        (authStore as any)?.user?.username ||
        (authStore as any)?.user?.realName ||
        (authStore as any)?.user?.nickname ||
        '当前用户'
      assigneeOptions.value = [{ id: String(memberId), name: getCurrentUserName() }]
    } else {
      assigneeOptions.value = []
    }
  } finally {
    assigneeLoading.value = false
  }
}

// 打开新建对话框
const openCreateDialog = () => {
  createDialogVisible.value = true
  if (activityFormRef.value) {
    activityFormRef.value.resetForm()
  }
}

// 处理表单提交
const handleFormSubmit = async () => {
  if (!activityFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }

  const success = await activityFormRef.value.submit()
  if (success) {
    // submit 事件会在 handleSubmit 中处理
  }
}

// 处理活动提交
const handleSubmit = async (data: CreateActivityDto | UpdateActivityDto | CreateActivityDto[]) => {
  try {
    saving.value = true

    if (Array.isArray(data)) {
      // 多负责人：创建多条活动
      const promises = data.map((activityData) => activityApi.create(activityData))
      await Promise.all(promises)
      ElMessage.success('创建活动成功')
    } else {
      // 单负责人：创建一条活动
      if (!(data as CreateActivityDto).title) {
        ElMessage.warning('活动标题不能为空')
        return
      }
      await activityApi.create(data as CreateActivityDto)
      ElMessage.success('创建活动成功')
    }

    createDialogVisible.value = false
    // 重新加载活动记录
    await loadActivities()
  } catch (error: any) {
    console.error('保存活动失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '保存失败'
    ElMessage.error(errorMessage)
  } finally {
    saving.value = false
  }
}

// 开始活动
const startActivity = async (act: Activity) => {
  try {
    await activityApi.start(act.id)
    ElMessage.success('已开始活动')
    await refreshActivities()
  } catch (e) {
    ElMessage.error('开始失败')
  }
}

// 打开完成对话框
const openCompleteDialog = (act: Activity) => {
  completeDialog.visible = true
  completeDialog.id = act.id
  completeDialog.outcome = ''
  completeDialog.content = ''
}

// 提交完成
const submitComplete = async () => {
  try {
    await activityApi.complete(completeDialog.id, completeDialog.outcome)
    ElMessage.success('已完成活动')
    completeDialog.visible = false
    await refreshActivities()
  } catch (e) {
    ElMessage.error('完成失败')
  }
}

// 监听关联ID变化
watch(
  () => props.relatedToId,
  (newId, oldId) => {
    // 只有当ID变化时才加载，避免重复加载
    if (newId && props.autoLoad && newId !== oldId) {
      loadActivities()
    }
  },
)

onMounted(() => {
  // 只在mounted时加载一次，避免与watch重复
  if (props.relatedToId && props.autoLoad) {
    loadActivities()
  }
})

// 暴露方法
defineExpose({
  loadActivities,
  refreshActivities,
})
</script>

<style lang="scss" scoped>
.activity-list {
  .activity-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;

    > div {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .empty-timeline {
    padding: 40px 0;
    text-align: center;
  }

  .activity-groups {
    .activity-group {
      margin-bottom: 24px;

      .group-header {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }

      .group-items {
        .group-item {
          position: relative;
          padding: 16px;
          background: #fff;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          margin-bottom: 12px;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .line1 {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .user-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #409eff;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 600;
              margin-right: 12px;
              overflow: hidden;
              flex-shrink: 0;

              .avatar-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .avatar-text {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              }
            }

            .user-info {
              flex: 1;
              display: flex;
              align-items: center;
              gap: 8px;

              .user-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
              }

              .activity-type {
                .type-icon {
                  font-size: 12px;
                }
              }
            }
          }

          .line2 {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;

            .status-tag {
              margin-left: 8px;
            }
          }

          .line3 {
            font-size: 14px;
            color: #303133;
            margin-bottom: 4px;

            &.title-line {
              font-weight: 500;
            }
          }

          .desc-line {
            font-size: 13px;
            color: #606266;
            margin-bottom: 8px;
            white-space: pre-line;
            word-wrap: break-word;
            word-break: break-all;
          }

          .outcome-line,
          .content-line {
            font-size: 13px;
            color: #606266;
            margin-bottom: 6px;
            line-height: 1.5;

            .label {
              color: #909399;
              font-weight: 500;
              margin-right: 4px;
            }

            .value {
              color: #303133;
            }
          }

          .activity-info {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 8px;
            flex-wrap: wrap;

            .info-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: #909399;

              .info-icon {
                font-size: 14px;
                color: #909399;
              }

              .info-text {
                color: #606266;
              }
            }
          }

          .activity-actions {
            position: absolute;
            top: 16px;
            right: 16px;
            opacity: 0;
            transition: opacity 0.3s;

            &.visible {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}
</style>

