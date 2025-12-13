<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="activity-form">
    <el-form-item label="活动标题" prop="title">
      <el-input v-model="formData.title" placeholder="请输入活动标题" />
    </el-form-item>
    <el-form-item label="活动描述" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="3"
        placeholder="请输入活动描述"
      />
    </el-form-item>
    <el-form-item label="活动类型" prop="type">
      <el-select v-model="formData.type" placeholder="请选择活动类型" style="width: 100%">
        <el-option label="电话" value="call" />
        <el-option label="会议" value="meeting" />
        <el-option label="邮件" value="email" />
        <el-option label="任务" value="task" />
        <el-option label="备注" value="note" />
        <el-option label="微信" value="wechat" />
      </el-select>
    </el-form-item>
    <el-form-item label="活动状态" prop="status">
      <el-select v-model="formData.status" placeholder="请选择活动状态" style="width: 100%">
        <el-option label="计划中" value="planned" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="formData.status !== 'completed'"
      label="计划开始时间"
      prop="plannedStartTime"
    >
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
    <el-form-item
      v-if="formData.status === 'completed'"
      label="实际开始时间"
      prop="actualStartTime"
    >
      <div style="display: flex; gap: 8px; width: 100%">
        <el-date-picker
          v-model="formData.actualStartDate"
          type="date"
          placeholder="选择日期"
          style="flex: 1"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-select
          v-model="formData.actualStartTime"
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
    <el-form-item
      v-if="formData.status === 'completed'"
      label="时长"
      prop="actualDuration"
    >
      <el-select
        v-model="formData.actualDuration"
        placeholder="选择时长"
        style="width: 100%"
        @change="handleActualDurationChange"
      >
        <el-option label="15分钟" value="15" />
        <el-option label="30分钟" value="30" />
        <el-option label="45分钟" value="45" />
        <el-option label="1小时" value="60" />
        <el-option label="2小时" value="120" />
        <el-option label="3小时" value="180" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="formData.status !== 'completed'"
      label="时长"
      prop="duration"
    >
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
      v-if="formData.duration === 'custom' && formData.status !== 'completed'"
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
    <el-form-item label="活动地点" prop="location">
      <el-input v-model="formData.location" placeholder="请输入活动地点" />
    </el-form-item>
    <el-form-item
      v-if="!props.defaultRelatedToType || props.showRelatedFields"
      label="关联类型"
      prop="relatedToType"
    >
      <el-select
        v-model="formData.relatedToType"
        placeholder="请选择关联类型"
        style="width: 100%"
        :disabled="!!props.defaultRelatedToType"
      >
        <el-option label="客户" value="customer" />
        <el-option label="联系人" value="contact" />
        <el-option label="商机" value="opportunity" />
        <el-option label="线索" value="lead" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="!props.defaultRelatedToId || props.showRelatedFields"
      label="关联对象"
      prop="relatedToId"
    >
      <el-select
        v-model="formData.relatedToId"
        placeholder="请选择关联对象"
        filterable
        clearable
        style="width: 100%"
        :disabled="!!props.defaultRelatedToId"
      >
        <el-option
          v-for="opt in relatedOptions"
          :key="opt.id"
          :label="opt.name || opt.title"
          :value="opt.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="优先级" prop="priority">
      <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
        <el-option label="紧急" value="urgent" />
      </el-select>
    </el-form-item>
    <el-form-item label="执行笔记" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="3"
        placeholder="可记录执行细节/完成笔记"
      />
    </el-form-item>
    <el-form-item label="负责人" prop="ownerId">
      <el-select
        v-model="formData.ownerId"
        style="width: 100%"
        placeholder="请选择负责人"
        filterable
        :loading="ownerLoading"
        :multiple="!props.activity"
        :collapse-tags="!props.activity"
        :collapse-tags-tooltip="!props.activity"
      >
        <el-option
          v-for="user in ownerOptions"
          :key="user.id"
          :label="user.name"
          :value="user.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import { getDepartmentMembers, getDepartmentTree, type Department, type Member } from '@/api/department'
