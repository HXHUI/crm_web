<template>
  <div class="lead-management">
    <div class="main-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :inline="true" :model="filters" class="search-form">
            <el-form-item>
              <el-input
                v-model="filters.search"
                placeholder="搜索姓名/公司/电话/邮箱"
                clearable
                @keyup.enter="loadData"
              />
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px">
                <el-option label="新建" value="new" />
                <el-option label="已联系" value="contacted" />
                <el-option label="合格" value="qualified" />
                <el-option label="不合格" value="unqualified" />
                <el-option label="已转化" value="converted" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.rating" placeholder="评分" clearable style="width: 120px">
                <el-option label="热" value="hot" />
                <el-option label="温" value="warm" />
                <el-option label="冷" value="cold" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.source" placeholder="来源" clearable style="width: 160px">
                <el-option
                  v-for="s in sourceOptions"
                  :key="s.key"
                  :label="s.label"
                  :value="s.key"
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
          <el-button type="primary" :icon="Plus" @click="openCreate">新建线索</el-button>
        </div>
      </div>

      <div class="table-section">
        <el-table
          :data="list"
          v-loading="loading"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="姓名/联系人" min-width="160" />
          <el-table-column prop="company" label="公司" min-width="160" show-overflow-tooltip />
          <el-table-column prop="title" label="职位" width="140" show-overflow-tooltip />
          <el-table-column prop="phone" label="电话" width="140" />
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column prop="industry" label="行业" width="120">
            <template #default="{ row }">{{ getIndustryLabel(row.industry) }}</template>
          </el-table-column>
          <el-table-column prop="level" label="客户等级" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getLevelType(row.level)">{{ row.level || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="region" label="所在地区" width="150">
            <template #default="{ row }">{{
              getRegionDisplay(row.province, row.city, row.district)
            }}</template>
          </el-table-column>
          <el-table-column
            prop="addressDetail"
            label="详细地址"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column prop="leadSource" label="来源" width="140">
            <template #default="{ row }">{{ getSourceLabel(row.leadSource) }}</template>
          </el-table-column>
          <el-table-column prop="rating" label="评分" width="110">
            <template #default="{ row }">
              <el-tag :type="getRatingType(row.rating)">{{ getRatingName(row.rating) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="负责人" width="120">
            <template #default="{ row }">
              {{ row.owner?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="openConvert(row)"
                :disabled="row.status === 'converted'"
                >转化</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <el-dialog
        v-model="createVisible"
        title="新建线索"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef" :model="form" label-width="100px">
          <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
          <el-form-item label="公司"><el-input v-model="form.company" /></el-form-item>
          <el-form-item label="职位"><el-input v-model="form.title" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
          <el-form-item label="来源">
            <el-select v-model="form.leadSource" style="width: 100%" placeholder="请选择">
              <el-option v-for="s in sourceOptions" :key="s.key" :label="s.label" :value="s.key" />
            </el-select>
          </el-form-item>
          <el-form-item label="行业">
            <el-select v-model="form.industry" style="width: 100%" placeholder="请选择行业">
              <el-option
                v-for="i in industryOptions"
                :key="i.key"
                :label="i.label"
                :value="i.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="客户等级">
            <el-select v-model="form.level" style="width: 100%" placeholder="请选择等级">
              <el-option label="A级" value="A" />
              <el-option label="B级" value="B" />
              <el-option label="C级" value="C" />
              <el-option label="D级" value="D" />
            </el-select>
          </el-form-item>
          <el-form-item label="所在地区">
            <el-cascader
              v-model="regionValue"
              :options="regionOptions"
              style="width: 100%"
              placeholder="省/市/区"
            />
          </el-form-item>
          <el-form-item label="详细地址"><el-input v-model="form.addressDetail" /></el-form-item>
          <el-form-item label="评分">
            <el-select v-model="form.rating" style="width: 100%">
              <el-option label="热" value="hot" />
              <el-option label="温" value="warm" />
              <el-option label="冷" value="cold" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="convertVisible"
        title="线索转化"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form :model="convertForm" label-width="120px">
          <el-form-item label="商机金额"
            ><el-input v-model.number="convertForm.amount" type="number" placeholder="0"
          /></el-form-item>
          <el-form-item label="预计成交时间"
            ><el-date-picker
              v-model="convertForm.expectedCloseDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
          /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="convertVisible = false">取消</el-button>
          <el-button type="primary" @click="submitConvert" :loading="convertLoading"
            >确认转化</el-button
          >
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import leadApi, { type Lead, type QueryLeadDto } from '@/api/lead'
import { ElMessage } from 'element-plus'
import commonApi from '@/api/common'

const loading = ref(false)
const list = ref<Lead[]>([])
const selectedRows = ref<Lead[]>([])
const filters = reactive<QueryLeadDto>({
  search: '',
  status: undefined,
  rating: undefined,
  source: undefined,
  page: 1,
  limit: 10,
})
const pagination = reactive({ page: 1, limit: 10, total: 0 })

const createVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const form = reactive<{
  name?: string
  company?: string
  title?: string
  phone?: string
  email?: string
  leadSource?: string
  rating?: 'hot' | 'warm' | 'cold'
  industry?: string
  level?: string
  province?: string
  city?: string
  district?: string
  addressDetail?: string
}>({
  name: '',
  company: '',
  title: '',
  phone: '',
  email: '',
  leadSource: '',
  rating: 'warm',
  industry: '',
  level: '',
  province: '',
  city: '',
  district: '',
  addressDetail: '',
})

const regionOptions = ref<
  Array<{
    label: string
    value: string
    children?: Array<{
      label: string
      value: string
      children?: Array<{ label: string; value: string }>
    }>
  }>
>([])
const regionValue = ref<string[]>([])
watch(regionValue, (val) => {
  form.province = val?.[0] || ''
  form.city = val?.[1] || ''
  form.district = val?.[2] || ''
})

const convertVisible = ref(false)
const currentLead = ref<Lead | null>(null)
const convertForm = reactive<{ amount?: number; expectedCloseDate?: string }>({
  amount: 0,
  expectedCloseDate: '',
})
const convertLoading = ref(false)

const sourceOptions = ref<{ key: string; label: string }[]>([])
const getSourceLabel = (key?: string) =>
  sourceOptions.value.find((s) => s.key === key)?.label || '-'
const industryOptions = ref<{ key: string; label: string }[]>([])
const getIndustryLabel = (key?: string) =>
  industryOptions.value.find((i) => i.key === key)?.label || '-'

const getRatingType = (r?: string) => (r === 'hot' ? 'danger' : r === 'cold' ? 'info' : 'warning')
const getRatingName = (r?: string) => (r === 'hot' ? '热' : r === 'cold' ? '冷' : '温')

// 获取客户等级颜色
const getLevelType = (level?: string) => {
  const colorMap: Record<string, string> = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'info',
  }
  return colorMap[level || ''] || 'default'
}

// 获取地区显示
const getRegionDisplay = (province?: string, city?: string, district?: string) => {
  const parts = [province, city, district].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : '-'
}
const getStatusType = (s?: string) => {
  const colorMap: Record<string, string> = {
    new: 'info',
    contacted: 'primary',
    qualified: 'success',
    unqualified: 'warning',
    converted: 'success',
  }
  return colorMap[s || 'new'] || 'default'
}

const getStatusName = (s?: string) => {
  const nameMap: Record<string, string> = {
    new: '新建',
    contacted: '已联系',
    qualified: '合格',
    unqualified: '不合格',
    converted: '已转化',
  }
  return nameMap[s || 'new'] || s || '新建'
}

const loadSources = async () => {
  try {
    const resp = await leadApi.sources()
    sourceOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}
const loadIndustries = async () => {
  try {
    const resp = await commonApi.industries()
    industryOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}

const loadData = async () => {
  try {
    loading.value = true
    const resp = await leadApi.getList({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    })
    const payload = (resp as unknown as { data: { leads: Lead[]; total: number } }).data || {
      leads: [],
      total: 0,
    }
    list.value = payload.leads
    pagination.total = payload.total
  } catch {
    ElMessage.error('加载线索失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}
const handleReset = () => {
  Object.assign(filters, { search: '', status: undefined, rating: undefined, source: undefined })
  pagination.page = 1
  loadData()
}
const handleSizeChange = (n: number) => {
  pagination.limit = n
  pagination.page = 1
  loadData()
}
const handleCurrentChange = (p: number) => {
  pagination.page = p
  loadData()
}
const handleSelectionChange = (rows: Lead[]) => {
  selectedRows.value = rows
}

const openCreate = () => {
  createVisible.value = true
}
const submitCreate = async () => {
  try {
    submitLoading.value = true
    await leadApi.create(form)
    ElMessage.success('创建成功')
    createVisible.value = false
    loadData()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submitLoading.value = false
  }
}

const openConvert = (row: Lead) => {
  currentLead.value = row
  convertVisible.value = true
}
const submitConvert = async () => {
  if (!currentLead.value) return
  try {
    convertLoading.value = true
    await leadApi.convert(currentLead.value.id, convertForm)
    ElMessage.success('转化成功')
    convertVisible.value = false
    loadData()
  } catch {
    ElMessage.error('转化失败')
  } finally {
    convertLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadSources(), loadIndustries()])
  try {
    const resp = await commonApi.regions()
    regionOptions.value =
      (
        resp as unknown as {
          data: Array<{
            label: string
            value: string
            children?: Array<{
              label: string
              value: string
              children?: Array<{ label: string; value: string }>
            }>
          }>
        }
      ).data || []
  } catch {
    // 忽略错误
  }
  await loadData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.lead-management {
  @extend .table-page;
}

.pagination-section {
  text-align: right;
}
</style>
