<!-- b95edd0f-ac15-47c9-bace-95286f03d467 fb6f9bae-037e-4da9-aa9a-befba48475b4 -->
# 合同管理功能实现计划

## 一、后端实现

### 1. 实体设计

- **Contract 实体** (`crm_backend/src/entities/contract.entity.ts`)
- 合同编号、客户、联系人、报价单关联
- 合同类型、状态（草稿、待签署、已签署、已生效、已到期、已终止）
- 合同金额、签署日期、生效日期、到期日期
- 合同内容/条款、附件列表（JSON数组）
- 负责人、租户ID

- **ContractItem 实体** (`crm_backend/src/entities/contract-item.entity.ts`)
- 关联合同、产品
- 数量、单价、折扣、金额、备注

- **ContractTemplate 实体** (`crm_backend/src/entities/contract-template.entity.ts`)
- 模板名称、模板类型、模板内容
- 是否启用、租户ID

- **ContractApproval 实体** (`crm_backend/src/entities/contract-approval.entity.ts`)
- 关联合同、审批人、审批状态（待审批、已通过、已拒绝）
- 审批意见、审批时间、审批顺序

### 2. 服务层实现

- **ContractsService** (`crm_backend/src/modules/contracts/contracts.service.ts`)
- CRUD操作
- 从报价单创建合同（类似 `createOrderFromQuote`）
- 合同金额自动计算（基于明细项）
- 审批流程管理

- **ContractsController** (`crm_backend/src/modules/contracts/contracts.controller.ts`)
- RESTful API端点
- 从报价单创建合同的接口：`POST /contracts/from-quote/:quoteId`

- **ContractsModule** (`crm_backend/src/modules/contracts/contracts.module.ts`)
- 注册模块和依赖

### 3. 订单服务扩展

- **OrdersService** (`crm_backend/src/modules/orders/orders.service.ts`)
- 添加 `createOrderFromContract` 方法
- 修改 `CreateOrderDto` 添加 `contractId` 字段
- 修改 `Order` 实体添加 `contractId` 字段和关联

- **OrdersController** (`crm_backend/src/modules/orders/orders.controller.ts`)
- 添加 `POST /orders/from-contract/:contractId` 接口

### 4. 文件上传扩展

- **UploadController** (`crm_backend/src/modules/upload/upload.controller.ts`)
- 扩展文件类型支持：PDF、Word、Excel等合同附件格式
- 增加文件大小限制（如10MB）

### 5. 数据库迁移

- 创建迁移文件：`20251116120000-CreateContractsTables.sql`
- `contracts` 表
- `contract_items` 表
- `contract_templates` 表
- `contract_approvals` 表
- 修改 `orders` 表添加 `contract_id` 字段

## 二、前端实现

### 1. API接口

- **contract.ts** (`crm_web/src/api/contract.ts`)
- 合同CRUD接口
- 从报价单创建合同接口
- 合同模板接口
- 合同审批接口

### 2. 页面组件

- **ContractList.vue** (`crm_web/src/views/contract/ContractList.vue`)
- 合同列表、搜索、筛选
- 新增/编辑合同对话框
- 合同明细管理（类似报价单明细）
- 合同附件上传
- 从报价单创建合同按钮
- 从合同创建订单按钮
- 合同审批流程显示
- 使用统一的 `.table-page` 样式

- **ContractTemplateList.vue** (`crm_web/src/views/contract/ContractTemplateList.vue`)
- 合同模板管理页面（可选，如果模板管理需要独立页面）

### 3. 路由配置

- **router/index.ts** (`crm_web/src/router/index.ts`)
- 添加合同列表路由：`/contracts`

### 4. 菜单配置

- **Layout.vue** (`crm_web/src/components/common/Layout.vue`)
- 在顶部导航添加"合同"菜单项
- 在侧边栏添加合同管理子菜单

### 5. 报价单页面扩展

- **QuoteList.vue** (`crm_web/src/views/quote/QuoteList.vue`)
- 在操作列添加"创建合同"按钮

### 6. 订单页面扩展

- **OrderList.vue** (`crm_web/src/views/order/OrderList.vue`)
- 在操作列添加"从合同创建"按钮（如果合同存在）
- 显示关联的合同信息

## 三、关键功能点

1. **从报价单创建合同**

- 复制报价单的客户、联系人、明细项
- 生成合同编号
- 状态设为"草稿"

2. **从合同创建订单**

- 复制合同的客户、明细项
- 生成订单编号
- 关联合同ID

3. **合同审批流程**

- 支持多级审批
- 审批状态跟踪
- 审批意见记录

4. **合同模板**

- 模板内容存储（JSON或HTML格式）
- 创建合同时可选择模板
- 模板变量替换

5. **合同附件**

- 支持多文件上传
- 文件列表管理
- 文件预览/下载

## 四、实现顺序

1. 后端实体和数据库迁移
2. 后端服务层（CRUD、从报价单创建合同）
3. 订单服务扩展（从合同创建订单）
4. 文件上传扩展
5. 前端API接口
6. 前端合同列表页面
7. 合同模板和审批流程（基础实现）
8. 路由和菜单配置
9. 报价单和订单页面集成

### To-dos

- [x] 创建报价实体（Quote）和报价明细实体（QuoteItem）
- [x] 实现报价管理模块（controller、service、module）