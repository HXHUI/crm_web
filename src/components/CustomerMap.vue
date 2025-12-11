<template>
  <div :class="['customer-map', { 'no-card': !showCard }]">
    <!-- 标题区域 -->
    <div class="chart-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><Location /></el-icon>
          <h3 class="chart-title">{{ title || '客户分布地图' }}</h3>
        </div>
        <div class="filter-display">{{ scopeFilterText }}</div>
      </div>
      <el-button
        v-if="currentMapLevel === 'city'"
        size="small"
        type="primary"
        @click="backToProvinceMap"
      >
        返回省份视图
      </el-button>
    </div>

    <!-- 地图内容 - 始终显示 -->
    <div class="map-content">
      <!-- 加载状态提示 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <!-- 错误状态提示 -->
      <div v-if="error && !loading" class="error-overlay">
        <el-icon><Warning /></el-icon>
        <span>加载失败，请重试</span>
      </div>
      
      <div class="map-container">
        <div class="map-chart" ref="mapChartRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { statisticsApi, type CustomerMapData, type CustomerCityMapData } from '@/api/statistics'
import { Location, Loading, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
  title?: string
  onlyConverted?: boolean
  showCard?: boolean
}>()

// 响应式数据
const mapData = ref<CustomerMapData[]>([])
const cityMapData = ref<CustomerCityMapData[]>([])
const loading = ref(false)
const error = ref(false)
const mapChartRef = ref<HTMLElement>()
const currentMapLevel = ref<'province' | 'city'>('province')
const currentProvince = ref<string | null>(null)
const cityMapDataCache = ref<Record<string, any>>({})
let chartInstance: echarts.ECharts | null = null

