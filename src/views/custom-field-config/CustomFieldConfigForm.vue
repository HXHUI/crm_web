<template>
  <div class="form-page">
    <div class="main-container">
      <!-- 非嵌入模式：整页 + 卡片 + 返回按钮 -->
      <el-card v-if="!props.embedded">
        <template #header>
          <div class="card-header">
            <span>{{ isEdit ? '编辑字段配置' : '新建字段配置' }}</span>
            <el-button @click="goBack">返回</el-button>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
        >
          <el-form-item label="实体类型" prop="entityType">
            <el-select v-model="formData.entityType" placeholder="请选择实体类型" style="width: 100%">
              <el-option label="客户" value="customer" />
              <el-option label="联系人" value="contact" />
              <el-option label="商机" value="opportunity" />
            </el-select>
          </el-form-item>

          <el-form-item label="字段名称" prop="fieldName">
            <el-input v-model="formData.fieldName" placeholder="请输入字段名称" @blur="generateFieldCode" />
          </el-form-item>

          <el-form-item label="字段编码" prop="fieldCode">
            <el-input
              v-model="formData.fieldCode"
              placeholder="字段编码将自动生成"
              :disabled="isEdit"
              @input="fieldCodeManuallyEdited = true"
            />
            <div class="form-tip">字段编码用于存储和查询，创建后不可修改。输入字段名称后会自动生成，也可手动修改</div>
          </el-form-item>

          <el-form-item label="字段类型" prop="fieldType">
            <el-select
              v-model="formData.fieldType"
              placeholder="请选择字段类型"
              style="width: 100%"
              @change="handleFieldTypeChange"
            >
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="日期时间" value="datetime" />
              <el-option label="单选" value="select" />
              <el-option label="多选" value="multiselect" />
              <el-option label="多行文本" value="textarea" />
              <el-option label="布尔" value="boolean" />
              <el-option label="文件" value="file" />
            </el-select>
          </el-form-item>

          <!-- 选项配置（select/multiselect） -->
          <template v-if="formData.fieldType === 'select' || formData.fieldType === 'multiselect'">
            <el-form-item label="选项来源" prop="fieldOptions.sourceType">
              <el-radio-group v-model="formData.fieldOptions.sourceType" @change="handleSourceTypeChange">
                <el-radio value="manual">手动输入</el-radio>
                <el-radio value="dict">关联字典</el-radio>
              </el-radio-group>
            </el-form-item>

            <template v-if="formData.fieldOptions.sourceType === 'manual'">
              <el-form-item label="选项列表" prop="fieldOptions.options">
                <div
                  v-for="(option, index) in formData.fieldOptions?.options || []"
                  :key="`option-${index}-${option.value || index}`"
                  class="option-item"
                >
                  <el-input
                    v-model="option.label"
                    placeholder="显示名称"
                    style="width: 200px; margin-right: 8px"
                  />
                  <el-input
                    v-model="option.value"
                    placeholder="值"
                    style="width: 200px; margin-right: 8px"
                  />
                  <el-button type="danger" size="small" @click="removeOption(index)">删除</el-button>
                </div>
                <el-button type="primary" size="small" @click="addOption">添加选项</el-button>
              </el-form-item>
            </template>

            <template v-if="formData.fieldOptions.sourceType === 'dict'">
              <el-form-item label="字典类型" prop="fieldOptions.dictTypeCode">
                <el-select
                  v-model="formData.fieldOptions.dictTypeCode"
                  placeholder="请选择字典类型"
                  filterable
                  clearable
                  style="width: 100%"
                  :loading="dictTypeLoading"
                  @visible-change="loadDictTypes"
                >
                  <el-option
                    v-for="dictType in dictTypeOptions"
                    :key="dictType.code"
                    :label="`${dictType.name} (${dictType.code})`"
                    :value="dictType.code"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span>{{ dictType.name }}</span>
                      <el-tag size="small" :type="dictType.tenantId ? 'success' : 'info'" style="margin-left: 8px;">
                        {{ dictType.tenantId ? '租户' : '系统' }}
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </template>
          </template>

          <el-form-item label="分组名称" prop="groupName">
            <el-input v-model="formData.groupName" placeholder="用于UI分组显示（可选）" />
          </el-form-item>

          <el-form-item label="是否必填" prop="isRequired">
            <el-switch v-model="formData.isRequired" />
          </el-form-item>

          <el-form-item label="默认值" prop="defaultValue">
            <el-input v-model="formData.defaultValue" placeholder="请输入默认值" />
          </el-form-item>

          <el-form-item label="占位符" prop="placeholder">
            <el-input v-model="formData.placeholder" placeholder="请输入占位符文本" />
          </el-form-item>

          <el-form-item label="帮助文本" prop="helpText">
            <el-input
              v-model="formData.helpText"
              type="textarea"
              :rows="2"
              placeholder="请输入帮助文本"
            />
          </el-form-item>

          <!-- 验证规则 -->
          <el-divider>验证规则</el-divider>

          <template v-if="formData.fieldType === 'text' || formData.fieldType === 'textarea'">
            <el-form-item label="最小长度" prop="validationRules.minLength">
              <el-input-number v-model="formData.validationRules.minLength" :min="0" />
            </el-form-item>
            <el-form-item label="最大长度" prop="validationRules.maxLength">
              <el-input-number v-model="formData.validationRules.maxLength" :min="0" />
            </el-form-item>
            <el-form-item label="正则表达式" prop="validationRules.pattern">
              <el-input v-model="formData.validationRules.pattern" placeholder="请输入正则表达式" />
            </el-form-item>
          </template>

          <template v-if="formData.fieldType === 'number'">
            <el-form-item label="最小值" prop="validationRules.min">
              <el-input-number v-model="formData.validationRules.min" />
            </el-form-item>
            <el-form-item label="最大值" prop="validationRules.max">
              <el-input-number v-model="formData.validationRules.max" />
            </el-form-item>
          </template>

          <el-form-item label="错误提示" prop="validationRules.message">
            <el-input
              v-model="formData.validationRules.message"
              placeholder="验证失败时的错误消息"
            />
          </el-form-item>

          <el-form-item label="显示顺序" prop="displayOrder">
            <el-input-number v-model="formData.displayOrder" :min="0" />
          </el-form-item>

          <el-form-item label="是否启用" prop="isActive">
            <el-switch v-model="formData.isActive" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 嵌入模式：弹窗内，只展示表单，无卡片和返回按钮 -->
      <div v-else class="embedded-form-wrapper">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
        >
          <!-- 这里使用与上面相同的表单内容 -->
          <el-form-item label="实体类型" prop="entityType">
            <el-select v-model="formData.entityType" placeholder="请选择实体类型" style="width: 100%">
              <el-option label="客户" value="customer" />
              <el-option label="联系人" value="contact" />
              <el-option label="商机" value="opportunity" />
            </el-select>
          </el-form-item>

          <el-form-item label="字段名称" prop="fieldName">
            <el-input v-model="formData.fieldName" placeholder="请输入字段名称" @blur="generateFieldCode" />
          </el-form-item>

          <el-form-item label="字段编码" prop="fieldCode">
            <el-input
              v-model="formData.fieldCode"
              placeholder="字段编码将自动生成"
              :disabled="isEdit"
              @input="fieldCodeManuallyEdited = true"
            />
            <div class="form-tip">字段编码用于存储和查询，创建后不可修改。输入字段名称后会自动生成，也可手动修改</div>
          </el-form-item>

          <el-form-item label="字段类型" prop="fieldType">
            <el-select
              v-model="formData.fieldType"
              placeholder="请选择字段类型"
              style="width: 100%"
              @change="handleFieldTypeChange"
            >
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="日期时间" value="datetime" />
              <el-option label="单选" value="select" />
              <el-option label="多选" value="multiselect" />
              <el-option label="多行文本" value="textarea" />
              <el-option label="布尔" value="boolean" />
              <el-option label="文件" value="file" />
            </el-select>
          </el-form-item>

          <!-- 选项配置（select/multiselect） -->
          <template v-if="formData.fieldType === 'select' || formData.fieldType === 'multiselect'">
            <el-form-item label="选项来源" prop="fieldOptions.sourceType">
              <el-radio-group v-model="formData.fieldOptions.sourceType" @change="handleSourceTypeChange">
                <el-radio value="manual">手动输入</el-radio>
                <el-radio value="dict">关联字典</el-radio>
              </el-radio-group>
            </el-form-item>

            <template v-if="formData.fieldOptions.sourceType === 'manual'">
              <el-form-item label="选项列表" prop="fieldOptions.options">
                <div
                  v-for="(option, index) in formData.fieldOptions?.options || []"
                  :key="`option-${index}-${option.value || index}`"
                  class="option-item"
                >
                  <el-input
                    v-model="option.label"
                    placeholder="显示名称"
                    style="width: 200px; margin-right: 8px"
                  />
                  <el-input
                    v-model="option.value"
                    placeholder="值"
                    style="width: 200px; margin-right: 8px"
                  />
                  <el-button type="danger" size="small" @click="removeOption(index)">删除</el-button>
                </div>
                <el-button type="primary" size="small" @click="addOption">添加选项</el-button>
              </el-form-item>
            </template>

            <template v-if="formData.fieldOptions.sourceType === 'dict'">
              <el-form-item label="字典类型" prop="fieldOptions.dictTypeCode">
                <el-select
                  v-model="formData.fieldOptions.dictTypeCode"
                  placeholder="请选择字典类型"
                  filterable
                  clearable
                  style="width: 100%"
                  :loading="dictTypeLoading"
                  @visible-change="loadDictTypes"
                >
                  <el-option
                    v-for="dictType in dictTypeOptions"
                    :key="dictType.code"
                    :label="`${dictType.name} (${dictType.code})`"
                    :value="dictType.code"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span>{{ dictType.name }}</span>
                      <el-tag size="small" :type="dictType.tenantId ? 'success' : 'info'" style="margin-left: 8px;">
                        {{ dictType.tenantId ? '租户' : '系统' }}
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </template>
          </template>

          <el-form-item label="分组名称" prop="groupName">
            <el-input v-model="formData.groupName" placeholder="用于UI分组显示（可选）" />
          </el-form-item>

          <el-form-item label="是否必填" prop="isRequired">
            <el-switch v-model="formData.isRequired" />
          </el-form-item>

          <el-form-item label="默认值" prop="defaultValue">
            <el-input v-model="formData.defaultValue" placeholder="请输入默认值" />
          </el-form-item>

          <el-form-item label="占位符" prop="placeholder">
            <el-input v-model="formData.placeholder" placeholder="请输入占位符文本" />
          </el-form-item>

          <el-form-item label="帮助文本" prop="helpText">
            <el-input
              v-model="formData.helpText"
              type="textarea"
              :rows="2"
              placeholder="请输入帮助文本"
            />
          </el-form-item>

          <!-- 验证规则 -->
          <el-divider>验证规则</el-divider>

          <template v-if="formData.fieldType === 'text' || formData.fieldType === 'textarea'">
            <el-form-item label="最小长度" prop="validationRules.minLength">
              <el-input-number v-model="formData.validationRules.minLength" :min="0" />
            </el-form-item>
            <el-form-item label="最大长度" prop="validationRules.maxLength">
              <el-input-number v-model="formData.validationRules.maxLength" :min="0" />
            </el-form-item>
            <el-form-item label="正则表达式" prop="validationRules.pattern">
              <el-input v-model="formData.validationRules.pattern" placeholder="请输入正则表达式" />
            </el-form-item>
          </template>

          <template v-if="formData.fieldType === 'number'">
            <el-form-item label="最小值" prop="validationRules.min">
              <el-input-number v-model="formData.validationRules.min" />
            </el-form-item>
            <el-form-item label="最大值" prop="validationRules.max">
              <el-input-number v-model="formData.validationRules.max" />
            </el-form-item>
          </template>

          <el-form-item label="错误提示" prop="validationRules.message">
            <el-input
              v-model="formData.validationRules.message"
              placeholder="验证失败时的错误消息"
            />
          </el-form-item>

          <el-form-item label="显示顺序" prop="displayOrder">
            <el-input-number v-model="formData.displayOrder" :min="0" />
          </el-form-item>

          <el-form-item label="是否启用" prop="isActive">
            <el-switch v-model="formData.isActive" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { pinyin } from 'pinyin-pro'
