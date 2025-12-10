<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="handleDrawerUpdate"
    direction="rtl"
    size="70%"
    :with-header="false"
    class="detail-drawer"
    :before-close="handleDrawerClose"
  >
    <div v-if="contract" class="detail-layout">
      <!-- 左侧导航按钮 -->
      <div class="left-nav" :class="{ collapsed: menuCollapsed }">
        <!-- 收缩/展开按钮 -->
        <div class="menu-toggle" @click="menuCollapsed = !menuCollapsed">
          <el-icon>
            <Fold v-if="!menuCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
        <ul class="side-menu with-timeline">
          <li
            class="side-item"
            :class="{ active: activeTab === 'basic' }"
            @click="handleNavClick('basic')"
          >
            <span class="item-btn" :title="menuCollapsed ? '基本信息' : ''">
              <el-icon class="item-icon"><Document /></el-icon>
              <span v-show="!menuCollapsed" class="item-text">基本信息</span>
            </span>
          </li>
          <li
            class="side-item"
            :class="{ active: activeTab === 'approval' }"
            @click="handleNavClick('approval')"
          >
            <span class="item-btn" :title="menuCollapsed ? '审批流程' : ''">
              <el-icon class="item-icon"><Finished /></el-icon>
              <span v-show="!menuCollapsed" class="item-text">审批流程</span>
            </span>
          </li>
        </ul>
      </div>

      <!-- 右侧内容区域 -->
      <div class="right-content">
        <!-- 可滚动内容区域 -->
        <div class="dynamic-content-section detail-scroll-container" ref="detailContentRef" @scroll="handleDetailScroll">
          <!-- 基本信息 -->
          <el-card id="contract-section-basic" shadow="never" class="section-card basic-info-section detail-section">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <h3 class="section-title" style="margin: 0">基本信息</h3>
                <div class="action-buttons">
                  <el-button
                    v-if="contract.status === 'draft' || contract.status === 'rejected'"
                    type="primary"
                    :icon="Edit"
                    @click="handleEdit"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="contract.status === 'draft' || contract.status === 'rejected'"
                    type="success"
                    @click="showSubmitApprovalDialog"
                  >
                    {{ contract.status === 'rejected' ? '重新提交审批' : '提交审批' }}
                  </el-button>
                </div>
              </div>
            </template>
            <ContractForm
              ref="contractFormRef"
              :contract="contract"
              :readonly="true"
            />
          </el-card>

          <!-- 审批流程 -->
          <el-card id="contract-section-approval" shadow="never" class="section-card tab-content detail-section">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <h3 class="section-title" style="margin: 0">审批流程</h3>
                <div
                  v-if="contract.status === 'pending_approval' && approvalInstance && canApprove(approvalInstance)"
                  class="approval-actions"
                >
                  <el-button type="success" @click="handleApprove">
                    同意
                  </el-button>
                  <el-button type="danger" @click="handleReject">
                    驳回
                  </el-button>
                </div>
              </div>
            </template>
            <div v-if="approvalInstance">
              <ApprovalFlow :instance="approvalInstance" />
            </div>
            <div v-else-if="contract.status === 'draft' || contract.status === 'rejected'" class="no-approval">
              <el-empty :description="contract.status === 'rejected' ? '审批已被驳回' : '尚未提交审批'" />
              <el-button type="primary" @click="showSubmitApprovalDialog" style="margin-top: 16px">
                {{ contract.status === 'rejected' ? '重新提交审批' : '提交审批' }}
              </el-button>
            </div>
            <div v-else class="no-approval">
              <el-empty description="暂无审批记录" />
            </div>
          </el-card>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else class="loading-container">
      <el-empty description="加载合同详情失败，请刷新重试" />
    </div>

    <!-- 提交审批对话框 -->
    <el-dialog
      v-model="submitApprovalDialogVisible"
      title="提交审批"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="submitApprovalFormRef" :model="submitApprovalForm" label-width="100px">
        <el-form-item label="审批流模板" prop="templateId" :rules="[{ required: true, message: '请选择审批流模板', trigger: 'change' }]">
          <el-select
            v-model="submitApprovalForm.templateId"
            placeholder="请选择审批流模板"
            style="width: 100%"
          >
            <el-option
              v-for="template in workflowTemplates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提交说明">
          <el-input
            v-model="submitApprovalForm.submitComment"
            type="textarea"
            :rows="3"
            placeholder="请输入提交说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitApprovalDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitApprovalLoading" @click="handleSubmitApproval">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 审批操作对话框 -->
    <ApprovalDialog
      v-model="approvalDialogVisible"
      :instance-id="approvalInstanceId"
      :action-type="approvalActionType"
      :node-list="currentNodeList"
      @success="handleApprovalSuccess"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Fold, Expand, Document, Finished, Edit } from '@element-plus/icons-vue'
