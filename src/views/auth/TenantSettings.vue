<template>
  <div class="tenant-settings-container">
    <el-alert
      v-if="!isTenantOwner"
      type="warning"
      :closable="false"
      style="margin-bottom: 16px"
    >
      只有租户管理员可以修改企业信息
    </el-alert>

    <div class="tenant-settings-layout">
      <!-- 左侧导航 -->
      <div class="tenant-sidebar">
        <!-- 企业信息头部 -->
        <div class="tenant-header">
          <el-avatar :size="64" shape="square" :src="tenantInfo?.logo" :key="tenantInfo?.logo || 'default'">
            <el-icon :size="32"><Picture /></el-icon>
          </el-avatar>
          <div class="tenant-name">{{ tenantInfo?.name || '企业' }}</div>
        </div>

        <!-- 导航菜单 -->
        <div class="nav-menu">
          <div
            v-for="item in menuItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="tenant-content">
        <el-card>
          <!-- 基本信息 -->
          <div v-if="activeTab === 'basic'" class="content-section">
            <h2 class="content-title">基本信息</h2>

            <!-- Logo设置 -->
            <div class="logo-section">
              <div class="logo-label">企业Logo</div>
              <div class="logo-wrapper">
                <el-avatar :size="120" shape="square" :src="tenantInfo?.logo" :key="tenantInfo?.logo || 'default'">
                  <el-icon :size="60"><Picture /></el-icon>
                </el-avatar>
                <el-button
                  type="primary"
                  size="small"
                  @click="handleLogoChange"
                  :disabled="!isTenantOwner"
                >
                  更换Logo
                </el-button>
                <input
                  ref="logoInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleLogoUpload"
                />
              </div>
              <div class="logo-desc">
                <p>建议上传尺寸：200x200px，支持 JPG、PNG 格式</p>
                <p>文件大小不超过 5MB</p>
              </div>
            </div>

            <!-- 企业基本信息表单 -->
            <el-form
              ref="tenantFormRef"
              :model="tenantForm"
              :rules="tenantRules"
              label-width="140px"
              style="max-width: 600px"
            >
              <el-form-item label="* 企业名称" prop="name">
                <el-input
                  v-model="tenantForm.name"
                  placeholder="请输入企业名称"
                  :disabled="!isTenantOwner"
                />
              </el-form-item>
              <el-form-item label="企业描述">
                <el-input
                  v-model="tenantForm.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入企业描述"
                  :disabled="!isTenantOwner"
                />
              </el-form-item>
              <el-form-item label="企业状态">
                <el-select
                  v-model="tenantForm.status"
                  placeholder="请选择状态"
                  style="width: 100%"
                  :disabled="!isTenantOwner"
                >
                  <el-option label="活跃" value="active" />
                  <el-option label="非活跃" value="inactive" />
                  <el-option label="暂停" value="suspended" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="isTenantOwner">
                <el-button type="primary" @click="updateTenantInfo" :loading="tenantLoading">
                  保存
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 租户配置 -->
          <div v-if="activeTab === 'config' && isTenantOwner" class="content-section">
            <h2 class="content-title">租户配置</h2>
            <el-form
              ref="configFormRef"
              :model="configForm"
              :rules="configRules"
              label-width="180px"
              style="max-width: 700px"
            >
              <el-form-item label="层级深度">
                <span>{{ tenantInfo?.level || 0 }}</span>
              </el-form-item>
              <el-form-item label="父租户" v-if="tenantInfo?.parentId">
                <span>{{ tenantInfo?.parentName || '未知' }}</span>
              </el-form-item>

              <el-divider content-position="left">提醒设置</el-divider>

              <el-form-item label="合同到期提前提醒天数" prop="contractExpiryReminderDays">
                <el-input-number
                  v-model="configForm.contractExpiryReminderDays"
                  :min="1"
                  :max="365"
                  :precision="0"
                  style="width: 200px"
                />
                <div class="form-tip">设置合同到期前多少天开始提醒，默认7天</div>
              </el-form-item>

              <el-form-item label="商机预计成交提前提醒天数" prop="opportunityCloseReminderDays">
                <el-input-number
                  v-model="configForm.opportunityCloseReminderDays"
                  :min="1"
                  :max="365"
                  :precision="0"
                  style="width: 200px"
                />
                <div class="form-tip">设置商机预计成交前多少天开始提醒，默认7天</div>
              </el-form-item>

              <el-divider content-position="left">税务设置</el-divider>

              <el-form-item label="默认税率(%)" prop="defaultTaxRate">
                <el-input-number
                  v-model="configForm.defaultTaxRate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :controls="false"
                  style="width: 200px"
                />
                <div class="form-tip">用于报价、合同、订单的默认行税率，可在单据中按行调整</div>
              </el-form-item>

              <el-divider content-position="left">公海规则设置</el-divider>

              <el-form-item label="客户自动回到公海天数" prop="customerPoolAutoReturnDays">
                <el-input-number
                  v-model="configForm.customerPoolAutoReturnDays"
                  :min="1"
                  :max="365"
                  :precision="0"
                  style="width: 200px"
                />
                <div class="form-tip">设置客户多少天未联系后自动回到公海，默认30天</div>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="updateTenantConfig" :loading="configLoading">
                  保存配置
                </el-button>
                <el-button @click="resetConfigForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 价格配置 -->
          <div v-if="activeTab === 'pricing' && isTenantOwner" class="content-section">
            <h2 class="content-title">价格配置</h2>
            <el-form
              ref="pricingFormRef"
              :model="pricingForm"
              :rules="pricingRules"
              label-width="180px"
              style="max-width: 900px"
            >
              <el-form-item label="价格计算模式" prop="pricingMode">
                <el-radio-group v-model="pricingForm.pricingMode">
                  <el-radio value="simple">简单模式（单一单价）</el-radio>
                  <el-radio value="complex">复杂模式（价格组成项）</el-radio>
                </el-radio-group>
                <div class="form-tip">简单模式：只需要一个单价字段；复杂模式：单价由多个价格组成项计算得出</div>
              </el-form-item>

              <template v-if="pricingForm.pricingMode === 'complex'">
                <el-divider content-position="left">价格组成项配置</el-divider>
                <el-form-item label="价格组成项" prop="priceComponents">
                  <div class="price-components-list">
                    <el-table
                      ref="priceComponentsTableRef"
                      :data="pricingForm.priceComponents"
                      border
                      style="width: 100%"
                      row-key="key"
                    >
                      <el-table-column label="排序" width="70" align="center">
                        <template #default>
                          <el-icon class="price-component-drag-handle" style="cursor: move; color: #909399;">
                            <Rank />
                          </el-icon>
                        </template>
                      </el-table-column>
                      <el-table-column
                        type="index"
                        label="序号"
                        width="60"
                        align="center"
                        :index="(index: number) => index + 1"
                      />
                    <el-table-column label="字段Key" width="180">
                      <template #default="{ row }">
                        <span>{{ row.key || '-' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="显示名称" width="150">
                        <template #default="{ row }">
                          <el-input
                            v-model="row.label"
                            placeholder="如：出厂价"
                            @change="handlePriceComponentLabelChange(row)"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="是否必填" width="100" align="center">
                        <template #default="{ row }">
                          <el-checkbox v-model="row.required" />
                        </template>
                      </el-table-column>
                      <el-table-column label="默认值" width="120">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.defaultValue"
                            :min="0"
                            :precision="2"
                            :controls="false"
                            style="width: 100%"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="100" align="center">
                        <template #default="{ $index }">
                          <el-button
                            type="danger"
                            size="small"
                            :icon="Delete"
                            @click="removePriceComponent($index)"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button
                      type="primary"
                      :icon="Plus"
                      @click="addPriceComponent"
                      style="margin-top: 10px"
                    >
                      添加价格组成项
                    </el-button>
                  </div>
                </el-form-item>
              </template>

              <el-form-item>
                <el-button type="primary" @click="updatePricingConfig" :loading="pricingLoading">
                  保存配置
                </el-button>
                <el-button @click="resetPricingForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 产品配置 -->
          <div v-if="activeTab === 'productConfig' && isTenantOwner" class="content-section">
            <h2 class="content-title">产品配置</h2>

            <!-- 分类字段配置 -->
            <div style="margin-bottom: 32px;">
              <!-- 工具栏 -->
              <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 500;">分类字段配置</span>
                <el-button type="primary" size="small" :icon="Plus" @click="addCategoryField">
                  添加字段
                </el-button>
              </div>
                <!-- 表格 -->
                <el-table
                  :data="productConfigForm.categoryFields"
                  border
                  v-loading="productConfigLoading"
                  style="width: 100%"
                  row-key="fieldKey"
                  ref="categoryFieldsTableRef"
                >
                    <el-table-column label="排序" width="60" align="center">
                      <template #default>
                        <el-icon class="drag-handle" style="cursor: move; color: #909399;">
                          <Rank />
                        </el-icon>
                      </template>
                    </el-table-column>
                    <el-table-column type="index" label="序号" width="60" align="center" :index="(index: number) => index + 1" />
                    <el-table-column label="字段Key" width="160">
                      <template #default="{ row }">
                        <span>{{ row.fieldKey || '-' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="显示名称" width="160">
                      <template #default="{ row }">
                        <el-input
                          v-model="row.fieldName"
                          placeholder="如 品牌"
                          @change="handleCategoryFieldNameChange(row)"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="编码长度" width="120" align="center">
                      <template #default="{ row }">
                        <el-input-number
                          v-model="row.codeLength"
                          :min="1"
                          :max="10"
                          :precision="0"
                          :controls="false"
                          style="width: 100%"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="必填" width="80" align="center">
                      <template #default="{ row }">
                        <el-checkbox v-model="row.required" />
                      </template>
                    </el-table-column>
                    <el-table-column label="级联" width="80" align="center">
                      <template #default="{ row }">
                        <el-checkbox v-model="row.isCascade" />
                      </template>
                    </el-table-column>
                    <el-table-column label="参与编码" width="100" align="center">
                      <template #default="{ row }">
                        <el-checkbox v-model="row.participateInCode" />
                      </template>
                    </el-table-column>
                    <el-table-column label="上级字段" width="160">
                      <template #default="{ row, $index }">
                        <el-select
                          v-model="row.parentFieldKey"
                          placeholder="选择上级字段"
                          clearable
                          filterable
                          style="width: 100%"
                        >
                          <el-option
                            v-for="(field, index) in productConfigForm.categoryFields"
                            :key="field.fieldKey"
                            :label="field.fieldName"
                            :value="field.fieldKey"
                            :disabled="index >= $index"
                          />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column label="关联字典" width="200">
                      <template #default="{ row }">
                        <el-select
                          v-model="row.dictTypeCode"
                          placeholder="选择字典类型"
                          clearable
                          filterable
                          style="width: 100%"
                        >
                          <el-option
                            v-for="dictType in availableDictTypes"
                            :key="dictType.code"
                            :label="`${dictType.name}（${dictType.code}）`"
                            :value="dictType.code"
                          />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ $index }">
                        <el-button
                          type="danger"
                          size="small"
                          :icon="Delete"
                          @click="removeCategoryField($index)"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
            </div>

            <!-- 编码规则 -->
            <div>
              <!-- 工具栏 -->
              <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 500;">产品编码规则</span>
                <el-button type="primary" size="small" :icon="Plus" @click="addCodeRuleSegment">
                  添加片段
                </el-button>
              </div>
                  <el-table
                    :data="productConfigForm.codeRule?.segments || []"
                    border
                    style="width: 100%"
                    row-key="id"
                    ref="codeRuleTableRef"
                  >
                    <el-table-column label="排序" width="60" align="center">
                      <template #default>
                        <el-icon class="code-rule-drag-handle" style="cursor: move; color: #909399;">
                          <Rank />
                        </el-icon>
                      </template>
                    </el-table-column>
                    <el-table-column label="顺序" width="80" align="center">
                      <template #default="{ row, $index }">
                        {{ $index + 1 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="类型" width="140">
                      <template #default="{ row }">
                        <el-select v-model="row.segmentType" placeholder="选择类型" style="width: 120px">
                          <el-option label="常量" value="CONST" />
                          <el-option label="字段" value="FIELD" />
                          <el-option label="日期" value="DATE" />
                          <el-option label="流水号" value="SEQ" />
                          <el-option label="分隔符" value="SEP" />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column label="值" min-width="200">
                      <template #default="{ row }">
                        <!-- 如果类型是字段，显示下拉选择 -->
                        <el-select
                          v-if="row.segmentType === 'FIELD'"
                          v-model="row.segmentValue"
                          placeholder="选择分类字段"
                          style="width: 100%"
                          filterable
                        >
                          <el-option
                            v-for="field in productConfigForm.categoryFields"
                            :key="field.fieldKey"
                            :label="`${field.fieldName}（${field.fieldKey}）`"
                            :value="field.fieldKey"
                          />
                        </el-select>
                        <!-- 其他类型显示输入框 -->
                        <el-input
                          v-else
                          v-model="row.segmentValue"
                          :placeholder="row.segmentType === 'CONST'
                            ? '输入常量内容，如 PRD'
                            : row.segmentType === 'DATE'
                              ? '日期格式，如 YYYYMMDD'
                              : row.segmentType === 'SEQ'
                                ? '流水号Key（预留）'
                                : '分隔符，如 -'"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="长度" width="100" align="center">
                      <template #default="{ row }">
                        <el-input-number v-model="row.length" :min="1" :max="20" :precision="0" />
                      </template>
                    </el-table-column>
                    <el-table-column label="补齐字符" width="120" align="center">
                      <template #default="{ row }">
                        <el-input v-model="row.padChar" maxlength="1" placeholder="默认0" />
                      </template>
                    </el-table-column>
                    <el-table-column label="方向" width="120" align="center">
                      <template #default="{ row }">
                        <el-select v-model="row.padDirection" placeholder="方向" style="width: 100px">
                          <el-option label="左补齐" value="LEFT" />
                          <el-option label="右补齐" value="RIGHT" />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="80" align="center">
                      <template #default="{ $index }">
                        <el-button
                          type="danger"
                          size="small"
                          :icon="Delete"
                          @click="removeCodeRuleSegment($index)"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
              <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div class="form-tip">
                    编码预览示例会根据当前规则和示例分类字段生成，实际生产编码将在创建产品时由后端生成。
                  </div>
                </div>
                <div>
                  <el-button @click="previewProductCode" :loading="productPreviewLoading">
                    预览编码
                  </el-button>
                </div>
              </div>
              <div v-if="productCodePreview" style="margin-top: 12px;">
                <el-alert type="success" :closable="false">
                  <template #title>
                    编码预览：{{ productCodePreview }}
                  </template>
                </el-alert>
              </div>
            </div>

            <!-- 产品名称规则 -->
            <div style="margin-top: 32px;">
              <!-- 工具栏 -->
              <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 500;">产品名称规则</span>
                <el-button type="primary" size="small" :icon="Plus" @click="addNameRuleSegment">
                  添加片段
                </el-button>
              </div>
              <el-table
                :data="(productConfigForm.nameRule && productConfigForm.nameRule.segments) ? productConfigForm.nameRule.segments : []"
                border
                style="width: 100%"
                row-key="id"
                ref="nameRuleTableRef"
              >
                <el-table-column label="排序" width="60" align="center">
                  <template #default>
                    <el-icon class="name-rule-drag-handle" style="cursor: move; color: #909399;">
                      <Rank />
                    </el-icon>
                  </template>
                </el-table-column>
                <el-table-column label="顺序" width="80" align="center">
                  <template #default="{ row, $index }">
                    {{ $index + 1 }}
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="140">
                  <template #default="{ row }">
                    <el-select v-model="row.segmentType" placeholder="选择类型" style="width: 120px">
                      <el-option label="常量" value="CONST" />
                      <el-option label="字段" value="FIELD" />
                      <el-option label="分隔符" value="SEP" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="值" min-width="200">
                  <template #default="{ row }">
                    <!-- 如果类型是字段，显示下拉选择 -->
                    <el-select
                      v-if="row.segmentType === 'FIELD'"
                      v-model="row.segmentValue"
                      placeholder="选择分类字段"
                      style="width: 100%"
                      filterable
                    >
                      <el-option
                        v-for="field in productConfigForm.categoryFields"
                        :key="field.fieldKey"
                        :label="`${field.fieldName}（${field.fieldKey}）`"
                        :value="field.fieldKey"
                      />
                    </el-select>
                    <!-- 其他类型显示输入框 -->
                    <el-input
                      v-else
                      v-model="row.segmentValue"
                      :placeholder="row.segmentType === 'CONST'
                        ? '输入常量内容'
                        : '分隔符，如 -'"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ $index }">
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      @click="removeNameRuleSegment($index)"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 保存按钮 -->
            <div style="margin-top: 24px; text-align: right;">
              <el-button type="primary" :loading="productConfigSaving" @click="saveProductConfig">
                保存配置
              </el-button>
            </div>
          </div>

          <!-- 字典管理 -->
          <div v-if="activeTab === 'dictionary' && isTenantOwner" class="content-section">
            <h2 class="content-title">字典管理</h2>
            <!-- 左右分栏布局 -->
            <div class="dictionary-layout">
              <!-- 左侧：类型列表 -->
              <div class="dictionary-left">
                <!-- 工具栏 -->
                <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 500;">字典类型</span>
                  <div style="display: flex; gap: 8px;">
                    <el-input
                      v-model="dictTypeSearch"
                      placeholder="搜索类型"
                      clearable
                      size="small"
                      style="width: 200px"
                      @keyup.enter="handleDictTypeSearch"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                    <el-button size="small" @click="handleDictTypeSearch">搜索</el-button>
                    <el-button type="primary" size="small" :icon="Plus" @click="handleCreateDictType">
                      新建
                    </el-button>
                  </div>
                </div>
                <!-- 类型列表 -->
                <el-table
                    :data="dictTypes"
                    v-loading="dictTypeLoading"
                    highlight-current-row
                    :current-row-key="selectedDictTypeId"
                    @current-change="handleDictTypeRowClick"
                    border
                    style="width: 100%"
                    height="calc(100vh - 380px)"
                  >
                    <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="code" label="编码" width="140" show-overflow-tooltip />
                    <el-table-column label="范围" width="80">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.tenantId ? 'success' : 'info'">
                          {{ row.tenantId ? '租户' : '系统' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="70">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
                          {{ row.status === 'active' ? '启用' : '停用' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120" fixed="right">
                      <template #default="{ row }">
                        <el-button
                          type="primary"
                          link
                          size="small"
                          @click.stop="handleEditDictType(row)"
                        >
                          编辑
                        </el-button>
                        <el-button
                          type="danger"
                          link
                          size="small"
                          @click.stop="handleDeleteDictType(row)"
                          :disabled="!row.tenantId"
                        >
                          删除
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="pagination-section">
                    <el-pagination
                      v-model:current-page="dictTypePagination.page"
                      v-model:page-size="dictTypePagination.limit"
                      :total="dictTypePagination.total"
                      :page-sizes="[10, 20, 50, 100]"
                      layout="total, sizes, prev, pager, next"
                      small
                      @current-change="handleDictTypePageChange"
                      @size-change="handleDictTypeSizeChange"
                    />
                  </div>
              </div>

              <!-- 右侧：字典项树表 -->
              <div class="dictionary-right">
                <!-- 工具栏 -->
                <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 500;">字典项</span>
                  <el-button
                    type="primary"
                    size="small"
                    :icon="Plus"
                    @click="handleCreateDictItemRoot"
                    :disabled="!selectedDictTypeCode"
                  >
                    新增顶级选项
                  </el-button>
                </div>
                <div v-if="!selectedDictTypeCode" class="empty-tip">
                    <el-empty description="请从左侧选择一个字典类型" />
                  </div>
                  <template v-else>
                    <el-empty
                      v-if="!dictItemsLoading && dictItemsTree.length === 0"
                      description="暂无选项，请点击右上角「新增顶级选项」开始配置"
                    />
                    <el-tree
                      v-else
                      :data="dictItemsTree"
                      node-key="id"
                      default-expand-all
                      highlight-current
                      :loading="dictItemsLoading"
                      style="margin-top: 4px;"
                    >
                      <template #default="{ data }">
                        <span class="tree-node-label">
                          <span class="tree-node-text">
                            {{ data.label }}
                            <span v-if="data.value" class="tree-node-code">
                              （{{ data.value }}）
                            </span>
                          </span>
                          <span class="tree-node-actions">
                            <el-button
                              text
                              size="small"
                              @click.stop="handleCreateDictItemChild(data)"
                            >
                              新增子级
                            </el-button>
                            <el-button
                              text
                              size="small"
                              @click.stop="handleEditDictItem(data)"
                            >
                              编辑
                            </el-button>
                            <el-button
                              text
                              type="danger"
                              size="small"
                              @click.stop="handleDeleteDictItem(data)"
                            >
                              删除
                            </el-button>
                          </span>
                        </span>
                      </template>
                    </el-tree>
                  </template>
              </div>
            </div>

            <!-- 字典类型对话框 -->
            <el-dialog
              v-model="dictTypeDialogVisible"
              :title="dictTypeDialogTitle"
              width="520px"
            >
              <el-form :model="dictTypeForm" label-width="100px">
                <el-form-item label="编码" required>
                  <el-input
                    v-model="dictTypeForm.code"
                    :disabled="!!dictTypeForm.id"
                    placeholder="如 product_brand"
                  />
                </el-form-item>
                <el-form-item label="名称" required>
                  <el-input
                    v-model="dictTypeForm.name"
                    placeholder="如 产品品牌"
                  />
                </el-form-item>
                <el-form-item label="描述">
                  <el-input
                    v-model="dictTypeForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="用于说明该字典的用途"
                  />
                </el-form-item>
                <el-form-item label="状态">
                  <el-radio-group v-model="dictTypeForm.status">
                    <el-radio value="active">启用</el-radio>
                    <el-radio value="inactive">停用</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
              <template #footer>
                <el-button @click="dictTypeDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="dictTypeSubmitting" @click="handleSaveDictType">
                  确定
                </el-button>
              </template>
            </el-dialog>

            <!-- 字典项对话框 -->
            <el-dialog
              v-model="dictItemDialogVisible"
              :title="dictItemDialogTitle"
              width="520px"
            >
              <el-form :model="dictItemForm" label-width="100px">
                <el-form-item label="所属类型">
                  <el-input :model-value="dictItemForm.typeCode" disabled />
                </el-form-item>
                <el-form-item label="上级选项" v-if="dictItemForm.parentId">
                  <el-input
                    :model-value="dictItemForm.parentLabel || '未知'"
                    disabled
                  />
                </el-form-item>
                <el-form-item label="编码" required>
                  <el-input
                    v-model="dictItemForm.value"
                    :disabled="!!dictItemForm.id"
                    placeholder="如 NK"
                  />
                </el-form-item>
                <el-form-item label="名称" required>
                  <el-input
                    v-model="dictItemForm.label"
                    placeholder="如 耐克"
                  />
                </el-form-item>
                <el-form-item label="排序">
                  <el-input-number
                    v-model="dictItemForm.sortOrder"
                        :min="0"
                        :precision="0"
                      />
                    </el-form-item>
                    <el-form-item label="状态">
                      <el-radio-group v-model="dictItemForm.status">
                        <el-radio value="active">启用</el-radio>
                        <el-radio value="inactive">停用</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-form>
                  <template #footer>
                    <el-button @click="dictItemDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="dictItemSubmitting" @click="handleSaveDictItem">
                      确定
                    </el-button>
                  </template>
            </el-dialog>
          </div>

          <!-- 审批流配置 -->
          <div v-if="activeTab === 'workflow' && isTenantOwner" class="content-section">
            <WorkflowTemplateList :embedded="true" />
          </div>

          <!-- 子租户管理 -->
          <div v-if="activeTab === 'subsidiaries' && isTenantOwner" class="content-section">
            <div class="section-header">
              <h2 class="content-title">子租户管理</h2>
              <el-button type="primary" size="small" @click="handleCreateSubsidiary">
                <el-icon><Plus /></el-icon>
                创建子租户
              </el-button>
            </div>
            <el-table :data="subsidiaries" v-loading="subsidiariesLoading" style="width: 100%">
              <el-table-column prop="name" label="租户名称" min-width="150" />
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'active' ? '活跃' : row.status === 'inactive' ? '非活跃' : '暂停' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="level" label="层级" width="80" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleEditSubsidiary(row)">
                    编辑
                  </el-button>
                  <el-button type="danger" link size="small" @click="handleDeleteSubsidiary(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 创建/编辑子租户对话框 -->
    <el-dialog
      v-model="subsidiaryDialogVisible"
      :title="subsidiaryForm.id ? '编辑子租户' : '创建子租户'"
      width="600px"
    >
      <el-form
        ref="subsidiaryFormRef"
        :model="subsidiaryForm"
        :rules="subsidiaryRules"
        label-width="100px"
      >
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="subsidiaryForm.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="租户描述">
          <el-input
            v-model="subsidiaryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入租户描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="subsidiaryForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="暂停" value="suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subsidiaryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSubsidiary" :loading="subsidiaryLoading">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Picture, Plus, OfficeBuilding, Setting, Connection, Money, Delete, Goods, List, Rank, DocumentChecked } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { useAuthStore } from '@/stores/modules/auth'
import {
  tenantApi,
  type Tenant,
  type TenantPricingConfig,
  type PriceComponentConfig,
  type TenantProductConfig,
  type ProductCategoryFieldConfig,
  type ProductCodeRuleSegment,
  type ProductNameRuleSegment,
} from '@/api/tenant'
import dictionaryApi, {
  type DictType,
  type DictItemTreeNode,
  type CreateDictTypeDto,
  type UpdateDictTypeDto,
  type CreateDictItemDto,
  type UpdateDictItemDto,
} from '@/api/dictionary'
import { pinyin } from 'pinyin-pro'
import WorkflowTemplateList from '@/views/workflow/WorkflowTemplateList.vue'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 当前激活的标签
const activeTab = ref('basic')
// 产品配置内部 Tab

// 菜单项
const menuItems = computed(() => {
  const items = [
    { key: 'basic', label: '基本信息', icon: OfficeBuilding }
  ]

  if (isTenantOwner.value) {
    items.push(
      { key: 'config', label: '租户配置', icon: Setting },
      { key: 'pricing', label: '价格配置', icon: Money },
      { key: 'productConfig', label: '产品配置', icon: Goods },
      { key: 'dictionary', label: '字典管理', icon: List },
      { key: 'workflow', label: '审批流配置', icon: DocumentChecked },
      { key: 'subsidiaries', label: '子租户管理', icon: Connection }
    )
  }

  return items
})

// Logo上传
const logoInputRef = ref<HTMLInputElement>()

// 租户表单
const tenantFormRef = ref<FormInstance>()
const tenantForm = reactive({
  name: '',
  description: '',
  status: 'active' as 'active' | 'inactive' | 'suspended'
})
const tenantLoading = ref(false)

// 配置信息
const configJson = ref('')
const configLoading = ref(false)
const configFormRef = ref<FormInstance>()
const configForm = reactive({
  contractExpiryReminderDays: 7,
  opportunityCloseReminderDays: 7,
  customerPoolAutoReturnDays: 30,
  defaultTaxRate: 0,
})

// 配置表单验证规则
const configRules: FormRules = {
  contractExpiryReminderDays: [
    { required: true, message: '请输入合同到期提前提醒天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  opportunityCloseReminderDays: [
    { required: true, message: '请输入商机预计成交提前提醒天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  customerPoolAutoReturnDays: [
    { required: true, message: '请输入客户自动回到公海天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '天数必须在1-365之间', trigger: 'blur' }
  ],
  defaultTaxRate: [
    { required: true, message: '请输入默认税率', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '税率必须在0-100之间', trigger: 'blur' },
  ],
}

// 子公司管理
// 价格配置
const pricingFormRef = ref<FormInstance>()
const priceComponentsTableRef = ref()
const pricingForm = reactive<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})
const pricingLoading = ref(false)

// 价格配置表单验证规则
const pricingRules: FormRules = {
  pricingMode: [
    { required: true, message: '请选择价格计算模式', trigger: 'change' }
  ],
  priceComponents: [
    {
      validator: (rule: unknown, value: PriceComponentConfig[] | undefined, callback: (error?: Error) => void) => {
        if (pricingForm.pricingMode === 'complex') {
          if (!value || value.length === 0) {
            callback(new Error('复杂模式下至少需要配置一个价格组成项'))
            return
          }
          // 检查是否有重复的key
          const keys = value.map((item: PriceComponentConfig) => item.key).filter(Boolean)
          const uniqueKeys = new Set(keys)
          if (keys.length !== uniqueKeys.size) {
            callback(new Error('价格组成项的字段Key不能重复'))
            return
          }
          // 检查必填项
          const hasEmptyKey = value.some((item: PriceComponentConfig) => !item.key || !item.label)
          if (hasEmptyKey) {
            callback(new Error('请填写所有价格组成项的字段Key和显示名称'))
            return
          }
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

// 产品配置
const productConfigLoading = ref(false)
const productConfigSaving = ref(false)
const productPreviewLoading = ref(false)
const productConfigForm = reactive<TenantProductConfig>({
  categoryFields: [],
  categoryValues: [],
  codeRule: {
    segments: [],
  },
  nameRule: {
    segments: [],
  },
})

// 分类字段 / 编码规则 / 名称规则 表格引用（用于拖拽排序）
const categoryFieldsTableRef = ref()
const codeRuleTableRef = ref()
const nameRuleTableRef = ref()
let categoryFieldsSortable: Sortable | null = null
let codeRuleSortable: Sortable | null = null
let nameRuleSortable: Sortable | null = null
let priceComponentsSortable: Sortable | null = null
const productCodePreview = ref('')


// 字典管理状态
const dictTypes = ref<DictType[]>([])
const dictTypeLoading = ref(false)
// 用于产品配置中选择字典类型的列表（只加载一次）
const allDictTypes = ref<DictType[]>([])

// 计算属性：可用的字典类型（用于产品配置中的下拉选择）
const availableDictTypes = computed(() => {
  return allDictTypes.value.filter(type => type.status === 'active')
})
const dictTypePagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
})
const dictTypeSearch = ref('')
const dictTypeDialogVisible = ref(false)
const dictTypeDialogTitle = ref('')
const dictTypeForm = reactive<CreateDictTypeDto & { id?: number }>({
  code: '',
  name: '',
  description: '',
  status: 'active',
})
const dictTypeSubmitting = ref(false)

const selectedDictTypeCode = ref<string>('')
const selectedDictTypeId = ref<number | undefined>(undefined)
const dictItemsTree = ref<DictItemTreeNode[]>([])
const dictItemsLoading = ref(false)
const dictItemDialogVisible = ref(false)
const dictItemDialogTitle = ref('')
const dictItemForm = reactive<CreateDictItemDto & { id?: number; parentLabel?: string }>({
  typeCode: '',
  value: '',
  label: '',
  parentId: undefined,
  parentLabel: undefined,
  sortOrder: 0,
  status: 'active',
})
const dictItemSubmitting = ref(false)

// 加载字典类型列表（用于字典管理页面）
const loadDictTypes = async () => {
  try {
    dictTypeLoading.value = true
    const res = await dictionaryApi.getTypes({
      search: dictTypeSearch.value,
      page: dictTypePagination.page,
      limit: dictTypePagination.limit,
    })
    if (res.code === 200) {
      dictTypes.value = res.data.items || []
      dictTypePagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载字典类型失败:', error)
    ElMessage.error('加载字典类型失败')
  } finally {
    dictTypeLoading.value = false
  }
}

// 加载所有字典类型（用于产品配置中的下拉选择，不分页）
const loadAllDictTypes = async () => {
  try {
    const res = await dictionaryApi.getTypes({
      page: 1,
      limit: 1000, // 加载足够多的字典类型
    })
    if (res.code === 200) {
      allDictTypes.value = res.data.items || []
    }
  } catch (error) {
    console.error('加载字典类型列表失败:', error)
  }
}

const handleDictTypeSearch = () => {
  dictTypePagination.page = 1
  loadDictTypes()
}

const handleDictTypePageChange = (page: number) => {
  dictTypePagination.page = page
  loadDictTypes()
}

const handleDictTypeSizeChange = (size: number) => {
  dictTypePagination.limit = size
  dictTypePagination.page = 1
  loadDictTypes()
}

const handleCreateDictType = () => {
  dictTypeDialogTitle.value = '新建字典类型'
  Object.assign(dictTypeForm, {
    id: undefined,
    code: '',
    name: '',
    description: '',
    status: 'active' as const,
  })
  dictTypeDialogVisible.value = true
}

const handleEditDictType = (row: DictType) => {
  dictTypeDialogTitle.value = '编辑字典类型'
  Object.assign(dictTypeForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    status: row.status,
  })
  dictTypeDialogVisible.value = true
}

const handleSaveDictType = async () => {
  if (!dictTypeForm.code || !dictTypeForm.name) {
    ElMessage.warning('请填写编码和名称')
    return
  }
  try {
    dictTypeSubmitting.value = true
    if (dictTypeForm.id) {
      const payload: UpdateDictTypeDto = {
        name: dictTypeForm.name,
        description: dictTypeForm.description,
        status: dictTypeForm.status,
      }
      const res = await dictionaryApi.updateType(dictTypeForm.id, payload)
      if (res.code === 200) {
        ElMessage.success('更新字典类型成功')
      }
    } else {
      const payload: CreateDictTypeDto = {
        code: dictTypeForm.code,
        name: dictTypeForm.name,
        description: dictTypeForm.description,
        status: dictTypeForm.status,
      }
      const res = await dictionaryApi.createType(payload)
      if (res.code === 201) {
        ElMessage.success('创建字典类型成功')
      }
    }
    dictTypeDialogVisible.value = false
    await loadDictTypes()
    // 如果保存的是当前选中的类型，重新加载字典项
    if (dictTypeForm.id && selectedDictTypeId.value === dictTypeForm.id) {
      await loadDictItems()
    }
  } catch (error) {
    console.error('保存字典类型失败:', error)
    ElMessage.error('保存字典类型失败')
  } finally {
    dictTypeSubmitting.value = false
  }
}

const handleDeleteDictType = async (row: DictType) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除字典类型「${row.name}」吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )
    const res = await dictionaryApi.deleteType(row.id)
    if (res.code === 200) {
      ElMessage.success('删除字典类型成功')
      if (selectedDictTypeCode.value === row.code) {
        selectedDictTypeCode.value = ''
        selectedDictTypeId.value = undefined
        dictItemsTree.value = []
      }
      await loadDictTypes()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除字典类型失败:', error)
      ElMessage.error('删除字典类型失败')
    }
  }
}

// 加载字典项树
const loadDictItems = async () => {
  if (!selectedDictTypeCode.value) {
    dictItemsTree.value = []
    return
  }
  try {
    dictItemsLoading.value = true
    const res = await dictionaryApi.getItemsTree(selectedDictTypeCode.value)
    if (res.code === 200) {
      dictItemsTree.value = res.data || []
    }
  } catch (error) {
    console.error('加载字典项失败:', error)
    ElMessage.error('加载字典项失败')
  } finally {
    dictItemsLoading.value = false
  }
}

const handleDictTypeRowClick = (row: DictType | null) => {
  if (row) {
    selectedDictTypeCode.value = row.code
    selectedDictTypeId.value = row.id
    loadDictItems()
  } else {
    selectedDictTypeCode.value = ''
    selectedDictTypeId.value = undefined
    dictItemsTree.value = []
  }
}


const handleCreateDictItemRoot = () => {
  if (!selectedDictTypeCode.value) {
    ElMessage.warning('请先选择一个字典类型')
    return
  }
  dictItemDialogTitle.value = '新增字典项'
  Object.assign(dictItemForm, {
    id: undefined,
    typeCode: selectedDictTypeCode.value,
    value: '',
    label: '',
    parentId: undefined,
    parentLabel: undefined,
    sortOrder: 0,
    status: 'active' as const,
  })
  dictItemDialogVisible.value = true
}

const handleCreateDictItemChild = (node: DictItemTreeNode) => {
  if (!selectedDictTypeCode.value) return
  dictItemDialogTitle.value = '新增子级字典项'
  Object.assign(dictItemForm, {
    id: undefined,
    typeCode: selectedDictTypeCode.value,
    value: '',
    label: '',
    parentId: node.id,
    parentLabel: node.value ? `${node.label}（${node.value}）` : node.label,
    sortOrder: 0,
    status: 'active' as const,
  })
  dictItemDialogVisible.value = true
}

const handleEditDictItem = (node: DictItemTreeNode) => {
  dictItemDialogTitle.value = '编辑字典项'
  // 查找父级节点的标签
  let parentLabel: string | undefined = undefined
  if (node.parentId) {
    const findParent = (items: DictItemTreeNode[]): DictItemTreeNode | null => {
      for (const item of items) {
        if (item.id === node.parentId) {
          return item
        }
        if (item.children && item.children.length > 0) {
          const found = findParent(item.children)
          if (found) return found
        }
      }
      return null
    }
    const parent = findParent(dictItemsTree.value)
    if (parent) {
      parentLabel = parent.value ? `${parent.label}（${parent.value}）` : parent.label
    }
  }

  Object.assign(dictItemForm, {
    id: node.id,
    typeCode: node.typeCode,
    value: node.value,
    label: node.label,
    parentId: node.parentId ?? undefined,
    parentLabel,
    sortOrder: node.sortOrder,
    status: (node.status as 'active' | 'inactive') || 'active',
  })
  dictItemDialogVisible.value = true
}

const handleSaveDictItem = async () => {
  if (!dictItemForm.typeCode || !dictItemForm.value || !dictItemForm.label) {
    ElMessage.warning('请填写编码和值名称')
    return
  }
  try {
    dictItemSubmitting.value = true
    if (dictItemForm.id) {
      const payload: UpdateDictItemDto = {
        label: dictItemForm.label,
        sortOrder: dictItemForm.sortOrder,
        status: dictItemForm.status,
        parentId: dictItemForm.parentId,
      }
      const res = await dictionaryApi.updateItem(dictItemForm.id, payload)
      if (res.code === 200) {
        ElMessage.success('更新字典项成功')
      }
    } else {
      // 确保 parentId 是数字类型
      let parentId: number | undefined = undefined
      if (dictItemForm.parentId !== undefined && dictItemForm.parentId !== null) {
        parentId = typeof dictItemForm.parentId === 'string'
          ? parseInt(dictItemForm.parentId, 10)
          : Number(dictItemForm.parentId)
        // 如果转换后是 NaN，则设为 undefined
        if (isNaN(parentId)) {
          parentId = undefined
        }
      }

      const payload: CreateDictItemDto = {
        typeCode: dictItemForm.typeCode,
        value: dictItemForm.value,
        label: dictItemForm.label,
        parentId: parentId,
        sortOrder: dictItemForm.sortOrder,
        status: dictItemForm.status,
      }
      const res = await dictionaryApi.createItem(payload)
      if (res.code === 201) {
        ElMessage.success('创建字典项成功')
      }
    }
    dictItemDialogVisible.value = false
    await loadDictItems()
  } catch (error) {
    console.error('保存字典项失败:', error)
    ElMessage.error('保存字典项失败')
  } finally {
    dictItemSubmitting.value = false
  }
}

const handleDeleteDictItem = async (node: DictItemTreeNode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除字典项「${node.label}」吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )
    const res = await dictionaryApi.deleteItem(node.id)
    if (res.code === 200) {
      ElMessage.success('删除字典项成功')
      await loadDictItems()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除字典项失败:', error)
      ElMessage.error('删除字典项失败')
    }
  }
}

// 产品分类字段：新增一行
const addCategoryField = () => {
  const newLevel = productConfigForm.categoryFields.length + 1
  const fieldName = `分类${newLevel}`
  const autoKey = generateKeyFromLabel(fieldName)
  const newField: ProductCategoryFieldConfig = {
    fieldKey: autoKey ? autoKey.replace(/_/g, '') : `field${newLevel}`,
    fieldName: fieldName,
    level: newLevel,
    required: true,
    isCascade: true,
    participateInCode: true,
    codeLength: 2,
  }
  productConfigForm.categoryFields.push(newField)
  // 重新初始化拖拽排序
  initCategoryFieldsSortable()
}

// 删除分类字段
const removeCategoryField = (index: number) => {
  productConfigForm.categoryFields.splice(index, 1)
  // 更新层级（根据顺序自动计算）
  productConfigForm.categoryFields.forEach((field, idx) => {
    field.level = idx + 1
  })
  // 重新初始化拖拽排序
  initCategoryFieldsSortable()
}

// 产品编码规则：新增片段
const addCodeRuleSegment = () => {
  if (!productConfigForm.codeRule) {
    productConfigForm.codeRule = { segments: [] }
  }
  const segments = productConfigForm.codeRule.segments
  const maxOrder = segments.length ? Math.max(...segments.map(s => s.orderNo || 0)) : 0
  const seg: ProductCodeRuleSegment = {
    id: `seg_${Date.now()}_${maxOrder + 1}`,
    orderNo: maxOrder + 1,
    segmentType: 'CONST',
    segmentValue: '',
  }
  segments.push(seg)

  // 新增后重新初始化拖拽
  initCodeRuleSortable()
}

// 删除编码规则片段
const removeCodeRuleSegment = (index: number) => {
  if (!productConfigForm.codeRule) return
  productConfigForm.codeRule.segments.splice(index, 1)

  // 删除后重新初始化拖拽
  initCodeRuleSortable()
}

// 产品名称规则：新增片段
const addNameRuleSegment = () => {
  if (!productConfigForm.nameRule) {
    productConfigForm.nameRule = { segments: [] }
  }
  const segments = productConfigForm.nameRule.segments
  const maxOrder = segments.length ? Math.max(...segments.map(s => s.orderNo || 0)) : 0
  const seg: ProductNameRuleSegment = {
    id: `name_${Date.now()}_${maxOrder + 1}`,
    orderNo: maxOrder + 1,
    segmentType: 'SEP',
    segmentValue: '-',
  }
  segments.push(seg)

  // 新增后重新初始化拖拽
  initNameRuleSortable()
}

// 删除名称规则片段
const removeNameRuleSegment = (index: number) => {
  if (!productConfigForm.nameRule) return
  productConfigForm.nameRule.segments.splice(index, 1)

  // 删除后重新初始化拖拽
  initNameRuleSortable()
}

// 初始化分类字段表格拖拽排序
const initCategoryFieldsSortable = () => {
  if (categoryFieldsSortable) {
    categoryFieldsSortable.destroy()
    categoryFieldsSortable = null
  }

  nextTick(() => {
    const tableEl = categoryFieldsTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    categoryFieldsSortable = Sortable.create(tbody, {
      handle: '.drag-handle', // 拖拽手柄
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return

        // 移动数组元素
        const movedItem = productConfigForm.categoryFields.splice(oldIndex, 1)[0]
        productConfigForm.categoryFields.splice(newIndex, 0, movedItem)

        // 更新层级（level = index + 1）
        productConfigForm.categoryFields.forEach((field, index) => {
          field.level = index + 1
        })
      },
    })
  })
}

// 初始化编码规则表格拖拽排序
const initCodeRuleSortable = () => {
  if (codeRuleSortable) {
    codeRuleSortable.destroy()
    codeRuleSortable = null
  }

  nextTick(() => {
    const tableEl = codeRuleTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    codeRuleSortable = Sortable.create(tbody, {
      handle: '.code-rule-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !productConfigForm.codeRule
        )
          return

        const segments = productConfigForm.codeRule.segments
        const moved = segments.splice(oldIndex, 1)[0]
        segments.splice(newIndex, 0, moved)

        // 重新计算 orderNo
        segments.forEach((seg, idx) => {
          seg.orderNo = idx + 1
        })
      },
    })
  })
}

// 初始化名称规则表格拖拽排序
const initNameRuleSortable = () => {
  if (nameRuleSortable) {
    nameRuleSortable.destroy()
    nameRuleSortable = null
  }

  nextTick(() => {
    const tableEl = nameRuleTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    nameRuleSortable = Sortable.create(tbody, {
      handle: '.name-rule-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !productConfigForm.nameRule
        )
          return

        const segments = productConfigForm.nameRule.segments
        const moved = segments.splice(oldIndex, 1)[0]
        segments.splice(newIndex, 0, moved)

        // 重新计算 orderNo
        segments.forEach((seg, idx) => {
          seg.orderNo = idx + 1
        })
      },
    })
  })
}

// 加载产品配置
const loadProductConfig = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) return
  try {
    productConfigLoading.value = true
    const response = await tenantApi.getProductConfig(tenantInfo.value.id)
    if (response.code === 200 && response.data) {
      const data = response.data
      productConfigForm.categoryFields = data.categoryFields || []
      productConfigForm.categoryValues = data.categoryValues || []
      productConfigForm.codeRule = data.codeRule || { segments: [] }
      // 确保 nameRule 被正确赋值
      if (data.nameRule && data.nameRule.segments && Array.isArray(data.nameRule.segments)) {
        productConfigForm.nameRule = { segments: [...data.nameRule.segments] }
      } else {
        productConfigForm.nameRule = { segments: [] }
      }

      console.log('加载产品配置，原始数据 data:', data)
      console.log('加载产品配置，data.nameRule:', data.nameRule)
      console.log('加载产品配置，productConfigForm.nameRule:', productConfigForm.nameRule)
      console.log('加载产品配置，productConfigForm.nameRule.segments:', productConfigForm.nameRule?.segments)

      // 确保层级字段正确（按数组索引 + 1）
      productConfigForm.categoryFields.forEach((field, index) => {
        field.level = index + 1
      })

      // 初始化拖拽排序
      initCategoryFieldsSortable()
      initCodeRuleSortable()
      initNameRuleSortable()
    }
  } catch (error) {
    console.error('加载产品配置失败:', error)
    ElMessage.error('加载产品配置失败')
  } finally {
    productConfigLoading.value = false
  }
}

