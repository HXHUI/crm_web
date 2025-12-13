<template>
  <div class="app-shell">
    <!-- 顶部：自定义一级导航 -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand-section">
        <div class="brand" @click="$router.push('/dashboard')">
          <img src="/logo.png" alt="CRM" class="brand-logo" />
        </div>
        <!-- 租户信息显示/切换 -->
        <el-dropdown
          v-if="authStore.currentTenant"
          trigger="click"
          @command="handleTenantSwitch"
          class="tenant-switcher"
          :disabled="authStore.accessibleTenants.length <= 1"
        >
          <div
            class="tenant-selector"
            :class="{
              'tenant-selector-disabled': authStore.accessibleTenants.length <= 1,
              'tenant-selector-loading': switchingTenant
            }"
          >
            <el-icon v-if="!switchingTenant"><OfficeBuilding /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            <span class="tenant-name">{{ currentTenantName }}</span>
            <el-icon v-if="authStore.accessibleTenants.length > 1 && !switchingTenant" class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="t in authStore.accessibleTenants"
                :key="t.id"
                :command="t.id"
                :class="{ 'is-current': t.id === authStore.currentTenant?.id }"
                :disabled="switchingTenant"
              >
                <div class="tenant-item">
                  <div class="tenant-item-info">
                    <span class="tenant-item-name">{{ t.name }}</span>
                    <span v-if="t.parentName" class="tenant-item-parent">（{{ t.parentName }}）</span>
                  </div>
                  <el-icon v-if="t.id === authStore.currentTenant?.id" class="check-icon"><Check /></el-icon>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- 部门选择器（仅在成员有多个部门时显示） -->
        <el-dropdown
          v-if="authStore.currentMember && memberDepartments.length > 1"
          trigger="click"
          @command="handleDepartmentSwitch"
          class="department-switcher"
        >
          <div class="department-selector">
            <el-icon><OfficeBuilding /></el-icon>
            <span class="department-name">{{ currentDepartmentName }}</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="dept in memberDepartments"
                :key="dept.id"
                :command="dept.id"
                :class="{ 'is-current': dept.id === authStore.currentDepartmentId?.toString() }"
              >
                <div class="department-item">
                  <span class="department-item-name">{{ dept.name }}</span>
                  <el-icon v-if="dept.id === authStore.currentDepartmentId?.toString()" class="check-icon"><Check /></el-icon>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        </div>
        <nav class="top-nav">
          <router-link
            :to="'/calendar'"
            class="top-item"
            :class="{ active: topPath === '/calendar' }"
            >日历</router-link
          >
          <router-link
            :to="'/dashboard'"
            class="top-item"
            :class="{ active: topPath === '/dashboard' }"
            >仪表盘</router-link
          >
          <router-link :to="'/leads'" class="top-item" :class="{ active: topPath === '/leads' }"
            >线索</router-link
          >
          <router-link
            :to="'/customers'"
            class="top-item"
            :class="{ active: topPath === '/customers' }"
            >客户</router-link
          >

          <router-link
            :to="'/opportunities'"
            class="top-item"
            :class="{ active: topPath === '/opportunities' }"
            >商机</router-link
          >
          <router-link
            :to="'/activities'"
            class="top-item"
            :class="{ active: topPath === '/activities' }"
            >活动</router-link
          >
          <router-link
            :to="'/visits'"
            class="top-item"
            :class="{ active: topPath === '/visits' }"
            >拜访</router-link
          >
          <router-link :to="'/targets'" class="top-item" :class="{ active: topPath === '/targets' }"
            >目标</router-link
          >
          <router-link
            :to="'/products'"
            class="top-item"
            :class="{ active: topPath === '/products' }"
            >产品</router-link
          >
          <router-link
            :to="'/quotes'"
            class="top-item"
            :class="{ active: topPath === '/quotes' }"
            >报价</router-link
          >
          <router-link
            :to="'/contracts'"
            class="top-item"
            :class="{ active: topPath === '/contracts' }"
            >合同</router-link
          >
          <router-link
            :to="'/orders'"
            class="top-item"
            :class="{ active: topPath === '/orders' }"
            >订单</router-link
          >
        </nav>
        <div class="topbar-right">
          <nav class="top-nav-right">
            <router-link
              :to="'/workflow/my-approvals'"
              class="top-item"
              :class="{ active: topPath === '/workflow/my-approvals' }"
              >我的审批</router-link
            >
            <router-link
              :to="'/contacts/organization'"
              class="top-item"
              :class="{ active: topPath === '/contacts' }"
              >通讯录</router-link
            >
            <router-link
              v-if="isSystemAdmin"
              :to="'/tenant'"
              class="top-item"
              :class="{ active: topPath === '/tenant' }"
              >租户</router-link
            >
            <router-link
              v-if="isSystemAdmin"
              :to="'/system/admins'"
              class="top-item"
              :class="{ active: topPath === '/system/admins' }"
              >系统管理员</router-link
            >
          </nav>
          <div class="top-actions">
          <NotificationBell v-if="isAuthenticated" />
          <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-mini">
            <div class="avatar">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.username" class="avatar-img" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <div class="user-meta">
              <div class="user-name">{{ currentUser?.username || 'User' }}</div>
              <div v-if="isTenantOwner" class="user-tag">负责人</div>
            </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item command="notification-settings">
                  <el-icon><Bell /></el-icon>
                  <span>通知设置</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="isTenantOwner" command="tenant" divided>
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>企业信息</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体：左侧二级导航 + 右侧内容 -->
    <div class="body">
      <!-- 左侧：自定义二级导航（按当前一级模块） -->
      <aside class="sidenav" v-if="subMenus.length" :class="{ collapsed: sidenavCollapsed }">
        <div class="sidenav-group">
          <div class="sidenav-header">
            <div v-show="!sidenavCollapsed" class="sidenav-title">{{ sideTitle }}</div>
            <div class="sidenav-toggle" @click="sidenavCollapsed = !sidenavCollapsed" :title="sidenavCollapsed ? '展开菜单' : '收缩菜单'">
              <el-icon>
                <Fold v-if="!sidenavCollapsed" />
                <Expand v-else />
              </el-icon>
            </div>
          </div>
          <ul class="sidenav-list">
            <li v-for="item in subMenus" :key="item.index" class="sidenav-item">
              <router-link
                :to="item.index"
                class="sidenav-link"
                :class="{ active: route.path === item.index }"
                :title="sidenavCollapsed ? item.title : ''"
              >
                <el-icon class="sidenav-icon" v-if="item.icon">
                  <component :is="item.icon" />
                </el-icon>
                <span v-show="!sidenavCollapsed" class="text">{{ item.title }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </aside>

      <!-- 右侧：标题/工具栏/列表容器 -->
      <main class="content">
        <!-- <div class="page-header">
          <div class="page-title">
            <span class="title-icon">🌀</span>
            <h1 class="title-text">{{ pageTitle }}</h1>
            <span class="title-tip" v-if="titleTip">{{ titleTip }}</span>
          </div>
          <nav class="breadcrumb">
            <router-link v-for="b in breadcrumbList" :key="b.path" :to="b.path" class="crumb">{{
              b.name
            }}</router-link>
          </nav>
        </div> -->
        <div class="page-main">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useTenantStore } from '@/stores/modules/tenant'
