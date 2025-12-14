<template>
  <div class="lead-statistics">
    <div class="main-container">
      <div class="statistics-section" v-loading="statisticsLoading">
        <!-- 核心指标卡片 -->
        <div class="statistics-cards">
          <div class="stat-card" v-for="(item, index) in statisticsCards" :key="index">
            <div class="stat-card-icon" :class="item.iconClass">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-label">{{ item.label }}</div>
              <div class="stat-card-value">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <!-- 第一行：状态分布、来源分布、评分分布 -->
        <div class="charts-row">
          <!-- 状态分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">状态分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="statusPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 来源分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">来源分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="sourcePieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 评分分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">评分分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="ratingPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 第二行图表 -->
        <div class="charts-row">
          <!-- 来源分析柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">来源分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="sourceBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 负责人分析柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">负责人/团队分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="ownerBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 行业分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">行业分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="industryPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 第四行图表 -->
        <div class="charts-row">
          <!-- 地区分布地图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">地区分布</h3>
                <el-button
                  v-if="currentMapLevel === 'city'"
                  size="small"
                  type="primary"
                  @click="backToProvinceMap"
                  style="margin-left: auto"
                >
                  返回省份视图
                </el-button>
              </div>
            </template>
            <div class="chart-content">
              <div ref="regionMapChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 流失分析图表 -->
        <div class="charts-row">
          <!-- 流失原因分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失原因分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnReasonPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 流失阶段分布柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失阶段分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnStageBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 流失类型分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失类型分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnTypePieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <div class="charts-row">
          <!-- 流失趋势折线图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失趋势</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnTrendLineChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 最后一行：转化率分析（占整行） -->
        <div class="charts-row conversion-row">
          <!-- 转化率分析 -->
          <el-card shadow="hover" class="chart-card conversion-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">转化率分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div class="conversion-stats">
                <div class="conversion-item">
                  <div class="conversion-label">总转化率</div>
                  <div class="conversion-value">
                    {{ statisticsData.overview?.conversionRate || 0 }}%
                  </div>
                  <div class="conversion-detail">
                    转化线索：{{ statisticsData.overview?.convertedLeads || 0 }} / 总线索：{{
                      statisticsData.overview?.totalLeads || 0
                    }}
                  </div>
                </div>
                <div
                  class="conversion-item"
                  v-for="source in statisticsData.sourceDistribution"
                  :key="source.source"
                >
                  <div class="conversion-label">{{ getSourceLabel(source.source) }}</div>
                  <div class="conversion-value">{{ source.conversionRate.toFixed(2) }}%</div>
                  <div class="conversion-detail">
                    转化：{{ source.convertedCount || 0 }} / 总数：{{ source.count || 0 }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import leadApi from '@/api/lead'
import commonApi from '@/api/common'
import { ElMessage } from 'element-plus'
import { DataAnalysis, TrendCharts, Clock, Check, Trophy } from '@element-plus/icons-vue'

// 响应式变量
const statisticsLoading = ref(false)
const statisticsData = ref<any>({
  overview: {},
  statusDistribution: [],
  sourceDistribution: [],
  ratingDistribution: [],
})

// 图表 ref
const statusPieChart = ref<HTMLElement | null>(null)
const sourcePieChart = ref<HTMLElement | null>(null)
const ratingPieChart = ref<HTMLElement | null>(null)
const sourceBarChart = ref<HTMLElement | null>(null)
const ownerBarChart = ref<HTMLElement | null>(null)
const industryPieChart = ref<HTMLElement | null>(null)
const regionMapChart = ref<HTMLElement | null>(null)
const churnReasonPieChart = ref<HTMLElement | null>(null)
const churnStageBarChart = ref<HTMLElement | null>(null)
const churnTypePieChart = ref<HTMLElement | null>(null)
const churnTrendLineChart = ref<HTMLElement | null>(null)

// 图表实例
let statusPieChartInstance: echarts.ECharts | null = null
let sourcePieChartInstance: echarts.ECharts | null = null
let ratingPieChartInstance: echarts.ECharts | null = null
let sourceBarChartInstance: echarts.ECharts | null = null
let ownerBarChartInstance: echarts.ECharts | null = null
let industryPieChartInstance: echarts.ECharts | null = null
let regionMapChartInstance: echarts.ECharts | null = null
let churnReasonPieChartInstance: echarts.ECharts | null = null
let churnStageBarChartInstance: echarts.ECharts | null = null
let churnTypePieChartInstance: echarts.ECharts | null = null
let churnTrendLineChartInstance: echarts.ECharts | null = null

// 地图相关
const currentMapLevel = ref<'province' | 'city'>('province')
const currentProvince = ref<string | null>(null)
const cityMapDataCache = ref<Record<string, any>>({})

// 选项数据
const sourceOptions = ref<{ key: string; label: string }[]>([])
const industryOptions = ref<{ key: string; label: string }[]>([])
const unqualifiedReasonOptions = ref<{ key: string; label: string }[]>([])
const lostTypeOptions = ref<{ key: string; label: string }[]>([])

// 工具函数
const getSourceLabel = (key?: string) =>
  sourceOptions.value.find((s) => s.key === key)?.label || '-'
const getIndustryLabel = (key?: string) =>
  industryOptions.value.find((i) => i.key === key)?.label || '-'
const getUnqualifiedReasonLabel = (key?: string) =>
  unqualifiedReasonOptions.value.find((r) => r.key === key)?.label || '-'
const getLostTypeLabel = (key?: string) =>
  lostTypeOptions.value.find((t) => t.key === key)?.label || '-'

// 计算统计卡片数据
const statisticsCards = computed(() => {
  const overview = statisticsData.value.overview || {}
  return [
    {
      label: '总线索数',
      value: overview.totalLeads || 0,
      icon: DataAnalysis,
      iconClass: 'icon-primary',
    },
    {
      label: '今日新增',
      value: overview.todayNewLeads || 0,
      icon: TrendCharts,
      iconClass: 'icon-success',
    },
    {
      label: '待跟进',
      value: overview.pendingLeads || 0,
      icon: Clock,
      iconClass: 'icon-warning',
    },
    {
      label: '合格线索',
      value: overview.qualifiedLeads || 0,
      icon: Check,
      iconClass: 'icon-info',
    },
    {
      label: '转化线索',
      value: overview.convertedLeads || 0,
      icon: Trophy,
      iconClass: 'icon-danger',
    },
    {
      label: '转化率',
      value: `${(overview.conversionRate || 0).toFixed(2)}%`,
      icon: TrendCharts,
      iconClass: 'icon-primary',
    },
  ]
})

// 加载选项数据
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

const loadUnqualifiedReasons = async () => {
  try {
    const resp = await commonApi.unqualifiedReasons()
    unqualifiedReasonOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}

const loadLostTypes = async () => {
  try {
    const resp = await commonApi.lostTypes()
    lostTypeOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    statisticsLoading.value = true
    const response = await leadApi.getStatistics()
    if ((response as any).code === 200 || response.data?.code === 200) {
      statisticsData.value = (response as any).data?.data || (response as any).data || response.data
      // 延迟初始化图表，确保DOM已渲染
      setTimeout(() => {
        initCharts()
      }, 100)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    statisticsLoading.value = false
  }
}

// 初始化所有图表
const initCharts = () => {
  initStatusPieChart()
  initSourcePieChart()
  initRatingPieChart()
  initSourceBarChart()
  initOwnerBarChart()
  initIndustryPieChart()
  initRegionMapChart()
  initChurnReasonPieChart()
  initChurnStageBarChart()
  initChurnTypePieChart()
  initChurnTrendLineChart()
}

// 初始化状态分布饼图
const initStatusPieChart = () => {
  if (!statusPieChart.value) return

  if (statusPieChartInstance) {
    statusPieChartInstance.dispose()
  }

  statusPieChartInstance = echarts.init(statusPieChart.value)

  const data = statisticsData.value.statusDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: item.label,
        })),
      },
    ],
  }

  statusPieChartInstance.setOption(option)
}