// 保存产品配置
const saveProductConfig = async () => {
  if (!tenantInfo.value?.id) return
  try {
    productConfigSaving.value = true

    // 确保 nameRule 存在
    if (!productConfigForm.nameRule) {
      productConfigForm.nameRule = { segments: [] }
    }

    const payload: TenantProductConfig = {
      categoryFields: productConfigForm.categoryFields || [],
      categoryValues: productConfigForm.categoryValues || [],
      codeRule: productConfigForm.codeRule || { segments: [] },
      nameRule: productConfigForm.nameRule || { segments: [] },
    }

    console.log('保存产品配置，payload:', JSON.stringify(payload, null, 2))

    const response = await tenantApi.updateProductConfig(tenantInfo.value.id, payload)
    if (response.code === 200) {
      ElMessage.success('产品配置保存成功')
      await loadProductConfig()
    }
  } catch (error) {
    console.error('保存产品配置失败:', error)
    ElMessage.error('保存产品配置失败')
  } finally {
    productConfigSaving.value = false
  }
}

// 预览产品编码（简单示例：只基于字段的 fieldKey -> 示例 code）
const previewProductCode = async () => {
  if (!tenantInfo.value?.id) return
  if (!productConfigForm.codeRule || !productConfigForm.codeRule.segments.length) {
    ElMessage.warning('请先配置编码规则')
    return
  }
  try {
    productPreviewLoading.value = true
    const fieldCodes: Record<string, string> = {}
    productConfigForm.categoryFields.forEach((field, idx) => {
      // 用示例编码：如 F1、F2 等
      fieldCodes[field.fieldKey] = `F${idx + 1}`
    })
    const response = await tenantApi.previewProductCode(tenantInfo.value.id, {
      fieldCodes,
    })
    if (response.code === 200 && response.data) {
      productCodePreview.value = response.data.code
    }
  } catch (error) {
    console.error('预览产品编码失败:', error)
    ElMessage.error('预览产品编码失败')
  } finally {
    productPreviewLoading.value = false
  }
}


