import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { title: '登录', requiresAuth: false },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/Register.vue'),
      meta: { title: '注册', requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/components/common/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'targets',
          name: 'Targets',
          component: () => import('@/views/target/TargetList.vue'),
          meta: { title: '目标管理' },
        },
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: () => import('@/views/Calendar.vue'),
          meta: { title: '日历' },
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'leads',
          name: 'Leads',
          component: () => import('@/views/lead/LeadList.vue'),
          meta: { title: '线索管理' },
        },
        {
          path: 'leads/pool',
          name: 'LeadPool',
          component: () => import('@/views/lead/LeadList.vue'),
          meta: { title: '线索池' },
        },
        {
          path: 'customers',
          name: 'Customers',
          component: () => import('@/views/customer/CustomerList.vue'),
          meta: { title: '客户管理' },
        },
        {
          path: 'customers/public',
          name: 'PublicCustomers',
          component: () => import('@/views/customer/CustomerList.vue'),
          meta: { title: '公海客户' },
        },
        {
          path: 'customers/tags',
          name: 'CustomerTags',
          component: () => import('@/views/customer/CustomerTagList.vue'),
          meta: { title: '标签管理' },
        },
        {
          path: 'customers/contacts',
          name: 'CustomerContacts',
          component: () => import('@/views/customer/ContactList.vue'),
          meta: { title: '联系人管理' },
        },
        {
          path: 'customers/requirements',
          name: 'CustomerRequirements',
          component: () => import('@/views/customer/RequirementList.vue'),
          meta: { title: '需求管理' },
        },
        {
          path: 'opportunities',
          name: 'Opportunities',
          component: () => import('@/views/opportunity/OpportunityList.vue'),
          meta: { title: '商机管理' },
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/activity/ActivityList.vue'),
          meta: { title: '活动管理' },
        },
        {
          path: 'visits',
          name: 'Visits',
          component: () => import('@/views/visit/VisitList.vue'),
          meta: { title: '拜访管理' },
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('@/views/product/ProductList.vue'),
          meta: { title: '产品管理' },
        },
        {
          path: 'quotes',
          name: 'Quotes',
          component: () => import('@/views/quote/QuoteList.vue'),
          meta: { title: '报价管理' },
        },
        {
          path: 'contracts',
          name: 'Contracts',
          component: () => import('@/views/contract/ContractList.vue'),
          meta: { title: '合同管理' },
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/order/OrderList.vue'),
          meta: { title: '订单管理' },
        },
        {
          path: 'contacts/organization',
          name: 'OrganizationStructure',
          component: () => import('@/views/contacts/OrganizationStructure.vue'),
          meta: { title: '组织架构' },
        },
        {
          path: 'contacts/members',
          name: 'MemberManagement',
          component: () => import('@/views/contacts/MemberManagement.vue'),
          meta: { title: '成员管理' },
        },
        {
          path: 'contacts/roles',
          name: 'ContactRoles',
          component: () => import('@/views/contacts/RoleManagement.vue'),
          meta: { title: '角色管理' },
        },
        {
          path: 'workflow/templates',
          name: 'WorkflowTemplates',
          component: () => import('@/views/workflow/WorkflowTemplateList.vue'),
          meta: { title: '审批流管理' },
        },
        {
          path: 'workflow/my-approvals',
          component: () => import('@/views/workflow/MyApprovalIndex.vue'),
          meta: { title: '我的审批' },
          redirect: '/workflow/my-approvals/pending',
          children: [
            {
              path: 'pending',
              name: 'PendingApprovals',
              component: () => import('@/views/workflow/PendingApprovalList.vue'),
              meta: { title: '待审批' },
            },
            {
              path: 'approved',
              name: 'ApprovedList',
              component: () => import('@/views/workflow/ApprovedList.vue'),
              meta: { title: '已审批' },
            },
          ],
        },
        {
          path: 'tenant',
          name: 'TenantList',
          component: () => import('@/views/tenant/TenantList.vue'),
          meta: { title: '租户管理' },
        },
        {
          path: 'system/admins',
          name: 'SystemAdmins',
          component: () => import('@/views/system/SystemAdminList.vue'),
          meta: { title: '系统管理员管理', requiresSystemAdmin: true },
        },
        {
          path: 'notifications/settings',
          name: 'NotificationSettings',
          component: () => import('@/components/NotificationSettings.vue'),
          meta: { title: '通知设置' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/auth/Profile.vue'),
          meta: { title: '个人资料' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/auth/Settings.vue'),
          meta: { title: '系统设置' },
        },
        {
          path: 'tenant-settings',
          name: 'TenantSettings',
          component: () => import('@/views/auth/TenantSettings.vue'),
          meta: { title: '企业信息' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面不存在' },
    },
  ],
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
  const requiresAuth = to.meta.requiresAuth || to.matched.some((record) => record.meta.requiresAuth)
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

  // 检查系统管理员权限
  if (to.meta.requiresSystemAdmin && !authStore.isSystemAdmin) {
    console.log('需要系统管理员权限但当前用户不是系统管理员')
    ElMessage.warning('需要系统管理员权限')
    next('/dashboard')
    return
  }

  console.log('路由守卫 - 允许访问')
  next()
})

export default router