import {
  getCustomFieldConfig,
  createCustomFieldConfig,
  updateCustomFieldConfig,
  type CreateCustomFieldConfigDto,
} from '@/api/customFieldConfig'
import { dictionaryApi, type DictType } from '@/api/dictionary'

interface Props {
  // 嵌入模式（弹窗内使用），不做路由跳转
  embedded?: boolean
  // 编辑时的配置ID，嵌入模式下使用
  configId?: number | string | null
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  configId: null,
})

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const isEdit = ref(false)
const configId = ref<number>()

const formData = reactive<CreateCustomFieldConfigDto>({
  entityType: 'customer',
  fieldCode: '',
  fieldName: '',
  fieldType: 'text',
  fieldOptions: {
    sourceType: 'manual',
    options: [],
  },
  isRequired: false,
  defaultValue: '',
  placeholder: '',
  helpText: '',
  validationRules: {},
  displayOrder: 0,
  isActive: true,
  groupName: '',
})

const formRules: FormRules = {
  entityType: [{ required: true, message: '请选择实体类型', trigger: 'change' }],
  fieldCode: [{ required: true, message: '请输入字段编码', trigger: 'blur' }],
  fieldName: [{ required: true, message: '请输入字段名称', trigger: 'blur' }],
  fieldType: [{ required: true, message: '请选择字段类型', trigger: 'change' }],
}