// 添加价格组成项
const addPriceComponent = () => {
  if (!pricingForm.priceComponents) {
    pricingForm.priceComponents = []
  }
  const maxOrder = pricingForm.priceComponents.length > 0
    ? Math.max(...pricingForm.priceComponents.map(item => item.order || 0))
    : 0
  pricingForm.priceComponents.push({
    key: '',
    label: '',
    required: false,
    defaultValue: 0,
    order: maxOrder + 1,
  })

  initPriceComponentsSortable()
}

// 将名称转换为拼音风格的 key：全中文用拼音，中英文混合则中文转拼音、字母数字保留
const generateKeyFromLabel = (label: string): string => {
  if (!label) return ''
  // 使用 pinyin-pro 将中文转为无声调全拼，其它字符原样保留
  const full = pinyin(label, {
    toneType: 'none',
    type: 'array',
    nonZh: 'spaced',
  }) as string[]

  const joined = full
    .join(' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()

  if (!joined) return ''

  return joined
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .join('_')
}

// 当价格组成项的显示名称变化时，如果 key 为空，则自动根据名称生成 key
const handlePriceComponentLabelChange = (row: PriceComponentConfig) => {
  if (!row) return
  // 仅在 key 为空或全是空白时自动生成，避免覆盖用户手工修改过的 key
  if (!row.key || !row.key.trim()) {
    const autoKey = generateKeyFromLabel(row.label || '')
    if (autoKey) {
      // key 中不使用下划线，统一使用连续拼音
      row.key = autoKey.replace(/_/g, '')
    }
  }
}

// 当分类字段的显示名称变化时，自动根据名称生成 fieldKey
const handleCategoryFieldNameChange = (row: ProductCategoryFieldConfig) => {
  if (!row) return
  // 自动生成 fieldKey（不使用下划线，统一使用连续拼音）
  const autoKey = generateKeyFromLabel(row.fieldName || '')
  if (autoKey) {
    row.fieldKey = autoKey.replace(/_/g, '')
  }
}

// 初始化价格组成项拖拽排序
const initPriceComponentsSortable = () => {
  if (priceComponentsSortable) {
    priceComponentsSortable.destroy()
    priceComponentsSortable = null
  }

  nextTick(() => {
    const tableEl = priceComponentsTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    priceComponentsSortable = Sortable.create(tbody, {
      handle: '.price-component-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !pricingForm.priceComponents
        ) {
          return
        }

        const moved = pricingForm.priceComponents.splice(oldIndex, 1)[0]
        pricingForm.priceComponents.splice(newIndex, 0, moved)

        // 重新计算 order（从 1 开始）
        pricingForm.priceComponents.forEach((item, idx) => {
          item.order = idx + 1
        })
      },
    })
  })
}