import { getMemberDepartments, type Department } from '@/api/department'
import {
  ArrowDown,
  User,
  OfficeBuilding,
  SwitchButton,
  Check,
  Loading,
  Fold,
  Expand,
  Grid,
  Connection,
  CollectionTag,
  Document,
  TrendCharts,
  ShoppingCart,
  DocumentCopy,
  Files,
  ShoppingBag,
  Clock,
  Location,
  UserFilled,
  Bell,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import NotificationBell from '../NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

const currentUser = computed(() => authStore.currentUser)
const isTenantOwner = computed(() => authStore.isTenantOwner)
const isSystemAdmin = computed(() => authStore.isSystemAdmin)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const userInitial = computed(() => (currentUser.value?.username?.[0] || 'U').toUpperCase())
const currentTenantName = computed(() => authStore.currentTenant?.name || '租户')

// 部门相关
const memberDepartments = ref<Department[]>([])
const currentDepartmentName = computed(() => {
  if (!authStore.currentDepartmentId) return '未选择部门'
  const dept = memberDepartments.value.find(d => {
    const dId = typeof d.id === 'string' ? parseInt(d.id, 10) : d.id
    const currentId = typeof authStore.currentDepartmentId === 'string'
      ? parseInt(authStore.currentDepartmentId, 10)
      : authStore.currentDepartmentId
    return dId === currentId
  })
  return dept?.name || '未选择部门'
})

// 监听当前租户变化，更新tenant store
watch(() => authStore.currentTenant, (tenant) => {
  if (tenant) {
    tenantStore.setCurrentTenant(tenant)
    // 设置是否为管理员
    tenantStore.setIsGroupAdmin(isTenantOwner.value || false)
    // 只有租户所有者才检查子租户
    if (isTenantOwner.value) {
      tenantStore.checkHasChildrenWithPermission(true)
    }
  }
}, { immediate: true })

// 获取成员的部门列表
const fetchMemberDepartments = async () => {
  if (!authStore.currentMember?.id) return

  try {
    const response = await getMemberDepartments(authStore.currentMember.id)
    memberDepartments.value = response.data || []

    // 如果成员只有一个部门，自动设置为当前部门
    if (memberDepartments.value.length === 1 && !authStore.currentDepartmentId) {
      const deptId = typeof memberDepartments.value[0].id === 'string'
        ? parseInt(memberDepartments.value[0].id, 10)
        : memberDepartments.value[0].id
      authStore.setCurrentDepartment(deptId)
    }
    // 验证当前部门 ID 是否在部门列表中
    else if (authStore.currentDepartmentId && memberDepartments.value.length > 0) {
      const currentId = typeof authStore.currentDepartmentId === 'string'
        ? parseInt(authStore.currentDepartmentId, 10)
        : authStore.currentDepartmentId
      const isValid = memberDepartments.value.some(d => {
        const dId = typeof d.id === 'string' ? parseInt(d.id, 10) : d.id
        return dId === currentId
      })
      // 如果当前部门 ID 不在列表中，清除它
      if (!isValid) {
        authStore.setCurrentDepartment(null)
      }
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 切换部门
const handleDepartmentSwitch = (departmentId: string | number) => {
  const deptId = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId
  // 先查找部门名称
  const dept = memberDepartments.value.find(d => {
    const id = typeof d.id === 'string' ? parseInt(d.id, 10) : d.id
    return id === deptId
  })
  const deptName = dept?.name || '未选择部门'

  authStore.setCurrentDepartment(deptId)
  ElMessage.success(`已切换到 ${deptName}`)
}

// 初始化时获取可访问的租户列表
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await authStore.fetchAccessibleTenants()
      // 更新tenant store
      if (authStore.currentTenant) {
        tenantStore.setCurrentTenant(authStore.currentTenant)
        tenantStore.setIsGroupAdmin(isTenantOwner.value || false)
        // 只有租户所有者才检查子租户
        if (isTenantOwner.value) {
          tenantStore.checkHasChildrenWithPermission(true)
        }
      }
      // 获取成员的部门列表
      await fetchMemberDepartments()
    } catch (error) {
      console.error('获取租户列表失败:', error)
    }
  }
})

