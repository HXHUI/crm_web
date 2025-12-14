<template>
  <div class="target-management">
    <div class="main-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="query" :inline="true" class="search-form">
            <el-form-item>
              <el-select v-model="query.year" style="width: 120px">
                <el-option v-for="y in years" :key="y" :label="y" :value="y" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="query.ownerType"
                multiple
                collapse-tags
                clearable
                placeholder="选择对象类型"
                style="width: 200px"
              >
                <el-option label="公司" value="tenant" />
                <el-option label="部门" value="department" />
                <el-option label="个人" value="member" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="query.targetTypes"
                multiple
                collapse-tags
                clearable
                placeholder="选择指标类型"
                style="width: 260px"
              >
                <el-option-group label="财务结果指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'financial')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  />
                </el-option-group>
                <el-option-group label="销售漏斗指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'funnel')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  />
                </el-option-group>
                <el-option-group label="客户指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'customer')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  />
                </el-option-group>
                <el-option-group label="过程活动指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'activity')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
          <el-button type="primary" @click="openSetDialog">设置目标</el-button>
        </div>
      </div>

      <div class="table-section">
        <el-table 
          :data="tableData" 
          border 
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="ownerName" label="对象" min-width="160" fixed="left" />
          <el-table-column prop="typeName" label="指标类型" width="120" fixed="left">
            <template #default="{ row }">{{ getMetricName(row.typeName) }}</template>
          </el-table-column>
          <el-table-column label="全年" align="right" width="140" fixed="left">
            <template #default="{ row }">{{ formatValue(row.total) }}</template>
          </el-table-column>
          <el-table-column label="第一季度" align="right" min-width="110">
            <template #default="{ row }">{{
              formatValue(row.monthValues[0] + row.monthValues[1] + row.monthValues[2])
            }}</template>
          </el-table-column>
          <el-table-column label="1月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[0]) }}</template>
          </el-table-column>
          <el-table-column label="2月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[1]) }}</template>
          </el-table-column>
          <el-table-column label="3月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[2]) }}</template>
          </el-table-column>
          <el-table-column label="第二季度" align="right" min-width="110">
            <template #default="{ row }">{{
              formatValue(row.monthValues[3] + row.monthValues[4] + row.monthValues[5])
            }}</template>
          </el-table-column>
          <el-table-column label="4月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[3]) }}</template>
          </el-table-column>
          <el-table-column label="5月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[4]) }}</template>
          </el-table-column>
          <el-table-column label="6月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[5]) }}</template>
          </el-table-column>
          <el-table-column label="第三季度" align="right" min-width="110">
            <template #default="{ row }">{{
              formatValue(row.monthValues[6] + row.monthValues[7] + row.monthValues[8])
            }}</template>
          </el-table-column>
          <el-table-column label="7月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[6]) }}</template>
          </el-table-column>
          <el-table-column label="8月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[7]) }}</template>
          </el-table-column>
          <el-table-column label="9月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[8]) }}</template>
          </el-table-column>
          <el-table-column label="第四季度" align="right" min-width="110">
            <template #default="{ row }">{{
              formatValue(row.monthValues[9] + row.monthValues[10] + row.monthValues[11])
            }}</template>
          </el-table-column>
          <el-table-column label="10月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[9]) }}</template>
          </el-table-column>
          <el-table-column label="11月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[10]) }}</template>
          </el-table-column>
          <el-table-column label="12月" align="right" min-width="90">
            <template #default="{ row }">{{ formatValue(row.monthValues[11]) }}</template>
          </el-table-column>

          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openSetDialog(row)">设置</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-section" v-if="false">
        <!-- 预留分页，如后端支持分页再打开 -->
      </div>
    </div>

    <!-- 目标设置弹窗（按月） -->
    <el-dialog v-model="dialog.visible" title="设置目标" width="900px">
      <div class="dialog-grid">
        <el-form :model="form" label-width="90px" class="form-row">
          <div class="form-grid three-cols">
            <el-form-item label="对象类型">
              <el-select v-model="form.ownerType" placeholder="对象类型" style="width: 160px">
                <el-option label="公司" value="tenant" />
                <el-option label="部门" value="department" />
                <el-option label="个人" value="member" />
              </el-select>
            </el-form-item>
            <el-form-item label="选择对象">
              <el-select
                v-model="form.ownerIds"
                multiple
                collapse-tags
                placeholder="选择对象"
                filterable
                :loading="loading"
                style="width: 160px"
              >
                <el-option v-for="o in ownerOptions" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="指标类型">
              <el-select v-model="form.targetType" placeholder="指标类型" style="width: 220px">
                <!-- 财务 / 结果类 -->
                <el-option-group label="财务结果指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'financial')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  >
                    <el-tooltip placement="right" effect="dark">
                      <template #content>
                        <div style="max-width: 260px; line-height: 1.4">
                          <div><strong>{{ metricConfig[key].label }}</strong>（{{ metricConfig[key].unit }}）</div>
                          <div>{{ metricConfig[key].desc }}</div>
                        </div>
                      </template>
                      <span>{{ metricConfig[key].label }}</span>
                    </el-tooltip>
                  </el-option>
                </el-option-group>

                <!-- 销售漏斗类 -->
                <el-option-group label="销售漏斗指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'funnel')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  >
                    <el-tooltip placement="right" effect="dark">
                      <template #content>
                        <div style="max-width: 260px; line-height: 1.4">
                          <div><strong>{{ metricConfig[key].label }}</strong>（{{ metricConfig[key].unit }}）</div>
                          <div>{{ metricConfig[key].desc }}</div>
                        </div>
                      </template>
                      <span>{{ metricConfig[key].label }}</span>
                    </el-tooltip>
                  </el-option>
                </el-option-group>

                <!-- 客户类 -->
                <el-option-group label="客户指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'customer')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  >
                    <el-tooltip placement="right" effect="dark">
                      <template #content>
                        <div style="max-width: 260px; line-height: 1.4">
                          <div><strong>{{ metricConfig[key].label }}</strong>（{{ metricConfig[key].unit }}）</div>
                          <div>{{ metricConfig[key].desc }}</div>
                        </div>
                      </template>
                      <span>{{ metricConfig[key].label }}</span>
                    </el-tooltip>
                  </el-option>
                </el-option-group>

                <!-- 过程 / 活动类 -->
                <el-option-group label="过程活动指标">
                  <el-option
                    v-for="key in Object.keys(metricConfig).filter(k => metricConfig[k].group === 'activity')"
                    :key="key"
                    :value="key"
                    :label="metricConfig[key].label"
                  >
                    <el-tooltip placement="right" effect="dark">
                      <template #content>
                        <div style="max-width: 260px; line-height: 1.4">
                          <div><strong>{{ metricConfig[key].label }}</strong>（{{ metricConfig[key].unit }}）</div>
                          <div>{{ metricConfig[key].desc }}</div>
                        </div>
                      </template>
                      <span>{{ metricConfig[key].label }}</span>
                    </el-tooltip>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
            <el-form-item label="年度目标" class="year-target-item">
              <div class="year-target">
                <el-input-number
                  style="width: 160px"
                  v-model="form.yearTarget"
                  :min="0"
                  :precision="2"
                  :controls="false"
                />
                <span class="unit">{{ form.unit }}</span>
              </div>
            </el-form-item>
            <div class="el-form-item asterisk-left el-form-item--label-right">
              <el-button @click="averageDistribute" type="primary">平均分配到每月</el-button>
            </div>
          </div>
        </el-form>
        <!-- 旧的无标签行已移除 -->
        <div class="quarters">
          <div class="qcol" v-for="q in 4" :key="q">
            <div class="q-head">
              <div class="q-row q-row-head">
                <span class="q-name">第{{ q }}季度</span>
                <el-input-number
                  :model-value="quarterTotal(q)"
                  :precision="2"
                  disabled
                  :controls="false"
                />
              </div>
              <div class="q-divider" />
            </div>
            <div class="q-rows">
              <div class="q-row" v-for="m in 3" :key="m">
                <span class="m-label">{{ monthLabel(q, m) }}</span>
                <el-input-number
                  :min="0"
                  :precision="2"
                  :controls="false"
                  v-model="form.months[(q - 1) * 3 + (m - 1)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTargets">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import targetApi from '@/api/target'