// 移除价格组成项
const removePriceComponent = (index: number) => {
  if (pricingForm.priceComponents) {
    pricingForm.priceComponents.splice(index, 1)
    // 删除后重排 order
    pricingForm.priceComponents.forEach((item, idx) => {
      item.order = idx + 1
    })
    // 重新初始化拖拽
    initPriceComponentsSortable()
  }
}

// 加载价格配置
const loadPricingConfig = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) {
    return
  }
  try {
    const response = await tenantApi.getPricingConfig(tenantInfo.value.id)
    if (response.code === 200) {
      Object.assign(pricingForm, {
        pricingMode: response.data.pricingMode || 'simple',
        priceComponents: response.data.priceComponents || [],
      })
      initPriceComponentsSortable()
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
    // 如果配置不存在，使用默认值
    Object.assign(pricingForm, {
      pricingMode: 'simple',
      priceComponents: [],
    })
    initPriceComponentsSortable()
  }
}

// 更新价格配置
const updatePricingConfig = async () => {
  if (!pricingFormRef.value || !tenantInfo.value?.id) {
    return
  }
  try {
    await pricingFormRef.value.validate()
    pricingLoading.value = true

    const config: TenantPricingConfig = {
      pricingMode: pricingForm.pricingMode,
      priceComponents: pricingForm.pricingMode === 'complex' ? pricingForm.priceComponents : [],
    }

    const response = await tenantApi.updatePricingConfig(tenantInfo.value.id, config)
    if (response.code === 200) {
      ElMessage.success('价格配置保存成功')
      await loadPricingConfig()
    }
  } catch (error: unknown) {
    if (error !== false) {
      console.error('保存价格配置失败:', error)
      const message = error instanceof Error ? error.message : '保存价格配置失败'
      ElMessage.error(message)
    }
  } finally {
    pricingLoading.value = false
  }
}