import { customerApi } from '@/api/customer'
import { contactApi } from '@/api/contact'
import { opportunityApi } from '@/api/opportunity'
import leadApi from '@/api/lead'
import type { CreateActivityDto, UpdateActivityDto, Activity } from '@/api/activity'

interface Props {
  // 默认关联类型（如果提供，则隐藏关联类型选择，并设置为该值）
  defaultRelatedToType?: 'customer' | 'contact' | 'opportunity' | 'lead'
  // 默认关联对象ID（如果提供，则隐藏关联对象选择，并设置为该值）
  defaultRelatedToId?: string
  // 是否显示关联字段（即使提供了默认值）
  showRelatedFields?: boolean
  // 编辑时的活动数据
  activity?: Activity | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultRelatedToType: undefined,
  defaultRelatedToId: undefined,
  showRelatedFields: false,
  activity: null,
})

const emit = defineEmits<{
  submit: [data: CreateActivityDto | UpdateActivityDto | CreateActivityDto[]]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const authStore = useAuthStore()

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
      const currentDuration = formData.duration && formData.duration !== 'custom'
        ? parseInt(formData.duration)
        : 30
      const endTime = calculateEndTime(formData.plannedStartDate, formData.plannedStartTime, currentDuration)
      formData.plannedEndDate = endTime.date
      formData.plannedEndTime = endTime.time
    }
  } else {
    // 根据时长自动计算结束时间
    if (formData.plannedStartDate && formData.plannedStartTime) {
      const durationMinutes = parseInt(value)
      const endTime = calculateEndTime(formData.plannedStartDate, formData.plannedStartTime, durationMinutes)
      formData.plannedEndDate = endTime.date
      formData.plannedEndTime = endTime.time
    }
  }
}

// 处理实际时长变化（状态为已完成时）
const handleActualDurationChange = (value: string) => {
  if (formData.actualStartDate && formData.actualStartTime) {
    const durationMinutes = parseInt(value)
    const endTime = calculateEndTime(formData.actualStartDate, formData.actualStartTime, durationMinutes)
    formData.actualEndDate = endTime.date
    formData.actualEndTime = endTime.time
  }
}

// 表单数据
interface FormData {
  id?: string
  title: string
  description?: string
  type: string
  status?: string
  plannedStartDate?: string
  plannedEndDate?: string
  plannedStartTime?: string
  plannedEndTime?: string
  duration?: string
  actualStartDate?: string
  actualEndDate?: string
  actualStartTime?: string
  actualEndTime?: string
  actualDuration?: string
  location?: string
  relatedToType?: string
  relatedToId?: string
  priority?: string
  content?: string
  ownerId: string | string[]
}

const formData = reactive<FormData>({
  title: '',
  description: '',
  type: 'call',
  status: 'planned', // 默认状态为计划中
  plannedStartDate: '',
  plannedStartTime: getCurrentTimeSlot(),
  plannedEndDate: '',
  plannedEndTime: getCurrentTimeSlot(),
  duration: '30', // 默认30分钟
  actualStartDate: '',
  actualStartTime: getCurrentTimeSlot(),
  actualEndDate: '',
  actualEndTime: getCurrentTimeSlot(),
  actualDuration: '30', // 默认30分钟
  location: '',
  relatedToType: props.defaultRelatedToType || 'customer',
  relatedToId: props.defaultRelatedToId || '',
  priority: 'medium',
  content: '',
  ownerId: props.activity ? '' : ([] as string[]),
})

