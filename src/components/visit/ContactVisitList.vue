<template>
  <div class="contact-visit-list">
    <!-- 工具栏：新增拜访 -->
    <div class="visit-toolbar">
      <el-button
        type="primary"
        size="small"
        :disabled="!relatedToId"
        @click="openCreateDialog"
      >
        新增拜访
      </el-button>
    </div>

    <el-skeleton v-if="loading" rows="4" animated />

    <div v-else-if="visits.length === 0" class="empty-state">
      <el-empty description="暂无拜访记录" />
    </div>

    <el-timeline v-else>
      <el-timeline-item
        v-for="v in visits"
        :key="v.id"
        :timestamp="`${formatDate(v.plannedStartTime || v.actualStartTime || v.createdAt)} ${getPurposeName(v.purpose as any) || '拜访记录'}`"
        placement="top"
      >
        <div class="visit-item">
          <div class="line1">
            <div class="user-avatar">
              <img
                v-if="getUserAvatar(v.owner)"
                :src="getUserAvatar(v.owner)"
                :alt="getUserName(v.owner)"
                class="avatar-img"
              />
              <span v-else class="avatar-text">
                {{ getSurname(v.owner) }}
              </span>
            </div>
            <div class="line1-content">
              <div class="line1-top">
                <span class="owner-name">{{ getUserName(v.owner) }}</span>
                <el-tag :type="getStatusColor(v.status)" size="small">
                  {{ getStatusName(v.status) }}
                </el-tag>
                <el-tag size="small" type="info">
                  {{ getTypeName(v.type) }}
                </el-tag>
                <el-tag
                  size="small"
                  :type="getPriorityType(v.priority)"
                >
                  {{ getPriorityName(v.priority) }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="line2">
            <span class="label">拜访目的：</span>
            <span>{{ getPurposeName(v.purpose as any) || '-' }}</span>
          </div>

          <!-- 关键信息：地址 / 时长 / 优先级 -->
          <div class="info-row">
            <span class="info-item">
              <span class="label">地址：</span>
              <span class="value">
                <template v-if="v.detailAddress || (v.region && v.region.length)">
                  {{ formatAddress(v.region, v.detailAddress) }}
                </template>
                <template v-else>-</template>
              </span>
            </span>
            <span class="info-item">
              <span class="label">时长：</span>
              <span class="value">{{ getVisitDuration(v) || '-' }}</span>
            </span>
          </div>

          <div v-if="v.result" class="line2">
            <span class="label">拜访结果：</span>
            <span>{{ v.result }}</span>
          </div>
          <div v-if="v.feedback" class="line2">
            <span class="label">客户反馈：</span>
            <span>{{ v.feedback }}</span>
          </div>
          <div v-if="v.nextAction" class="line2">
            <span class="label">下一步行动：</span>
            <span>{{ v.nextAction }}</span>
          </div>

          <!-- 操作按钮：开始 / 完成 -->
          <div class="actions">
            <el-button
              v-if="v.status === 'planned'"
              type="primary"
              size="small"
              @click="handleStart(v)"
            >
              开始
            </el-button>
            <el-button
              v-if="v.status === 'planned' || v.status === 'in_progress'"
              type="success"
              size="small"
              @click="openCompleteDialog(v)"
            >
              完成
            </el-button>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>

    <!-- 新增拜访弹窗 -->
    <el-dialog v-model="createDialogVisible" title="新增拜访" width="800px">
      <VisitForm
        v-if="createDialogVisible"
        :default-related-type="relatedToType"
        :default-related-id="Number(relatedToId)"
        @success="handleCreateSuccess"
        @cancel="createDialogVisible = false"
      />
    </el-dialog>

    <!-- 完成拜访弹窗 -->
    <el-dialog v-model="completeDialog.visible" title="完成拜访" width="600px">
      <el-form :model="completeDialog" label-width="100px">
        <el-form-item label="拜访结果">
          <el-input
            v-model="completeDialog.result"
            type="textarea"
            :rows="3"
            placeholder="请输入拜访结果"
          />
        </el-form-item>
        <el-form-item label="客户反馈">
          <el-input
            v-model="completeDialog.feedback"
            type="textarea"
            :rows="3"
            placeholder="请输入客户反馈"
          />
        </el-form-item>
        <el-form-item label="下一步行动">
          <el-input
            v-model="completeDialog.nextAction"
            type="textarea"
            :rows="3"
            placeholder="可记录后续跟进计划"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="completeDialog.submitting" @click="submitComplete">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import visitApi, { type Visit } from '@/api/visit'
import VisitForm from '@/components/visit/VisitForm.vue'

type RelatedToType = 'customer' | 'contact' | 'opportunity'

interface Props {
  // 关联对象类型：客户 / 联系人 / 商机
  relatedToType: RelatedToType
  // 关联对象 ID
  relatedToId: string
  // 是否自动加载
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

const loading = ref(false)
const visits = ref<Visit[]>([])

const createDialogVisible = ref(false)
const completeDialog = ref<{
  visible: boolean
  id: number | null
  result: string
  feedback: string
  nextAction: string
  submitting: boolean
}>({
  visible: false,
  id: null,
  result: '',
  feedback: '',
  nextAction: '',
  submitting: false
})

const relatedToType = props.relatedToType
const relatedToId = props.relatedToId

const loadVisits = async () => {
  if (!props.relatedToId || !props.autoLoad) return
  loading.value = true
  try {
    let res: any
    if (props.relatedToType === 'customer') {
      res = await visitApi.getByCustomer(Number(props.relatedToId))
      visits.value = res.data || []
    } else if (props.relatedToType === 'contact') {
      res = await visitApi.getByContact(Number(props.relatedToId))
      visits.value = res.data || []
    } else if (props.relatedToType === 'opportunity') {
      res = await visitApi.getList({
        opportunityId: Number(props.relatedToId),
        page: 1,
        limit: 100
      } as any)
      visits.value = (res.data as any)?.visits || (res.data as any)?.items || res.data || []
    } else {
      visits.value = []
    }
  } catch (e: any) {
    console.error('加载拜访记录失败', e)
    ElMessage.error(e?.message || '加载拜访记录失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusName = (status?: string) => {
  const map: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status || ''] || status || '-'
}

const getStatusColor = (status?: string) => {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status || ''] || ''
}

const getTypeName = (type?: string) => {
  const map: Record<string, string> = {
    first_visit: '首次拜访',
    follow_up: '跟进拜访',
    maintenance: '维护拜访',
    business_negotiation: '商务洽谈',
    technical_support: '技术支持',
    training: '培训',
    other: '其他'
  }
  return map[type || ''] || type || '-'
}

const getPurposeName = (purpose?: string) => {
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
    sample_tracking: '样品跟踪测试'
  }
  return map[purpose || ''] || purpose || ''
}

// 地址格式化
const formatAddress = (region?: string[] | null, detailAddress?: string) => {
  const parts: string[] = []
  if (region && region.length > 0) {
    parts.push(region.join(' / '))
  }
  if (detailAddress) {
    parts.push(detailAddress)
  }
  return parts.join(' - ')
}

// 计算拜访时长
const getVisitDuration = (v: Visit) => {
  const startTime = v.actualStartTime || v.plannedStartTime
  const endTime = v.actualEndTime || v.plannedEndTime
  if (!startTime || !endTime) return null
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    if (diffMinutes <= 0) return null

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
  } catch {
    return null
  }
}