import ContractForm from '@/components/contract/ContractForm.vue'
import ApprovalFlow from '@/components/workflow/ApprovalFlow.vue'
import ApprovalDialog from '@/components/workflow/ApprovalDialog.vue'
import contractApi, { type Contract } from '@/api/contract'
import {
  getContractApprovalInstance,
  submitContractApproval,
  getWorkflowTemplates,
  type WorkflowInstance,
  type WorkflowTemplate,
} from '@/api/workflow'
import { useAuthStore } from '@/stores/modules/auth'

const props = defineProps<{
  modelValue: boolean
  contractId?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': []
  'close': []
  'edit': [contract: Contract]
}>()

const authStore = useAuthStore()

// 当前用户ID
const currentMemberId = computed(() => {
  if (!authStore.member) return null
  const id = authStore.member.id
  return typeof id === 'string' ? parseInt(id, 10) : id
})

// 合同详情
const contract = ref<Contract | null>(null)
const loading = ref(false)
const activeTab = ref('basic')
const menuCollapsed = ref(false)
const detailContentRef = ref<HTMLElement | null>(null)

// 审批实例
const approvalInstance = ref<WorkflowInstance | null>(null)

// 提交审批相关
const submitApprovalDialogVisible = ref(false)
const submitApprovalFormRef = ref()
const submitApprovalLoading = ref(false)
const submitApprovalForm = reactive({
  templateId: undefined as number | undefined,
  submitComment: '',
})
const workflowTemplates = ref<WorkflowTemplate[]>([])

// 审批操作相关
const approvalDialogVisible = ref(false)
const approvalInstanceId = ref<number>()
const approvalActionType = ref<'approve' | 'reject'>('approve')
const currentNodeList = ref<Array<{ order: number; name: string }>>([])

// 处理抽屉显示状态变化
const handleDrawerUpdate = (value: boolean) => {
  emit('update:modelValue', value)
  if (!value) {
    emit('close')
  }
}

// 处理抽屉关闭
const handleDrawerClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// 锚点导航点击处理
const handleNavClick = (tab: 'basic' | 'approval') => {
  activeTab.value = tab
  scrollToSection(tab)
}

// 滚动到指定section
const scrollToSection = (tab: string) => {
  nextTick(() => {
    const sectionId = `contract-section-${tab}`
    const section = document.getElementById(sectionId)
    if (section && detailContentRef.value) {
      const container = detailContentRef.value
      const sectionTop = section.offsetTop - container.offsetTop - 20 // 20px offset
      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      })
    }
  })
}

// 处理详情页滚动，更新activeTab
const handleDetailScroll = () => {
  if (!detailContentRef.value) return

  const container = detailContentRef.value
  const scrollTop = container.scrollTop + 100 // 100px offset for header

  const sections = [
    { id: 'contract-section-basic', tab: 'basic' },
    { id: 'contract-section-approval', tab: 'approval' },
  ]

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id)
    if (section) {
      const sectionTop = section.offsetTop - container.offsetTop
      if (scrollTop >= sectionTop) {
        activeTab.value = sections[i].tab as 'basic' | 'approval'
        break
      }
    }
  }
}

// 加载合同详情
const loadContractDetail = async () => {
  if (!props.contractId) return

  try {
    loading.value = true
    const response = await contractApi.getDetail(String(props.contractId)) as unknown as {
      code: number
      data?: Contract
    }
    if (response.code === 200 && response.data) {
      contract.value = response.data
      // 加载审批实例
      await loadApprovalInstance()
      // 滚动到顶部
      nextTick(() => {
        if (detailContentRef.value) {
          detailContentRef.value.scrollTop = 0
        }
        activeTab.value = 'basic'
      })
    } else {
      ElMessage.error('加载合同详情失败')
    }
  } catch (error) {
    console.error('加载合同详情失败:', error)
    ElMessage.error('加载合同详情失败')
  } finally {
    loading.value = false
  }
}

// 加载审批实例
const loadApprovalInstance = async () => {
  if (!props.contractId) return

  try {
    const response = await getContractApprovalInstance(Number(props.contractId)) as unknown as {
      code: number
      data?: WorkflowInstance
    }
    if (response.code === 200 && response.data) {
      approvalInstance.value = response.data
    } else {
      approvalInstance.value = null
    }
  } catch (error) {
    console.error('加载审批实例失败:', error)
    approvalInstance.value = null
  }
}

// 判断是否可以审批
const canApprove = (instance: WorkflowInstance): boolean => {
  if (!currentMemberId.value) return false
  if (instance.status !== 'pending') return false
  if (!instance.currentNodeId) return false

  // 检查当前节点是否有该成员的待审批记录
  const currentRecords = instance.records?.filter((r) => {
    const nodeMatch = r.nodeId === instance.currentNodeId ||
                      (r.nodeId != null && instance.currentNodeId != null &&
                       Number(r.nodeId) === Number(instance.currentNodeId))
    const actionMatch = r.action === 'pending'
    return nodeMatch && actionMatch
  }) || []

  return currentRecords.some((r) => {
    const approverId = typeof r.approverId === 'string' ? parseInt(r.approverId, 10) : r.approverId
    return approverId === currentMemberId.value
  })
}

