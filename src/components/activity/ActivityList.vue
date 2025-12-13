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
        <el-timeline>
          <el-timeline-item
            v-for="act in group.items"
            :key="act.id"
            :timestamp="formatTime(act.actualStartTime || act.plannedStartTime || act.createdAt)"
            :type="getStatusType(act.status)"
            :icon="getTypeIcon(act.type)"
            size="large"
            placement="top"
            @mouseenter="hoveredActivityId = act.id"
            @mouseleave="hoveredActivityId = ''"
          >
            <div class="content-card">
                <div class="line1">
                  <div class="user-avatar">
                    <img
                      v-if="getUserAvatar(act.owner) && !avatarErrorMap[act.id]"
                      :src="getUserAvatar(act.owner)"
                      :alt="getUserName(act.owner)"
                      class="avatar-img"
                      @error="handleAvatarError(act.id)"
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
                    <!-- 状态标签 -->
                    <el-tag
                      size="small"
                      class="status-tag"
                      :type="getStatusType(act.status)"
                    >{{ getStatusName(act.status) }}</el-tag>
                    <!-- 地点信息 -->
                    <div v-if="act.location" class="info-item">
                      <el-icon class="info-icon"><Location /></el-icon>
                      <span class="info-text">{{ act.location }}</span>
                    </div>
                    <!-- 时长信息 -->
                    <div v-if="getActivityDuration(act)" class="info-item">
                      <el-icon class="info-icon"><Clock /></el-icon>
                      <span class="info-text">{{ getActivityDuration(act) }}</span>
                    </div>
                    <!-- 优先级标签 -->
                    <el-tag
                      size="small"
                      :type="getPriorityType(act.priority)"
                      effect="plain"
                    >
                      {{ getPriorityName(act.priority) }}
                    </el-tag>
                  </div>
                </div>
                <div class="line3 title-line">{{ act.title }}</div>
                <div v-if="act.description" class="desc-line">{{ act.description }}</div>

                <!-- 进行中的活动附件上传 -->
                <template v-if="act.status === 'in_progress' && isOwner(act)">
                  <div class="attachments-section">
                    <div class="attachments-header">
                      <span class="label">附件：</span>
                      <el-upload
                        :action="uploadAction"
                        :headers="uploadHeaders"
                        :file-list="getActivityAttachmentList(act.id)"
                        :on-success="(response: any, file: UploadFile) => handleActivityAttachmentSuccess(act.id, response, file)"
                        :on-remove="(file: UploadFile) => handleActivityAttachmentRemove(act.id, file)"
                        :before-upload="beforeUpload"
                        multiple
                        list-type="text"
                        :show-file-list="false"
                      >
                        <el-button type="primary" size="small" :icon="Paperclip">上传附件</el-button>
                      </el-upload>
                    </div>
                    <!-- 附件列表 -->
                    <div v-if="getActivityAttachments(act.id).length > 0" class="attachments-list">
                      <div
                        v-for="(attachment, index) in getActivityAttachments(act.id)"
                        :key="index"
                        class="attachment-item"
                      >
                        <el-link
                          :href="attachment.url"
                          target="_blank"
                          type="primary"
                          :icon="Download"
                        >
                          {{ getAttachmentName(attachment) }}
                        </el-link>
                        <el-button
                          type="danger"
                          size="small"
                          text
                          :icon="Delete"
                          @click="removeActivityAttachment(act.id, attachment.url)"
                          style="margin-left: 8px;"
                        >
                          删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                </template>

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
                  <!-- 附件列表 -->
                  <div v-if="act.attachments && act.attachments.length > 0" class="attachments-line">
                    <span class="label">附件：</span>
                    <div class="attachments-list">
                      <el-link
                        v-for="(attachment, index) in act.attachments"
                        :key="index"
                        :href="typeof attachment === 'string' ? attachment : attachment.url"
                        target="_blank"
                        type="primary"
                        :icon="Download"
                        style="margin-right: 12px; margin-bottom: 4px;"
                      >
                        {{ getAttachmentName(typeof attachment === 'string' ? { url: attachment } : attachment) }}
                      </el-link>
                    </div>
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
            </el-timeline-item>
          </el-timeline>
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
    <el-dialog v-model="completeDialog.visible" title="完成活动" width="600px">
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
        <el-form-item label="附件">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            :file-list="completeDialog.attachmentList"
            :on-success="handleAttachmentSuccess"
            :on-remove="handleAttachmentRemove"
            :before-upload="beforeUpload"
            multiple
            list-type="text"
          >
            <el-button type="primary" :icon="Paperclip">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持PDF、Word、Excel、图片等格式，单个文件不超过10MB</div>
            </template>
          </el-upload>
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
import { Plus, Search, Refresh, Phone, VideoCamera, Message, EditPen, Document, Location, Clock, Paperclip, Download, Delete, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadProps } from 'element-plus'
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