// 监听成员变化，重新获取部门列表
watch(() => authStore.currentMember, async (member) => {
  if (member) {
    await fetchMemberDepartments()
  }
}, { immediate: true })

const topPath = computed(() => {
  const p = route.path
  if (p.startsWith('/customers')) return '/customers'
  if (p.startsWith('/contacts')) return '/contacts'
  if (p.startsWith('/opportunities')) return '/opportunities'
  if (p.startsWith('/activities')) return '/activities'
  if (p.startsWith('/visits')) return '/visits'
  if (p.startsWith('/targets')) return '/targets'
  if (p.startsWith('/leads')) return '/leads'
  if (p.startsWith('/products')) return '/products'
  if (p.startsWith('/quotes')) return '/quotes'
  if (p.startsWith('/contracts')) return '/contracts'
  if (p.startsWith('/orders')) return '/orders'
  if (p.startsWith('/tenant')) return '/tenant'
  if (p.startsWith('/calendar')) return '/calendar'
  if (p.startsWith('/workflow/my-approvals')) return '/workflow/my-approvals'
  return '/dashboard'
})

type SubMenuItem = { index: string; title: string; icon?: any }

const subMenus = computed<SubMenuItem[]>(() => {
  switch (topPath.value) {
    case '/customers':
      return [
        { index: '/customers', title: '客户管理', icon: Grid },
        { index: '/customers/public', title: '公海', icon: Connection },
        { index: '/customers/tags', title: '标签管理', icon: CollectionTag },
        { index: '/customers/contacts', title: '联系人', icon: UserFilled },
        { index: '/customers/requirements', title: '需求管理', icon: Document },
      ]
    case '/contacts':
      return [
        { index: '/contacts/organization', title: '组织架构', icon: OfficeBuilding },
        { index: '/contacts/members', title: '成员管理', icon: UserFilled },
        { index: '/contacts/roles', title: '角色管理', icon: User },
      ]
    case '/targets':
      return [{ index: '/targets', title: '目标管理', icon: TrendCharts }]
    case '/products':
      return [{ index: '/products', title: '产品管理', icon: ShoppingCart }]
    case '/quotes':
      return [{ index: '/quotes', title: '报价管理', icon: DocumentCopy }]
    case '/contracts':
      return [{ index: '/contracts', title: '合同管理', icon: Files }]
    case '/orders':
      return [{ index: '/orders', title: '订单管理', icon: ShoppingBag }]
    case '/activities':
      return [{ index: '/activities', title: '活动管理', icon: Clock }]
    case '/visits':
      return [{ index: '/visits', title: '拜访管理', icon: Location }]
    case '/leads':
      return [
        { index: '/leads', title: '线索管理', icon: UserFilled },
        { index: '/leads/pool', title: '线索池', icon: Connection },
      ]
    case '/workflow/my-approvals':
      return [
        { index: '/workflow/my-approvals/pending', title: '待审批', icon: Clock },
        { index: '/workflow/my-approvals/approved', title: '已审批', icon: Document },
      ]
    // 仪表盘 / 商机 / 租户 / 日历 无二级导航，返回空数组以隐藏左侧栏
    case '/dashboard':
    case '/opportunities':
    case '/tenant':
    case '/calendar':
    default:
      return []
  }
})