// 字典类型选项
const dictTypeOptions = ref<DictType[]>([])
const dictTypeLoading = ref(false)

// 标记字段编码是否被手动修改过
const fieldCodeManuallyEdited = ref(false)

// 生成字段编码
const generateFieldCode = () => {
  if (isEdit.value || !formData.fieldName) {
    return
  }

  // 如果字段编码已被手动修改过，不自动生成
  if (fieldCodeManuallyEdited.value) {
    return
  }

  formData.fieldCode = generateCodeFromName(formData.fieldName)
}

// 从名称生成编码
const generateCodeFromName = (name: string): string => {
  if (!name) return ''
  
  // 使用 pinyin-pro 将中文转为拼音，其它字符原样保留
  const full = pinyin(name, {
    toneType: 'none', // 无声调
    type: 'array', // 返回数组
    nonZh: 'spaced', // 非中文字符用空格分隔
  }) as string[]

  const joined = full
    .join(' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ') // 非字母数字替换为空格
    .trim()
    .replace(/\s+/g, '_') // 空格替换为下划线
    .toLowerCase() // 转小写

  return joined || 'field_' + Date.now()
}

// 加载字典类型列表
const loadDictTypes = async (visible: boolean) => {
  if (!visible || dictTypeOptions.value.length > 0) {
    return
  }

  dictTypeLoading.value = true
  try {
    const res = await dictionaryApi.getTypes({ limit: 1000 })
    if (res.code === 200) {
      dictTypeOptions.value = res.data.items
    }
  } catch (error) {
    console.error('加载字典类型失败:', error)
  } finally {
    dictTypeLoading.value = false
  }
}