// 窗口大小变化时调整图表
const handleResize = () => {
  if (statusPieChartInstance) {
    statusPieChartInstance.resize()
  }
  if (sourcePieChartInstance) {
    sourcePieChartInstance.resize()
  }
  if (ratingPieChartInstance) {
    ratingPieChartInstance.resize()
  }
  if (sourceBarChartInstance) {
    sourceBarChartInstance.resize()
  }
  if (ownerBarChartInstance) {
    ownerBarChartInstance.resize()
  }
  if (industryPieChartInstance) {
    industryPieChartInstance.resize()
  }
  if (regionMapChartInstance) {
    regionMapChartInstance.resize()
  }
  if (churnReasonPieChartInstance) {
    churnReasonPieChartInstance.resize()
  }
  if (churnStageBarChartInstance) {
    churnStageBarChartInstance.resize()
  }
  if (churnTypePieChartInstance) {
    churnTypePieChartInstance.resize()
  }
  if (churnTrendLineChartInstance) {
    churnTrendLineChartInstance.resize()
  }
}

// 生命周期钩子
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await Promise.all([loadSources(), loadIndustries(), loadUnqualifiedReasons(), loadLostTypes()])
  await loadStatistics()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  // 销毁所有图表实例
  if (statusPieChartInstance) {
    statusPieChartInstance.dispose()
    statusPieChartInstance = null
  }
  if (sourcePieChartInstance) {
    sourcePieChartInstance.dispose()
    sourcePieChartInstance = null
  }
  if (ratingPieChartInstance) {
    ratingPieChartInstance.dispose()
    ratingPieChartInstance = null
  }
  if (sourceBarChartInstance) {
    sourceBarChartInstance.dispose()
    sourceBarChartInstance = null
  }
  if (ownerBarChartInstance) {
    ownerBarChartInstance.dispose()
    ownerBarChartInstance = null
  }
  if (industryPieChartInstance) {
    industryPieChartInstance.dispose()
    industryPieChartInstance = null
  }
  if (regionMapChartInstance) {
    regionMapChartInstance.dispose()
    regionMapChartInstance = null
  }
  if (churnReasonPieChartInstance) {
    churnReasonPieChartInstance.dispose()
    churnReasonPieChartInstance = null
  }
  if (churnStageBarChartInstance) {
    churnStageBarChartInstance.dispose()
    churnStageBarChartInstance = null
  }
  if (churnTypePieChartInstance) {
    churnTypePieChartInstance.dispose()
    churnTypePieChartInstance = null
  }
  if (churnTrendLineChartInstance) {
    churnTrendLineChartInstance.dispose()
    churnTrendLineChartInstance = null
  }
})

