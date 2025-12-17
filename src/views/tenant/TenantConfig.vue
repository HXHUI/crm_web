<template>
  <div class="tenant-content-section">
    <h2 class="tenant-content-title">租户配置</h2>
    <el-form
      ref="configFormRef"
      :model="configForm"
      :rules="configRules"
      label-width="180px"
      style="max-width: 700px"
    >
      <el-form-item label="层级深度">
        <span>{{ tenantInfo?.level || 0 }}</span>
      </el-form-item>
      <el-form-item label="父租户" v-if="tenantInfo?.parentId">
        <span>{{ tenantInfo?.parentName || '未知' }}</span>
      </el-form-item>

      <el-divider content-position="left">提醒设置</el-divider>

      <el-form-item label="合同到期提前提醒天数" prop="contractExpiryReminderDays">
        <el-input-number
          v-model="configForm.contractExpiryReminderDays"
          :min="1"
          :max="365"
          :precision="0"
          style="width: 200px"
        />
        <div class="form-tip">设置合同到期前多少天开始提醒，默认7天</div>
      </el-form-item>

      <el-form-item label="商机预计成交提前提醒天数" prop="opportunityCloseReminderDays">
        <el-input-number
          v-model="configForm.opportunityCloseReminderDays"
          :min="1"
          :max="365"
          :precision="0"
          style="width: 200px"
        />
        <div class="form-tip">设置商机预计成交前多少天开始提醒，默认7天</div>
      </el-form-item>

      <el-divider content-position="left">税务设置</el-divider>

      <el-form-item label="默认税率(%)" prop="defaultTaxRate">
        <el-input-number
          v-model="configForm.defaultTaxRate"
          :min="0"
          :max="100"
          :precision="2"
          :controls="false"
          style="width: 200px"
        />
        <div class="form-tip">用于报价、合同、订单的默认行税率，可在单据中按行调整</div>
      </el-form-item>

      <el-divider content-position="left">公海规则设置</el-divider>

      <el-form-item label="客户自动回到公海天数" prop="customerPoolAutoReturnDays">
        <el-input-number
          v-model="configForm.customerPoolAutoReturnDays"
          :min="1"
          :max="365"
          :precision="0"
          style="width: 200px"
        />
        <div class="form-tip">设置客户多少天未联系后自动回到公海，默认30天</div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="updateTenantConfig" :loading="configLoading">
          保存配置
        </el-button>
        <el-button @click="resetConfigForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import { tenantApi } from '@/api/tenant'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 配置信息
const configLoading = ref(false)
const configFormRef = ref<FormInstance>()
const configForm = reactive({
  contractExpiryReminderDays: 7,
  opportunityCloseReminderDays: 7,
  customerPoolAutoReturnDays: 30,
  defaultTaxRate: 0,
})