const addOption = () => {
  if (!formData.fieldOptions) {
    formData.fieldOptions = { sourceType: 'manual', options: [] }
  }
  if (!Array.isArray(formData.fieldOptions.options)) {
    formData.fieldOptions.options = []
  }
  formData.fieldOptions.options.push({ label: '', value: '' })
}

const removeOption = (index: number) => {
  if (formData.fieldOptions?.options && Array.isArray(formData.fieldOptions.options)) {
    formData.fieldOptions.options.splice(index, 1)
  }
}

// 处理字段类型变化
const handleFieldTypeChange = (value: string) => {
  // 当切换到 select 或 multiselect 时，确保 fieldOptions 正确初始化
  if (value === 'select' || value === 'multiselect') {
    if (!formData.fieldOptions) {
      formData.fieldOptions = { sourceType: 'manual', options: [] }
    } else {
      // 确保 options 是数组
      if (!Array.isArray(formData.fieldOptions.options)) {
        formData.fieldOptions.options = []
      }
      // 如果没有 sourceType，设置默认值
      if (!formData.fieldOptions.sourceType) {
        formData.fieldOptions.sourceType = 'manual'
      }
    }
  }
}

// 处理选项来源类型变化
const handleSourceTypeChange = (value: string) => {
  if (!formData.fieldOptions) {
    formData.fieldOptions = { sourceType: value as 'manual' | 'dict', options: [] }
  } else {
    formData.fieldOptions.sourceType = value as 'manual' | 'dict'
  }
  // 切换到手动输入时，确保 options 是数组
  if (value === 'manual' && !Array.isArray(formData.fieldOptions.options)) {
    formData.fieldOptions.options = []
  }
}