// 重置价格配置表单
const resetPricingForm = () => {
  loadPricingConfig()
}

const subsidiaries = ref<Tenant[]>([])
const subsidiariesLoading = ref(false)
const subsidiaryDialogVisible = ref(false)
const subsidiaryFormRef = ref<FormInstance>()
const subsidiaryForm = reactive({
  id: '',
  name: '',
  description: '',
  status: 'active' as 'active' | 'inactive' | 'suspended'
})
const subsidiaryLoading = ref(false)

// 子租户表单验证规则
const subsidiaryRules: FormRules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '租户名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 表单验证规则
const tenantRules: FormRules = {
  name: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 50, message: '企业名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (tenantInfo.value) {
    Object.assign(tenantForm, {
      name: tenantInfo.value.name || '',
      description: tenantInfo.value.description || '',
      status: tenantInfo.value.status || 'active'
    })

    // 初始化配置信息（兼容老的 config JSON 和新字段）
    if (tenantInfo.value.config) {
      try {
        const config = tenantInfo.value.config as Record<string, unknown>
        // 初始化配置表单
        configForm.contractExpiryReminderDays = typeof config.contractExpiryReminderDays === 'number' ? config.contractExpiryReminderDays : 7
        configForm.opportunityCloseReminderDays = typeof config.opportunityCloseReminderDays === 'number' ? config.opportunityCloseReminderDays : 7
        configForm.customerPoolAutoReturnDays = typeof config.customerPoolAutoReturnDays === 'number' ? config.customerPoolAutoReturnDays : 30
        // 保留 JSON 格式用于显示（如果需要）
        configJson.value = JSON.stringify(tenantInfo.value.config, null, 2)
      } catch {
        configJson.value = ''
      }
    } else {
      // 如果没有配置，使用默认值
      configForm.contractExpiryReminderDays = 7
      configForm.opportunityCloseReminderDays = 7
      configForm.customerPoolAutoReturnDays = 30
    }
    
    // 税率优先从 defaultTaxRate 字段读取（新字段），如果没有则从 config.defaultTaxRate 读取（兼容旧数据）
    // 处理可能的类型转换（decimal 可能返回字符串）
    const taxRateValue = (tenantInfo.value as any).defaultTaxRate
    if (taxRateValue !== undefined && taxRateValue !== null) {
      const numValue = typeof taxRateValue === 'string' ? parseFloat(taxRateValue) : taxRateValue
      if (!isNaN(numValue)) {
        configForm.defaultTaxRate = numValue
      } else {
        configForm.defaultTaxRate = 0
      }
    } else if (tenantInfo.value.config && typeof (tenantInfo.value.config as any).defaultTaxRate !== 'undefined') {
      const configTaxRate = (tenantInfo.value.config as any).defaultTaxRate
      const numValue = typeof configTaxRate === 'string' ? parseFloat(configTaxRate) : configTaxRate
      if (!isNaN(numValue)) {
        configForm.defaultTaxRate = numValue
      } else {
        configForm.defaultTaxRate = 0
      }
    } else {
      configForm.defaultTaxRate = 0
    }
  }
}

