<template>
  <div class="settings">
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
    </div>
    
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="租户设置" name="tenant">
          <el-form
            ref="tenantFormRef"
            :model="tenantForm"
            :rules="tenantRules"
            label-width="120px"
          >
            <el-form-item label="租户名称" prop="name">
              <el-input v-model="tenantForm.name" />
            </el-form-item>
            <el-form-item label="租户域名" prop="domain">
              <el-input v-model="tenantForm.domain" />
            </el-form-item>
            <el-form-item label="租户状态" prop="status">
              <el-select v-model="tenantForm.status" style="width: 200px">
                <el-option label="活跃" value="active" />
                <el-option label="非活跃" value="inactive" />
                <el-option label="暂停" value="suspended" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateTenantSettings" :loading="tenantLoading">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="通知设置" name="notification">
          <el-form label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.email" />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch v-model="notificationSettings.sms" />
            </el-form-item>
            <el-form-item label="系统通知">
              <el-switch v-model="notificationSettings.system" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateNotificationSettings" :loading="notificationLoading">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <el-form label-width="120px">
            <el-form-item label="登录验证">
              <el-switch v-model="securitySettings.twoFactor" />
              <span class="setting-desc">开启后登录需要二次验证</span>
            </el-form-item>
            <el-form-item label="会话超时">
              <el-input-number
                v-model="securitySettings.sessionTimeout"
                :min="30"
                :max="1440"
                :step="30"
                style="width: 200px"
              />
              <span class="setting-desc">分钟（30-1440分钟）</span>
            </el-form-item>
            <el-form-item label="密码策略">
              <el-checkbox-group v-model="securitySettings.passwordPolicy">
                <el-checkbox value="uppercase">包含大写字母</el-checkbox>
                <el-checkbox value="lowercase">包含小写字母</el-checkbox>
                <el-checkbox value="numbers">包含数字</el-checkbox>
                <el-checkbox value="symbols">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateSecuritySettings" :loading="securityLoading">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理" name="data">
          <el-form label-width="120px">
            <el-form-item label="数据备份">
              <el-button type="primary" @click="backupData" :loading="backupLoading">
                立即备份
              </el-button>
              <span class="setting-desc">上次备份：2024-01-15 10:30:00</span>
            </el-form-item>
            <el-form-item label="数据导出">
              <el-button type="success" @click="exportData">导出数据</el-button>
              <span class="setting-desc">导出所有业务数据为Excel文件</span>
            </el-form-item>
            <el-form-item label="数据清理">
              <el-button type="warning" @click="cleanData">清理数据</el-button>
              <span class="setting-desc">清理过期的临时数据</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'

const authStore = useAuthStore()

// 当前标签页
const activeTab = ref('tenant')

// 租户设置表单
const tenantFormRef = ref<FormInstance>()
const tenantForm = reactive({
  name: '',
  domain: '',
  status: 'active'
})
const tenantLoading = ref(false)

// 通知设置
const notificationSettings = reactive({
  email: true,
  sms: false,
  system: true
})
const notificationLoading = ref(false)

// 安全设置
const securitySettings = reactive({
  twoFactor: false,
  sessionTimeout: 120,
  passwordPolicy: ['lowercase', 'numbers']
})
const securityLoading = ref(false)

// 数据管理
const backupLoading = ref(false)

// 租户设置表单验证规则
const tenantRules: FormRules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '租户名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  domain: [
    { required: true, message: '请输入租户域名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/, message: '请输入正确的域名格式', trigger: 'blur' }
  ]
}

// 初始化设置数据
const initSettingsData = () => {
  const currentTenant = authStore.currentTenant
  if (currentTenant) {
    Object.assign(tenantForm, {
      name: currentTenant.name || '',
      domain: currentTenant.domain || '',
      status: currentTenant.status || 'active'
    })
  }
}

// 更新租户设置
const updateTenantSettings = async () => {
  if (!tenantFormRef.value) return
  
  try {
    const valid = await tenantFormRef.value.validate()
    if (!valid) return
    
    tenantLoading.value = true
    
    // 这里应该调用更新API
    ElMessage.success('租户设置更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    tenantLoading.value = false
  }
}

// 更新通知设置
const updateNotificationSettings = async () => {
  try {
    notificationLoading.value = true
    
    // 这里应该调用更新API
    ElMessage.success('通知设置更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    notificationLoading.value = false
  }
}

// 更新安全设置
const updateSecuritySettings = async () => {
  try {
    securityLoading.value = true
    
    // 这里应该调用更新API
    ElMessage.success('安全设置更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    securityLoading.value = false
  }
}

// 备份数据
const backupData = async () => {
  try {
    await ElMessageBox.confirm('确定要立即备份数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    backupLoading.value = true
    
    // 这里应该调用备份API
    ElMessage.success('数据备份成功')
  } catch (error) {
    // 用户取消操作
  } finally {
    backupLoading.value = false
  }
}

// 导出数据
const exportData = () => {
  ElMessage.info('数据导出功能待实现')
}

// 清理数据
const cleanData = async () => {
  try {
    await ElMessageBox.confirm('确定要清理过期数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用清理API
    ElMessage.success('数据清理成功')
  } catch (error) {
    // 用户取消操作
  }
}

onMounted(() => {
  initSettingsData()
})
</script>

<style scoped>
.settings {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.setting-desc {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