// 初始化来源分布饼图
const initSourcePieChart = () => {
  if (!sourcePieChart.value) return

  if (sourcePieChartInstance) {
    sourcePieChartInstance.dispose()
  }

  sourcePieChartInstance = echarts.init(sourcePieChart.value)

  const data = statisticsData.value.sourceDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '来源分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getSourceLabel(item.source),
        })),
      },
    ],
  }

  sourcePieChartInstance.setOption(option)
}

// 初始化评分分布饼图
const initRatingPieChart = () => {
  if (!ratingPieChart.value) return

  if (ratingPieChartInstance) {
    ratingPieChartInstance.dispose()
  }

  ratingPieChartInstance = echarts.init(ratingPieChart.value)

  const data = statisticsData.value.ratingDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '评分分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: item.label,
          itemStyle: {
            color:
              item.rating === 'hot' ? '#F56C6C' : item.rating === 'warm' ? '#E6A23C' : '#909399',
          },
        })),
      },
    ],
  }

  ratingPieChartInstance.setOption(option)
}

// 初始化来源分析柱状图
const initSourceBarChart = () => {
  if (!sourceBarChart.value) return

  if (sourceBarChartInstance) {
    sourceBarChartInstance.dispose()
  }

  sourceBarChartInstance = echarts.init(sourceBarChart.value)

  const data = statisticsData.value.sourceDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${param.value}<br/>转化: ${param.data.convertedCount || 0} (${param.data.conversionRate?.toFixed(2) || 0}%)`
      },
    },
    legend: {
      data: ['线索数', '转化数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => getSourceLabel(item.source)),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '线索数',
        type: 'bar',
        data: data.map((item: any) => ({
          value: item.count,
          convertedCount: item.convertedCount,
          conversionRate: item.conversionRate,
        })),
        itemStyle: {
          color: '#409EFF',
        },
      },
      {
        name: '转化数',
        type: 'bar',
        data: data.map((item: any) => item.convertedCount),
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  }

  sourceBarChartInstance.setOption(option)
}

// 初始化负责人/团队分析柱状图
const initOwnerBarChart = () => {
  if (!ownerBarChart.value) return

  if (ownerBarChartInstance) {
    ownerBarChartInstance.dispose()
  }

  ownerBarChartInstance = echarts.init(ownerBarChart.value)

  const data = statisticsData.value.ownerDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${param.value}<br/>转化: ${param.data.convertedCount || 0} (${param.data.conversionRate?.toFixed(2) || 0}%)`
      },
    },
    legend: {
      data: ['线索数', '转化数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.ownerName || `负责人${item.ownerId}`),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '线索数',
        type: 'bar',
        data: data.map((item: any) => ({
          value: item.count,
          convertedCount: item.convertedCount,
          conversionRate: item.conversionRate,
        })),
        itemStyle: {
          color: '#409EFF',
        },
      },
      {
        name: '转化数',
        type: 'bar',
        data: data.map((item: any) => item.convertedCount),
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  }

  ownerBarChartInstance.setOption(option)
}