import { useAuthStore } from '@/stores/modules/auth'

const auth = useAuthStore()
const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i)
const query = reactive({
  year: new Date().getFullYear(),
  ownerType: [] as ('tenant' | 'department' | 'member')[],
  targetTypes: [] as string[],
})
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const dialog = reactive({ visible: false })
const loading = ref(false)
const saving = ref(false)
const ownerOptions = ref<{ id: string; name: string }[]>([])
const form = reactive({
  ownerType: 'department' as 'tenant' | 'department' | 'member',
  ownerIds: [] as string[],
  targetType: 'sales_amount',
  unit: '元',
  yearTarget: 0,
  months: Array(12).fill(0) as number[],
})

// 指标配置：名称 + 单位 + 含义，用于下拉展示和单位切换
const metricConfig: Record<
  string,
  { label: string; unit: string; desc: string; group: 'financial' | 'funnel' | 'customer' | 'activity' }
> = {
  // 财务结果
  contract_amount: {
    label: '合同金额',
    unit: '元',
    desc: '统计周期内已签署合同的金额总和（按合同签订日期）',
    group: 'financial',
  },
  sales_amount: {
    label: '订单金额（销售额）',
    unit: '元',
    desc: '统计周期内已生效订单的金额总和（按订单生效/签订日期）',
    group: 'financial',
  },
  new_sales_amount: {
    label: '新增销售额',
    unit: '元',
    desc: '统计周期内来自新签订单的金额（不含续约/追加）',
    group: 'financial',
  },
  orders_count: {
    label: '订单数量',
    unit: '个',
    desc: '统计周期内新增生效订单/合同的数量',
    group: 'financial',
  },

  // 销售漏斗
  new_leads: {
    label: '新增线索数',
    unit: '个',
    desc: '统计周期内新录入/导入的线索数量',
    group: 'funnel',
  },
  new_customers: {
    label: '新增客户数',
    unit: '个',
    desc: '统计周期内从线索或其他渠道转化而来的新客户数量',
    group: 'funnel',
  },
  new_opportunities: {
    label: '新增商机数',
    unit: '个',
    desc: '统计周期内新创建的商机数量',
    group: 'funnel',
  },
  open_opportunities: {
    label: '在库商机数',
    unit: '个',
    desc: '统计周期结束时处于进行中状态的商机数量',
    group: 'funnel',
  },
  won_opportunities: {
    label: '赢单商机数',
    unit: '个',
    desc: '统计周期内状态变为赢单/成交的商机数量',
    group: 'funnel',
  },
  win_rate: {
    label: '成交率（赢单率）',
    unit: '%',
    desc: '赢单商机数 ÷ 已关闭商机数（赢单+输单）',
    group: 'funnel',
  },
  lead_to_customer_rate: {
    label: '线索转客户率',
    unit: '%',
    desc: '线索成功转为客户的数量 ÷ 新增线索数',
    group: 'funnel',
  },
  lead_to_opportunity_rate: {
    label: '线索转商机率',
    unit: '%',
    desc: '线索成功立项为商机的数量 ÷ 新增线索数',
    group: 'funnel',
  },
  opportunity_to_order_rate: {
    label: '商机转订单率',
    unit: '%',
    desc: '转成订单的商机数量 ÷ 本期关闭商机数量',
    group: 'funnel',
  },
  customer_conversion: {
    label: '客户转化率',
    unit: '%',
    desc: '从线索最终转化为付费客户的数量 ÷ 新增线索数',
    group: 'funnel',
  },

  // 客户类
  activated_customers: {
    label: '激活客户数',
    unit: '个',
    desc: '本期有报价/商机/订单/拜访/跟进等任一业务行为的客户数量',
    group: 'customer',
  },
  key_accounts: {
    label: '重点客户数',
    unit: '个',
    desc: '被标记为重点客户/大客户的客户数量',
    group: 'customer',
  },

  // 过程活动
  follow_ups: {
    label: '跟进次数',
    unit: '次',
    desc: '统计周期内记录的所有跟进次数（电话/微信/邮件/拜访等）',
    group: 'activity',
  },
  visit_count: {
    label: '外出拜访次数',
    unit: '次',
    desc: '统计周期内记录为外出拜访的次数',
    group: 'activity',
  },
}

