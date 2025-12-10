<template>
  <div class="target-analysis">
    <!-- 卡片头部 -->
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">目标分析</h3>
      </div>
      <div class="target-type-selector">
        <el-select
          v-model="targetType"
          placeholder="选择目标类型"
          size="default"
          style="width: 160px"
          @change="handleTargetTypeChange"
        >
          <el-option label="合同金额" value="contract_amount" />
          <el-option label="订单金额" value="sales_amount" />
          <el-option label="新增线索数" value="new_leads" />
          <el-option label="新增客户数" value="new_customers" />
          <el-option label="新增商机数" value="new_opportunities" />
          <el-option label="赢单商机数" value="won_opportunities" />
        </el-select>
      </div>
    </div>
    
    <!-- 图表内容 -->
    <div class="analysis-content">
      <div class="chart-item trend-item">
        <TargetTrendChart
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
          :target-type="targetType"
        />
      </div>
      <div class="chart-item ranking-item">
        <TargetRanking
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
          :target-type="targetType"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TargetTrendChart from './TargetTrendChart.vue'
import TargetRanking from './TargetRanking.vue'

defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
}>()

const targetType = ref<'contract_amount' | 'sales_amount' | 'new_leads' | 'new_customers' | 'new_opportunities' | 'won_opportunities'>('contract_amount')

const handleTargetTypeChange = () => {
  // 目标类型变化时，子组件会通过 watch 自动更新
}
</script>

<style scoped lang="scss">
.target-analysis {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
}

.analysis-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.target-type-selector {
  display: flex;
  align-items: center;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.chart-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 280px;
  height: 100%;
  overflow: hidden;
}
</style>

