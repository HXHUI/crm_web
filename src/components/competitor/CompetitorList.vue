<template>
  <div class="competitor-list">
    <el-table :data="pagedList" border style="width: 100%" v-loading="loading">
      <el-table-column type="expand">
        <template #default="{ row }">
          <AlternativeList
            :competitor-id="Number(row.id)"
            :related-type="relatedType"
            :related-id="Number(relatedId)"
          />
        </template>
      </el-table-column>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column label="关联对象" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.relatedType && (row.relatedObjectName || row.relatedId)">
            <el-tag :type="getRelatedTypeTagType(row.relatedType)" size="small">
              {{ getRelatedTypeLabel(row.relatedType) }}
            </el-tag>
            {{ row.relatedObjectName || `#${row.relatedId}` }}
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="manufacturer" label="竞品厂家" min-width="160" />
      <el-table-column prop="productName" label="产品名称" min-width="140" />
      <el-table-column prop="annualUsageAmount" label="年用量(万元)" width="120">
        <template #default="{ row }">
          {{ formatWan(row.annualUsageAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="unitPrice" label="单价(万元)" width="120">
        <template #default="{ row }">
          {{ formatWan(row.unitPrice) }}
        </template>
      </el-table-column>
      <el-table-column prop="policy" label="政策" min-width="160" show-overflow-tooltip />
      <el-table-column prop="advantages" label="优势" min-width="160" show-overflow-tooltip />
      <el-table-column prop="problems" label="存在的问题" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>


    <div v-if="filteredList.length > 0" class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50]"
        :total="filteredList.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <competitor-form
        ref="formRef"
        :competitor="current"
        :related-type="relatedType"
        :related-id="Number(relatedId)"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import competitorApi, { type Competitor, type RelatedType } from '@/api/competitor'
import CompetitorForm from './CompetitorForm.vue'
import AlternativeList from './AlternativeList.vue'

const props = defineProps<{
  relatedType: RelatedType
  relatedId: number | string
  filterKeyword?: string
}>()

const loading = ref(false)
const saving = ref(false)
const list = ref<Competitor[]>([])
const pagination = reactive({
  page: 1,
  limit: 10,
})
const dialogVisible = ref(false)
const dialogTitle = ref('新增竞品')
const current = ref<Competitor | null>(null)
const formRef = ref<InstanceType<typeof CompetitorForm> | null>(null)

const formatWan = (val?: number | null) => {
  if (val === null || val === undefined) return '-'
  return Number(val).toFixed(2)
}

const typeLabelMap: Record<RelatedType, string> = {
  customer: '客户',
  opportunity: '商机',
  contract: '合同',
  order: '订单',
}

// 获取关联类型的中文标签
const getRelatedTypeLabel = (type: RelatedType) => {
  return typeLabelMap[type] || type
}

// 获取关联类型对应的tag颜色类型
const getRelatedTypeTagType = (type: RelatedType) => {
  const map: Record<RelatedType, string> = {
    customer: 'info',
    opportunity: 'success',
    contract: 'warning',
    order: 'primary',
  }
  return map[type] || ''
}

const loadList = async () => {
  loading.value = true
  try {
    const resp = await competitorApi.list({
      relatedType: props.relatedType,
      relatedId: props.relatedId,
    })
    // 响应拦截器已经返回了 { code, message, data } 格式
    // 需要从 resp.data 中获取数组
    const payload = resp as { code?: number; message?: string; data?: Competitor[] }
    const rows: Competitor[] = Array.isArray(payload.data) ? payload.data : []
    list.value = rows
    // 重置分页
    pagination.page = 1
  } catch (error) {
    console.error('加载竞品失败', error)
    const err = error as any
    ElMessage.error(err?.response?.data?.message || err?.message || '加载竞品失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadList()
})

watch(
  () => [props.relatedType, props.relatedId],
  () => {
    loadList()
  },
)

const filteredList = computed(() => {
  const keyword = (props.filterKeyword || '').trim().toLowerCase()
  if (!keyword) return list.value
  return list.value.filter((item) => {
    const text =
      `${item.manufacturer || ''} ${item.productName || ''} ${item.policy || ''} ${
        item.advantages || ''
      } ${item.problems || ''} ${item.relatedObjectName || ''}`.toLowerCase()
    return text.includes(keyword)
  })
})

const pagedList = computed(() => {
  const start = (pagination.page - 1) * pagination.limit
  const end = start + pagination.limit
  return filteredList.value.slice(start, end)
})

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

const openCreate = () => {
  dialogTitle.value = '新增竞品'
  current.value = null
  dialogVisible.value = true
}

const openEdit = (row: Competitor) => {
  dialogTitle.value = '编辑竞品'
  current.value = row
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const form = formRef.value
  if (!form) return
  try {
    saving.value = true
    const payload = await form.validate()
    if (current.value && current.value.id) {
      await competitorApi.update(current.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await competitorApi.create(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    if (err?.response?.data?.message) {
      ElMessage.error(err.response.data.message || '保存失败')
    } else if (err?.message) {
      ElMessage.error(err.message)
    }
  } finally {
    saving.value = false
  }
}

const handleDelete = (row: Competitor) => {
  ElMessageBox.confirm('确认删除该竞品吗？', '提示', { type: 'warning' })
    .then(async () => {
      await competitorApi.remove(row.id)
      ElMessage.success('删除成功')
      loadList()
    })
    .catch(() => {
      // 用户取消时不做处理
    })
}

defineExpose({
  openCreate,
  openEdit,
  reload: loadList,
})
</script>

<style scoped>
.competitor-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-table) {
  flex: 1 1 auto;
}
.empty-state {
  margin-top: 12px;
}
.pagination-section {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>