// 配置表单验证规则
const configRules: FormRules = {
  contractExpiryReminderDays: [
    { required: true, message: '请输入合同到期提前提醒天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  opportunityCloseReminderDays: [
    { required: true, message: '请输入商机预计成交提前提醒天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  customerPoolAutoReturnDays: [
    { required: true, message: '请输入客户自动回到公海天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  defaultTaxRate: [
    { required: true, message: '请输入默认税率', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '税率必须在0-100之间', trigger: 'blur' },
  ],
}

// 初始化表单数据
const initFormData = () => {
  if (tenantInfo.value) {
    // 初始化配置信息（兼容老的 config JSON 和新字段）
    if (tenantInfo.value.config) {
      try {
        const config = tenantInfo.value.config as Record<string, unknown>
        // 初始化配置表单
        configForm.contractExpiryReminderDays = typeof config.contractExpiryReminderDays === 'number' ? config.contractExpiryReminderDays : 7
        configForm.opportunityCloseReminderDays = typeof config.opportunityCloseReminderDays === 'number' ? config.opportunityCloseReminderDays : 7
        configForm.customerPoolAutoReturnDays = typeof config.customerPoolAutoReturnDays === 'number' ? config.customerPoolAutoReturnDays : 30
      } catch {
        // 忽略错误
      }
    } else {
      // 如果没有配置，使用默认值
      configForm.contractExpiryReminderDays = 7
      configForm.opportunityCloseReminderDays = 7
      configForm.customerPoolAutoReturnDays = 30
    }

    // 税率优先从 defaultTaxRate 字段读取（新字段），如果没有则从 config.defaultTaxRate 读取（兼容旧数据）
    // 处理可能的类型转换（decimal 可能返回字符串）
    const taxRateValue = (tenantInfo.value as any).defaultTaxRate
    if (taxRateValue !== undefined && taxRateValue !== null) {
      const numValue = typeof taxRateValue === 'string' ? parseFloat(taxRateValue) : taxRateValue
      if (!isNaN(numValue)) {
        configForm.defaultTaxRate = numValue
      } else {
        configForm.defaultTaxRate = 0
      }
    } else if (tenantInfo.value.config && typeof (tenantInfo.value.config as any).defaultTaxRate !== 'undefined') {
      const configTaxRate = (tenantInfo.value.config as any).defaultTaxRate
      const numValue = typeof configTaxRate === 'string' ? parseFloat(configTaxRate) : configTaxRate
      if (!isNaN(numValue)) {
        configForm.defaultTaxRate = numValue
      } else {
        configForm.defaultTaxRate = 0
      }
    } else {
      configForm.defaultTaxRate = 0
    }
  }
}

// 更新租户配置
const updateTenantConfig = async () => {
  if (!isTenantOwner.value) {
    ElMessage.warning('只有租户管理员可以修改配置')
    return
  }

  if (!configFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }

  try {
    await configFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单输入')
    return
  }

  if (!tenantInfo.value) {
    ElMessage.warning('租户信息不存在')
    return
  }

  try {
    // 将表单数据转换为配置对象（税率单独保存到 defaultTaxRate 字段，不放在 config 中）
    const config: Record<string, unknown> = {
      contractExpiryReminderDays: configForm.contractExpiryReminderDays,
      opportunityCloseReminderDays: configForm.opportunityCloseReminderDays,
      customerPoolAutoReturnDays: configForm.customerPoolAutoReturnDays,
    }

    // 如果原有配置中有其他字段，保留它们
    if (tenantInfo.value.config) {
      Object.keys(tenantInfo.value.config).forEach(key => {
        if (!['contractExpiryReminderDays', 'opportunityCloseReminderDays', 'customerPoolAutoReturnDays'].includes(key)) {
          config[key] = tenantInfo.value!.config![key]
        }
      })
    }

    configLoading.value = true

    // 调用更新配置API，税率单独作为 defaultTaxRate 字段传递
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, {
        config: config,
        defaultTaxRate: configForm.defaultTaxRate,
      })
      ElMessage.success('配置信息更新成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
      // 重新初始化表单数据，确保税率等字段正确显示
      await nextTick()
      initFormData()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(message)
  } finally {
    configLoading.value = false
  }
}

// 重置配置表单
const resetConfigForm = () => {
  if (tenantInfo.value?.config) {
    const config = tenantInfo.value.config as Record<string, any>
    configForm.contractExpiryReminderDays = typeof config.contractExpiryReminderDays === 'number' ? config.contractExpiryReminderDays : 7
    configForm.opportunityCloseReminderDays = typeof config.opportunityCloseReminderDays === 'number' ? config.opportunityCloseReminderDays : 7
    configForm.customerPoolAutoReturnDays = typeof config.customerPoolAutoReturnDays === 'number' ? config.customerPoolAutoReturnDays : 30
  } else {
    configForm.contractExpiryReminderDays = 7
    configForm.opportunityCloseReminderDays = 7
    configForm.customerPoolAutoReturnDays = 30
  }
  configFormRef.value?.clearValidate()
}

// 监听租户信息变化，自动更新表单数据
watch(
  () => tenantInfo.value,
  () => {
    if (tenantInfo.value) {
      initFormData()
    }
  },
  { deep: true }
)

onMounted(() => {
  initFormData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/tenant-layout.scss';

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

