<template>
  <div class="tenant-content-section">
    <h2 class="tenant-content-title">字典管理</h2>
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import dictionaryApi, {
  type DictType,
  type DictItemTreeNode,
  type CreateDictTypeDto,
  type UpdateDictTypeDto,
  type CreateDictItemDto,
  type UpdateDictItemDto,
} from '@/api/dictionary'

// 字典管理状态
const dictTypes = ref<DictType[]>([])
const dictTypeLoading = ref(false)
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

onMounted(() => {
  loadDictTypes()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/tenant-layout.scss';

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

.pagination-section {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>