// 处理Logo更换
const handleLogoChange = () => {
  if (!isTenantOwner.value) {
    ElMessage.warning('只有租户管理员可以修改企业Logo')
    return
  }
  logoInputRef.value?.click()
}

// 处理Logo上传
const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式的图片')
    target.value = ''
    return
  }

  // 验证文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    target.value = ''
    return
  }

  try {
    // 上传Logo文件
    const uploadResponse = await tenantApi.uploadLogo(file)
    const logoUrl = uploadResponse.data.url

    // 更新租户Logo
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, { logo: logoUrl })
      ElMessage.success('Logo上传成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error: unknown) {
    let errorMessage = 'Logo上传失败'

    if (error && typeof error === 'object') {
      const err = error as {
        response?: {
          data?: {
            message?: string
            error?: string
          }
        }
        message?: string
      }

      errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || errorMessage
    }

    ElMessage.error(errorMessage)
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

// 更新租户信息
const updateTenantInfo = async () => {
  if (!tenantFormRef.value || !isTenantOwner.value) return

  try {
    const valid = await tenantFormRef.value.validate()
    if (!valid) return

    tenantLoading.value = true

    // 调用更新API
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, {
        name: tenantForm.name,
        description: tenantForm.description,
        status: tenantForm.status
      })
      ElMessage.success('企业信息更新成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(message)
  } finally {
    tenantLoading.value = false
  }
}

// 更新租户配置
const updateTenantConfig = async () => {
  if (!isTenantOwner.value) {
    ElMessage.warning('只有租户管理员可以修改配置')
    return
  }

  if (!configFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }

  try {
    await configFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单输入')
    return
  }

  if (!tenantInfo.value) {
    ElMessage.warning('租户信息不存在')
    return
  }

  try {
    // 将表单数据转换为配置对象（税率单独保存到 defaultTaxRate 字段，不放在 config 中）
    const config: Record<string, unknown> = {
      contractExpiryReminderDays: configForm.contractExpiryReminderDays,
      opportunityCloseReminderDays: configForm.opportunityCloseReminderDays,
      customerPoolAutoReturnDays: configForm.customerPoolAutoReturnDays,
    }

    // 如果原有配置中有其他字段，保留它们
    if (tenantInfo.value.config) {
      Object.keys(tenantInfo.value.config).forEach(key => {
        if (!['contractExpiryReminderDays', 'opportunityCloseReminderDays', 'customerPoolAutoReturnDays'].includes(key)) {
          config[key] = tenantInfo.value!.config![key]
        }
      })
    }

    configLoading.value = true

    // 调用更新配置API，税率单独作为 defaultTaxRate 字段传递
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, {
        config: config,
        defaultTaxRate: configForm.defaultTaxRate,
      })
      ElMessage.success('配置信息更新成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
      // 重新初始化表单数据，确保税率等字段正确显示
      await nextTick()
      initFormData()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(message)
  } finally {
    configLoading.value = false
  }
}

// 重置配置表单
const resetConfigForm = () => {
  if (tenantInfo.value?.config) {
    const config = tenantInfo.value.config as Record<string, any>
    configForm.contractExpiryReminderDays = typeof config.contractExpiryReminderDays === 'number' ? config.contractExpiryReminderDays : 7
    configForm.opportunityCloseReminderDays = typeof config.opportunityCloseReminderDays === 'number' ? config.opportunityCloseReminderDays : 7
    configForm.customerPoolAutoReturnDays = typeof config.customerPoolAutoReturnDays === 'number' ? config.customerPoolAutoReturnDays : 30
  } else {
    configForm.contractExpiryReminderDays = 7
    configForm.opportunityCloseReminderDays = 7
    configForm.customerPoolAutoReturnDays = 30
  }
  configFormRef.value?.clearValidate()
}

// 加载子公司列表
const loadSubsidiaries = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) return

  try {
    subsidiariesLoading.value = true
    const response = await tenantApi.getChildren(tenantInfo.value.id)
    subsidiaries.value = response.data || []
  } catch (error) {
    console.error('加载子公司列表失败:', error)
  } finally {
    subsidiariesLoading.value = false
  }
}