// 初始化行业分布饼图
const initIndustryPieChart = () => {
  if (!industryPieChart.value) return

  if (industryPieChartInstance) {
    industryPieChartInstance.dispose()
  }

  industryPieChartInstance = echarts.init(industryPieChart.value)

  const data = statisticsData.value.industryDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '行业分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getIndustryLabel(item.industry) || item.industry || '未分类',
        })),
      },
    ],
  }

  industryPieChartInstance.setOption(option)
}

// 初始化流失原因分布饼图
const initChurnReasonPieChart = () => {
  if (!churnReasonPieChart.value) return

  if (churnReasonPieChartInstance) {
    churnReasonPieChartInstance.dispose()
  }

  churnReasonPieChartInstance = echarts.init(churnReasonPieChart.value)

  const data = statisticsData.value.churnAnalysis?.reasonDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '流失原因',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getUnqualifiedReasonLabel(item.reason) || item.reason || '其他',
        })),
      },
    ],
  }

  churnReasonPieChartInstance.setOption(option)
}

// 初始化流失阶段分布柱状图
const initChurnStageBarChart = () => {
  if (!churnStageBarChart.value) return

  if (churnStageBarChartInstance) {
    churnStageBarChartInstance.dispose()
  }

  churnStageBarChartInstance = echarts.init(churnStageBarChart.value)

  const data = statisticsData.value.churnAnalysis?.stageDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.stageLabel || item.stage || '未知'),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '流失数量',
        type: 'bar',
        data: data.map((item: any) => item.count),
        itemStyle: {
          color: '#F56C6C',
        },
      },
    ],
  }

  churnStageBarChartInstance.setOption(option)
}

// 初始化流失类型分布饼图
const initChurnTypePieChart = () => {
  if (!churnTypePieChart.value) return

  if (churnTypePieChartInstance) {
    churnTypePieChartInstance.dispose()
  }

  churnTypePieChartInstance = echarts.init(churnTypePieChart.value)

  const data = statisticsData.value.churnAnalysis?.typeDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '流失类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getLostTypeLabel(item.type) || item.type || '未知',
        })),
      },
    ],
  }

  churnTypePieChartInstance.setOption(option)
}

// 初始化流失趋势折线图
const initChurnTrendLineChart = () => {
  if (!churnTrendLineChart.value) return

  if (churnTrendLineChartInstance) {
    churnTrendLineChartInstance.dispose()
  }

  churnTrendLineChartInstance = echarts.init(churnTrendLineChart.value)

  const data = statisticsData.value.churnAnalysis?.trend || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item: any) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '流失数量',
        type: 'line',
        smooth: true,
        data: data.map((item: any) => item.count),
        itemStyle: {
          color: '#F56C6C',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' },
            ],
          },
        },
      },
    ],
  }

  churnTrendLineChartInstance.setOption(option)
}

// 加载中国地图数据
const loadChinaMap = async () => {
  try {
    // 使用 ECharts 官方地图数据 CDN
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const geoJson = await response.json()
    echarts.registerMap('china', geoJson)
    return geoJson
  } catch (error) {
    console.error('加载中国地图失败:', error)
    throw error
  }
}

