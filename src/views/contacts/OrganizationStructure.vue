<template>
  <div class="organization-structure">
    <div class="layout-container">
      <!-- 左侧部门树 -->
      <div class="sidebar">
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索成员、部门"
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-dropdown @command="handleAddAction" trigger="click">
            <el-button type="primary" :icon="Plus" class="add-button"> 添加 </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="add-department">添加部门</el-dropdown-item>
                <el-dropdown-item command="add-member">添加成员</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="department-tree">
          <el-tree
            :data="departmentTree"
            :props="treeProps"
            node-key="treeId"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :highlight-current="true"
            :current-node-key="selectedTreeNodeId"
            class="tree"
          >
            <template #default="{ data }">
              <div class="tree-node" :class="{ 'is-selected': selectedTreeNodeId === data.treeId }">
                <div class="node-content" @click="handleDepartmentClick(data)">
                  <el-icon class="node-icon">
                    <OfficeBuilding v-if="data.type === 'company' || data.isTenant" />
                    <Folder v-else />
                  </el-icon>
                  <span class="node-name">{{ data.name }}</span>
                </div>
                <div class="node-actions">
                  <el-dropdown
                    v-if="data.type === 'department' || (data.type === 'company' && data.isTenant)"
                    @command="(command: string) => handleDepartmentAction(command, data)"
                    trigger="click"
                    @click.stop
                    class="action-dropdown"
                  >
                    <el-icon class="more-icon"><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="add-sub">添加子部门</el-dropdown-item>
                        <el-dropdown-item v-if="data.type === 'department'" command="edit"
                          >修改名称</el-dropdown-item
                        >
                        <el-dropdown-item v-if="data.type === 'department'" command="set-manager"
                          >设置负责人</el-dropdown-item
                        >
                        <el-dropdown-item v-if="data.type === 'department'" command="move-up"
                          >上移</el-dropdown-item
                        >
                        <el-dropdown-item v-if="data.type === 'department'" command="move-down"
                          >下移</el-dropdown-item
                        >
                        <el-dropdown-item
                          v-if="data.type === 'department'"
                          command="delete"
                          :disabled="
                            (data.children && data.children.length > 0) ||
                            (data.memberCount && data.memberCount > 0)
                          "
                          divided
                        >
                          <span
                            v-if="
                              (data.children && data.children.length > 0) ||
                              (data.memberCount && data.memberCount > 0)
                            "
                          >
                            删除 (有子部门或成员)
                          </span>
                          <span v-else>删除</span>
                        </el-dropdown-item>
                        <el-dropdown-item command="info" disabled>
                          {{ data.type === 'company' ? '租户ID' : '部门ID' }}: {{ getNodeDisplayId(data) }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧成员列表 -->
      <div class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar-section">
          <div class="toolbar-header">
            <div class="header-info">
              <h2 class="department-title">
                {{ currentDepartment.name }} · {{ currentDepartment.memberCount }}人
              </h2>
            </div>
            <div class="header-actions">
              <el-button type="primary" :icon="Plus" @click="handleAddMember"> 添加成员 </el-button>
              <el-dropdown @command="handleBatchAction">
                <el-button>
                  批量导入/导出<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="import">批量导入</el-dropdown-item>
                    <el-dropdown-item command="export">批量导出</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button @click="handleBatchEdit">批量添加成员</el-button>
              <el-button @click="handleBatchDelete">删除</el-button>
              <el-button @click="handleWechatInvite">微信邀请</el-button>
            </div>
          </div>
          <!-- 提示信息 -->
          <div v-if="currentDepartment.unjoinedCount > 0" class="notice-banner">
            <el-icon><Warning /></el-icon>
            <span>当前部门尚有{{ currentDepartment.unjoinedCount }}人未加入</span>
            <el-link type="primary">立即邀请</el-link>
            <el-link type="primary">导出</el-link>
          </div>
        </div>

        <!-- 列表 -->
        <div class="list-section" ref="tableWrapperRef">
          <el-table
            :data="currentDepartment.members"
            style="width: 100%"
            :height="tableHeight"
            @selection-change="handleSelectionChange"
            v-loading="loading"
            border
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="user.username" label="姓名" min-width="150">
              <template #default="scope">
                <div class="member-name">
                  <el-avatar :size="32" :src="scope.row.user?.avatar">
                    {{ scope.row.user?.username?.charAt(0) || '?' }}
                  </el-avatar>
                  <span class="name-text">{{ scope.row.user?.username || '未设置' }}</span>
                  <el-tag
                    v-if="
                      scope.row.isManager === true ||
                      (currentDepartment.managerId &&
                        (String(scope.row.id) === String(currentDepartment.managerId) ||
                          Number(scope.row.id) === Number(currentDepartment.managerId)))
                    "
                    type="success"
                    size="small"
                    style="margin-left: 8px"
                  >
                    负责人
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="角色" min-width="120" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.memberRoles && scope.row.memberRoles.length > 0">
                  {{
                    scope.row.memberRoles.map((mr: any) => mr.role?.name || '未知角色').join('; ')
                  }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="部门" min-width="120" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.departments && scope.row.departments.length > 0">
                  {{ scope.row.departments.map((dept: any) => dept.name).join('; ') }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="user.phone" label="手机" width="150">
              <template #default="scope">
                <span>{{ scope.row.user?.phone || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="user.email" label="邮箱" min-width="150">
              <template #default="scope">
                <span>{{ scope.row.user?.email || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleEditMember(scope.row)">
                  编辑
                </el-button>
                <el-button type="text" size="small" @click="handleDeleteMember(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="memberPagination.page"
            v-model:page-size="memberPagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="memberPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleMemberPageSizeChange"
            @current-change="handleMemberPageChange"
          />
        </div>
      </div>
    </div>

    <!-- 部门管理对话框 -->
    <el-dialog
      v-model="departmentDialogVisible"
      :title="departmentDialogTitle"
      width="500px"
      @close="resetDepartmentForm"
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        :rules="departmentFormRules"
        label-width="80px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="departmentForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门描述" prop="description">
          <el-input
            v-model="departmentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="departmentForm.parentId"
            :data="departmentTreeOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择上级部门"
            clearable
            check-strictly
          />
          <div v-if="departmentForm.parentId === 'root' || departmentForm.parentId === null" class="text-sm text-gray-500 mt-1">
            将在租户根节点下创建根级部门
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="departmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitDepartment" :loading="departmentSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 设置负责人对话框 -->
    <el-dialog v-model="managerDialogVisible" title="设置部门负责人" width="400px">
      <el-form label-width="80px">
        <el-form-item label="部门">
          <el-input :value="currentDepartment.name" disabled />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            v-model="selectedManagerId"
            placeholder="请选择负责人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="member in availableManagers"
              :key="member.id"
              :label="member.user?.username || member.user?.realName || '未设置'"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="managerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSetManager" :loading="managerSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="memberDialogVisible"
      :title="memberDialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="memberFormRef" :model="memberForm" :rules="memberFormRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="memberForm.username"
            placeholder="请输入用户名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="memberForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="memberForm.email" placeholder="请输入邮箱（可选）" maxlength="100" />
        </el-form-item>
        <el-form-item label="所属部门" prop="departmentId">
          <el-tree-select
            v-model="memberForm.departmentId"
            :data="departmentTreeOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择所属部门"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="职位角色" prop="roleIds">
          <el-select
            v-model="memberForm.roleIds"
            placeholder="请选择职位角色（可多选）"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="role in availableRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" v-if="!memberForm.isEdit">
          <el-input v-model="memberForm.password" placeholder="默认密码：88888888" disabled />
          <div class="text-sm text-gray-500 mt-1">
            默认密码为 88888888，用户首次登录后可自行修改
          </div>
        </el-form-item>
        <el-form-item label="密码" v-if="memberForm.isEdit">
          <el-input placeholder="编辑时不修改密码，留空保持原密码" disabled />
          <div class="text-sm text-gray-500 mt-1">
            编辑成员时不修改密码，如需修改密码请联系管理员
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitMember" :loading="memberSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量设置成员对话框 -->
    <el-dialog
      v-model="batchEditDialogVisible"
      title="批量添加成员到部门"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="batch-edit-info">
        <el-alert
          :title="`请选择要添加到「${currentDepartment.name}」的成员（已排除当前部门内的成员）`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      <div style="margin-top: 20px">
        <el-input
          v-model="memberSearchKeyword"
          placeholder="搜索成员姓名、手机、邮箱"
          :prefix-icon="Search"
          clearable
          style="margin-bottom: 16px"
        />
        <el-table
          :data="filteredAvailableMembers"
          style="width: 100%"
          max-height="450"
          @selection-change="handleBatchMemberSelectionChange"
          v-loading="loadingAvailableMembers"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="姓名" min-width="150">
            <template #default="scope">
              <div class="member-name">
                <el-avatar :size="32" :src="scope.row.user?.avatar">
                  {{ scope.row.user?.username?.charAt(0) || '?' }}
                </el-avatar>
                <span class="name-text">{{ scope.row.user?.username || '未设置' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="user.phone" label="手机" width="150">
            <template #default="scope">
              <span>{{ scope.row.user?.phone || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="user.email" label="邮箱" min-width="150" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.user?.email || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属部门" min-width="150" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.departments && scope.row.departments.length > 0">
                {{ scope.row.departments.map((dept: any) => dept.name).join('; ') }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 16px; text-align: right; color: #909399; font-size: 14px">
          已选择 {{ batchSelectedMembers.length }} 个成员
        </div>
      </div>

      <template #footer>
        <el-button @click="handleBatchEditCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmitBatchEdit"
          :loading="batchEditSubmitting"
          :disabled="batchSelectedMembers.length === 0"
        >
          确定 ({{ batchSelectedMembers.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  OfficeBuilding,
  Folder,
  MoreFilled,
  Warning,
  ArrowDown,
} from '@element-plus/icons-vue'
import {
  getDepartmentTree,
  getDepartmentMembers,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartmentMember,
  batchAddDepartmentMembers,
  removeDepartmentMember,
  type Department,
  type Member,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from '@/api/department'
import { userApi, type CreateUserDto } from '@/api/user'
import { roleApi } from '@/api/role'
import { useAuthStore } from '@/stores/modules/auth'

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)
const selectedMembers = ref<any[]>([])

// 部门管理相关
const departmentDialogVisible = ref(false)
const departmentDialogTitle = ref('')
const departmentSubmitting = ref(false)
const departmentFormRef = ref()
const departmentForm = reactive<CreateDepartmentDto & { id?: string }>({
  name: '',
  description: '',
  parentId: undefined,
})

const departmentFormRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

// 负责人管理相关
const managerDialogVisible = ref(false)
const managerSubmitting = ref(false)
const selectedManagerId = ref('')
const availableManagers = ref<Member[]>([])

// 当前操作的部门
const currentOperationDepartment = ref<Department | null>(null)

// 部门树数据
const departmentTree = ref<Department[]>([])
const selectedTreeNodeId = ref<string>('')

const getTreeNodeKey = (node: any) => {
  if (node.isTenant || node.id === 'root') {
    const originalId = node.originalTenantId ?? node.id
    return `tenant-${originalId}`
  }
  return `dept-${node.id}`
}

const getNodeDisplayId = (node: any) => {
  if (node.type === 'company' || node.isTenant) {
    return node.originalTenantId ?? node.id
  }
  return node.id
}

const findNodeById = (nodes: any[], id: string) => {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

const assignTreeIds = (nodes: any[]) => {
  nodes.forEach((node) => {
    if (node.isTenant && node.id !== 'root') {
      node.originalTenantId = node.id
      node.id = 'root'
    }
    node.treeId = getTreeNodeKey(node)
    if (node.children && node.children.length > 0) {
      assignTreeIds(node.children)
    }
  })
}

// 当前选中的部门
const currentDepartment = ref<any>({
  id: '',
  name: '',
  managerId: undefined,
  memberCount: 0,
  unjoinedCount: 0,
  members: [],
})

// 成员列表分页
const memberPagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 表格高度
const tableWrapperRef = ref<HTMLElement | null>(null)
const tableHeight = ref<number | string>('100%')

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (tableWrapperRef.value) {
      const wrapperHeight = tableWrapperRef.value.clientHeight
      tableHeight.value = wrapperHeight || '100%'
    }
  })
}

// 认证状态
const authStore = useAuthStore()

// 成员对话框相关
const memberDialogVisible = ref(false)
const memberDialogTitle = ref('添加成员')
const memberSubmitting = ref(false)
const memberFormRef = ref()

// 批量编辑相关
const batchEditDialogVisible = ref(false)
const batchEditSubmitting = ref(false)
const batchSelectedMembers = ref<any[]>([]) // 批量编辑选中的成员
const availableMembers = ref<any[]>([]) // 可用的成员列表（租户下所有成员，排除当前部门的）
const loadingAvailableMembers = ref(false)
const memberSearchKeyword = ref('') // 成员搜索关键词

// 过滤后的可用成员（根据搜索关键词）
const filteredAvailableMembers = computed(() => {
  if (!memberSearchKeyword.value.trim()) {
    return availableMembers.value
  }
  const keyword = memberSearchKeyword.value.toLowerCase()
  return availableMembers.value.filter((member) => {
    const username = member.user?.username?.toLowerCase() || ''
    const phone = member.user?.phone?.toLowerCase() || ''
    const email = member.user?.email?.toLowerCase() || ''
    return username.includes(keyword) || phone.includes(keyword) || email.includes(keyword)
  })
})

// 成员表单数据
const memberForm = reactive<CreateUserDto & { id?: string; isEdit?: boolean }>({
  id: '',
  username: '',
  email: '',
  phone: '',
  password: '88888888',
  tenantId: '',
  departmentId: '',
  roleIds: [],
  isEdit: false,
})

// 成员表单验证规则
const memberFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
}

// 可用角色列表
const availableRoles = ref<any[]>([])

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name',
}

// 部门树选项（用于选择上级部门）
const departmentTreeOptions = computed(() => {
  const convertToOptions = (departments: Department[]): any[] => {
    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      children: dept.children ? convertToOptions(dept.children) : [],
    }))
  }

  // 处理部门树，排除租户节点，只转换其子节点（根级部门）
  let options: any[] = []
  if (departmentTree.value.length > 0) {
    const tenantNode = departmentTree.value[0] as any
    if (tenantNode.type === 'company' && tenantNode.isTenant) {
      // 只转换租户节点的子节点（根级部门），不包含租户节点本身
      options = tenantNode.children ? convertToOptions(tenantNode.children) : []
      // 在选项列表开头添加租户根节点，使用 'root' 作为标识符
      options.unshift({
        id: 'root', // 使用 'root' 表示租户根节点，便于 el-tree-select 显示
        name: tenantNode.name,
        children: [],
      })
    } else {
      // 如果没有租户节点，直接转换所有部门
      options = convertToOptions(departmentTree.value)
    }
  }

  return options
})

// 加载部门树
const loadDepartmentTree = async () => {
  try {
    loading.value = true
    const response = await getDepartmentTree()
    departmentTree.value = response.data || []
    assignTreeIds(departmentTree.value)

    // 如果有部门，默认选中第一个
    if (departmentTree.value.length > 0) {
      handleDepartmentClick(departmentTree.value[0])
    }
  } catch (error) {
    console.error('加载部门树失败:', error)
    ElMessage.error('加载部门树失败')
  } finally {
    loading.value = false
  }
}

// 处理部门点击
const handleDepartmentClick = async (data: any, forceRefresh = false) => {
  try {
    const enrichedNode =
      data.treeId || data.children || data.isTenant
        ? data
        : findNodeById(departmentTree.value, data.id)
    const targetNode = enrichedNode || data
    const newSelectedId = targetNode.treeId || getTreeNodeKey(targetNode)

    // 如果点击的是同一个节点且不是强制刷新，不重复请求
    if (!forceRefresh && selectedTreeNodeId.value === newSelectedId && currentDepartment.value.id === targetNode.id) {
      return
    }

    loading.value = true
    selectedTreeNodeId.value = newSelectedId

    // 重置分页到第一页（仅在切换部门时）
    if (currentDepartment.value.id !== targetNode.id) {
      memberPagination.page = 1
    }

    // 如果是租户根节点，显示所有成员
    if (targetNode.isTenant || targetNode.id === 'root') {
      // 这里可以调用获取所有成员的接口，暂时使用部门成员接口
      const response = await getDepartmentMembers(targetNode.id, {
        page: memberPagination.page,
        limit: memberPagination.limit,
      })

      const members = response.data.members || []
      const total = response.data.total || members.length

      currentDepartment.value = {
        id: targetNode.id,
        name: targetNode.name,
        managerId: targetNode.managerId,
        memberCount: total, // 使用实际返回的成员总数
        unjoinedCount: 0,
        members: members,
      }
      memberPagination.total = total
    } else {
      // 普通部门，显示部门成员
      // 先获取部门详情以获取managerId
      let departmentDetail = null
      try {
        const detailResponse = await getDepartmentById(targetNode.id)
        if (detailResponse.code === 200) {
          departmentDetail = detailResponse.data
        }
      } catch (error) {
        console.error('获取部门详情失败:', error)
      }

      const response = await getDepartmentMembers(targetNode.id, {
        page: memberPagination.page,
        limit: memberPagination.limit,
      })

      const members = response.data.members || []
      const total = response.data.total || members.length

      currentDepartment.value = {
        id: targetNode.id,
        name: targetNode.name,
        managerId: departmentDetail?.managerId || targetNode.managerId,
        memberCount: total, // 使用实际返回的成员总数
        unjoinedCount: 0,
        members: members,
      }
      memberPagination.total = total
    }

    // 重新计算表格高度
    calculateTableHeight()
  } catch (error) {
    console.error('加载部门成员失败:', error)
    ElMessage.error('加载部门成员失败')
  } finally {
    loading.value = false
  }
}

// 处理成员列表分页变化
const handleMemberPageChange = async (page: number) => {
  memberPagination.page = page
  if (currentDepartment.value.id) {
    await handleDepartmentClick({ id: currentDepartment.value.id }, true)
  }
}

// 处理成员列表每页数量变化
const handleMemberPageSizeChange = async (limit: number) => {
  memberPagination.limit = limit
  memberPagination.page = 1 // 重置到第一页
  if (currentDepartment.value.id) {
    await handleDepartmentClick({ id: currentDepartment.value.id }, true)
  }
}

// 处理添加操作
const handleAddAction = (command: string) => {
  switch (command) {
    case 'add-department':
      openDepartmentDialog('add')
      break
    case 'add-member':
      handleAddMember()
      break
  }
}

// 处理部门操作
const handleDepartmentAction = async (command: string, data: any) => {
  currentOperationDepartment.value = data

  switch (command) {
    case 'add-sub':
      // 如果是租户根节点，创建根级部门（parentId为null）
      if (data.type === 'company' && data.isTenant) {
        openDepartmentDialog('add', null)
      } else {
        openDepartmentDialog('add', data.id)
      }
      break
    case 'edit':
      // 租户根节点不能编辑
      if (data.type === 'company' && data.isTenant) {
        ElMessage.warning('租户名称不能在此处修改')
        return
      }
      openDepartmentDialog('edit', undefined, data)
      break
    case 'set-manager':
      // 租户根节点不能设置负责人
      if (data.type === 'company' && data.isTenant) {
        ElMessage.warning('租户不能设置负责人')
        return
      }
      await openManagerDialog(data)
      break
    case 'move-up':
      // 租户根节点不能移动
      if (data.type === 'company' && data.isTenant) {
        ElMessage.warning('租户不能移动')
        return
      }
      await handleMoveDepartment(data, 'up')
      break
    case 'move-down':
      // 租户根节点不能移动
      if (data.type === 'company' && data.isTenant) {
        ElMessage.warning('租户不能移动')
        return
      }
      await handleMoveDepartment(data, 'down')
      break
    case 'delete':
      // 租户根节点不能删除
      if (data.type === 'company' && data.isTenant) {
        ElMessage.warning('租户不能删除')
        return
      }
      await handleDeleteDepartment(data)
      break
    case 'info':
      ElMessage.info(`${data.type === 'company' ? '租户ID' : '部门ID'}: ${getNodeDisplayId(data)}`)
      break
  }
}

// 处理删除部门
const handleDeleteDepartment = async (department: any) => {
  try {
    // 检查是否有子部门
    if (department.children && department.children.length > 0) {
      ElMessage.warning('该部门下还有子部门，请先删除子部门')
      return
    }

    // 检查是否有成员
    if (department.memberCount && department.memberCount > 0) {
      ElMessage.warning('该部门下还有成员，请先移除所有成员')
      return
    }

    // 确认删除
    await ElMessageBox.confirm(
      `确定要删除部门 "${department.name}" 吗？\n\n删除后将无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      },
    )

    // 执行删除
    const result = await deleteDepartment(department.id)
    ElMessage.success(result.message)

    // 重新加载部门树
    await loadDepartmentTree()

    // 如果删除的是当前选中的部门，清空右侧内容
    if (currentDepartment.value.id === department.id) {
      currentDepartment.value = {
        id: '',
        name: '',
        managerId: undefined,
        memberCount: 0,
        unjoinedCount: 0,
        members: [],
      }
      selectedMembers.value = []
    }
  } catch (error: any) {
    if (error === 'cancel') {
      return
    }

    console.error('删除部门失败:', error)

    // 根据错误类型显示不同的提示
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('删除部门失败，请稍后重试')
    }
  }
}

// 处理添加成员
const handleAddMember = async () => {
  try {
    // 检查租户信息
    if (!authStore.tenant?.id) {
      ElMessage.error('租户信息未找到，请重新登录')
      return
    }

    // 显示加载状态
    const loadingInstance = ElMessage({
      message: '正在加载角色列表...',
      type: 'info',
      duration: 0,
    })

    try {
      // 设置租户ID
      memberForm.tenantId = authStore.tenant.id

      // 加载可用角色
      const rolesResponse = await roleApi.getOptions()
      if (rolesResponse.code === 200) {
        availableRoles.value = rolesResponse.data
      }

      // 重置表单
      Object.assign(memberForm, {
        id: '',
        username: '',
        email: '',
        phone: '',
        password: '88888888',
        tenantId: authStore.tenant.id,
        departmentId: currentDepartment.value.id || '',
        roleIds: [],
        isEdit: false,
      })

      loadingInstance.close()
      memberDialogTitle.value = '添加成员'
      memberDialogVisible.value = true
    } catch (loadError: any) {
      loadingInstance.close()

      // 根据错误类型显示不同的提示
      if (loadError.response?.data?.message) {
        ElMessage.error(loadError.response.data.message)
      } else if (loadError.message) {
        ElMessage.error(loadError.message)
      } else {
        ElMessage.error('加载角色列表失败，请稍后重试')
      }
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
  }
}

// 处理部门移动
const handleMoveDepartment = async (department: Department, direction: 'up' | 'down') => {
  try {
    // 这里需要调用后端API来更新部门的sortOrder
    // 暂时显示提示信息
    ElMessage.info(`${direction === 'up' ? '上移' : '下移'}部门功能开发中...`)

    // TODO: 实现部门排序功能
    // await updateDepartmentSortOrder(department.id, direction)
    // await loadDepartmentTree()
  } catch (error) {
    console.error('移动部门失败:', error)
    ElMessage.error('移动部门失败')
  }
}

// 处理提交成员
const handleSubmitMember = async () => {
  if (!memberFormRef.value) return

  try {
    await memberFormRef.value.validate()
    memberSubmitting.value = true

    if (memberForm.isEdit) {
      // 编辑用户
      const {
        password: _,
        tenantId: __,
        departmentId: ___,
        isEdit: _____,
        ...updateData
      } = memberForm
      // 包含 roleIds 在更新数据中
      const id = memberForm.id
      const response = await userApi.update(id!, updateData)

      if (response.code === 200) {
        ElMessage.success('更新成员成功')
        memberDialogVisible.value = false

        // 重新加载部门树和当前部门成员
        await loadDepartmentTree()
        if (currentDepartment.value.id) {
          await handleDepartmentClick({ id: currentDepartment.value.id })
        }
      }
    } else {
      // 创建用户
      const { isEdit: _, ...createData } = memberForm
      const response = await userApi.create(createData)

      if (response.code === 201) {
        ElMessage.success('添加成员成功')
        memberDialogVisible.value = false

        // 重新加载部门树和当前部门成员
        await loadDepartmentTree()
        if (currentDepartment.value.id) {
          await handleDepartmentClick({ id: currentDepartment.value.id })
        }
      }
    }
  } catch (error: any) {
    console.error(memberForm.isEdit ? '更新成员失败:' : '添加成员失败:', error)

    // 根据错误类型显示不同的提示
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error(`${memberForm.isEdit ? '更新' : '添加'}成员失败，请稍后重试`)
    }
  } finally {
    memberSubmitting.value = false
  }
}

// 打开部门对话框
const openDepartmentDialog = (type: 'add' | 'edit', parentId?: string | null, department?: any) => {
  if (type === 'add') {
    if (parentId === null) {
      // 在租户根节点下添加根级部门
      departmentDialogTitle.value = '添加根级部门'
    } else if (parentId) {
      // 在指定部门下添加子部门
      departmentDialogTitle.value = '添加子部门'
    } else {
      // 添加普通部门
      departmentDialogTitle.value = '添加部门'
    }
    resetDepartmentForm()
    // 如果 parentId 是 null，设置为 'root' 以便 el-tree-select 能正确显示
    departmentForm.parentId = parentId === null ? 'root' : (parentId || undefined)
  } else {
    departmentDialogTitle.value = '编辑部门'
    departmentForm.id = department?.id
    departmentForm.name = department?.name || ''
    departmentForm.description = department?.description || ''
    // 编辑时，如果 parentId 是 null 或 undefined，设置为 'root' 以便显示
    departmentForm.parentId = department?.parentId === null || department?.parentId === undefined
      ? 'root'
      : department?.parentId
  }
  departmentDialogVisible.value = true
}

// 重置部门表单
const resetDepartmentForm = () => {
  departmentForm.id = undefined
  departmentForm.name = ''
  departmentForm.description = ''
  departmentForm.parentId = undefined
  departmentFormRef.value?.clearValidate()
}

// 提交部门表单
const handleSubmitDepartment = async () => {
  if (!departmentFormRef.value) return

  try {
    await departmentFormRef.value.validate()
    departmentSubmitting.value = true

    if (departmentForm.id) {
      // 编辑部门
      // 如果 parentId 是 'root'，表示在租户根节点下，应该发送 undefined
      const parentId = departmentForm.parentId === 'root' || departmentForm.parentId === null
        ? undefined
        : departmentForm.parentId
      const updateData: UpdateDepartmentDto = {
        name: departmentForm.name,
        description: departmentForm.description,
        parentId: parentId,
      }
      await updateDepartment(departmentForm.id, updateData)
      ElMessage.success('更新部门成功')
    } else {
      // 创建部门
      // 如果 parentId 是 'root'，表示在租户根节点下创建，应该发送 undefined
      const parentId = departmentForm.parentId === 'root' || departmentForm.parentId === null
        ? undefined
        : departmentForm.parentId
      const createData: CreateDepartmentDto = {
        name: departmentForm.name,
        description: departmentForm.description,
        parentId: parentId,
      }
      await createDepartment(createData)
      ElMessage.success('创建部门成功')
    }

    departmentDialogVisible.value = false
    await loadDepartmentTree() // 重新加载部门树
  } catch (error) {
    console.error('提交部门失败:', error)
    ElMessage.error('操作失败')
  } finally {
    departmentSubmitting.value = false
  }
}

// 打开设置负责人对话框
const openManagerDialog = async (department: Department) => {
  currentOperationDepartment.value = department
  selectedManagerId.value = department.managerId || ''

  try {
    // 获取所有成员作为负责人候选
    const response = await getDepartmentMembers(department.id, {
      page: 1,
      limit: 100,
    })
    availableManagers.value = response.data.members || []
    managerDialogVisible.value = true
  } catch (error) {
    console.error('获取成员列表失败:', error)
    ElMessage.error('获取成员列表失败')
  }
}

// 设置部门负责人
const handleSetManager = async () => {
  if (!currentOperationDepartment.value) return

  try {
    managerSubmitting.value = true

    // 这里需要调用设置负责人的API，暂时用更新部门API
    const updateData: UpdateDepartmentDto = {
      managerId: selectedManagerId.value || undefined,
    }
    await updateDepartment(currentOperationDepartment.value.id, updateData)

    ElMessage.success('设置负责人成功')
    managerDialogVisible.value = false
    await loadDepartmentTree() // 重新加载部门树
  } catch (error) {
    console.error('设置负责人失败:', error)
    ElMessage.error('设置负责人失败')
  } finally {
    managerSubmitting.value = false
  }
}

// 处理批量操作
const handleBatchAction = (command: string) => {
  switch (command) {
    case 'import':
      ElMessage.info('批量导入功能开发中...')
      break
    case 'export':
      ElMessage.info('批量导出功能开发中...')
      break
  }
}

// 处理批量编辑
const handleBatchEdit = async () => {
  try {
    // 检查租户信息
    if (!authStore.tenant?.id) {
      ElMessage.error('租户信息未找到，请重新登录')
      return
    }

    // 重置状态
    batchSelectedMembers.value = []
    memberSearchKeyword.value = ''
    loadingAvailableMembers.value = true

    try {
      // 获取租户下所有成员
      const allMembersResponse = await getDepartmentMembers('root', {
        page: 1,
        limit: 1000, // 获取所有成员
      })

      const allMembers = allMembersResponse.data.members || []

      // 获取当前部门的成员ID列表
      const currentDeptMemberIds = new Set(
        (currentDepartment.value.members || []).map((m: any) => m.id)
      )

      // 过滤掉已经在当前部门的成员
      availableMembers.value = allMembers.filter(
        (member: any) => !currentDeptMemberIds.has(member.id)
      )

      if (availableMembers.value.length === 0) {
        ElMessage.warning('当前租户下没有可添加的成员（所有成员都已在本部门）')
        return
      }

      batchEditDialogVisible.value = true
    } catch (error: any) {
      console.error('加载成员列表失败:', error)
      ElMessage.error(error.response?.data?.message || '加载成员列表失败')
    } finally {
      loadingAvailableMembers.value = false
    }
  } catch (error) {
    console.error('打开批量设置失败:', error)
    ElMessage.error('打开批量设置失败')
  }
}

// 批量编辑成员选择变化
const handleBatchMemberSelectionChange = (selection: any[]) => {
  batchSelectedMembers.value = selection
}

// 批量编辑取消
const handleBatchEditCancel = () => {
  batchEditDialogVisible.value = false
  batchSelectedMembers.value = []
  memberSearchKeyword.value = ''
}

// 提交批量编辑（将选中的成员添加到当前部门）
const handleSubmitBatchEdit = async () => {
  if (batchSelectedMembers.value.length === 0) {
    ElMessage.warning('请先选择要添加的成员')
    return
  }

  // 检查当前部门
  if (!currentDepartment.value.id || currentDepartment.value.id === 'root') {
    ElMessage.warning('请先选择一个部门')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将 ${batchSelectedMembers.value.length} 个成员添加到「${currentDepartment.value.name}」吗？`,
      '确认批量添加',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    batchEditSubmitting.value = true

    // 批量添加成员到当前部门
    const memberIds = batchSelectedMembers.value.map(m => m.id)
    const response = await batchAddDepartmentMembers(currentDepartment.value.id, {
      memberIds: memberIds,
      position: '',
      isManager: false,
    })

    // 显示结果
    if (response.code === 201) {
      const result = response.data || {}
      const successCount = result.success || memberIds.length
      const skippedCount = result.skipped || 0

      if (skippedCount > 0) {
        ElMessage.warning(`成功添加 ${successCount} 个成员，${skippedCount} 个成员已在部门中`)
      } else {
        ElMessage.success(`成功添加 ${successCount} 个成员到「${currentDepartment.value.name}」`)
      }
    } else {
      ElMessage.error(response.message || '批量添加成员失败')
    }

    batchEditDialogVisible.value = false

    // 重新加载当前部门成员（强制刷新）
    if (currentDepartment.value.id) {
      await handleDepartmentClick({ id: currentDepartment.value.id }, true)
    }

    // 清空选择
    batchSelectedMembers.value = []
    memberSearchKeyword.value = ''
  } catch (error: any) {
    console.error('批量添加成员失败:', error)
    ElMessage.error(error.response?.data?.message || '批量添加成员失败，请稍后重试')
  } finally {
    batchEditSubmitting.value = false
  }
}

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedMembers.value.length === 0) {
    ElMessage.warning('请先选择要删除的成员')
    return
  }
  ElMessage.info(`批量删除 ${selectedMembers.value.length} 个成员`)
}

// 处理微信邀请
const handleWechatInvite = () => {
  ElMessage.info('微信邀请功能开发中...')
}

// 处理成员选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedMembers.value = selection
}

// 处理编辑成员
const handleEditMember = async (member: any) => {
  try {
    // 检查租户信息
    if (!authStore.tenant?.id) {
      ElMessage.error('租户信息未找到，请重新登录')
      return
    }

    // 显示加载状态
    const loadingInstance = ElMessage({
      message: '正在加载成员信息...',
      type: 'info',
      duration: 0,
    })

    try {
      // 加载可用角色
      const rolesResponse = await roleApi.getOptions()
      if (rolesResponse.code === 200) {
        availableRoles.value = rolesResponse.data
      }

      // 获取用户的角色信息
      const userRoles = member.memberRoles?.map((mr: any) => mr.role?.id).filter(Boolean) || []

      // 设置表单数据
      Object.assign(memberForm, {
        id: member.user?.id || member.id,
        username: member.user?.username || '',
        email: member.user?.email || '',
        phone: member.user?.phone || '',
        password: '', // 编辑时不显示密码
        tenantId: authStore.tenant.id,
        departmentId: member.departments?.[0]?.id || currentDepartment.value.id || '',
        roleIds: userRoles,
        isEdit: true,
      })

      loadingInstance.close()
      memberDialogTitle.value = '编辑成员'
      memberDialogVisible.value = true
    } catch (loadError: any) {
      loadingInstance.close()

      // 根据错误类型显示不同的提示
      if (loadError.response?.data?.message) {
        ElMessage.error(loadError.response.data.message)
      } else if (loadError.message) {
        ElMessage.error(loadError.message)
      } else {
        ElMessage.error('加载成员信息失败，请稍后重试')
      }
    }
  } catch (error) {
    console.error('加载成员信息失败:', error)
    ElMessage.error('加载成员信息失败')
  }
}

// 处理删除成员
const handleDeleteMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除成员 "${member.user?.username || '未设置'}" 吗？\n\n删除后将无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      },
    )

    // 显示加载状态
    const loadingInstance = ElMessage({
      message: '正在删除成员...',
      type: 'info',
      duration: 0,
    })

    try {
      const response = await removeDepartmentMember(currentDepartment.value.id, member.id)
      loadingInstance.close()

      // 检查响应是否成功（204 或其他成功状态码）
      if (response && (response.code === 204 || (response.code >= 200 && response.code < 300))) {
        ElMessage.success('删除成员成功')

        // 如果当前页只有一条数据，删除后应该跳转到上一页
        if (currentDepartment.value.members.length === 1 && memberPagination.page > 1) {
          memberPagination.page -= 1
        }

        // 重新加载当前部门成员（强制刷新）
        if (currentDepartment.value.id) {
          await handleDepartmentClick({ id: currentDepartment.value.id }, true)
        }
      } else {
        ElMessage.error('删除成员失败，请稍后重试')
      }
    } catch (deleteError: any) {
      loadingInstance.close()

      // 根据错误类型显示不同的提示
      if (deleteError.response?.data?.message) {
        ElMessage.error(deleteError.response.data.message)
      } else if (deleteError.message) {
        ElMessage.error(deleteError.message)
      } else {
        ElMessage.error('删除成员失败，请稍后重试')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除成员失败:', error)
      ElMessage.error('删除成员失败')
    }
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadDepartmentTree()
  calculateTableHeight()

  // 监听窗口大小变化
  window.addEventListener('resize', calculateTableHeight)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>

<style scoped>
.organization-structure {
  height: 100vh;
  background: #f5f7fa;
}

.layout-container {
  display: flex;
  height: 100%;
}

/* 左侧边栏 */
.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
}

.add-button {
  flex-shrink: 0;
}

.department-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree {
  background: transparent;
  border: none;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  margin: 6px 0;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border-radius: 8px;
}

.tree-node:hover .node-actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.tree-node.is-selected .node-actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* 设置树节点行高为35px */
:deep(.el-tree-node__content) {
  height: 35px;
  line-height: 35px;
}

/* 悬停和选中状态：只改变 el-tree-node__content 的背景色，和悬停效果一致 */
:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

/* 选中状态：使用 Element Plus 原生的 is-current 类 */
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #f5f7fa;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}

.node-icon {
  font-size: 16px;
  color: #606266;
}

.node-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.node-actions {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.action-dropdown {
  margin-left: 8px;
}

.more-icon {
  font-size: 14px;
  color: #c0c4cc;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.more-icon:hover {
  background-color: #f0f0f0;
  color: #606266;
}

/* 右侧主内容区 */
.main-content {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-height: 0;
}

/* 工具栏区域 */
.toolbar-section {
  flex-shrink: 0;
  border-bottom: 1px solid #e6e6e6;
}

.toolbar-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-info {
  flex: 1;
}

.department-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.api-info {
  font-size: 12px;
  color: #409eff;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 提示横幅 */
.notice-banner {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 0 15px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #d46b08;
}

.notice-banner .el-icon {
  color: #faad14;
}

/* 列表区域 */
.list-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

/* 分页区域 */
.pagination-section {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e6e6e6;
  flex-shrink: 0;
  background: #fff;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-size: 14px;
  color: #303133;
}

/* 表格样式优化 */
:deep(.el-table) {
  border: none;
  border-radius: 0;
}

:deep(.el-table th) {
  color: #606266;
  font-weight: 600;
  padding: 12px 8px;
}

:deep(.el-table td) {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-table tr:hover > td) {
  background-color: #f5f7fa;
}

/* 批量编辑对话框样式 */
.batch-edit-container {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.batch-edit-left {
  flex: 1;
  min-width: 0;
}

.batch-edit-right {
  flex: 1;
  min-width: 0;
  border-left: 1px solid #e6e6e6;
  padding-left: 20px;
}

.batch-edit-info {
  margin-bottom: 16px;
}

.text-sm {
  font-size: 12px;
}

.text-gray-500 {
  color: #909399;
}

.mt-1 {
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions .el-button {
    width: 100%;
  }
}
</style>
