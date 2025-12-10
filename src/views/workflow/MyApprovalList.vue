<template>
  <div class="approval-list">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="待审批" name="pending" />
          <el-tab-pane label="已审批" name="approved" />
        </el-tabs>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="approvalList"
          v-loading="loading"
          style="width: 100%"
          border
        >
          <el-table-column prop="businessType" label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag>{{ getBusinessTypeName(row.businessType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业务对象" width="200">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewBusinessDetail(row)">
                {{ getBusinessTitle(row) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="template.name" label="审批流" width="150" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="initiator" label="发起人" width="120">
            <template #default="{ row }">
              {{ row.initiator?.user?.username || row.initiator?.nickname || '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="submitComment" label="提交说明" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="提交时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">
                查看详情
              </el-button>
              <el-button
                v-if="activeTab === 'pending' && canApprove(row)"
                type="success"
                link
                @click="showApproveDialog(row)"
              >
                审批
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination" v-if="activeTab === 'approved'">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 审批详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`${getBusinessTypeName(currentInstance?.businessType || '')}审批详情`"
      width="1200px"
      :close-on-click-modal="false"
    >
      <div v-if="currentInstance" class="approval-detail">
        <el-tabs v-model="detailActiveTab">
          <el-tab-pane label="业务详情" name="business">
            <div v-if="businessDetail">
              <component
                :is="getBusinessComponent(currentInstance.businessType)"
                :quote="currentInstance.businessType === 'quote' ? businessDetail : undefined"
                :contract="currentInstance.businessType === 'contract' ? businessDetail : undefined"
                :order="currentInstance.businessType === 'order' ? businessDetail : undefined"
                :readonly="true"
              />
            </div>
            <div v-else-if="loadingBusinessDetail" class="loading-container">
              <el-skeleton :rows="5" animated />
            </div>
            <div v-else class="loading-container">
              <el-empty description="加载业务详情失败，请刷新重试" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="审批流程" name="approval">
            <ApprovalFlow v-if="currentInstance" :instance="currentInstance" />

            <!-- 审批操作按钮 -->
            <div
              v-if="detailActiveTab === 'approval' && currentInstance && canApprove(currentInstance)"
              class="approval-actions"
              style="margin-top: 20px; padding: 20px; background: #f5f7fa; border-radius: 4px;"
            >
              <el-button type="success" size="large" @click="showApproveDialog(currentInstance, 'approve')">
                同意
              </el-button>
              <el-button type="danger" size="large" @click="showApproveDialog(currentInstance, 'reject')">
                驳回
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="activeTab === 'pending' && currentInstance && canApprove(currentInstance)"
          type="success"
          @click="showApproveDialog(currentInstance)"
        >
          审批
        </el-button>
      </template>
    </el-dialog>

    <!-- 审批操作对话框 -->
    <ApprovalDialog
      v-model="approvalDialogVisible"
      :instance-id="currentInstanceId"
      :action-type="approvalActionType"
      :node-list="currentNodeList"
      @success="handleApprovalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMyPendingApprovals,
  getMyApprovedList,
  getWorkflowInstanceById,
  type WorkflowInstance,
} from '@/api/workflow'
import ApprovalFlow from '@/components/workflow/ApprovalFlow.vue'
import ApprovalDialog from '@/components/workflow/ApprovalDialog.vue'
import QuoteForm from '@/components/quote/QuoteForm.vue'
import ContractForm from '@/components/contract/ContractForm.vue'
import OrderForm from '@/components/order/OrderForm.vue'
import { useAuthStore } from '@/stores/modules/auth'
import quoteApi from '@/api/quote'
import contractApi from '@/api/contract'
import orderApi from '@/api/order'

const authStore = useAuthStore()

// 当前用户ID
const currentMemberId = computed(() => {
  if (!authStore.member) return null
  const id = authStore.member.id
  return typeof id === 'string' ? parseInt(id, 10) : id
})

// 标签页
const activeTab = ref<'pending' | 'approved'>('pending')

// 审批列表
const approvalList = ref<WorkflowInstance[]>([])
const loading = ref(false)
// 业务对象编号映射（用于显示单据编号）
const businessNumberMap = ref<Record<string, string>>({})

// 分页（仅用于已审批）
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentInstance = ref<WorkflowInstance | null>(null)
const detailActiveTab = ref('business')
const businessDetail = ref<any>(null)
const loadingBusinessDetail = ref(false)

// 审批对话框
const approvalDialogVisible = ref(false)
const currentInstanceId = ref<number>()
const approvalActionType = ref<'approve' | 'reject'>('approve')
const currentNodeList = ref<Array<{ order: number; name: string }>>([])

// 获取业务类型名称
const getBusinessTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    quote: '报价',
    contract: '合同',
    order: '订单',
  }
  return nameMap[type] || type
}

// 获取业务对象标题
const getBusinessTitle = (instance: WorkflowInstance) => {
  const key = `${instance.businessType}_${instance.businessId}`
  const number = businessNumberMap.value[key]
  if (number) {
    return number
  }
  // 如果没有加载到编号，先加载
  loadBusinessNumber(instance)
  return `${getBusinessTypeName(instance.businessType)} #${instance.businessId}`
}

// 加载业务对象编号
const loadBusinessNumber = async (instance: WorkflowInstance) => {
  const key = `${instance.businessType}_${instance.businessId}`
  // 如果已经加载过，跳过
  if (businessNumberMap.value[key]) return

  try {
    if (instance.businessType === 'quote') {
      const response = await quoteApi.getDetail(String(instance.businessId))
      if (response.code === 200 && response.data) {
        businessNumberMap.value[key] = response.data.quoteNumber || `报价 #${instance.businessId}`
      }
    } else if (instance.businessType === 'contract') {
      const response = await contractApi.getDetail(String(instance.businessId))
      if (response.code === 200 && response.data) {
        businessNumberMap.value[key] = response.data.contractNumber || `合同 #${instance.businessId}`
      }
    } else if (instance.businessType === 'order') {
      const response = await orderApi.getDetail(String(instance.businessId))
      if (response.code === 200 && response.data) {
        businessNumberMap.value[key] = response.data.orderNumber || `订单 #${instance.businessId}`
      }
    }
  } catch (error) {
    console.error('加载业务对象编号失败:', error)
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    returned: 'info',
    cancelled: 'default',
  }
  return typeMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    pending: '审批中',
    approved: '已通过',
    rejected: '已拒绝',
    returned: '已退回',
    cancelled: '已取消',
  }
  return nameMap[status] || status
}

// 判断是否可以审批
const canApprove = (instance: WorkflowInstance): boolean => {
  console.log('canApprove 检查:', {
    currentMemberId: currentMemberId.value,
    currentMemberIdType: typeof currentMemberId.value,
    instanceStatus: instance.status,
    currentNodeId: instance.currentNodeId,
    currentNodeIdType: typeof instance.currentNodeId,
    recordsCount: instance.records?.length || 0,
    records: instance.records,
  })

  if (!currentMemberId.value) {
    console.log('canApprove: 当前用户ID为空')
    return false
  }

  if (instance.status !== 'pending') {
    console.log('canApprove: 实例状态不是 pending，当前状态:', instance.status)
    return false
  }

  if (!instance.currentNodeId) {
    console.log('canApprove: 当前节点ID为空')
    return false
  }

  // 检查当前节点是否有该成员的待审批记录
  const currentRecords = instance.records?.filter((r) => {
    const nodeMatch = r.nodeId === instance.currentNodeId ||
                      (r.nodeId != null && instance.currentNodeId != null &&
                       Number(r.nodeId) === Number(instance.currentNodeId))
    const actionMatch = r.action === 'pending'
    return nodeMatch && actionMatch
  }) || []

  console.log('canApprove: 当前节点的待审批记录:', currentRecords)

  const canApproveResult = currentRecords.some((r) => {
    // 处理类型转换，确保比较的是相同类型
    const approverId = typeof r.approverId === 'string' ? parseInt(r.approverId, 10) : r.approverId
    const memberId = currentMemberId.value
    const match = approverId === memberId
    console.log('canApprove: 检查记录', {
      recordId: r.id,
      approverId: r.approverId,
      approverIdType: typeof r.approverId,
      approverIdParsed: approverId,
      currentMemberId: memberId,
      match,
    })
    return match
  })

  console.log('canApprove: 最终结果:', canApproveResult)
  return canApproveResult
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载待审批列表
const loadPendingApprovals = async () => {
  try {
    loading.value = true
    const response = await getMyPendingApprovals() as unknown as {
      code: number
      data?: WorkflowInstance[]
    }
    console.log('待审批列表响应:', response)
    if (response.code === 200) {
      approvalList.value = response.data || []
      console.log('待审批列表数据:', approvalList.value)
      if (approvalList.value.length === 0) {
        console.log('待审批列表为空，可能原因：1. 没有待审批任务 2. 当前用户不是审批人 3. 数据加载不完整')
      } else {
        // 批量加载业务对象编号
        await Promise.all(approvalList.value.map(instance => loadBusinessNumber(instance)))
      }
    } else {
      console.error('获取待审批列表失败，响应码:', response.code)
    }
  } catch (error) {
    console.error('加载待审批列表失败:', error)
    ElMessage.error('加载待审批列表失败')
  } finally {
    loading.value = false
  }
}

// 加载已审批列表
const loadApprovedList = async () => {
  try {
    loading.value = true
    const response = await getMyApprovedList(pagination.page, pagination.pageSize) as unknown as {
      code: number
      data?: {
        data?: Array<{ instance?: WorkflowInstance }>
        total?: number
      }
    }
    if (response.code === 200 && response.data) {
      // 后端返回的是 records 数组，每个 record 包含 instance
      // 需要提取 instance 并去重（同一个实例可能有多个审批记录）
      const instancesMap = new Map<number, WorkflowInstance>()
      if (response.data.data) {
        response.data.data.forEach((record) => {
          if (record.instance) {
            instancesMap.set(record.instance.id, record.instance)
          }
        })
      }
      approvalList.value = Array.from(instancesMap.values())
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载已审批列表失败:', error)
    ElMessage.error('加载已审批列表失败')
  } finally {
    loading.value = false
  }
}

// 标签页切换
const handleTabChange = (tab: string) => {
  if (tab === 'pending') {
    loadPendingApprovals()
  } else {
    pagination.page = 1
    loadApprovedList()
  }
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadApprovedList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadApprovedList()
}

// 查看详情
const viewDetail = async (instance: WorkflowInstance) => {
  try {
    const response = await getWorkflowInstanceById(instance.id) as unknown as {
      code: number
      data?: WorkflowInstance
    }
    if (response.code === 200 && response.data) {
      currentInstance.value = response.data
      detailDialogVisible.value = true
      detailActiveTab.value = 'business'

      // 加载业务详情
      await loadBusinessDetail(instance)
    }
  } catch (error) {
    console.error('获取审批详情失败:', error)
    ElMessage.error('获取审批详情失败')
  }
}

// 加载业务详情
const loadBusinessDetail = async (instance: WorkflowInstance) => {
  try {
    loadingBusinessDetail.value = true
    businessDetail.value = null
    if (instance.businessType === 'quote') {
      const response = await quoteApi.getDetail(String(instance.businessId))
      if (response.code === 200) {
        businessDetail.value = response.data
      } else {
        console.error('加载报价详情失败:', response)
        ElMessage.error('加载报价详情失败')
      }
    } else if (instance.businessType === 'contract') {
      const response = await contractApi.getDetail(String(instance.businessId))
      if (response.code === 200) {
        businessDetail.value = response.data
      } else {
        console.error('加载合同详情失败:', response)
        ElMessage.error('加载合同详情失败')
      }
    } else if (instance.businessType === 'order') {
      const response = await orderApi.getDetail(String(instance.businessId))
      if (response.code === 200) {
        businessDetail.value = response.data
      } else {
        console.error('加载订单详情失败:', response)
        ElMessage.error('加载订单详情失败')
      }
    }
  } catch (error) {
    console.error('加载业务详情失败:', error)
    ElMessage.error('加载业务详情失败')
  } finally {
    loadingBusinessDetail.value = false
  }
}

// 获取业务组件
const getBusinessComponent = (businessType: string) => {
  const componentMap: Record<string, any> = {
    quote: QuoteForm,
    contract: ContractForm,
    order: OrderForm,
  }
  return componentMap[businessType] || 'div'
}

// 查看业务详情
const viewBusinessDetail = (instance: WorkflowInstance) => {
  viewDetail(instance)
}

// 显示审批对话框
const showApproveDialog = (instance: WorkflowInstance, action: 'approve' | 'reject' = 'approve') => {
  currentInstanceId.value = instance.id
  approvalActionType.value = action

  // 构建节点列表
  if (instance.template?.nodes) {
    currentNodeList.value = instance.template.nodes
      .sort((a, b) => a.nodeOrder - b.nodeOrder)
      .map((node) => ({
        order: node.nodeOrder,
        name: node.name,
      }))
  }

  approvalDialogVisible.value = true
}

// 审批成功回调
const handleApprovalSuccess = () => {
  // 刷新列表
  if (activeTab.value === 'pending') {
    loadPendingApprovals()
  } else {
    loadApprovedList()
  }

  // 如果详情对话框打开，刷新详情
  if (detailDialogVisible.value && currentInstance.value) {
    viewDetail(currentInstance.value)
  }
}

onMounted(() => {
  loadPendingApprovals()
})
</script>

<style scoped lang="scss">
.approval-list {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .main-container {
    background: white;
    border-radius: 4px;
    padding: 20px;

    .toolbar {
      margin-bottom: 20px;
    }

    .table-section {
      .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}

.approval-detail {
  .loading-container {
    padding: 20px;
  }
}
</style>

