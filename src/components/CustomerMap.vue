<template>
  <div class="customer-map">
    <!-- 标题区域 -->
    <div class="chart-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><Location /></el-icon>
          <h3 class="chart-title">客户分布地图</h3>
        </div>
        <div class="filter-display">{{ scopeFilterText }}</div>
      </div>
    </div>

    <!-- 地图内容 -->
    <div class="map-content" v-if="mapData && mapData.length > 0">
      <div class="map-container">
        <div class="map-chart" ref="mapChartRef"></div>
        <div class="map-legend">
          <div class="legend-title">客户数量分布</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color" style="background: #e6f3ff"></div>
              <span>0-10</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #b3d9ff"></div>
              <span>11-50</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #80c5ff"></div>
              <span>51-100</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #4da6ff"></div>
              <span>101-500</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #1a8cff"></div>
              <span>500+</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <el-icon><Location /></el-icon>
      <span>暂无数据</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-icon><Warning /></el-icon>
      <span>加载失败，请重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { statisticsApi, type CustomerMapData } from '@/api/statistics'
import { Location, Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
}>()

// 响应式数据
const mapData = ref<CustomerMapData[]>([])
const loading = ref(false)
const error = ref(false)
const mapChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

// 方法
const loadMapData = async () => {
  try {
    loading.value = true
    error.value = false
    const scope = props.scopeFilter === 'all' ? 'all' : 'me'
    const response = await statisticsApi.getCustomerMapData(scope)
    mapData.value = response.data
  } catch (err) {
    console.error('加载客户地图数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 获取地图数据
const getMapSeriesData = () => {
  return mapData.value.map((item) => ({
    name: item.province,
    value: item.count,
    itemStyle: {
      areaColor: getProvinceColor(item.count),
    },
  }))
}

// 根据客户数量获取省份颜色
const getProvinceColor = (count: number) => {
  if (count === 0) return '#f0f0f0'
  if (count <= 10) return '#e6f3ff'
  if (count <= 50) return '#b3d9ff'
  if (count <= 100) return '#80c5ff'
  if (count <= 500) return '#4da6ff'
  return '#1a8cff'
}

// 初始化地图
const initMapChart = async () => {
  if (!mapChartRef.value) return

  chartInstance = echarts.init(mapChartRef.value)

  // 加载中国地图数据
  try {
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const chinaMap = await response.json()
    echarts.registerMap('china', chinaMap)
  } catch (error) {
    console.error('加载中国地图数据失败:', error)
    // 如果在线加载失败，使用简化的地图数据
    echarts.registerMap('china', { type: 'FeatureCollection', features: [] })
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        if (params.data) {
          return `${params.name}<br/>客户数量: ${params.value}个`
        }
        return `${params.name}<br/>客户数量: 0个`
      },
    },
    visualMap: {
      min: 0,
      max: Math.max(...mapData.value.map((item) => item.count), 1),
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e6f3ff', '#1a8cff'],
      },
      textStyle: {
        color: '#333',
      },
    },
    series: [
      {
        name: '客户分布',
        type: 'map',
        map: 'china',
        roam: false,
        scaleLimit: {
          min: 0.8,
          max: 2,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            color: '#333',
          },
          itemStyle: {
            areaColor: '#ffd700',
            borderColor: '#ff6b6b',
            borderWidth: 2,
          },
        },
        data: getMapSeriesData(),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 更新地图
const updateMapChart = () => {
  if (!chartInstance) return

  const option = {
    visualMap: {
      min: 0,
      max: Math.max(...mapData.value.map((item) => item.count), 1),
      inRange: {
        color: ['#e6f3ff', '#1a8cff'],
      },
    },
    series: [
      {
        data: getMapSeriesData(),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 监听数据变化，更新图表
watch(
  mapData,
  async () => {
    if (mapData.value && mapData.value.length > 0) {
      await nextTick()
      if (chartInstance) {
        updateMapChart()
      } else {
        await initMapChart()
      }
    }
  },
  { deep: true },
)

// 监听过滤条件变化
watch(
  () => props.scopeFilter,
  () => {
    loadMapData()
  },
)

onMounted(async () => {
  await loadMapData()
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.customer-map {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
}

.title-with-icon {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 8px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.filter-display {
  font-size: 12px;
  color: #909399;
}

.illustration {
  display: flex;
  align-items: center;
}

.chart-illustration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-icon {
  font-size: 24px;
}

.chart-icon {
  font-size: 20px;
}

.map-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-height: 400px;
  width: 100%;
}

.map-chart {
  flex: 1;
  height: 400px;
  min-width: 200px;
  max-width: 100%;
}

.map-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 100px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  flex-shrink: 0;
}

.legend-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-item span {
  font-size: 12px;
  color: #606266;
}

.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #909399;
}

.empty-state {
  color: #c0c4cc;
}

.error-state {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .map-container {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .map-chart {
    min-width: 300px;
    height: 350px;
  }

  .map-legend {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .map-chart {
    min-width: 250px;
    height: 300px;
  }
}
</style>