// 表单验证规则
const formRules: FormRules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择活动状态', trigger: 'change' }],
  plannedStartTime: [
    {
      required: false, // 动态控制，通过 validator 判断
      message: '请选择计划开始时间',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        // 如果状态是已完成，则不需要验证
        if (formData.status === 'completed') {
          callback()
          return
        }
        // 如果状态是计划中或其他状态，则需要验证
        if (!formData.plannedStartDate || !formData.plannedStartTime) {
          callback(new Error('请选择计划开始日期和时间'))
        } else {
          callback()
        }
      }
    }
  ],
  duration: [
    {
      required: false, // 动态控制，通过 validator 判断
      message: '请选择时长',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        // 如果状态是已完成，则不需要验证计划时长
        if (formData.status === 'completed') {
          callback()
          return
        }
        // 如果状态是计划中或其他状态，则需要验证
        if (!formData.duration) {
          callback(new Error('请选择时长'))
        } else {
          callback()
        }
      }
    }
  ],
  actualStartTime: [
    {
      required: false, // 动态控制，通过 validator 判断
      message: '请选择实际开始时间',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        // 如果状态不是已完成，则不需要验证
        if (formData.status !== 'completed') {
          callback()
          return
        }
        // 如果状态是已完成，则需要验证
        if (!formData.actualStartDate || !formData.actualStartTime) {
          callback(new Error('请选择实际开始日期和时间'))
        } else {
          callback()
        }
      }
    }
  ],
  actualDuration: [
    {
      required: false, // 动态控制，通过 validator 判断
      message: '请选择时长',
      trigger: 'change',
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        // 如果状态不是已完成，则不需要验证
        if (formData.status !== 'completed') {
          callback()
          return
        }
        // 如果状态是已完成，则需要验证
        if (!formData.actualDuration) {
          callback(new Error('请选择时长'))
        } else {
          callback()
        }
      }
    }
  ],
}

// 选项数据
const customerOptions = ref<Array<{ id: string; name: string }>>([])
const contactOptions = ref<Array<{ id: string; name: string }>>([])
const opportunityOptions = ref<Array<{ id: string; title: string }>>([])
const leadOptions = ref<Array<{ id: string; name: string }>>([])
const relatedOptions = ref<Array<any>>([])

// 负责人相关
const ownerOptions = ref<Array<{ id: string; name: string }>>([])
const ownerLoading = ref(false)
const isDepartmentManager = ref(false)

