<template>
  <div class="lead-management">
    <div class="main-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :inline="true" :model="filters" class="search-form">
            <el-form-item>
              <el-input
                v-model="filters.search"
                placeholder="搜索姓名/公司/电话/邮箱"
                clearable
                @keyup.enter="loadData"
              />
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="filters.status"
                placeholder="状态"
                multiple
                collapse-tags
                collapse-tags-tooltip
                style="width: 200px"
              >
                <el-option label="新建" value="new" />
                <el-option label="已联系" value="contacted" />
                <el-option label="合格" value="qualified" />
                <el-option label="不合格" value="unqualified" />
                <el-option label="已转化" value="converted" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.rating" placeholder="评分" clearable style="width: 120px">
                <el-option label="热" value="hot" />
                <el-option label="温" value="warm" />
                <el-option label="冷" value="cold" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.source" placeholder="来源" clearable style="width: 160px">
                <el-option
                  v-for="s in sourceOptions"
                  :key="s.key"
                  :label="s.label"
                  :value="s.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
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
            <el-radio-button value="statistics">
              <el-icon><DataBoard /></el-icon>
              <span style="margin-left: 4px">数据分析</span>
            </el-radio-button>
          </el-radio-group>

          <!-- 批量操作按钮组 -->
          <template v-if="selectedRows.length > 0 && viewMode === 'list'">
            <el-button-group style="margin-right: 12px">
              <!-- 线索管理：放入线索池按钮 -->
              <el-button
                v-if="!isLeadPool"
                type="info"
                :icon="Box"
                @click="handleMoveToPool"
              >
                放入线索池 ({{ selectedRows.length }})
              </el-button>
              <!-- 线索池：领取按钮 -->
              <el-button
                v-if="isLeadPool"
                type="success"
                :icon="Download"
                @click="handleClaim"
              >
                领取 ({{ selectedRows.length }})
              </el-button>
              <el-button
                v-if="!isLeadPool"
                type="warning"
                :icon="Switch"
                @click="openBatchTransfer"
              >
                转移 ({{ selectedRows.length }})
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                @click="handleBatchDelete"
              >
                删除 ({{ selectedRows.length }})
              </el-button>
            </el-button-group>
          </template>

          <el-button v-if="viewMode === 'list'" type="primary" :icon="Plus" @click="openCreate">新建线索</el-button>
        </div>
      </div>

      <!-- 数据分析视图 -->
      <div class="statistics-section" v-if="viewMode === 'statistics'">
        <!-- 核心指标卡片 -->
        <div class="statistics-cards">
          <div class="stat-card" v-for="(item, index) in statisticsCards" :key="index">
            <div class="stat-card-icon" :class="item.iconClass">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-card-content">
              <div class="stat-card-label">{{ item.label }}</div>
              <div class="stat-card-value">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <!-- 第一行：状态分布、来源分布、评分分布 -->
        <div class="charts-row">
          <!-- 状态分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">状态分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="statusPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 来源分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">来源分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="sourcePieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 评分分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">评分分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="ratingPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 第二行图表 -->
        <div class="charts-row">
          <!-- 来源分析柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">来源分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="sourceBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 负责人分析柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">负责人/团队分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="ownerBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 行业分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">行业分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="industryPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 第四行图表 -->
        <div class="charts-row">
          <!-- 地区分布地图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">地区分布</h3>
                <el-button
                  v-if="currentMapLevel === 'city'"
                  size="small"
                  type="primary"
                  @click="backToProvinceMap"
                  style="margin-left: auto"
                >
                  返回省份视图
                </el-button>
              </div>
            </template>
            <div class="chart-content">
              <div ref="regionMapChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 流失分析图表 -->
        <div class="charts-row">
          <!-- 流失原因分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失原因分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnReasonPieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 流失阶段分布柱状图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失阶段分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnStageBarChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>

          <!-- 流失类型分布饼图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失类型分布</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnTypePieChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <div class="charts-row">
          <!-- 流失趋势折线图 -->
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">流失趋势</h3>
              </div>
            </template>
            <div class="chart-content">
              <div ref="churnTrendLineChart" style="width: 100%; height: 300px"></div>
            </div>
          </el-card>
        </div>

        <!-- 最后一行：转化率分析（占整行） -->
        <div class="charts-row conversion-row">
          <!-- 转化率分析 -->
          <el-card shadow="hover" class="chart-card conversion-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">转化率分析</h3>
              </div>
            </template>
            <div class="chart-content">
              <div class="conversion-stats">
                <div class="conversion-item">
                  <div class="conversion-label">总转化率</div>
                  <div class="conversion-value">{{ statisticsData.overview?.conversionRate || 0 }}%</div>
                  <div class="conversion-detail">
                    转化线索：{{ statisticsData.overview?.convertedLeads || 0 }} / 总线索：{{ statisticsData.overview?.totalLeads || 0 }}
                  </div>
                </div>
                <div class="conversion-item" v-for="source in statisticsData.sourceDistribution" :key="source.source">
                  <div class="conversion-label">{{ getSourceLabel(source.source) }}</div>
                  <div class="conversion-value">{{ source.conversionRate.toFixed(2) }}%</div>
                  <div class="conversion-detail">
                    转化：{{ source.convertedCount }} / 总数：{{ source.count }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
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
                {{ getLeadsByStatus(status.value).length }}
              </el-tag>
            </div>
            <div
              class="kanban-column-body"
              :data-status="status.value"
            >
              <div
                v-for="lead in getLeadsByStatus(status.value)"
                :key="lead.id"
                class="kanban-card"
                :data-id="lead.id"
                @click="openDetail(lead)"
              >
                <div class="kanban-card-header">
                  <span class="card-title" :title="lead.name || lead.company || '未命名'">
                    {{ lead.name || lead.company || '未命名' }}
                  </span>
                </div>
                <div class="kanban-card-body">
                  <div class="card-item" v-if="lead.company && lead.name">
                    <span class="card-label">公司：</span>
                    <span class="card-value" :title="lead.company">{{ lead.company }}</span>
                  </div>
                  <div class="card-item" v-if="lead.phone">
                    <span class="card-label">电话：</span>
                    <span class="card-value">{{ lead.phone }}</span>
                  </div>
                  <div class="card-item" v-if="lead.email">
                    <span class="card-label">邮箱：</span>
                    <span class="card-value" :title="lead.email">{{ lead.email }}</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">负责人：</span>
                    <span class="card-value">{{ lead.owner?.username || '-' }}</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">评分：</span>
                    <el-tag :type="getRatingType(lead.rating)" size="small">
                      {{ getRatingName(lead.rating) }}
                    </el-tag>
                  </div>
                  <div class="card-item" v-if="lead.createdAt">
                    <span class="card-label">创建时间：</span>
                    <span class="card-value">{{ formatDateOnly((lead as any).createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div class="table-section" v-if="viewMode === 'list'">
        <el-table
          :data="list"
          v-loading="loading"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="姓名/联系人" min-width="160">
            <template #default="{ row }">
              <span class="name-link" @click="openDetail(row)">{{ row.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="company" label="公司" min-width="160" show-overflow-tooltip />
          <el-table-column prop="title" label="职位" width="140" show-overflow-tooltip />
          <el-table-column prop="phone" label="电话" width="140" />
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column prop="industry" label="行业" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="ellipsis-cell">{{ getIndustryLabel(row.industry) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="客户等级" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getLevelType(row.level)">{{ row.level || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="region" label="所在地区" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="ellipsis-cell">
                {{ getRegionDisplay(row.province, row.city, row.district) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="addressDetail"
            label="详细地址"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column prop="leadSource" label="来源" width="140">
            <template #default="{ row }">{{ getSourceLabel(row.leadSource) }}</template>
          </el-table-column>
          <el-table-column prop="rating" label="评分" width="110">
            <template #default="{ row }">
              <el-tag :type="getRatingType(row.rating)">{{ getRatingName(row.rating) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="负责人" width="120">
            <template #default="{ row }">
              {{ row.owner?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button
                type="warning"
                size="small"
                @click="openTransfer(row)"
                style="margin-right: 8px"
                >转移</el-button
              >
              <el-button
                type="primary"
                size="small"
                @click="openConvert(row)"
                :disabled="row.status === 'converted'"
                style="margin-right: 8px"
                >转化</el-button
              >
              <el-button
                type="primary"
                size="small"
                @click="openEdit(row)"
                :disabled="row.status === 'converted'"
                style="margin-right: 8px"
                >编辑</el-button
              >
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(row)"
                :disabled="row.status === 'converted'"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-section" v-if="viewMode === 'list'">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <el-dialog
        v-model="createVisible"
        title="新建线索"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef" :model="form" label-width="100px">
          <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
          <el-form-item label="公司">
            <div class="company-search-wrapper">
              <el-input
                v-model="form.company"
                placeholder="请输入公司名称"
                clearable
                @keyup.enter="handleCompanySearch"
              >
                <template #prefix>
                  <el-icon class="search-icon"><Search /></el-icon>
                </template>
                <template #suffix>
                  <el-icon class="business-icon" title="工商信息"><Lightning /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                :icon="Search"
                :loading="companySearchLoading"
                @click="handleCompanySearch"
                style="margin-left: 8px"
              >
                搜索
              </el-button>
            </div>
            <!-- 搜索结果列表 -->
            <div v-if="companySearchResults.length > 0" class="company-search-results">
              <div
                v-for="company in companySearchResults"
                :key="company.id"
                class="company-result-item"
                @click="selectCompany(company)"
              >
                <div class="company-name">{{ company.name }}</div>
                <div class="company-info">
                  <span v-if="company.unifiedSocialCreditCode">
                    统一社会信用代码：{{ company.unifiedSocialCreditCode }}
                  </span>
                  <span v-if="company.legalRepresentative">
                    法定代表人：{{ company.legalRepresentative }}
                  </span>
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="职位"><el-input v-model="form.title" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
          <el-form-item label="来源">
            <el-select v-model="form.leadSource" style="width: 100%" placeholder="请选择">
              <el-option v-for="s in sourceOptions" :key="s.key" :label="s.label" :value="s.key" />
            </el-select>
          </el-form-item>
          <el-form-item label="行业">
            <el-select v-model="form.industry" style="width: 100%" placeholder="请选择行业">
              <el-option
                v-for="i in industryOptions"
                :key="i.key"
                :label="i.label"
                :value="i.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="客户等级">
            <el-select v-model="form.level" style="width: 100%" placeholder="请选择等级">
              <el-option label="A级" value="A" />
              <el-option label="B级" value="B" />
              <el-option label="C级" value="C" />
              <el-option label="D级" value="D" />
            </el-select>
          </el-form-item>
          <el-form-item label="所在地区">
            <el-cascader
              v-model="regionValue"
              :options="regionOptions"
              style="width: 100%"
              placeholder="省/市/区"
            />
          </el-form-item>
          <el-form-item label="详细地址"><el-input v-model="form.addressDetail" /></el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%" placeholder="请选择状态">
              <el-option label="新建" value="new" />
              <el-option label="已联系" value="contacted" />
              <el-option label="合格" value="qualified" />
              <el-option label="不合格" value="unqualified" />
            </el-select>
          </el-form-item>
          <el-form-item label="评分">
            <el-select v-model="form.rating" style="width: 100%">
              <el-option label="热" value="hot" />
              <el-option label="温" value="warm" />
              <el-option label="冷" value="cold" />
            </el-select>
          </el-form-item>
          <el-form-item label="负责人">
            <el-select
              v-model="form.ownerId"
              style="width: 100%"
              placeholder="请选择负责人"
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
          </el-form-item>
          <!-- 流失分析字段（当状态为不合格时显示） -->
          <template v-if="form.status === 'unqualified'">
            <el-form-item label="不合格原因" prop="unqualifiedReason" required>
              <el-select
                v-model="form.unqualifiedReason"
                style="width: 100%"
                placeholder="请选择不合格原因"
              >
                <el-option
                  v-for="reason in unqualifiedReasonOptions"
                  :key="reason.key"
                  :label="reason.label"
                  :value="reason.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="流失阶段">
              <el-select v-model="form.lostStage" style="width: 100%" placeholder="请选择流失阶段">
                <el-option label="新建阶段" value="new" />
                <el-option label="已联系阶段" value="contacted" />
                <el-option label="合格阶段" value="qualified" />
              </el-select>
            </el-form-item>
            <el-form-item label="流失类型">
              <el-select v-model="form.lostType" style="width: 100%" placeholder="请选择流失类型">
                <el-option
                  v-for="type in lostTypeOptions"
                  :key="type.key"
                  :label="type.label"
                  :value="type.key"
                />
              </el-select>
            </el-form-item>
          </template>
        </el-form>
        <template #footer>
          <el-button @click="createVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>

      <!-- 转移对话框 -->
      <el-dialog
        v-model="transferVisible"
        :title="transferMode === 'single' ? '转移线索' : `转移线索 (${selectedRows.length}条)`"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="transferForm" label-width="100px">
          <el-form-item label="选择负责人" required>
            <el-select
              v-model="transferForm.newOwnerId"
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
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="transferVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTransfer" :loading="transferLoading">
            确认转移
          </el-button>
        </template>
      </el-dialog>

      <!-- 拖拽到不合格状态时的对话框 -->
      <el-dialog
        v-model="unqualifiedDialogVisible"
        title="标记为不合格"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="unqualifiedForm" label-width="100px" ref="unqualifiedFormRef">
          <el-form-item label="不合格原因" prop="unqualifiedReason" required>
            <el-select
              v-model="unqualifiedForm.unqualifiedReason"
              style="width: 100%"
              placeholder="请选择不合格原因"
            >
              <el-option
                v-for="reason in unqualifiedReasonOptions"
                :key="reason.key"
                :label="reason.label"
                :value="reason.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="流失阶段">
            <el-select v-model="unqualifiedForm.lostStage" style="width: 100%" placeholder="请选择流失阶段">
              <el-option label="新建阶段" value="new" />
              <el-option label="已联系阶段" value="contacted" />
              <el-option label="合格阶段" value="qualified" />
            </el-select>
          </el-form-item>
          <el-form-item label="流失类型" prop="lostType" required>
            <el-select v-model="unqualifiedForm.lostType" style="width: 100%" placeholder="请选择流失类型">
              <el-option
                v-for="type in lostTypeOptions"
                :key="type.key"
                :label="type.label"
                :value="type.key"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="unqualifiedDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUnqualified" :loading="unqualifiedSubmitLoading">
            确定
          </el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="convertVisible"
        title="线索转化"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form :model="convertForm" label-width="120px" ref="convertFormRef">
          <el-form-item>
            <el-checkbox v-model="convertForm.convertToCustomer" disabled>转化为客户</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="convertForm.convertToOpportunity">转化为商机</el-checkbox>
          </el-form-item>
          <template v-if="convertForm.convertToOpportunity">
            <el-form-item label="商机标题" required>
              <el-input
                v-model="convertForm.opportunityName"
                placeholder="请输入商机标题"
                style="width: 100%"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="预计价值" required>
              <el-input
                v-model.number="convertForm.amount"
                type="number"
                placeholder="请输入预计价值"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="商机阶段" required>
              <el-select v-model="convertForm.stage" placeholder="请选择商机阶段" style="width: 100%">
                <el-option label="初步接触" value="initial_contact" />
                <el-option label="需求分析" value="needs_analysis" />
                <el-option label="方案/报价" value="proposal_quote" />
                <el-option label="谈判审核" value="negotiation_review" />
                <el-option label="赢单" value="closed_won" />
                <el-option label="输单" value="closed_lost" />
              </el-select>
            </el-form-item>
            <el-form-item label="商机状态" required>
              <el-select v-model="convertForm.status" placeholder="请选择商机状态" style="width: 100%">
                <el-option label="积极跟进" value="active" />
                <el-option label="等待客户" value="waiting_client" />
                <el-option label="已搁置" value="on_hold" />
                <el-option label="面临风险" value="at_risk" />
                <el-option label="已结束" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item label="成交概率" required>
              <el-select v-model="convertForm.probability" placeholder="请选择成交概率" style="width: 100%">
                <el-option label="10%" :value="10" />
                <el-option label="20%" :value="20" />
                <el-option label="30%" :value="30" />
                <el-option label="40%" :value="40" />
                <el-option label="50%" :value="50" />
                <el-option label="60%" :value="60" />
                <el-option label="70%" :value="70" />
                <el-option label="80%" :value="80" />
                <el-option label="90%" :value="90" />
                <el-option label="100%" :value="100" />
              </el-select>
            </el-form-item>
            <el-form-item label="预计成交日期" required>
              <el-date-picker
              v-model="convertForm.expectedCloseDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </template>

          <!-- 下一步计划活动 -->
          <el-form-item>
            <el-checkbox v-model="convertForm.planNextActivity">下一步计划活动</el-checkbox>
          </el-form-item>
          <template v-if="convertForm.planNextActivity">
            <el-form-item label="活动标题" required>
              <el-input
                v-model="convertForm.activityTitle"
                placeholder="请输入活动标题"
                style="width: 100%"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="活动类型" required>
              <el-select v-model="convertForm.activityType" placeholder="请选择活动类型" style="width: 100%">
                <el-option label="电话" value="call" />
                <el-option label="会议" value="meeting" />
                <el-option label="邮件" value="email" />
                <el-option label="任务" value="task" />
                <el-option label="备注" value="note" />
                <el-option label="微信" value="wechat" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划开始时间" required>
              <div style="display: flex; gap: 8px; width: 100%">
                <el-date-picker
                  v-model="convertForm.activityStartDate"
                  type="date"
                  placeholder="选择日期"
                  style="flex: 1"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <el-select
                  v-model="convertForm.activityStartTime"
                  placeholder="选择时间"
                  style="width: 120px"
                >
                  <el-option
                    v-for="time in timeOptions"
                    :key="time.value"
                    :label="time.label"
                    :value="time.value"
                  />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="时长" required>
              <el-select
                v-model="convertForm.activityDuration"
                placeholder="选择时长"
                style="width: 100%"
                @change="handleActivityDurationChange"
              >
                <el-option label="15分钟" value="15" />
                <el-option label="30分钟" value="30" />
                <el-option label="45分钟" value="45" />
                <el-option label="1小时" value="60" />
                <el-option label="2小时" value="120" />
                <el-option label="3小时" value="180" />
                <el-option label="选择结束时间" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="convertForm.activityDuration === 'custom'"
              label="计划结束时间"
              required
            >
              <div style="display: flex; gap: 8px; width: 100%">
                <el-date-picker
                  v-model="convertForm.activityEndDate"
                  type="date"
                  placeholder="选择日期"
                  style="flex: 1"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <el-select
                  v-model="convertForm.activityEndTime"
                  placeholder="选择时间"
                  style="width: 120px"
                >
                  <el-option
                    v-for="time in timeOptions"
                    :key="time.value"
                    :label="time.label"
                    :value="time.value"
                  />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="活动描述">
              <el-input
                v-model="convertForm.activityDescription"
                type="textarea"
                :rows="3"
                placeholder="请输入活动描述"
                style="width: 100%"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="活动地点">
              <el-input
                v-model="convertForm.activityLocation"
                placeholder="请输入活动地点"
                style="width: 100%"
                maxlength="200"
              />
            </el-form-item>
          </template>

          <!-- 下一步计划拜访 -->
          <el-form-item>
            <el-checkbox v-model="convertForm.planNextVisit">下一步计划拜访</el-checkbox>
          </el-form-item>
          <template v-if="convertForm.planNextVisit">
            <el-form-item label="拜访目的">
              <el-select v-model="convertForm.visitPurpose" placeholder="请选择拜访目的" style="width: 100%" clearable>
                <el-option label="了解需求" value="understand_needs" />
                <el-option label="月度履约" value="monthly_performance" />
                <el-option label="业绩增量" value="performance_increment" />
                <el-option label="产品推广" value="product_promotion" />
                <el-option label="节日走访" value="holiday_visit" />
                <el-option label="合同签订" value="contract_signing" />
                <el-option label="签对账单" value="sign_statement" />
                <el-option label="价格政策" value="price_policy" />
                <el-option label="售后服务" value="after_sales_service" />
                <el-option label="协商合作细节" value="negotiate_cooperation" />
                <el-option label="了解客户经营状况" value="understand_business" />
                <el-option label="样品跟踪测试" value="sample_tracking" />
              </el-select>
            </el-form-item>
            <el-form-item label="拜访类型" required>
              <el-select v-model="convertForm.visitType" placeholder="请选择拜访类型" style="width: 100%">
                <el-option label="首次拜访" value="first_visit" />
                <el-option label="跟进拜访" value="follow_up" />
                <el-option label="维护拜访" value="maintenance" />
                <el-option label="商务洽谈" value="business_negotiation" />
                <el-option label="技术支持" value="technical_support" />
                <el-option label="培训" value="training" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划开始时间" required>
              <div style="display: flex; gap: 8px; width: 100%">
                <el-date-picker
                  v-model="convertForm.visitStartDate"
                  type="date"
                  placeholder="选择日期"
                  style="flex: 1"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <el-select
                  v-model="convertForm.visitStartTime"
                  placeholder="选择时间"
                  style="width: 120px"
                >
                  <el-option
                    v-for="time in timeOptions"
                    :key="time.value"
                    :label="time.label"
                    :value="time.value"
                  />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="时长" required>
              <el-select
                v-model="convertForm.visitDuration"
                placeholder="选择时长"
                style="width: 100%"
                @change="handleVisitDurationChange"
              >
                <el-option label="15分钟" value="15" />
                <el-option label="30分钟" value="30" />
                <el-option label="45分钟" value="45" />
                <el-option label="1小时" value="60" />
                <el-option label="2小时" value="120" />
                <el-option label="3小时" value="180" />
                <el-option label="选择结束时间" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="convertForm.visitDuration === 'custom'"
              label="计划结束时间"
              required
            >
              <div style="display: flex; gap: 8px; width: 100%">
                <el-date-picker
                  v-model="convertForm.visitEndDate"
                  type="date"
                  placeholder="选择日期"
                  style="flex: 1"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <el-select
                  v-model="convertForm.visitEndTime"
                  placeholder="选择时间"
                  style="width: 120px"
                >
                  <el-option
                    v-for="time in timeOptions"
                    :key="time.value"
                    :label="time.label"
                    :value="time.value"
                  />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="所在地区">
              <el-cascader
                v-model="convertForm.visitRegion"
                :options="regionOptions"
                placeholder="请选择所在地区"
                clearable
                style="width: 100%"
                :props="{ expandTrigger: 'hover' }"
              />
            </el-form-item>
            <el-form-item label="详情地址">
              <el-input
                v-model="convertForm.visitAddress"
                placeholder="请输入详情地址"
                style="width: 100%"
                maxlength="200"
              />
            </el-form-item>
            <el-form-item label="描述" required>
              <el-input
                v-model="convertForm.visitDescription"
                type="textarea"
                :rows="3"
                placeholder="请输入描述"
                style="width: 100%"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </template>
        </el-form>
        <template #footer>
          <el-button @click="convertVisible = false">取消</el-button>
          <el-button type="primary" @click="submitConvert" :loading="convertLoading"
            >确认转化</el-button
          >
        </template>
      </el-dialog>

      <!-- 线索详情抽屉 -->
      <el-drawer
        v-model="drawerVisible"
        direction="rtl"
        size="70%"
        :with-header="false"
        class="detail-drawer"
        :before-close="handleDrawerClose"
      >
        <div v-if="selectedLead" class="detail-layout">
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
              <!-- 顺序：基本信息、活动记录、工商信息 -->
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
                :class="{ active: activeTab === 'business' }"
                @click="handleNavClick('business')"
              >
                <span class="item-btn" :title="menuCollapsed ? '工商信息' : ''">
                  <el-icon class="item-icon"><Document /></el-icon>
                  <span v-show="!menuCollapsed" class="item-text">工商信息</span>
                </span>
              </li>
            </ul>
          </div>

          <!-- 右侧内容区域 -->
          <div class="right-content">
            <!-- 可滚动内容区域（包含基本信息和各业务模块） -->
            <div class="dynamic-content-section detail-scroll-container" ref="detailContentRef">
              <!-- 基本信息 -->
              <el-card id="lead-section-basic" shadow="never" class="section-card basic-info-section detail-section">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <h3 class="section-title" style="margin: 0">基本信息</h3>
                    <div class="action-buttons">
                      <el-button type="primary" :icon="Edit" @click="openEditLead">编辑</el-button>
                    </div>
                  </div>
                </template>
                <div class="lead-header">
                  <div class="lead-title">
                    <h2>{{ selectedLead.name || selectedLead.company || '未命名线索' }}</h2>
                  </div>
                  <div class="lead-meta">
                    <div class="meta-item">
                      <span class="meta-label">线索来源:</span>
                      <span class="meta-value">{{ getSourceLabel(selectedLead.leadSource) || '-' }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">评分:</span>
                      <span class="meta-value">
                        <el-tag :type="getRatingType(selectedLead.rating)" size="small">
                          {{ getRatingName(selectedLead.rating) }}
                        </el-tag>
                      </span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">负责人:</span>
                      <span class="meta-value">{{ selectedLead.owner?.username || '-' }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">创建时间:</span>
                      <span class="meta-value">{{ formatDate(selectedLead.createdAt) }}</span>
                    </div>
                  </div>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <label>姓名/联系人：</label>
                    <span>{{ selectedLead.name || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>公司：</label>
                    <span>{{ selectedLead.company || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>职位：</label>
                    <span>{{ selectedLead.title || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>电话：</label>
                    <span>{{ selectedLead.phone || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>邮箱：</label>
                    <span>{{ selectedLead.email || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>行业：</label>
                    <span>{{ getIndustryLabel(selectedLead.industry) || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>客户等级：</label>
                    <span>
                      <el-tag
                        v-if="selectedLead.level"
                        :type="getLevelType(selectedLead.level)"
                        size="small"
                      >
                        {{ selectedLead.level }}级
                      </el-tag>
                      <span v-else>-</span>
                    </span>
                  </div>
                  <div class="info-item">
                    <label>状态：</label>
                    <span>
                      <el-tag :type="getStatusType(selectedLead.status)" size="small">
                        {{ getStatusName(selectedLead.status) }}
                      </el-tag>
                    </span>
                  </div>
                  <div class="info-item">
                    <label>所在地区：</label>
                    <span>{{ getRegionDisplay(selectedLead.province, selectedLead.city, selectedLead.district) || '-' }}</span>
                  </div>
                  <div class="info-item full-width">
                    <label>详细地址：</label>
                    <span>{{ selectedLead.addressDetail || '-' }}</span>
                  </div>
                </div>
              </el-card>

              <!-- 活动记录内容 -->
              <el-card shadow="never" id="lead-section-activities" class="tab-content detail-section section-card">
                <template #header>
                  <h3 class="section-title" style="margin: 0">活动记录</h3>
                </template>
                <ActivityList
                  v-if="selectedLead?.id"
                  :related-to-type="'lead'"
                  :related-to-id="selectedLead.id"
                  :auto-load="true"
                  @refresh="() => {}"
                />
              </el-card>

              <!-- 工商信息内容 -->
              <el-card shadow="never" id="lead-section-business" class="tab-content detail-section section-card">
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
                <div v-if="!selectedLead?.company" class="empty-state">
                  <el-empty description="该线索没有公司名称，无法查询工商信息" />
                </div>
                <div v-else class="business-info-wrapper">
                  <!-- 公司名称 -->
                  <div class="business-header" style="margin-bottom: 20px">
                    <h2 class="company-name" style="margin: 0; font-size: 24px; font-weight: 600; color: #262626">
                      {{ businessInfo?.companyName || selectedLead?.company || '未知公司' }}
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
                          {{ businessInfo.registeredCapital ? formatCurrency(convertToWanYuan(businessInfo.registeredCapital), false) + '万元' : '-' }}
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
                        {{ businessInfo.registeredCapital ? formatCurrency(convertToWanYuan(businessInfo.registeredCapital), false) + '万元' : '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="实缴资本">
                        {{ businessInfo.paidInCapital ? formatCurrency(convertToWanYuan(businessInfo.paidInCapital), false) + '万元' : '-' }}
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
                          {{ row.investmentAmount ? formatCurrency(convertToWanYuan(row.investmentAmount), false) : '-' }}
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
                          {{ row.investmentAmount ? formatCurrency(convertToWanYuan(row.investmentAmount), false) : '-' }}
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
            </div>
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import Sortable from 'sortablejs'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Search, Refresh, Switch, Delete, Clock, Document, Lightning, TrendCharts, User, Check, Trophy, DataAnalysis, List, DataBoard, Box, Download, Fold, Expand, Edit, Grid } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import leadApi, { type Lead, type QueryLeadDto } from '@/api/lead'
import { ElMessage, ElMessageBox } from 'element-plus'
import commonApi from '@/api/common'
import { useAuthStore } from '@/stores/modules/auth'
import { getDepartmentMembers, getDepartmentTree, type Department, type Member } from '@/api/department'
import ActivityList from '@/components/activity/ActivityList.vue'
import { tianyanchaApi, type CompanySearchResult } from '@/api/tianyancha'
import businessInfoApi, {
  type BusinessInfo,
} from '@/api/business-info'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const list = ref<Lead[]>([])
const selectedRows = ref<Lead[]>([])
const viewMode = ref<'list' | 'kanban' | 'statistics'>('list')
const statisticsLoading = ref(false)

// 看板相关
const columnRefs = ref<Record<string, HTMLElement | null>>({})
const sortableInstances = ref<any[]>([])

// 线索状态列配置
const statusColumns = [
  { label: '新建', value: 'new' },
  { label: '已联系', value: 'contacted' },
  { label: '合格', value: 'qualified' },
  { label: '不合格', value: 'unqualified' },
  { label: '已转化', value: 'converted' },
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

// 按状态获取线索
const getLeadsByStatus = (status: string) => {
  return list.value.filter((lead) => lead.status === status)
}

// 根据路由判断是否为线索池
const isLeadPool = computed(() => route.path === '/leads/pool')
const statisticsData = ref<any>({
  overview: {},
  statusDistribution: [],
  sourceDistribution: [],
  ratingDistribution: [],
})
const statusPieChart = ref<HTMLElement | null>(null)
const sourcePieChart = ref<HTMLElement | null>(null)
const ratingPieChart = ref<HTMLElement | null>(null)
const sourceBarChart = ref<HTMLElement | null>(null)
const ownerBarChart = ref<HTMLElement | null>(null)
const industryPieChart = ref<HTMLElement | null>(null)
const regionMapChart = ref<HTMLElement | null>(null)
const currentMapLevel = ref<'province' | 'city'>('province')
const currentProvince = ref<string | null>(null)
const cityMapDataCache = ref<Record<string, any>>({})
let statusPieChartInstance: echarts.ECharts | null = null
let sourcePieChartInstance: echarts.ECharts | null = null
let ratingPieChartInstance: echarts.ECharts | null = null
let sourceBarChartInstance: echarts.ECharts | null = null
let ownerBarChartInstance: echarts.ECharts | null = null
let industryPieChartInstance: echarts.ECharts | null = null
let regionMapChartInstance: echarts.ECharts | null = null
const churnReasonPieChart = ref<HTMLElement | null>(null)
const churnStageBarChart = ref<HTMLElement | null>(null)
const churnTypePieChart = ref<HTMLElement | null>(null)
const churnTrendLineChart = ref<HTMLElement | null>(null)
let churnReasonPieChartInstance: echarts.ECharts | null = null
let churnStageBarChartInstance: echarts.ECharts | null = null
let churnTypePieChartInstance: echarts.ECharts | null = null
let churnTrendLineChartInstance: echarts.ECharts | null = null
const filters = reactive<QueryLeadDto>({
  search: '',
  status: ['new', 'contacted', 'qualified'] as string[] | undefined, // 默认选中新建、已联系、合格
  rating: undefined,
  source: undefined,
  page: 1,
  limit: 10,
})
const pagination = reactive({ page: 1, limit: 50, total: 0 })

const createVisible = ref(false)
const editMode = ref(false)
const currentEditLead = ref<Lead | null>(null)
const submitLoading = ref(false)
const formRef = ref()
const form = reactive<{
  name?: string
  company?: string
  title?: string
  phone?: string
  email?: string
  leadSource?: string
  rating?: 'hot' | 'warm' | 'cold'
  industry?: string
  level?: string
  province?: string
  city?: string
  district?: string
  addressDetail?: string
  ownerId?: string
  status?: string
  unqualifiedReason?: string
  lostStage?: string
  lostType?: string
}>({
  name: '',
  company: '',
  title: '',
  phone: '',
  email: '',
  leadSource: '',
  rating: 'warm',
  industry: '',
  level: '',
  province: '',
  city: '',
  district: '',
  addressDetail: '',
  ownerId: '',
  status: 'new',
  unqualifiedReason: '',
  lostStage: '',
  lostType: '',
})

const regionOptions = ref<
  Array<{
    label: string
    value: string
    children?: Array<{
      label: string
      value: string
      children?: Array<{ label: string; value: string }>
    }>
  }>
>([])
const regionValue = ref<string[]>([])
watch(regionValue, (val) => {
  form.province = val?.[0] || ''
  form.city = val?.[1] || ''
  form.district = val?.[2] || ''
})

const convertVisible = ref(false)
const currentLead = ref<Lead | null>(null)
const convertFormRef = ref()
// 生成15分钟间隔的时间选项
const generateTimeOptions = () => {
  const options: Array<{ label: string; value: string }> = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = String(hour).padStart(2, '0')
      const minuteStr = String(minute).padStart(2, '0')
      options.push({
        label: `${hourStr}:${minuteStr}`,
        value: `${hourStr}:${minuteStr}:00`,
      })
    }
  }
  return options
}

const timeOptions = ref(generateTimeOptions())

// 获取当前时间所属的15分钟区间
const getCurrentTimeSlot = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  // 向下取整到最近的15分钟
  const roundedMinutes = Math.floor(minutes / 15) * 15
  const hourStr = String(hours).padStart(2, '0')
  const minuteStr = String(roundedMinutes).padStart(2, '0')
  return `${hourStr}:${minuteStr}:00`
}

// 根据开始时间和时长计算结束时间
const calculateEndTime = (startDate: string, startTime: string, durationMinutes: number) => {
  if (!startDate || !startTime) return { date: '', time: getCurrentTimeSlot() }

  const startDateTime = new Date(`${startDate}T${startTime}`)
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)

  const endDate = endDateTime.toISOString().split('T')[0]
  const endHours = endDateTime.getHours()
  const endMinutes = endDateTime.getMinutes()
  // 向下取整到最近的15分钟
  const roundedMinutes = Math.floor(endMinutes / 15) * 15
  const hourStr = String(endHours).padStart(2, '0')
  const minuteStr = String(roundedMinutes).padStart(2, '0')
  const endTime = `${hourStr}:${minuteStr}:00`

  return { date: endDate, time: endTime }
}

const convertForm = reactive<{
  convertToCustomer: boolean
  convertToOpportunity: boolean
  opportunityName?: string
  amount?: number
  stage?: string
  status?: string
  probability?: number
  expectedCloseDate?: string
  planNextActivity: boolean
  activityTitle?: string
  activityType?: string
  activityStartDate?: string
  activityStartTime?: string
  activityEndDate?: string
  activityEndTime?: string
  activityDuration?: string
  activityDescription?: string
  activityLocation?: string
  planNextVisit: boolean
  visitDescription?: string
  visitType?: string
  visitStartDate?: string
  visitStartTime?: string
  visitEndDate?: string
  visitEndTime?: string
  visitDuration?: string
  visitPurpose?: string
  visitAddress?: string
}>({
  convertToCustomer: true,
  convertToOpportunity: false,
  opportunityName: undefined,
  amount: undefined,
  stage: undefined,
  status: undefined,
  probability: undefined,
  expectedCloseDate: undefined,
  planNextActivity: false,
  activityTitle: undefined,
  activityType: undefined,
  activityStartDate: undefined,
  activityStartTime: getCurrentTimeSlot(),
  activityEndDate: undefined,
  activityEndTime: getCurrentTimeSlot(),
  activityDuration: '30',
  activityDescription: undefined,
  activityLocation: undefined,
  planNextVisit: false,
  visitDescription: undefined,
  visitType: undefined,
  visitStartDate: undefined,
  visitStartTime: getCurrentTimeSlot(),
  visitEndDate: undefined,
  visitEndTime: getCurrentTimeSlot(),
  visitDuration: '30',
  visitPurpose: undefined,
  visitRegion: undefined,
  visitAddress: undefined,
})
const convertLoading = ref(false)

// 转移相关
const transferVisible = ref(false)

// 不合格对话框相关
const unqualifiedDialogVisible = ref(false)
const unqualifiedSubmitLoading = ref(false)
const unqualifiedFormRef = ref()
const unqualifiedForm = reactive({
  leadId: '',
  fromStatus: '',
  unqualifiedReason: '',
  lostStage: '',
  lostType: '',
})
const transferMode = ref<'single' | 'batch'>('single')
const currentTransferLead = ref<Lead | null>(null)
const transferForm = reactive<{ newOwnerId?: string }>({
  newOwnerId: '',
})
const transferLoading = ref(false)

// 删除相关
const deleteLoading = ref(false)

// 抽屉相关
const drawerVisible = ref(false)
const selectedLead = ref<Lead | null>(null)
const activeTab = ref<'basic' | 'activities' | 'business'>('basic')
const loadedTabs = ref<Set<string>>(new Set())
const menuCollapsed = ref(false)
const detailContentRef = ref<HTMLElement | null>(null)

// 工商信息相关
const businessInfo = ref<BusinessInfo | null>(null)
const businessInfoLoading = ref(false)
const businessInfoRefreshing = ref(false)
const businessInfoExpired = ref(false)
const businessSubTab = ref<'info' | 'personnel' | 'shareholders' | 'branches' | 'investments' | 'changes'>('info')

// 打开详情抽屉
const openDetail = (row: Lead) => {
  selectedLead.value = row
  activeTab.value = 'basic'
  drawerVisible.value = true
  loadedTabs.value.clear()
  businessInfo.value = null
  businessInfoExpired.value = false
  businessSubTab.value = 'info'
  // 等待DOM更新后滚动到基本信息
  nextTick(() => {
    scrollToSection('basic')
  })
}

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false
  selectedLead.value = null
  loadedTabs.value.clear()
  businessInfo.value = null
  businessInfoExpired.value = false
  businessSubTab.value = 'info'
  activeTab.value = 'basic'
}

// 锚点导航点击处理
const handleNavClick = (tab: 'basic' | 'activities' | 'business') => {
  activeTab.value = tab
  scrollToSection(tab)
}

// 滚动到指定section
const scrollToSection = (tab: string) => {
  nextTick(() => {
    const sectionId = `lead-section-${tab}`
    const section = document.getElementById(sectionId)
    if (section && detailContentRef.value) {
      const container = detailContentRef.value
      const sectionTop = section.offsetTop - container.offsetTop - 20 // 20px offset
      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      })
    }
  })
}

// 处理详情页滚动，更新activeTab
const handleDetailScroll = () => {
  if (!detailContentRef.value) return

  const container = detailContentRef.value
  const scrollTop = container.scrollTop + 100 // 100px offset for header

  const sections = [
    { id: 'lead-section-basic', tab: 'basic' },
    { id: 'lead-section-activities', tab: 'activities' },
    { id: 'lead-section-business', tab: 'business' },
  ]

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id)
    if (section) {
      const sectionTop = section.offsetTop - container.offsetTop
      if (scrollTop >= sectionTop) {
        activeTab.value = sections[i].tab as any
        break
      }
    }
  }
}

// 编辑线索
const openEditLead = () => {
  if (!selectedLead.value) return
  router.push({
    path: '/leads',
    query: { id: selectedLead.value.id, action: 'edit' },
  })
}

// 加载工商信息
const loadBusinessInfo = async () => {
  if (!selectedLead.value?.company) {
    console.log('[loadBusinessInfo] 公司名称为空，跳过加载')
    businessInfo.value = null
    return
  }

  const companyName = selectedLead.value.company.trim()
  console.log('[loadBusinessInfo] 开始加载工商信息，companyName:', companyName)
  businessInfoLoading.value = true
  try {
    const tenantId = (authStore as any)?.user?.tenantId
    console.log('[loadBusinessInfo] 调用 getBusinessInfoByCompanyName API，companyName:', companyName)
    const response = await businessInfoApi.getBusinessInfoByCompanyName(
      companyName,
      tenantId ? (typeof tenantId === 'string' ? parseInt(tenantId, 10) : tenantId) : undefined,
    )
    console.log('[loadBusinessInfo] getBusinessInfoByCompanyName 返回:', {
      hasData: !!response.data,
      expired: response.expired,
    })

    // 如果没有数据但有公司名称，自动刷新
    if (!response.data && companyName) {
      console.log('[loadBusinessInfo] 没有缓存数据，自动触发刷新，companyName:', companyName)
      // 自动触发刷新
      try {
        console.log('[loadBusinessInfo] 调用 refreshBusinessInfoByCompanyName API，companyName:', companyName)
        const refreshResponse = await businessInfoApi.refreshBusinessInfoByCompanyName(companyName)
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
  if (!selectedLead.value?.company) {
    return
  }

  const companyName = selectedLead.value.company.trim()
  businessInfoRefreshing.value = true
  try {
    const response = await businessInfoApi.refreshBusinessInfoByCompanyName(companyName)
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

// 格式化日期（仅日期部分）
const formatDateOnly = (dateStr?: string | Date | null) => {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return '-'
    // 检查日期是否有效（不是无效日期，且不是1970-01-01这种默认值）
    if (date.getFullYear() < 1900) return '-'
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (e) {
    return '-'
  }
}

// 格式化文本中的日期字符串（用于变更前/变更后字段）
const formatDatesInText = (text: string | null | undefined): string => {
  if (!text) return '-'

  // 匹配各种日期格式：
  // 1. "MM DD YYYY HH:MMAM/PM" 格式（如 "09 8 2004 12:00AM"）
  // 2. "MM/DD/YYYY" 格式
  // 3. "YYYY-MM-DD" 格式

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

// 将元转换为万元
const convertToWanYuan = (amount?: number | null): number | null => {
  if (amount === undefined || amount === null) return null
  return amount / 10000
}

// 格式化货币
const formatCurrency = (amount?: number, showSymbol = true) => {
  if (amount === undefined || amount === null) return '-'
  const formatted = amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return showSymbol ? `¥${formatted}` : formatted
}

// 监听tab切换
watch(activeTab, async (tab) => {
  if (!drawerVisible.value || !selectedLead.value?.id) return

  // 如果该tab已经加载过，不再重复加载
  if (loadedTabs.value.has(tab)) {
    return
  }

  if (tab === 'business') {
    await loadBusinessInfo()
    loadedTabs.value.add('business')
  }
})

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const authStore = useAuthStore()
const currentMemberId = computed(() => {
  return (authStore as any)?.user?.memberId || (authStore as any)?.user?.id
})
const ownerOptions = ref<Array<{ id: string; name: string }>>([])
const ownerLoading = ref(false)
const isDepartmentManager = ref(false)

const getCurrentUserName = () =>
  (authStore as any)?.user?.username ||
  (authStore as any)?.user?.realName ||
  (authStore as any)?.user?.nickname ||
  '当前用户'

const sourceOptions = ref<{ key: string; label: string }[]>([])
const getSourceLabel = (key?: string) =>
  sourceOptions.value.find((s) => s.key === key)?.label || '-'
const industryOptions = ref<{ key: string; label: string }[]>([])
const getIndustryLabel = (key?: string) =>
  industryOptions.value.find((i) => i.key === key)?.label || '-'
const unqualifiedReasonOptions = ref<{ key: string; label: string }[]>([])
const getUnqualifiedReasonLabel = (key?: string) =>
  unqualifiedReasonOptions.value.find((r) => r.key === key)?.label || '-'
const lostTypeOptions = ref<{ key: string; label: string }[]>([])
const getLostTypeLabel = (key?: string) =>
  lostTypeOptions.value.find((t) => t.key === key)?.label || '-'

const getRatingType = (r?: string) => (r === 'hot' ? 'danger' : r === 'cold' ? 'info' : 'warning')
const getRatingName = (r?: string) => (r === 'hot' ? '热' : r === 'cold' ? '冷' : '温')

// 获取客户等级颜色
const getLevelType = (level?: string) => {
  const colorMap: Record<string, string> = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'info',
  }
  return colorMap[level || ''] || 'default'
}

// 获取地区显示
const getRegionDisplay = (province?: string, city?: string, district?: string) => {
  const parts = [province, city, district].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : '-'
}
const getStatusType = (s?: string) => {
  const colorMap: Record<string, string> = {
    new: 'info',
    contacted: 'primary',
    qualified: 'success',
    unqualified: 'warning',
    converted: 'success',
  }
  return colorMap[s || 'new'] || 'default'
}

const getStatusName = (s?: string) => {
  const nameMap: Record<string, string> = {
    new: '新建',
    contacted: '已联系',
    qualified: '合格',
    unqualified: '不合格',
    converted: '已转化',
  }
  return nameMap[s || 'new'] || s || '新建'
}

const loadSources = async () => {
  try {
    const resp = await leadApi.sources()
    sourceOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}
const loadIndustries = async () => {
  try {
    const resp = await commonApi.industries()
    industryOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}
const loadUnqualifiedReasons = async () => {
  try {
    const resp = await commonApi.unqualifiedReasons()
    unqualifiedReasonOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}
const loadLostTypes = async () => {
  try {
    const resp = await commonApi.lostTypes()
    lostTypeOptions.value =
      (resp as unknown as { data: Array<{ key: string; label: string }> }).data || []
  } catch {
    // 忽略错误
  }
}

const loadData = async () => {
  try {
    loading.value = true
    // 构建查询参数，只包含有值的过滤条件
    const params: QueryLeadDto = {
      // 看板视图加载所有数据，列表视图使用分页
      page: viewMode.value === 'kanban' ? 1 : pagination.page,
      limit: viewMode.value === 'kanban' ? 10000 : pagination.limit,
    }
    if (filters.search?.trim()) {
      params.search = filters.search.trim()
    }
    // 处理状态过滤（多选，转换为逗号分隔的字符串）
    if (filters.status) {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        params.status = filters.status.join(',')
      } else if (typeof filters.status === 'string' && filters.status !== '') {
        params.status = filters.status
      }
    }
    if (filters.rating && filters.rating !== '') {
      params.rating = filters.rating
    }
    if (filters.source && filters.source !== '') {
      params.source = filters.source
    }
    // 线索池：只显示没有负责人的线索
    if (isLeadPool.value) {
      params.ownerId = 'null' // 传递字符串 'null' 给后端
    }
    console.log('[loadData] filters对象:', filters)
    console.log('[loadData] 查询参数:', params)
    const resp = await leadApi.getList(params)
    console.log('[loadData] 响应数据:', resp)
    const payload = (resp as unknown as { data: { leads: Lead[]; total: number } }).data || {
      leads: [],
      total: 0,
    }
    list.value = payload.leads
    pagination.total = payload.total

    // 如果是看板视图，重新初始化拖拽
    if (viewMode.value === 'kanban') {
      await nextTick()
      initKanbanSortable()
    }
  } catch {
    ElMessage.error('加载线索失败')
  } finally {
    loading.value = false
  }
}

// 监听路由变化，重新加载数据
watch(() => route.path, () => {
  pagination.page = 1
  loadData()
})

const handleSearch = () => {
  pagination.page = 1
  loadData()
}
const handleReset = () => {
  Object.assign(filters, {
    search: '',
    status: ['new', 'contacted', 'qualified'] as any, // 重置为默认值
    rating: undefined,
    source: undefined,
  })
  pagination.page = 1
  loadData()
}
const handleSizeChange = (n: number) => {
  pagination.limit = n
  pagination.page = 1
  loadData()
}
const handleCurrentChange = (p: number) => {
  pagination.page = p
  loadData()
}
const handleSelectionChange = (rows: Lead[]) => {
  selectedRows.value = rows
}

// 初始化看板拖拽
const initKanbanSortable = () => {
  nextTick(() => {
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
          const leadId = item.getAttribute('data-id')

          console.log('拖拽事件触发:', {
            fromStatus,
            toStatus,
            leadId,
            oldIndex,
            newIndex,
          })

          // 检查必要的数据
          if (!leadId) {
            console.warn('缺少线索ID，卡片元素:', item)
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

          // 找到对应的线索
          const lead = list.value.find((l) => {
            return String(l.id) === String(leadId) || l.id === leadId
          })

          if (!lead) {
            console.warn('未找到对应的线索，leadId:', leadId)
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
          const originalStatus = lead.status

          // 如果拖拽到不合格状态，弹出对话框
          if (toStatus === 'unqualified') {
            // 设置对话框数据
            unqualifiedForm.leadId = String(leadId)
            unqualifiedForm.fromStatus = fromStatus || originalStatus
            unqualifiedForm.unqualifiedReason = ''
            unqualifiedForm.lostStage = fromStatus || originalStatus // 流失阶段默认为拖动前的状态
            unqualifiedForm.lostType = ''

            // 恢复原位置（等待用户填写对话框）
            if (fromStatus && oldIndex !== null) {
              const fromColumn = from
              const items = Array.from(fromColumn.children)
              if (items[oldIndex] && item.parentNode === to) {
                fromColumn.insertBefore(item, items[oldIndex])
              }
            }

            // 显示对话框
            unqualifiedDialogVisible.value = true
            return
          }

          try {
            // 更新线索状态
            console.log('调用 API 更新状态:', leadId, toStatus)
            const response = await leadApi.update(String(leadId), { status: toStatus as any })
            console.log('API 响应:', response)

            if (response && (response as any).code === 200) {
              ElMessage.success('线索状态已更新')
              // 更新本地数据
              lead.status = toStatus as any
              console.log('更新成功，新状态:', toStatus)
            } else {
              console.error('API 返回错误:', response)
              throw new Error((response as any)?.message || '更新失败')
            }
          } catch (error: any) {
            console.error('更新线索状态失败:', error)

            // 恢复原位置
            if (fromStatus && oldIndex !== null && fromStatus !== toStatus) {
              const fromColumn = from
              const items = Array.from(fromColumn.children)
              if (item.parentNode === to) {
                fromColumn.insertBefore(item, items[oldIndex] || null)
              }
            }

            // 恢复本地数据
            lead.status = originalStatus

            // 显示错误消息
            const errorMessage = error?.response?.data?.message || error?.message || '更新线索状态失败'
            ElMessage.error(errorMessage)
          }
        },
      })

      sortableInstances.value.push(sortable)
    })
  })
}

// 提交不合格表单
const submitUnqualified = async () => {
  // 验证必填字段
  if (!unqualifiedForm.unqualifiedReason) {
    ElMessage.warning('请选择不合格原因')
    return
  }
  if (!unqualifiedForm.lostType) {
    ElMessage.warning('请选择流失类型')
    return
  }

  try {
    unqualifiedSubmitLoading.value = true

    // 更新线索状态和相关字段
    const updateData: any = {
      status: 'unqualified',
      unqualifiedReason: unqualifiedForm.unqualifiedReason,
      lostStage: unqualifiedForm.lostStage,
      lostType: unqualifiedForm.lostType,
    }

    const response = await leadApi.update(unqualifiedForm.leadId, updateData)

    if (response && (response as any).code === 200) {
      ElMessage.success('线索已标记为不合格')
      unqualifiedDialogVisible.value = false
      // 重置表单
      unqualifiedForm.leadId = ''
      unqualifiedForm.fromStatus = ''
      unqualifiedForm.unqualifiedReason = ''
      unqualifiedForm.lostStage = ''
      unqualifiedForm.lostType = ''
      // 重新加载数据
      await loadData()
    } else {
      throw new Error((response as any)?.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新线索状态失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '更新线索状态失败'
    ElMessage.error(errorMessage)
  } finally {
    unqualifiedSubmitLoading.value = false
  }
}

const ensureDefaultOwner = () => {
  const memberId = currentMemberId.value
  form.ownerId = memberId ? String(memberId) : ''
}

// 企业搜索相关
const companySearchLoading = ref(false)
const companySearchResults = ref<CompanySearchResult[]>([])
let companySearchAbortController: AbortController | null = null

// 搜索企业
const handleCompanySearch = async () => {
  const keyword = form.company?.trim()
  if (!keyword) {
    ElMessage.warning('请输入公司名称')
    return
  }

  // 取消之前的请求
  if (companySearchAbortController) {
    companySearchAbortController.abort()
  }

  // 创建新的 AbortController
  companySearchAbortController = new AbortController()

  try {
    companySearchLoading.value = true
    const response = await tianyanchaApi.search(keyword, companySearchAbortController.signal)

    // 检查请求是否被取消
    if (companySearchAbortController?.signal.aborted) {
      return
    }

    if (response.code === 200) {
      companySearchResults.value = response.data || []
      if (companySearchResults.value.length === 0) {
        ElMessage.info('未找到相关企业信息')
      }
    } else {
      ElMessage.error(response.message || '搜索失败')
      companySearchResults.value = []
    }
  } catch (error: any) {
    // 如果是取消的请求，不显示错误
    if (error.name === 'AbortError' || error.message?.includes('canceled')) {
      return
    }

    console.error('搜索企业失败:', error)

    // 处理超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      ElMessage.error('请求超时，天眼查服务响应较慢，请稍后重试')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '搜索失败')
    }
    companySearchResults.value = []
  } finally {
    companySearchLoading.value = false
    companySearchAbortController = null
  }
}

// 选择企业
const selectCompany = (company: CompanySearchResult) => {
  form.company = company.name
  companySearchResults.value = []
  ElMessage.success(`已选择：${company.name}`)
}

const openCreate = () => {
  editMode.value = false
  currentEditLead.value = null
  // 重置表单
  Object.assign(form, {
    name: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    leadSource: '',
    rating: 'warm',
    industry: '',
    level: '',
    province: '',
    city: '',
    district: '',
    addressDetail: '',
    ownerId: '',
    status: 'new',
    unqualifiedReason: '',
    lostStage: '',
    lostType: '',
  })
  regionValue.value = []
  companySearchResults.value = []
  ensureDefaultOwner()
  createVisible.value = true
}

const openEdit = async (row: Lead) => {
  // 已转化的线索不允许编辑
  if (row.status === 'converted') {
    ElMessage.warning('已转化的线索不允许编辑')
    return
  }

  editMode.value = true
  currentEditLead.value = row

  // 确保负责人选项已加载
  if (ownerOptions.value.length === 0) {
    await loadOwnerOptions()
  }

  // 填充表单
  Object.assign(form, {
    name: row.name || '',
    company: row.company || '',
    title: row.title || '',
    phone: row.phone || '',
    email: row.email || '',
    leadSource: row.leadSource || '',
    rating: row.rating || 'warm',
    industry: row.industry || '',
    level: row.level || '',
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    addressDetail: row.addressDetail || '',
    ownerId: row.ownerId ? String(row.ownerId) : '',
    status: row.status || 'new',
    unqualifiedReason: row.unqualifiedReason || '',
    lostStage: row.lostStage || '',
    lostType: row.lostType || '',
  })

  // 如果负责人ID不在选项中，尝试添加
  if (form.ownerId && !ownerOptions.value.find((opt) => opt.id === form.ownerId)) {
    // 如果后端返回了owner信息，使用它
    if (row.owner) {
      ownerOptions.value.push({
        id: String(row.owner.id),
        name: row.owner.username || `负责人${row.owner.id}`,
      })
    } else {
      // 否则使用ownerId作为名称（临时方案）
      ownerOptions.value.push({
        id: form.ownerId,
        name: `负责人${form.ownerId}`,
      })
    }
  }
  // 设置地区选择器
  if (row.province || row.city || row.district) {
    regionValue.value = [row.province, row.city, row.district].filter(Boolean) as string[]
  } else {
    regionValue.value = []
  }
  companySearchResults.value = []
  createVisible.value = true
}

const submitCreate = async () => {
  // 验证：当状态为不合格时，不合格原因必填
  if (form.status === 'unqualified' && !form.unqualifiedReason) {
    ElMessage.warning('状态为不合格时，请选择不合格原因')
    return
  }
  try {
    submitLoading.value = true
    // 构建提交数据，统一处理 ownerId 的转换
    const submitData: any = {
      ...form,
    }
    // 处理 ownerId：如果为空字符串，转换为 null；否则转换为数字
    if (form.ownerId && form.ownerId.trim()) {
      const parsedOwnerId = typeof form.ownerId === 'string' ? parseInt(form.ownerId, 10) : form.ownerId
      submitData.ownerId = isNaN(parsedOwnerId) ? null : parsedOwnerId
    } else {
      submitData.ownerId = null
    }

    if (editMode.value && currentEditLead.value) {
      // 编辑模式
      await leadApi.update(currentEditLead.value.id, submitData)
      ElMessage.success('更新成功')
    } else {
      // 创建模式
      await leadApi.create(submitData)
      ElMessage.success('创建成功')
    }
    createVisible.value = false
    loadData()
  } catch {
    ElMessage.error(editMode.value ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

// 处理活动时长变化
const handleActivityDurationChange = (value: string) => {
  if (value === 'custom') {
    // 如果选择自定义，使用当前计算的结束时间作为默认值
    if (convertForm.activityStartDate && convertForm.activityStartTime) {
      const currentDuration = convertForm.activityDuration && convertForm.activityDuration !== 'custom'
        ? parseInt(convertForm.activityDuration)
        : 30
      const endTime = calculateEndTime(convertForm.activityStartDate, convertForm.activityStartTime, currentDuration)
      convertForm.activityEndDate = endTime.date
      convertForm.activityEndTime = endTime.time
    }
  } else {
    // 根据时长自动计算结束时间
    if (convertForm.activityStartDate && convertForm.activityStartTime) {
      const durationMinutes = parseInt(value)
      const endTime = calculateEndTime(convertForm.activityStartDate, convertForm.activityStartTime, durationMinutes)
      convertForm.activityEndDate = endTime.date
      convertForm.activityEndTime = endTime.time
    }
  }
}

// 处理拜访时长变化
const handleVisitDurationChange = (value: string) => {
  if (value === 'custom') {
    // 如果选择自定义，使用当前计算的结束时间作为默认值
    if (convertForm.visitStartDate && convertForm.visitStartTime) {
      const currentDuration = convertForm.visitDuration && convertForm.visitDuration !== 'custom'
        ? parseInt(convertForm.visitDuration)
        : 30
      const endTime = calculateEndTime(convertForm.visitStartDate, convertForm.visitStartTime, currentDuration)
      convertForm.visitEndDate = endTime.date
      convertForm.visitEndTime = endTime.time
    }
  } else {
    // 根据时长自动计算结束时间
    if (convertForm.visitStartDate && convertForm.visitStartTime) {
      const durationMinutes = parseInt(value)
      const endTime = calculateEndTime(convertForm.visitStartDate, convertForm.visitStartTime, durationMinutes)
      convertForm.visitEndDate = endTime.date
      convertForm.visitEndTime = endTime.time
    }
  }
}

// 监听活动开始时间和日期变化，自动计算结束时间（如果选择了预设时长）
watch(
  () => [convertForm.activityStartDate, convertForm.activityStartTime, convertForm.activityDuration],
  ([startDate, startTime, duration]) => {
    if (duration && duration !== 'custom' && startDate && startTime) {
      const durationMinutes = parseInt(duration)
      const endTime = calculateEndTime(startDate as string, startTime as string, durationMinutes)
      convertForm.activityEndDate = endTime.date
      convertForm.activityEndTime = endTime.time
    }
  },
)

// 监听拜访开始时间和日期变化，自动计算结束时间（如果选择了预设时长）
watch(
  () => [convertForm.visitStartDate, convertForm.visitStartTime, convertForm.visitDuration],
  ([startDate, startTime, duration]) => {
    if (duration && duration !== 'custom' && startDate && startTime) {
      const durationMinutes = parseInt(duration)
      const endTime = calculateEndTime(startDate as string, startTime as string, durationMinutes)
      convertForm.visitEndDate = endTime.date
      convertForm.visitEndTime = endTime.time
    }
  },
)

const openConvert = (row: Lead) => {
  currentLead.value = row
  // 重置表单
  const currentDate = new Date().toISOString().split('T')[0]
  const currentTime = getCurrentTimeSlot()
  const defaultDuration = 30
  const activityEndTime = calculateEndTime(currentDate, currentTime, defaultDuration)
  const visitEndTime = calculateEndTime(currentDate, currentTime, defaultDuration)

  convertForm.convertToCustomer = true
  convertForm.convertToOpportunity = false
  convertForm.opportunityName = undefined
  convertForm.amount = undefined
  convertForm.stage = undefined
  convertForm.status = undefined
  convertForm.probability = undefined
  convertForm.expectedCloseDate = undefined
  convertForm.planNextActivity = false
  convertForm.activityTitle = undefined
  convertForm.activityType = undefined
  convertForm.activityStartDate = currentDate
  convertForm.activityStartTime = currentTime
  convertForm.activityEndDate = activityEndTime.date
  convertForm.activityEndTime = activityEndTime.time
  convertForm.activityDuration = '30'
  convertForm.activityDescription = undefined
  convertForm.activityLocation = undefined
  convertForm.planNextVisit = false
  convertForm.visitDescription = undefined
  convertForm.visitType = undefined
  convertForm.visitStartDate = currentDate
  convertForm.visitStartTime = currentTime
  convertForm.visitEndDate = visitEndTime.date
  convertForm.visitEndTime = visitEndTime.time
  convertForm.visitDuration = '30'
  convertForm.visitPurpose = undefined
  convertForm.visitRegion = undefined
  convertForm.visitAddress = undefined
  convertVisible.value = true
}
const submitConvert = async () => {
  if (!currentLead.value) return

  // 如果勾选了转化为商机，验证必填字段
  if (convertForm.convertToOpportunity) {
    if (!convertForm.opportunityName || !convertForm.opportunityName.trim()) {
      ElMessage.warning('请输入商机标题')
      return
    }
    if (convertForm.amount === undefined || convertForm.amount === null) {
      ElMessage.warning('请输入预计价值')
      return
    }
    if (!convertForm.stage) {
      ElMessage.warning('请选择商机阶段')
      return
    }
    if (!convertForm.status) {
      ElMessage.warning('请选择商机状态')
      return
    }
    if (convertForm.probability === undefined || convertForm.probability === null) {
      ElMessage.warning('请选择成交概率')
      return
    }
    if (!convertForm.expectedCloseDate) {
      ElMessage.warning('请选择预计成交日期')
      return
    }
  }

  // 如果勾选了下一步计划活动，验证必填字段
  if (convertForm.planNextActivity) {
    if (!convertForm.activityTitle || !convertForm.activityTitle.trim()) {
      ElMessage.warning('请输入活动标题')
      return
    }
    if (!convertForm.activityType) {
      ElMessage.warning('请选择活动类型')
      return
    }
    if (!convertForm.activityStartDate || !convertForm.activityStartTime) {
      ElMessage.warning('请选择计划开始日期和时间')
      return
    }
    if (!convertForm.activityDuration) {
      ElMessage.warning('请选择时长')
      return
    }
    if (convertForm.activityDuration === 'custom') {
      if (!convertForm.activityEndDate || !convertForm.activityEndTime) {
        ElMessage.warning('请选择计划结束日期和时间')
        return
      }
    }
  }

  // 如果勾选了下一步计划拜访，验证必填字段
  if (convertForm.planNextVisit) {
    if (!convertForm.visitDescription || !convertForm.visitDescription.trim()) {
      ElMessage.warning('请输入拜访描述')
      return
    }
    if (!convertForm.visitType) {
      ElMessage.warning('请选择拜访类型')
      return
    }
    if (!convertForm.visitStartDate || !convertForm.visitStartTime) {
      ElMessage.warning('请选择计划开始日期和时间')
      return
    }
    if (!convertForm.visitDuration) {
      ElMessage.warning('请选择时长')
      return
    }
    if (convertForm.visitDuration === 'custom') {
      if (!convertForm.visitEndDate || !convertForm.visitEndTime) {
        ElMessage.warning('请选择计划结束日期和时间')
        return
      }
    }
  }

  try {
    convertLoading.value = true

    // 准备提交数据，合并日期和时间
    const submitData: any = { ...convertForm }

    // 处理活动时间
    if (convertForm.planNextActivity && convertForm.activityStartDate && convertForm.activityStartTime) {
      submitData.activityStartTime = `${convertForm.activityStartDate} ${convertForm.activityStartTime}`
      if (convertForm.activityDuration === 'custom' && convertForm.activityEndDate && convertForm.activityEndTime) {
        submitData.activityEndTime = `${convertForm.activityEndDate} ${convertForm.activityEndTime}`
      } else if (convertForm.activityEndDate && convertForm.activityEndTime) {
        submitData.activityEndTime = `${convertForm.activityEndDate} ${convertForm.activityEndTime}`
      }
      // 删除不需要的字段
      delete submitData.activityStartDate
      delete submitData.activityEndDate
      delete submitData.activityDuration
    }

    // 处理拜访时间
    if (convertForm.planNextVisit && convertForm.visitStartDate && convertForm.visitStartTime) {
      submitData.visitStartTime = `${convertForm.visitStartDate} ${convertForm.visitStartTime}`
      if (convertForm.visitDuration === 'custom' && convertForm.visitEndDate && convertForm.visitEndTime) {
        submitData.visitEndTime = `${convertForm.visitEndDate} ${convertForm.visitEndTime}`
      } else if (convertForm.visitEndDate && convertForm.visitEndTime) {
        submitData.visitEndTime = `${convertForm.visitEndDate} ${convertForm.visitEndTime}`
      }
      // 处理地区字段
      if (convertForm.visitRegion && convertForm.visitRegion.length > 0) {
        submitData.visitRegion = convertForm.visitRegion
      }
      // 删除不需要的字段
      delete submitData.visitStartDate
      delete submitData.visitEndDate
      delete submitData.visitDuration
    }

    await leadApi.convert(currentLead.value.id, submitData)
    ElMessage.success('转化成功')
    convertVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '转化失败')
  } finally {
    convertLoading.value = false
  }
}

// 打开单个转移
const openTransfer = (row: Lead) => {
  currentTransferLead.value = row
  transferMode.value = 'single'
  transferForm.newOwnerId = ''
  transferVisible.value = true
}

// 打开批量转移
const openBatchTransfer = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要转移的线索')
    return
  }
  currentTransferLead.value = null
  transferMode.value = 'batch'
  transferForm.newOwnerId = ''
  transferVisible.value = true
}

// 提交转移
const submitTransfer = async () => {
  if (!transferForm.newOwnerId) {
    ElMessage.warning('请选择负责人')
    return
  }

  try {
    transferLoading.value = true

    let leadIds: string[] = []
    if (transferMode.value === 'single') {
      if (!currentTransferLead.value) return
      leadIds = [currentTransferLead.value.id]
    } else {
      leadIds = selectedRows.value.map(row => row.id)
    }

    await leadApi.transfer(leadIds, transferForm.newOwnerId)
    ElMessage.success(
      transferMode.value === 'single' ? '转移成功' : `成功转移 ${leadIds.length} 条线索`
    )
    transferVisible.value = false
    selectedRows.value = []
    loadData()
  } catch (error) {
    const message = error instanceof Error ? error.message : '转移失败'
    ElMessage.error(message)
  } finally {
    transferLoading.value = false
  }
}

// 删除单个线索
const handleDelete = async (row: Lead) => {
  // 已转化的线索不允许删除
  if (row.status === 'converted') {
    ElMessage.warning('已转化的线索不允许删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除线索"${row.name || row.company || '未命名'}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    deleteLoading.value = true
    await leadApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除失败'
      ElMessage.error(message)
    }
  } finally {
    deleteLoading.value = false
  }
}

// 放入线索池
const handleMoveToPool = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要放入线索池的线索')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 条线索放入线索池吗？`,
      '确认放入线索池',
      {
        type: 'warning',
      },
    )

    const leadIds = selectedRows.value.map(row => row.id)
    await leadApi.moveToPool(leadIds)
    ElMessage.success(`成功将 ${leadIds.length} 条线索放入线索池`)
    selectedRows.value = []
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '放入线索池失败')
    }
  }
}

// 领取线索
const handleClaim = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要领取的线索')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要领取选中的 ${selectedRows.value.length} 条线索吗？`,
      '确认领取',
      {
        type: 'warning',
      },
    )

    const leadIds = selectedRows.value.map(row => row.id)
    await leadApi.claim(leadIds)
    ElMessage.success(`成功领取 ${leadIds.length} 条线索`)
    selectedRows.value = []
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '领取失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的线索')
    return
  }

  // 检查是否有已转化的线索
  const convertedLeads = selectedRows.value.filter((row) => row.status === 'converted')
  if (convertedLeads.length > 0) {
    ElMessage.warning(`选中的线索中包含 ${convertedLeads.length} 条已转化的线索，已转化的线索不允许删除`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条线索吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    deleteLoading.value = true
    const leadIds = selectedRows.value.map(row => row.id)
    await leadApi.deleteBatch(leadIds)
    ElMessage.success(`成功删除 ${leadIds.length} 条线索`)
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除失败'
      ElMessage.error(message)
    }
  } finally {
    deleteLoading.value = false
  }
}

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
      form.ownerId = currentUserOption.id
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
    if (!form.ownerId) {
      form.ownerId = currentUserOption.id
    }
  } catch (error) {
    console.error('加载负责人列表失败:', error)
    const memberId = currentMemberId.value
    if (memberId) {
      const currentUserOption = { id: String(memberId), name: getCurrentUserName() }
      ownerOptions.value = [currentUserOption]
      form.ownerId = currentUserOption.id
    } else {
      ownerOptions.value = []
    }
  } finally {
    ownerLoading.value = false
  }
}

watch(
  () => currentMemberId.value,
  (val, prev) => {
    if (val && val !== prev) {
      loadOwnerOptions()
      ensureDefaultOwner()
    }
  },
)

// 计算统计卡片数据
const statisticsCards = computed(() => {
  const overview = statisticsData.value.overview || {}
  return [
    {
      label: '总线索数',
      value: overview.totalLeads || 0,
      icon: DataAnalysis,
      iconClass: 'icon-primary',
    },
    {
      label: '今日新增',
      value: overview.todayNewLeads || 0,
      icon: TrendCharts,
      iconClass: 'icon-success',
    },
    {
      label: '待跟进',
      value: overview.pendingLeads || 0,
      icon: Clock,
      iconClass: 'icon-warning',
    },
    {
      label: '合格线索',
      value: overview.qualifiedLeads || 0,
      icon: Check,
      iconClass: 'icon-info',
    },
    {
      label: '转化线索',
      value: overview.convertedLeads || 0,
      icon: Trophy,
      iconClass: 'icon-danger',
    },
    {
      label: '转化率',
      value: `${(overview.conversionRate || 0).toFixed(2)}%`,
      icon: TrendCharts,
      iconClass: 'icon-primary',
    },
  ]
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    statisticsLoading.value = true
    const response = await leadApi.getStatistics()
    if ((response as any).code === 200 || response.data?.code === 200) {
      statisticsData.value = (response as any).data?.data || (response as any).data || response.data
      // 延迟初始化图表，确保DOM已渲染
      setTimeout(() => {
        initCharts()
      }, 100)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    statisticsLoading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initStatusPieChart()
  initSourcePieChart()
  initRatingPieChart()
  initSourceBarChart()
  initOwnerBarChart()
  initIndustryPieChart()
  initRegionMapChart()
  initChurnReasonPieChart()
  initChurnStageBarChart()
  initChurnTypePieChart()
  initChurnTrendLineChart()
}

// 初始化状态分布饼图
const initStatusPieChart = () => {
  if (!statusPieChart.value) return

  if (statusPieChartInstance) {
    statusPieChartInstance.dispose()
  }

  statusPieChartInstance = echarts.init(statusPieChart.value)

  const data = statisticsData.value.statusDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '状态分布',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: item.label,
        })),
      },
    ],
  }

  statusPieChartInstance.setOption(option)
}

// 初始化来源分布饼图
const initSourcePieChart = () => {
  if (!sourcePieChart.value) return

  if (sourcePieChartInstance) {
    sourcePieChartInstance.dispose()
  }

  sourcePieChartInstance = echarts.init(sourcePieChart.value)

  const data = statisticsData.value.sourceDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '来源分布',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getSourceLabel(item.source),
        })),
      },
    ],
  }

  sourcePieChartInstance.setOption(option)
}

// 初始化评分分布饼图
const initRatingPieChart = () => {
  if (!ratingPieChart.value) return

  if (ratingPieChartInstance) {
    ratingPieChartInstance.dispose()
  }

  ratingPieChartInstance = echarts.init(ratingPieChart.value)

  const data = statisticsData.value.ratingDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '评分分布',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: item.label,
          itemStyle: {
            color: item.rating === 'hot' ? '#F56C6C' : item.rating === 'warm' ? '#E6A23C' : '#909399',
          },
        })),
      },
    ],
  }

  ratingPieChartInstance.setOption(option)
}