// 创建子租户
const handleCreateSubsidiary = () => {
  Object.assign(subsidiaryForm, {
    id: '',
    name: '',
    description: '',
    status: 'active' as const
  })
  subsidiaryDialogVisible.value = true
}

// 编辑子租户
const handleEditSubsidiary = (row: Tenant) => {
  Object.assign(subsidiaryForm, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status
  })
  subsidiaryDialogVisible.value = true
}

// 保存子公司
const handleSaveSubsidiary = async () => {
  if (!subsidiaryFormRef.value) return

  try {
    const valid = await subsidiaryFormRef.value.validate()
    if (!valid) return

    subsidiaryLoading.value = true

    if (subsidiaryForm.id) {
      // 编辑
      await tenantApi.update(subsidiaryForm.id, {
        name: subsidiaryForm.name,
        description: subsidiaryForm.description,
        status: subsidiaryForm.status
      })
      ElMessage.success('子租户更新成功')
    } else {
      // 创建
      if (!tenantInfo.value?.id) return
      await tenantApi.create({
        name: subsidiaryForm.name,
        description: subsidiaryForm.description,
        parentId: tenantInfo.value.id,
        status: subsidiaryForm.status
      })
      ElMessage.success('子租户创建成功')
    }

    subsidiaryDialogVisible.value = false
    await loadSubsidiaries()
    await authStore.fetchCurrentUser()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    ElMessage.error(message)
  } finally {
    subsidiaryLoading.value = false
  }
}

