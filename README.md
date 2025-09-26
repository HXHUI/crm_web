<<<<<<< HEAD
# cmr_web
CRM前端
=======
# CRM Web 管理系统

基于 Vue 3 + TypeScript + Vite + Vue Router + Pinia + Element Plus + Axios 构建的客户关系管理系统。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集，提供类型安全
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由管理器
- **Pinia** - Vue 的状态管理库
- **Element Plus** - 基于 Vue 3 的桌面端组件库
- **Axios** - 基于 Promise 的 HTTP 库

## 项目结构

```
src/
├── api/                    # API 接口
│   ├── auth.ts            # 认证相关接口
│   └── tenant.ts          # 租户相关接口
├── components/            # 公共组件
│   └── common/
│       └── Layout.vue     # 主布局组件
├── router/                # 路由配置
│   └── index.ts
├── stores/                # Pinia 状态管理
│   └── modules/
│       ├── auth.ts        # 认证状态
│       └── tenant.ts      # 租户状态
├── types/                 # TypeScript 类型定义
│   └── index.ts
├── utils/                 # 工具函数
│   └── request.ts         # Axios 封装
├── views/                 # 页面组件
│   ├── auth/              # 认证相关页面
│   │   ├── Login.vue      # 登录页面
│   │   └── Register.vue   # 注册页面
│   ├── customer/          # 客户管理页面
│   │   ├── CustomerList.vue
│   │   └── CustomerForm.vue
│   ├── tenant/            # 租户管理页面
│   │   └── MemberList.vue
│   ├── Dashboard.vue      # 仪表盘
│   └── NotFound.vue       # 404 页面
├── App.vue
└── main.ts
```

## 核心功能

### 用户认证
- 用户登录/注册
- JWT Token 认证
- 路由守卫
- 自动登录状态恢复

### 租户管理
- 多租户架构支持
- 成员管理
- 部门管理
- 角色权限管理

### 客户管理
- 客户信息管理
- 客户分类（个人/企业）
- 客户状态跟踪
- 客户搜索和筛选

### 商机管理
- 商机创建和跟踪
- 销售阶段管理
- 商机价值统计

### 活动管理
- 活动计划和管理
- 活动类型分类
- 活动状态跟踪

## 数据库关系图

```
用户 (user)
    │
    ├── 属于多个租户 → 成员 (member) ← 属于 → 租户 (tenant)
    │           │              │                   │
    │           │              ├── 属于多个部门 → 成员-部门 (member_department) ← 属于 → 部门 (department)
    │           │              │
    │           │              └── 拥有多个角色 → 成员-角色 (member_role) ← 属于 → 角色 (role)
    │           │                                                     │
    │           │                                                     └── 拥有多个权限 → 角色-权限 (role_permission) ← 属于 → 权限 (permission)
    │           │
    │           └── 创建/拥有 → 客户 (customer) ← 拥有 → 联系人 (contact)
    │                           │
    │                           ├── 关联 → 商机 (opportunity)
    │                           │
    │                           └── 关联 → 活动 (activity)
    │
    └── 创建 → 租户 (tenant) → 订阅 → 租户订阅 (tenant_subscription) ← 基于 → 套餐 (subscription_plan)
```

## 开发指南

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run type-check
```

## 环境变量

创建 `.env.development` 和 `.env.production` 文件：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 应用标题
VITE_APP_TITLE=CRM管理系统
```

## 主要特性

### 1. 类型安全
- 完整的 TypeScript 类型定义
- 严格的类型检查
- 良好的 IDE 支持

### 2. 响应式设计
- 移动端适配
- 灵活的布局系统
- 优雅的 UI 交互

### 3. 状态管理
- 基于 Pinia 的集中式状态管理
- 模块化的状态设计
- 持久化存储支持

### 4. 路由管理
- 基于 Vue Router 的单页应用路由
- 路由守卫和权限控制
- 懒加载优化

### 5. HTTP 请求
- 基于 Axios 的 HTTP 客户端
- 请求/响应拦截器
- 错误处理和重试机制

## 待实现功能

- [ ] 商机管理页面
- [ ] 活动管理页面
- [ ] 部门管理页面
- [ ] 角色管理页面
- [ ] 个人资料页面
- [ ] 系统设置页面
- [ ] 数据可视化图表
- [ ] 文件上传功能
- [ ] 消息通知系统
- [ ] 数据导出功能

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
>>>>>>> e0f2d6e (init)