// 初始化来源分析柱状图
const initSourceBarChart = () => {
  if (!sourceBarChart.value) return

  if (sourceBarChartInstance) {
    sourceBarChartInstance.dispose()
  }

  sourceBarChartInstance = echarts.init(sourceBarChart.value)

  const data = statisticsData.value.sourceDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${param.value}<br/>转化: ${param.data.convertedCount || 0} (${param.data.conversionRate?.toFixed(2) || 0}%)`
      },
    },
    legend: {
      data: ['线索数', '转化数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => getSourceLabel(item.source)),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '线索数',
        type: 'bar',
        data: data.map((item: any) => ({
          value: item.count,
          convertedCount: item.convertedCount,
          conversionRate: item.conversionRate,
        })),
        itemStyle: {
          color: '#409EFF',
        },
      },
      {
        name: '转化数',
        type: 'bar',
        data: data.map((item: any) => item.convertedCount),
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  }

  sourceBarChartInstance.setOption(option)
}

// 初始化负责人/团队分析柱状图
const initOwnerBarChart = () => {
  if (!ownerBarChart.value) return

  if (ownerBarChartInstance) {
    ownerBarChartInstance.dispose()
  }

  ownerBarChartInstance = echarts.init(ownerBarChart.value)

  const data = statisticsData.value.ownerDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${param.value}<br/>转化: ${param.data.convertedCount || 0} (${param.data.conversionRate?.toFixed(2) || 0}%)`
      },
    },
    legend: {
      data: ['线索数', '转化数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.ownerName || `负责人${item.ownerId}`),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '线索数',
        type: 'bar',
        data: data.map((item: any) => ({
          value: item.count,
          convertedCount: item.convertedCount,
          conversionRate: item.conversionRate,
        })),
        itemStyle: {
          color: '#409EFF',
        },
      },
      {
        name: '转化数',
        type: 'bar',
        data: data.map((item: any) => item.convertedCount),
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  }

  ownerBarChartInstance.setOption(option)
}

