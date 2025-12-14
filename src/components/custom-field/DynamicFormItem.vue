<template>
  <el-form-item
    :label="config.fieldName"
    :prop="`customFields.${config.fieldCode}`"
    :required="config.isRequired"
  >
    <!-- 文本输入 -->
    <el-input
      v-if="config.fieldType === 'text'"
      v-model="fieldValue"
      :placeholder="config.placeholder"
      :disabled="disabled"
    />

    <!-- 多行文本 -->
    <el-input
      v-else-if="config.fieldType === 'textarea'"
      v-model="fieldValue"
      type="textarea"
      :rows="3"
      :placeholder="config.placeholder"
      :disabled="disabled"
    />

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="config.fieldType === 'number'"
      v-model="fieldValue"
      :placeholder="config.placeholder"
      :disabled="disabled"
      style="width: 100%"
    />

    <!-- 日期选择 -->
    <el-date-picker
      v-else-if="config.fieldType === 'date'"
      v-model="fieldValue"
      type="date"
      :placeholder="config.placeholder"
      :disabled="disabled"
      style="width: 100%"
      value-format="YYYY-MM-DD"
    />

    <!-- 日期时间选择 -->
    <el-date-picker
      v-else-if="config.fieldType === 'datetime'"
      v-model="fieldValue"
      type="datetime"
      :placeholder="config.placeholder"
      :disabled="disabled"
      style="width: 100%"
      value-format="YYYY-MM-DD HH:mm:ss"
    />

    <!-- 单选 -->
    <el-select
      v-else-if="config.fieldType === 'select'"
      v-model="fieldValue"
      :placeholder="config.placeholder"
      :disabled="disabled"
      style="width: 100%"
      clearable
    >
      <el-option
        v-for="option in options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <!-- 多选 -->
    <el-select
      v-else-if="config.fieldType === 'multiselect'"
      v-model="fieldValue"
      :placeholder="config.placeholder"
      :disabled="disabled"
      style="width: 100%"
      multiple
      clearable
    >
      <el-option
        v-for="option in options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <!-- 布尔值 -->
    <el-switch
      v-else-if="config.fieldType === 'boolean'"
      v-model="fieldValue"
      :disabled="disabled"
    />

    <!-- 文件上传 -->
    <el-upload
      v-else-if="config.fieldType === 'file'"
      v-model:file-list="fileList"
      :disabled="disabled"
      :limit="1"
      :on-success="handleFileSuccess"
      :on-remove="handleFileRemove"
    >
      <el-button type="primary">选择文件</el-button>
    </el-upload>

    <!-- 帮助文本 -->
    <div v-if="config.helpText" class="help-text">{{ config.helpText }}</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { UploadFile } from 'element-plus'
import type { CustomFieldConfig, FieldOptions } from '@/api/customFieldConfig'
import { dictionaryApi } from '@/api/dictionary'

interface Props {
  config: CustomFieldConfig
  modelValue?: any
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<Emits>()

const fieldValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const options = ref<Array<{ label: string; value: string }>>([])
const fileList = ref<UploadFile[]>([])

// 加载选项数据
const loadOptions = async () => {
  if (props.config.fieldType !== 'select' && props.config.fieldType !== 'multiselect') {
    return
  }

  const fieldOptions = props.config.fieldOptions as FieldOptions
  if (!fieldOptions) return

  if (fieldOptions.sourceType === 'manual' && fieldOptions.options) {
    options.value = fieldOptions.options
  } else if (fieldOptions.sourceType === 'dict' && fieldOptions.dictTypeCode) {
    try {
      const res = await dictionaryApi.getItems(fieldOptions.dictTypeCode)
      if (res.code === 200) {
        options.value = res.data.map((item) => ({
          label: item.label,
          value: item.value,
        }))
      }
    } catch (error) {
      console.error('加载字典选项失败:', error)
    }
  }
}

const handleFileSuccess = (response: any, file: UploadFile) => {
  fieldValue.value = file.url || file.response?.url || file.name
}

const handleFileRemove = () => {
  fieldValue.value = null
}

onMounted(() => {
  loadOptions()
})

watch(
  () => props.config.fieldOptions,
  () => {
    loadOptions()
  },
  { deep: true }
)
</script>

<style scoped>
.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