const loadData = async () => {
  // 优先使用 props.configId（嵌入模式），否则使用路由参数
  const idFromProps =
    props.configId !== null && props.configId !== undefined
      ? Number(props.configId)
      : undefined
  const idFromRoute = route.params.id ? Number(route.params.id) : undefined
  const id = idFromProps ?? idFromRoute

  if (id) {
    isEdit.value = true
    configId.value = id
    try {
      const res = await getCustomFieldConfig(configId.value)
      if (res.code === 200) {
        Object.assign(formData, res.data)
        if (!formData.fieldOptions) {
          formData.fieldOptions = { sourceType: 'manual', options: [] }
        }
        // 确保 options 始终是数组
        if (!Array.isArray(formData.fieldOptions.options)) {
          formData.fieldOptions.options = []
        }
        // 确保 options 中的每个项都是对象
        formData.fieldOptions.options = formData.fieldOptions.options.map((opt: any) => {
          if (typeof opt === 'object' && opt !== null) {
            return { label: opt.label || '', value: opt.value || '' }
          }
          return { label: '', value: '' }
        })
        if (!formData.fieldOptions.sourceType) {
          formData.fieldOptions.sourceType = 'manual'
        }
        if (!formData.validationRules) {
          formData.validationRules = {}
        }
        // 编辑模式下，标记字段编码已被手动编辑（因为已有值）
        fieldCodeManuallyEdited.value = true
      }
    } catch (error) {
      ElMessage.error('加载数据失败')
    }
  } else {
    // 新建模式下，重置标记
    fieldCodeManuallyEdited.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const submitData = { ...formData }
      
      // 确保 fieldOptions 格式正确
      if (submitData.fieldOptions) {
        // 如果是手动输入，确保 options 是数组
        if (submitData.fieldOptions.sourceType === 'manual') {
          if (!Array.isArray(submitData.fieldOptions.options)) {
            submitData.fieldOptions.options = []
          }
          // 过滤掉空的选项
          submitData.fieldOptions.options = submitData.fieldOptions.options.filter(
            (opt: any) => opt && (opt.label || opt.value)
          )
          // 如果选项为空，删除 options
          if (!submitData.fieldOptions.options.length) {
            delete submitData.fieldOptions.options
          }
        } else if (submitData.fieldOptions.sourceType === 'dict') {
          // 如果是字典类型，删除 options
          delete submitData.fieldOptions.options
        }
      }
      
      // 清理空值
      if (Object.keys(submitData.validationRules || {}).length === 0) {
        delete submitData.validationRules
      }

      if (isEdit.value && configId.value) {
        const res = await updateCustomFieldConfig(configId.value, submitData)
        if (res.code === 200) {
          ElMessage.success('更新成功')
          if (props.embedded) {
            emit('saved')
          } else {
            goBack()
          }
        }
      } else {
        const res = await createCustomFieldConfig(submitData)
        if (res.code === 201) {
          ElMessage.success('创建成功')
          if (props.embedded) {
            emit('saved')
          } else {
            goBack()
          }
        }
      }
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const goBack = () => {
  if (props.embedded) {
    emit('cancel')
  } else {
    router.push('/custom-field-config')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.form-page {
  height: 100%;
  padding: 16px;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