// 优先级
const getPriorityName = (priority?: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[priority || ''] || '中'
}

const getPriorityType = (priority?: string) => {
  const map: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger'
  }
  return map[priority || ''] || ''
}

// 用户展示相关
const getUserName = (owner: any) => {
  if (!owner) return '未知'
  const user = owner.user || owner
  return (
    user.username ||
    user.realName ||
    user.nickname ||
    user.name ||
    '未知'
  )
}

const getUserAvatar = (owner: any) => {
  if (!owner) return null
  const user = owner.user || owner
  return user.avatar || null
}

const getSurname = (owner: any) => {
  const name = getUserName(owner)
  if (!name || name === '未知') return '未'
  return name.charAt(0)
}

// 新增拜访
const openCreateDialog = () => {
  if (!relatedToId) {
    ElMessage.warning('请先选择关联对象')
    return
  }
  createDialogVisible.value = true
}

const handleCreateSuccess = () => {
  createDialogVisible.value = false
  loadVisits()
}

// 开始拜访
const handleStart = async (v: Visit) => {
  try {
    await visitApi.start(v.id)
    ElMessage.success('已开始拜访')
    loadVisits()
  } catch (e: any) {
    console.error('开始拜访失败', e)
    ElMessage.error(e?.message || '开始失败')
  }
}

// 打开完成对话框
const openCompleteDialog = (v: Visit) => {
  completeDialog.value.visible = true
  completeDialog.value.id = v.id
  completeDialog.value.result = v.result || ''
  completeDialog.value.feedback = v.feedback || ''
  completeDialog.value.nextAction = v.nextAction || ''
}

// 提交完成
const submitComplete = async () => {
  if (!completeDialog.value.id) return
  completeDialog.value.submitting = true
  try {
    await visitApi.complete(completeDialog.value.id, {
      result: completeDialog.value.result,
      feedback: completeDialog.value.feedback,
      nextAction: completeDialog.value.nextAction
    })
    ElMessage.success('拜访已完成')
    completeDialog.value.visible = false
    loadVisits()
  } catch (e: any) {
    console.error('完成拜访失败', e)
    ElMessage.error(e?.message || '完成失败')
  } finally {
    completeDialog.value.submitting = false
  }
}

watch(
  () => [props.relatedToType, props.relatedToId],
  () => {
    if (props.autoLoad) {
      loadVisits()
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.contact-visit-list {
  .visit-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }

  .empty-state {
    padding: 24px 0;
  }

  .visit-item {
    position: relative;

    .line1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;

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

      .line1-content {
        flex: 1;

        .line1-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .owner-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
          }
        }

        .line1-bottom {
          display: none;
        }
      }
    }

    .line2 {
      font-size: 13px;
      color: #606266;
      margin-top: 2px;

      .label {
        color: #909399;
        margin-right: 4px;
      }
    }

    .info-row {
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;

      .info-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;

        .label {
          color: #909399;
        }

        .value {
          color: #606266;
        }
      }
    }

    .actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }
  }
}
</style>

