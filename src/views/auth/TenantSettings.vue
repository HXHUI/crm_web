<template>
  <div class="tenant-settings-container">
    <el-alert
      v-if="!isTenantAdmin"
      type="warning"
      :closable="false"
      class="warning-alert"
    >
      只有租户管理员可以修改企业信息
    </el-alert>

    <div class="tenant-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/modules/auth'

const authStore = useAuthStore()

// 租户信息
const isTenantAdmin = computed(() => authStore.isTenantAdmin)
</script>

<style lang="scss" scoped>
.tenant-settings-container {
  height: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.warning-alert {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.tenant-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tenant-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