const currentMemberId = computed(() => {
  return (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
})

const getCurrentUserName = () =>
  (authStore as any)?.user?.username ||
  (authStore as any)?.user?.realName ||
  (authStore as any)?.user?.nickname ||
  '当前用户'

// 根据关联类型更新选项
const updateRelatedOptions = () => {
  const type = formData.relatedToType
  if (type === 'customer') {
    relatedOptions.value = customerOptions.value
  } else if (type === 'contact') {
    relatedOptions.value = contactOptions.value
  } else if (type === 'opportunity') {
    relatedOptions.value = opportunityOptions.value
  } else if (type === 'lead') {
    relatedOptions.value = leadOptions.value
  } else {
    relatedOptions.value = []
  }
}

watch(
  () => formData.relatedToType,
  () => {
    updateRelatedOptions()
    // 如果关联类型改变且没有默认关联ID，清空关联对象选择
    if (!props.defaultRelatedToId) {
      formData.relatedToId = ''
    }
  },
  { immediate: true },
)

// 监听默认值变化
watch(
  () => [props.defaultRelatedToType, props.defaultRelatedToId],
  ([type, id]) => {
    if (type) {
      formData.relatedToType = type as 'customer' | 'contact' | 'opportunity' | 'lead'
    }
    if (id) {
      formData.relatedToId = id
    }
  },
  { immediate: true },
)

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

// 监听状态变化，清除相关字段的验证
watch(
  () => formData.status,
  () => {
    // 当状态改变时，清除相关字段的验证
    nextTick(() => {
      formRef.value?.clearValidate(['plannedStartTime', 'duration', 'actualStartTime', 'actualDuration'])
    })
  },
)

// 监听实际开始时间和时长变化，自动计算实际结束时间
watch(
  () => [formData.actualStartDate, formData.actualStartTime, formData.actualDuration],
  ([startDate, startTime, duration]) => {
    if (duration && startDate && startTime) {
      const durationMinutes = parseInt(duration)
      const endTime = calculateEndTime(startDate, startTime, durationMinutes)
      formData.actualEndDate = endTime.date
      formData.actualEndTime = endTime.time
    }
  },
)

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
const calculateDuration = (startDate: string, startTime: string, endDate: string, endTime: string) => {
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

// 初始化表单数据
const initFormData = () => {
  if (props.activity) {
    // 编辑模式
    const startDateTime = splitDateTime(props.activity.plannedStartTime)
    const endDateTime = props.activity.plannedEndTime ? splitDateTime(props.activity.plannedEndTime) : { date: '', time: getCurrentTimeSlot() }

    // 计算计划时长
    const duration = calculateDuration(
      startDateTime.date,
      startDateTime.time,
      endDateTime.date,
      endDateTime.time
    )

    // 处理实际开始时间和结束时间
    let actualStartDateTime = { date: '', time: getCurrentTimeSlot() }
    let actualEndDateTime = { date: '', time: getCurrentTimeSlot() }
    let actualDuration = '30'

    if (props.activity.actualStartTime) {
      actualStartDateTime = splitDateTime(props.activity.actualStartTime)
      if (props.activity.actualEndTime) {
        actualEndDateTime = splitDateTime(props.activity.actualEndTime)
        // 计算实际时长
        actualDuration = calculateDuration(
          actualStartDateTime.date,
          actualStartDateTime.time,
          actualEndDateTime.date,
          actualEndDateTime.time
        )
        // 如果计算出的时长是自定义，使用默认值
        if (actualDuration === 'custom') {
          actualDuration = '30'
        }
      }
    }

    Object.assign(formData, {
      id: props.activity.id,
      title: props.activity.title,
      description: props.activity.description || '',
      type: props.activity.type,
      status: props.activity.status || 'planned',
      plannedStartDate: startDateTime.date,
      plannedStartTime: startDateTime.time,
      plannedEndDate: endDateTime.date,
      plannedEndTime: endDateTime.time,
      duration,
      actualStartDate: actualStartDateTime.date,
      actualStartTime: actualStartDateTime.time,
      actualEndDate: actualEndDateTime.date,
      actualEndTime: actualEndDateTime.time,
      actualDuration,
      location: props.activity.location || '',
      relatedToType: props.activity.relatedToType || props.defaultRelatedToType || 'customer',
      relatedToId: props.activity.relatedToId || props.defaultRelatedToId || '',
      priority: props.activity.priority || 'medium',
      content: props.activity.content || '',
      ownerId: props.activity.ownerId || '',
    })
    // 编辑模式下，ownerId 应该是字符串
    if (props.activity) {
      formData.ownerId = String(formData.ownerId)
    }
  } else {
    // 新建模式：重置表单但保留默认值
    const currentDate = new Date().toISOString().split('T')[0]
    const currentTime = getCurrentTimeSlot()

    // 根据默认时长计算结束时间
    const defaultDuration = 30
    const endTime = calculateEndTime(currentDate, currentTime, defaultDuration)

    Object.assign(formData, {
      id: undefined,
      title: '',
      description: '',
      type: 'call',
      status: 'planned', // 新建时默认为计划中
      plannedStartDate: currentDate,
      plannedStartTime: currentTime,
      plannedEndDate: endTime.date,
      plannedEndTime: endTime.time,
      duration: '30',
      actualStartDate: '',
      actualStartTime: getCurrentTimeSlot(),
      actualEndDate: '',
      actualEndTime: getCurrentTimeSlot(),
      actualDuration: '30',
      location: '',
      relatedToType: props.defaultRelatedToType || 'customer',
      relatedToId: props.defaultRelatedToId || '',
      priority: 'medium',
      content: '',
      ownerId: '',
    })
  }
}

// 监听活动数据变化（编辑模式）
watch(
  () => props.activity,
  () => {
    initFormData()
    formRef.value?.clearValidate()
  },
  { immediate: true },
)

// 加载选项数据
const loadOptions = async () => {
  try {
    // 加载客户列表
    const customerResponse = await customerApi.getList({ page: 1, limit: 1000 })
    customerOptions.value = (customerResponse.data.customers || []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
    }))

    // 加载联系人列表
    const contactResponse = await contactApi.getList({ page: 1, limit: 1000 })
    contactOptions.value = ((contactResponse.data as any).contacts || []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
    }))

    // 加载商机列表
    const opportunityResponse = await opportunityApi.getList({ page: 1, limit: 1000 })
    opportunityOptions.value = ((opportunityResponse.data as any).opportunities || []).map(
      (o: any) => ({ id: String(o.id), title: o.title }),
    )

    // 加载线索列表
    try {
      const leadResponse = await leadApi.getList({ page: 1, limit: 1000 })
      leadOptions.value = ((leadResponse.data as any).leads || []).map((l: any) => ({
        id: String(l.id),
        name: l.name || l.company,
      }))
    } catch (error) {
      console.error('加载线索列表失败:', error)
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

// 确保默认负责人
const ensureDefaultOwner = () => {
  const memberId = currentMemberId.value
  if (memberId) {
    if (props.activity) {
      // 编辑模式：单选
      if (!formData.ownerId) {
        formData.ownerId = String(memberId)
      }
    } else {
      // 新建模式：多选，默认包含当前用户
      if (Array.isArray(formData.ownerId) && formData.ownerId.length === 0) {
        formData.ownerId = [String(memberId)]
      }
    }
  }
}

// 加载负责人选项
const loadOwnerOptions = async () => {
  ownerLoading.value = true
  try {
    const memberId = currentMemberId.value
    if (!memberId) {
      ownerOptions.value = []
      return
    }

    const deptTreeRes = await getDepartmentTree()
    const departmentTree = deptTreeRes.data || []

    const findDepartmentByMember = async (depts: Department[]): Promise<Department | null> => {
      for (const dept of depts) {
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members =
            membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          if (members.some((m: Member) => String(m.id) === String(memberId))) {
            return dept
          }
        } catch {
          // 忽略错误，继续遍历
        }

        if (dept.children && dept.children.length > 0) {
          const found = await findDepartmentByMember(dept.children)
          if (found) return found
        }
      }
      return null
    }

    const userDepartment = await findDepartmentByMember(departmentTree)

    if (userDepartment && userDepartment.managerId) {
      isDepartmentManager.value = String(userDepartment.managerId) === String(memberId)
    } else {
      isDepartmentManager.value = false
    }

    const currentUserOption = { id: String(memberId), name: getCurrentUserName() }

    if (!isDepartmentManager.value || !userDepartment) {
      ownerOptions.value = [currentUserOption]
      ensureDefaultOwner()
      return
    }

    const memberMap = new Map<string, { id: string; name: string }>()
    const collectDepartmentMembers = async (dept: Department) => {
      try {
        const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
        const members =
          membersRes.data?.members || membersRes.data?.items || membersRes.data || []
        members.forEach((m: Member) => {
          const id = String(m.id)
          if (!memberMap.has(id)) {
            memberMap.set(id, {
              id,
              name: m.user?.username || m.nickname || m.user?.realName || '未知用户',
            })
          }
        })
      } catch (error) {
        console.error(`获取部门 ${dept.name} 成员失败:`, error)
      }

      if (dept.children && dept.children.length > 0) {
        for (const child of dept.children) {
          await collectDepartmentMembers(child)
        }
      }
    }

    await collectDepartmentMembers(userDepartment)

    if (!memberMap.has(currentUserOption.id)) {
      memberMap.set(currentUserOption.id, currentUserOption)
    }

      ownerOptions.value = Array.from(memberMap.values())
      ensureDefaultOwner()
    } catch (error) {
      console.error('加载负责人列表失败:', error)
      const memberId = currentMemberId.value
      if (memberId) {
        const currentUserOption = { id: String(memberId), name: getCurrentUserName() }
        ownerOptions.value = [currentUserOption]
        ensureDefaultOwner()
      } else {
        ownerOptions.value = []
      }
    } finally {
      ownerLoading.value = false
    }
  }