const formatValue = (v: number) => (v == null ? '-' : Number(v).toLocaleString('zh-CN'))
const getMetricName = (key?: string) => {
  if (!key) return '-'
  return metricConfig[key]?.label || key
}

const loadOwners = async () => {
  loading.value = true
  try {
    const tenantId = auth.tenant?.id
    const resp = await targetApi.ownerOptions({ ownerType: form.ownerType, tenantId })
    ownerOptions.value = resp.data || []
  } finally {
    loading.value = false
  }
}

// 当对象类型变化时，清空并重新加载对象选项
watch(
  () => form.ownerType,
  async () => {
    form.ownerIds = []
    await loadOwners()
  },
)

const loadTable = async () => {
  const params: any = { year: query.year }
  // 如果选择了对象类型，则传递参数；未选择则加载全部
  if (query.ownerType && query.ownerType.length > 0) {
    params.ownerType = query.ownerType
  }
  // 如果选择了指标类型，则传递参数；未选择则加载全部
  if (query.targetTypes && query.targetTypes.length > 0) {
    // 以逗号分隔字符串传给后端，避免 targetTypes[] 解析问题
    params.targetTypes = query.targetTypes.join(',')
  }
  const resp = await targetApi.list(params)
  tableData.value = resp.data || []
}

// 监听查询条件变化，自动加载数据
watch(
  () => query.year,
  () => {
    loadTable()
  }
)
watch(
  () => query.ownerType,
  () => {
    loadTable()
  },
  { deep: true }
)
watch(
  () => query.targetTypes,
  () => {
    loadTable()
  },
  { deep: true }
)

