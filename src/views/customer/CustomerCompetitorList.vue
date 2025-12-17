<template>
  <div class="competitor-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索厂家/产品名称"
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
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增竞品</el-button>
        </div>
      </div>

      <!-- 列表区域 -->
      <div class="table-section">
        <CompetitorList
          ref="listRef"
          related-type="customer"
          :related-id="currentCustomerId"
          :filter-keyword="searchForm.search"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import CompetitorList from '@/components/competitor/CompetitorList.vue'

const route = useRoute()
// 这里默认不指定某个客户，用 0 作为占位；通常从客户详情进入更有意义
const currentCustomerId = computed(() => {
  const id = route.query.customerId
  return id ? Number(id) : 0
})

const searchForm = reactive({
  search: '',
})

const handleSearch = () => {
  // 仅依赖 v-model 触发过滤，这里不需要额外逻辑
}

const handleReset = () => {
  searchForm.search = ''
}

const listRef = ref<InstanceType<typeof CompetitorList> | null>(null)
const handleCreate = () => {
  listRef.value?.openCreate()
}
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.competitor-management {
  @extend .table-page;
}
</style>

