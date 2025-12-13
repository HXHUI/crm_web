<template>
  <div class="customer-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索客户名称"
                clearable
                @keyup.enter="handleSearch"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="客户状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="潜在客户" value="lead" />
                <el-option label="合格客户" value="qualified" />
                <el-option label="提案中" value="proposal" />
                <el-option label="谈判中" value="negotiation" />
                <el-option label="成交客户" value="closed_won" />
                <el-option label="流失客户" value="closed_lost" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.source"
                placeholder="客户来源"
                clearable
                style="width: 160px"
              >
                <el-option
                  v-for="s in sourceOptions"
                  :key="s.key"
                  :label="s.label"
                  :value="s.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.industry"
                placeholder="行业"
                clearable
                style="width: 180px"
              >
                <el-option
                  v-for="i in industryOptions"
                  :key="i.key"
                  :label="i.label"
                  :value="i.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-cascader
                v-model="searchForm.region"
                :options="regionOptions"
                placeholder="所在地区"
                clearable
                style="width: 200px"
                :props="{ expandTrigger: 'hover' }"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <!-- 视图切换 -->
          <el-radio-group v-model="viewMode" size="default" style="margin-right: 12px">
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              <span style="margin-left: 4px">列表</span>
            </el-radio-button>
            <el-radio-button value="kanban">
              <el-icon><Grid /></el-icon>
              <span style="margin-left: 4px">看板</span>
            </el-radio-button>
          </el-radio-group>
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增客户 </el-button>
          <el-button-group v-if="selectedRows.length > 0" style="margin-right: 8px">
            <el-button type="warning" :icon="User" @click="handleBatchTransfer">
              转移 ({{ selectedRows.length }})
            </el-button>
            <el-button type="info" :icon="Share" @click="handleBatchRelease">
              放入公海 ({{ selectedRows.length }})
            </el-button>
          </el-button-group>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            删除 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="table-section">
        <el-table
          :data="customers"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
          :summary-method="getSummaries"
          show-summary
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="客户名称" min-width="150">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                @click="viewCustomerDetail(row)"
                class="text-left p-0 h-auto font-normal"
              >
                {{ row.name }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'company' ? 'primary' : 'success'">
                {{ row.type === 'company' ? '企业' : '个人' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="industry" label="行业" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                {{ getIndustryLabel(row.industry) || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="规模" width="100">
            <template #default="{ row }">
              <span v-if="row.size">{{ getSizeName(row.size) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="来源" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.source">{{ getSourceLabel(row.source) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="所在地区" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="getRegionDisplay(row)" class="region-display">
                <el-icon class="region-icon"><Location /></el-icon>
                <span>{{ getRegionDisplay(row) }}</span>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.level" :type="getLevelType(row.level)" size="small">
                {{ row.level }}级
              </el-tag>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="estimatedValue" label="预计价值" width="150" align="right">
            <template #default="{ row }">
              <span v-if="row.estimatedValue">{{ formatCurrency(row.estimatedValue) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.tags && row.tags.length > 0" style="display: flex; flex-wrap: wrap; gap: 4px">
                <el-tag
                  v-for="tagId in row.tags"
                  :key="tagId"
                  size="small"
                  :color="getTagColor(tagId)"
                  effect="dark"
                >
                  {{ getTagName(tagId) }}
              </el-tag>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.description">{{ row.description }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="120">
            <template #default="{ row }">
              {{ getUserName(row?.owner) }}
            </template>
          </el-table-column>
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="warning" size="small" :icon="Edit" @click="editCustomer(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteCustomer(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div v-if="viewMode === 'list'" class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 看板视图 -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-section" v-loading="loading">
        <div class="kanban-board">
          <div
            v-for="status in statusColumns"
            :key="status.value"
            class="kanban-column"
            :ref="(el) => setColumnRef(el, status.value)"
          >
            <div class="kanban-column-header">
              <span class="status-name">{{ status.label }}</span>
              <el-tag :type="getStatusType(status.value)" size="small">
                {{ getCustomersByStatus(status.value).length }}
              </el-tag>
            </div>
            <div
              class="kanban-column-body"
              :data-status="status.value"
            >
              <div
                v-for="customer in getCustomersByStatus(status.value)"
                :key="customer.id"
                class="kanban-card"
                :data-id="customer.id"
                @click="viewCustomerDetail(customer)"
              >
                <div class="kanban-card-header">
                  <span class="card-title" :title="customer.name">{{ customer.name }}</span>
                </div>
                <div class="kanban-card-body">
                  <div class="card-item">
                    <span class="card-label">类型：</span>
                    <el-tag :type="customer.type === 'company' ? 'primary' : 'success'" size="small">
                      {{ customer.type === 'company' ? '企业' : '个人' }}
                    </el-tag>
                  </div>
                  <div class="card-item" v-if="customer.estimatedValue">
                    <span class="card-label">预计价值：</span>
                    <span class="card-value">{{ formatCurrency(customer.estimatedValue) }}</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">负责人：</span>
                    <span class="card-value">{{ getUserName(customer?.owner) }}</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">创建时间：</span>
                    <span class="card-value">{{ formatDateOnly(customer.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="客户名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入客户名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="客户编码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入客户编码（可选）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="客户类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择客户类型" style="width: 100%">
            <el-option label="个人" value="individual" />
            <el-option label="企业" value="company" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择客户状态" style="width: 100%">
            <el-option label="潜在客户" value="lead" />
            <el-option label="合格客户" value="qualified" />
            <el-option label="提案中" value="proposal" />
            <el-option label="谈判中" value="negotiation" />
            <el-option label="成交客户" value="closed_won" />
            <el-option label="流失客户" value="closed_lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在地区">
          <el-cascader
            v-model="customerRegion"
            :options="regionOptions"
            style="width: 100%"
            placeholder="省/市/区"
          />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="formData.addressDetail" placeholder="街道、楼层等" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            v-model="formData.ownerId"
            style="width: 100%"
            placeholder="请选择负责人（不选择则为公海客户）"
            filterable
            clearable
            :loading="ownerLoading"
          >
            <el-option
              v-for="user in ownerOptions"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
          <div class="text-sm text-gray-500 mt-1">
            选择负责人：客户为私海；不选择负责人：客户为公海
          </div>
        </el-form-item>
        <el-form-item label="公司名称" prop="companyName" v-if="formData.type === 'company'">
          <el-input
            v-model="formData.companyName"
            placeholder="请输入公司名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="行业" prop="industry">
          <el-select v-model="formData.industry" placeholder="请选择行业" style="width: 100%">
            <el-option v-for="i in industryOptions" :key="i.key" :label="i.label" :value="i.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户规模" prop="size">
          <el-select v-model="formData.size" placeholder="请选择客户规模" style="width: 100%">
            <el-option label="小型" value="small" />
            <el-option label="中型" value="medium" />
            <el-option label="大型" value="large" />
            <el-option label="超大型" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户来源" prop="source">
          <el-select v-model="formData.source" placeholder="请选择客户来源" style="width: 100%">
            <el-option v-for="s in sourceOptions" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户等级" prop="level">
          <el-select v-model="formData.level" placeholder="请选择客户等级" style="width: 100%">
            <el-option label="A级" value="A" />
            <el-option label="B级" value="B" />
            <el-option label="C级" value="C" />
            <el-option label="D级" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计价值" prop="estimatedValue">
          <el-input-number
            v-model="formData.estimatedValue"
            placeholder="请输入预计价值"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="客户描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入客户描述"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            placeholder="请选择标签（可多选）"
            style="width: 100%"
            :loading="tagLoading"
            @visible-change="(visible: boolean) => { if (visible && tagOptions.length === 0) loadTagOptions() }"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <span
                  v-if="tag.color"
                  :style="{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: tag.color,
                  }"
                ></span>
                <span>{{ tag.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 客户详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="70%"
      :with-header="false"
      class="detail-drawer"
      :before-close="handleDrawerClose"
    >
      <div v-if="selectedCustomer" class="detail-layout">
        <!-- 左侧导航按钮 -->
        <div class="left-nav" :class="{ collapsed: menuCollapsed }">
          <!-- 收缩/展开按钮 -->
          <div class="menu-toggle" @click="menuCollapsed = !menuCollapsed">
            <el-icon>
              <Fold v-if="!menuCollapsed" />
              <Expand v-else />
            </el-icon>
          </div>
          <ul class="side-menu with-timeline">
            <!-- 顺序：基本信息、工商信息、联系人、合作与信用、客户需求、拜访记录、商机、销售报价、销售合同、销售订单、财务对账、活动记录、客户图谱 -->
            <li
              class="side-item"
              :class="{ active: activeTab === 'basic' }"
              @click="handleNavClick('basic')"
            >
              <span class="item-btn" :title="menuCollapsed ? '基本信息' : ''">
                <el-icon class="item-icon"><User /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">基本信息</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'business' }"
              @click="handleNavClick('business')"
            >
              <span class="item-btn" :title="menuCollapsed ? '工商信息' : ''">
                <el-icon class="item-icon"><OfficeBuilding /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">工商信息</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'contacts' }"
              @click="handleNavClick('contacts')"
            >
              <span class="item-btn" :title="menuCollapsed ? '联系人' : ''">
                <el-icon class="item-icon"><UserFilled /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">联系人</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'cooperation' }"
              @click="handleNavClick('cooperation')"
            >
              <span class="item-btn" :title="menuCollapsed ? '合作与信用' : ''">
                <el-icon class="item-icon"><Wallet /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">合作与信用</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'requirements' }"
              @click="handleNavClick('requirements')"
            >
              <span class="item-btn" :title="menuCollapsed ? '客户需求' : ''">
                <el-icon class="item-icon"><Document /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">客户需求</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'visits' }"
              @click="handleNavClick('visits')"
            >
              <span class="item-btn" :title="menuCollapsed ? '拜访记录' : ''">
                <el-icon class="item-icon"><Location /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">拜访记录</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'opportunities' }"
              @click="handleNavClick('opportunities')"
            >
              <span class="item-btn" :title="menuCollapsed ? '商机' : ''">
                <el-icon class="item-icon"><TrendCharts /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">商机</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'quotes' }"
              @click="handleNavClick('quotes')"
            >
              <span class="item-btn" :title="menuCollapsed ? '销售报价' : ''">
                <el-icon class="item-icon"><DocumentCopy /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">销售报价</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'contracts' }"
              @click="handleNavClick('contracts')"
            >
              <span class="item-btn" :title="menuCollapsed ? '销售合同' : ''">
                <el-icon class="item-icon"><Files /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">销售合同</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'orders' }"
              @click="handleNavClick('orders')"
            >
              <span class="item-btn" :title="menuCollapsed ? '销售订单' : ''">
                <el-icon class="item-icon"><ShoppingCart /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">销售订单</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'statements' }"
              @click="handleNavClick('statements')"
            >
              <span class="item-btn" :title="menuCollapsed ? '财务对账' : ''">
                <el-icon class="item-icon"><Wallet /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">财务对账</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'activities' }"
              @click="handleNavClick('activities')"
            >
              <span class="item-btn" :title="menuCollapsed ? '活动记录' : ''">
                <el-icon class="item-icon"><Clock /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">活动记录</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'graph' }"
              @click="handleNavClick('graph')"
            >
              <span class="item-btn" :title="menuCollapsed ? '客户图谱' : ''">
                <el-icon class="item-icon"><Share /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">客户图谱</span>
              </span>
            </li>

          </ul>
        </div>

        <!-- 右侧内容区域 -->
        <div class="right-content">
           <!-- 可滚动内容区域（包含基本信息和各业务模块） -->
           <div class="dynamic-content-section detail-scroll-container" ref="detailContentRef">
            <!-- 统一加载骨架屏 -->
            <div v-if="loadingAllDetails" class="detail-loading-skeleton">
              <el-skeleton :rows="8" animated />
              <el-skeleton :rows="6" animated style="margin-top: 24px" />
              <el-skeleton :rows="6" animated style="margin-top: 24px" />
            </div>
            <!-- 实际内容 -->
            <template v-else>
            <!-- 基本信息 -->
              <el-card id="customer-section-basic" shadow="never" class="section-card basic-info-section detail-section">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">基本信息</h3>
                    <div class="action-buttons">
                      <el-button type="default" :icon="Message">发送邮件</el-button>
                      <el-button type="default" :icon="ChatDotRound">发送短信</el-button>
                    </div>
                  </div>
                </template>
                <div class="detail-header">
                  <div class="detail-title">
                <h2>{{ selectedCustomer.name }}</h2>
                <el-icon class="star-icon"><Star /></el-icon>
              </div>
                  <div class="detail-meta">
                <div class="meta-item">
                  <span class="meta-label">客户来源:</span>
                  <span class="meta-value">{{
                    selectedCustomer.source ? getSourceLabel(selectedCustomer.source) : '-'
                  }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">客户类型:</span>
                  <span class="meta-value">{{
                    selectedCustomer.type === 'individual' ? '个人' : '企业'
                  }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">负责人:</span>
                  <span class="meta-value">{{ getUserName(selectedCustomer.owner) || '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">创建时间:</span>
                  <span class="meta-value">{{ formatDate(selectedCustomer.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>行业：</label>
                <span>{{
                  selectedCustomer.industry ? getIndustryLabel(selectedCustomer.industry) : '-'
                }}</span>
              </div>
              <div class="info-item">
                <label>客户池类型：</label>
                <span>
                  <el-tag
                    :type="selectedCustomer.ownerId ? 'success' : 'info'"
                    size="small"
                  >
                    {{ selectedCustomer.ownerId ? '私海' : '公海' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <label>客户规模：</label>
                <span>{{ selectedCustomer.size ? getSizeName(selectedCustomer.size) : '-' }}</span>
              </div>
              <div class="info-item">
                <label>所在地区：</label>
                <span>{{
                  [selectedCustomer.province, selectedCustomer.city, selectedCustomer.district]
                    .filter(Boolean)
                    .join(' / ') || '-'
                }}</span>
              </div>
              <div class="info-item">
                <label>详细地址：</label>
                <span>{{ selectedCustomer.addressDetail || '-' }}</span>
              </div>
              <div class="info-item">
                <label>客户来源：</label>
                <span>{{
                  selectedCustomer.source ? getSourceLabel(selectedCustomer.source) : '-'
                }}</span>
              </div>
              <div class="info-item">
                <label>客户等级：</label>
                <span>
                  <el-tag
                    v-if="selectedCustomer.level"
                    :type="getLevelType(selectedCustomer.level)"
                    size="small"
                  >
                    {{ selectedCustomer.level }}级
                  </el-tag>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-item">
                <label>预计价值：</label>
                <span class="estimated-value">{{
                  selectedCustomer.estimatedValue
                    ? formatCurrency(selectedCustomer.estimatedValue)
                    : '-'
                }}</span>
              </div>
              <div class="info-item full-width" v-if="selectedCustomer.description">
                <label>客户描述：</label>
                <div class="description">{{ selectedCustomer.description }}</div>
              </div>
            </div>
              </el-card>

              <!-- 工商信息内容 -->
              <el-card shadow="never" id="customer-section-business" class="tab-content detail-section section-card">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">工商信息</h3>
                    <div class="header-actions" style="display: flex; align-items: center; gap: 12px">
                      <span v-if="businessInfo?.lastSyncTime" class="last-sync-time" style="font-size: 12px; color: #909399">
                        最后更新：{{ formatDate(businessInfo.lastSyncTime) }}
                      </span>
                      <el-button
                        type="primary"
                        :icon="Refresh"
                        size="small"
                        :loading="businessInfoRefreshing"
                        @click="refreshBusinessInfo"
                      >
                        刷新
                      </el-button>
                    </div>
                  </div>
                </template>
               <div v-if="!selectedCustomer?.companyName" class="empty-state">
                <el-empty description="该客户没有公司名称，无法查询工商信息" />
              </div>
              <div v-else class="business-info-wrapper">
                <!-- 公司名称 -->
                <div class="business-header" style="margin-bottom: 20px">
                  <h2 class="company-name" style="margin: 0; font-size: 24px; font-weight: 600; color: #262626">
                    {{ businessInfo?.companyName || selectedCustomer?.companyName || '未知公司' }}
                  </h2>
          </div>

                <!-- 公司基本信息 -->
                <div v-if="businessInfo" class="company-basic-info">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">法定代表人：</label>
                      <span class="info-value">{{ businessInfo.legalRepresentative || '-' }}</span>
                </div>
                    <div class="info-item">
                      <label class="info-label">统一社会信用代码：</label>
                      <span class="info-value">{{ businessInfo.unifiedSocialCreditCode || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label class="info-label">注册资本：</label>
                      <span class="info-value">
                        {{ businessInfo.registeredCapital ? formatCurrency(businessInfo.registeredCapital, false) + '万元' : '-' }}
                      </span>
                    </div>
                    <div class="info-item">
                      <label class="info-label">注册地址：</label>
                      <span class="info-value">{{ businessInfo.registeredAddress || '-' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Tab导航栏 -->
                <div class="business-tabs-wrapper" style="padding: 0 16px; margin-bottom: 16px">
                  <el-tabs v-model="businessSubTab" type="border-card">
                      <el-tab-pane label="工商信息" name="info">
                        <!-- 过期提示 -->
                        <el-alert
                          v-if="businessInfoExpired && businessInfo"
                          type="warning"
                          :closable="false"
                          show-icon
                          style="margin: 16px 0"
                        >
                          <template #default>
                            <span>数据已过期，点击刷新获取最新信息</span>
                          </template>
                        </el-alert>

                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>

                        <!-- 工商信息主表 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="统一社会信用代码">
                      {{ businessInfo.unifiedSocialCreditCode || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="企业名称">
                      {{ businessInfo.companyName || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="法定代表人">
                      {{ businessInfo.legalRepresentative || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="经营状态">
                      <el-tag :type="businessInfo.operatingStatus === '存续' ? 'success' : 'info'" size="small">
                        {{ businessInfo.operatingStatus || '-' }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="注册资本">
                      {{ businessInfo.registeredCapital ? formatCurrency(businessInfo.registeredCapital, false) + '万元' : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="实缴资本">
                      {{ businessInfo.paidInCapital ? formatCurrency(businessInfo.paidInCapital, false) + '万元' : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="工商注册号">
                      {{ businessInfo.businessRegistrationNumber || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="组织机构代码">
                      {{ businessInfo.organizationCode || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="成立日期">
                      {{ businessInfo.establishmentDate ? formatDateOnly(businessInfo.establishmentDate) : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="企业类型">
                      {{ businessInfo.companyType || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="营业期限">
                      {{ businessInfo.businessTerm || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="登记机关">
                      {{ businessInfo.registrationAuthority || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="核准日期">
                      {{ businessInfo.approvalDate ? formatDateOnly(businessInfo.approvalDate) : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="注册地址" :span="2">
                      {{ businessInfo.registeredAddress || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="经营范围" :span="2">
                      {{ businessInfo.businessScope || '-' }}
                    </el-descriptions-item>
                    </el-descriptions>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息">
                            <template #description>
                              <div>
                                <p>暂无工商信息</p>
                                <p style="font-size: 12px; color: #909399; margin-top: 8px">
                                  请点击右上角的"刷新"按钮从天眼查获取工商信息
                                </p>
                              </div>
                            </template>
                            <el-button type="primary" @click="refreshBusinessInfo" :loading="businessInfoRefreshing">
                              立即刷新
                            </el-button>
                          </el-empty>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="主要人员" name="personnel">
                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>
                        <!-- 主要人员 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-table :data="businessInfo.personnel || []" border style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="name" label="姓名" min-width="150" />
                    <el-table-column prop="position" label="职务" min-width="200" />
                  </el-table>
                          <div v-if="!businessInfo.personnel || businessInfo.personnel.length === 0" class="empty-state">
                            <el-empty description="暂无主要人员信息" />
                          </div>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="股东信息" name="shareholders">
                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>
                        <!-- 股东信息 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-table :data="businessInfo.shareholders || []" border style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="shareholderName" label="股东名称" min-width="200" />
                    <el-table-column prop="shareholdingRatio" label="持股比例" width="120" align="right">
                      <template #default="{ row }">
                        {{ row.shareholdingRatio != null ? Number(row.shareholdingRatio).toFixed(2) + '%' : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="shareholderType" label="股东类型" width="150" />
                    <el-table-column prop="investmentAmount" label="投资金额(万元)" width="150" align="right">
                      <template #default="{ row }">
                        {{ row.investmentAmount ? formatCurrency(row.investmentAmount, false) : '-' }}
                      </template>
                    </el-table-column>
                  </el-table>
                          <div v-if="!businessInfo.shareholders || businessInfo.shareholders.length === 0" class="empty-state">
                            <el-empty description="暂无股东信息" />
                          </div>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="分支机构" name="branches">
                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>
                        <!-- 分支机构 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-table :data="businessInfo.branches || []" border style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="companyName" label="公司名称" min-width="250" />
                    <el-table-column prop="personInCharge" label="负责人" width="120" />
                    <el-table-column prop="establishmentDate" label="成立时间" width="120">
                      <template #default="{ row }">
                        {{ row.establishmentDate ? formatDateOnly(row.establishmentDate) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="operatingStatus" label="经营状态" width="120">
                      <template #default="{ row }">
                        <el-tag :type="row.operatingStatus === '存续' ? 'success' : 'info'" size="small">
                          {{ row.operatingStatus || '-' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                          <div v-if="!businessInfo.branches || businessInfo.branches.length === 0" class="empty-state">
                            <el-empty description="暂无分支机构信息" />
                          </div>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="对外投资" name="investments">
                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>
                        <!-- 对外投资 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-table :data="businessInfo.investments || []" border style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="investedCompany" label="被投资企业" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="regStatus" label="企业状态" width="100" />
                    <el-table-column prop="legalPersonName" label="法人" width="120" />
                    <el-table-column prop="orgType" label="公司类型" width="180" show-overflow-tooltip />
                    <el-table-column prop="establishmentDate" label="开业时间" width="120" align="center">
                      <template #default="{ row }">
                        {{ row.establishmentDate ? formatDateOnly(row.establishmentDate) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="category" label="行业" width="150" show-overflow-tooltip />
                    <el-table-column prop="regCapital" label="注册资金" width="150" />
                    <el-table-column prop="subscriptionDate" label="认缴出资时间" width="120" align="center">
                      <template #default="{ row }">
                        {{ row.subscriptionDate ? formatDateOnly(row.subscriptionDate) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="shareholderType" label="股东类型" width="100" />
                    <el-table-column prop="shareholdingRatio" label="持股比例" width="100" align="right">
                      <template #default="{ row }">
                        {{ row.shareholdingRatio != null ? Number(row.shareholdingRatio).toFixed(2) + '%' : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="investmentAmount" label="投资金额(万元)" width="150" align="right">
                      <template #default="{ row }">
                        {{ row.investmentAmount ? formatCurrency(row.investmentAmount / 10000, false) + '万元' : '-' }}
                      </template>
                    </el-table-column>
                  </el-table>
                          <div v-if="!businessInfo.investments || businessInfo.investments.length === 0" class="empty-state">
                            <el-empty description="暂无对外投资信息" />
                          </div>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="变更记录" name="changes">
                        <!-- 加载状态 -->
                        <div v-if="businessInfoLoading" class="empty-state">
                          <el-skeleton :rows="5" animated />
                        </div>
                        <!-- 变更记录 -->
                        <div v-else-if="businessInfo" class="business-info-content">
                  <el-table :data="businessInfo.changeRecords || []" border style="width: 100%">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="changeDate" label="变更日期" width="120">
                      <template #default="{ row }">
                        {{ formatDateOnly(row.changeDate) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="changeItem" label="变更事项" min-width="150" />
                    <el-table-column prop="beforeChange" label="变更前" min-width="200" show-overflow-tooltip>
                      <template #default="{ row }">
                        {{ formatDatesInText(row.beforeChange) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="afterChange" label="变更后" min-width="200" show-overflow-tooltip>
                      <template #default="{ row }">
                        {{ formatDatesInText(row.afterChange) }}
                      </template>
                    </el-table-column>
                  </el-table>
                          <div v-if="!businessInfo.changeRecords || businessInfo.changeRecords.length === 0" class="empty-state">
                            <el-empty description="暂无变更记录" />
                          </div>
                        </div>
                        <div v-else class="empty-state">
                          <el-empty description="暂无工商信息" />
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                </div>
              </div>
              </el-card>

             <!-- 联系人内容（支持树形表和联系人图谱切换） -->
              <el-card shadow="never" id="customer-section-contacts" class=" tab-content detail-section section-card">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">联系人</h3>
                    <div style="display: flex; align-items: center; gap: 12px">
                      <el-radio-group v-model="contactViewMode" size="small">
                        <el-radio-button value="list">
                          <el-icon style="margin-right: 4px"><List /></el-icon>
                          列表
                        </el-radio-button>
                        <el-radio-button value="graph">
                          <el-icon style="margin-right: 4px"><Share /></el-icon>
                          联系人图谱
                        </el-radio-button>
                      </el-radio-group>
                      <el-button type="primary" size="small" @click="openCreateContact">
                        <el-icon style="margin-right: 4px"><Plus /></el-icon>
                        新增联系人
                      </el-button>
                    </div>
                  </div>
                </template>
                <div class="list-padding">

                <!-- 列表视图 -->
                <div v-if="contactViewMode === 'list'">
                  <el-table :data="contactListData" border style="width: 100%">
                    <el-table-column prop="name" label="姓名" min-width="150">
                      <template #default="{ row }">
                        <span :style="{ paddingLeft: row.level * 20 + 'px' }">
                          {{ row.name }}
                          <el-tag
                            v-if="row.isPrimary"
                            type="success"
                            size="small"
                            style="margin-left: 6px"
                            >主要</el-tag
                          >
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="类型" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getContactTypeColor(row.type)" size="small">
                          {{ getContactTypeName(row.type) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="position" label="职位" width="150" show-overflow-tooltip />
                    <el-table-column prop="department" label="部门" width="150" show-overflow-tooltip />
                    <el-table-column prop="phone" label="电话" width="150" />
                    <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="wechat" label="微信" width="120" show-overflow-tooltip />
                    <el-table-column label="操作" width="160" fixed="right">
                      <template #default="{ row }">
                        <el-button size="small" type="primary" @click="openEditContact(row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteContact(row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 联系人图谱视图（vue3-tree-org） -->
                <div v-else class="contact-mindmap-view">
                  <Vue3TreeOrg
                    v-if="contactOrgTree"
                    :data="contactOrgTree"
                    :horizontal="true"
                    :collapsable="true"
                    :scalable="true"
                    :draggable="true"
                    :node-draggable="false"
                    :clone-node-drag="false"
                    :label-style="{ whiteSpace: 'nowrap', fontSize: '13px' }"
                    :label-class-name="contactOrgLabelClass"
                    :tool-bar="{ expand: true, scale: true, zoom: true, restore: true, fullscreen: false }"
                  />
                </div>
                </div>
              </el-card>

                <!-- 合作与信用内容 -->
              <el-card shadow="never" id="customer-section-cooperation" class="tab-content detail-section  section-card" >
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">合作与信用</h3>
                    <div v-if="!cooperationLoading">
                      <el-button
                        v-if="!cooperationEditMode"
                        type="primary"
                        size="small"
                        @click="cooperationEditMode = true"
                      >
                        <el-icon style="margin-right: 4px"><Edit /></el-icon>
                        编辑
                      </el-button>
                      <template v-else>
                        <el-button size="small" @click="cancelCooperationEdit">取消</el-button>
                        <el-button
                          type="primary"
                          size="small"
                          @click="saveCooperationProfile"
                          :loading="cooperationSaving"
                        >
                          保存
                        </el-button>
                      </template>
                    </div>
                </div>
                </template>
              <div class="list-padding">
                <div v-if="cooperationLoading" style="text-align: center; padding: 40px 0">
                  <el-icon class="is-loading" style="font-size: 24px"><Loading /></el-icon>
              </div>

                <div v-else class="cooperation-content">
                  <!-- 合作习惯区域 -->
                  <div class="cooperation-section">
                    <h4 class="section-title" style="margin-bottom: 12px">合作习惯</h4>
                    <div class="info-grid">
                      <div class="info-item" :class="{ 'full-width': cooperationEditMode }">
                        <label>开票要求：</label>
                        <span v-if="!cooperationEditMode">
                          {{ getInvoiceRequirementLabel(customerProfile?.invoiceRequirement) || '-' }}
                        </span>
                        <div v-else style="display: flex; flex-direction: column; gap: 8px; width: 100%">
                          <el-select
                            v-model="cooperationForm.invoiceRequirement"
                            placeholder="请选择开票要求"
                            style="width: 100%"
                          >
                            <el-option label="专票" value="special_vat" />
                            <el-option label="普票" value="normal_invoice" />
                            <el-option label="不开票" value="no_invoice" />
                          </el-select>
                <el-input
                            v-model="cooperationForm.invoiceRemark"
                            placeholder="开票说明（可选）"
                            maxlength="500"
                            show-word-limit
                            type="textarea"
                            :rows="2"
                          />
                        </div>
                      </div>
                      <div class="info-item">
                        <label>货运方式：</label>
                        <span v-if="!cooperationEditMode">
                          <el-tag
                            v-for="method in customerProfile?.shippingMethods"
                            :key="method"
                            size="small"
                            style="margin-right: 6px"
                          >
                            {{ getShippingMethodLabel(method) }}
                          </el-tag>
                          <span v-if="!customerProfile?.shippingMethods || customerProfile.shippingMethods.length === 0">-</span>
                        </span>
                <el-select
                          v-else
                          v-model="cooperationForm.shippingMethods"
                          multiple
                          placeholder="请选择货运方式"
                          style="width: 100%"
                        >
                          <el-option label="专车" value="dedicated_truck" />
                          <el-option label="物流" value="logistics" />
                          <el-option label="自提" value="self_pickup" />
                          <el-option label="快递" value="courier" />
                </el-select>
                      </div>
                      <div class="info-item">
                        <label>主要采购品类：</label>
                        <span v-if="!cooperationEditMode">
                          <el-tag
                            v-for="categoryId in customerProfile?.mainCategoryIds"
                            :key="categoryId"
                            size="small"
                            style="margin-right: 6px"
                          >
                            {{ getCategoryLabel(categoryId) }}
                          </el-tag>
                          <span v-if="!customerProfile?.mainCategoryIds || customerProfile.mainCategoryIds.length === 0">-</span>
                        </span>
                <el-select
                          v-else
                          v-model="cooperationForm.mainCategoryIds"
                          multiple
                  filterable
                          placeholder="请选择主要采购品类"
                          style="width: 100%"
                          :loading="categoryOptionsLoading"
                        >
                  <el-option
                            v-for="category in categoryOptions"
                            :key="category.id"
                            :label="category.label"
                            :value="category.id"
                  />
                </el-select>
              </div>
                      <div class="info-item">
                        <label>意向竞品：</label>
                        <span v-if="!cooperationEditMode">
                          <el-tag
                            v-for="brand in customerProfile?.competitorBrands"
                            :key="brand"
                            size="small"
                            style="margin-right: 6px"
                          >
                            {{ brand }}
                          </el-tag>
                          <span v-if="!customerProfile?.competitorBrands || customerProfile.competitorBrands.length === 0">-</span>
                        </span>
                        <el-select
                          v-else
                          v-model="cooperationForm.competitorBrands"
                          multiple
                          filterable
                          allow-create
                          default-first-option
                          placeholder="请输入或选择竞品品牌"
                          style="width: 100%"
                        />
                        </div>
                      </div>
                  </div>

                  <!-- 信用评定区域 -->
                  <div class="cooperation-section">
                    <h4 class="section-title">
                      信用评定
                      <el-button
                        type="text"
                          size="small"
                        style="margin-left: 12px"
                        @click="showCreditHistoryDialog = true"
                      >
                        查看历史
                      </el-button>
                    </h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <label>信用额度：</label>
                        <span v-if="!cooperationEditMode">
                          {{ customerProfile?.creditLimit ? formatCurrency(customerProfile.creditLimit, false) : '-' }}
                        </span>
                        <div v-else style="display: flex; gap: 12px; align-items: center">
                          <el-input-number
                            v-model="cooperationForm.creditLimit"
                            :min="0"
                            :precision="2"
                            placeholder="请输入信用额度"
                            style="width: 200px"
                          />
                          <span style="color: #909399">元</span>
                      </div>
                      </div>
                      <div class="info-item">
                        <label>额度档位：</label>
                        <span v-if="!cooperationEditMode">
                          {{ getCreditTierLabel(customerProfile?.creditTier) || '-' }}
                        </span>
                        <el-select
                          v-else
                          v-model="cooperationForm.creditTier"
                          placeholder="请选择额度档位"
                          style="width: 100%"
                        >
                          <el-option label="15万" value="tier_150k" />
                          <el-option label="10万" value="tier_100k" />
                          <el-option label="5万" value="tier_50k" />
                          <el-option label="无" value="none" />
                        </el-select>
                      </div>
                      <div class="info-item">
                        <label>客户等级：</label>
                        <span v-if="!cooperationEditMode">
                          <el-tag
                            v-if="selectedCustomer.level"
                            :type="getLevelType(selectedCustomer.level)"
                            size="small"
                          >
                            {{ selectedCustomer.level }}级
                          </el-tag>
                          <span v-else>-</span>
                        </span>
                        <el-select
                          v-else
                          v-model="cooperationForm.level"
                          placeholder="请选择客户等级"
                          style="width: 100%"
                        >
                          <el-option label="A级" value="A" />
                          <el-option label="B级" value="B" />
                          <el-option label="C级" value="C" />
                          <el-option label="D级" value="D" />
                        </el-select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </el-card>

              <!-- 需求内容 -->
              <el-card shadow="never" id="customer-section-requirements" class="tab-content detail-section section-card">
                  <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <h3 class="section-title" style="margin: 0">客户需求</h3>
                      <el-button type="primary" size="small" @click="openCreateRequirement"
                        >新增需求</el-button
                  >
                </div>
                  </template>
                <div class="list-padding">
                <el-table :data="customerRequirements" border style="width: 100%">
                  <el-table-column label="需求类型" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getRequirementTypeTagType(row.type)" size="small">
                        {{ getRequirementTypeLabel(row.type) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="content" label="需求内容" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="problemToSolve" label="要解决的问题" min-width="200" show-overflow-tooltip />
                  <el-table-column label="优先级" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getRequirementPriorityTagType(row.priority)" size="small">
                        {{ getRequirementPriorityLabel(row.priority) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getRequirementStatusTagType(row.status)" size="small">
                        {{ getRequirementStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ formatDate(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" @click="openEditRequirement(row)"
                        >编辑</el-button
                      >
                      <el-button size="small" type="danger" @click="deleteRequirement(row)"
                        >删除</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              </el-card>
            <!-- 拜访记录内容 -->
              <el-card shadow="never" id="customer-section-visits" class="tab-content detail-section section-card">
                <template #header>
                  <h3 class="section-title" style="margin: 0">拜访记录</h3>
                </template>
              <div class="list-padding">
                <ContactVisitList
                  v-if="selectedCustomer?.id"
                  related-to-type="customer"
                  :related-to-id="String(selectedCustomer.id)"
                />
              </div>
              </el-card>

            <!-- 商机内容（列表显示） -->
              <el-card shadow="never" id="customer-section-opportunities" class="tab-content detail-section section-card">
                  <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <h3 class="section-title" style="margin: 0">商机</h3>
                  <el-button type="primary" size="small" @click="openCreateOpportunity"
                    >新增商机</el-button
                  >
                </div>
                  </template>
                <div class="list-padding">
                <el-table
                  :data="customerOpportunities"
                  border
                  style="width: 100%"
                  :summary-method="getOpportunitySummaries"
                  show-summary
                >
                  <el-table-column prop="title" label="商机名称" min-width="180" />
                  <el-table-column prop="stage" label="阶段" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getStageType(row.stage)" size="small">{{
                        getStageName(row.stage)
                      }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="value" label="金额" width="120" align="right">
                    <template #default="{ row }">{{ formatCurrency(row.value) }}</template>
                  </el-table-column>
                  <el-table-column prop="probability" label="概率" width="100" align="center">
                    <template #default="{ row }">{{ row.probability }}%</template>
                  </el-table-column>
                  <el-table-column prop="expectedCloseDate" label="预计成交日期" width="160">
                    <template #default="{ row }">{{ formatDateOnly(row.expectedCloseDate) }}</template>
                  </el-table-column>
                  <el-table-column label="负责人" width="120">
                    <template #default="{ row }">{{ getUserName(row.owner) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" @click="openEditOpportunity(row)"
                        >编辑</el-button
                      >
                      <el-button size="small" type="danger" @click="deleteOpportunity(row)"
                        >删除</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </div>
                </el-card>

            <!-- 报价内容 -->
              <el-card shadow="never" id="customer-section-quotes" class="tab-content detail-section section-card">
                  <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <h3 class="section-title" style="margin: 0">销售报价</h3>
                      <el-button type="primary" size="small" @click="openCreateQuote">新增报价</el-button>
                    </div>
                  </template>
                <div class="list-padding">
                <el-table :data="customerQuotes" border style="width: 100%">
                  <el-table-column prop="quoteNumber" label="报价单号" width="150">
                    <template #default="{ row }">
                      <el-link type="primary" :underline="false" @click="viewQuote(row)" style="cursor: pointer">
                        {{ row.quoteNumber }}
                      </el-link>
                    </template>
                  </el-table-column>
                  <el-table-column prop="opportunity.name" label="商机" width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="opportunity-name">{{ row.opportunity?.name || '-' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.totalAmount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="quoteDate" label="报价日期" width="120">
                    <template #default="{ row }">
                      {{ formatDateOnly(row.quoteDate) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="expiryDate" label="有效期" width="120">
                    <template #default="{ row }">
                      {{ row.expiryDate ? formatDateOnly(row.expiryDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getQuoteStatusType(row.status)">
                        {{ getQuoteStatusName(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="owner" label="负责人" width="120">
                    <template #default="{ row }">
                      {{ row.owner?.user?.username || row.owner?.username || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="部门" width="120">
                    <template #default="{ row }">
                      <span v-if="row.department?.name">{{ row.department.name }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="创建者" width="120">
                    <template #default="{ row }">
                      {{ row.creator?.user?.username || row.creator?.nickname || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ formatDateTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="300" fixed="right">
                    <template #default="{ row }">
                      <div class="action-buttons">
                        <el-button
                          v-if="row.status === 'draft'"
                          type="warning"
                          size="small"
                          :icon="Edit"
                          @click="openEditQuote(row)"
                        >
                          编辑
                        </el-button>
                        <el-button
                          v-if="row.status === 'draft' || row.status === 'rejected'"
                          type="success"
                          size="small"
                          @click="viewQuote(row)"
                        >
                          {{ row.status === 'rejected' ? '重新提交审批' : '提交审批' }}
                        </el-button>
                        <el-button type="info" size="small" :icon="Printer" @click="printQuote(row)">
                          打印
                        </el-button>
                        <el-button type="info" size="small" @click="createContractFromQuote(row)">
                          创建合同
                        </el-button>
                        <el-button type="danger" size="small" :icon="Delete" @click="deleteQuote(row)">
                          删除
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
                </el-card>

            <!-- 合同内容 -->
              <el-card shadow="never" id="customer-section-contracts" class="tab-content detail-section section-card">
                  <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <h3 class="section-title" style="margin: 0">销售合同</h3>
                      <el-button type="primary" size="small" @click="openCreateContract">新增合同</el-button>
                    </div>
                  </template>
                <div class="list-padding">
                <el-table :data="customerContracts" border style="width: 100%">
                  <el-table-column prop="contractNumber" label="合同编号" min-width="150" />
                  <el-table-column prop="type" label="合同类型" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getContractTypeTagType(row.type)" size="small">
                        {{ getContractTypeName(row.type) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getContractStatusType(row.status)" size="small">
                        {{ getContractStatusName(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
                    <template #default="{ row }">{{ formatCurrency(row.totalAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="signDate" label="签约日期" width="120">
                    <template #default="{ row }">
                      <span v-if="row.signDate">{{ formatDate(row.signDate) }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="effectiveDate" label="生效日期" width="120">
                    <template #default="{ row }">
                      <span v-if="row.effectiveDate">{{ formatDate(row.effectiveDate) }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="expiryDate" label="到期日期" width="120">
                    <template #default="{ row }">
                      <span v-if="row.expiryDate">{{ formatDate(row.expiryDate) }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="quote" label="关联报价" width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span v-if="row.quote?.quoteNumber">{{ row.quote.quoteNumber }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="opportunity" label="关联商机" width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span v-if="row.opportunity?.name">{{ row.opportunity.name }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" @click="openEditContract(row)">编辑</el-button>
                      <el-button size="small" type="danger" @click="deleteContract(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
                </el-card>

            <!-- 订单内容 -->
              <el-card shadow="never" id="customer-section-orders" class="tab-content detail-section section-card">
                  <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <h3 class="section-title" style="margin: 0">销售订单</h3>
                      <div style="display: flex; align-items: center; gap: 12px">
                        <el-radio-group v-model="orderViewMode" size="default">
                          <el-radio-button label="list">订单列表</el-radio-button>
                          <el-radio-button label="analytics">数据分析</el-radio-button>
                        </el-radio-group>
                        <el-button v-if="orderViewMode === 'list'" type="primary" size="small" @click="openCreateOrder">新增订单</el-button>
                      </div>
                    </div>
                  </template>
                <div class="list-padding">

                <!-- 订单列表视图 -->
                <div v-if="orderViewMode === 'list'">
                  <el-table :data="customerOrders" border style="width: 100%">
                    <el-table-column prop="orderNumber" label="订单编号" min-width="150" />
                    <el-table-column prop="orderDate" label="订单日期" width="120">
                      <template #default="{ row }">{{ formatDateOnly(row.orderDate) }}</template>
                    </el-table-column>
                    <el-table-column prop="deliveryDate" label="交货日期" width="120">
                      <template #default="{ row }">
                        <span v-if="row.deliveryDate">{{ formatDateOnly(row.deliveryDate) }}</span>
                        <span v-else class="text-gray-400">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
                      <template #default="{ row }">{{ formatCurrency(row.totalAmount) }}</template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getOrderStatusType(row.status)" size="small">
                          {{ getOrderStatusName(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="quote" label="关联报价" width="150" show-overflow-tooltip>
                      <template #default="{ row }">
                        <span v-if="row.quote?.quoteNumber">{{ row.quote.quoteNumber }}</span>
                        <span v-else class="text-gray-400">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="contract" label="关联合同" width="150" show-overflow-tooltip>
                      <template #default="{ row }">
                        <span v-if="row.contract?.contractNumber">{{ row.contract.contractNumber }}</span>
                        <span v-else class="text-gray-400">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="opportunity" label="关联商机" width="150" show-overflow-tooltip>
                      <template #default="{ row }">
                        <span v-if="row.opportunity?.name">{{ row.opportunity.name }}</span>
                        <span v-else class="text-gray-400">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="创建时间" width="180">
                      <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="160" fixed="right">
                      <template #default="{ row }">
                        <el-button size="small" type="primary" @click="openEditOrder(row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteOrder(row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 数据分析视图 -->
                <div v-else class="analytics-content">
                  <template v-if="customerOrders.length === 0">
                    <div class="chart-container">
                      <el-empty description="暂无订单数据" />
                    </div>
                  </template>
                  <template v-else>
                    <!-- 订单金额趋势图 -->
                    <div class="chart-container">
                      <div class="chart-header">
                        <div class="chart-title">订单金额趋势</div>
                        <el-select
                          v-model="orderAnalyticsPeriod"
                          size="small"
                          style="width: 120px"
                          @change="updateOrderCharts"
                        >
                          <el-option label="近30天" value="30days" />
                          <el-option label="本月" value="thisMonth" />
                          <el-option label="上月" value="lastMonth" />
                          <el-option label="本年" value="thisYear" />
                        </el-select>
                      </div>
                      <div ref="orderAmountTrendChart" style="width: 100%; height: 300px"></div>
                    </div>

                    <!-- 订单产品占比饼图 -->
                    <div class="chart-container">
                      <div class="chart-title">订单产品占比</div>
                      <div ref="orderProductPieChart" style="width: 100%; height: 400px"></div>
                    </div>
                  </template>
                </div>
              </div>
                </el-card>
             <!-- 对账内容 -->
             <el-card shadow="never" id="customer-section-statements" class="tab-content statement-content detail-section section-card">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">财务对账</h3>
                    <div class="toolbar-left">
                      <span class="toolbar-label">会计期间：</span>
                      <el-date-picker
                        v-model="statementPeriod"
                        type="monthrange"
                        range-separator="~"
                        start-placeholder="开始月份"
                        end-placeholder="结束月份"
                        format="YYYY-MM"
                        value-format="YYYY-MM"
                        size="default"
                        style="width: 240px"
                        @change="loadStatements"
                      />
                    </div>
                  </div>
                </template>
              <div v-if="statementTransactions.length > 0" class="statement-table-wrapper">
                <table class="statement-table">
                  <thead>
                    <tr>
                      <th class="col-date">日期</th>
                      <th class="col-code">实例编码</th>
                      <th class="col-summary">摘要</th>
                      <th class="col-debit">借方-本位币</th>
                      <th class="col-credit">贷方-本位币</th>
                      <th class="col-dc">借/贷</th>
                      <th class="col-balance">余额-本位币</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(group, groupIndex) in groupedTransactions" :key="groupIndex">
                      <tr
                        v-for="(item, index) in group.items"
                        :key="item.id"
                        :class="{ 'period-total': item.isPeriodTotal }"
                      >
                        <td class="col-date">
                          <span v-if="!item.isPeriodTotal">{{ formatDateOnly(item.date) }}</span>
                          <span v-else class="period-total-label">{{ item.periodLabel }}</span>
                        </td>
                        <td class="col-code">
                          <span v-if="!item.isPeriodTotal && item.instanceCode" class="instance-code-link">
                            <el-icon style="margin-right: 4px; font-size: 12px"><Document /></el-icon>
                            {{ truncateCode(item.instanceCode) }}
                          </span>
                        </td>
                        <td class="col-summary">{{ item.summary || '-' }}</td>
                        <td class="col-debit" align="right">
                          {{ item.debit ? formatCurrency(item.debit, false) : '-' }}
                        </td>
                        <td class="col-credit" align="right">
                          {{ item.credit ? formatCurrency(item.credit, false) : '-' }}
                        </td>
                        <td class="col-dc" align="center">{{ item.dcType || '-' }}</td>
                        <td class="col-balance" align="right">
                          {{ item.balance ? formatCurrency(item.balance, false) : '-' }}
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state">
                <el-empty description="暂无对账数据" />
              </div>
              </el-card>
              <!-- 活动记录内容 -->
              <el-card shadow="never" id="customer-section-activities" class="tab-content detail-section section-card">
                <template #header>
                  <h3 class="section-title" style="margin: 0">活动记录</h3>
                </template>
              <ActivityList
                v-if="selectedCustomer?.id"
                :related-to-type="'customer'"
                :related-to-id="selectedCustomer.id"
                :auto-load="true"
                @refresh="() => {}"
              />
              </el-card>
            <!-- 客户图谱内容（vue3-tree-org） -->
            <el-card shadow="never" id="customer-section-graph" class="tab-content graph-content detail-section section-card">
                <template #header>
                  <h3 class="section-title" style="margin: 0">客户图谱</h3>
                </template>
              <div class="customer-graph-container">
                <Vue3TreeOrg
                  v-if="customerOrgTree"
                  :data="customerOrgTree"
                  :horizontal="true"
                  :collapsable="true"
                  :scalable="true"
                  :draggable="true"
                  :node-draggable="false"
                  :clone-node-drag="false"
                  :label-style="{ whiteSpace: 'nowrap', fontSize: '13px' }"
                  :label-class-name="customerOrgLabelClass"
                  :tool-bar="{ expand: true, scale: true, zoom: true, restore: true, fullscreen: false }"
                />
            </div>
              </el-card>
            </template>

          </div>
        </div>
      </div>
    </el-drawer>

  <!-- 完成活动弹窗 -->
  <el-dialog v-model="completeDialog.visible" title="完成活动" width="480px">
    <el-form label-width="90px">
      <el-form-item label="完成结果">
        <el-input v-model="completeDialog.outcome" placeholder="请输入结果/结论" />
      </el-form-item>
      <el-form-item label="完成内容">
        <el-input
          v-model="completeDialog.content"
          type="textarea"
          :rows="4"
          placeholder="请输入完成的详细内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="completeDialog.visible = false">取消</el-button>
      <el-button type="primary" @click="submitComplete">确定</el-button>
    </template>
  </el-dialog>

  <!-- 新增/编辑拜访弹窗 -->
  <el-dialog
    v-model="visitDialogVisible"
    :title="visitDialogTitle"
    width="720px"
    :close-on-click-modal="false"
  >
    <VisitForm
      :visit="editingVisit"
      :default-related-type="editingVisit ? undefined : 'customer'"
      :default-related-id="editingVisit ? undefined : selectedCustomer?.id"
      @success="handleVisitFormSuccess"
      @cancel="visitDialogVisible = false"
    />
  </el-dialog>

  <!-- 新建活动弹窗 -->
  <el-dialog
    v-model="createActivityDialogVisible"
    title="新建活动"
    width="600px"
    :close-on-click-modal="false"
  >
    <ActivityForm
      ref="activityFormRef"
      :default-related-to-type="'customer'"
      :default-related-to-id="selectedCustomer?.id"
      @submit="handleActivitySubmit"
      @cancel="createActivityDialogVisible = false"
    />
    <template #footer>
      <el-button @click="createActivityDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="savingActivity" @click="handleActivityFormSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 新增/编辑报价弹窗 -->
  <QuoteFormDialog
    v-model="quoteDialogVisible"
    :title="quoteDialogTitle"
    :quote="currentQuote"
    :default-customer-id="selectedCustomer?.id"
    @success="handleQuoteSuccess"
    @cancel="quoteDialogVisible = false"
  />

  <!-- 报价详情对话框 -->
  <QuoteDetailDialog
    v-model="quoteDetailDialogVisible"
    :quote-id="currentQuoteId"
    @edit="handleQuoteEdit"
    @updated="handleQuoteUpdated"
  />

  <!-- 打印对话框 -->
  <el-dialog
    v-model="printDialogVisible"
    title="打印报价单"
    width="90%"
    :close-on-click-modal="false"
    class="print-dialog"
  >
    <QuotePrint
      v-if="printQuoteData"
      ref="quotePrintRef"
      :quote="printQuoteData"
    />
    <template #footer>
      <el-button @click="printDialogVisible = false">关闭</el-button>
      <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>

  <!-- 新增/编辑合同对话框 -->
  <ContractFormDialog
    v-model="contractDialogVisible"
    :title="contractDialogTitle"
    :default-customer-id="selectedCustomer?.id"
    :contract="currentContract"
    @success="handleContractSuccess"
    @cancel="contractDialogVisible = false"
  />

  <!-- 新增/编辑订单对话框 -->
  <OrderFormDialog
    v-model="orderDialogVisible"
    :title="orderDialogTitle"
    :default-customer-id="selectedCustomer?.id ? Number(selectedCustomer.id) : undefined as number | undefined"
    :order="currentOrder"
    @success="handleOrderSuccess"
    @cancel="orderDialogVisible = false"
  />

  <!-- 新增/编辑商机对话框 -->
  <OpportunityFormDialog
    v-model="opportunityDialogVisible"
    :title="opportunityDialogTitle"
    :default-customer-id="selectedCustomer?.id"
    :opportunity="currentOpportunity"
    @success="handleOpportunitySuccess"
    @cancel="opportunityDialogVisible = false"
  />

  <!-- 新增/编辑需求对话框 -->
  <el-dialog v-model="requirementDialog.visible" :title="requirementDialog.title" width="800px">
    <el-form
      ref="requirementFormRef"
      :model="requirementForm"
      :rules="requirementRules"
      label-width="120px"
    >
      <el-form-item label="需求类型" prop="type">
        <el-radio-group v-model="requirementForm.type">
          <el-radio :label="RequirementType.EXPLICIT">显性需求（客户提出的需求）</el-radio>
          <el-radio :label="RequirementType.IMPLICIT">隐性需求（客户可能会有的需求）</el-radio>
          <el-radio :label="RequirementType.INTANGIBLE">无形需求（需要自己主动发现）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="需求内容" prop="content">
        <el-input
          v-model="requirementForm.content"
          type="textarea"
          :rows="3"
          placeholder="请输入需求内容"
        />
      </el-form-item>
      <el-form-item label="要解决的问题" prop="problemToSolve">
        <el-input
          v-model="requirementForm.problemToSolve"
          type="textarea"
          :rows="3"
          placeholder="请输入需求背后要解决的问题"
        />
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="requirementForm.priority">
          <el-radio :label="0">低</el-radio>
          <el-radio :label="1">中</el-radio>
          <el-radio :label="2">高</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="requirementForm.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已解决" value="resolved" />
          <el-option label="已关闭" value="closed" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="requirementForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请输入或选择标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonRequirementTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="requirementForm.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="requirementDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="requirementDialog.saving" @click="submitRequirement"
        >确定</el-button
      >
    </template>
  </el-dialog>

  <!-- 新增/编辑联系人对话框 -->
  <el-dialog v-model="contactDialog.visible" :title="contactDialog.title" width="600px">
    <el-form ref="contactFormRef" :model="contactForm" :rules="contactRules" label-width="100px">
      <el-form-item label="联系人姓名" prop="name">
        <el-input
          v-model="contactForm.name"
          placeholder="请输入联系人姓名"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="职位" prop="position">
        <el-input v-model="contactForm.position" placeholder="请输入职位" />
      </el-form-item>
      <el-form-item label="部门" prop="department">
        <el-input v-model="contactForm.department" placeholder="请输入部门" />
      </el-form-item>
      <el-form-item label="联系人类型" prop="type">
        <el-select v-model="contactForm.type" placeholder="请选择联系人类型" style="width: 100%">
          <el-option label="主要联系人" value="primary" />
          <el-option label="次要联系人" value="secondary" />
          <el-option label="决策者" value="decision_maker" />
          <el-option label="影响者" value="influencer" />
          <el-option label="使用者" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="contactForm.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="contactForm.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="座机" prop="telephone">
        <el-input v-model="contactForm.telephone" placeholder="请输入座机" />
      </el-form-item>
      <el-form-item label="关联客户" prop="customerId">
        <el-input :model-value="selectedCustomer?.name" disabled placeholder="关联客户" />
      </el-form-item>
      <el-form-item label="上级联系人" prop="parentId">
        <el-select
          v-model="contactForm.parentId"
          placeholder="请选择上级联系人（可选）"
          filterable
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="contact in parentContactOptionsForDialog"
            :key="contact.id"
            :label="`${contact.name}${contact.position ? ' - ' + contact.position : ''}`"
            :value="contact.id"
          />
        </el-select>
        <div style="font-size: 12px; color: #909399; margin-top: 4px;">
          选择同一客户下的其他联系人作为上级
        </div>
      </el-form-item>
      <el-form-item label="是否主要联系人" prop="isPrimary">
        <el-switch v-model="contactForm.isPrimary" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="contactForm.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="contactDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="contactDialog.saving" @click="submitContact"
        >确定</el-button
      >
    </template>
  </el-dialog>

  <!-- 批量转移对话框 -->
  <el-dialog v-model="transferDialogVisible" title="批量转移客户" width="500px">
    <el-form :model="{ ownerId: transferOwnerId }" label-width="100px">
      <el-form-item label="选择负责人" required>
        <el-select
          v-model="transferOwnerId"
          style="width: 100%"
          placeholder="请选择负责人"
          filterable
          :loading="ownerLoading"
        >
          <el-option
            v-for="user in ownerOptions"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
        <div class="text-sm text-gray-500 mt-1">
          将选中的 {{ selectedRows.length }} 个客户转移给所选负责人
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="transferDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmBatchTransfer">确定</el-button>
    </template>
  </el-dialog>

  <!-- 信用变更历史对话框 -->
  <el-dialog v-model="showCreditHistoryDialog" title="信用变更历史" width="800px" @open="loadCreditHistory">
    <el-table :data="creditHistory" border style="width: 100%">
      <el-table-column prop="createdAt" label="变更时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="changer" label="变更人" width="120">
        <template #default="{ row }">
          {{ row.changer?.nickname || row.changer?.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="信用额度" width="150">
        <template #default="{ row }">
          <span v-if="row.oldLimit !== null || row.newLimit !== null">
            {{ row.oldLimit !== null ? formatCurrency(row.oldLimit, false) : '-' }} →
            {{ row.newLimit !== null ? formatCurrency(row.newLimit, false) : '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="额度档位" width="150">
        <template #default="{ row }">
          <span v-if="row.oldTier || row.newTier">
            {{ getCreditTierLabel(row.oldTier) }} → {{ getCreditTierLabel(row.newTier) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="客户等级" width="120">
        <template #default="{ row }">
          <span v-if="row.oldRating || row.newRating">
            {{ row.oldRating || '-' }} → {{ row.newRating || '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="changeReason" label="变更原因" min-width="200" show-overflow-tooltip />
    </el-table>
    <template #footer>
      <el-button @click="showCreditHistoryDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  TrendCharts,
  Calendar,
  User,
  Clock,
  Star,
  Message,
  ChatDotRound,
  Filter,
  Phone,
  VideoCamera,
  EditPen,
  Document,
  DocumentCopy,
  Files,
    ShoppingCart,
  Location,
    List,
    Share,
    Wallet,
    OfficeBuilding,
    Grid,
    Fold,
    Expand,
    Loading,
    Printer,
} from '@element-plus/icons-vue'
import { Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
// 组织架构/思维导图：vue3-tree-org
import { Vue3TreeOrg } from 'vue3-tree-org'
import 'vue3-tree-org/lib/vue3-tree-org.css'
import Sortable from 'sortablejs'
import { useAuthStore } from '@/stores/modules/auth'
import customerApi, {
  type Customer,
  type CreateCustomerDto,
  type UpdateCustomerDto,
  type QueryCustomerDto,
  type CustomerProfile,
  type CustomerCreditHistory,
  type CreateCustomerProfileDto,
  type UpdateCreditInfoDto,
} from '@/api/customer'
import opportunityApi, { type Opportunity } from '@/api/opportunity'
import activityApi, { type CreateActivityDto, type UpdateActivityDto } from '@/api/activity'
import contactApi from '@/api/contact'
import leadApi from '@/api/lead'
import customerRequirementApi, {
  type CustomerRequirement,
  RequirementType,
} from '@/api/customerRequirement'
import quoteApi, { type Quote, type CreateQuoteDto, type UpdateQuoteDto } from '@/api/quote'
import contractApi, { type Contract, type CreateContractDto, type UpdateContractDto } from '@/api/contract'
import orderApi, { type Order, type CreateOrderDto, type UpdateOrderDto } from '@/api/order'
import visitApi, { type Visit } from '@/api/visit'
import customerTagApi, { type CustomerTag } from '@/api/customerTag'
import request from '@/utils/request'
import commonApi from '@/api/common'
import dictionaryApi, { type DictItem } from '@/api/dictionary'
import { getDepartmentTree, getDepartmentMembers, type Department, type Member } from '@/api/department'
import ActivityForm from '@/components/activity/ActivityForm.vue'
import ActivityList from '@/components/activity/ActivityList.vue'
import VisitForm from '@/components/visit/VisitForm.vue'
import ContactVisitList from '@/components/visit/ContactVisitList.vue'
import QuoteFormDialog from '@/components/quote/QuoteFormDialog.vue'
import QuoteDetailDialog from '@/components/quote/QuoteDetailDialog.vue'
import QuotePrint from '@/components/quote/QuotePrint.vue'
import ContractFormDialog from '@/components/contract/ContractFormDialog.vue'
import OrderFormDialog from '@/components/order/OrderFormDialog.vue'
import OpportunityFormDialog from '@/components/opportunity/OpportunityFormDialog.vue'
import businessInfoApi, {
  type BusinessInfo,
  type BusinessPersonnel,
  type BusinessShareholder,
  type BusinessBranch,
  type BusinessInvestment,
  type BusinessChangeRecord,
} from '@/api/business-info'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const currentMemberId = computed(
  () =>
    (authStore as any)?.currentMember?.id ||
    (authStore as any)?.member?.id ||
    (authStore as any)?.user?.memberId ||
    '',
)
const isOwner = (act: any) => {
  const actOwnerId = act?.ownerId || act?.owner?.id
  const me = currentMemberId.value
  return !!actOwnerId && !!me && String(actOwnerId).trim() === String(me).trim()
}

// 搜索表单
const searchForm = reactive<{
  search?: string
  status?: any
  source?: string
  industry?: string
  region?: string[]
  page?: number
  limit?: number
}>({
  search: '',
  status: undefined,
  source: undefined,
  industry: undefined,
  region: undefined,
  page: 1,
  limit: 10,
})

// 客户列表
const customers = ref<Customer[]>([])
const loading = ref(false)
const selectedRows = ref<Customer[]>([])

// 视图模式
const viewMode = ref<'list' | 'kanban'>('list')

// 看板相关
const columnRefs = ref<Record<string, HTMLElement | null>>({})
const sortableInstances = ref<any[]>([])

// 客户状态列配置
const statusColumns = [
  { label: '潜在客户', value: 'lead' },
  { label: '合格客户', value: 'qualified' },
  { label: '提案中', value: 'proposal' },
  { label: '谈判中', value: 'negotiation' },
  { label: '成交客户', value: 'closed_won' },
  { label: '流失客户', value: 'closed_lost' },
]

// 设置列引用
const setColumnRef = (el: any, status: string) => {
  if (el && el instanceof HTMLElement) {
    columnRefs.value[status] = el
  } else {
    // 元素被卸载时清除引用
    delete columnRefs.value[status]
  }
}

// 按状态获取客户
const getCustomersByStatus = (status: string) => {
  return customers.value.filter((customer) => customer.status === status)
}

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()

// 客户详情相关
const selectedCustomer = ref<Customer | null>(null)
const customerDetails = ref<any>(null)
const customerOpportunities = ref<any[]>([])
const customerContacts = ref<any[]>([])
const customerActivities = ref<any[]>([])
const customerRequirements = ref<CustomerRequirement[]>([])
const customerQuotes = ref<Quote[]>([])
const customerContracts = ref<Contract[]>([])
const customerOrders = ref<Order[]>([])
const customerVisits = ref<Visit[]>([])
const statementPeriod = ref<[string, string] | null>(null)
const statementTransactions = ref<any[]>([])
const timelineData = ref<any[]>([])
const loadingDetails = ref(false)

// 客户详情 - 拜访表单弹窗
const visitDialogVisible = ref(false)
const visitDialogTitle = ref('新增拜访')
const editingVisit = ref<Visit | null>(null)

// 工商信息相关
const businessInfo = ref<BusinessInfo | null>(null)
const businessInfoLoading = ref(false)
const businessInfoRefreshing = ref(false)
const businessInfoExpired = ref(false)
const businessSubTab = ref<'info' | 'personnel' | 'shareholders' | 'branches' | 'investments' | 'changes'>('info')
const hoveredActivityId = ref<string>('')
const parentContactOptionsForDialog = ref<any[]>([])
const contactViewMode = ref<'list' | 'graph'>('list')
const menuCollapsed = ref(false) // 菜单收缩状态

// 合作与信用相关
const customerProfile = ref<CustomerProfile | null>(null)
const cooperationLoading = ref(false)
const cooperationSaving = ref(false)
const cooperationEditMode = ref(false)
const showCreditHistoryDialog = ref(false)
const creditHistory = ref<CustomerCreditHistory[]>([])
const categoryOptions = ref<DictItem[]>([])
const categoryOptionsLoading = ref(false)
const cooperationForm = reactive<CreateCustomerProfileDto & { level?: string }>({
  invoiceRequirement: undefined,
  invoiceRemark: '',
  shippingMethods: [],
  mainCategoryIds: [],
  competitorBrands: [],
  creditLimit: undefined,
  creditTier: undefined,
  level: undefined,
})

// 订单图表相关
const orderAmountTrendChart = ref<HTMLElement | null>(null)
const orderProductPieChart = ref<HTMLElement | null>(null)
let orderAmountTrendChartInstance: echarts.ECharts | null = null
let orderProductPieChartInstance: echarts.ECharts | null = null

// 客户图谱相关（vue3-tree-org）
// 组织架构树数据
type OrgNode = {
  id: string | number
  label: string
  expand?: boolean
  children?: OrgNode[]
}

// 联系人类型中文
const getContactTypeLabel = (type?: string | null) => {
  if (!type) return ''
  switch (type) {
    case 'primary':
      return '主要联系人'
    case 'secondary':
      return '次要联系人'
    case 'influencer':
      return '影响者'
    case 'user':
      return '使用者'
    default:
      return type
  }
}

// 递归构建联系人节点（支持上下级联系人关系）
const buildContactOrgNode = (contact: any): OrgNode => {
  const parts: string[] = []
  if (contact.name) parts.push(contact.name)
  if (contact.position) parts.push(contact.position)
  const typeLabel = getContactTypeLabel(contact.type)
  if (typeLabel) parts.push(`【${typeLabel}】`)

  // 在 id 中包含类型信息，用于后续颜色区分
  const contactType = contact.type || 'secondary'
  const node: OrgNode = {
    id: `contact_${contactType}_${contact.id}`,
    label: parts.join(' - '),
  }

  if (Array.isArray(contact.children) && contact.children.length > 0) {
    node.expand = true
    node.children = contact.children.map((child: any) => buildContactOrgNode(child))
  }

  return node
}

// 根据节点类型返回不同的 class（用于区分颜色）
const customerOrgLabelClass = (node: OrgNode) => {
  const idStr = String(node.id)

  if (idStr === 'contacts') {
    return 'org-node-category'
  }
  if (idStr.startsWith('contact_')) {
    return 'org-node-contact' // 联系人：蓝色
  }
  if (idStr === 'owner') {
    return 'org-node-owner' // 负责人：橙色
  }
  if (idStr === 'opportunities') {
    return 'org-node-opportunity-category'
  }
  if (idStr.startsWith('opp_')) {
    return 'org-node-opportunity' // 商机：绿色
  }
  if (idStr === 'requirements') {
    return 'org-node-requirement-category' // “需求”二级节点：红色标题
  }
  if (idStr === 'requirements_explicit') {
    return 'org-node-requirement-category'
  }
  if (idStr === 'requirements_implicit') {
    return 'org-node-requirement-category'
  }
  if (idStr === 'requirements_intangible') {
    return 'org-node-requirement-category'
  }
  if (idStr.startsWith('req_')) {
    return 'org-node-requirement' // 具体需求：红色
  }

  // 根节点
  if (!node.id || idStr === String(selectedCustomer.value?.id)) {
    return 'org-node-root'
  }

  return ''
}

const customerOrgTree = computed<OrgNode | null>(() => {
  if (!selectedCustomer.value) return null

  const root: OrgNode = {
    id: selectedCustomer.value.id || 'root',
    label: selectedCustomer.value.name || '客户',
    expand: true,
    children: [],
  }

  const children: OrgNode[] = []

  // 联系人
  if (customerContacts.value.length > 0) {
    children.push({
      id: 'contacts',
      label: '联系人',
      expand: true,
      children: customerContacts.value.map((contact) => buildContactOrgNode(contact)),
    })
  }

  // 负责人
  if (selectedCustomer.value.owner) {
    children.push({
      id: 'owner',
      label: `负责人：${getUserName(selectedCustomer.value.owner)}`,
      children: [],
    })
  }

  // 商机
  if (customerOpportunities.value.length > 0) {
    children.push({
      id: 'opportunities',
      label: '商机',
      expand: true,
      children: customerOpportunities.value.map((opp) => ({
        id: `opp_${opp.id}`,
        label: `${opp.title || '-'}（${formatCurrency(opp.value || 0, false)}）`,
        children: [],
      })),
    })
  }

  // 需求：显性 / 隐性 / 无形，统一放在“需求”二级节点下
  const explicitReq = customerRequirements.value.filter((r) => r.type === 'explicit')
  const implicitReq = customerRequirements.value.filter((r) => r.type === 'implicit')
  const intangibleReq = customerRequirements.value.filter((r) => r.type === 'intangible')

  const requirementCategoryChildren: OrgNode[] = []

  if (explicitReq.length > 0) {
    requirementCategoryChildren.push({
      id: 'requirements_explicit',
      label: '显性需求',
      expand: true,
      children: explicitReq.map((req) => ({
        id: `req_${req.id}`,
        label: req.content || '-',
        children: [],
      })),
    })
  }

  if (implicitReq.length > 0) {
    requirementCategoryChildren.push({
      id: 'requirements_implicit',
      label: '隐性需求',
      expand: true,
      children: implicitReq.map((req) => ({
        id: `req_${req.id}`,
        label: req.content || '-',
        children: [],
      })),
    })
  }

  if (intangibleReq.length > 0) {
    requirementCategoryChildren.push({
      id: 'requirements_intangible',
      label: '无形需求',
      expand: true,
      children: intangibleReq.map((req) => ({
        id: `req_${req.id}`,
        label: req.content || '-',
        children: [],
      })),
    })
  }

  if (requirementCategoryChildren.length > 0) {
    children.push({
      id: 'requirements',
      label: '需求',
      expand: true,
      children: requirementCategoryChildren,
    })
  }

  root.children = children
  return root
})

// 联系人图谱数据（仅联系人维度，用于“联系人图谱”视图）
const contactOrgTree = computed<OrgNode | null>(() => {
  if (!contactTreeData.value || contactTreeData.value.length === 0) return null

  return {
    id: 'contacts_root',
    label: '联系人图谱',
    expand: true,
    children: contactTreeData.value.map((c: any) => buildContactOrgNode(c)),
  }
})

// 联系人图谱节点颜色分类函数（根据联系人类型区分）
const contactOrgLabelClass = (node: OrgNode) => {
  const idStr = String(node.id)

  // 根节点
  if (idStr === 'contacts_root') {
    return 'org-node-root'
  }

  // 根据联系人类型返回不同的 class
  if (idStr.startsWith('contact_primary_')) {
    return 'org-node-contact-primary' // 主要联系人：绿色
  }
  if (idStr.startsWith('contact_secondary_')) {
    return 'org-node-contact-secondary' // 次要联系人：蓝色
  }
  if (idStr.startsWith('contact_decision_maker_')) {
    return 'org-node-contact-decision-maker' // 决策者：红色
  }
  if (idStr.startsWith('contact_influencer_')) {
    return 'org-node-contact-influencer' // 影响者：橙色
  }
  if (idStr.startsWith('contact_user_')) {
    return 'org-node-contact-user' // 使用者：紫色
  }
  if (idStr.startsWith('contact_')) {
    return 'org-node-contact' // 默认联系人：蓝色
  }

  return ''
}

// 抽屉相关
const drawerVisible = ref(false)
const detailContentRef = ref<HTMLElement | null>(null)
const detailSectionKeys = [
  'basic',
  'business',
  'contacts',
  'cooperation',
  'requirements',
  'visits',
  'opportunities',
  'quotes',
  'contracts',
  'orders',
  'statements',
  'activities',
  'graph',
] as const
const activeTab = ref<'basic' | 'business' | 'contacts' | 'cooperation' | 'requirements' | 'visits' | 'opportunities' | 'quotes' | 'contracts' | 'orders' | 'statements' | 'activities' | 'graph'>('basic')
const orderViewMode = ref<'list' | 'analytics'>('list')
const orderAnalyticsPeriod = ref<'30days' | 'thisMonth' | 'lastMonth' | 'thisYear'>('30days')

// 表单数据
const formData = reactive<CreateCustomerDto & { id?: string; ownerId?: string }>({
  name: '',
  code: '',
  type: 'individual',
  status: 'lead',
  companyName: '',
  industry: '',
  size: '',
  source: '',
  level: '',
  estimatedValue: 0,
  description: '',
  province: '',
  city: '',
  district: '',
  addressDetail: '',
  ownerId: '',
  tags: [],
})

// 标签列表
const tagOptions = ref<CustomerTag[]>([])
const tagLoading = ref(false)

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' },
    { min: 2, max: 100, message: '客户名称长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择客户类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择客户状态', trigger: 'change' }],
}

// 负责人选项相关
const ownerOptions = ref<Array<{ id: string; name: string }>>([])
const ownerLoading = ref(false)
const isDepartmentManager = ref(false)

const getCurrentUserName = () =>
  (authStore as any)?.user?.username ||
  (authStore as any)?.user?.realName ||
  (authStore as any)?.user?.nickname ||
  '当前用户'

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    lead: 'info',
    qualified: 'warning',
    proposal: 'primary',
    negotiation: 'warning',
    closed_won: 'success',
    closed_lost: 'danger',
  }
  return typeMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    lead: '潜在客户',
    qualified: '合格客户',
    proposal: '提案中',
    negotiation: '谈判中',
    closed_won: '成交客户',
    closed_lost: '流失客户',
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 格式化日期时间（包含时分秒）
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
const getUserName = (user?: any) => {
  if (!user) return '-'
  return user?.username || user?.nickname || user?.name || '-'
}
const formatDateOnly = (dateString: string | null | undefined) => {
  if (!dateString) return '-'
  try {
  const d = new Date(dateString)
    // 检查日期是否有效（不是无效日期，且不是1970-01-01这种默认值）
    if (isNaN(d.getTime()) || d.getFullYear() < 1900) {
      return '-'
    }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
  } catch (e) {
    return '-'
  }
}

// 格式化文本中的日期字符串（用于变更前/变更后字段）
const formatDatesInText = (text: string | null | undefined): string => {
  if (!text) return '-'

  // 匹配各种日期格式：
  // 1. "MM DD YYYY HH:MMAM/PM" 格式（如 "09 8 2004 12:00AM" 或 "05 24 2007 12:00AM"）
  // 2. "MM/DD/YYYY" 格式
  // 3. "YYYY-MM-DD" 格式
  // 4. ISO 日期格式

  let result = text

  // 匹配 "MM DD YYYY HH:MMAM/PM" 格式（如 "09 8 2004 12:00AM"）
  // 注意：月份和日期可能是1-2位数字
  const datePattern1 = /(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})(AM|PM)/gi
  result = result.replace(datePattern1, (match, month, day, year) => {
    try {
      const monthPadded = String(month).padStart(2, '0')
      const dayPadded = String(day).padStart(2, '0')
      const dateStr = `${year}-${monthPadded}-${dayPadded}`
      const date = new Date(dateStr)
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
        return formatDateOnly(dateStr)
      }
    } catch {
      // 如果解析失败，返回原文本
    }
    return match
  })

  // 匹配 "MM/DD/YYYY" 格式
  const datePattern2 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
  result = result.replace(datePattern2, (match, month, day, year) => {
    try {
      const monthPadded = String(month).padStart(2, '0')
      const dayPadded = String(day).padStart(2, '0')
      const dateStr = `${year}-${monthPadded}-${dayPadded}`
      const date = new Date(dateStr)
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
        return formatDateOnly(dateStr)
      }
    } catch {
      // 如果解析失败，返回原文本
    }
    return match
  })

  // 匹配 "YYYY-MM-DD" 格式（但需要验证不是无效日期）
  const datePattern3 = /(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/g
  result = result.replace(datePattern3, (match, year, month, day) => {
    try {
      const monthPadded = String(month).padStart(2, '0')
      const dayPadded = String(day).padStart(2, '0')
      const dateStr = `${year}-${monthPadded}-${dayPadded}`
      const date = new Date(dateStr)
      // 检查日期是否有效且不是默认值（1970-01-01）
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
        const formatted = formatDateOnly(dateStr)
        // 如果格式化后不是 '-'，说明日期有效
        if (formatted !== '-') {
          return formatted
        }
      }
    } catch {
      // 如果解析失败，返回原文本
    }
    return match
  })

  return result
}
const formatTime = (dateString?: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// 获取规模名称
const getSizeName = (size: string) => {
  const sizeMap: Record<string, string> = {
    small: '小型',
    medium: '中型',
    large: '大型',
    enterprise: '超大型',
  }
  return sizeMap[size] || size
}

// 获取等级类型
const getLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'danger',
  }
  return typeMap[level] || 'default'
}

// 格式化货币
const formatCurrency = (value: number | string | null | undefined, showSymbol = true) => {
  if (value === null || value === undefined || value === '') return '-'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '-'

  if (showSymbol) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
      minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    }).format(numValue)
  } else {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  }
}

// 获取地区显示文本
const getRegionDisplay = (customer: Customer) => {
  const parts = []
  if (customer.province) parts.push(customer.province)
  if (customer.city) parts.push(customer.city)
  if (customer.district) parts.push(customer.district)
  return parts.length > 0 ? parts.join(' ') : null
}

// 计算合计行
const getSummaries = (param: { columns: Array<{ property?: string }>; data: Customer[] }) => {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index: number) => {
    if (index === 0) {
      // 第一列显示"合计"
      sums[index] = '合计'
      return
    }

    if (column.property === 'estimatedValue') {
      // 预计价值列计算总和
      const values = data.map((item: Customer) => Number(item.estimatedValue) || 0)
      const sum = values.reduce((prev: number, curr: number) => {
        return prev + curr
      }, 0)
      sums[index] = formatCurrency(sum)
    } else {
      // 其他列显示空
      sums[index] = ''
    }
  })

  return sums
}

// 计算商机合计行
const getOpportunitySummaries = (param: { columns: Array<{ property?: string; label?: string }>; data: any[] }) => {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index: number) => {
    // 第一列或没有 property 的列（如操作列）显示"合计"
    if (index === 0 || !column.property) {
      sums[index] = index === 0 ? '合计' : ''
      return
    }

    if (column.property === 'value') {
      // 金额列计算总和
      const values = data.map((item: any) => Number(item.value) || 0)
      const sum = values.reduce((prev: number, curr: number) => {
        return prev + curr
      }, 0)
      sums[index] = formatCurrency(sum)
    } else {
      // 其他列显示空
      sums[index] = ''
    }
  })

  return sums
}

// 加载客户列表
const loadCustomers = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      // 看板视图加载所有数据，列表视图使用分页
      page: viewMode.value === 'kanban' ? 1 : Number(pagination.page),
      limit: viewMode.value === 'kanban' ? 10000 : Number(pagination.pageSize),
    }

    // 处理地区筛选参数
    if (searchForm.region && searchForm.region.length > 0) {
      ;(params as any).province = searchForm.region[0]
      if (searchForm.region.length > 1) {
        ;(params as any).city = searchForm.region[1]
      }
      if (searchForm.region.length > 2) {
        ;(params as any).district = searchForm.region[2]
      }
      delete (params as any).region
    }

    console.log('Loading customers with params:', params)
    // 如果当前路由是公海客户页面，使用专门的公海客户API
    const response =
      route.path === '/customers/public'
        ? await customerApi.getPublicList(params)
        : await customerApi.getList(params)
    console.log('Customer API response:', response)

    if (response.code === 200) {
      customers.value = response.data.customers
      pagination.total = response.data.total
      console.log('Customers loaded:', customers.value)

      // 如果是看板视图，重新初始化拖拽
      if (viewMode.value === 'kanban') {
        nextTick(() => {
          initKanbanSortable()
        })
      }
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
    ElMessage.error('加载客户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadCustomers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    type: undefined,
    status: undefined,
    source: undefined,
    industry: undefined,
    region: undefined,
    page: 1,
    limit: 10,
  })
  pagination.page = 1
  loadCustomers()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadCustomers()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadCustomers()
}

// 查看客户详情（抽屉）
const viewCustomerDetail = (customer: Customer) => {
  if (!customer || !customer.id) {
    ElMessage.error('客户信息无效')
    return
  }
  selectedCustomer.value = customer
  drawerVisible.value = true
  activeTab.value = 'activities' // 默认选中活动记录tab
  loadCustomerDetails(customer.id)
  // 活动记录由 ActivityList 组件自动加载，不需要手动调用
}

// 抽屉关闭处理
const handleDrawerClose = (done: () => void) => {
  selectedCustomer.value = null
  timelineData.value = []
  customerOpportunities.value = []
  customerContacts.value = []
  customerActivities.value = []
  customerRequirements.value = []
  customerVisits.value = []
  customerQuotes.value = []
  customerContracts.value = []
  customerOrders.value = []
  statementTransactions.value = []
  businessInfo.value = null
  businessInfoExpired.value = false
  businessSubTab.value = 'info'
  activeTab.value = 'activities'
  loadedTabs.value.clear() // 清空已加载的tab标记

  // 重置合作与信用相关状态
  customerProfile.value = null
  cooperationEditMode.value = false
  showCreditHistoryDialog.value = false
  creditHistory.value = []
  Object.assign(cooperationForm, {
    invoiceRequirement: undefined,
    invoiceRemark: '',
    shippingMethods: [],
    mainCategoryIds: [],
    competitorBrands: [],
    creditLimit: undefined,
    creditTier: undefined,
    level: undefined,
  })

  done()
}

// 顶部自定义关闭按钮
const closeDrawer = () => {
  drawerVisible.value = false
}

// 左侧导航点击：更新 activeTab 并滚动到对应锚点
const handleNavClick = (key: (typeof detailSectionKeys)[number]) => {
  activeTab.value = key
  scrollToSection(key)
}

// 滚动到指定 section
const scrollToSection = (key: (typeof detailSectionKeys)[number]) => {
  nextTick(() => {
    const container = detailContentRef.value
    if (!container) return

    const el = document.getElementById(`customer-section-${key}`)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// 详情滚动联动高亮
const handleDetailScroll = () => {
  const container = detailContentRef.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const offset = 40

  let currentKey: (typeof detailSectionKeys)[number] | null = null

  for (const key of detailSectionKeys) {
    const el = document.getElementById(`customer-section-${key}`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const top = rect.top - containerRect.top
    if (top <= offset) {
      currentKey = key
    } else {
      break
    }
  }

  if (!currentKey) {
    currentKey = detailSectionKeys[0]
  }

  if (currentKey && activeTab.value !== currentKey) {
    activeTab.value = currentKey
  }
}

// 获取日期范围
const getDateRange = (period: '30days' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(now)

  switch (period) {
    case '30days':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0) // 设置为当天的开始时间
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999) // 设置为当天的结束时间
      break
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
  }

  return { startDate, endDate }
}

// 初始化订单金额趋势图
const initOrderAmountTrendChart = () => {
  if (!orderAmountTrendChart.value) return

  if (orderAmountTrendChartInstance) {
    orderAmountTrendChartInstance.dispose()
  }

  orderAmountTrendChartInstance = echarts.init(orderAmountTrendChart.value)

  // 获取日期范围
  const { startDate, endDate } = getDateRange(orderAnalyticsPeriod.value)

  // 将日期范围设置为当天的开始和结束时间，确保包含当天的所有订单
  const startOfStartDate = new Date(startDate)
  startOfStartDate.setHours(0, 0, 0, 0)
  const endOfEndDate = new Date(endDate)
  endOfEndDate.setHours(23, 59, 59, 999)

  // 过滤订单数据（只比较日期部分）
  const filteredOrders = customerOrders.value.filter((order) => {
    if (!order.orderDate) return false
    const orderDate = new Date(order.orderDate)
    // 将订单日期设置为当天的开始时间，用于比较
    const orderDateStart = new Date(orderDate)
    orderDateStart.setHours(0, 0, 0, 0)
    return orderDateStart >= startOfStartDate && orderDateStart <= endOfEndDate
  })

  // 处理订单数据：按日期分组统计金额
  const orderMap = new Map<string, number>()
  filteredOrders.forEach((order) => {
    const date = formatDateOnly(order.orderDate)
    const currentAmount = orderMap.get(date) || 0
    orderMap.set(date, currentAmount + (order.totalAmount || 0))
  })

  // 生成日期序列（填充缺失的日期）
  const dateSequence: string[] = []
  const currentDate = new Date(startOfStartDate)
  while (currentDate <= endOfEndDate) {
    const dateStr = formatDateOnly(currentDate.toISOString())
    dateSequence.push(dateStr)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 按日期排序并填充数据
  const sortedDates = dateSequence.sort()
  const amounts = sortedDates.map((date) => orderMap.get(date) || 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${formatCurrency(param.value)}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: sortedDates,
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => {
          // 只显示月-日，减少显示密度
          if (orderAnalyticsPeriod.value === 'thisYear') {
            return value.substring(5) // 显示 MM-DD
          }
          return value.substring(5) // 显示 MM-DD
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + '万'
          }
          return value.toString()
        },
      },
    },
    series: [
      {
        name: '订单金额',
        type: 'bar',
        data: amounts,
        itemStyle: {
          color: '#409EFF',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#66b1ff',
          },
        },
      },
    ],
  }

  orderAmountTrendChartInstance.setOption(option)
}

// 初始化订单产品占比饼图
const initOrderProductPieChart = () => {
  if (!orderProductPieChart.value) return

  if (orderProductPieChartInstance) {
    orderProductPieChartInstance.dispose()
  }

  orderProductPieChartInstance = echarts.init(orderProductPieChart.value)

  // 处理订单数据：统计每个产品的总金额
  const productMap = new Map<string, { name: string; amount: number }>()
  customerOrders.value.forEach((order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const productId = item.productId || item.product?.id || 'unknown'
        const productName = item.product?.name || '未知产品'
        const itemAmount = item.amount || item.quantity * item.unitPrice || 0

        const existing = productMap.get(productId)
        if (existing) {
          existing.amount += itemAmount
        } else {
          productMap.set(productId, { name: productName, amount: itemAmount })
        }
      })
    }
  })

  // 转换为饼图数据格式
  const pieData = Array.from(productMap.values())
    .map((item) => ({
      name: item.name,
      value: item.amount,
    }))
    .sort((a, b) => b.value - a.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>${params.seriesName}: ${formatCurrency(params.value)}<br/>占比: ${params.percent}%`
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: '订单金额',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}\n({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: pieData,
      },
    ],
  }

  orderProductPieChartInstance.setOption(option)
}

// 订单图表resize处理
const handleOrderChartsResize = () => {
  if (orderAmountTrendChartInstance) {
    orderAmountTrendChartInstance.resize()
  }
  if (orderProductPieChartInstance) {
    orderProductPieChartInstance.resize()
  }
}

// 更新订单图表
const updateOrderCharts = () => {
  if (orderViewMode.value === 'analytics') {
    nextTick(() => {
      initOrderAmountTrendChart()
      initOrderProductPieChart()
    })
  }
}

// 记录已加载的tab，避免重复加载
const loadedTabs = ref<Set<string>>(new Set())
const loadingAllDetails = ref(false) // 统一加载状态

// 加载客户详情（统一加载所有数据）
const loadCustomerDetails = async (customerId: string | number) => {
  try {
    // 验证客户ID
    if (!customerId || customerId === 'undefined' || customerId === 'null' || String(customerId).trim() === '') {
      console.error('无效的客户ID:', customerId)
      ElMessage.error('客户ID无效')
      return
    }

    // 确保ID是字符串格式（后端会转换为数字）
    const id = String(customerId).trim()
    if (!id || id === 'NaN') {
      console.error('无效的客户ID:', customerId)
      ElMessage.error('客户ID无效')
      return
    }

    loadingDetails.value = true
    loadingAllDetails.value = true

    // 1. 加载客户基本信息
    const customerResponse = await customerApi.getDetail(id)
    customerDetails.value = customerResponse.data

    // 2. 并行加载所有数据
    await Promise.allSettled([
      // 联系人
      loadContacts().catch(err => console.error('加载联系人失败:', err)),
      // 商机
      loadOpportunities().catch(err => console.error('加载商机失败:', err)),
      // 需求
      loadRequirements().catch(err => console.error('加载需求失败:', err)),
      // 拜访记录
      loadVisits().catch(err => console.error('加载拜访记录失败:', err)),
      // 报价
      loadQuotes().catch(err => console.error('加载报价失败:', err)),
      // 合同
      loadContracts().catch(err => console.error('加载合同失败:', err)),
      // 订单
      loadOrders().then(() => {
        // 订单加载完成后更新图表
        nextTick(() => {
          updateOrderCharts()
        })
      }).catch(err => console.error('加载订单失败:', err)),
      // 财务对账
      loadStatements().catch(err => console.error('加载财务对账失败:', err)),
      // 工商信息
      loadBusinessInfo().catch(err => console.error('加载工商信息失败:', err)),
      // 合作与信用
      loadCustomerProfile().catch(err => console.error('加载合作与信用失败:', err)),
    ])

    // 重置已加载的tab标记（切换客户时重置）
    loadedTabs.value.clear()
    // 标记所有tab已加载
    loadedTabs.value.add('basic')
    loadedTabs.value.add('business')
    loadedTabs.value.add('contacts')
    loadedTabs.value.add('cooperation')
    loadedTabs.value.add('requirements')
    loadedTabs.value.add('visits')
    loadedTabs.value.add('opportunities')
    loadedTabs.value.add('quotes')
    loadedTabs.value.add('contracts')
    loadedTabs.value.add('orders')
    loadedTabs.value.add('statements')
    loadedTabs.value.add('activities') // ActivityList组件会自动加载
  } catch (error) {
    console.error('加载客户详情失败:', error)
    ElMessage.error('加载客户详情失败')
  } finally {
    loadingDetails.value = false
    loadingAllDetails.value = false
  }
}

// 生成时间线数据
const generateTimelineData = () => {
  const timeline: any[] = []

  // 添加商机数据
  customerOpportunities.value.forEach((opportunity) => {
    timeline.push({
      type: 'opportunity',
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      status: opportunity.stage,
      value: opportunity.value,
      probability: opportunity.probability,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      owner: opportunity.owner,
      // 查找该商机相关的活动
      activities: customerActivities.value.filter(
        (activity) =>
          activity.relatedToType === 'opportunity' && activity.relatedToId === opportunity.id,
      ),
    })
  })

  // 添加独立活动数据（不关联商机的活动）
  const independentActivities = customerActivities.value.filter(
    (activity) =>
      activity.relatedToType === 'customer' && activity.relatedToId === selectedCustomer.value?.id,
  )
  independentActivities.forEach((activity) => {
    timeline.push({
      type: 'activity',
      id: activity.id,
      title: activity.title,
      description: activity.description,
      status: activity.status,
      activityType: activity.type,
      plannedStartTime: activity.plannedStartTime,
      actualStartTime: activity.actualStartTime,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      owner: activity.owner,
      activities: [], // 独立活动没有子活动
    })
  })

  // 按时间排序（最新的在前）
  timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  timelineData.value = timeline
}

// 活动按日期分组（仅活动，不含商机卡片）
const groupedActivities = computed(() => {
  const acts = customerActivities.value || []
  const map: Record<string, any[]> = {}
  acts.forEach((a) => {
    const day = formatDateOnly(a.actualStartTime || a.plannedStartTime || a.createdAt)
    // 统一owner显示字段
    ;(a as any).ownerDisplay = getUserName(
      (a as any).owner || (a as any).ownerName || (a as any).owner_username,
    )
    if (!map[day]) map[day] = []
    map[day].push(a)
  })
  const groups = Object.keys(map)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => ({
      date,
      items: map[date].sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      ),
    }))
  return groups
})

// 获取时间线项目类型
const getTimelineItemType = (item: any) => {
  if (item.type === 'opportunity') {
    return 'primary'
  } else if (item.type === 'activity') {
    return 'success'
  }
  return 'default'
}

// 获取时间线状态类型
const getTimelineStatusType = (item: any) => {
  if (item.type === 'opportunity') {
    const statusMap: Record<string, string> = {
      lead: 'info',
      qualification: 'warning',
      proposal: 'primary',
      negotiation: 'warning',
      closed_won: 'success',
      closed_lost: 'danger',
    }
    return statusMap[item.status] || 'default'
  } else if (item.type === 'activity') {
    const statusMap: Record<string, string> = {
      planned: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
    }
    return statusMap[item.status] || 'default'
  }
  return 'default'
}

// 获取时间线状态名称
const getTimelineStatusName = (item: any) => {
  if (item.type === 'opportunity') {
    const nameMap: Record<string, string> = {
      lead: '潜在客户',
      qualification: '资格确认',
      proposal: '提案',
      negotiation: '谈判',
      closed_won: '成交',
      closed_lost: '失败',
    }
    return nameMap[item.status] || item.status
  } else if (item.type === 'activity') {
    const nameMap: Record<string, string> = {
      planned: '计划中',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return nameMap[item.status] || item.status
  }
  return item.status
}

// 获取活动类型名称
const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    call: '电话',
    meeting: '会议',
    email: '邮件',
    task: '任务',
    note: '备注',
    wechat: '微信',
  }
  return typeMap[type] || type
}

// 与活动管理列表保持一致的类型颜色映射
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    call: 'primary',
    meeting: 'success',
    email: 'info',
    task: 'warning',
    note: 'default',
    wechat: 'success',
  }
  return colorMap[type] || 'default'
}

// 获取拜访类型名称
const getVisitTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    first_visit: '首次拜访',
    follow_up: '跟进拜访',
    maintenance: '维护拜访',
    business_negotiation: '商务谈判',
    technical_support: '技术支持',
    training: '培训',
    other: '其他',
  }
  return typeMap[type] || type
}

// 获取拜访类型颜色
const getVisitTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    first_visit: 'primary',
    follow_up: 'success',
    maintenance: 'info',
    business_negotiation: 'warning',
    technical_support: 'primary',
    training: 'success',
    other: 'default',
  }
  return colorMap[type] || 'default'
}

// 获取拜访状态名称
const getVisitStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 获取拜访状态类型
const getVisitStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return typeMap[status] || 'default'
}

// 获取拜访目的名称
const getVisitPurposeName = (purpose: string) => {
  const purposeMap: Record<string, string> = {
    understand_needs: '了解需求',
    monthly_performance: '月度履约',
    performance_increment: '业绩增量',
    product_promotion: '产品推广',
    holiday_visit: '节日走访',
    contract_signing: '合同签订',
    sign_statement: '签对账单',
    price_policy: '价格政策',
    after_sales_service: '售后服务',
    negotiate_cooperation: '协商合作细节',
    understand_business: '了解客户经营状况',
    sample_tracking: '样品跟踪测试',
  }
  return purposeMap[purpose] || purpose
}

// 查看拜访详情（后续可扩展为单独详情弹窗）
const viewVisitDetail = (visit: Visit) => {
  console.debug('viewVisitDetail', visit)
}

// 打开新增拜访
const openCreateVisit = () => {
  if (!selectedCustomer.value || !selectedCustomer.value.id) {
    ElMessage.warning('请先选择客户')
    return
  }
  visitDialogTitle.value = '新增拜访'
  editingVisit.value = null
  visitDialogVisible.value = true
}

// 编辑拜访
const editVisit = (visit: Visit) => {
  visitDialogTitle.value = '编辑拜访'
  editingVisit.value = visit
  visitDialogVisible.value = true
}

// 拜访表单提交成功后刷新列表
const handleVisitFormSuccess = () => {
  visitDialogVisible.value = false
  loadVisits()
}

// 加载标签选项
const loadTagOptions = async () => {
  try {
    tagLoading.value = true
    const response = await customerTagApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      tagOptions.value = response.data.tags || []
    }
  } catch (error) {
    console.error('加载标签列表失败:', error)
  } finally {
    tagLoading.value = false
  }
}

// 获取标签名称
const getTagName = (tagId: string) => {
  const tag = tagOptions.value.find((t) => String(t.id) === String(tagId))
  return tag?.name || tagId
}

// 获取标签颜色
const getTagColor = (tagId: string) => {
  const tag = tagOptions.value.find((t) => String(t.id) === String(tagId))
  return tag?.color || undefined
}

// 编辑客户
const editCustomer = (customer: Customer) => {
  dialogTitle.value = '编辑客户'
  Object.assign(formData, {
    id: customer.id,
    name: customer.name,
    code: customer.code || '',
    type: customer.type,
    status: customer.status,
    companyName: customer.companyName || '',
    industry: customer.industry || '',
    size: customer.size || '',
    source: customer.source || '',
    level: customer.level || '',
    estimatedValue: customer.estimatedValue || 0,
    description: customer.description || '',
    province: customer.province || '',
    city: customer.city || '',
    district: customer.district || '',
    addressDetail: customer.addressDetail || '',
    ownerId: customer.ownerId ? String(customer.ownerId) : '',
    tags: customer.tags || [],
  })
  customerRegion.value = [formData.province, formData.city, formData.district].filter(
    Boolean,
  ) as string[]
  dialogVisible.value = true
}

// 删除客户
const deleteCustomer = async (customer: Customer) => {
  try {
    await ElMessageBox.confirm(`确定要删除客户"${customer.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await customerApi.delete(customer.id)
    ElMessage.success('删除成功')
    loadCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除客户失败:', error)
      ElMessage.error('删除客户失败')
    }
  }
}

// 加载负责人选项
const loadOwnerOptions = async () => {
  ownerLoading.value = true
  try {
    const memberId = currentMemberId.value
    if (!memberId) {
      ownerOptions.value = []
      return
    }

    const deptTreeRes = await getDepartmentTree()
    const departmentTree = deptTreeRes.data || []

    const findDepartmentByMember = async (depts: Department[]): Promise<Department | null> => {
      for (const dept of depts) {
        try {
          const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
          const members =
            membersRes.data?.members || membersRes.data?.items || membersRes.data || []
          if (members.some((m: Member) => String(m.id) === String(memberId))) {
            return dept
          }
        } catch (error) {
          // 忽略错误，继续遍历
        }

        if (dept.children && dept.children.length > 0) {
          const found = await findDepartmentByMember(dept.children)
          if (found) return found
        }
      }
      return null
    }

    const userDepartment = await findDepartmentByMember(departmentTree)

    if (userDepartment && userDepartment.managerId) {
      isDepartmentManager.value = String(userDepartment.managerId) === String(memberId)
    } else {
      isDepartmentManager.value = false
    }

    const currentUserOption = { id: String(memberId), name: getCurrentUserName() }

    if (!isDepartmentManager.value || !userDepartment) {
      ownerOptions.value = [currentUserOption]
      if (!formData.ownerId) {
        formData.ownerId = currentUserOption.id
      }
      return
    }

    const memberMap = new Map<string, { id: string; name: string }>()
    const collectDepartmentMembers = async (dept: Department) => {
      try {
        const membersRes = await getDepartmentMembers(dept.id, { page: 1, limit: 1000 })
        const members =
          membersRes.data?.members || membersRes.data?.items || membersRes.data || []
        members.forEach((m: Member) => {
          const id = String(m.id)
          if (!memberMap.has(id)) {
            memberMap.set(id, {
              id,
              name: m.user?.username || m.nickname || m.user?.realName || '未知用户',
            })
          }
        })
      } catch (error) {
        console.error(`获取部门 ${dept.name} 成员失败:`, error)
      }

      if (dept.children && dept.children.length > 0) {
        for (const child of dept.children) {
          await collectDepartmentMembers(child)
        }
      }
    }

    await collectDepartmentMembers(userDepartment)

    if (!memberMap.has(currentUserOption.id)) {
      memberMap.set(currentUserOption.id, currentUserOption)
    }

    ownerOptions.value = Array.from(memberMap.values())
    if (!formData.ownerId) {
      formData.ownerId = currentUserOption.id
    }
  } catch (error) {
    console.error('加载负责人列表失败:', error)
    const memberId = currentMemberId.value
    if (memberId) {
      const currentUserOption = { id: String(memberId), name: getCurrentUserName() }
      ownerOptions.value = [currentUserOption]
      if (!formData.ownerId) {
        formData.ownerId = currentUserOption.id
      }
    } else {
      ownerOptions.value = []
    }
  } finally {
    ownerLoading.value = false
  }
}

// 确保默认负责人
const ensureDefaultOwner = () => {
  // 只在新建客户且 ownerId 完全未设置时才设置默认值
  // 如果用户清除了选择（空字符串、null），则不设置默认值，保持为空（公海客户）
  const memberId = currentMemberId.value
  if (memberId && formData.ownerId === undefined && !formData.id) {
    formData.ownerId = String(memberId)
  }
}

// 跳转到创建页面
const goToCreate = () => {
  dialogTitle.value = '新建客户'
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    type: 'individual',
    status: 'lead',
    companyName: '',
    industry: '',
    size: '',
    source: '',
    level: '',
    estimatedValue: 0,
    description: '',
    province: '',
    city: '',
    district: '',
    addressDetail: '',
    ownerId: '',
    tags: [],
  })
  customerRegion.value = []
  formData.ownerId = undefined // 新建时初始化为 undefined，让 ensureDefaultOwner 决定是否设置默认值
  ensureDefaultOwner()
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true
    // 同步地区值
    formData.province = customerRegion.value?.[0] || ''
    formData.city = customerRegion.value?.[1] || ''
    formData.district = customerRegion.value?.[2] || ''

    if (formData.id) {
      // 编辑客户
      const { id, ownerId, ...updateData } = formData
      const submitData = {
        ...updateData,
        // 如果 ownerId 为空字符串，设置为 undefined（公海客户）
        ownerId: ownerId && ownerId !== '' ? Number(ownerId) : undefined,
      } as UpdateCustomerDto
      await customerApi.update(id, submitData)
      ElMessage.success('更新客户成功')
    } else {
      // 新建客户
      const { ownerId, ...createData } = formData
      const submitData = {
        ...createData,
        // 如果 ownerId 为空字符串、null 或 undefined（用户清除了选择），设置为 null（公海客户）
        // 如果 ownerId 有值，转换为数字（私海客户）
        ownerId: ownerId && ownerId !== '' ? Number(ownerId) : null,
      } as CreateCustomerDto
      await customerApi.create(submitData)
      ElMessage.success('创建客户成功')
    }

    dialogVisible.value = false
    loadCustomers()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

// 获取商机阶段名称
const getStageName = (stage: string) => {
  const stageMap: Record<string, string> = {
    initial_contact: '初步接触',
    needs_analysis: '需求分析',
    proposal_quote: '方案/报价',
    negotiation_review: '谈判审核',
    closed_won: '赢单',
    closed_lost: '输单',
  }
  return stageMap[stage] || stage
}

// 获取商机阶段类型颜色
const getStageType = (stage: string) => {
  const typeMap: Record<string, string> = {
    initial_contact: 'info',
    needs_analysis: 'warning',
    proposal_quote: 'primary',
    negotiation_review: 'warning',
    closed_won: 'success',
    closed_lost: 'danger',
  }
  return typeMap[stage] || 'default'
}

// 需求相关工具函数
const getRequirementTypeLabel = (type: RequirementType) => {
  const map: Record<RequirementType, string> = {
    [RequirementType.EXPLICIT]: '显性需求',
    [RequirementType.IMPLICIT]: '隐性需求',
    [RequirementType.INTANGIBLE]: '无形需求',
  }
  return map[type] || type
}

const getRequirementTypeTagType = (type: RequirementType) => {
  const map: Record<RequirementType, string> = {
    [RequirementType.EXPLICIT]: 'success',
    [RequirementType.IMPLICIT]: 'warning',
    [RequirementType.INTANGIBLE]: 'info',
  }
  return map[type] || ''
}

const getRequirementPriorityLabel = (priority: number) => {
  const map: Record<number, string> = {
    0: '低',
    1: '中',
    2: '高',
  }
  return map[priority] || '低'
}

const getRequirementPriorityTagType = (priority: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'danger',
  }
  return map[priority] || 'info'
}

const getRequirementStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return map[status] || status
}

const getRequirementStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    processing: 'warning',
    resolved: 'success',
    closed: '',
  }
  return map[status] || ''
}

// 获取联系人类型名称
const getContactTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    primary: '主要联系人',
    secondary: '次要联系人',
    decision_maker: '决策者',
    influencer: '影响者',
    user: '使用者',
  }
  return typeMap[type] || type
}

// 获取联系人类型颜色
const getContactTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    primary: 'success',
    secondary: 'info',
    decision_maker: 'danger',
    influencer: 'warning',
    user: 'default',
  }
  return colorMap[type] || 'default'
}

// 已上方统一通过sourceOptions与getSourceLabel定义
// 处理选择变化
const handleSelectionChange = (selection: Customer[]) => {
  selectedRows.value = selection
}

// 批量转移（设置负责人）
const transferDialogVisible = ref(false)
const transferOwnerId = ref<string>('')
const handleBatchTransfer = () => {
  if (selectedRows.value.length === 0) return
  transferOwnerId.value = ''
  transferDialogVisible.value = true
}

const confirmBatchTransfer = async () => {
  if (!transferOwnerId.value) {
    ElMessage.warning('请选择负责人')
    return
  }

  try {
    const ids = selectedRows.value.map((customer) => customer.id)
    const ownerId = Number(transferOwnerId.value)

    // 批量更新客户的负责人
    await Promise.all(ids.map(id => customerApi.update(id, { ownerId } as UpdateCustomerDto)))

    ElMessage.success(`成功将 ${ids.length} 个客户转移给负责人`)
    transferDialogVisible.value = false
    selectedRows.value = []
    loadCustomers()
  } catch (error) {
    console.error('批量转移客户失败:', error)
    ElMessage.error('批量转移客户失败')
  }
}

// 批量放入公海（清除负责人）
const handleBatchRelease = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 个客户放入公海吗？`,
      '确认放入公海',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const ids = selectedRows.value.map((customer) => customer.id)

    // 批量更新客户，清除负责人
    await Promise.all(ids.map(id => customerApi.update(id, { ownerId: null as any } as UpdateCustomerDto)))

    ElMessage.success(`成功将 ${ids.length} 个客户放入公海`)
    selectedRows.value = []
    loadCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量放入公海失败:', error)
      ElMessage.error('批量放入公海失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个客户吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const ids = selectedRows.value.map((customer) => customer.id)
    await customerApi.deleteBatch(ids)

    ElMessage.success('批量删除客户成功')
    selectedRows.value = []
    loadCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除客户失败:', error)
      ElMessage.error('批量删除客户失败')
    }
  }
}

const sourceOptions = ref<{ key: string; label: string }[]>([])
const getSourceLabel = (key?: string) =>
  sourceOptions.value.find((s) => s.key === key)?.label || key || '-'
const industryOptions = ref<{ key: string; label: string }[]>([])
const getIndustryLabel = (key?: string) =>
  industryOptions.value.find((i) => i.key === key)?.label || key || '-'
const regionOptions = ref<any[]>([])
const customerRegion = ref<string[]>([])

// 新建活动弹窗相关
const createActivityDialogVisible = ref(false)
const activityFormRef = ref<InstanceType<typeof ActivityForm>>()
const savingActivity = ref(false)

// 报价弹窗相关
const quoteDialogVisible = ref(false)
const quoteDialogTitle = ref('新增报价')
const currentQuote = ref<Quote | null>(null)

// 报价详情对话框相关
const quoteDetailDialogVisible = ref(false)
const currentQuoteId = ref<string | number>()

// 打印对话框相关
const printDialogVisible = ref(false)
const printQuoteData = ref<Quote | null>(null)
const quotePrintRef = ref<InstanceType<typeof QuotePrint>>()

// 合同对话框相关
const contractDialogVisible = ref(false)
const contractDialogTitle = ref('新增合同')
const currentContract = ref<Contract | null>(null)

// 订单对话框相关
const orderDialogVisible = ref(false)
const orderDialogTitle = ref('新增订单')
const currentOrder = ref<Order | null>(null)

// 打开新建活动弹窗
const openCreateActivityDialog = () => {
  createActivityDialogVisible.value = true
  nextTick(() => {
    activityFormRef.value?.resetForm()
  })
}

// 处理活动表单提交
const handleActivityFormSubmit = async () => {
  if (!activityFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  try {
    const success = await activityFormRef.value.submit()
    if (!success) {
      // 表单验证失败，submit 方法已经显示了错误消息
      return
    }
    // submit 事件会在 handleActivitySubmit 中处理
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('提交表单失败，请检查表单内容')
  }
}

// 处理活动提交
const handleActivitySubmit = async (data: CreateActivityDto | UpdateActivityDto | CreateActivityDto[]) => {
  try {
    savingActivity.value = true

    if (Array.isArray(data)) {
      // 多负责人：创建多条活动
      if (data.length === 0) {
        ElMessage.warning('请至少选择一个负责人')
        return
      }
      const promises = data.map((activityData) => activityApi.create(activityData))
      await Promise.all(promises)
      ElMessage.success(`成功创建 ${data.length} 条跟进记录`)
    } else {
      // 单负责人：创建一条活动
      if (!data.title || !data.title.trim()) {
        ElMessage.warning('活动标题不能为空')
        return
      }
      await activityApi.create(data as CreateActivityDto)
    ElMessage.success('跟进记录已保存')
    }

    createActivityDialogVisible.value = false
    // 重新加载活动记录
    if (selectedCustomer.value) {
      await loadCustomerDetails(selectedCustomer.value.id)
    }
  } catch (error: any) {
    console.error('保存跟进记录失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '保存失败'
    ElMessage.error(errorMessage)
  } finally {
    savingActivity.value = false
  }
}

// 活动筛选/刷新
const activityFilters = reactive<{ keyword?: string; status?: string; ownerId?: string }>({
  keyword: '',
  status: '',
  ownerId: '',
})
const activityStatusOptions = [
  { label: '计划中', value: 'planned' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]
const refreshActivities = async () => {
  await loadActivities()
}
const resetActivityFilters = async () => {
  activityFilters.keyword = ''
  activityFilters.status = ''
  activityFilters.ownerId = ''
  await loadActivities()
}

// 监听路由变化，当切换到公海或普通客户页面时重新加载数据
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 如果路由在客户相关页面之间切换，重新加载数据
    if (
      (newPath === '/customers' || newPath === '/customers/public') &&
      oldPath &&
      (oldPath === '/customers' || oldPath === '/customers/public') &&
      newPath !== oldPath
    ) {
      pagination.page = 1
      loadCustomers()
    }
  },
  { immediate: false },
)

// 初始化看板拖拽
const initKanbanSortable = () => {
  // 清理之前的实例
  sortableInstances.value.forEach((instance: any) => instance.destroy())
  sortableInstances.value = []

  // 为每个状态列创建 Sortable 实例
  statusColumns.forEach((status) => {
    const columnEl = columnRefs.value[status.value]
    if (!columnEl) return

    const columnBody = columnEl.querySelector('.kanban-column-body') as HTMLElement
    if (!columnBody) return

    const sortable = Sortable.create(columnBody, {
      group: 'kanban',
      animation: 200,
      ghostClass: 'kanban-card-ghost',
      dragClass: 'kanban-card-drag',
      forceFallback: false,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      onEnd: async (evt: any) => {
        const { from, to, item, oldIndex, newIndex } = evt

        // 确保 from 和 to 是有效的元素
        if (!from || !to || !item) {
          console.warn('拖拽事件缺少必要元素:', { from, to, item })
          return
        }

        // 获取状态信息的辅助函数
        const getStatusFromElement = (element: HTMLElement): string | null => {
          // 首先尝试从元素本身获取
          let status = element.getAttribute('data-status')
          if (status) return status

          // 如果元素有 class 'kanban-column-body'，尝试从父元素获取
          if (element.classList.contains('kanban-column-body')) {
            const parent = element.parentElement
            if (parent) {
              // 查找父元素中的状态信息
              const statusColumn = parent.querySelector('[data-status]')
              if (statusColumn) {
                return statusColumn.getAttribute('data-status')
              }
            }
          }

          // 尝试从最近的包含 data-status 的父元素获取
          let current: HTMLElement | null = element
          while (current && current !== document.body) {
            status = current.getAttribute('data-status')
            if (status) return status
            current = current.parentElement
          }

          return null
        }

        // 获取状态信息
        const fromStatus = getStatusFromElement(from as HTMLElement)
        const toStatus = getStatusFromElement(to as HTMLElement)
        const customerId = item.getAttribute('data-id')

        console.log('拖拽事件触发:', {
          fromStatus,
          toStatus,
          customerId,
          oldIndex,
          newIndex,
        })

        // 检查必要的数据
        if (!customerId) {
          console.warn('缺少客户ID，卡片元素:', item)
          return
        }

        if (!toStatus) {
          console.warn('缺少目标状态，目标元素:', to)
          return
        }

        if (fromStatus === toStatus) {
          console.log('拖拽到同一列，不需要处理')
          return
        }

        // 找到对应的客户
        const customer = customers.value.find((c) => {
          return String(c.id) === String(customerId) || c.id === customerId
        })

        if (!customer) {
          console.warn('未找到对应的客户，customerId:', customerId)
          // 恢复原位置
          if (fromStatus && oldIndex !== null) {
            const fromColumn = from
            const items = Array.from(fromColumn.children)
            if (items[oldIndex] && item.parentNode === to) {
              fromColumn.insertBefore(item, items[oldIndex])
            }
          }
          return
        }

        // 保存原始状态，用于错误恢复
        const originalStatus = customer.status

        try {
          // 更新客户状态
          console.log('调用 API 更新状态:', customerId, toStatus)
          const response = await customerApi.updateStatus(customerId, toStatus as any)
          console.log('API 响应:', response)

          if (response && (response as any).code === 200) {
            ElMessage.success('客户状态已更新')
            // 更新本地数据
            customer.status = toStatus as any
            console.log('更新成功，新状态:', toStatus)
          } else {
            console.error('API 返回错误:', response)
            throw new Error((response as any)?.message || '更新失败')
          }
        } catch (error: any) {
          console.error('更新客户状态失败:', error)

          // 恢复原位置
          if (fromStatus && oldIndex !== null && fromStatus !== toStatus) {
            const fromColumn = from
            const items = Array.from(fromColumn.children)
            if (item.parentNode === to) {
              fromColumn.insertBefore(item, items[oldIndex] || null)
            }
          }

          // 恢复本地数据
          customer.status = originalStatus

          // 显示错误消息
          const errorMessage = error?.response?.data?.message || error?.message || '更新客户状态失败'
          ElMessage.error(errorMessage)
        }
      },
    })

    sortableInstances.value.push(sortable)
  })
}

// 监听视图模式变化
watch(viewMode, (newMode) => {
  if (newMode === 'kanban') {
    // 延迟初始化，确保 DOM 已渲染
    nextTick(() => {
      initKanbanSortable()
    })
  } else {
    // 切换到列表视图时清理拖拽实例
    sortableInstances.value.forEach((instance) => instance.destroy())
    sortableInstances.value = []
  }
})

onMounted(async () => {
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  try {
    const resp = await leadApi.sources()
    sourceOptions.value = (resp as any).data || []
  } catch {}
  try {
    const resp2 = await commonApi.industries()
    industryOptions.value = (resp2 as any).data || []
  } catch {}
  try {
    const resp3 = await commonApi.regions()
    regionOptions.value = (resp3 as any).data || []
  } catch {}
  await loadOwnerOptions()
  await loadTagOptions()
  loadCustomers()

  // 如果初始是看板视图，初始化拖拽
  if (viewMode.value === 'kanban') {
    nextTick(() => {
      initKanbanSortable()
    })
  }
})

// 监听当前用户ID变化
watch(
  () => currentMemberId.value,
  (val, prev) => {
    if (val && val !== prev) {
      loadOwnerOptions()
      ensureDefaultOwner()
    }
  },
)

onUnmounted(() => {
  // 清理窗口大小监听
  window.removeEventListener('resize', handleResize)
  // 清理 Sortable 实例
  sortableInstances.value.forEach((instance: any) => instance.destroy())
  // 销毁图表实例
  if (orderAmountTrendChartInstance) {
    orderAmountTrendChartInstance.dispose()
    orderAmountTrendChartInstance = null
  }
  if (orderProductPieChartInstance) {
    orderProductPieChartInstance.dispose()
    orderProductPieChartInstance = null
  }
})

// 活动状态显示
const getActivityStatusName = (status?: string) => {
  const map: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status || ''] || '-'
}
const getActivityStatusType = (status?: string) => {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status || ''] || 'default'
}

// 活动类型图标/颜色
const getActivityTypeIcon = (type?: string) => {
  const map: Record<string, any> = {
    call: Phone,
    meeting: VideoCamera,
    email: Message,
    task: EditPen,
    note: Document,
  }
  return map[type || 'note'] || Document
}
const getActivityTypeColor = (type?: string) => {
  const map: Record<string, string> = {
    call: '#409EFF',
    meeting: '#67C23A',
    email: '#E6A23C',
    task: '#909399',
    note: '#909399',
  }
  return map[type || 'note'] || '#909399'
}

// 背景/文字颜色
const getActivityTypeBg = (type?: string) => {
  const map: Record<string, string> = {
    call: 'rgba(64,158,255,0.12)',
    meeting: 'rgba(103,194,58,0.12)',
    email: 'rgba(230,162,60,0.15)',
    task: 'rgba(144,147,153,0.15)',
    note: 'rgba(144,147,153,0.12)',
  }
  return map[type || 'note'] || 'rgba(144,147,153,0.12)'
}
const getActivityTypeTextColor = (type?: string) => getActivityTypeColor(type)

// 开始/完成
const startActivity = async (act: any) => {
  try {
    await activityApi.start(act.id)
    ElMessage.success('已开始活动')
    await refreshActivities()
  } catch (e) {
    ElMessage.error('开始失败')
  }
}
const completeDialog = reactive({ visible: false, id: '', outcome: '', content: '' })
const openCompleteDialog = (act: any) => {
  completeDialog.visible = true
  completeDialog.id = act.id
  completeDialog.outcome = ''
  completeDialog.content = ''
}
const submitComplete = async () => {
  try {
    await activityApi.complete(completeDialog.id, completeDialog.outcome)
    ElMessage.success('已完成活动')
    completeDialog.visible = false
    await refreshActivities()
  } catch (e) {
    ElMessage.error('完成失败')
  }
}

// 打开抽屉：默认切换到活动tab（ActivityList组件会自动加载）
watch(
  () => drawerVisible.value && selectedCustomer.value?.id,
  async (open) => {
    if (open) {
      activeTab.value = 'basic'
      // 绑定滚动监听，并滚动到活动记录区域
      nextTick(() => {
        if (detailContentRef.value) {
          detailContentRef.value.addEventListener('scroll', handleDetailScroll)
        }
        scrollToSection('basic')
      })
      // ActivityList组件会自动加载，不需要手动调用loadActivities()
    } else {
      // 抽屉关闭时移除滚动监听
      if (detailContentRef.value) {
        detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
      }
    }
  },
)

// 加载客户合作与信用信息
const loadCustomerProfile = async () => {
  if (!selectedCustomer.value?.id) return

  cooperationLoading.value = true
  try {
    const customerId = String(selectedCustomer.value.id)
    const response = await customerApi.getCustomerProfile(customerId)
    customerProfile.value = response.data || null

    // 初始化表单数据
    if (customerProfile.value) {
      Object.assign(cooperationForm, {
        invoiceRequirement: customerProfile.value.invoiceRequirement,
        invoiceRemark: customerProfile.value.invoiceRemark || '',
        shippingMethods: customerProfile.value.shippingMethods || [],
        mainCategoryIds: customerProfile.value.mainCategoryIds || [],
        competitorBrands: customerProfile.value.competitorBrands || [],
        creditLimit: customerProfile.value.creditLimit,
        creditTier: customerProfile.value.creditTier,
        level: selectedCustomer.value.level,
      })
    } else {
      // 如果没有profile，初始化空表单
      Object.assign(cooperationForm, {
        invoiceRequirement: undefined,
        invoiceRemark: '',
        shippingMethods: [],
        mainCategoryIds: [],
        competitorBrands: [],
        creditLimit: undefined,
        creditTier: undefined,
        level: selectedCustomer.value.level,
      })
    }

    // 加载品类选项（如果还没有加载）
    if (categoryOptions.value.length === 0) {
      await loadCategoryOptions()
    }
  } catch (error: any) {
    console.error('加载合作与信用信息失败:', error)
    ElMessage.error(error.response?.data?.message || '加载合作与信用信息失败')
  } finally {
    cooperationLoading.value = false
  }
}

// 加载品类选项
const loadCategoryOptions = async () => {
  categoryOptionsLoading.value = true
  try {
    const response = await dictionaryApi.getItems('product_category')
    categoryOptions.value = response.data || []
  } catch (error: any) {
    console.error('加载品类选项失败:', error)
  } finally {
    categoryOptionsLoading.value = false
  }
}

// 保存合作与信用信息
const saveCooperationProfile = async () => {
  if (!selectedCustomer.value?.id) return

  // 检查是否有信用信息变更（额度、档位、等级）
  const normalizeLimit = (val: any) => {
    if (val === null || val === undefined || val === '') return null
    const num = Number(val)
    return Number.isNaN(num) ? null : num
  }

  const hasLimitChange =
    normalizeLimit(cooperationForm.creditLimit) !==
    normalizeLimit(customerProfile.value?.creditLimit)

  const hasTierChange =
    (cooperationForm.creditTier || null) !== (customerProfile.value?.creditTier || null)

  const hasLevelChange =
    (cooperationForm.level || null) !== (selectedCustomer.value.level || null)
  const hasCreditChange = hasLimitChange || hasTierChange || hasLevelChange

  if (hasCreditChange) {
    // 如果有信用信息变更，需要填写变更原因
    ElMessageBox.prompt('请填写变更原因', '信用信息变更', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入变更原因',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '变更原因不能为空'
        }
        return true
      },
    })
      .then(async ({ value }) => {
        await doSaveCooperationProfile(value)
      })
      .catch(() => {
        // 用户取消
      })
  } else {
    // 没有信用信息变更，直接保存
    await doSaveCooperationProfile()
  }
}

// 执行保存操作
const doSaveCooperationProfile = async (changeReason?: string) => {
  if (!selectedCustomer.value?.id) return

  cooperationSaving.value = true
  try {
    const customerId = String(selectedCustomer.value.id)

    // 始终更新合作习惯信息（开票要求、货运方式、主要采购品类、意向竞品等）
    const profileData: CreateCustomerProfileDto = {
      invoiceRequirement: cooperationForm.invoiceRequirement,
      invoiceRemark: cooperationForm.invoiceRemark,
      shippingMethods: cooperationForm.shippingMethods,
      mainCategoryIds: cooperationForm.mainCategoryIds,
      competitorBrands: cooperationForm.competitorBrands,
      creditLimit: cooperationForm.creditLimit,
      creditTier: cooperationForm.creditTier,
    }

    if (changeReason) {
      // 有信用信息变更：先更新合作习惯信息，然后更新信用信息并记录历史
      await customerApi.updateCustomerProfile(customerId, profileData)

      const creditData: UpdateCreditInfoDto = {
        creditLimit: cooperationForm.creditLimit,
        creditTier: cooperationForm.creditTier,
        level: cooperationForm.level,
        changeReason,
      }
      await customerApi.updateCreditInfo(customerId, creditData)
    } else {
      // 只有合作习惯变更：只更新 profile，不记录历史
      await customerApi.updateCustomerProfile(customerId, profileData)
    }

    ElMessage.success('保存成功')
    cooperationEditMode.value = false
    // 重新加载数据
    await loadCustomerProfile()
    // 如果更新了客户等级，需要重新加载客户详情
    if (changeReason && cooperationForm.level !== selectedCustomer.value.level) {
      await loadCustomerDetails(selectedCustomer.value.id)
    }
  } catch (error: any) {
    console.error('保存合作与信用信息失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    cooperationSaving.value = false
  }
}

// 取消编辑
const cancelCooperationEdit = () => {
  cooperationEditMode.value = false
  // 恢复表单数据
  if (customerProfile.value) {
    Object.assign(cooperationForm, {
      invoiceRequirement: customerProfile.value.invoiceRequirement,
      invoiceRemark: customerProfile.value.invoiceRemark || '',
      shippingMethods: customerProfile.value.shippingMethods || [],
      mainCategoryIds: customerProfile.value.mainCategoryIds || [],
      competitorBrands: customerProfile.value.competitorBrands || [],
      creditLimit: customerProfile.value.creditLimit,
      creditTier: customerProfile.value.creditTier,
      level: selectedCustomer.value.level,
    })
  }
}

// 加载信用变更历史
const loadCreditHistory = async () => {
  if (!selectedCustomer.value?.id) return

  try {
    const customerId = String(selectedCustomer.value.id)
    const response = await customerApi.getCreditHistory(customerId)
    creditHistory.value = response.data || []
  } catch (error: any) {
    console.error('加载信用变更历史失败:', error)
    ElMessage.error(error.response?.data?.message || '加载信用变更历史失败')
  }
}

// 获取开票要求标签
const getInvoiceRequirementLabel = (value?: string) => {
  const map: Record<string, string> = {
    special_vat: '专票',
    normal_invoice: '普票',
    no_invoice: '不开票',
  }
  return map[value || ''] || '-'
}

// 获取货运方式标签
const getShippingMethodLabel = (value: string) => {
  const map: Record<string, string> = {
    dedicated_truck: '专车',
    logistics: '物流',
    self_pickup: '自提',
    courier: '快递',
  }
  return map[value] || value
}

// 获取品类标签
const getCategoryLabel = (categoryId: number) => {
  const category = categoryOptions.value.find((c) => c.id === categoryId)
  return category?.label || `品类${categoryId}`
}

// 获取信用额度档位标签
const getCreditTierLabel = (value?: string) => {
  const map: Record<string, string> = {
    tier_150k: '15万',
    tier_100k: '10万',
    tier_50k: '5万',
    none: '无',
  }
  return map[value || ''] || '-'
}

// 加载工商信息
const loadBusinessInfo = async () => {
  if (!selectedCustomer.value?.id || !selectedCustomer.value?.companyName) {
    console.log('[loadBusinessInfo] 客户ID或公司名称为空，跳过加载')
    businessInfo.value = null
    return
  }

  console.log('[loadBusinessInfo] 开始加载工商信息，customerId:', selectedCustomer.value.id, 'companyName:', selectedCustomer.value.companyName)
  businessInfoLoading.value = true
  try {
    const customerId = typeof selectedCustomer.value.id === 'string'
      ? parseInt(selectedCustomer.value.id)
      : selectedCustomer.value.id
    console.log('[loadBusinessInfo] 调用 getBusinessInfo API，customerId:', customerId)
    const response = await businessInfoApi.getBusinessInfo(customerId)
    console.log('[loadBusinessInfo] getBusinessInfo 返回:', {
      hasData: !!response.data,
      expired: response.expired,
    })

    // 如果没有数据但有公司名称，自动刷新
    if (!response.data && selectedCustomer.value.companyName) {
      console.log('[loadBusinessInfo] 没有缓存数据，自动触发刷新，customerId:', selectedCustomer.value.id, 'companyName:', selectedCustomer.value.companyName)
      // 自动触发刷新
      try {
        const customerId = typeof selectedCustomer.value.id === 'string'
          ? parseInt(selectedCustomer.value.id)
          : selectedCustomer.value.id
        console.log('[loadBusinessInfo] 调用 refreshBusinessInfo API，customerId:', customerId)
        const refreshResponse = await businessInfoApi.refreshBusinessInfo(customerId)
        console.log('[loadBusinessInfo] 刷新成功，返回数据:', refreshResponse.data ? '有数据' : '无数据')
        businessInfo.value = refreshResponse.data || null
        businessInfoExpired.value = false
        if (refreshResponse.data) {
          ElMessage.success('工商信息已自动刷新')
        }
      } catch (refreshError: any) {
        console.error('[loadBusinessInfo] 自动刷新工商信息失败:', refreshError)
        console.error('[loadBusinessInfo] 错误详情:', {
          message: refreshError.message,
          status: refreshError.response?.status,
          data: refreshError.response?.data,
        })
        // 显示错误信息，让用户知道发生了什么
        const errorMessage = refreshError.response?.data?.message || refreshError.message || '刷新工商信息失败'
        ElMessage.warning(`自动刷新失败: ${errorMessage}。请检查天眼查API配置或稍后手动刷新。`)
        businessInfo.value = null
        businessInfoExpired.value = false
      }
    } else {
      console.log('[loadBusinessInfo] 有缓存数据或没有公司名称，直接使用缓存数据')
      businessInfo.value = response.data || null
      businessInfoExpired.value = response.expired || false
    }
  } catch (error: any) {
    console.error('加载工商信息失败:', error)
    // 如果是404或数据不存在，不显示错误（这是正常情况）
    if (error.response?.status !== 404 && error.response?.status !== 200) {
      ElMessage.error(error.response?.data?.message || '加载工商信息失败')
    }
    businessInfo.value = null
  } finally {
    businessInfoLoading.value = false
  }
}

// 刷新工商信息
const refreshBusinessInfo = async () => {
  if (!selectedCustomer.value?.id) {
    return
  }

  businessInfoRefreshing.value = true
  try {
    const response = await businessInfoApi.refreshBusinessInfo(
      typeof selectedCustomer.value.id === 'string'
        ? parseInt(selectedCustomer.value.id)
        : selectedCustomer.value.id,
    )
    businessInfo.value = response.data || null
    businessInfoExpired.value = false
    ElMessage.success('工商信息刷新成功')
  } catch (error: any) {
    console.error('刷新工商信息失败:', error)
    ElMessage.error(error.response?.data?.message || '刷新工商信息失败')
  } finally {
    businessInfoRefreshing.value = false
  }
}

watch(activeTab, async (tab) => {
  if (!drawerVisible.value || !selectedCustomer.value?.id) return

  // 如果正在统一加载，不执行按需加载
  if (loadingAllDetails.value) return

  // 如果该tab已经加载过，不再重复加载
  // 客户图谱（graph）每次切换都要重新加载，这里排除
  if (tab !== 'graph' && loadedTabs.value.has(tab)) {
    // 如果是订单tab且切换到数据分析视图，需要更新图表
    if (tab === 'orders' && orderViewMode.value === 'analytics') {
      updateOrderCharts()
    }
    return
  }

  // 按需加载各个tab的数据（仅在统一加载未完成时作为备用）
  try {
    if (tab === 'activities') {
      // activities 由 ActivityList 组件自己处理加载，这里只标记为已加载
      loadedTabs.value.add('activities')
    } else if (tab === 'contacts') {
      await loadContacts()
      loadedTabs.value.add('contacts')
    } else if (tab === 'opportunities') {
      await loadOpportunities()
      loadedTabs.value.add('opportunities')
    } else if (tab === 'requirements') {
      await loadRequirements()
      loadedTabs.value.add('requirements')
    } else if (tab === 'visits') {
      await loadVisits()
      loadedTabs.value.add('visits')
    } else if (tab === 'quotes') {
      await loadQuotes()
      loadedTabs.value.add('quotes')
    } else if (tab === 'contracts') {
      await loadContracts()
      loadedTabs.value.add('contracts')
    } else if (tab === 'orders') {
      await loadOrders()
      updateOrderCharts()
      loadedTabs.value.add('orders')
    } else if (tab === 'statements') {
      await loadStatements()
      loadedTabs.value.add('statements')
    } else if (tab === 'business') {
      await loadBusinessInfo()
      loadedTabs.value.add('business')
    } else if (tab === 'cooperation') {
      await loadCustomerProfile()
      loadedTabs.value.add('cooperation')
    } else if (tab === 'graph') {
      // 客户图谱：每次切换都强制重新加载联系人、商机、需求数据
      await loadContacts()
      await loadOpportunities()
      await loadRequirements()
    }
  } catch (error: any) {
    console.error(`加载${tab}数据失败:`, error)
    // 加载失败时不标记为已加载，允许重试
  }
})

// 监听订单视图模式变化
watch(orderViewMode, () => {
  if (orderViewMode.value === 'analytics') {
    updateOrderCharts()
  }
})

// 监听订单数据变化
watch(customerOrders, () => {
  if (orderViewMode.value === 'analytics') {
    updateOrderCharts()
  }
})

// 监听周期变化
watch(orderAnalyticsPeriod, () => {
  if (orderViewMode.value === 'analytics') {
    updateOrderCharts()
  }
})

const loadActivities = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await activityApi.getList({
      relatedToType: 'customer',
      relatedToId: selectedCustomer.value.id,
      page: 1,
      limit: 100,
      title: activityFilters.keyword || undefined,
      status: activityFilters.status || undefined,
      ownerId: activityFilters.ownerId || undefined,
    } as any)
    const list = (resp as any).data?.activities || (resp as any).data || []
    // 统一owner结构，兼容 owner.username | owner.nickname | owner.name
    customerActivities.value = list.map((a: any) => ({
      ...a,
      ownerId: a.ownerId || a.owner?.id,
      owner: a.owner
        ? {
            id: a.owner.id,
            username:
              a.owner.username ||
              a.owner.nickname ||
              a.owner.name ||
              a.ownerUsername ||
              a.ownerName ||
              '-',
          }
        : a.ownerUsername || a.ownerName
          ? { id: a.ownerId || undefined, username: a.ownerUsername || a.ownerName }
          : null,
    }))
  } catch (e) {}
}

const loadContacts = async () => {
  if (!selectedCustomer.value) return
  try {
    // 使用层级树接口获取联系人
    const resp = await request.get(`/contacts/customer/${selectedCustomer.value.id}/hierarchy`)
    const contacts = (resp as any).data?.contacts || (resp as any).data || []
    customerContacts.value = contacts
    // 构建树形数据
    contactTreeData.value = buildContactTree(contacts)
  } catch (e) {
    console.error('加载联系人失败:', e)
    // 降级到普通列表接口
    try {
    const resp = await request.get(`/contacts/customer/${selectedCustomer.value.id}`)
      const contacts = (resp as any).data?.contacts || (resp as any).data || []
      customerContacts.value = contacts
      contactTreeData.value = buildContactTree(contacts)
    } catch (e2) {
      console.error('加载联系人失败:', e2)
      customerContacts.value = []
      contactTreeData.value = []
    }
  }
}

// 联系人树形数据
const contactTreeData = ref<any[]>([])

// 构建联系人树形结构（如果后端没有返回树形结构）
const buildContactTree = (contacts: any[]): any[] => {
  if (!contacts || contacts.length === 0) return []

  // 如果已经是树形结构（有 children），直接返回
  if (contacts.some(c => c.children)) {
    return contacts
  }

  // 构建树形结构
  const contactMap = new Map()
  const roots: any[] = []

  // 初始化所有联系人
  contacts.forEach(contact => {
    contactMap.set(contact.id, { ...contact, children: [] })
  })

  // 构建树
  contacts.forEach(contact => {
    const node = contactMap.get(contact.id)
    if (contact.parentId && contactMap.has(contact.parentId)) {
      const parent = contactMap.get(contact.parentId)
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

// 展平联系人树形数据为列表
const flattenContactTree = (treeData: any[]): any[] => {
  const result: any[] = []
  const traverse = (nodes: any[], level: number = 0) => {
    nodes.forEach((node) => {
      // 创建展平后的节点，保留层级信息
      const flatNode = { ...node, level, children: undefined }
      result.push(flatNode)
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children, level + 1)
      }
    })
  }
  traverse(treeData)
  return result
}

// 联系人列表数据（展平后的树形数据）
const contactListData = computed(() => {
  if (contactTreeData.value.length === 0) return []
  return flattenContactTree(contactTreeData.value)
})

// 监听窗口大小变化，重新调整图表
const handleResize = () => {
  handleOrderChartsResize()
}

const loadOpportunities = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await request.get('/opportunities', {
      params: { customerId: selectedCustomer.value.id, page: 1, limit: 100 },
    })
    customerOpportunities.value = (resp as any).data?.opportunities || (resp as any).data || []

    // 加载商机后，如果有活动数据，重新生成时间线
    if (customerActivities.value.length > 0) {
      generateTimelineData()
    }
  } catch (e) {
    console.error('加载商机失败:', e)
  }
}

// 商机对话框相关
const opportunityDialogVisible = ref(false)
const opportunityDialogTitle = ref('新增商机')
const currentOpportunity = ref<Opportunity | null>(null)

// 新增商机
const openCreateOpportunity = () => {
  opportunityDialogTitle.value = '新增商机'
  currentOpportunity.value = null
  opportunityDialogVisible.value = true
}

// 编辑商机
const openEditOpportunity = async (opportunity: Opportunity) => {
  try {
    const response = await opportunityApi.getDetail(opportunity.id) as unknown as {
      code: number
      data?: Opportunity
    }
    if (response.code === 200 && response.data) {
      opportunityDialogTitle.value = '编辑商机'
      currentOpportunity.value = response.data
      opportunityDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取商机详情失败:', error)
    ElMessage.error('获取商机详情失败')
  }
}

// 处理商机提交成功
const handleOpportunitySuccess = async () => {
  // 重新加载商机列表
  await loadOpportunities()
}

// 删除商机
const deleteOpportunity = async (opportunity: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除商机"${opportunity.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await opportunityApi.delete(opportunity.id)
    ElMessage.success('删除成功')
    loadOpportunities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商机失败:', error)
      ElMessage.error('删除商机失败')
    }
  }
}


// 报价相关
const loadQuotes = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await quoteApi.getList({
      customerId: Number(selectedCustomer.value.id),
      page: 1,
      limit: 100,
    })
    customerQuotes.value = (resp as any).data?.quotes || (resp as any).data || []
  } catch (e) {
    console.error('加载报价失败:', e)
  }
}

// 获取报价状态名称
const getQuoteStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_approval: '审批中',
    approved: '已审批通过',
    active: '已生效',
    rejected: '已拒绝',
    sent: '已发送',
    accepted: '已接受',
    expired: '已过期',
  }
  return statusMap[status] || status
}

// 获取报价状态类型
const getQuoteStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    pending_approval: 'warning',
    approved: 'success',
    active: 'success',
    rejected: 'danger',
    sent: 'warning',
    accepted: 'success',
    expired: 'default',
  }
  return typeMap[status] || 'default'
}

// 新增报价
const openCreateQuote = async () => {
  quoteDialogTitle.value = '新增报价'
  currentQuote.value = null
  quoteDialogVisible.value = true
}

// 编辑报价
const openEditQuote = async (quote: Quote) => {
  try {
    const response = await quoteApi.getDetail(quote.id)
    if (response.code === 200) {
      quoteDialogTitle.value = '编辑报价'
      currentQuote.value = response.data
      quoteDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取报价详情失败:', error)
    ElMessage.error('获取报价详情失败')
  }
}

// 处理报价提交成功
const handleQuoteSuccess = async () => {
  // 重新加载报价列表
  if (selectedCustomer.value) {
    await loadQuotes()
  }
}

// 查看报价
const viewQuote = async (row: Quote) => {
  currentQuoteId.value = row.id
  quoteDetailDialogVisible.value = true
}

// 处理报价编辑
const handleQuoteEdit = (quote: Quote) => {
  openEditQuote(quote)
}

// 处理报价更新
const handleQuoteUpdated = () => {
  loadQuotes()
}

// 打印报价
const printQuote = async (row: Quote) => {
  try {
    // 加载完整的报价详情（包含明细）
    const response = await quoteApi.getDetail(row.id)
    if (response.code === 200 && response.data) {
      printQuoteData.value = response.data
      printDialogVisible.value = true
    } else {
      ElMessage.error('加载报价详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载报价详情失败')
  }
}

// 执行打印
const handlePrint = () => {
  nextTick(() => {
    if (quotePrintRef.value) {
      quotePrintRef.value.print()
    }
  })
}

// 从报价创建合同
const createContractFromQuote = async (row: Quote) => {
  try {
    await ElMessageBox.confirm('确定要从该报价创建合同吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const response = await contractApi.createFromQuote(row.id)
    if (response.code === 201) {
      ElMessage.success('合同创建成功')
      // 刷新合同列表
      if (selectedCustomer.value) {
        await loadContracts()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建合同失败:', error)
      ElMessage.error('创建合同失败')
    }
  }
}

// 删除报价
const deleteQuote = async (quote: Quote) => {
  try {
    await ElMessageBox.confirm(`确定要删除报价单"${quote.quoteNumber}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await quoteApi.delete(quote.id)
    ElMessage.success('删除成功')
    loadQuotes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报价失败:', error)
      ElMessage.error('删除报价失败')
    }
  }
}

// 合同相关
const loadContracts = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await contractApi.getList({
      customerId: Number(selectedCustomer.value.id),
      page: 1,
      limit: 100,
    })
    customerContracts.value = (resp as any).data?.contracts || (resp as any).data || []
  } catch (e) {
    console.error('加载合同失败:', e)
  }
}

// 获取合同类型名称
const getContractTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    sales: '销售合同',
    service: '服务合同',
    maintenance: '维护合同',
    other: '其他',
  }
  return typeMap[type] || type
}

// 获取合同类型标签类型
const getContractTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    sales: 'primary',
    service: 'success',
    maintenance: 'warning',
    other: 'info',
  }
  return typeMap[type] || 'info'
}

// 获取合同状态名称
const getContractStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_sign: '待签约',
    signed: '已签约',
    active: '生效中',
    expired: '已过期',
    terminated: '已终止',
  }
  return statusMap[status] || status
}

// 获取合同状态标签类型
const getContractStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    pending_sign: 'warning',
    signed: 'success',
    active: 'primary',
    expired: 'info',
    terminated: 'danger',
  }
  return typeMap[status] || 'info'
}

// 新增合同
const openCreateContract = async () => {
  contractDialogTitle.value = '新增合同'
  currentContract.value = null
  contractDialogVisible.value = true
}

// 编辑合同
const openEditContract = async (contract: Contract) => {
  try {
    const response = await contractApi.getDetail(contract.id)
    if (response.code === 200) {
      contractDialogTitle.value = '编辑合同'
      currentContract.value = response.data
      contractDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取合同详情失败:', error)
    ElMessage.error('获取合同详情失败')
  }
}

// 处理合同提交成功
const handleContractSuccess = async () => {
  // 重新加载合同列表
  await loadContracts()
}

// 删除合同
const deleteContract = async (contract: Contract) => {
  try {
    await ElMessageBox.confirm(`确定要删除合同"${contract.contractNumber}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await contractApi.delete(contract.id)
    ElMessage.success('删除成功')
    loadContracts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除合同失败:', error)
      ElMessage.error('删除合同失败')
    }
  }
}

// 订单相关
const loadOrders = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await orderApi.getList({
      customerId: Number(selectedCustomer.value.id),
      page: 1,
      limit: 1000, // 增加限制以获取所有订单用于数据分析
    })
    const orders = (resp as any).data?.orders || (resp as any).data || []
    // 加载每个订单的详情以获取订单项
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        try {
          const detailResp = await orderApi.getDetail(order.id)
          return detailResp.data || order
        } catch {
          return order
        }
      })
    )
    customerOrders.value = ordersWithItems
  } catch (e) {
    console.error('加载订单失败:', e)
  }
}

// 获取订单状态名称
const getOrderStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 获取订单状态标签类型
const getOrderStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    confirmed: 'warning',
    processing: 'primary',
    shipped: 'success',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return typeMap[status] || 'info'
}

// 新增订单
const openCreateOrder = async () => {
  orderDialogTitle.value = '新增订单'
  currentOrder.value = null
  orderDialogVisible.value = true
}

// 编辑订单
const openEditOrder = async (order: Order) => {
  try {
    const response = await orderApi.getDetail(order.id)
    if (response.code === 200) {
      orderDialogTitle.value = '编辑订单'
      currentOrder.value = response.data
      orderDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 处理订单提交成功
const handleOrderSuccess = async () => {
  // 重新加载订单列表
  await loadOrders()
}

// 删除订单
const deleteOrder = async (order: Order) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单"${order.orderNumber}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await orderApi.delete(order.id)
    ElMessage.success('删除成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除订单失败:', error)
      ElMessage.error('删除订单失败')
    }
  }
}

// 对账相关
// 生成mock对账交易数据
const generateMockTransactions = (startMonth: string, endMonth: string) => {
  const transactions: any[] = []
  const [startYear, startM] = startMonth.split('-').map(Number)
  const [endYear, endM] = endMonth.split('-').map(Number)

  let currentYear = startYear
  let currentMonth = startM
  let balance = 600000 // 初始余额

  // 生成每个月的交易数据
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endM)
  ) {
    const monthTransactions: any[] = []
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const transactionCount = Math.floor(Math.random() * 8) + 5 // 每月5-12笔交易

    for (let i = 0; i < transactionCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1
      const date = new Date(currentYear, currentMonth - 1, day)

      const isDebit = Math.random() > 0.4 // 60%概率是借方
      const amount = Math.floor(Math.random() * 200000) + 10000

      if (isDebit) {
        balance += amount
      } else {
        balance -= amount
      }

      const summaries = [
        '扫码收款',
        '沧州捷锐克磨具有限公司 电汇',
        '沧州捷锐克磨具有限公司-农行转账',
        '银行转账',
        '现金收款',
        '支票收款',
        '其他收款',
      ]
      const summary = summaries[Math.floor(Math.random() * summaries.length)]

      const instanceCode = `TRJVZ${currentYear}${String(currentMonth).padStart(2, '0')}${String(day).padStart(2, '0')}${String(i).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

      monthTransactions.push({
        id: `trans_${currentYear}_${currentMonth}_${i}`,
        date: date.toISOString(),
        instanceCode,
        summary,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        dcType: isDebit ? '借' : '贷',
        balance,
        isPeriodTotal: false,
      })
    }

    // 按日期排序
    monthTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 计算本期合计
    const periodDebit = monthTransactions.reduce((sum, t) => sum + t.debit, 0)
    const periodCredit = monthTransactions.reduce((sum, t) => sum + t.credit, 0)

    // 添加本期合计行
    monthTransactions.push({
      id: `period_total_${currentYear}_${currentMonth}`,
      date: '',
      instanceCode: '',
      summary: '本期合计',
      debit: periodDebit,
      credit: periodCredit,
      dcType: '',
      balance: balance,
      isPeriodTotal: true,
      periodLabel: '本期合计',
    })

    transactions.push(...monthTransactions)

    // 移动到下一个月
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return transactions
}

// 加载对账单
const loadStatements = async () => {
  if (!selectedCustomer.value) return

  try {
    // 如果没有选择期间，默认显示最近3个月
    if (!statementPeriod.value) {
      const now = new Date()
      const endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
      statementPeriod.value = [startMonth, endMonth]
    }

    const [startMonth, endMonth] = statementPeriod.value

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 300))
    statementTransactions.value = generateMockTransactions(startMonth, endMonth)
  } catch (e) {
    console.error('加载对账单失败:', e)
    statementTransactions.value = []
  }
}

// 按月份分组交易数据
const groupedTransactions = computed(() => {
  const groups: Array<{ month: string; items: any[] }> = []
  let currentMonth = ''
  let currentGroup: any[] = []

  statementTransactions.value.forEach((item) => {
    if (item.isPeriodTotal) {
      // 本期合计行，添加到当前组
      currentGroup.push(item)
      groups.push({ month: currentMonth, items: [...currentGroup] })
      currentGroup = []
    } else {
      const itemMonth = item.date ? item.date.substring(0, 7) : ''
      if (itemMonth !== currentMonth) {
        // 新月份，保存上一组并开始新组
        if (currentGroup.length > 0) {
          groups.push({ month: currentMonth, items: [...currentGroup] })
        }
        currentMonth = itemMonth
        currentGroup = [item]
      } else {
        currentGroup.push(item)
      }
    }
  })

  // 添加最后一组
  if (currentGroup.length > 0) {
    groups.push({ month: currentMonth, items: currentGroup })
  }

  return groups
})

// 截断实例编码显示
const truncateCode = (code: string) => {
  if (!code) return '-'
  if (code.length > 20) {
    return code.substring(0, 20) + '...'
  }
  return code
}


// 需求相关
const loadRequirements = async () => {
  if (!selectedCustomer.value) return
  try {
    const customerId = typeof selectedCustomer.value.id === 'string'
      ? parseInt(selectedCustomer.value.id)
      : selectedCustomer.value.id
    const resp = await customerRequirementApi.getByCustomer(customerId)
    customerRequirements.value = (resp as any).data || []
  } catch (error: any) {
    console.error('加载需求失败:', error)
    ElMessage.error('加载需求失败')
  }
}

// 拜访记录相关
const loadVisits = async () => {
  if (!selectedCustomer.value) return
  try {
    const customerId = typeof selectedCustomer.value.id === 'string'
      ? parseInt(selectedCustomer.value.id)
      : selectedCustomer.value.id
    const resp = await visitApi.getByCustomer(customerId)
    customerVisits.value = (resp as any).data || []
  } catch (error: any) {
    console.error('加载拜访记录失败:', error)
    ElMessage.error('加载拜访记录失败')
  }
}

// （已改用 vue3-tree-org，这里废弃 SimpleMindMap 相关逻辑）

const requirementFormRef = ref()
const requirementForm = reactive({
  id: undefined as number | undefined,
  customerId: 0,
  type: RequirementType.EXPLICIT,
  content: '',
  problemToSolve: '',
  tags: [] as string[],
  priority: 0,
  status: 'pending',
  notes: '',
})
const requirementRules = {
  content: [{ required: true, message: '请输入需求内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择需求类型', trigger: 'change' }],
}
const requirementDialog = reactive({ visible: false, title: '', saving: false })

// 常用标签
const commonRequirementTags = [
  '价格便宜',
  '质量稳定',
  '长账期',
  '技术支持',
  '售后服务',
  '新产品',
  '新技术',
  '行业需求',
  '业务需求',
  '资质使用',
  '法务需求',
  '管理需求',
  '利益需求',
]

// 新增需求
const openCreateRequirement = () => {
  requirementDialog.visible = true
  requirementDialog.title = '新增需求'
  Object.assign(requirementForm, {
    id: undefined,
    customerId: typeof selectedCustomer.value?.id === 'string' ? parseInt(selectedCustomer.value.id) : selectedCustomer.value?.id || 0,
    type: RequirementType.EXPLICIT,
    content: '',
    problemToSolve: '',
    tags: [],
    priority: 0,
    status: 'pending',
    notes: '',
  })
  if (requirementFormRef.value) requirementFormRef.value.clearValidate?.()
}

// 编辑需求
const openEditRequirement = (requirement: CustomerRequirement) => {
  requirementDialog.visible = true
  requirementDialog.title = '编辑需求'
  Object.assign(requirementForm, {
    id: requirement.id,
    customerId: requirement.customerId,
    type: requirement.type,
    content: requirement.content,
    problemToSolve: requirement.problemToSolve || '',
    tags: requirement.tags || [],
    priority: requirement.priority,
    status: requirement.status,
    notes: requirement.notes || '',
  })
  if (requirementFormRef.value) requirementFormRef.value.clearValidate?.()
}

// 删除需求
const deleteRequirement = async (requirement: CustomerRequirement) => {
  try {
    await ElMessageBox.confirm(`确定要删除该需求吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await customerRequirementApi.delete(requirement.id)
    ElMessage.success('删除成功')
    await loadCustomerDetails(selectedCustomer.value!.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除需求失败:', error)
      ElMessage.error('删除需求失败')
    }
  }
}

// 提交需求
const submitRequirement = async () => {
  if (!requirementFormRef.value) return

  try {
    await requirementFormRef.value.validate()
    requirementDialog.saving = true

    const payload = {
      customerId: requirementForm.customerId,
      type: requirementForm.type,
      content: requirementForm.content,
      problemToSolve: requirementForm.problemToSolve,
      tags: requirementForm.tags,
      priority: requirementForm.priority,
      status: requirementForm.status,
      notes: requirementForm.notes,
    }

    if (requirementForm.id) {
      // 编辑需求
      await customerRequirementApi.update(requirementForm.id, payload)
      ElMessage.success('更新需求成功')
    } else {
      // 新建需求
      await customerRequirementApi.create(payload)
      ElMessage.success('创建需求成功')
    }

    requirementDialog.visible = false
    await loadRequirements()
  } catch (error: any) {
    console.error('提交需求失败:', error)
    ElMessage.error(error.message || '操作失败，请稍后重试')
  } finally {
    requirementDialog.saving = false
  }
}

// 新增联系人
const openCreateContact = async () => {
  contactDialog.title = '新建联系人'
  contactDialog.visible = true
  Object.assign(contactForm, {
    id: '',
    name: '',
    position: '',
    department: '',
    type: 'secondary',
    email: '',
    phone: '',
    telephone: '',
    customerId: selectedCustomer.value?.id || '',
    isPrimary: false,
    remark: '',
    parentId: undefined,
  })

  // 加载该客户下的其他联系人（用于上级联系人选择）
  if (selectedCustomer.value?.id) {
    await loadParentContactOptions(selectedCustomer.value.id)
  }

  if (contactFormRef.value) contactFormRef.value.clearValidate?.()
}

// 编辑联系人
const openEditContact = async (contact: any) => {
  contactDialog.title = '编辑联系人'
  contactDialog.visible = true
  Object.assign(contactForm, {
    id: contact.id,
    name: contact.name,
    position: contact.position || '',
    department: contact.department || '',
    type: contact.type || 'secondary',
    email: contact.email || '',
    phone: contact.phone || '',
    telephone: contact.telephone || '',
    customerId: selectedCustomer.value?.id || contact.customerId || '',
    isPrimary: !!contact.isPrimary,
    remark: contact.remark || contact.notes || '',
    parentId: contact.parentId || undefined,
  })

  // 加载该客户下的其他联系人（排除自己，用于上级联系人选择）
  const customerId = selectedCustomer.value?.id || contact.customerId
  if (customerId) {
    await loadParentContactOptions(customerId, contact.id)
  }

  if (contactFormRef.value) contactFormRef.value.clearValidate?.()
}

// 加载上级联系人选项
const loadParentContactOptions = async (customerId: string | number, excludeId?: string) => {
  try {
    const resp = await request.get(`/contacts/customer/${customerId}`)
    const contacts = (resp as any).data?.contacts || (resp as any).data || []
    // 排除当前编辑的联系人自己
    parentContactOptionsForDialog.value = excludeId
      ? contacts.filter((c: any) => c.id !== excludeId)
      : contacts
  } catch (e) {
    console.error('加载上级联系人选项失败:', e)
    parentContactOptionsForDialog.value = []
  }
}

// 删除联系人
const deleteContact = async (contact: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除联系人"${contact.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await contactApi.delete(contact.id)
    ElMessage.success('删除联系人成功')
    loadContacts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除联系人失败:', error)
      ElMessage.error('删除联系人失败')
    }
  }
}

// 新增/编辑联系人对话框
const contactDialog = reactive({ visible: false, title: '', saving: false })
const contactFormRef = ref()
const contactForm = reactive({
  id: '',
  name: '',
  position: '',
  department: '',
  type: 'secondary',
  email: '',
  phone: '',
  telephone: '',
  customerId: '',
  isPrimary: false,
  remark: '',
  parentId: undefined as number | undefined,
})
const contactRules = {
  name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^[0-9]{6,20}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择关联客户', trigger: 'change' }],
}
const submitContact = async () => {
  if (!contactFormRef.value) return

  try {
    await contactFormRef.value.validate()
    contactDialog.saving = true

    if (contactForm.id) {
      // 编辑联系人（不传 customerId，且不传 id；remark 映射为 notes）
      const updateData: any = {
        name: contactForm.name,
        position: contactForm.position || undefined,
        department: contactForm.department || undefined,
        email: contactForm.email || undefined,
        phone: contactForm.phone || undefined,
        telephone: contactForm.telephone || undefined,
        type: contactForm.type || undefined,
        isPrimary: contactForm.isPrimary,
        notes: contactForm.remark || undefined,
        parentId: contactForm.parentId,
      }
      await contactApi.update(contactForm.id, updateData)
      ElMessage.success('更新联系人成功')
    } else {
      // 新建联系人（不传 id；remark -> notes；必须传 customerId）
      const createData: any = {
        name: contactForm.name,
        position: contactForm.position || undefined,
        department: contactForm.department || undefined,
        parentId: contactForm.parentId,
        email: contactForm.email || undefined,
        phone: contactForm.phone || undefined,
        telephone: contactForm.telephone || undefined,
        type: contactForm.type || 'secondary',
        isPrimary: !!contactForm.isPrimary,
        notes: contactForm.remark || undefined,
        customerId: selectedCustomer.value?.id,
      }
      await contactApi.create(createData)
      ElMessage.success('创建联系人成功')
    }

    contactDialog.visible = false
    loadContacts()
  } catch (error) {
    console.error('提交联系人失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    contactDialog.saving = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.customer-management {
  @extend .table-page;
}

// 客户详情弹框样式
.customer-detail-dialog {
  .customer-detail-content {
    max-height: 70vh;
    overflow-y: auto;
  }

  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4e7ed;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }

  .info-item {
    display: flex;
    align-items: flex-start;

    &.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-weight: 500;
      color: #606266;
      min-width: 100px;
      margin-right: 8px;
    }

    span {
      color: #303133;
      flex: 1;
    }
  }

  .description-text {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    color: #606266;
    line-height: 1.6;
    margin-top: 8px;
  }

  .empty-timeline {
    text-align: center;
    padding: 40px 0;
  }

  .timeline-container {
    .timeline-card {
      margin-bottom: 8px;
      border: 1px solid #e4e7ed;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &.opportunity-card {
        border-left: 4px solid #409eff;
      }

      &.activity-card {
        border-left: 4px solid #67c23a;
      }
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .timeline-title {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #303133;
    }

    .timeline-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .timeline-description {
      color: #606266;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .timeline-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #909399;

      span {
        display: inline-flex;
        align-items: center;
      }
    }

    .timeline-type {
      font-weight: 500;
      color: #409eff;
    }

    .timeline-value {
      color: #67c23a;
    }

    .timeline-probability {
      color: #e6a23c;
    }

    .timeline-activity-type {
      color: #909399;
    }

    .timeline-owner {
      color: #606266;
    }

    // 商机下的活动列表样式
    .opportunity-activities {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;

      .activities-header {
        margin-bottom: 12px;

        .activities-title {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }
      }

      .activities-list {
        .activity-item {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .activity-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .activity-icon {
              margin-right: 6px;
              font-size: 14px;
              color: #67c23a;
            }

            .activity-title {
              flex: 1;
              font-weight: 500;
              color: #303133;
              margin-right: 8px;
            }
          }

          .activity-description {
            color: #606266;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 8px;
          }

          .activity-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 11px;
            color: #909399;

            span {
              display: inline-flex;
              align-items: center;
            }
          }
        }
      }
    }
  }
}

// 抽屉样式
.customer-detail {
  padding: 0;
  position: relative;

  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-card {
      border: 1px solid #ebeef5;
      border-radius: 4px;

      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid #ebeef5;
        background-color: #fafafa;
      }

      :deep(.el-card__body) {
        padding: 20px;
      }

      // 客户图谱卡片不需要 body padding
      &.graph-content {
        :deep(.el-card__body) {
          padding: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .info-item {
      display: flex;
      align-items: flex-start;

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 500;
        color: #606266;
        min-width: 80px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      span {
        color: #303133;
        word-break: break-all;
      }

      .customer-name {
        font-size: 16px;
        font-weight: 600;
        color: #409eff;
      }

      .estimated-value {
        font-weight: 600;
        color: #67c23a;
      }

      .description {
        color: #606266;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }

  .timeline-container {
    max-height: 500px;
    overflow-y: auto;

    .empty-timeline {
      text-align: center;
      padding: 40px 0;
      color: #909399;
    }
  }

  // 分组活动样式
  .activity-groups {
    max-height: 500px;
    overflow-y: auto;
    .activity-group {
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      &.bg-even {
        background: #f8fafc;
      }
      &.bg-odd {
        background: #f5f7fa;
      }
      .group-header {
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }
      .group-items {
        .group-item {
          background: #fff;
          border: 1px solid #ebeef5;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 8px;
          .line1 {
            display: flex;
            gap: 12px;
            color: #303133;
            font-weight: 500;
          }
          .line2 {
            color: #909399;
            font-size: 12px;
            margin-top: 4px;
          }
          .line3 {
            color: #606266;
            margin-top: 4px;
          }
        }
      }
    }
  }

  // 商机列表样式
  .opportunities-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .opportunity-card {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
      }

      .opportunity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .opportunity-title {
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: #303133;

          .opportunity-icon {
            margin-right: 8px;
            color: #409eff;
          }
        }
      }

      .opportunity-description {
        color: #606266;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .opportunity-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;

        .meta-item {
          display: flex;
          align-items: center;

          .meta-label {
            font-weight: 500;
            color: #909399;
            margin-right: 4px;
            min-width: 60px;
          }

          .meta-value {
            color: #303133;
            font-weight: 500;
          }
        }
      }
    }
  }

  // 联系人列表样式
  .contacts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .contact-card {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
      }

      .contact-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .contact-name {
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: #303133;

          .contact-icon {
            margin-right: 8px;
            color: #67c23a;
          }

          .primary-tag {
            margin-left: 8px;
          }
        }
      }

      .contact-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;

        .contact-item {
          display: flex;
          align-items: center;

          .contact-label {
            font-weight: 500;
            color: #909399;
            margin-right: 4px;
            min-width: 50px;
          }

          .contact-value {
            color: #303133;
          }
        }
      }
    }
  }

  .empty-section {
    text-align: center;
    padding: 40px 0;
    color: #909399;
  }

  // 客户头部样式

  // 标签页样式
  .customer-tabs {
    .el-tabs__header {
      margin: 0 0 20px 0;
    }

    .el-tabs__content {
      padding: 0;
    }
  }
}
  // 思维导图容器样式
  .contact-mindmap-view {
    width: 100%;
    height: 600px;
    min-height: 500px;
    background: #fff;
    border-radius: 4px;
    overflow: hidden;

    .mindmap-container {
      width: 100%;
      height: 100%;
    }
  }

  // 联系人树形组件样式
  .contact-tree {
    :deep(.el-tree-node) {
      margin-bottom: 8px;
    }

    :deep(.el-tree-node__content) {
      height: auto;
      min-height: 48px;
      padding: 8px 0;
    }

    .contact-tree-node {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f7fa;
      }

      .contact-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .contact-name {
          font-weight: 500;
          font-size: 14px;
          color: #303133;
        }

        .contact-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #909399;

          .meta-item {
            padding: 2px 8px;
            background: #f4f5f7;
            border-radius: 3px;
          }
        }
      }

      .contact-actions {
        display: flex;
        gap: 8px;
        margin-left: 16px;
      }
    }
  }

  // 订单工具栏样式
  // 工具栏在 list-padding 内，不需要额外样式

  // 数据分析视图样式（现在在 list-padding 内）
  .analytics-content {
    display: flex;
    flex-direction: column;
    gap: 24px; // 图表之间的间距，确保图表卡片之间有明显的间隔

    // 确保每个图表容器都有正确的样式
    .chart-container {
      flex-shrink: 0; // 防止图表被压缩
    }

    .chart-container {
      // 每个图表使用独立的卡片样式
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      // 移除所有 margin，使用 gap 控制间距
        margin: 0;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .chart-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }
      }
    }

  // 对账内容样式
  .statement-content {
    padding: 0;
    background: #fff;
      display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    flex: 1;
    min-height: 0;

    .statement-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 4px;
      flex-shrink: 0;
      margin-left: 0;
      margin-right: 0;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .toolbar-label {
      font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
      }
    }

    // 当toolbar在card header中时的样式
    .section-card {
      :deep(.el-card__header) {
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .toolbar-label {
            font-size: 14px;
            color: #606266;
        font-weight: 500;
          }
        }
      }
    }

    .statement-table-wrapper {
      flex: 1;
      overflow: auto;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      min-height: 0;
    }

    .statement-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      background: #fff;

      thead {
        background: #f5f7fa;
        position: sticky;
        top: 0;
        z-index: 10;

        th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #303133;
          border-bottom: 1px solid #ebeef5;
          white-space: nowrap;
          background: #f5f7fa;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #ebeef5;
          transition: background-color 0.2s;

          &:hover {
            background-color: #f5f7fa;
          }

          &.period-total {
            background-color: #f0f2f5;
            font-weight: 600;

            &:hover {
              background-color: #e4e7ed;
            }

            .period-total-label {
              color: #303133;
              font-weight: 600;
            }
          }

          td {
            padding: 12px 16px;
            color: #606266;
            border-right: 1px solid #ebeef5;

            &:last-child {
              border-right: none;
            }
          }
        }
      }

      .col-date {
        width: 120px;
        min-width: 120px;
      }

      .col-code {
        width: 200px;
        min-width: 200px;

        .instance-code-link {
          display: flex;
          align-items: center;
          color: #409eff;
    cursor: pointer;
          text-decoration: none;

    &:hover {
            text-decoration: underline;
          }
        }
      }

      .col-summary {
        width: 250px;
        min-width: 250px;
      }

      .col-debit,
      .col-credit,
      .col-balance {
        width: 150px;
        min-width: 150px;
        font-family: 'Courier New', monospace;
      }

      .col-dc {
        width: 80px;
        min-width: 80px;
        text-align: center;
      }
  }
}

// 看板视图样式
.kanban-section {
  padding: 0 20px;
  flex: 1;
    display: flex;
    flex-direction: column;
  overflow: hidden;
}

.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  padding-bottom: 16px;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.kanban-column {
  flex: 0 0 260px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.kanban-column-header {
  padding: 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;

  .status-name {
    color: #303133;
  }
}

.kanban-column-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 200px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.kanban-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
      margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.kanban-card-ghost {
  opacity: 0.5;
  background: #e4e7ed;
}

/* 客户图谱（vue3-tree-org）节点颜色区分 */
:deep(.tree-org-node__inner.org-node-root .tree-org-node__text) {
  font-weight: 600;
  color: #303133;
}

:deep(.tree-org-node__inner.org-node-category .tree-org-node__text) {
  font-weight: 600;
  color: #606266;
}

:deep(.tree-org-node__inner.org-node-contact .tree-org-node__text) {
  color: #1890ff;
}

:deep(.tree-org-node__inner.org-node-owner .tree-org-node__text) {
  color: #fa8c16;
}

:deep(.tree-org-node__inner.org-node-opportunity-category .tree-org-node__text) {
      font-weight: 600;
  color: #389e0d;
}

:deep(.tree-org-node__inner.org-node-opportunity .tree-org-node__text) {
  color: #52c41a;
}

:deep(.tree-org-node__inner.org-node-requirement-category .tree-org-node__text) {
  font-weight: 600;
  color: #cf1322;
}

:deep(.tree-org-node__inner.org-node-requirement .tree-org-node__text) {
  color: #f5222d;
}

/* 联系人图谱（vue3-tree-org）节点颜色区分 - 根据联系人类型 */
:deep(.tree-org-node__inner.org-node-contact-primary .tree-org-node__text) {
  color: #52c41a; /* 主要联系人：绿色 */
  font-weight: 500;
}

:deep(.tree-org-node__inner.org-node-contact-secondary .tree-org-node__text) {
  color: #1890ff; /* 次要联系人：蓝色 */
}

:deep(.tree-org-node__inner.org-node-contact-decision-maker .tree-org-node__text) {
  color: #f5222d; /* 决策者：红色 */
  font-weight: 500;
}

:deep(.tree-org-node__inner.org-node-contact-influencer .tree-org-node__text) {
  color: #fa8c16; /* 影响者：橙色 */
}

:deep(.tree-org-node__inner.org-node-contact-user .tree-org-node__text) {
  color: #722ed1; /* 使用者：紫色 */
}

.kanban-card-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}

.kanban-card-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;

  .card-title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    cursor: pointer;
  }
}

.kanban-card-body {
  .card-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;

    &:last-child {
      margin-bottom: 0;
    }

    .card-label {
      color: #909399;
      min-width: 60px;
    }

    .card-value {
      color: #606266;
    flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 客户图谱样式
.graph-content {
  padding: 0;
  background: #fff;
    display: flex;
    flex-direction: column;
  height: 100%;
  overflow: hidden;
  flex: 1;
    min-height: 0;
  margin-bottom: 0; // 移除底部间距

  .customer-graph-container {
    flex: 1;
    width: 100%;
    min-height: 600px; // 确保有最小高度
    height: 100%;
    overflow: hidden;
    background: #fafafa;
    position: relative;

    // 确保 MindElixir 的容器有正确的样式
    :deep(.map-container) {
      width: 100% !important;
      height: 100% !important;
      position: relative;
    }

    :deep(.map-canvas) {
      width: 100% !important;
      height: 100% !important;
      position: relative;
    }

    :deep(me-nodes) {
      display: block;
      width: 100%;
      height: 100%;
    }

    :deep(svg) {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  }
}
</style>

<style lang="scss">
@use '@/styles/common/detail-drawer.scss';

// 移除标签的 border-color
:deep(.el-tag) {
  border-color: transparent !important;
}

// 样式已移至 @/styles/common/detail-drawer.scss

// 自定义关闭按钮样式
.detail-drawer {
  .drawer-close {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 10;
    cursor: pointer;
    color: #909399;
    transition: color 0.2s ease;

    &:hover {
      color: #606266;
    }
  }
}

// 客户详情页特定样式
.detail-layout {
  .right-content {
    height: 100%;

    .dynamic-content-section.detail-scroll-container {
      height: 100%;
      overflow-y: auto;
      padding-right: 8px;
      scroll-behavior: smooth;
    }

    // 统一加载骨架屏样式
    .detail-loading-skeleton {
      padding: 20px;
      background: #fff;
      border-radius: 4px;
      margin: 16px;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .basic-info-section {
      .detail-header {
        margin-bottom: 20px;

        .detail-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #262626;
          }

          .star-icon {
            color: #faad14;
            font-size: 20px;
          }
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            .meta-label {
              color: #999;
            }

            .meta-value {
              color: #303133;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;

          .el-button {
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            border-radius: 4px;

            &.el-button--default {
              background: #fafafa;
              border-color: #d9d9d9;
              color: #666;

              &:hover {
                background: #f0f0f0;
                border-color: #40a9ff;
                color: #40a9ff;
              }
            }
          }
        }
      }

      .info-grid {
        // 样式已由公共样式文件定义，这里只保留特定覆盖

        .info-item {
          label {
            color: #606266;
          }

          span {
            color: #303133;
          }

          .description {
            color: #606266;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
        }
      }
    }
  }
}

// 工商信息样式
.business-info-wrapper {
  .business-header {
    .company-name {
      flex: 1;
    }

    .header-actions {
              flex-shrink: 0;
    }
  }

  .company-basic-info {
    background: #fff;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 0 16px 20px 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                border: 1px solid #f0f0f0;

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px 32px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .info-item {
              display: flex;
        align-items: flex-start;
        min-height: 36px;
        line-height: 1.6;

        .info-label {
              font-size: 14px;
          font-weight: 500;
          color: #606266;
          min-width: 140px;
          margin-right: 12px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .info-value {
          font-size: 14px;
          color: #303133;
          word-break: break-all;
          flex: 1;
          line-height: 1.6;
        }
      }
    }
  }

  .business-tabs-wrapper {
    :deep(.el-tabs__header) {
      margin: 0;
    }
  }

  .business-info-content {
    padding: 16px;
  }

  // Element Plus tabs 内容区域样式
  :deep(.el-tabs__content) {
    padding: 0;
    min-height: 400px;
  }

  :deep(.el-tab-pane) {
              padding: 0;
  }
}

// 合作与信用区域样式
.cooperation-content {
  .cooperation-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e4e7ed;

                &:last-child {
                  border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
                  display: flex;
                  align-items: center;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .info-item {
                    display: flex;
      align-items: flex-start;

      label {
                      font-weight: 500;
        color: #606266;
        min-width: 120px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      span {
        color: #303133;
        word-break: break-all;
        flex: 1;
      }

      &.full-width {
        grid-column: 1 / -1;
      }

      // 编辑模式下，确保内容区域宽度正确
      > div {
        flex: 1;
      }
    }
  }

  .opportunity-name {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-buttons {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    white-space: nowrap;

    .el-button {
      flex-shrink: 0;
    }
  }
}
</style>