// 初始化行业分布饼图
const initIndustryPieChart = () => {
  if (!industryPieChart.value) return

  if (industryPieChartInstance) {
    industryPieChartInstance.dispose()
  }

  industryPieChartInstance = echarts.init(industryPieChart.value)

  const data = statisticsData.value.industryDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '行业分布',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getIndustryLabel(item.industry) || item.industry || '未分类',
        })),
      },
    ],
  }

  industryPieChartInstance.setOption(option)
}

// 加载中国地图数据
const loadChinaMap = async () => {
  try {
    // 使用 ECharts 官方地图数据 CDN
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const geoJson = await response.json()
    echarts.registerMap('china', geoJson)
    return geoJson
  } catch (error) {
    console.error('加载中国地图失败:', error)
    throw error
  }
}

// 加载省份城市地图数据
const loadProvinceCityMap = async (provinceName: string) => {
  if (cityMapDataCache.value[provinceName]) {
    return cityMapDataCache.value[provinceName]
  }

  try {
    // 省份名称映射到地图数据中的名称
    const provinceMap: Record<string, string> = {
      '北京市': '110000',
      '天津市': '120000',
      '河北省': '130000',
      '山西省': '140000',
      '内蒙古自治区': '150000',
      '辽宁省': '210000',
      '吉林省': '220000',
      '黑龙江省': '230000',
      '上海市': '310000',
      '江苏省': '320000',
      '浙江省': '330000',
      '安徽省': '340000',
      '福建省': '350000',
      '江西省': '360000',
      '山东省': '370000',
      '河南省': '410000',
      '湖北省': '420000',
      '湖南省': '430000',
      '广东省': '440000',
      '广西壮族自治区': '450000',
      '海南省': '460000',
      '重庆市': '500000',
      '四川省': '510000',
      '贵州省': '520000',
      '云南省': '530000',
      '西藏自治区': '540000',
      '陕西省': '610000',
      '甘肃省': '620000',
      '青海省': '630000',
      '宁夏回族自治区': '640000',
      '新疆维吾尔自治区': '650000',
    }

    const provinceCode = provinceMap[provinceName] || provinceName
    const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${provinceCode}_full.json`)
    const geoJson = await response.json()
    echarts.registerMap(provinceName, geoJson)
    cityMapDataCache.value[provinceName] = geoJson
    return geoJson
  } catch (error) {
    console.error(`加载${provinceName}城市地图失败:`, error)
    throw error
  }
}

// 省份名称标准化映射
const normalizeProvinceName = (name: string): string => {
  const nameMap: Record<string, string> = {
    '北京': '北京市',
    '天津': '天津市',
    '河北': '河北省',
    '山西': '山西省',
    '内蒙古': '内蒙古自治区',
    '辽宁': '辽宁省',
    '吉林': '吉林省',
    '黑龙江': '黑龙江省',
    '上海': '上海市',
    '江苏': '江苏省',
    '浙江': '浙江省',
    '安徽': '安徽省',
    '福建': '福建省',
    '江西': '江西省',
    '山东': '山东省',
    '河南': '河南省',
    '湖北': '湖北省',
    '湖南': '湖南省',
    '广东': '广东省',
    '广西': '广西壮族自治区',
    '海南': '海南省',
    '重庆': '重庆市',
    '四川': '四川省',
    '贵州': '贵州省',
    '云南': '云南省',
    '西藏': '西藏自治区',
    '陕西': '陕西省',
    '甘肃': '甘肃省',
    '青海': '青海省',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区',
  }
  return nameMap[name] || name
}

// 初始化地区分布地图
const initRegionMapChart = async () => {
  if (!regionMapChart.value) return

  try {
    // 确保中国地图已加载
    if (!echarts.getMap('china')) {
      await loadChinaMap()
    }

    if (regionMapChartInstance) {
      regionMapChartInstance.dispose()
    }

    regionMapChartInstance = echarts.init(regionMapChart.value)

    if (currentMapLevel.value === 'province') {
      await renderProvinceMap()
    } else if (currentMapLevel.value === 'city' && currentProvince.value) {
      await renderCityMap(currentProvince.value)
    }
  } catch (error) {
    console.error('初始化地图失败:', error)
  }
}

// 渲染省份地图
const renderProvinceMap = async () => {
  if (!regionMapChartInstance) return

  const data = statisticsData.value.regionDistribution || []

  // 计算最大转化率用于visualMap
  const maxConversionRate = Math.max(
    ...data.map((item: any) => item.conversionRate || 0),
    100
  )

  // 准备地图数据
  const mapData = data.map((item: any) => {
    const provinceName = normalizeProvinceName(item.province || '未分类')
    return {
      name: provinceName,
      value: item.conversionRate || 0,
      count: item.count || 0,
      convertedCount: item.convertedCount || 0,
      conversionRate: item.conversionRate || 0,
    }
  })

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.data) {
          return `${params.name}<br/>线索数: ${params.data.count || 0}<br/>转化数: ${params.data.convertedCount || 0}<br/>转化率: ${(params.data.conversionRate || 0).toFixed(2)}%`
        }
        return `${params.name}<br/>暂无数据`
      },
    },
    visualMap: {
      min: 0,
      max: maxConversionRate,
      left: 'left',
      top: 'bottom',
      text: ['高转化率', '低转化率'],
      calculable: true,
      inRange: {
        color: ['#e0f3ff', '#0066cc'],
      },
      textStyle: {
        color: '#000',
      },
    },
    series: [
      {
        name: '线索分布',
        type: 'map',
        map: 'china',
        roam: true,
        label: {
          show: true,
          fontSize: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
          },
          itemStyle: {
            areaColor: '#389BB7',
          },
        },
        data: mapData,
      },
    ],
  }

  regionMapChartInstance.setOption(option)

  // 监听点击事件，实现下钻
  regionMapChartInstance.off('click')
  regionMapChartInstance.on('click', (params: any) => {
    if (params.name && params.name !== '未分类') {
      drillDownToCity(params.name).catch((error) => {
        console.error('下钻到城市失败:', error)
      })
    }
  })
}

// 初始化流失原因分布饼图
const initChurnReasonPieChart = () => {
  if (!churnReasonPieChart.value) return

  if (churnReasonPieChartInstance) {
    churnReasonPieChartInstance.dispose()
  }

  churnReasonPieChartInstance = echarts.init(churnReasonPieChart.value)

  const data = statisticsData.value.churnAnalysis?.reasonDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '流失原因',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getUnqualifiedReasonLabel(item.reason) || item.reason || '其他',
        })),
      },
    ],
  }

  churnReasonPieChartInstance.setOption(option)
}

// 初始化流失阶段分布柱状图
const initChurnStageBarChart = () => {
  if (!churnStageBarChart.value) return

  if (churnStageBarChartInstance) {
    churnStageBarChartInstance.dispose()
  }

  churnStageBarChartInstance = echarts.init(churnStageBarChart.value)

  const data = statisticsData.value.churnAnalysis?.stageDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
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
      data: data.map((item: any) => item.stageLabel || item.stage || '未知'),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '流失数量',
        type: 'bar',
        data: data.map((item: any) => item.count),
        itemStyle: {
          color: '#F56C6C',
        },
      },
    ],
  }

  churnStageBarChartInstance.setOption(option)
}

// 初始化流失类型分布饼图
const initChurnTypePieChart = () => {
  if (!churnTypePieChart.value) return

  if (churnTypePieChartInstance) {
    churnTypePieChartInstance.dispose()
  }

  churnTypePieChartInstance = echarts.init(churnTypePieChart.value)

  const data = statisticsData.value.churnAnalysis?.typeDistribution || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '流失类型',
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
          formatter: '{b}\n{c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map((item: any) => ({
          value: item.count,
          name: getLostTypeLabel(item.type) || item.type || '未知',
        })),
      },
    ],
  }

  churnTypePieChartInstance.setOption(option)
}

// 初始化流失趋势折线图
const initChurnTrendLineChart = () => {
  if (!churnTrendLineChart.value) return

  if (churnTrendLineChartInstance) {
    churnTrendLineChartInstance.dispose()
  }

  churnTrendLineChartInstance = echarts.init(churnTrendLineChart.value)

  const data = statisticsData.value.churnAnalysis?.trend || []
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item: any) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '流失数量',
        type: 'line',
        smooth: true,
        data: data.map((item: any) => item.count),
        itemStyle: {
          color: '#F56C6C',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' },
            ],
          },
        },
      },
    ],
  }

  churnTrendLineChartInstance.setOption(option)
}

// 渲染城市地图
const renderCityMap = async (provinceName: string) => {
  if (!regionMapChartInstance) return

  try {
    // 加载省份城市地图数据
    await loadProvinceCityMap(provinceName)

    // 获取该省份的城市数据
    const cityData = statisticsData.value.cityDistribution?.filter(
      (item: any) => normalizeProvinceName(item.province) === provinceName
    ) || []

    // 计算最大转化率
    const maxConversionRate = Math.max(
      ...cityData.map((item: any) => item.conversionRate || 0),
      100
    )

    // 准备地图数据
    const mapData = cityData.map((item: any) => ({
      name: item.city || '未分类',
      value: item.conversionRate || 0,
      count: item.count || 0,
      convertedCount: item.convertedCount || 0,
      conversionRate: item.conversionRate || 0,
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            return `${params.name}<br/>线索数: ${params.data.count || 0}<br/>转化数: ${params.data.convertedCount || 0}<br/>转化率: ${(params.data.conversionRate || 0).toFixed(2)}%`
          }
          return `${params.name}<br/>暂无数据`
        },
      },
      visualMap: {
        min: 0,
        max: maxConversionRate,
        left: 'left',
        top: 'bottom',
        text: ['高转化率', '低转化率'],
        calculable: true,
        inRange: {
          color: ['#e0f3ff', '#0066cc'],
        },
        textStyle: {
          color: '#000',
        },
      },
      series: [
        {
          name: '线索分布',
          type: 'map',
          map: provinceName,
          roam: true,
          label: {
            show: true,
            fontSize: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
            },
            itemStyle: {
              areaColor: '#389BB7',
            },
          },
          data: mapData,
        },
      ],
    }

    regionMapChartInstance.setOption(option)

    // 城市级别不再支持下钻
    regionMapChartInstance.off('click')
  } catch (error) {
    console.error(`渲染${provinceName}城市地图失败:`, error)
    ElMessage.error(`加载${provinceName}城市地图失败`)
  }
}

// 下钻到城市级别
const drillDownToCity = async (provinceName: string) => {
  currentMapLevel.value = 'city'
  currentProvince.value = provinceName
  await renderCityMap(provinceName)
}

// 返回省份视图
const backToProvinceMap = async () => {
  currentMapLevel.value = 'province'
  currentProvince.value = null
  await renderProvinceMap()
}

// 监听viewMode变化
watch(viewMode, async (newMode) => {
  if (newMode === 'kanban') {
    await nextTick()
    initKanbanSortable()
  }
  if (newMode === 'statistics') {
    // 切换到数据分析视图时加载数据
    loadStatistics()
  } else {
    // 切换到列表视图时销毁图表实例
    if (statusPieChartInstance) {
      statusPieChartInstance.dispose()
      statusPieChartInstance = null
    }
    if (sourcePieChartInstance) {
      sourcePieChartInstance.dispose()
      sourcePieChartInstance = null
    }
    if (ratingPieChartInstance) {
      ratingPieChartInstance.dispose()
      ratingPieChartInstance = null
    }
    if (sourceBarChartInstance) {
      sourceBarChartInstance.dispose()
      sourceBarChartInstance = null
    }
    if (ownerBarChartInstance) {
      ownerBarChartInstance.dispose()
      ownerBarChartInstance = null
    }
    if (industryPieChartInstance) {
      industryPieChartInstance.dispose()
      industryPieChartInstance = null
    }
    if (regionMapChartInstance) {
      regionMapChartInstance.dispose()
      regionMapChartInstance = null
    }
    if (churnReasonPieChartInstance) {
      churnReasonPieChartInstance.dispose()
      churnReasonPieChartInstance = null
    }
    if (churnStageBarChartInstance) {
      churnStageBarChartInstance.dispose()
      churnStageBarChartInstance = null
    }
    if (churnTypePieChartInstance) {
      churnTypePieChartInstance.dispose()
      churnTypePieChartInstance = null
    }
    if (churnTrendLineChartInstance) {
      churnTrendLineChartInstance.dispose()
      churnTrendLineChartInstance = null
    }
  }
})

// 窗口大小变化时调整图表
const handleResize = () => {
  if (statusPieChartInstance) {
    statusPieChartInstance.resize()
  }
  if (sourcePieChartInstance) {
    sourcePieChartInstance.resize()
  }
  if (ratingPieChartInstance) {
    ratingPieChartInstance.resize()
  }
  if (sourceBarChartInstance) {
    sourceBarChartInstance.resize()
  }
  if (ownerBarChartInstance) {
    ownerBarChartInstance.resize()
  }
  if (industryPieChartInstance) {
    industryPieChartInstance.resize()
  }
  if (regionMapChartInstance) {
    regionMapChartInstance.resize()
  }
  if (churnReasonPieChartInstance) {
    churnReasonPieChartInstance.resize()
  }
  if (churnStageBarChartInstance) {
    churnStageBarChartInstance.resize()
  }
  if (churnTypePieChartInstance) {
    churnTypePieChartInstance.resize()
  }
  if (churnTrendLineChartInstance) {
    churnTrendLineChartInstance.resize()
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await Promise.all([
    loadSources(),
    loadIndustries(),
    loadUnqualifiedReasons(),
    loadLostTypes(),
    loadOwnerOptions(),
  ])
  try {
    const resp = await commonApi.regions()
    regionOptions.value =
      (
        resp as unknown as {
          data: Array<{
            label: string
            value: string
            children?: Array<{
              label: string
              value: string
              children?: Array<{ label: string; value: string }>
            }>
          }>
        }
      ).data || []
  } catch {
    // 忽略错误
  }
  await loadData()

  // 如果初始是看板视图，初始化拖拽
  if (viewMode.value === 'kanban') {
    await nextTick()
    initKanbanSortable()
  }
})

// 监听抽屉显示状态，添加滚动监听
watch(drawerVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (detailContentRef.value) {
        detailContentRef.value.addEventListener('scroll', handleDetailScroll)
      }
    })
  } else {
    if (detailContentRef.value) {
      detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  // 移除滚动监听
  if (detailContentRef.value) {
    detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
  }
  // 清理看板拖拽实例
  sortableInstances.value.forEach((instance: any) => instance.destroy())
  sortableInstances.value = []
  if (statusPieChartInstance) {
    statusPieChartInstance.dispose()
    statusPieChartInstance = null
  }
  if (sourcePieChartInstance) {
    sourcePieChartInstance.dispose()
    sourcePieChartInstance = null
  }
  if (ratingPieChartInstance) {
    ratingPieChartInstance.dispose()
    ratingPieChartInstance = null
  }
  if (sourceBarChartInstance) {
    sourceBarChartInstance.dispose()
    sourceBarChartInstance = null
  }
  if (ownerBarChartInstance) {
    ownerBarChartInstance.dispose()
    ownerBarChartInstance = null
  }
  if (industryPieChartInstance) {
    industryPieChartInstance.dispose()
    industryPieChartInstance = null
  }
    if (regionMapChartInstance) {
      regionMapChartInstance.dispose()
      regionMapChartInstance = null
    }
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
@use '@/styles/common/detail-drawer.scss';

.lead-management {
  @extend .table-page;
}

.pagination-section {
  text-align: right;
}

// 数据分析区域
.statistics-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  // max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
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

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .stat-card-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;

      &.icon-primary {
        background: #e3f2fd;
        color: #409eff;
      }

      &.icon-success {
        background: #e8f5e9;
        color: #67c23a;
      }

      &.icon-warning {
        background: #fff3e0;
        color: #e6a23c;
      }

      &.icon-info {
        background: #e0f2f1;
        color: #909399;
      }

      &.icon-danger {
        background: #ffebee;
        color: #f56c6c;
      }
    }

    .stat-card-content {
      flex: 1;

      .stat-card-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-card-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  &.conversion-row {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  // el-card 已经提供了背景、边框、阴影等样式
  // 这里只需要覆盖一些自定义样式

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .chart-content {
    min-height: 300px;
  }
}

.conversion-card {
  .conversion-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;

    .conversion-item {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e9ecef;

      .conversion-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .conversion-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 8px;
      }

      .conversion-detail {
        font-size: 12px;
        color: #606266;
      }
    }
  }
}

.ellipsis-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #66b1ff;
    text-decoration: underline;
  }
}

// 企业搜索相关样式
.company-search-wrapper {
  display: flex;
  align-items: center;
  width: 100%;

  .search-icon {
    color: #909399;
  }

  .business-icon {
    color: #f5a623;
    cursor: pointer;
  }
}

.company-search-results {
  margin-top: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .company-result-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;
    }

    .company-name {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 6px;
    }

    .company-info {
      font-size: 12px;
      color: #909399;
      display: flex;
      flex-direction: column;
      gap: 4px;

      span {
        line-height: 1.5;
      }
    }
  }
}

// 抽屉样式已移至公共样式文件 @/styles/common/detail-drawer.scss
// 使用 detail-drawer 和 detail-layout 类名即可

// 线索详情页特有的样式（如果需要覆盖公共样式）
.detail-layout {
  .right-content {
    height: 100%;

    .dynamic-content-section.detail-scroll-container {
      height: 100%;
      overflow-y: auto;
      padding-right: 8px;
      scroll-behavior: smooth;
    }

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

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .basic-info-section {
      .lead-header {
        margin-bottom: 20px;

        .lead-title {
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
        }

        .lead-meta {
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
            min-width: 100px;
            margin-right: 8px;
            flex-shrink: 0;
          }

          span {
            color: #303133;
            word-break: break-all;
          }
        }
      }
    }

    .dynamic-content-section {
      .tab-content {
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
      }
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
      margin-right: 8px;
      white-space: nowrap;
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
</style>
