<template>
  <div class="app-shell">
    <!-- 顶部：自定义一级导航 -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" @click="$router.push('/dashboard')">
          <img src="/logo.png" alt="CRM" class="brand-logo" />
          <span class="brand-name">客户管理系统</span>
        </div>
        <nav class="top-nav">
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
          <router-link :to="'/targets'" class="top-item" :class="{ active: topPath === '/targets' }"
            >目标</router-link
          >
          <router-link
            :to="'/contacts/organization'"
            class="top-item"
            :class="{ active: topPath === '/contacts' }"
            >通讯录</router-link
          >
          <router-link
            v-if="isAdmin"
            :to="'/tenant'"
            class="top-item"
            :class="{ active: topPath === '/tenant' }"
            >租户</router-link
          >
        </nav>
        <div class="top-actions">
          <div class="user-mini">
            <div class="avatar">{{ userInitial }}</div>
            <div class="user-meta">
              <div class="user-name">{{ currentUser?.username || 'User' }}</div>
              <div v-if="isTenantOwner" class="user-tag">负责人</div>
            </div>
          </div>
          <button class="link-btn" @click="goto('/settings')">设置</button>
          <button class="link-btn" @click="logout">退出</button>
        </div>
      </div>
    </header>

    <!-- 主体：左侧二级导航 + 右侧内容 -->
    <div class="body">
      <!-- 左侧：自定义二级导航（按当前一级模块） -->
      <aside class="sidenav" v-if="subMenus.length">
        <div class="sidenav-group">
          <div class="sidenav-title">{{ sideTitle }}</div>
          <ul class="sidenav-list">
            <li v-for="item in subMenus" :key="item.index" class="sidenav-item">
              <router-link
                :to="item.index"
                class="sidenav-link"
                :class="{ active: route.path === item.index }"
              >
                <span
                  class="dot"
                  :style="{ background: route.path === item.index ? '#1677ff' : '#9aa4b2' }"
                />
                <span class="text">{{ item.title }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </aside>

      <!-- 右侧：标题/工具栏/列表容器 -->
      <main class="content">
        <div class="page-header">
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
        </div>
        <div class="page-main">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)
const isTenantOwner = computed(() => authStore.isTenantOwner)
const isAdmin = computed(() => true)

const userInitial = computed(() => (currentUser.value?.username?.[0] || 'U').toUpperCase())

const topPath = computed(() => {
  const p = route.path
  if (p.startsWith('/customers')) return '/customers'
  if (p.startsWith('/contacts')) return '/contacts'
  if (p.startsWith('/opportunities')) return '/opportunities'
  if (p.startsWith('/activities')) return '/activities'
  if (p.startsWith('/targets')) return '/targets'
  if (p.startsWith('/leads')) return '/leads'
  if (p.startsWith('/tenant')) return '/tenant'
  return '/dashboard'
})

type SubMenuItem = { index: string; title: string }

const subMenus = computed<SubMenuItem[]>(() => {
  switch (topPath.value) {
    case '/customers':
      return [
        { index: '/customers', title: '客户管理' },
        { index: '/customers/tags', title: '标签管理' },
        { index: '/customers/contacts', title: '联系人' },
      ]
    case '/contacts':
      return [
        { index: '/contacts/organization', title: '组织架构' },
        { index: '/contacts/roles', title: '角色管理' },
      ]
    case '/targets':
      return [{ index: '/targets', title: '目标管理' }]
    // 仪表盘 / 线索 / 商机 / 租户 无二级导航，返回空数组以隐藏左侧栏
    case '/dashboard':
    case '/leads':
    case '/opportunities':
    case '/tenant':
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
    case '/leads':
      return '线索'
    case '/contacts':
      return '通讯录'
    case '/targets':
      return '目标'
    case '/tenant':
      return '租户'
    default:
      return '导航'
  }
})

const goto = (path: string) => router.push(path)
const logout = async () => {
  await authStore.logoutUser()
  router.push('/login')
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
  justify-content: space-between;
  padding: 0 16px;
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
.brand-name {
  font-weight: 700;
  letter-spacing: 0.5px;
}
.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
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
}
.user-mini:hover {
  background: rgba(255, 255, 255, 0.12);
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
}
.sidenav-title {
  font-weight: 600;
  color: #1f2d3d;
  padding: 8px 16px;
}
.sidenav-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0 8px;
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
}
.sidenav-link:hover {
  background: #f2f5f9;
}
.sidenav-link.active {
  background: #e6f0ff;
  color: #0e3a8a;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-block;
}

/* 右侧内容 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.page-header {
  height: 72px;
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
