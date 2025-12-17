<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="110px"
    class="visit-form"
  >
    <el-form-item label="拜访对象类型" prop="relatedType">
      <el-select
        v-model="formData.relatedType"
        placeholder="请选择拜访对象类型"
        style="width: 100%"
        @change="handleRelatedTypeChange"
        :disabled="!!defaultRelatedType"
      >
        <el-option label="客户" value="customer" />
        <el-option label="联系人" value="contact" />
        <el-option label="商机" value="opportunity" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="formData.relatedType" label="拜访对象" prop="relatedId">
      <el-select
        v-model="formData[formData.relatedType + 'Id']"
        placeholder="请选择拜访对象"
        filterable
        clearable
        style="width: 100%"
        :disabled="!!defaultRelatedId"
      >
        <el-option
          v-for="item in relatedOptions"
          :key="item.id"
          :label="item.name || item.title"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="拜访目的" prop="purpose">
      <el-select
        v-model="formData.purpose"
        placeholder="请选择拜访目的"
        filterable
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="item in purposeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="拜访类型" prop="type">
      <el-select
        v-model="formData.type"
        placeholder="请选择拜访类型"
        filterable
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="item in typeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="拜访准备" prop="preparation">
      <el-select
        v-model="formData.preparation"
        placeholder="请选择拜访准备"
        multiple
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="item in preparationOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="计划开始时间" prop="plannedStartTime">
      <div style="display: flex; gap: 8px; width: 100%">
        <el-date-picker
          v-model="formData.plannedStartDate"
          type="date"
          placeholder="选择日期"
          style="flex: 1"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-select
          v-model="formData.plannedStartTime"
          placeholder="选择时间"
          style="width: 120px"
        >
          <el-option
            v-for="time in timeOptions"
            :key="time.value"
            :label="time.label"
            :value="time.value"
          />
        </el-select>
      </div>
    </el-form-item>
    <el-form-item label="时长" prop="duration">
      <el-select
        v-model="formData.duration"
        placeholder="选择时长"
        style="width: 100%"
        @change="handleDurationChange"
      >
        <el-option label="15分钟" value="15" />
        <el-option label="30分钟" value="30" />
        <el-option label="45分钟" value="45" />
        <el-option label="1小时" value="60" />
        <el-option label="2小时" value="120" />
        <el-option label="3小时" value="180" />
        <el-option label="选择结束时间" value="custom" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="formData.duration === 'custom'"
      label="计划结束时间"
      prop="plannedEndTime"
    >
      <div style="display: flex; gap: 8px; width: 100%">
        <el-date-picker
          v-model="formData.plannedEndDate"
          type="date"
          placeholder="选择日期"
          style="flex: 1"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-select
          v-model="formData.plannedEndTime"
          placeholder="选择时间"
          style="width: 120px"
        >
          <el-option
            v-for="time in timeOptions"
            :key="time.value"
            :label="time.label"
            :value="time.value"
          />
        </el-select>
      </div>
    </el-form-item>
    <el-form-item label="所在地区" prop="region">
      <el-cascader
        v-model="formData.region"
        :options="regionOptions"
        placeholder="请选择所在地区"
        filterable
        clearable
        style="width: 100%"
        :props="{ expandTrigger: 'hover' }"
      />
    </el-form-item>
    <el-form-item label="详情地址" prop="detailAddress">
      <el-input v-model="formData.detailAddress" placeholder="请输入详情地址" />
    </el-form-item>
    <el-form-item v-if="formData.relatedType" label="拜访对象" prop="relatedId">
      <el-select
        v-model="formData[formData.relatedType + 'Id']"
        placeholder="请选择拜访对象"
        filterable
        clearable
        style="width: 100%"
        :disabled="!!defaultRelatedId"
      >
        <el-option
          v-for="item in relatedOptions"
          :key="item.id"
          :label="item.name || item.title"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="3"
        placeholder="请输入描述"
      />
    </el-form-item>
    <el-form-item label="优先级" prop="priority">
      <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
        <el-option label="紧急" value="urgent" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <div style="display: flex; gap: 10px; justify-content: flex-end; width: 100%">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import visitApi, { type Visit, type CreateVisitDto, type UpdateVisitDto } from '@/api/visit'
import customerApi from '@/api/customer'
import contactApi from '@/api/contact'
import opportunityApi from '@/api/opportunity'
import commonApi from '@/api/common'
import dictionaryApi from '@/api/dictionary'

