<template>
  <div class="table-page">
    <div class="main-container">
      <CustomFieldConfigList
        ref="listRef"
        :embedded="true"
        :use-dialog="true"
        @create="handleCreate"
        @edit="handleEdit"
      />
    </div>

    <!-- 新建/编辑字段配置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentConfigId ? '编辑字段配置' : '新建字段配置'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <CustomFieldConfigForm
        :embedded="true"
        :config-id="currentConfigId"
        @saved="handleSaved"
        @cancel="handleDialogCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomFieldConfigList from '@/views/custom-field-config/CustomFieldConfigList.vue'
import CustomFieldConfigForm from '@/views/custom-field-config/CustomFieldConfigForm.vue'
import type { CustomFieldConfig } from '@/api/customFieldConfig'

const listRef = ref<InstanceType<typeof CustomFieldConfigList> | null>(null)
const dialogVisible = ref(false)
const currentConfigId = ref<number | null>(null)

const handleCreate = () => {
  currentConfigId.value = null
  dialogVisible.value = true
}

const handleEdit = (row: CustomFieldConfig) => {
  currentConfigId.value = Number(row.id)
  dialogVisible.value = true
}

const handleSaved = () => {
  dialogVisible.value = false
  listRef.value?.reload?.()
}

const handleDialogCancel = () => {
  dialogVisible.value = false
}
</script>
<style lang="scss" scoped>
  @use '@/styles/common/table-layout.scss';
</style>