// 重置表单
const resetForm = () => {
  initFormData()
  formRef.value?.clearValidate()
}

// 提交表单
const submit = async () => {
  if (!formRef.value) {
    ElMessage.warning('表单未初始化')
    return false
  }

  try {
    await formRef.value.validate()

    // 确保有负责人
    if (!formData.ownerId) {
      ensureDefaultOwner()
    }

    // 验证负责人
    if (props.activity) {
      // 编辑模式：单选
      if (!formData.ownerId || (typeof formData.ownerId === 'string' && !formData.ownerId.trim())) {
        ElMessage.warning('请选择负责人')
        return false
      }
    } else {
      // 新建模式：多选
      if (!formData.ownerId || (Array.isArray(formData.ownerId) && formData.ownerId.length === 0)) {
        ElMessage.warning('请选择负责人')
        return false
      }
    }

    // 如果选择了关联类型但没有选择关联对象，提示用户
    if (formData.relatedToType) {
      const relatedToIdStr = formData.relatedToId ? String(formData.relatedToId) : ''
      if (!relatedToIdStr || !relatedToIdStr.trim()) {
        ElMessage.warning('请选择关联对象')
        return false
      }
    }

    // 合并日期和时间（仅在状态不是已完成时）
    const plannedStartTime = formData.status !== 'completed' && formData.plannedStartDate && formData.plannedStartTime
      ? `${formData.plannedStartDate} ${formData.plannedStartTime}`
      : ''
    const plannedEndTime = formData.status !== 'completed' && formData.plannedEndDate && formData.plannedEndTime
      ? `${formData.plannedEndDate} ${formData.plannedEndTime}`
      : undefined

    // 合并实际开始时间和结束时间（仅在状态是已完成时）
    const actualStartTime = formData.status === 'completed' && formData.actualStartDate && formData.actualStartTime
      ? `${formData.actualStartDate} ${formData.actualStartTime}`
      : ''
    const actualEndTime = formData.status === 'completed' && formData.actualEndDate && formData.actualEndTime
      ? `${formData.actualEndDate} ${formData.actualEndTime}`
      : undefined

    // 基础数据
    const baseData: Omit<CreateActivityDto, 'ownerId'> = {
      title: formData.title,
      description: formData.description,
      type: formData.type as CreateActivityDto['type'],
      status: formData.status as CreateActivityDto['status'],
      plannedStartTime: plannedStartTime
        ? new Date(plannedStartTime).toISOString()
        : undefined,
      plannedEndTime: plannedEndTime
        ? new Date(plannedEndTime).toISOString()
        : undefined,
      actualStartTime: actualStartTime
        ? new Date(actualStartTime).toISOString()
        : undefined,
      actualEndTime: actualEndTime
        ? new Date(actualEndTime).toISOString()
        : undefined,
      location: formData.location,
      relatedToType: formData.relatedToType as CreateActivityDto['relatedToType'],
      relatedToId: (formData.relatedToId
        ? String(formData.relatedToId).trim()
        : '') as string,
      priority: formData.priority as CreateActivityDto['priority'],
      content: formData.content,
    }

    if (props.activity) {
      // 编辑模式：单条记录
      const submitData: UpdateActivityDto = {
        ...baseData,
        ownerId: typeof formData.ownerId === 'string' ? formData.ownerId : String(formData.ownerId),
      }
      emit('submit', submitData)
    } else {
      // 新建模式：可能多条记录
      const ownerIds: string[] = Array.isArray(formData.ownerId)
        ? formData.ownerId.map(id => String(id))
        : [String(formData.ownerId)]

      if (ownerIds.length === 0) {
        ElMessage.warning('请至少选择一个负责人')
        return false
      }

      const submitDataList: CreateActivityDto[] = ownerIds.map(ownerId => ({
        ...baseData,
        ownerId: ownerId,
      } as CreateActivityDto))
      emit('submit', submitDataList)
    }

    return true
  } catch (error: any) {
    // 表单验证失败，Element Plus 会自动显示错误消息
    // 如果是其他错误，记录日志
    if (error && typeof error === 'object' && !error.fields) {
      console.error('提交表单时发生错误:', error)
      ElMessage.error('提交表单失败，请检查表单内容')
    }
    return false
  }
}

// 监听当前用户变化
watch(
  () => currentMemberId.value,
  (val, prev) => {
    if (val && val !== prev) {
      loadOwnerOptions()
      ensureDefaultOwner()
    }
  },
)

// 暴露方法
defineExpose({
  submit,
  resetForm,
  formRef,
})

onMounted(async () => {
  // 初始化表单数据
  initFormData()
  // 加载选项数据
  await loadOptions()
  // 更新关联对象选项（确保默认关联类型对应的选项已加载）
  updateRelatedOptions()
  loadOwnerOptions()
  ensureDefaultOwner()
})
</script>

<style lang="scss" scoped>
.activity-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}
</style>