const sideTitle = computed(() => {
  switch (topPath.value) {
    case '/customers':
      return '客户'
    case '/opportunities':
      return '商机'
    case '/activities':
      return '活动'
    case '/visits':
      return '拜访'
    case '/leads':
      return '线索'
    case '/contacts':
      return '通讯录'
    case '/targets':
      return '目标'
    case '/products':
      return '产品'
    case '/quotes':
      return '报价'
    case '/contracts':
      return '合同'
    case '/orders':
      return '订单'
    case '/tenant':
      return '租户'
    case '/workflow/my-approvals':
      return '我的审批'
    default:
      return '导航'
  }
})

const goto = (path: string) => router.push(path)
const logout = async () => {
  await authStore.logoutUser()
  router.push('/login')
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人信息页面
      goto('/profile')
      break
    case 'notification-settings':
      // 跳转到通知设置页面
      goto('/notifications/settings')
      break
    case 'tenant':
      // 跳转到企业信息页面
      goto('/tenant-settings')
      break
    case 'logout':
      logout()
      break
  }
}

// 切换租户的加载状态
const switchingTenant = ref(false)

// 左侧菜单收缩状态
const sidenavCollapsed = ref(false)

// 处理租户切换
const handleTenantSwitch = async (tenantId: string | number) => {
  if (tenantId === authStore.currentTenant?.id) {
    return // 已经是当前租户，不需要切换
  }

  try {
    switchingTenant.value = true
    await authStore.switchTenantUser(tenantId)

    // 更新tenant store
    if (authStore.currentTenant) {
      tenantStore.setCurrentTenant(authStore.currentTenant)
      tenantStore.setIsGroupAdmin(isTenantOwner.value || false)
    }

    // 刷新可访问租户列表
    await authStore.fetchAccessibleTenants()

    ElMessage.success('切换租户成功')

    // 如果当前在需要租户数据的页面，刷新路由以重新加载数据
    // 但不在个人信息、企业信息等设置页面刷新
    const settingsPages = ['/profile', '/tenant-settings']
    if (!settingsPages.includes(route.path)) {
      // 使用 router.go(0) 刷新当前页面，确保所有数据都重新加载
      // 这会触发 initAuth，从而使用新的 token 获取正确的租户信息
      setTimeout(() => {
        window.location.reload()
      }, 300) // 延迟一点，让用户看到成功提示
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '切换租户失败')
  } finally {
    switchingTenant.value = false
  }
}