interface Props {
  visit?: Visit | null
  // 在详情页中使用时，可以传默认关联类型和ID，自动锁定拜访对象
  defaultRelatedType?: 'customer' | 'contact' | 'opportunity'
  defaultRelatedId?: number
}

const props = withDefaults(defineProps<Props>(), {
  visit: null,
  defaultRelatedType: undefined,
  defaultRelatedId: undefined,
})

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const customerOptions = ref<Array<{ id: number; name: string }>>([])
const contactOptions = ref<Array<{ id: number; name: string }>>([])
const opportunityOptions = ref<Array<{ id: number; title: string }>>([])
const regionOptions = ref<any[]>([])
const preparationOptions = ref<Array<{ label: string; value: string }>>([])
const purposeOptions = ref<Array<{ label: string; value: string }>>([])
const typeOptions = ref<Array<{ label: string; value: string }>>([])

const relatedOptions = computed(() => {
  if (formData.relatedType === 'customer') return customerOptions.value
  if (formData.relatedType === 'contact') return contactOptions.value
  if (formData.relatedType === 'opportunity') return opportunityOptions.value
  return []
})

// 生成15分钟间隔的时间选项
const generateTimeOptions = () => {
  const options: Array<{ label: string; value: string }> = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = String(hour).padStart(2, '0')
      const minuteStr = String(minute).padStart(2, '0')
      options.push({
        label: `${hourStr}:${minuteStr}`,
        value: `${hourStr}:${minuteStr}:00`,
      })
    }
  }
  return options
}

const timeOptions = ref(generateTimeOptions())

// 获取当前时间所属的15分钟区间
const getCurrentTimeSlot = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  // 向下取整到最近的15分钟
  const roundedMinutes = Math.floor(minutes / 15) * 15
  const hourStr = String(hours).padStart(2, '0')
  const minuteStr = String(roundedMinutes).padStart(2, '0')
  return `${hourStr}:${minuteStr}:00`
}

// 根据开始时间和时长计算结束时间
const calculateEndTime = (startDate: string, startTime: string, durationMinutes: number) => {
  if (!startDate || !startTime) return { date: '', time: getCurrentTimeSlot() }

  const startDateTime = new Date(`${startDate}T${startTime}`)
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)

  const endDate = endDateTime.toISOString().split('T')[0]
  const endHours = endDateTime.getHours()
  const endMinutes = endDateTime.getMinutes()
  // 向下取整到最近的15分钟
  const roundedMinutes = Math.floor(endMinutes / 15) * 15
  const hourStr = String(endHours).padStart(2, '0')
  const minuteStr = String(roundedMinutes).padStart(2, '0')
  const endTime = `${hourStr}:${minuteStr}:00`

  return { date: endDate, time: endTime }
}

// 处理时长变化
const handleDurationChange = (value: string) => {
  if (value === 'custom') {
    // 如果选择自定义，使用当前计算的结束时间作为默认值
    if (formData.plannedStartDate && formData.plannedStartTime) {
      const currentDuration =
        formData.duration && formData.duration !== 'custom' ? parseInt(formData.duration) : 30
      const endTime = calculateEndTime(
        formData.plannedStartDate,
        formData.plannedStartTime,
        currentDuration,
      )
      formData.plannedEndDate = endTime.date
      formData.plannedEndTime = endTime.time
    }
  } else {
    // 根据时长自动计算结束时间
    if (formData.plannedStartDate && formData.plannedStartTime) {
      const durationMinutes = parseInt(value)
      const endTime = calculateEndTime(
        formData.plannedStartDate,
        formData.plannedStartTime,
        durationMinutes,
      )
      formData.plannedEndDate = endTime.date
      formData.plannedEndTime = endTime.time
    }
  }
}

// 将日期时间字符串分离为日期和时间
const splitDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return { date: '', time: getCurrentTimeSlot() }
  const date = new Date(dateTimeStr)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  // 向下取整到最近的15分钟
  const roundedMinutes = Math.floor(minutes / 15) * 15
  const dateStr = date.toISOString().split('T')[0]
  const hourStr = String(hours).padStart(2, '0')
  const minuteStr = String(roundedMinutes).padStart(2, '0')
  return {
    date: dateStr,
    time: `${hourStr}:${minuteStr}:00`,
  }
}

// 根据开始时间和结束时间计算时长（分钟）
const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
) => {
  if (!startDate || !startTime || !endDate || !endTime) return '30'

  const start = new Date(`${startDate}T${startTime}`)
  const end = new Date(`${endDate}T${endTime}`)
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

  // 检查是否匹配预设的时长选项
  if (diffMinutes === 15) return '15'
  if (diffMinutes === 30) return '30'
  if (diffMinutes === 45) return '45'
  if (diffMinutes === 60) return '60'
  if (diffMinutes === 120) return '120'
  if (diffMinutes === 180) return '180'

  // 如果不匹配，返回自定义
  return 'custom'
}

