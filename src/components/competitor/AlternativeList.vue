<template>
  <div class="alternative-list">
    <div class="alternative-header">
      <span class="title">可替代产品</span>
      <el-button type="primary" link size="small" @click="openCreate">新增可替代产品</el-button>
    </div>
    <el-table :data="list" border size="small" v-loading="loading" style="width: 100%">
      <el-table-column type="index" width="50" />
      <el-table-column prop="productName" label="产品名称" min-width="140" />
      <el-table-column prop="spec" label="规格型号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="unitPrice" label="单价(元)" width="110">
        <template #default="{ row }">
          {{ formatPrice(row.unitPrice) }}
        </template>
      </el-table-column>
      <el-table-column prop="annualPotentialAmount" label="年用量(万元)" width="120">
        <template #default="{ row }">
          {{ formatWan(row.annualPotentialAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="advantages" label="优势" min-width="140" show-overflow-tooltip />
      <el-table-column prop="strategy" label="销售政策" min-width="140" show-overflow-tooltip />
      <el-table-column prop="notes" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>



    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
      append-to-body
      modal-class="alternative-dialog-modal"
    >
      <AlternativeForm ref="formRef" :alternative="current" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CompetitorAlternative, RelatedType } from '@/api/competitorAlternative'
import { competitorAlternativeApi } from '@/api/competitorAlternative'
import AlternativeForm from './AlternativeForm.vue'

const props = defineProps<{
  competitorId: number
  relatedType: RelatedType
  relatedId: number
}>()

const loading = ref(false)
const saving = ref(false)
const list = ref<CompetitorAlternative[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增可替代产品')
const current = ref<CompetitorAlternative | null>(null)
const formRef = ref<InstanceType<typeof AlternativeForm> | null>(null)

const formatWan = (val?: number | null) => {
  if (val === null || val === undefined) return '-'
  return Number(val).toFixed(2)
}

const formatPrice = (val?: number | null) => {
  if (val === null || val === undefined) return '-'
  return Number(val).toFixed(2)
}

const loadList = async () => {
  if (!props.competitorId) return
  loading.value = true
  try {
    const resp = await competitorAlternativeApi.list({
      competitorId: props.competitorId,
      relatedType: props.relatedType,
      relatedId: props.relatedId,
    })
    const payload = resp as { data?: CompetitorAlternative[] } | CompetitorAlternative[]
    const rows: CompetitorAlternative[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
      ? payload.data!
      : []
    list.value = rows
  } catch (error) {
    console.error('加载可替代产品失败', error)
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err?.response?.data?.message || err?.message || '加载可替代产品失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  dialogTitle.value = '新增可替代产品'
  current.value = null
  dialogVisible.value = true
}

const openEdit = (row: CompetitorAlternative) => {
  dialogTitle.value = '编辑可替代产品'
  current.value = row
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    saving.value = true
    const payload = await formRef.value.validate()
    if (!payload) return
    if (current.value && current.value.id) {
      await competitorAlternativeApi.update(current.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await competitorAlternativeApi.create({
        competitorId: props.competitorId,
        relatedType: props.relatedType,
        relatedId: props.relatedId,
        ...payload,
      })
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

const handleDelete = (row: CompetitorAlternative) => {
  ElMessageBox.confirm('确认删除该可替代产品吗？', '提示', { type: 'warning' })
    .then(async () => {
      await competitorAlternativeApi.remove(row.id)
      ElMessage.success('删除成功')
      await loadList()
    })
    .catch(() => {})
}

onMounted(() => {
  loadList()
})

watch(
  () => props.competitorId,
  () => {
    loadList()
  },
)
</script>

<style scoped>
.alternative-list {
  padding: 12px 16px 4px;
  background: #fafafa;
  border-top: 1px solid #ebeef5;
}

.alternative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alternative-header .title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.empty-state {
  margin-top: 8px;
}
</style>