// 活动附件管理（用于进行中的活动）
const activityAttachments = ref<Record<string, UploadFile[]>>({})

// 头像加载错误记录
const avatarErrorMap = ref<Record<string, boolean>>({})

// 附件信息接口
interface AttachmentInfo {
  url: string
  originalname?: string
  filename?: string
}

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
const completeDialog = reactive<{
  visible: boolean
  id: string
  outcome: string
  content: string
  attachmentList: UploadFile[]
}>({
  visible: false,
  id: '',
  outcome: '',
  content: '',
  attachmentList: [],
})

// 上传地址
const uploadAction = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  return `${baseURL}/upload`
})

// 上传请求头（包含认证token）
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

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
  // 优先从 user 对象获取，其次从 owner 直接获取
  const user = owner.user || owner
  const avatar = user?.avatar || owner.avatar || null
  // 如果是相对路径，可能需要拼接 baseURL，但先返回原始值
  return avatar
}

// 处理头像加载错误
const handleAvatarError = (activityId: string) => {
  avatarErrorMap.value[activityId] = true
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
        (x, y) => {
          // 按时间从早到晚排序（时间线从上到下）
          const xTime = new Date(x.actualStartTime || x.plannedStartTime || x.createdAt).getTime()
          const yTime = new Date(y.actualStartTime || y.plannedStartTime || y.createdAt).getTime()
          return xTime - yTime
        },
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
    wechat: '微信',
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
    wechat: 'success',
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
    wechat: ChatDotRound,
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
    // 重置头像错误记录
    avatarErrorMap.value = {}
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
            // 优先从 user 对象获取头像，其次从 owner 直接获取
            avatar: a.owner.user?.avatar || a.owner.avatar || null,
            user: a.owner.user, // 保留完整的user对象，以便访问avatar
          }
        : a.ownerUsername || a.ownerName
          ? { id: a.ownerId || undefined, username: a.ownerUsername || a.ownerName, avatar: null }
          : null,
    }))

    // 初始化进行中活动的附件列表
    list.forEach((a: Activity) => {
      if (a.status === 'in_progress' && a.attachments && a.attachments.length > 0) {
        activityAttachments.value[a.id] = a.attachments.map((att: string | AttachmentInfo, index: number) => {
          const url = typeof att === 'string' ? att : att.url
          const originalname = typeof att === 'string' ? undefined : att.originalname
          return {
            name: originalname || getAttachmentName(typeof att === 'string' ? { url: att } : att),
            url,
            status: 'success',
            uid: Date.now() + index,
            response: originalname ? { data: { url, originalname } } : { data: { url } },
          } as UploadFile
        })
      }
    })

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
  completeDialog.attachmentList = []
}