// 加载省份城市地图数据
const loadProvinceCityMap = async (provinceName: string) => {
  if (cityMapDataCache.value[provinceName]) {
    return cityMapDataCache.value[provinceName]
  }

  try {
    // 省份名称映射到地图数据中的名称
    const provinceMap: Record<string, string> = {
      北京市: '110000',
      天津市: '120000',
      河北省: '130000',
      山西省: '140000',
      内蒙古自治区: '150000',
      辽宁省: '210000',
      吉林省: '220000',
      黑龙江省: '230000',
      上海市: '310000',
      江苏省: '320000',
      浙江省: '330000',
      安徽省: '340000',
      福建省: '350000',
      江西省: '360000',
      山东省: '370000',
      河南省: '410000',
      湖北省: '420000',
      湖南省: '430000',
      广东省: '440000',
      广西壮族自治区: '450000',
      海南省: '460000',
      重庆市: '500000',
      四川省: '510000',
      贵州省: '520000',
      云南省: '530000',
      西藏自治区: '540000',
      陕西省: '610000',
      甘肃省: '620000',
      青海省: '630000',
      宁夏回族自治区: '640000',
      新疆维吾尔自治区: '650000',
    }

    const provinceCode = provinceMap[provinceName] || provinceName
    const response = await fetch(
      `https://geo.datav.aliyun.com/areas_v3/bound/${provinceCode}_full.json`,
    )
    const geoJson = await response.json()
    echarts.registerMap(provinceName, geoJson)
    cityMapDataCache.value[provinceName] = geoJson
    return geoJson
  } catch (error) {
    console.error(`加载${provinceName}城市地图失败:`, error)
    throw error
  }
}

// 省份名称标准化映射
const normalizeProvinceName = (name: string): string => {
  const nameMap: Record<string, string> = {
    北京: '北京市',
    天津: '天津市',
    河北: '河北省',
    山西: '山西省',
    内蒙古: '内蒙古自治区',
    辽宁: '辽宁省',
    吉林: '吉林省',
    黑龙江: '黑龙江省',
    上海: '上海市',
    江苏: '江苏省',
    浙江: '浙江省',
    安徽: '安徽省',
    福建: '福建省',
    江西: '江西省',
    山东: '山东省',
    河南: '河南省',
    湖北: '湖北省',
    湖南: '湖南省',
    广东: '广东省',
    广西: '广西壮族自治区',
    海南: '海南省',
    重庆: '重庆市',
    四川: '四川省',
    贵州: '贵州省',
    云南: '云南省',
    西藏: '西藏自治区',
    陕西: '陕西省',
    甘肃: '甘肃省',
    青海: '青海省',
    宁夏: '宁夏回族自治区',
    新疆: '新疆维吾尔自治区',
  }
  return nameMap[name] || name
}

// 渲染省份地图
const renderProvinceMap = async () => {
  if (!regionMapChartInstance) return

  const data = statisticsData.value.regionDistribution || []

  // 计算最大转化率用于visualMap
  const maxConversionRate = Math.max(...data.map((item: any) => item.conversionRate || 0), 100)

  // 准备地图数据
  const mapData = data.map((item: any) => {
    const provinceName = normalizeProvinceName(item.province || '未分类')
    return {
      name: provinceName,
      value: item.conversionRate || 0,
      count: item.count || 0,
      convertedCount: item.convertedCount || 0,
      conversionRate: item.conversionRate || 0,
    }
  })

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.data) {
          return `${params.name}<br/>线索数: ${params.data.count || 0}<br/>转化数: ${params.data.convertedCount || 0}<br/>转化率: ${(params.data.conversionRate || 0).toFixed(2)}%`
        }
        return `${params.name}<br/>暂无数据`
      },
    },
    visualMap: {
      min: 0,
      max: maxConversionRate,
      left: 'left',
      top: 'bottom',
      text: ['高转化率', '低转化率'],
      calculable: true,
      inRange: {
        color: ['#e0f3ff', '#0066cc'],
      },
      textStyle: {
        color: '#000',
      },
    },
    series: [
      {
        name: '线索分布',
        type: 'map',
        map: 'china',
        roam: true,
        label: {
          show: true,
          fontSize: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
          },
          itemStyle: {
            areaColor: '#389BB7',
          },
        },
        data: mapData,
      },
    ],
  }

  regionMapChartInstance.setOption(option)

  // 监听点击事件，实现下钻
  regionMapChartInstance.off('click')
  regionMapChartInstance.on('click', (params: any) => {
    if (params.name && params.name !== '未分类') {
      drillDownToCity(params.name).catch((error) => {
        console.error('下钻到城市失败:', error)
      })
    }
  })
}