// 计算属性
const scopeFilterText = computed(() => {
  if (props.parsedScopeFilter) {
    if (props.parsedScopeFilter.type === 'all') return '全部'
    if (props.parsedScopeFilter.type === 'department') return '部门'
    if (props.parsedScopeFilter.type === 'member') return '用户'
  }
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
    
    const scopeType = props.parsedScopeFilter?.type || (props.scopeFilter === 'all' ? 'all' : 'me_and_subordinates')
    const departmentId = props.parsedScopeFilter?.departmentId
    const memberId = props.parsedScopeFilter?.memberId
    
    // 加载省份数据
    const response = await statisticsApi.getCustomerMapData(
      props.scopeFilter === 'all' ? 'all' : 'me',
      props.onlyConverted || false,
      undefined,
      scopeType,
      departmentId,
      memberId
    )
    mapData.value = response.data
    
    // 加载城市数据
    const cityResponse = await statisticsApi.getCustomerCityMapData(
      props.onlyConverted || false,
      undefined,
      scopeType,
      departmentId,
      memberId
    )
    cityMapData.value = cityResponse.data
    
    // 如果当前是城市视图，重新渲染城市地图
    if (currentMapLevel.value === 'city' && currentProvince.value) {
      await renderCityMap(currentProvince.value)
    } else {
      await renderProvinceMap()
    }
  } catch (err) {
    console.error('加载客户地图数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 加载中国地图数据
const loadChinaMap = async () => {
  try {
    if (!echarts.getMap('china')) {
      const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      const chinaMap = await response.json()
      echarts.registerMap('china', chinaMap)
    }
    return true
  } catch (error) {
    console.error('加载中国地图数据失败:', error)
    echarts.registerMap('china', { type: 'FeatureCollection', features: [] })
    return false
  }
}

// 加载省份城市地图数据
const loadProvinceCityMap = async (provinceName: string) => {
  if (cityMapDataCache.value[provinceName]) {
    return cityMapDataCache.value[provinceName]
  }

  try {
    const provinceMap: Record<string, string> = {
      '北京市': '110000',
      '天津市': '120000',
      '河北省': '130000',
      '山西省': '140000',
      '内蒙古自治区': '150000',
      '辽宁省': '210000',
      '吉林省': '220000',
      '黑龙江省': '230000',
      '上海市': '310000',
      '江苏省': '320000',
      '浙江省': '330000',
      '安徽省': '340000',
      '福建省': '350000',
      '江西省': '360000',
      '山东省': '370000',
      '河南省': '410000',
      '湖北省': '420000',
      '湖南省': '430000',
      '广东省': '440000',
      '广西壮族自治区': '450000',
      '海南省': '460000',
      '重庆市': '500000',
      '四川省': '510000',
      '贵州省': '520000',
      '云南省': '530000',
      '西藏自治区': '540000',
      '陕西省': '610000',
      '甘肃省': '620000',
      '青海省': '630000',
      '宁夏回族自治区': '640000',
      '新疆维吾尔自治区': '650000',
    }

    const provinceCode = provinceMap[provinceName] || provinceName
    const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${provinceCode}_full.json`)
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
    '北京': '北京市',
    '天津': '天津市',
    '河北': '河北省',
    '山西': '山西省',
    '内蒙古': '内蒙古自治区',
    '辽宁': '辽宁省',
    '吉林': '吉林省',
    '黑龙江': '黑龙江省',
    '上海': '上海市',
    '江苏': '江苏省',
    '浙江': '浙江省',
    '安徽': '安徽省',
    '福建': '福建省',
    '江西': '江西省',
    '山东': '山东省',
    '河南': '河南省',
    '湖北': '湖北省',
    '湖南': '湖南省',
    '广东': '广东省',
    '广西': '广西壮族自治区',
    '海南': '海南省',
    '重庆': '重庆市',
    '四川': '四川省',
    '贵州': '贵州省',
    '云南': '云南省',
    '西藏': '西藏自治区',
    '陕西': '陕西省',
    '甘肃': '甘肃省',
    '青海': '青海省',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区',
  }
  return nameMap[name] || name
}

// 初始化地图
const initMapChart = async () => {
  if (!mapChartRef.value) return

  // 如果已经初始化过，先销毁
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  chartInstance = echarts.init(mapChartRef.value)

  // 确保中国地图已加载
  await loadChinaMap()

  if (currentMapLevel.value === 'province') {
    await renderProvinceMap()
  } else if (currentMapLevel.value === 'city' && currentProvince.value) {
    await renderCityMap(currentProvince.value)
  }
}

// 渲染省份地图
const renderProvinceMap = async () => {
  if (!chartInstance) return

  const data = mapData.value || []

  // 计算最大值
  const maxCount = data.length > 0 
    ? Math.max(...data.map((item) => {
        const count = Number(item.count)
        return (!isNaN(count) && isFinite(count)) ? count : 0
      }), 1)
    : 1

  // 准备地图数据
  const mapDataSeries = data.map((item) => {
    const provinceName = normalizeProvinceName(item.province || '未分类')
    const count = Number(item.count)
    const validCount = (!isNaN(count) && isFinite(count)) ? count : 0
    
    return {
      name: provinceName,
      value: validCount,
      count: validCount,
    }
  })

  // 根据是否已成交客户设置不同的颜色
  const isConverted = props.onlyConverted || false
  const visualMapColors = isConverted 
    ? ['#fff4e6', '#ff8c00'] // 已成交客户使用橙色系
    : ['#e6f3ff', '#1a8cff'] // 未成交客户使用蓝色系
  const emphasisColor = isConverted 
    ? '#ff7f00' // 已成交客户强调色
    : '#389BB7' // 未成交客户强调色

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.data) {
          return `${params.name}<br/>客户数量: ${params.data.count || 0}个`
        }
        return `${params.name}<br/>暂无数据`
      },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: visualMapColors,
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
            areaColor: emphasisColor,
          },
        },
        data: mapDataSeries,
      },
    ],
  }

  // 先清除当前地图状态，重置缩放和位置
  chartInstance.clear()
  // 设置新选项，使用 notMerge: true 确保完全替换
  chartInstance.setOption(option, true)
  // 强制重新渲染，确保地图视图重置
  await nextTick()
  chartInstance.resize()

  // 监听点击事件，实现下钻
  chartInstance.off('click')
  chartInstance.on('click', (params: any) => {
    if (params.name && params.name !== '未分类') {
      drillDownToCity(params.name).catch((error) => {
        console.error('下钻到城市失败:', error)
      })
    }
  })
}

// 渲染城市地图
const renderCityMap = async (provinceName: string) => {
  if (!chartInstance) return

  try {
    // 加载省份城市地图数据
    await loadProvinceCityMap(provinceName)

    // 获取该省份的城市数据
    const cityData = cityMapData.value?.filter(
      (item) => normalizeProvinceName(item.province) === provinceName
    ) || []

    // 计算最大值
    const maxCount = cityData.length > 0 
      ? Math.max(...cityData.map((item) => {
          const count = Number(item.count)
          return (!isNaN(count) && isFinite(count)) ? count : 0
        }), 1)
      : 1

    // 准备地图数据
    const mapDataSeries = cityData.map((item) => ({
      name: item.city || '未分类',
      value: Number(item.count) || 0,
      count: Number(item.count) || 0,
    }))

    // 根据是否已成交客户设置不同的颜色
    const isConverted = props.onlyConverted || false
    const visualMapColors = isConverted 
      ? ['#fff4e6', '#ff8c00'] // 已成交客户使用橙色系
      : ['#e6f3ff', '#1a8cff'] // 未成交客户使用蓝色系
    const emphasisColor = isConverted 
      ? '#ff7f00' // 已成交客户强调色
      : '#389BB7' // 未成交客户强调色

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            return `${params.name}<br/>客户数量: ${params.data.count || 0}个`
          }
          return `${params.name}<br/>暂无数据`
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: visualMapColors,
        },
        textStyle: {
          color: '#333',
        },
      },
      series: [
        {
          name: '客户分布',
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
              areaColor: emphasisColor,
            },
          },
          data: mapDataSeries,
        },
      ],
    }

    // 先清除当前地图状态，重置缩放和位置
    chartInstance.clear()
    // 设置新选项，使用 notMerge: true 确保完全替换
    chartInstance.setOption(option, true)
    // 强制重新渲染，确保地图视图重置
    await nextTick()
    chartInstance.resize()

    // 城市级别不再支持下钻
    chartInstance.off('click')
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

// 监听数据变化，更新图表
watch(
  [mapData, cityMapData],
  async () => {
    await nextTick()
    if (chartInstance) {
      if (currentMapLevel.value === 'province') {
        await renderProvinceMap()
      } else if (currentMapLevel.value === 'city' && currentProvince.value) {
        await renderCityMap(currentProvince.value)
      }
    } else {
      await initMapChart()
    }
  },
  { deep: true },
)

// 监听过滤条件变化
watch(
  [() => props.scopeFilter, () => props.parsedScopeFilter, () => props.onlyConverted],
  () => {
    loadMapData()
  },
  { deep: true },
)

onMounted(async () => {
  // 先初始化地图，即使没有数据也显示
  await nextTick()
  await initMapChart()
  // 然后加载数据
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

.customer-map.no-card {
  background: transparent;
  padding: 0;
  box-shadow: none;
  border-radius: 0;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.chart-header .el-button {
  margin-left: auto;
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
  position: relative;
}

.map-container {
  width: 100%;
  min-height: 500px;
}

.map-chart {
  width: 100%;
  height: 500px;
  min-width: 200px;
}


.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  border-radius: 8px;
  color: #909399;
}

.error-overlay {
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
    min-height: 400px;
  }

  .map-chart {
    min-width: 300px;
    height: 400px;
  }
}

@media (max-width: 480px) {
  .map-chart {
    min-width: 250px;
    height: 300px;
  }
}
</style>