// 获取附件名称
const getAttachmentName = (attachment: string | AttachmentInfo) => {
  if (typeof attachment === 'string') {
    // 兼容旧格式（纯URL字符串）
    if (!attachment) return '附件'
    const parts = attachment.split('/')
    return parts[parts.length - 1] || '附件'
  }

  // 新格式（AttachmentInfo对象）
  if (!attachment || !attachment.url) return '附件'

  // 优先使用 originalname，其次使用 filename，最后从 URL 提取
  if (attachment.originalname) {
    let name = attachment.originalname
    // 尝试处理可能的编码问题
    try {
      // 如果文件名包含非ASCII字符，可能是编码问题
      // 尝试从 latin1 解码（multer 可能使用 latin1 编码）
      if (/[^\x00-\x7F]/.test(name) && !/[\u4e00-\u9fa5]/.test(name)) {
        // 看起来可能是 latin1 编码的中文，尝试解码
        const decoded = decodeURIComponent(escape(name))
        if (/[\u4e00-\u9fa5]/.test(decoded)) {
          name = decoded
        }
      }
    } catch {
      // 如果解码失败，使用原始值
    }
    return name
  }

  if (attachment.filename) {
    return attachment.filename
  }

  // 从 URL 提取文件名
  const parts = attachment.url.split('/')
  return parts[parts.length - 1] || '附件'
}

// 上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传PDF、Word、Excel、图片或文本文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

