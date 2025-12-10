// 用户相关类型
export interface User {
  id: string
  username: string
  email?: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 租户相关类型
export interface Tenant {
  id: string
  name: string
  domain?: string
  description?: string
  logo?: string
  ownerId: string
  parentId?: string
  parentName?: string
  level?: number
  config?: Record<string, unknown>
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
}

// 成员相关类型
export interface Member {
  id: string
  userId: string
  tenantId: string
  user: User
  tenant: Tenant
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 部门相关类型
export interface Department {
  id: string
  name: string
  description?: string
  parentId?: string
  tenantId: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 成员-部门关联类型
export interface MemberDepartment {
  id: string
  memberId: string
  departmentId: string
  member: Member
  department: Department
  createdAt: string
}

// 角色相关类型
export interface Role {
  id: string
  name: string
  description?: string
  tenantId: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 成员-角色关联类型
export interface MemberRole {
  id: string
  memberId: string
  roleId: string
  member: Member
  role: Role
  createdAt: string
}

// 权限相关类型
export interface Permission {
  id: string
  name: string
  code: string
  description?: string
  resource: string
  action: string
  createdAt: string
  updatedAt: string
}

// 角色-权限关联类型
export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  role: Role
  permission: Permission
  createdAt: string
}

// 客户相关类型
export interface Customer {
  id: string
  name: string
  type: 'individual' | 'company'
  industry?: string
  size?: 'small' | 'medium' | 'large'
  source: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive'
  description?: string
  ownerId: string
  tenantId: string
  owner: Member
  tenant: Tenant
  createdAt: string
  updatedAt: string
}

// 联系人相关类型
export interface Contact {
  id: string
  name: string
  position?: string
  phone?: string
  email?: string
  customerId: string
  customer: Customer
  createdAt: string
  updatedAt: string
}

// 商机相关类型
export interface Opportunity {
  id: string
  title: string
  description?: string
  value: number
  currency: string
  stage: 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expectedCloseDate: string
  customerId: string
  ownerId: string
  tenantId: string
  customer: Customer
  owner: Member
  tenant: Tenant
  createdAt: string
  updatedAt: string
}

// 活动相关类型
export interface Activity {
  id: string
  title: string
  description?: string
  type: 'call' | 'meeting' | 'email' | 'task' | 'note'
  status: 'planned' | 'completed' | 'cancelled'
  scheduledAt: string
  completedAt?: string
  customerId?: string
  opportunityId?: string
  ownerId: string
  tenantId: string
  customer?: Customer
  opportunity?: Opportunity
  owner: Member
  tenant: Tenant
  createdAt: string
  updatedAt: string
}

// 套餐相关类型
export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  duration: number // 月数
  maxUsers: number
  features: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 租户订阅相关类型
export interface TenantSubscription {
  id: string
  tenantId: string
  planId: string
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  tenant: Tenant
  plan: SubscriptionPlan
  createdAt: string
  updatedAt: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 登录请求类型
export interface LoginRequest {
  username: string  // 可以是用户名或手机号码
  password: string
}

// 登录响应类型
export interface LoginResponse {
  token: string
  user: User
  member: Member
  tenant: Tenant
}

// 注册请求类型
export interface RegisterRequest {
  username: string
  phone: string
  email?: string
  password: string
  tenantName: string
}
