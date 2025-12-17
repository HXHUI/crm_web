<template>
  <div class="solution-library-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索方案标题"
                clearable
                @keyup.enter="handleSearch"
                style="width: 220px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.industry"
                placeholder="行业"
                clearable
                filterable
                style="width: 140px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option
                  v-for="item in industryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.result"
                placeholder="结果"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="输单" value="lost" />
                <el-option label="赢单" value="won" />
                <el-option label="搁置" value="on_hold" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.sourceType"
                placeholder="来源"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="客户" value="customer" />
                <el-option label="商机" value="opportunity" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="solutionList"
          v-loading="loading"
          style="width: 100%"
          border
          @row-click="handleRowClick"
        >
          <el-table-column prop="title" label="方案标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="来源" width="100">
            <template #default="{ row }">
              <el-tag :type="row.sourceType === 'customer' ? 'primary' : 'success'" size="small">
                {{ row.sourceType === 'customer' ? '客户' : '商机' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="industry" label="行业" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getIndustryLabel(row.industry) }}
            </template>
          </el-table-column>
          <el-table-column prop="applicationScenario" label="应用场景" min-width="150" show-overflow-tooltip />
          <el-table-column label="需求标签" min-width="150">
            <template #default="{ row }">
              <el-tag
                v-for="tag in row.requirementTags?.slice(0, 3)"
                :key="tag"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="row.requirementTags && row.requirementTags.length > 3" style="color: #909399; font-size: 12px">
                +{{ row.requirementTags.length - 3 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="竞品数量" width="100" align="center">
            <template #default="{ row }">
              {{ row.competitors?.length || row.competitorIds?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="可替代产品数量" width="120" align="center">
            <template #default="{ row }">
              {{ row.alternatives?.length || row.alternativeIds?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="产品数量" width="100" align="center">
            <template #default="{ row }">
              {{ row.productList?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="getResultTagType(row.result)" size="small">
                {{ getResultLabel(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成功/失败原因" min-width="150">
            <template #default="{ row }">
              <template v-if="row.result === 'won' && row.winReasons">
                <el-tag
                  v-for="reason in row.winReasons.slice(0, 2)"
                  :key="reason"
                  size="small"
                  type="success"
                  style="margin-right: 4px; margin-bottom: 4px"
                >
                  {{ getWinReasonLabel(reason) }}
                </el-tag>
                <span v-if="row.winReasons.length > 2" style="color: #909399; font-size: 12px">
                  +{{ row.winReasons.length - 2 }}
                </span>
              </template>
              <template v-else-if="row.result === 'lost' && row.loseReasons">
                <el-tag
                  v-for="reason in row.loseReasons.slice(0, 2)"
                  :key="reason"
                  size="small"
                  type="info"
                  style="margin-right: 4px; margin-bottom: 4px"
                >
                  {{ getLoseReasonLabel(reason) }}
                </el-tag>
                <span v-if="row.loseReasons.length > 2" style="color: #909399; font-size: 12px">
                  +{{ row.loseReasons.length - 2 }}
                </span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="使用次数" width="100" align="center">
            <template #default="{ row }">
              {{ row.usageCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="成功率" width="100" align="center">
            <template #default="{ row }">
              {{ row.successRate ? `${row.successRate}%` : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="handleView(row)">查看</el-button>
              <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 方案详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="方案详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentSolution" class="solution-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="方案标题" :span="2">
            {{ currentSolution.title }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag :type="currentSolution.sourceType === 'customer' ? 'primary' : 'success'" size="small">
              {{ currentSolution.sourceType === 'customer' ? '客户' : '商机' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="行业">
            {{ getIndustryLabel(currentSolution.industry) }}
          </el-descriptions-item>
          <el-descriptions-item label="应用场景" :span="2">
            {{ currentSolution.applicationScenario || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="需求标签" :span="2">
            <el-tag
              v-for="tag in currentSolution.requirementTags"
              :key="tag"
              size="small"
              style="margin-right: 8px; margin-bottom: 4px"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSolution.competitors && currentSolution.competitors.length > 0" label="意向竞品" :span="2">
            <div class="competitor-list">
              <div
                v-for="competitor in currentSolution.competitors"
                :key="competitor.id"
                class="competitor-item"
              >
                <div class="competitor-header">
                  <strong>{{ competitor.manufacturer }}</strong>
                  <span v-if="competitor.productName"> / {{ competitor.productName }}</span>
                </div>
                <div class="competitor-details">
                  <div v-if="competitor.annualUsageAmount" class="detail-row">
                    <span class="label">年用量：</span>
                    <span class="value">{{ formatCurrency(competitor.annualUsageAmount) }}</span>
                    <span v-if="competitor.unit" class="unit">{{ competitor.unit }}</span>
                  </div>
                  <div v-if="competitor.unitPrice" class="detail-row">
                    <span class="label">单价：</span>
                    <span class="value">{{ formatCurrency(competitor.unitPrice) }}</span>
                  </div>
                  <div v-if="competitor.policy" class="detail-row">
                    <span class="label">政策：</span>
                    <span class="value">{{ competitor.policy }}</span>
                  </div>
                  <div v-if="competitor.advantages" class="detail-row">
                    <span class="label">优势：</span>
                    <span class="value">{{ competitor.advantages }}</span>
                  </div>
                  <div v-if="competitor.problems" class="detail-row">
                    <span class="label">问题：</span>
                    <span class="value">{{ competitor.problems }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSolution.alternatives && currentSolution.alternatives.length > 0" label="可替代产品" :span="2">
            <div class="alternative-list">
              <div
                v-for="alternative in currentSolution.alternatives"
                :key="alternative.id"
                class="alternative-item"
              >
                <div class="alternative-header">
                  <strong>{{ alternative.productName }}</strong>
                  <span v-if="alternative.spec" class="spec">（{{ alternative.spec }}）</span>
                </div>
                <div class="alternative-details">
                  <div v-if="alternative.annualPotentialAmount" class="detail-row">
                    <span class="label">预估年用量：</span>
                    <span class="value">{{ formatCurrency(alternative.annualPotentialAmount) }}</span>
                    <span v-if="alternative.unit" class="unit">{{ alternative.unit }}</span>
                  </div>
                  <div v-if="alternative.unitPrice" class="detail-row">
                    <span class="label">单价：</span>
                    <span class="value">{{ formatCurrency(alternative.unitPrice) }}</span>
                  </div>
                  <div v-if="alternative.advantages" class="detail-row">
                    <span class="label">优势：</span>
                    <span class="value">{{ alternative.advantages }}</span>
                  </div>
                  <div v-if="alternative.disadvantages" class="detail-row">
                    <span class="label">短板：</span>
                    <span class="value">{{ alternative.disadvantages }}</span>
                  </div>
                  <div v-if="alternative.strategy" class="detail-row">
                    <span class="label">策略：</span>
                    <span class="value">{{ alternative.strategy }}</span>
                  </div>
                  <div v-if="alternative.notes" class="detail-row">
                    <span class="label">备注：</span>
                    <span class="value">{{ alternative.notes }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag :type="getResultTagType(currentSolution.result)" size="small">
              {{ getResultLabel(currentSolution.result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="使用次数">
            {{ currentSolution.usageCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            {{ currentSolution.successRate ? `${currentSolution.successRate}%` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSolution.result === 'won' && currentSolution.winReasons && currentSolution.winReasons.length > 0" label="成功原因" :span="2">
            <el-tag
              v-for="reason in currentSolution.winReasons"
              :key="reason"
              size="small"
              type="success"
              style="margin-right: 8px; margin-bottom: 4px"
            >
              {{ getWinReasonLabel(reason) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSolution.result === 'lost' && currentSolution.loseReasons && currentSolution.loseReasons.length > 0" label="失败原因" :span="2">
            <el-tag
              v-for="reason in currentSolution.loseReasons"
              :key="reason"
              size="small"
              type="info"
              style="margin-right: 8px; margin-bottom: 4px"
            >
              {{ getLoseReasonLabel(reason) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="价格策略" :span="2">
            <div style="white-space: pre-wrap">{{ currentSolution.pricingStrategy || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="服务策略" :span="2">
            <div style="white-space: pre-wrap">{{ currentSolution.serviceStrategy || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="技术方案" :span="2">
            <div style="white-space: pre-wrap">{{ currentSolution.technicalSolution || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="客户关键反馈" :span="2">
            <div style="white-space: pre-wrap">{{ currentSolution.keyFeedback || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="经验教训" :span="2">
            <div style="white-space: pre-wrap">{{ currentSolution.lessonsLearned || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSolution.productList && currentSolution.productList.length > 0" label="产品清单" :span="2">
            <el-table :data="currentSolution.productList" border size="small">
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="spec" label="规格" />
              <el-table-column prop="quantity" label="数量" />
              <el-table-column prop="unitPrice" label="单价">
                <template #default="{ row }">
                  {{ formatCurrency(row.unitPrice) }}
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额">
                <template #default="{ row }">
                  {{ formatCurrency(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentSolution.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后使用时间">
            {{ currentSolution.lastUsedAt ? formatDateTime(currentSolution.lastUsedAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import solutionLibraryApi, {
  type SolutionLibrary,
  SolutionResult,
  type LoseReason,
} from '@/api/solutionLibrary'
import dictionaryApi from '@/api/dictionary'

// 搜索表单
const searchForm = reactive({
  search: '',
  industry: undefined as string | undefined,
  result: undefined as string | undefined,
  sourceType: undefined as string | undefined,
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 数据
const loading = ref(false)
const solutionList = ref<SolutionLibrary[]>([])
const industryOptions = ref<Array<{ label: string; value: string }>>([])

// 详情对话框
const detailDialogVisible = ref(false)
const currentSolution = ref<SolutionLibrary | null>(null)

// 格式化日期时间
const formatDateTime = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// 获取行业标签
const getIndustryLabel = (value?: string) => {
  if (!value) return '-'
  const option = industryOptions.value.find((opt) => opt.value === value)
  return option?.label || value
}

// 获取结果标签
const getResultLabel = (result: SolutionResult) => {
  const map: Record<SolutionResult, string> = {
    [SolutionResult.LOST]: '输单',
    [SolutionResult.WON]: '赢单',
    [SolutionResult.ON_HOLD]: '搁置',
  }
  return map[result] || result
}

// 获取结果标签类型
const getResultTagType = (result: SolutionResult) => {
  const map: Record<SolutionResult, string> = {
    [SolutionResult.LOST]: 'danger',
    [SolutionResult.WON]: 'success',
    [SolutionResult.ON_HOLD]: 'warning',
  }
  return map[result] || 'info'
}

// 获取成功原因标签
const getWinReasonLabel = (reason: string) => {
  const map: Record<string, string> = {
    price: '价格优势',
    technology: '技术优势',
    delivery: '交期优势',
    relationship: '关系优势',
    service: '服务优势',
    other: '其他',
  }
  return map[reason] || reason
}

// 获取失败原因标签
const getLoseReasonLabel = (reason: LoseReason) => {
  const map: Record<LoseReason, string> = {
    price: '价格劣势',
    technology: '技术劣势',
    delivery: '交期劣势',
    relationship: '关系劣势',
    budget_change: '预算变化',
    competitor: '竞争对手优势',
    other: '其他',
  }
  return map[reason] || reason
}

// 加载行业选项
const loadIndustryOptions = async () => {
  try {
    const response = await dictionaryApi.getItems('industry')
    if (response.code === 200 && Array.isArray(response.data)) {
      industryOptions.value = response.data.map((item: any) => ({
        label: item.label || item.name || item.value,
        value: item.value || item.code || item.label,
      }))
    }
  } catch (error) {
    console.error('加载行业选项失败:', error)
  }
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const response = await solutionLibraryApi.getList({
      search: searchForm.search || undefined,
      industry: searchForm.industry,
      result: searchForm.result as any,
      sourceType: searchForm.sourceType as any,
      page: pagination.page,
      limit: pagination.limit,
    })
    if (response.code === 200) {
      solutionList.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error: any) {
    console.error('加载列表失败:', error)
    ElMessage.error(error.message || '加载列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadList()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.industry = undefined
  searchForm.result = undefined
  searchForm.sourceType = undefined
  handleSearch()
}

// 分页变化
const handleSizeChange = () => {
  loadList()
}

const handlePageChange = () => {
  loadList()
}

// 行点击
const handleRowClick = (row: SolutionLibrary) => {
  handleView(row)
}

// 查看详情
const handleView = async (row: SolutionLibrary) => {
  try {
    const response = await solutionLibraryApi.getDetail(row.id)
    if (response.code === 200) {
      currentSolution.value = response.data
      detailDialogVisible.value = true
    }
  } catch (error: any) {
    console.error('获取详情失败:', error)
    ElMessage.error(error.message || '获取详情失败')
  }
}

// 删除
const handleDelete = async (row: SolutionLibrary) => {
  try {
    await ElMessageBox.confirm('确定要删除此方案吗？', '提示', {
      type: 'warning',
    })
    await solutionLibraryApi.delete(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadIndustryOptions()
  loadList()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.solution-library-management {
  @extend .table-page;
}

.solution-detail {
  :deep(.el-descriptions__label) {
    font-weight: 500;
    width: 120px;
  }

  .competitor-list,
  .alternative-list {
    width: 100%;
  }

  .competitor-item,
  .alternative-item {
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    border-left: 3px solid #409eff;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .competitor-header,
  .alternative-header {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;

    .spec {
      color: #909399;
      font-weight: normal;
    }
  }

  .competitor-details,
  .alternative-details {
    font-size: 13px;
    color: #606266;
  }

  .detail-row {
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      flex: 0 0 80px;
      color: #909399;
      text-align: left;
    }

    .value {
      flex: 1;
      color: #303133;
      word-break: break-all;
    }

    .unit {
      margin-left: 4px;
      color: #909399;
    }
  }
}
</style>

