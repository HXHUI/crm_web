<template>
  <div class="dynamic-form">
    <template v-if="groupedConfigs.length > 0">
      <div v-for="group in groupedConfigs" :key="group.name" class="form-group">
        <el-divider v-if="group.name" :content-position="'left'">
          {{ group.name }}
        </el-divider>
        <DynamicFormItem
          v-for="config in group.configs"
          :key="config.id"
          :config="config"
          :model-value="modelValue?.[config.fieldCode]"
          :disabled="disabled"
          @update:model-value="handleFieldUpdate(config.fieldCode, $event)"
        />
      </div>
    </template>
    <template v-else>
      <el-empty description="暂无扩展字段配置" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DynamicFormItem from './DynamicFormItem.vue'
import type { CustomFieldConfig } from '@/api/customFieldConfig'
import { getCustomFieldConfigsByEntityType, type EntityType } from '@/api/customFieldConfig'

interface Props {
  entityType?: EntityType
  modelValue?: Record<string, any>
  disabled?: boolean
  configs?: CustomFieldConfig[] // 如果提供了配置，直接使用，否则从API加载
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  entityType: 'customer',
  disabled: false,
})

const emit = defineEmits<Emits>()

const configs = ref<CustomFieldConfig[]>([])

// 按分组组织配置
const groupedConfigs = computed(() => {
  const groups: Record<string, CustomFieldConfig[]> = {}
  const ungrouped: CustomFieldConfig[] = []

  configs.value.forEach((config) => {
    if (config.groupName) {
      if (!groups[config.groupName]) {
        groups[config.groupName] = []
      }
      groups[config.groupName].push(config)
    } else {
      ungrouped.push(config)
    }
  })

  const result: Array<{ name: string; configs: CustomFieldConfig[] }> = []

  // 添加有分组的
  Object.keys(groups).forEach((name) => {
    result.push({ name, configs: groups[name] })
  })

  // 添加未分组的
  if (ungrouped.length > 0) {
    result.push({ name: '', configs: ungrouped })
  }

  return result
})

const loadConfigs = async () => {
  if (props.configs) {
    configs.value = props.configs
    return
  }

  try {
    const res = await getCustomFieldConfigsByEntityType(props.entityType)
    if (res.code === 200) {
      configs.value = res.data
    }
  } catch (error) {
    console.error('加载字段配置失败:', error)
  }
}

const handleFieldUpdate = (fieldCode: string, value: any) => {
  const newValue = { ...(props.modelValue || {}) }
  if (value === null || value === undefined || value === '') {
        delete newValue[fieldCode]
      } else {
        newValue[fieldCode] = value
      }
  emit('update:modelValue', newValue)
}

watch(
  () => props.configs,
  () => {
    if (props.configs) {
      configs.value = props.configs
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!props.configs) {
    loadConfigs()
  }
})
</script>

<style scoped>
.dynamic-form {
  width: 100%;
}

.form-group {
  margin-bottom: 16px;
}
</style>