const breadcrumbList = computed(() => {
  const matched = route.matched.filter((r) => r.meta && r.meta.title)
  return matched.map((r) => ({ name: r.meta?.title as string, path: r.path }))
})

// 页面标题与说明（从路由 meta 读取）
const pageTitle = computed(() => (route.meta?.title as string) || '管理')
const titleTip = computed(() => (route.meta?.subtitle as string) || '')
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部条 */
.topbar {
  background: #152a4e;
  color: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
}
.topbar-inner {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
}
.brand-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.brand {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.brand-logo {
  height: 28px;
  margin-right: 8px;
  border-radius: 14px;
}

.tenant-switcher {
  margin-left: 0;
}
.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.top-nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.top-item {
  color: rgba(255, 255, 255, 0.82);
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
}
.top-item:hover {
  background: rgba(255, 255, 255, 0.12);
}
.top-item.active {
  background: #0e3a8a;
  color: #fff;
}
.tenant-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  transition: background 0.2s;
}
.tenant-selector:hover {
  background: rgba(255, 255, 255, 0.12);
}
.tenant-selector-disabled {
  cursor: default;
  opacity: 0.9;
}
.tenant-selector-disabled:hover {
  background: transparent;
}
.tenant-name {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  font-size: 16px;
}
.tenant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 180px;
}
.tenant-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.tenant-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tenant-item-parent {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.tenant-selector-loading {
  opacity: 0.7;
  cursor: wait;
}
.check-icon {
  margin-left: 8px;
  color: #1677ff;
}
.el-dropdown-menu__item.is-current {
  background: #e6f4ff;
  color: #1677ff;
}
.department-switcher {
  margin-left: 8px;
}
.department-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  transition: background 0.2s;
}
.department-selector:hover {
  background: rgba(255, 255, 255, 0.12);
}
.department-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  font-size: 14px;
}
.department-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 180px;
}
.department-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.user-mini:hover {
  background: rgba(255, 255, 255, 0.12);
}
.dropdown-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.3s;
}
.user-mini:hover .dropdown-icon {
  color: rgba(255, 255, 255, 0.9);
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-meta {
  display: flex;
  flex-direction: column;
}
.user-name {
  line-height: 16px;
  font-size: 13px;
}
.user-tag {
  margin-top: 2px;
  line-height: 14px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  padding: 1px 6px;
  border-radius: 10px;
  width: fit-content;
}
.link-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
}
.link-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* 主体 */
.body {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #f5f6f8;
}

/* 左侧二级导航 */
.sidenav {
  width: 200px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding-top: 12px;
  transition: width 0.3s ease;
  position: relative;
}
.sidenav.collapsed {
  width: 64px;
}
.sidenav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 8px;
}
.sidenav-title {
  font-weight: 600;
  color: #1f2d3d;
  font-size: 14px;
}
.sidenav-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 4px;
  color: #606266;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.sidenav-toggle:hover {
  background: #f2f5f9;
  color: #1677ff;
}
.sidenav.collapsed .sidenav-header {
  padding: 8px;
  justify-content: center;
}
.sidenav-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0 8px;
}
.sidenav.collapsed .sidenav-list {
  padding: 0 4px;
}
.sidenav-item {
  margin: 6px 0;
}
.sidenav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  color: #2f3b52;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}
.sidenav.collapsed .sidenav-link {
  justify-content: center;
  padding: 10px 4px;
}
.sidenav-link:hover {
  background: #f2f5f9;
}
.sidenav-link.active {
  background: #e6f0ff;
  color: #0e3a8a;
}
.sidenav-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.sidenav.collapsed .sidenav-icon {
  font-size: 20px;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
}
.sidenav.collapsed .dot {
  display: none;
}

/* 右侧内容 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.page-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 16px;
}
.title-text {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}
.title-tip {
  color: #8a93a6;
  font-size: 13px;
  margin-left: 4px;
}
.breadcrumb {
  display: flex;
  gap: 8px;
}
.crumb {
  color: #5e6b85;
  text-decoration: none;
  font-size: 14px;
}
.crumb:hover {
  color: #1677ff;
}
.page-main {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