const formData = reactive<
  CreateVisitDto &
    UpdateVisitDto & {
      plannedStartDate?: string
      plannedEndDate?: string
      duration?: string
      relatedType?: 'customer' | 'contact' | 'opportunity' | ''
    }
>({
  description: '',
  type: 'follow_up',
  priority: 'medium',
  plannedStartDate: '',
  plannedStartTime: getCurrentTimeSlot(),
  plannedEndDate: '',
  plannedEndTime: getCurrentTimeSlot(),
  duration: '30', // 默认30分钟
  region: undefined,
  detailAddress: '',
  purpose: undefined,
  preparation: [],
  relatedType: '',
  customerId: undefined,
  contactId: undefined,
  opportunityId: undefined,
})

const rules: FormRules = {
  relatedType: [{ required: true, message: '请选择拜访对象类型', trigger: 'change' }],
  plannedStartTime: [
    {
      required: true,
      message: '请选择计划开始时间',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (!formData.plannedStartDate || !formData.plannedStartTime) {
          callback(new Error('请选择计划开始日期和时间'))
        } else {
          callback()
        }
      },
    },
  ],
  plannedEndTime: [
    {
      required: true,
      message: '请选择计划结束时间',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (formData.duration === 'custom') {
          if (!formData.plannedEndDate || !formData.plannedEndTime) {
            callback(new Error('请选择计划结束日期和时间'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
    },
  ],
}

// 处理关联类型变化
const handleRelatedTypeChange = () => {
  formData.customerId = undefined
  formData.contactId = undefined
  formData.opportunityId = undefined
}

// 加载选项数据
const loadOptions = async () => {
  try {
    // 加载客户列表
    const customerRes = await customerApi.getList({ page: 1, limit: 1000 })
    customerOptions.value = (customerRes.data.customers || []).map((c: any) => ({
      id: Number(c.id),
      name: c.name,
    }))

    // 加载联系人列表
    const contactRes = await contactApi.getList({ page: 1, limit: 1000 })
    contactOptions.value = (contactRes.data.contacts || []).map((c: any) => ({
      id: Number(c.id),
      name: c.name,
    }))

    // 加载商机列表
    const opportunityRes = await opportunityApi.getList({ page: 1, limit: 1000 })
    opportunityOptions.value = ((opportunityRes.data as any).opportunities || []).map(
      (o: any) => ({
        id: Number(o.id),
        title: o.title,
      }),
    )

    // 加载地区选项
    try {
      const regionRes = await commonApi.regions()
      regionOptions.value = (regionRes as any).data || []
    } catch (error) {
      console.error('加载地区选项失败:', error)
    }

    // 加载拜访准备字典选项
    try {
      const prepRes = await dictionaryApi.getItems('visit_preparation')
      preparationOptions.value = (prepRes.data || []).map((item: any) => ({
        label: item.label,
        value: item.value,
      }))
    } catch (error) {
      console.error('加载拜访准备字典失败:', error)
    }

    // 加载拜访目的字典选项
    try {
      const purposeRes = await dictionaryApi.getItems('visit_purpose')
      purposeOptions.value = (purposeRes.data || []).map((item: any) => ({
        label: item.label,
        value: item.value,
      }))
    } catch (error) {
      console.error('加载拜访目的字典失败:', error)
    }

    // 加载拜访类型字典选项
    try {
      const typeRes = await dictionaryApi.getItems('visit_type')
      typeOptions.value = (typeRes.data || []).map((item: any) => ({
        label: item.label,
        value: item.value,
      }))
    } catch (error) {
      console.error('加载拜访类型字典失败:', error)
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

// 根据 props.defaultRelatedType / defaultRelatedId 预设关联信息（新建模式）
const applyDefaultRelated = () => {
  if (!props.defaultRelatedType || !props.defaultRelatedId) {
    return
  }

  formData.relatedType = props.defaultRelatedType
  if (props.defaultRelatedType === 'customer') {
    formData.customerId = props.defaultRelatedId
  } else if (props.defaultRelatedType === 'contact') {
    formData.contactId = props.defaultRelatedId
  } else if (props.defaultRelatedType === 'opportunity') {
    formData.opportunityId = props.defaultRelatedId
  }
}

// 初始化表单数据
const initFormData = () => {
  if (props.visit) {
    // 编辑模式
    const startDateTime = splitDateTime(props.visit.plannedStartTime)
    const endDateTime = props.visit.plannedEndTime
      ? splitDateTime(props.visit.plannedEndTime)
      : { date: '', time: getCurrentTimeSlot() }

    // 计算时长
    const duration = calculateDuration(
      startDateTime.date,
      startDateTime.time,
      endDateTime.date,
      endDateTime.time,
    )

    // 确定关联类型
    if (props.visit.customerId) {
      formData.relatedType = 'customer'
    } else if (props.visit.contactId) {
      formData.relatedType = 'contact'
    } else if (props.visit.opportunityId) {
      formData.relatedType = 'opportunity'
    } else {
      formData.relatedType = ''
    }

    Object.assign(formData, {
      description: props.visit.description || '',
      type: props.visit.type,
      priority: props.visit.priority,
      plannedStartDate: startDateTime.date,
      plannedStartTime: startDateTime.time,
      plannedEndDate: endDateTime.date,
      plannedEndTime: endDateTime.time,
      duration,
      region: props.visit.region,
      detailAddress: props.visit.detailAddress || '',
      purpose: props.visit.purpose,
      preparation: props.visit.preparation || [],
      customerId: props.visit.customerId,
      contactId: props.visit.contactId,
      opportunityId: props.visit.opportunityId,
    })
  } else {
    // 新建模式：重置表单但保留默认值
    const currentDate = new Date().toISOString().split('T')[0]
    const currentTime = getCurrentTimeSlot()

    // 根据默认时长计算结束时间
    const defaultDuration = 30
    const endTime = calculateEndTime(currentDate, currentTime, defaultDuration)

    formData.relatedType = ''
    Object.assign(formData, {
      description: '',
      type: 'follow_up',
      priority: 'medium',
      plannedStartDate: currentDate,
      plannedStartTime: currentTime,
      plannedEndDate: endTime.date,
      plannedEndTime: endTime.time,
      duration: '30',
      region: undefined,
      detailAddress: '',
      purpose: undefined,
      preparation: [],
      customerId: undefined,
      contactId: undefined,
      opportunityId: undefined,
    })

    // 应用默认关联信息
    applyDefaultRelated()
  }
}

// 监听开始时间和日期变化，自动计算结束时间（如果选择了预设时长）
watch(
  () => [formData.plannedStartDate, formData.plannedStartTime, formData.duration],
  ([startDate, startTime, duration]) => {
    if (duration && duration !== 'custom' && startDate && startTime) {
      const durationMinutes = parseInt(duration)
      const endTime = calculateEndTime(startDate, startTime, durationMinutes)
      formData.plannedEndDate = endTime.date
      formData.plannedEndTime = endTime.time
    }
  },
)

// 监听编辑数据变化
watch(
  () => props.visit,
  () => {
    initFormData()
    formRef.value?.clearValidate()
  },
  { immediate: true },
)

// 监听默认关联信息变化（仅新建模式时生效）
watch(
  () => [props.defaultRelatedType, props.defaultRelatedId],
  () => {
    if (!props.visit) {
      applyDefaultRelated()
    }
  },
)

onMounted(() => {
  loadOptions()
})

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 合并日期和时间
        const plannedStartTime =
          formData.plannedStartDate && formData.plannedStartTime
            ? `${formData.plannedStartDate} ${formData.plannedStartTime}`
            : ''
        const plannedEndTime =
          formData.plannedEndDate && formData.plannedEndTime
            ? `${formData.plannedEndDate} ${formData.plannedEndTime}`
            : undefined

        // 准备提交数据
        const submitData: CreateVisitDto | UpdateVisitDto = {
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          plannedStartTime: plannedStartTime ? new Date(plannedStartTime).toISOString() : '',
          plannedEndTime: plannedEndTime ? new Date(plannedEndTime).toISOString() : undefined,
          region: formData.region,
          detailAddress: formData.detailAddress,
          purpose: formData.purpose,
          preparation: formData.preparation && formData.preparation.length > 0 ? formData.preparation : undefined,
          customerId: formData.customerId,
          contactId: formData.contactId,
          opportunityId: formData.opportunityId,
        }

        if (props.visit) {
          await visitApi.update(props.visit.id, submitData)
          ElMessage.success('更新成功')
        } else {
          await visitApi.create(submitData as CreateVisitDto)
          ElMessage.success('创建成功')
        }
        emit('success')
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.visit-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}
</style>