// 渲染城市地图
const renderCityMap = async (provinceName: string) => {
  if (!regionMapChartInstance) return

  try {
    // 加载省份城市地图数据
    await loadProvinceCityMap(provinceName)

    // 获取该省份的城市数据
    const cityData =
      statisticsData.value.cityDistribution?.filter(
        (item: any) => normalizeProvinceName(item.province) === provinceName,
      ) || []

    // 计算最大转化率
    const maxConversionRate = Math.max(
      ...cityData.map((item: any) => item.conversionRate || 0),
      100,
    )

    // 准备地图数据
    const mapData = cityData.map((item: any) => ({
      name: item.city || '未分类',
      value: item.conversionRate || 0,
      count: item.count || 0,
      convertedCount: item.convertedCount || 0,
      conversionRate: item.conversionRate || 0,
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            return `${params.name}<br/>线索数: ${params.data.count || 0}<br/>转化数: ${params.data.convertedCount || 0}<br/>转化率: ${(params.data.conversionRate || 0).toFixed(2)}%`
          }
          return `${params.name}<br/>暂无数据`
        },
      },
      visualMap: {
        min: 0,
        max: maxConversionRate,
        left: 'left',
        top: 'bottom',
        text: ['高转化率', '低转化率'],
        calculable: true,
        inRange: {
          color: ['#e0f3ff', '#0066cc'],
        },
        textStyle: {
          color: '#000',
        },
      },
      series: [
        {
          name: '线索分布',
          type: 'map',
          map: provinceName,
          roam: true,
          label: {
            show: true,
            fontSize: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
            },
            itemStyle: {
              areaColor: '#389BB7',
            },
          },
          data: mapData,
        },
      ],
    }

    regionMapChartInstance.setOption(option)

    // 城市级别不再支持下钻
    regionMapChartInstance.off('click')
  } catch (error) {
    console.error(`渲染${provinceName}城市地图失败:`, error)
    ElMessage.error(`加载${provinceName}城市地图失败`)
  }
}

// 下钻到城市级别
const drillDownToCity = async (provinceName: string) => {
  currentMapLevel.value = 'city'
  currentProvince.value = provinceName
  await renderCityMap(provinceName)
}

// 返回省份视图
const backToProvinceMap = async () => {
  currentMapLevel.value = 'province'
  currentProvince.value = null
  await renderProvinceMap()
}

// 初始化地区分布地图
const initRegionMapChart = async () => {
  if (!regionMapChart.value) return

  try {
    // 确保中国地图已加载
    if (!echarts.getMap('china')) {
      await loadChinaMap()
    }

    if (regionMapChartInstance) {
      regionMapChartInstance.dispose()
    }

    regionMapChartInstance = echarts.init(regionMapChart.value)

    if (currentMapLevel.value === 'province') {
      await renderProvinceMap()
    } else if (currentMapLevel.value === 'city' && currentProvince.value) {
      await renderCityMap(currentProvince.value)
    }
  } catch (error) {
    console.error('初始化地图失败:', error)
  }
}
</script>

<style scoped lang="scss">
.lead-statistics {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.main-container {
  max-width: 100%;
}

// 数据分析区域
.statistics-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .stat-card-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;

      &.icon-primary {
        background: #e3f2fd;
        color: #409eff;
      }

      &.icon-success {
        background: #e8f5e9;
        color: #67c23a;
      }

      &.icon-warning {
        background: #fff3e0;
        color: #e6a23c;
      }

      &.icon-info {
        background: #e0f2f1;
        color: #909399;
      }

      &.icon-danger {
        background: #ffebee;
        color: #f56c6c;
      }
    }

    .stat-card-content {
      flex: 1;

      .stat-card-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-card-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  &.conversion-row {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .chart-content {
    min-height: 300px;
  }
}

.conversion-card {
  .conversion-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;

    .conversion-item {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e9ecef;

      .conversion-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .conversion-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 8px;
      }

      .conversion-detail {
        font-size: 12px;
        color: #606266;
      }
    }
  }
}
</style>
