<template>
  <div class="approved-list">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="业务类型">
              <el-select
                v-model="searchForm.businessType"
                placeholder="全部"
                clearable
                style="width: 120px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="报价" value="quote" />
                <el-option label="合同" value="contract" />
                <el-option label="订单" value="order" />
              </el-select>
            </el-form-item>
            <el-form-item label="发起人">
              <el-select
                v-model="searchForm.initiatorId"
                placeholder="全部"
                clearable
                filterable
                style="width: 150px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option
                  v-for="member in memberList"
                  :key="member.id"
                  :label="member.user?.username || member.nickname || `成员${member.id}`"
                  :value="member.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <!-- 可以在这里添加操作按钮 -->
        </div>
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
          </template>
        </el-table-column>
      </el-table>

      </div>

      <!-- 分页 -->
      <div class="pagination-section">
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

    <!-- 报价详情对话框 -->
    <QuoteDetailDialog
      v-if="currentInstance?.businessType === 'quote'"
      v-model="quoteDetailDialogVisible"
      :quote-id="currentQuoteId"
      @updated="handleQuoteUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getMyApprovedList,
  type WorkflowInstance,
} from '@/api/workflow'
import QuoteDetailDialog from '@/components/quote/QuoteDetailDialog.vue'
import quoteApi from '@/api/quote'
import contractApi from '@/api/contract'
import { getTenantMembers } from '@/api/tenant'

// 审批列表
const approvalList = ref<WorkflowInstance[]>([])
const loading = ref(false)
// 业务对象编号映射（用于显示单据编号）
const businessNumberMap = ref<Record<string, string>>({})

// 搜索表单
const searchForm = reactive({
  businessType: undefined as string | undefined,
  initiatorId: undefined as number | undefined,
})

// 成员列表（用于发起人过滤）
const memberList = ref<Array<{ id: number; user?: { username?: string }; nickname?: string }>>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 报价详情对话框
const quoteDetailDialogVisible = ref(false)
const currentQuoteId = ref<string | number>()
const currentInstance = ref<WorkflowInstance | null>(null)

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
      const response = await quoteApi.getDetail(String(instance.businessId)) as unknown as {
        code: number
        data?: { quoteNumber?: string }
      }
      if (response.code === 200 && response.data) {
        businessNumberMap.value[key] = response.data.quoteNumber || `报价 #${instance.businessId}`
      }
    } else if (instance.businessType === 'contract') {
      const response = await contractApi.getDetail(String(instance.businessId)) as unknown as {
        code: number
        data?: { contractNumber?: string }
      }
      if (response.code === 200 && response.data) {
        businessNumberMap.value[key] = response.data.contractNumber || `合同 #${instance.businessId}`
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

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
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
      let list = Array.from(instancesMap.values())

      // 前端过滤
      if (searchForm.businessType) {
        list = list.filter(item => item.businessType === searchForm.businessType)
      }
      if (searchForm.initiatorId) {
        list = list.filter(item => item.initiatorId === searchForm.initiatorId)
      }

      approvalList.value = list
      pagination.total = response.data.total || 0

      // 批量加载业务对象编号
      if (approvalList.value.length > 0) {
        await Promise.all(approvalList.value.map(instance => loadBusinessNumber(instance)))
      }
    }
  } catch (error) {
    console.error('加载已审批列表失败:', error)
    ElMessage.error('加载已审批列表失败')
  } finally {
    loading.value = false
  }
}

// 加载成员列表
const loadMemberList = async () => {
  try {
    const result = await getTenantMembers(1, 100)
    memberList.value = result.items || []
  } catch (error) {
    console.error('加载成员列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadApprovedList()
}

// 重置
const handleReset = () => {
  searchForm.businessType = undefined
  searchForm.initiatorId = undefined
  pagination.page = 1
  loadApprovedList()
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
  if (instance.businessType === 'quote') {
    currentQuoteId.value = instance.businessId
    currentInstance.value = instance
    quoteDetailDialogVisible.value = true
  } else {
    // 其他业务类型暂时保持原有逻辑
    ElMessage.warning('该业务类型暂不支持详情查看')
  }
}

// 处理报价更新
const handleQuoteUpdated = () => {
  loadApprovedList()
}

// 查看业务详情
const viewBusinessDetail = (instance: WorkflowInstance) => {
  viewDetail(instance)
}

onMounted(async () => {
  await loadMemberList()
  loadApprovedList()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.approved-list {
  @extend .table-page;
}

.approval-detail {
  .loading-container {
    padding: 20px;
  }
}
</style>