const averageDistribute = () => {
  const base = Math.floor((form.yearTarget * 100) / 12) / 100
  const remainder = Math.round((form.yearTarget - base * 12) * 100) / 100
  form.months = Array(12).fill(base)
  // 把余数加到最后一个月
  form.months[11] = Math.round((form.months[11] + remainder) * 100) / 100
}

const quarterTotal = (q: number) => {
  const start = (q - 1) * 3
  const arr = form.months.slice(start, start + 3)
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0)
  return Math.round(sum * 100) / 100
}

const monthLabel = (q: number, m: number) => {
  const month = (q - 1) * 3 + m
  return `${month}月份`
}

// 根据指标类型自动切换单位
watch(
  () => form.targetType,
  (t) => {
    form.unit = metricConfig[t]?.unit || '元'
  },
  { immediate: true },
)

const openSetDialog = async (row?: any) => {
  if (row) {
    form.ownerType = (row.ownerType || query.ownerType) as any
    await loadOwners()
    form.ownerIds = row.ownerId ? [row.ownerId] : []
    form.targetType = row.typeName || form.targetType
    // 回显月份：将 row.monthValues 映射回 form.months
    if (Array.isArray(row.monthValues) && row.monthValues.length === 12) {
      form.months = row.monthValues.slice()
      form.yearTarget =
        row.total || row.monthValues.reduce((a: number, b: number) => a + (Number(b) || 0), 0)
    } else {
      // 无历史时，按当前类型初始化
      form.yearTarget = 0
      form.months = Array(12).fill(0)
    }
  } else {
    await loadOwners()
  }
  dialog.visible = true
}

const saveTargets = async () => {
  if (!form.ownerIds || form.ownerIds.length === 0) return ElMessage.error('请选择对象')
  saving.value = true
  try {
    await targetApi.saveYearTargets({ ...form, year: query.year, tenantId: auth.tenant?.id })
    ElMessage.success('已保存')
    dialog.visible = false
    await loadTable()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 单个删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${row.ownerName}"的"${getMetricName(row.typeName)}"目标吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await targetApi.delete({
      ownerType: row.ownerType,
      ownerId: row.ownerId,
      targetType: row.typeName,
      year: query.year,
    })
    
    ElMessage.success('删除成功')
    await loadTable()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的目标')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条目标吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 批量删除
    const deletePromises = selectedRows.value.map((row) =>
      targetApi.delete({
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        targetType: row.typeName,
        year: query.year,
      })
    )
    
    await Promise.all(deletePromises)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    await loadTable()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除失败')
    }
  }
}

onMounted(() => {
  loadTable()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.target-management {
  @extend .table-page;
}

.target-management .toolbar {
  margin-bottom: 12px;
}
.ml8 {
  margin-left: 8px;
}
.dialog-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 12px 16px;
  align-items: center;
}
.form-grid.three-cols {
  grid-template-columns: auto 1fr auto;
  align-items: end;
}
.form-grid.two-cols {
  grid-template-columns: 1fr 1fr;
}
.form-actions-inline {
  display: flex;
  align-items: flex-end;
}
.form-actions {
  display: flex;
  align-items: center;
}
.year-target {
  display: flex;
  align-items: center;
  gap: 8px;
}
.year-target .unit {
  color: #6b7280;
}
.dialog-grid .row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.quarters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.qcol {
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 6px;
  padding: 12px;
}
.q-head {
  margin-bottom: 8px;
}
.q-name {
  font-weight: 600;
  color: #2f3b52;
  white-space: nowrap;
}
.q-divider {
  height: 1px;
  background: #e6e8ef;
  margin-top: 8px;
}
.q-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.q-row {
  display: grid;
  grid-template-columns: 70px 1fr;
  align-items: center;
  gap: 8px;
}
.q-row-head {
  grid-template-columns: 70px 1fr;
}
.m-label {
  color: #6b7280;
  font-size: 13px;
}
:deep(.q-row .el-input-number) {
  width: 100%;
}

/* 小屏幕适配：两列或一列 */
@media (max-width: 1200px) {
  .quarters {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .quarters {
    grid-template-columns: 1fr;
  }
}
</style>
