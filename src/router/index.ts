import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { title: '登录', requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/Register.vue'),
      meta: { title: '注册', requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/components/common/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'leads',
          name: 'Leads',
          component: () => import('@/views/lead/LeadList.vue'),
          meta: { title: '线索管理' }
        },
        {
          path: 'customers',
          name: 'Customers',
          component: () => import('@/views/customer/CustomerList.vue'),
          meta: { title: '客户管理' }
        },
        {
          path: 'customers/tags',
          name: 'CustomerTags',
          component: () => import('@/views/customer/CustomerTagList.vue'),
          meta: { title: '标签管理' }
        },
        {
          path: 'customers/contacts',
          name: 'CustomerContacts',
          component: () => import('@/views/customer/ContactList.vue'),
          meta: { title: '联系人管理' }
        },
        {
          path: 'opportunities',
          name: 'Opportunities',
          component: () => import('@/views/opportunity/OpportunityList.vue'),
          meta: { title: '商机管理' }
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/activity/ActivityList.vue'),
          meta: { title: '活动管理' }
        },
        {
          path: 'contacts/organization',
          name: 'OrganizationStructure',
          component: () => import('@/views/contacts/OrganizationStructure.vue'),
          meta: { title: '组织架构' }
        },
        {
          path: 'contacts/roles',
          name: 'ContactRoles',
          component: () => import('@/views/contacts/RoleManagement.vue'),
          meta: { title: '角色管理' }
        },
        {
          path: 'tenant',
          name: 'TenantList',
          component: () => import('@/views/tenant/TenantList.vue'),
          meta: { title: '租户管理' }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/auth/Profile.vue'),
          meta: { title: '个人资料' }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/auth/Settings.vue'),
          meta: { title: '系统设置' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('路由守卫 - 目标路由:', to.path)
  console.log('路由守卫 - 来源路由:', from.path)
  console.log('路由守卫 - 当前认证状态:', authStore.isAuthenticated)
  
  // 初始化认证状态
  if (!authStore.isAuthenticated) {
    console.log('初始化认证状态')
    await authStore.initAuth()
    console.log('初始化完成，认证状态:', authStore.isAuthenticated)
  }
  
  // 检查是否需要认证（检查当前路由或其父路由的 requiresAuth）
  const requiresAuth = to.meta.requiresAuth || to.matched.some(record => record.meta.requiresAuth)
  console.log('路由守卫 - 需要认证:', requiresAuth)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('需要认证但未登录，重定向到登录页')
    next('/login')
    return
  }
  
  // 如果已登录且访问登录/注册页面，重定向到仪表盘
  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    console.log('已登录但访问登录/注册页面，重定向到仪表盘')
    next('/dashboard')
    return
  }
  
  console.log('路由守卫 - 允许访问')
  next()
})

export default router