// 附件上传成功
const handleAttachmentSuccess: UploadProps['onSuccess'] = (response: any, file: UploadFile) => {
  const url = response?.data?.url || response?.url || response
  if (url) {
    file.url = url
    ElMessage.success('附件上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 附件移除
const handleAttachmentRemove: UploadProps['onRemove'] = () => {
  // 附件列表会自动更新
}

// 获取活动的附件列表（用于上传组件）
const getActivityAttachmentList = (activityId: string): UploadFile[] => {
  return activityAttachments.value[activityId] || []
}

// 获取活动的附件信息列表
const getActivityAttachments = (activityId: string): AttachmentInfo[] => {
  const files = activityAttachments.value[activityId] || []
  return files
    .map((file) => {
      const resp = (file.response as { data?: { url?: string; originalname?: string; filename?: string }; url?: string; originalname?: string } | string) || {}
      const url = typeof resp === 'object' && resp !== null
        ? (resp.data?.url || (resp as { url?: string }).url)
        : typeof resp === 'string' ? resp : undefined
      const originalname = typeof resp === 'object' && resp !== null
        ? (resp.data?.originalname || (resp as { originalname?: string }).originalname)
        : undefined
      const filename = typeof resp === 'object' && resp !== null
        ? (resp.data?.filename || (resp as { filename?: string }).filename)
        : undefined

      const attachment: AttachmentInfo = {
        url: file.url || url || '',
      }
      if (file.name || originalname) {
        attachment.originalname = file.name || originalname
      }
      if (filename) {
        attachment.filename = filename
      }
      return attachment
    })
    .filter((att) => Boolean(att.url))
}

// 活动附件上传成功
const handleActivityAttachmentSuccess = async (activityId: string, response: unknown, file: UploadFile) => {
  const resp = response as { data?: { url?: string; originalname?: string; filename?: string }; url?: string; originalname?: string } | string | null
  const url = resp && typeof resp === 'object'
    ? (resp.data?.url || resp.url)
    : typeof resp === 'string' ? resp : undefined
  if (url) {
    file.url = url
    file.response = resp

    // 保存原文件名
    const originalname = resp && typeof resp === 'object'
      ? (resp.data?.originalname || resp.originalname)
      : undefined
    if (originalname) {
      // 如果 originalname 存在，更新 file.name
      file.name = originalname
    }

    if (!activityAttachments.value[activityId]) {
      activityAttachments.value[activityId] = []
    }
    // 检查是否已存在相同的附件
    const existingUrl = activityAttachments.value[activityId].find(f => {
      const fUrl = f.url || (typeof f.response === 'object' && f.response !== null
        ? ((f.response as { data?: { url?: string } }).data?.url || (f.response as { url?: string }).url)
        : typeof f.response === 'string' ? f.response : undefined)
      return fUrl === url
    })
    if (!existingUrl) {
      activityAttachments.value[activityId].push(file)
    }
    ElMessage.success('附件上传成功')

    // 更新活动记录（异步，不阻塞UI显示）
    updateActivityAttachments(activityId).catch(error => {
      console.error('更新活动附件失败:', error)
      // 即使更新失败，附件列表仍然显示，用户可以重试
    })
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 活动附件移除
const handleActivityAttachmentRemove = async (activityId: string, file: UploadFile) => {
  if (activityAttachments.value[activityId]) {
    const resp = (file.response as { data?: { url?: string }; url?: string } | string) || {}
    const url = file.url || (typeof resp === 'object' && resp !== null
      ? (resp.data?.url || (resp as { url?: string }).url)
      : typeof resp === 'string' ? resp : undefined)
    activityAttachments.value[activityId] = activityAttachments.value[activityId].filter(
      (f) => {
        const fResp = (f.response as { data?: { url?: string }; url?: string } | string) || {}
        const fUrl = f.url || (typeof fResp === 'object' && fResp !== null
          ? (fResp.data?.url || (fResp as { url?: string }).url)
          : typeof fResp === 'string' ? fResp : undefined)
        return fUrl !== url
      }
    )
    // 更新活动记录
    await updateActivityAttachments(activityId)
  }
}

// 删除活动附件
const removeActivityAttachment = async (activityId: string, attachmentUrl: string) => {
  if (activityAttachments.value[activityId]) {
    activityAttachments.value[activityId] = activityAttachments.value[activityId].filter(
      (f) => {
        const fUrl = f.url || (f.response as any)?.data?.url || (f.response as any)?.url || f.response
        return fUrl !== attachmentUrl
      }
    )
    // 更新活动记录
    await updateActivityAttachments(activityId)
  }
}

// 更新活动附件
const updateActivityAttachments = async (activityId: string) => {
  try {
    const attachmentInfos = getActivityAttachments(activityId)
    // 保存附件信息（包含URL和原文件名）
    const attachments = attachmentInfos.map(att => ({
      url: att.url,
      originalname: att.originalname,
    }))
    await activityApi.update(activityId, { attachments: attachments.map(a => a.url) })
    // 更新活动对象中的附件列表，使其与 activityAttachments 同步
    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      // 保存完整的附件信息
      activity.attachments = attachments as any
    }
    // 不刷新整个列表，只更新当前活动的附件数据，避免UI闪烁
  } catch (error) {
    console.error('更新活动附件失败:', error)
    ElMessage.error('更新附件失败')
    // 如果更新失败，可以选择刷新列表以恢复状态
    await refreshActivities()
  }
}

// 提交完成
const submitComplete = async () => {
  try {
    // 收集附件URL列表
    const attachments = completeDialog.attachmentList
      .map((file) => {
        const resp: any = file.response || {}
        return file.url || resp.data?.url || resp.url || resp
      })
      .filter(Boolean)

    await activityApi.complete(completeDialog.id, completeDialog.outcome, attachments.length > 0 ? attachments : undefined)
    ElMessage.success('已完成活动')
    completeDialog.visible = false
    completeDialog.outcome = ''
    completeDialog.content = ''
    completeDialog.attachmentList = []
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

      :deep(.el-timeline) {
        padding-left: 0;

        .el-timeline-item {
          padding-bottom: 20px;

          &:last-child {
            padding-bottom: 0;

            :deep(.el-timeline-item__tail) {
              display: none;
            }
          }
        }
      }

      .content-card {
        position: relative;
        padding: 16px;
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
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
            flex-wrap: wrap;

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

            .status-tag {
              margin-left: 0;
            }

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
        .content-line,
        .attachments-line,
        .attachments-section {
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

        .content-line {
          .value {
            white-space: pre-line;
            word-wrap: break-word;
            word-break: break-all;
          }
        }

        .attachments-line,
        .attachments-section {
          .attachments-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }
        }

        .attachments-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;

          .attachments-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .attachment-item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
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
</style>

