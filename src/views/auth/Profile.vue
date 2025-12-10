<template>
  <div class="profile-container">
    <div class="profile-layout">
      <!-- 左侧导航 -->
      <div class="profile-sidebar">
        <!-- 用户信息头部 -->
        <div class="user-header">
          <el-avatar :size="64" :src="userInfo.avatar" class="user-avatar">
            {{ userInfo.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="user-name">{{ userInfo.username || '用户' }}</div>
        </div>

        <!-- 导航菜单 -->
        <div class="nav-menu">
          <div
            v-for="item in menuItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="profile-content">
        <el-card>
          <!-- 基本信息 -->
          <div v-if="activeTab === 'basic'" class="content-section">
            <h2 class="content-title">基本信息</h2>

            <!-- 头像设置 -->
            <div class="avatar-section">
              <div class="avatar-label">头像</div>
              <div class="avatar-wrapper">
                <el-avatar :size="80" :src="userInfo.avatar">
                  {{ userInfo.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <el-button type="primary" size="small" @click="handleAvatarChange">
                  更换头像
                </el-button>
                <input
                  ref="avatarInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarUpload"
                />
              </div>
            </div>

            <!-- 基本信息表单 -->
            <el-form
              ref="basicFormRef"
              :model="basicForm"
              :rules="basicRules"
              label-width="140px"
              style="max-width: 600px"
            >
              <el-form-item label="* 姓名" prop="username">
                <el-input v-model="basicForm.username" placeholder="请输入姓名" />
              </el-form-item>
              <el-form-item label="直属上级">
                <el-input v-model="basicForm.supervisor" placeholder="请输入直属上级" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="basicForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="岗位">
                <el-input v-model="basicForm.position" placeholder="请输入岗位" />
              </el-form-item>
              <el-form-item label="* 手机号(登录名)" prop="phone">
                <el-input v-model="basicForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="basicForm.gender" placeholder="请选择" style="width: 100%">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="部门">
                <el-input v-model="basicForm.department" placeholder="请输入部门" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updateBasicInfo" :loading="basicLoading">
                  保存
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 绑定信息 -->
          <div v-if="activeTab === 'binding'" class="content-section">
            <h2 class="content-title">绑定信息</h2>
            <div class="binding-list">
              <div class="binding-item">
                <div class="binding-icon">
                  <el-icon :size="24"><Iphone /></el-icon>
                </div>
                <div class="binding-content">
                  <div class="binding-label">手机号</div>
                  <div class="binding-status">
                    <el-tag type="success" size="small">已验证</el-tag>
                    <span class="binding-value">{{ userInfo.phone || '未绑定' }}</span>
                  </div>
                </div>
              </div>
              <div class="binding-item">
                <div class="binding-icon">
                  <el-icon :size="24"><Message /></el-icon>
                </div>
                <div class="binding-content">
                  <div class="binding-label">邮箱</div>
                  <div class="binding-status">
                    <el-tag type="warning" size="small">未验证</el-tag>
                    <span class="binding-value">{{ userInfo.email || '未绑定' }}</span>
                    <el-button type="primary" size="small" style="margin-left: 12px">验证</el-button>
                  </div>
                  <div class="binding-desc">
                    绑定邮箱后，可在登录页选择邮箱登录，无缝使用系统功能。
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 账号密码 -->
          <div v-if="activeTab === 'password'" class="content-section">
            <h2 class="content-title">账号密码</h2>
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="140px"
              style="max-width: 600px"
            >
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前密码"
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updatePassword" :loading="passwordLoading">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Iphone, Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { userApi } from '@/api/user'
import type { User as UserType } from '@/types'

const authStore = useAuthStore()

// 当前用户信息
const userInfo = computed(() => authStore.currentUser || {} as UserType)

// 当前激活的标签
const activeTab = ref('basic')

// 菜单项
const menuItems = [
  { key: 'basic', label: '基本信息', icon: User },
  { key: 'binding', label: '绑定信息', icon: Iphone },
  { key: 'password', label: '账号密码', icon: Lock },
]

// 头像上传
const avatarInputRef = ref<HTMLInputElement>()

// 基本信息表单
const basicFormRef = ref<FormInstance>()
const basicForm = reactive({
  username: '',
  email: '',
  phone: '',
  supervisor: '',
  position: '',
  gender: '',
  department: ''
})
const basicLoading = ref(false)

// 密码表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)

// 确认密码验证
const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 基本信息表单验证规则
const basicRules: FormRules = {
  username: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (userInfo.value) {
    Object.assign(basicForm, {
      username: userInfo.value.username || '',
      email: userInfo.value.email || '',
      phone: userInfo.value.phone || '',
      supervisor: '',
      position: '',
      gender: '',
      department: ''
    })
  }
}

// 处理头像更换
const handleAvatarChange = () => {
  avatarInputRef.value?.click()
}

// 处理头像上传
const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式的图片')
    target.value = ''
    return
  }

  // 验证文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    target.value = ''
    return
  }

  try {
    // 上传头像文件
    const uploadResponse = await userApi.uploadAvatar(file)
    const avatarUrl = uploadResponse.data.url

    // 更新用户头像
    if (userInfo.value?.id) {
      await userApi.updateProfile(userInfo.value.id, { avatar: avatarUrl })
      ElMessage.success('头像上传成功')
      // 刷新用户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error: unknown) {
    let errorMessage = '头像上传失败'

    if (error && typeof error === 'object') {
      const err = error as {
        response?: {
          data?: {
            message?: string
            error?: string
          }
        }
        message?: string
      }

      errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || errorMessage
    }

    ElMessage.error(errorMessage)
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

// 更新基本信息
const updateBasicInfo = async () => {
  if (!basicFormRef.value) return

  try {
    const valid = await basicFormRef.value.validate()
    if (!valid) return

    basicLoading.value = true

    // 调用更新API
    if (userInfo.value?.id) {
      await userApi.updateProfile(userInfo.value.id, {
        username: basicForm.username,
        phone: basicForm.phone,
        email: basicForm.email
      })
      ElMessage.success('基本信息更新成功')
      // 刷新用户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(message)
  } finally {
    basicLoading.value = false
  }
}

// 更新密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return

    passwordLoading.value = true

    // 调用更新密码API
    // 注意：这里需要根据实际的后端API来调用
    // await authApi.updatePassword({
    //   currentPassword: passwordForm.currentPassword,
    //   newPassword: passwordForm.newPassword
    // })
    ElMessage.success('密码修改成功')

    // 重置密码表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    passwordFormRef.value.resetFields()
  } catch (error) {
    const message = error instanceof Error ? error.message : '密码修改失败'
    ElMessage.error(message)
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.profile-container {
  padding: 0;
  min-height: calc(100vh - 100px);
}

.profile-layout {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 左侧导航 */
.profile-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 24px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.user-avatar {
  margin-bottom: 12px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.nav-menu {
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606266;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #e6f4ff;
  color: #409eff;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

/* 右侧内容 */
.profile-content {
  flex: 1;
  min-width: 0;
}

.content-section {
  padding: 0;
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-section {
  margin-bottom: 32px;
}

.avatar-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.binding-list {
  max-width: 600px;
}

.binding-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
}

.binding-item:last-child {
  margin-bottom: 0;
}

.binding-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  color: #409eff;
  flex-shrink: 0;
}

.binding-content {
  flex: 1;
}

.binding-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.binding-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.binding-value {
  font-size: 14px;
  color: #606266;
}

.binding-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
