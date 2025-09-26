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
                v-model="searchForm.type"
                placeholder="客户类型"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="个人" value="individual" />
                <el-option label="企业" value="company" />
              </el-select>
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
                <el-option v-for="s in sourceOptions" :key="s.key" :label="s.label" :value="s.key" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="searchForm.industry" placeholder="行业" clearable style="width: 180px">
                <el-option v-for="i in industryOptions" :key="i.key" :label="i.label" :value="i.key" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate">
            新增客户
          </el-button>
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

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="customers"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
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
          <el-table-column prop="industry" label="行业" width="160">
            <template #default="{ row }">{{ getIndustryLabel(row.industry) }}</template>
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
          <el-table-column prop="level" label="等级" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.level" :type="getLevelType(row.level)" size="small">
                {{ row.level }}级
              </el-tag>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="estimatedValue" label="预计价值" width="120" align="right">
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
          <el-table-column prop="poolType" label="客户池" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.poolType === 'private' ? 'success' : 'info'" size="small">
                {{ row.poolType === 'private' ? '私海' : '公海' }}
              </el-tag>
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
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="warning"
                size="small"
                :icon="Edit"
                @click="editCustomer(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="deleteCustomer(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-section">
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
    </div>

    <!-- 客户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
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
        <el-form-item label="客户池类型" prop="poolType">
          <el-select v-model="formData.poolType" placeholder="请选择客户池类型" style="width: 100%">
            <el-option label="私海（有负责人）" value="private" />
            <el-option label="公海（无负责人）" value="public" />
          </el-select>
          <div class="text-sm text-gray-500 mt-1">
            私海：客户有明确负责人；公海：客户无负责人，可被认领
          </div>
        </el-form-item>
        <el-form-item label="所在地区">
          <el-cascader v-model="customerRegion" :options="regionOptions" style="width: 100%" placeholder="省/市/区" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="formData.addressDetail" placeholder="街道、楼层等" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
            :value="currentUser?.username || '当前用户'"
            disabled
            style="width: 100%"
          />
          <div class="text-sm text-gray-500 mt-1">
            新建客户时，负责人默认为当前登录用户
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>


    <!-- 客户详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="70%"
      :with-header="false"
      class="customer-drawer"
      :before-close="handleDrawerClose"
    >
      <div v-if="selectedCustomer" class="customer-detail-layout">
        <!-- 左侧导航按钮 -->
        <div class="left-nav">
          <ul class="side-menu with-timeline">
            <li class="side-item" :class="{ active: activeTab === 'activities' }" @click="activeTab = 'activities'">
              <span class="item-btn">
                <el-icon class="item-icon"><Clock /></el-icon>
                <span class="item-text">活动</span>
              </span>
            </li>
            <li class="side-item" :class="{ active: activeTab === 'opportunities' }" @click="activeTab = 'opportunities'">
              <span class="item-btn">
                <el-icon class="item-icon"><TrendCharts /></el-icon>
                <span class="item-text">商机</span>
              </span>
            </li>
            <li class="side-item" :class="{ active: activeTab === 'contacts' }" @click="activeTab = 'contacts'">
              <span class="item-btn">
                <el-icon class="item-icon"><User /></el-icon>
                <span class="item-text">联系人</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- 右侧内容区域 -->
        <div class="right-content">
          <!-- 上部分：基本信息 -->
          <div class="basic-info-section">
            <div class="customer-header">
              <div class="customer-title">
                <h2>{{ selectedCustomer.name }}</h2>
                <el-icon class="star-icon"><Star /></el-icon>
              </div>
              <div class="customer-meta">
                <div class="meta-item">
                  <span class="meta-label">客户来源:</span>
                  <span class="meta-value">{{ selectedCustomer.source ? getSourceLabel(selectedCustomer.source) : '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">客户类型:</span>
                  <span class="meta-value">{{ selectedCustomer.type === 'individual' ? '个人' : '企业' }}</span>
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
              <div class="action-buttons">
                <el-button type="default" :icon="Message">发送邮件</el-button>
                <el-button type="default" :icon="ChatDotRound">发送短信</el-button>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>行业：</label>
                <span>{{ selectedCustomer.industry ? getIndustryLabel(selectedCustomer.industry) : '-' }}</span>
              </div>
              <div class="info-item">
                <label>客户池类型：</label>
                <span>
                  <el-tag :type="selectedCustomer.poolType === 'private' ? 'success' : 'info'" size="small">
                    {{ selectedCustomer.poolType === 'private' ? '私海' : '公海' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <label>客户规模：</label>
                <span>{{ selectedCustomer.size ? getSizeName(selectedCustomer.size) : '-' }}</span>
              </div>
              <div class="info-item">
                <label>所在地区：</label>
                <span>{{ [selectedCustomer.province, selectedCustomer.city, selectedCustomer.district].filter(Boolean).join(' / ') || '-' }}</span>
              </div>
              <div class="info-item">
                <label>详细地址：</label>
                <span>{{ selectedCustomer.addressDetail || '-' }}</span>
              </div>
              <div class="info-item">
                <label>客户来源：</label>
                <span>{{ selectedCustomer.source ? getSourceLabel(selectedCustomer.source) : '-' }}</span>
              </div>
              <div class="info-item">
                <label>客户等级：</label>
                <span>
                  <el-tag v-if="selectedCustomer.level" :type="getLevelType(selectedCustomer.level)" size="small">
                    {{ selectedCustomer.level }}级
                  </el-tag>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-item">
                <label>预计价值：</label>
                <span class="estimated-value">{{ selectedCustomer.estimatedValue ? formatCurrency(selectedCustomer.estimatedValue) : '-' }}</span>
              </div>
              <div class="info-item full-width" v-if="selectedCustomer.description">
                <label>客户描述：</label>
                <div class="description">{{ selectedCustomer.description }}</div>
              </div>
            </div>
          </div>

          <!-- 下部分：动态内容区域 -->
          <div class="dynamic-content-section">
            <!-- 活动记录内容 -->
            <div v-if="activeTab === 'activities'" class="tab-content">
              <!-- 快速跟进输入框 -->
              <div class="quick-follow-up">
                <div class="follow-up-input">
                  <el-avatar :size="32" class="user-avatar">{{ getUserName(selectedCustomer.owner)?.charAt(0) || 'A' }}</el-avatar>
                  <el-input 
                    placeholder="写跟进..." 
                    v-model="quickFollowUpText"
                    @focus="isFollowUpExpanded = true"
                    @keyup.enter="handleQuickFollowUpSubmit"
                    class="follow-up-text"
                  />
                </div>
                <div v-if="isFollowUpExpanded" class="follow-up-advance">
                  <el-form :model="followUpForm" label-width="96px" class="follow-form">
                    <el-form-item label="活动描述">
                      <el-input v-model="followUpForm.description" type="textarea" :rows="2" placeholder="补充说明" />
                    </el-form-item>
                    <el-form-item label="活动类型">
                      <el-select v-model="followUpForm.type" placeholder="请选择">
                        <el-option label="电话" value="call" />
                        <el-option label="会议" value="meeting" />
                        <el-option label="邮件" value="email" />
                        <el-option label="任务" value="task" />
                        <el-option label="备注" value="note" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="计划开始时间">
                      <el-date-picker v-model="followUpForm.plannedStartTime" type="datetime" placeholder="选择时间" />
                    </el-form-item>
                    <el-form-item label="计划结束时间">
                      <el-date-picker v-model="followUpForm.plannedEndTime" type="datetime" placeholder="选择时间" />
                    </el-form-item>
                    <el-form-item label="优先级">
                      <el-select v-model="followUpForm.priority" placeholder="请选择">
                        <el-option label="低" value="low" />
                        <el-option label="中" value="medium" />
                        <el-option label="高" value="high" />
                        <el-option label="紧急" value="urgent" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="负责人">
                      <el-select v-model="followUpForm.assignees" multiple filterable placeholder="默认当前用户" @visible-change="(v:boolean)=>{ if(v) loadAssignees() }">
                        <el-option v-for="m in assigneeOptions" :key="m.id" :label="m.name" :value="m.id" />
                      </el-select>
                    </el-form-item>
                    <div class="follow-actions">
                      <el-button @click="resetFollowUp">取消</el-button>
                      <el-button type="primary" :loading="savingFollow" @click="handleQuickFollowUpSubmit">保存</el-button>
                    </div>
                  </el-form>
                </div>
              </div>

              <!-- 活动筛选工具栏 -->
              <div class="activity-toolbar">
                <el-input v-model="activityFilters.keyword" placeholder="搜索标题/描述" clearable style="width: 220px" @keyup.enter="refreshActivities" />
                <el-select v-model="activityFilters.status" placeholder="状态" clearable style="width: 140px" @change="refreshActivities">
                  <el-option v-for="s in activityStatusOptions" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
                <el-select v-model="activityFilters.ownerId" placeholder="负责人(全部)" clearable filterable style="width: 180px" @visible-change="(v:boolean)=>{ if(v) loadAssignees() }" @change="refreshActivities">
                  <el-option :label="'全部'" :value="''" />
                  <el-option v-for="m in assigneeOptions" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
                <el-button :icon="Search" @click="refreshActivities">查询</el-button>
                <el-button :icon="Refresh" @click="resetActivityFilters">重置</el-button>
              </div>

              <div v-if="groupedActivities.length === 0" class="empty-timeline">
                <el-empty description="暂无活动记录" />
              </div>
              <div v-else class="activity-groups">
                <div 
                  v-for="(group, gi) in groupedActivities" 
                  :key="group.date"
                  class="activity-group"
                >
                  <div class="group-header">{{ group.date }}</div>
                  <div class="group-items">
                    <div v-for="act in group.items" :key="act.id" class="group-item" @mouseenter="hoveredActivityId = act.id" @mouseleave="hoveredActivityId = ''">
                      <div class="line1">
                        <div class="user-avatar">{{ ((act as any).ownerDisplay || getUserName((act as any).owner))?.charAt(0) || 'A' }}</div>
                        <div class="user-info">
                          <span class="user-name">{{ (act as any).ownerDisplay || getUserName((act as any).owner) }}</span>
                          <el-tag
                            class="activity-type"
                            size="small"
                            :type="getTypeColor(act.type)"
                            effect="dark"
                          >
                            <el-icon class="type-icon" style="margin-right:4px;">
                              <component :is="getActivityTypeIcon(act.type)" />
                            </el-icon>
                            {{ getTypeName(act.type) }}
                          </el-tag>
                        </div>
                      </div>
                      <div class="line2">{{ formatTime(act.actualStartTime || act.plannedStartTime || act.createdAt) }}
                        <el-tag size="small" class="status-tag" :type="getActivityStatusType(act.status)" style="margin-left:8px;">{{ getActivityStatusName(act.status) }}</el-tag>
                      </div>
                      <div class="line3 title-line">{{ act.title }}</div>
                      <div v-if="act.description" class="desc-line">{{ act.description }}</div>
                      
                      <div class="next-contact">
                        <el-icon class="clock-icon"><Clock /></el-icon>
                        下次联系时间: {{ formatDate(act.plannedEndTime) }}
                      </div>
                      <div class="activity-actions" :class="{ visible: hoveredActivityId === act.id }">
                        <template v-if="act.status === 'planned' && isOwner(act)">
                          <el-button type="primary" size="small" @click="startActivity(act)">开始</el-button>
                        </template>
                        <template v-else-if="act.status === 'in_progress' && isOwner(act)">
                          <el-button type="success" size="small" @click="openCompleteDialog(act)">完成</el-button>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 联系人内容 -->
            <div v-if="activeTab === 'contacts'" class="tab-content">
              <div v-if="customerContacts.length > 0" class="contacts-list">
                <el-card 
                  v-for="contact in customerContacts" 
                  :key="contact.id" 
                  class="contact-card"
                  shadow="hover"
                >
                  <div class="contact-header">
                    <div class="contact-name">
                      <el-icon class="contact-icon">
                        <User />
                      </el-icon>
                      {{ contact.name }}
                      <el-tag v-if="contact.isPrimary" type="success" size="small" class="primary-tag">
                        主要联系人
                      </el-tag>
                    </div>
                    <el-tag :type="getContactTypeColor(contact.type)" size="small">
                      {{ getContactTypeName(contact.type) }}
                    </el-tag>
                  </div>
                  <div class="contact-info">
                    <div v-if="contact.position" class="contact-item">
                      <span class="contact-label">职位：</span>
                      <span class="contact-value">{{ contact.position }}</span>
                    </div>
                    <div v-if="contact.department" class="contact-item">
                      <span class="contact-label">部门：</span>
                      <span class="contact-value">{{ contact.department }}</span>
                    </div>
                    <div v-if="contact.phone" class="contact-item">
                      <span class="contact-label">手机：</span>
                      <span class="contact-value">{{ contact.phone }}</span>
                    </div>
                    <div v-if="contact.telephone" class="contact-item">
                      <span class="contact-label">电话：</span>
                      <span class="contact-value">{{ contact.telephone }}</span>
                    </div>
                    <div v-if="contact.email" class="contact-item">
                      <span class="contact-label">邮箱：</span>
                      <span class="contact-value">{{ contact.email }}</span>
                    </div>
                    <div v-if="contact.notes" class="contact-item">
                      <span class="contact-label">备注：</span>
                      <span class="contact-value">{{ contact.notes }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
              <div v-else class="empty-state">
                <el-empty description="暂无联系人" />
              </div>
            </div>

            <!-- 商机内容 -->
            <div v-if="activeTab === 'opportunities'" class="tab-content">
              <div v-if="customerOpportunities.length > 0" class="opportunities-list">
                <el-card 
                  v-for="opportunity in customerOpportunities" 
                  :key="opportunity.id" 
                  class="opportunity-card"
                  shadow="hover"
                >
                  <div class="opportunity-header">
                    <div class="opportunity-title">
                      <el-icon class="opportunity-icon">
                        <TrendCharts />
                      </el-icon>
                      {{ opportunity.title }}
                    </div>
                    <el-tag :type="getStageType(opportunity.stage)" size="small">
                      {{ getStageName(opportunity.stage) }}
                    </el-tag>
                  </div>
                  <div class="opportunity-description" v-if="opportunity.description">
                    {{ opportunity.description }}
                  </div>
                  <div class="opportunity-meta">
                    <div class="meta-item">
                      <span class="meta-label">金额：</span>
                      <span class="meta-value">{{ formatCurrency(opportunity.value) }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">概率：</span>
                      <span class="meta-value">{{ opportunity.probability }}%</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">预计成交：</span>
                      <span class="meta-value">{{ formatDate(opportunity.expectedCloseDate) }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">负责人：</span>
                      <span class="meta-value">{{ getUserName(opportunity.owner) }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
              <div v-else class="empty-state">
                <el-empty description="暂无商机" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>

  <!-- 完成活动弹窗 -->
  <el-dialog v-model="completeDialog.visible" title="完成活动" width="480px">
    <el-form label-width="90px">
      <el-form-item label="完成结果">
        <el-input v-model="completeDialog.outcome" placeholder="请输入结果/结论" />
      </el-form-item>
      <el-form-item label="完成内容">
        <el-input v-model="completeDialog.content" type="textarea" :rows="4" placeholder="请输入完成的详细内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="completeDialog.visible = false">取消</el-button>
      <el-button type="primary" @click="submitComplete">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, TrendCharts, Calendar, User, Clock, Star, Message, ChatDotRound, Filter, Phone, VideoCamera, EditPen, Document } from '@element-plus/icons-vue'
import { Close } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import customerApi, { type Customer, type CreateCustomerDto, type UpdateCustomerDto, type QueryCustomerDto } from '@/api/customer'
import opportunityApi from '@/api/opportunity'
import activityApi from '@/api/activity'
import contactApi from '@/api/contact'
import leadApi from '@/api/lead'
import request from '@/utils/request'
import commonApi from '@/api/common'

const router = useRouter()
const authStore = useAuthStore()
const currentMemberId = computed(() =>
  ((authStore as any)?.currentMember?.id)
  || ((authStore as any)?.member?.id)
  || ((authStore as any)?.user?.memberId)
  || ''
)
const isOwner = (act: any) => {
  const actOwnerId = act?.ownerId || act?.owner?.id
  const me = currentMemberId.value
  return !!actOwnerId && !!me && String(actOwnerId).trim() === String(me).trim()
}

// 搜索表单
const searchForm = reactive<{ search?: string; type?: 'individual' | 'company'; status?: any; source?: string; industry?: string; page?: number; limit?: number}>({
  search: '',
  type: undefined,
  status: undefined,
  source: undefined,
  industry: undefined,
  page: 1,
  limit: 10
})

// 客户列表
const customers = ref<Customer[]>([])
const loading = ref(false)
const selectedRows = ref<Customer[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
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
const timelineData = ref<any[]>([])
const loadingDetails = ref(false)
const hoveredActivityId = ref<string>('')

// 抽屉相关
const drawerVisible = ref(false)
const activeTab = ref('activities')

// 表单数据
const formData = reactive<CreateCustomerDto & { id?: string }>({
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
  poolType: 'private',
  province: '',
  city: '',
  district: '',
  addressDetail: '',
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' },
    { min: 2, max: 100, message: '客户名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择客户类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择客户状态', trigger: 'change' }
  ]
}

// 计算属性（如需显示当前用户，可从全局store注入，此处先留空）
const currentUser = computed(() => ({ username: '' }))

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    lead: 'info',
    qualified: 'warning',
    proposal: 'primary',
    negotiation: 'warning',
    closed_won: 'success',
    closed_lost: 'danger'
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
    closed_lost: '流失客户'
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
const getUserName = (user?: any) => user?.username || user?.nickname || user?.name || '系统'
const formatDateOnly = (dateString: string) => {
  const d = new Date(dateString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
    enterprise: '超大型'
  }
  return sizeMap[size] || size
}

// 获取等级类型
const getLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'danger'
  }
  return typeMap[level] || 'default'
}

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

// 加载客户列表
const loadCustomers = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: Number(pagination.page),
      limit: Number(pagination.pageSize)
    }
    console.log('Loading customers with params:', params)
    const response = await customerApi.getList(params)
    console.log('Customer API response:', response)
    
    if (response.code === 200) {
      customers.value = response.data.customers
      pagination.total = response.data.total
      console.log('Customers loaded:', customers.value)
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
    page: 1,
    limit: 10
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
  selectedCustomer.value = customer
  drawerVisible.value = true
  loadCustomerDetails(customer.id)
}

// 抽屉关闭处理
const handleDrawerClose = (done: () => void) => {
  selectedCustomer.value = null
  timelineData.value = []
  customerOpportunities.value = []
  customerContacts.value = []
  customerActivities.value = []
  activeTab.value = 'activities'
  done()
}

// 顶部自定义关闭按钮
const closeDrawer = () => {
  drawerVisible.value = false
}

// 加载客户详情
const loadCustomerDetails = async (customerId: string) => {
  try {
    loadingDetails.value = true
    
    // 并行加载客户详情、商机、联系人和活动
    const [customerResponse, opportunitiesResponse, contactsResponse, activitiesResponse] = await Promise.all([
      customerApi.getDetail(customerId),
      opportunityApi.getList({ customerId, page: 1, limit: 100 }),
      contactApi.getList({ customerId, page: 1, limit: 100 }),
      activityApi.getList({ relatedToType: 'customer', relatedToId: customerId, page: 1, limit: 100 })
    ])
    
    customerDetails.value = customerResponse.data
    const oppData = (opportunitiesResponse as any)?.data
    const contactData = (contactsResponse as any)?.data
    const actData = (activitiesResponse as any)?.data
    customerOpportunities.value = oppData?.opportunities || []
    customerContacts.value = contactData?.contacts || []
    customerActivities.value = actData?.activities || []
    
    // 生成时间线数据
    generateTimelineData()
  } catch (error) {
    console.error('加载客户详情失败:', error)
    ElMessage.error('加载客户详情失败')
  } finally {
    loadingDetails.value = false
  }
}

// 生成时间线数据
const generateTimelineData = () => {
  const timeline: any[] = []
  
  // 添加商机数据
  customerOpportunities.value.forEach(opportunity => {
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
      activities: customerActivities.value.filter(activity => activity.relatedToType === 'opportunity' && activity.relatedToId === opportunity.id)
    })
  })
  
  // 添加独立活动数据（不关联商机的活动）
  const independentActivities = customerActivities.value.filter(activity => activity.relatedToType === 'customer' && activity.relatedToId === selectedCustomer.value?.id)
  independentActivities.forEach(activity => {
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
      activities: [] // 独立活动没有子活动
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
  acts.forEach(a => {
    const day = formatDateOnly(a.actualStartTime || a.plannedStartTime || a.createdAt)
    // 统一owner显示字段
    ;(a as any).ownerDisplay = getUserName((a as any).owner || (a as any).ownerName || (a as any).owner_username)
    if (!map[day]) map[day] = []
    map[day].push(a)
  })
  const groups = Object.keys(map)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => ({ date, items: map[date].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()) }))
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
      closed_lost: 'danger'
    }
    return statusMap[item.status] || 'default'
  } else if (item.type === 'activity') {
    const statusMap: Record<string, string> = {
      planned: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger'
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
      closed_lost: '失败'
    }
    return nameMap[item.status] || item.status
  } else if (item.type === 'activity') {
    const nameMap: Record<string, string> = {
      planned: '计划中',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
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
    note: '备注'
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
    note: 'default'
  }
  return colorMap[type] || 'default'
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
    poolType: customer.poolType,
    province: customer.province || '',
    city: customer.city || '',
    district: customer.district || '',
    addressDetail: customer.addressDetail || '',
  })
  customerRegion.value = [formData.province, formData.city, formData.district].filter(Boolean) as string[]
  dialogVisible.value = true
}

// 删除客户
const deleteCustomer = async (customer: Customer) => {
  try {
    await ElMessageBox.confirm(`确定要删除客户"${customer.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
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
    poolType: 'private',
    province: '',
    city: '',
    district: '',
    addressDetail: '',
  })
  customerRegion.value = []
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
      const { id, ...updateData } = formData
      await customerApi.update(id, updateData as UpdateCustomerDto)
      ElMessage.success('更新客户成功')
    } else {
      // 新建客户
      await customerApi.create(formData as CreateCustomerDto)
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
    'prospecting': '潜在客户',
    'qualification': '资格确认',
    'proposal': '提案',
    'negotiation': '谈判',
    'closed_won': '成交',
    'closed_lost': '失败'
  }
  return stageMap[stage] || stage
}

// 获取商机阶段类型颜色
const getStageType = (stage: string) => {
  const typeMap: Record<string, string> = {
    'prospecting': 'info',
    'qualification': 'warning',
    'proposal': 'primary',
    'negotiation': 'warning',
    'closed_won': 'success',
    'closed_lost': 'danger'
  }
  return typeMap[stage] || 'default'
}

// 获取联系人类型名称
const getContactTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'primary': '主要联系人',
    'secondary': '次要联系人',
    'decision_maker': '决策者',
    'influencer': '影响者',
    'user': '使用者'
  }
  return typeMap[type] || type
}

// 获取联系人类型颜色
const getContactTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'primary': 'success',
    'secondary': 'info',
    'decision_maker': 'danger',
    'influencer': 'warning',
    'user': 'default'
  }
  return colorMap[type] || 'default'
}

// 已上方统一通过sourceOptions与getSourceLabel定义
// 处理选择变化
const handleSelectionChange = (selection: Customer[]) => {
  selectedRows.value = selection
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
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(customer => customer.id)
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
const getSourceLabel = (key?: string) => sourceOptions.value.find(s => s.key === key)?.label || key || '-'
const industryOptions = ref<{ key: string; label: string }[]>([])
const getIndustryLabel = (key?: string) => industryOptions.value.find(i => i.key === key)?.label || key || '-'
const regionOptions = ref<any[]>([])
const customerRegion = ref<string[]>([])

// 快速跟进相关
const quickFollowUpText = ref('')
const isFollowUpExpanded = ref(false)
const savingFollow = ref(false)
const followUpForm = reactive({
  description: '',
  type: 'note' as 'call' | 'meeting' | 'email' | 'task' | 'note',
  plannedStartTime: '',
  plannedEndTime: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  assignees: [] as string[],
})

// 负责人候选（此处临时用当前用户与负责人构造，后续可换成成员列表接口）
// 负责人候选 - 来自真实成员列表API
const assigneeOptions = ref<{ id: string; name: string }[]>([])
const loadAssignees = async () => {
  try {
    // 使用租户成员列表：GET /tenants/:id/members
    // 简化：后端通过token可解析tenantId，这里使用 /members/self-tenant 之类的代理接口；若无，则获取当前客户的owner.tenantId
    const tenantId = (selectedCustomer.value as any)?.tenantId
    const url = tenantId ? `/tenants/${tenantId}/members` : `/tenants/${''}/members`
    const resp = await request.get(url, { params: { page: 1, limit: 1000 } })
    const list = (resp as any).data?.members || (resp as any).data?.items || (resp as any).data || []
    assigneeOptions.value = list.map((m: any) => ({ id: m.id, name: m.nickname || m.user?.username || m.user?.name || '-' }))
    // 默认选中当前用户/负责人
    if (!followUpForm.assignees.length && assigneeOptions.value.length) {
      const currentId = assigneeOptions.value[0].id
      followUpForm.assignees = [currentId]
    }
  } catch (e) {
    // 回退：至少包含当前负责人
    const fallbackName = selectedCustomer.value?.owner ? getUserName(selectedCustomer.value.owner) : '当前用户'
    const fallbackId = selectedCustomer.value?.owner?.id || 'current'
    assigneeOptions.value = [{ id: fallbackId, name: fallbackName }]
    if (!followUpForm.assignees.length) {
      followUpForm.assignees = [fallbackId]
    }
  }
}

// 快速跟进 - 保存
const handleQuickFollowUpSubmit = async () => {
  if (!quickFollowUpText.value.trim()) return
  
  try {
    savingFollow.value = true
    // 组装活动DTO
    const basePayload = {
      title: quickFollowUpText.value,
      description: followUpForm.description,
      type: followUpForm.type,
      relatedToType: 'customer',
      relatedToId: selectedCustomer.value?.id,
      plannedStartTime: followUpForm.plannedStartTime || undefined,
      plannedEndTime: followUpForm.plannedEndTime || undefined,
      priority: followUpForm.priority,
    } as any

    const assignees = followUpForm.assignees?.length ? followUpForm.assignees : [assigneeOptions.value[0]?.id]
    // 多负责人 -> 创建多条任务
    for (const assigneeId of assignees) {
      await activityApi.create({ ...basePayload, ownerId: assigneeId })
    }

    ElMessage.success('跟进记录已保存')
    quickFollowUpText.value = ''
    resetFollowUp(false)
    // 重新加载活动记录
    if (selectedCustomer.value) {
      await loadCustomerDetails(selectedCustomer.value.id)
    }
  } catch (error) {
    console.error('保存跟进记录失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingFollow.value = false
  }
}

const resetFollowUp = (collapse = true) => {
  followUpForm.description = ''
  followUpForm.type = 'note'
  followUpForm.plannedStartTime = ''
  followUpForm.plannedEndTime = ''
  followUpForm.priority = 'medium'
  followUpForm.assignees = []
  if (collapse) isFollowUpExpanded.value = false
}

// 活动筛选/刷新
const activityFilters = reactive<{ keyword?: string; status?: string; ownerId?: string }>({ keyword: '', status: '', ownerId: '' })
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

onMounted(async () => {
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
  loadCustomers()
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

// 打开抽屉：默认加载活动（实时）
watch(() => drawerVisible.value && selectedCustomer.value?.id, async (open) => {
  if (open) {
    activeTab.value = 'activities'
    await loadActivities()
  } else {
    // 抽屉关闭时不做处理
  }
})

watch(activeTab, async (tab) => {
  if (!drawerVisible.value || !selectedCustomer.value?.id) return
  if (tab === 'activities') await loadActivities()
  if (tab === 'contacts') await loadContacts()
  if (tab === 'opportunities') await loadOpportunities()
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
        ? { id: a.owner.id, username: a.owner.username || a.owner.nickname || a.owner.name || a.ownerUsername || a.ownerName || '-' }
        : (a.ownerUsername || a.ownerName)
          ? { id: a.ownerId || undefined, username: a.ownerUsername || a.ownerName }
          : null,
    }))
  } catch (e) {}
}

const loadContacts = async () => {
  if (!selectedCustomer.value) return
  try {
    // 优先使用后端已有的按客户ID查询接口
    const resp = await request.get(`/contacts/customer/${selectedCustomer.value.id}`)
    customerContacts.value = (resp as any).data?.contacts || (resp as any).data || []
  } catch (e) {}
}

const loadOpportunities = async () => {
  if (!selectedCustomer.value) return
  try {
    const resp = await request.get('/opportunities', { params: { customerId: selectedCustomer.value.id, page: 1, limit: 100 } })
    customerOpportunities.value = (resp as any).data?.opportunities || (resp as any).data || []
  } catch (e) {}
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
    margin-bottom: 32px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f0f0;
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
      &.bg-even { background: #f8fafc; }
      &.bg-odd { background: #f5f7fa; }
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
          .line2 { color: #909399; font-size: 12px; margin-top: 4px; }
          .line3 { color: #606266; margin-top: 4px; }
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
  .customer-header {
    padding: 8px 0 12px 0;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 12px;
    
    .customer-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
      
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    .customer-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #606266;
      font-size: 14px;
      
      .customer-type {
        font-weight: 500;
      }
      
      .owner {
        color: #909399;
      }
    }
  }
  
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

// 自定义关闭按钮样式
.customer-drawer {
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
  /* 让抽屉内容去掉默认内边距并充满高度 */
  :deep(.el-drawer__body) {
    padding: 0 !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

// 新的左右布局样式 - 参考线索详情页面设计
.customer-detail-layout {
  display: flex;
  height: 100%;
  min-height: 100%;
  background: #e4e7ed;
  
  .left-nav {
    padding: 16px 12px;

    /* 胶囊按钮 + 纵向时间轴圆点样式 */
    .side-menu.with-timeline {
      list-style: none;
      margin: 0;
      padding: 0 16px 0 0; /* 时间轴改到右侧，右侧留白 */
      position: relative;
    }
    .side-menu.with-timeline:before {
      content: '';
      position: absolute;
      right: 8px; /* 竖线放在右侧 */
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: linear-gradient(#e6f0ff, #e6f0ff) no-repeat;
      background-size: 100% 100%;
      border-radius: 2px;
    }
    .side-item {
      position: relative;
      margin-bottom: 12px;
      cursor: pointer;
    }
    .side-item:after {
      content: '';
      position: absolute;
      right: -12px; /* 圆点在右侧 */
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      background: #9aa4b2;
      border-radius: 50%;
      box-shadow: 0 0 0 3px #fff inset;
    }
    .side-item.active:after { background: #0e3a8a; }
    .item-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #f2f6ff;
      border: 1px solid #dfe7ff;
      color: #2f3b52;
      border-radius: 10px;
      transition: all .2s ease;
    }
    .side-item.active .item-btn { background: #0e3a8a; color: #fff; border-color: #0e3a8a; }
    .item-icon { font-size: 14px; }
    .item-text { font-size: 14px; font-weight: 600; }
  }
  
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto; /* 滚动条放到这一层 */
    min-height: 0;
    
    .basic-info-section {
      padding: 24px;
      background: #fff;
      flex-shrink: 0;
      border-radius: 5px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      margin: 16px 16px 12px 16px;
      
      .customer-header {
        margin-bottom: 20px;
        
        .customer-title {
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
        
        .customer-meta {
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
              color: #262626;
              font-weight: 500;
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
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        
        .info-item {
          display: flex;
          align-items: flex-start;
          
          &.full-width {
            grid-column: 1 / -1;
          }
          
          label {
            font-weight: 500;
            color: #666;
            min-width: 100px;
            margin-right: 8px;
          }
          
          span {
            color: #262626;
            flex: 1;
          }
          
          .description {
            background: #fafafa;
            padding: 12px;
            border-radius: 4px;
            color: #666;
            line-height: 1.6;
            margin-top: 8px;
            border: 1px solid #f0f0f0;
          }
        }
      }
    }
    
    .dynamic-content-section {
      flex: 1;
      padding: 0;
      /* 由父层 right-content 承担滚动 */
      overflow: visible;
      background: transparent;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      background: white;
      margin: 0 16px 16px 16px;
      
      .tab-content {
        height: 100%;
        
        .empty-timeline,
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #999;
        }

        // 活动筛选工具栏（放在tab-content一级，保证样式生效）
        .activity-toolbar {
          display: flex;
          gap: 8px;
          padding: 12px 16px 0 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        // 快速跟进输入框样式
        .quick-follow-up {
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
          background: white;
          border-radius: 5px;
          
          .follow-up-input {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .user-avatar {
              flex-shrink: 0;
            }
            
            .follow-up-text {
              flex: 1;
              
              .el-input__wrapper {
                border-radius: 20px;
                padding: 8px 16px;
                background: #fafafa;
                border: 1px solid #f0f0f0;
                
                &:hover {
                  border-color: #d9d9d9;
                }
                
                &.is-focus {
                  border-color: #1890ff;
                  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                }
              }
            }
          }

          .follow-up-advance {
            margin-top: 12px;
            .follow-form {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 16px;
            }
            .el-form-item { margin-bottom: 12px; }
            .follow-actions {
              grid-column: 1 / -1;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
          }
        }
        
        // 活动标签页样式
        .activity-tabs {
          padding: 0 24px;
          border-bottom: 1px solid #f0f0f0;
          background: white;
          
          .tab-nav {
            display: flex;
            align-items: center;
            gap: 0;
            
            .tab-item {
              padding: 12px 16px;
              color: #666;
              font-size: 14px;
              cursor: pointer;
              border-bottom: 2px solid transparent;
              transition: all 0.2s ease;
              
              &:hover {
                color: #1890ff;
              }
              
              &.active {
                color: #1890ff;
                border-bottom-color: #1890ff;
                font-weight: 500;
              }
            }
            
            .filter-btn {
              margin-left: auto;
              
              .el-button {
                height: 28px;
                padding: 0 12px;
                font-size: 12px;
                border-radius: 4px;
              }
            }
          }
        }
        
        // 活动记录样式 - 参考图片设计
        .activity-groups {
          .activity-toolbar {
            display: flex;
            gap: 8px;
            padding: 12px 16px 0 16px;
            align-items: center;
          }
          .activity-group {
            margin: 12px 16px;
            background: #f4f5f7;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            border-radius: 8px;
            overflow: hidden;
            
            .group-header {
              padding: 16px 24px;
              background: #f4f5f7;
              color: #666;
              font-weight: 500;
              font-size: 14px;
              border-bottom: 1px solid #e6e8ef;
              position: sticky;
              top: 0;
              z-index: 10;
            }
            
            .group-items {
              padding: 0;
              
              .group-item {
                padding: 16px 24px;
                border-bottom: 1px solid #f5f5f5;
                position: relative;
                
                &:last-child {
                  border-bottom: none;
                }
                
                &:hover {
                  cursor: pointer;
                }
                
                .line1 {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 8px;
                  
                  .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #1890ff;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 500;
                  }
                  
                  .user-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    
                    .user-name {
                      color: #262626;
                      font-weight: 500;
                      font-size: 14px;
                    }
                    
                    .activity-type {
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 12px;
                      display: inline-flex;
                      align-items: center;
                      gap: 4px;
                    }
                    
                    .activity-tag {
                      background: #e6f7ff;
                      color: #1890ff;
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 12px;
                    }
                  }
                  
                  .ai-tag {
                    background: #722ed1;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                  }
                }
                
                .line2 {
                  color: #999;
                  font-size: 12px;
                  margin-bottom: 8px;
                  margin-left: 44px;
                }
                
                .line3 {
                  color: #262626;
                  line-height: 1.5;
                  margin-left: 44px;
                  margin-bottom: 8px;
                }

                .desc-line {
                  color: #262626;
                  line-height: 1.5;
                  margin-left: 44px;
                  margin-bottom: 8px;
                }
                
                .follow-up-actions {
                  margin-left: 44px;
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-bottom: 8px;
                  
                  .action-text {
                    color: #666;
                    font-size: 12px;
                  }
                  
                  .action-buttons {
                    display: flex;
                    gap: 8px;
                    
                    .action-btn {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      border: 1px solid #d9d9d9;
                      background: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      
                      &:hover {
                        border-color: #1890ff;
                        color: #1890ff;
                      }
                    }
                  }
                }
                
                .next-contact {
                  margin-left: 44px;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  color: #666;
                  font-size: 12px;
                  
                  .clock-icon {
                    color: #1890ff;
                  }
                }
                
                .activity-actions {
                  position: absolute;
                  right: 24px;
                  top: 12px;
                  display: inline-flex;
                  gap: 8px;
                  opacity: 0;
                  pointer-events: none;
                  transition: opacity .15s ease;
                  z-index: 2;
                }
                .group-item:hover .activity-actions,
                .activity-actions.visible {
                  opacity: 1;
                  pointer-events: auto;
                }
                .activity-actions:hover {
                  opacity: 1;
                  pointer-events: auto;
                }
              }
            }
          }
        }
        
        // 联系人列表样式
        .contacts-list {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          
          .contact-card {
            background: white;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            
            &:hover {
              border-color: #1890ff;
              box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
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
                color: #262626;
                
                .contact-icon {
                  margin-right: 8px;
                  color: #52c41a;
                  font-size: 18px;
                }
                
                .primary-tag {
                  margin-left: 8px;
                  background: #f6ffed;
                  color: #52c41a;
                  border: 1px solid #b7eb8f;
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
                  color: #999;
                  margin-right: 4px;
                  min-width: 50px;
                }
                
                .contact-value {
                  color: #262626;
                }
              }
            }
          }
        }
        
        // 商机列表样式
        .opportunities-list {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          
          .opportunity-card {
            background: white;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            
            &:hover {
              border-color: #1890ff;
              box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
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
                color: #262626;
                
                .opportunity-icon {
                  margin-right: 8px;
                  color: #faad14;
                  font-size: 18px;
                }
              }
            }
            
            .opportunity-description {
              color: #666;
              line-height: 1.5;
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
                  color: #999;
                  margin-right: 4px;
                  min-width: 60px;
                }
                
                .meta-value {
                  color: #262626;
                  font-weight: 500;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .customer-detail-dialog {
    .info-grid {
      grid-template-columns: 1fr;
    }
    
    .timeline-meta {
      flex-direction: column;
      gap: 8px;
    }
  }
  
  .customer-detail {
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<style lang="scss">
/* 由于 Drawer 使用 Teleport 到 body，scoped 样式可能无法覆盖；这里追加全局样式保障生效 */
.customer-drawer .el-drawer__body {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