// 删除子租户
const handleDeleteSubsidiary = async (row: Tenant) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除子租户"${row.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await tenantApi.delete(row.id)
    ElMessage.success('子租户删除成功')
    await loadSubsidiaries()
    await authStore.fetchCurrentUser()
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除失败'
      ElMessage.error(message)
    }
  }
}

// 监听标签切换，加载配置
watch(activeTab, (newTab) => {
  if (newTab === 'pricing' && isTenantOwner.value) {
    loadPricingConfig()
  }
  if (newTab === 'productConfig' && isTenantOwner.value) {
    loadProductConfig()
    loadAllDictTypes() // 加载字典类型列表供选择
  }
  if (newTab === 'dictionary' && isTenantOwner.value) {
    loadDictTypes()
  }
})

// 监听租户信息变化，自动更新表单数据
watch(
  () => tenantInfo.value,
  () => {
    if (tenantInfo.value) {
      initFormData()
    }
  },
  { deep: true }
)

onMounted(() => {
  initFormData()
  if (isTenantOwner.value) {
    loadSubsidiaries()
  }
})
</script>

<style scoped>
.tenant-settings-container {
  padding: 0;
  min-height: calc(100vh - 100px);
}

.tenant-settings-layout {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 左侧导航 */
.tenant-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 24px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tenant-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.tenant-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-top: 12px;
  text-align: center;
  word-break: break-all;
}

.nav-menu {
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606266;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #e6f4ff;
  color: #409eff;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

/* 右侧内容 */
.tenant-content {
  flex: 1;
  min-width: 0;
}

.content-section {
  padding: 0;
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header .content-title {
  margin: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.logo-section {
  margin-bottom: 32px;
}

.logo-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-desc {
  max-width: 600px;
}

.logo-desc p {
  margin: 4px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 字典管理左右分栏布局 */
.dictionary-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 280px);
}

.dictionary-left {
  width: 500px;
  flex-shrink: 0;
}

.dictionary-right {
  flex: 1;
  min-width: 0;
}


.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 20px;
}

.tree-node-text {
  flex: 1;
}

.tree-node-code {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.tree-node-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-label:hover .tree-node-actions {
  opacity: 1;
}
</style>