// 显示提交审批对话框
const showSubmitApprovalDialog = async () => {
  if (!contract.value) return

  // 加载审批流模板列表
  try {
    const response = await getWorkflowTemplates('contract') as unknown as {
      code: number
      data?: WorkflowTemplate[]
    }
    if (response.code === 200) {
      workflowTemplates.value = (response.data || []).filter((t: WorkflowTemplate) => t.isActive)

      if (workflowTemplates.value.length === 0) {
        ElMessage.warning('没有可用的审批流模板，请先创建')
        return
      }

      // 如果只有一个启用的模板，直接提交
      if (workflowTemplates.value.length === 1) {
        await submitApprovalDirectly(workflowTemplates.value[0].id)
        return
      }

      // 如果有多个模板，显示对话框让用户选择
      submitApprovalForm.templateId = workflowTemplates.value[0]?.id
      submitApprovalDialogVisible.value = true
    }
  } catch (error) {
    console.error('加载审批流模板失败:', error)
    ElMessage.error('加载审批流模板失败')
  }
}

// 直接提交审批（不显示对话框）
const submitApprovalDirectly = async (templateId: number, submitComment?: string) => {
  if (!contract.value) return

  try {
    submitApprovalLoading.value = true
    const response = await submitContractApproval(Number(contract.value.id), {
      templateId,
      submitComment,
    }) as unknown as { code: number; data?: unknown }

    if (response.code === 200) {
      ElMessage.success('提交审批成功')
      // 刷新合同详情和审批实例
      await loadContractDetail()
      emit('updated')
    }
  } catch (error) {
    console.error('提交审批失败:', error)
    const errorMessage = error instanceof Error ? error.message : '提交审批失败'
    ElMessage.error(errorMessage)
  } finally {
    submitApprovalLoading.value = false
  }
}

// 处理提交审批
const handleSubmitApproval = async () => {
  if (!submitApprovalFormRef.value || !contract.value) return

  await submitApprovalFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      submitApprovalLoading.value = true
      const response = await submitContractApproval(Number(contract.value!.id), {
        templateId: submitApprovalForm.templateId!,
        submitComment: submitApprovalForm.submitComment,
      }) as unknown as { code: number; data?: unknown }

      if (response.code === 200) {
        ElMessage.success('提交审批成功')
        submitApprovalDialogVisible.value = false
        submitApprovalForm.templateId = undefined
        submitApprovalForm.submitComment = ''
        // 刷新合同详情和审批实例
        await loadContractDetail()
        emit('updated')
      }
    } catch (error) {
      console.error('提交审批失败:', error)
      const errorMessage = error instanceof Error ? error.message : '提交审批失败'
      ElMessage.error(errorMessage)
    } finally {
      submitApprovalLoading.value = false
    }
  })
}

// 处理编辑
const handleEdit = () => {
  if (contract.value) {
    emit('edit', contract.value)
  }
}

// 处理审批通过
const handleApprove = () => {
  if (!approvalInstance.value) return

  approvalInstanceId.value = approvalInstance.value.id
  approvalActionType.value = 'approve'

  // 构建节点列表
  if (approvalInstance.value.template?.nodes) {
    currentNodeList.value = approvalInstance.value.template.nodes
      .sort((a, b) => a.nodeOrder - b.nodeOrder)
      .map((node) => ({
        order: node.nodeOrder,
        name: node.name,
      }))
  }

  approvalDialogVisible.value = true
}

// 处理审批拒绝
const handleReject = () => {
  if (!approvalInstance.value) return

  approvalInstanceId.value = approvalInstance.value.id
  approvalActionType.value = 'reject'

  // 构建节点列表
  if (approvalInstance.value.template?.nodes) {
    currentNodeList.value = approvalInstance.value.template.nodes
      .sort((a, b) => a.nodeOrder - b.nodeOrder)
      .map((node) => ({
        order: node.nodeOrder,
        name: node.name,
      }))
  }

  approvalDialogVisible.value = true
}

// 审批成功回调
const handleApprovalSuccess = async () => {
  // 刷新合同详情和审批实例
  await loadContractDetail()
  emit('updated')
}

// 监听 contractId 变化
watch(() => props.contractId, (newId) => {
  if (newId && props.modelValue) {
    loadContractDetail()
  }
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.contractId) {
    loadContractDetail()
  } else if (!newValue) {
    // 关闭时重置状态
    contract.value = null
    approvalInstance.value = null
    activeTab.value = 'basic'
    menuCollapsed.value = false
  }
})

onMounted(() => {
  if (props.modelValue && props.contractId) {
    loadContractDetail()
  }
})
</script>

<style lang="scss">
@use '@/styles/common/detail-drawer.scss';

// 确保抽屉 body 没有内边距
.detail-drawer {
  &.el-drawer {
    :deep(.el-drawer__body) {
      padding: 0 !important;
      margin: 0 !important;
    }
  }
}
</style>

<style scoped lang="scss">
.no-approval {
  text-align: center;
  padding: 40px 0;
}

.approval-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}
</style>

