<template>
  <div class="member-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索姓名、手机、邮箱"
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
                placeholder="状态筛选"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
                <el-option label="暂停" value="suspended" />
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
          <el-button 
            type="primary" 
            :icon="Upload" 
            @click="handleImport"
          >
            导入成员
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
          :data="tableData"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="头像" width="80" align="center">
            <template #default="{ row }">
              <el-avatar :size="40" :src="row.user?.avatar">
                {{ row.user?.username?.charAt(0) || '?' }}
              </el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="user.username" label="姓名" min-width="120" />
          <el-table-column prop="user.phone" label="手机" width="150" />
          <el-table-column prop="user.email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column label="部门" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.departments && row.departments.length > 0">
                {{ row.departments.map((dept: any) => dept.name).join('、') }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="角色" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.memberRoles && row.memberRoles.length > 0">
                {{ row.memberRoles.map((mr: any) => mr.role?.name || '未知角色').join('、') }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="user.status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.user?.status)">
                {{ getStatusText(row.user?.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建者" width="120">
            <template #default="{ row }">
              <span v-if="row.user?.creator">{{ row.user.creator.username || '-' }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button
                :type="row.user?.status === 'active' ? 'warning' : 'success'"
                size="small"
                :icon="row.user?.status === 'active' ? 'Lock' : 'Unlock'"
                @click="handleToggleStatus(row)"
              >
                {{ row.user?.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
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
    </div>

    <!-- 导入成员对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入成员"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="import-dialog-content">
        <el-alert
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <div>
              <p>1. 请先下载导入模板，按照模板格式填写数据</p>
              <p>2. 部门字段：支持层级关系，使用"/"分隔，如"销售部/华东区"，如果部门不存在会自动创建</p>
              <p>3. 角色字段：多个角色使用"、"分隔，如"销售经理、区域经理"，如果角色不存在会自动创建</p>
              <p>4. 是否部门负责人：填写"是"或"否"（也可以填写"Y"/"N"），默认为"否"</p>
              <p>5. 必填字段：姓名、手机</p>
            </div>
          </template>
        </el-alert>
        <div class="import-actions">
          <el-button type="primary" :icon="Download" @click="downloadTemplate">
            下载导入模板
          </el-button>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
            accept=".xlsx,.xls"
            :limit="1"
          >
            <template #trigger>
              <el-button type="primary" :icon="Upload">选择文件</el-button>
            </template>
          </el-upload>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>预览数据（共 {{ importPreview.length }} 条）</h4>
          <el-table :data="importPreview" border max-height="300" style="margin-top: 10px">
            <el-table-column type="index" label="序号" width="60" align="center" :index="(index: number) => index + 1" />
            <el-table-column prop="username" label="姓名" width="120" show-overflow-tooltip />
            <el-table-column prop="phone" label="手机" width="150" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
            <el-table-column prop="company" label="公司/租户" min-width="120" show-overflow-tooltip />
            <el-table-column prop="department" label="部门" min-width="150" show-overflow-tooltip />
            <el-table-column prop="role" label="角色" min-width="150" show-overflow-tooltip />
            <el-table-column prop="isManager" label="是否部门负责人" width="130" show-overflow-tooltip />
            <el-table-column label="状态" width="80" fixed="right" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.error" type="danger">错误</el-tag>
                <el-tag v-else type="success">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="错误信息" min-width="200" fixed="right" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.error" style="color: red">{{ row.error }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="importLoading" 
          :disabled="importPreview.length === 0 || importPreview.some(row => row.error)"
          @click="handleImportSubmit"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑成员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入姓名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            type="email"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-tree-select
            v-model="formData.departmentIds"
            :data="departmentTreeOptions"
            :props="treeSelectProps"
            multiple
            check-strictly
            placeholder="请选择部门"
            style="width: 100%"
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="formData.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, Delete, Upload, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import memberApi, { type Member, type QueryMemberDto } from '@/api/member'
import userApi, { type UpdateUserDto, type CreateUserDto } from '@/api/user'
import { createDepartment, getDepartmentTree, addDepartmentMember, getMemberDepartments, removeDepartmentMember } from '@/api/department'
import roleApi, { type CreateRoleDto, type Role } from '@/api/role'
import tenantApi from '@/api/tenant'
import { useAuthStore } from '@/stores/modules/auth'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Member[]>([])
const selectedRows = ref<Member[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

// 导入相关
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importPreview = ref<Array<{
  username: string
  phone: string
  email?: string
  company?: string
  department?: string
  role?: string
  isManager?: string
  tenantId?: string | number
  error?: string
}>>([])
const uploadRef = ref()
const authStore = useAuthStore()

// 部门映射（用于快速查找）
const departmentMap = ref<Map<string, any>>(new Map())

// 搜索表单
const searchForm = reactive<QueryMemberDto>({
  search: '',
  status: undefined,
  page: 1,
  limit: 20
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const formData = reactive<UpdateUserDto & { 
  id?: string | number
  departmentIds?: (string | number)[]
}>({
  id: undefined,
  username: '',
  phone: '',
  email: '',
  departmentIds: [],
  roleIds: []
})

// 部门树选项
const departmentTreeOptions = ref<any[]>([])
const treeSelectProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

// 角色选项
const roleOptions = ref<Role[]>([])
const currentMemberId = ref<string | number>('')

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 计算属性
const isEdit = computed(() => !!formData.id)

// 方法
const loadData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await memberApi.getList(params)
    
    if (response.code === 200) {
      tableData.value = response.data.members
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载成员列表失败:', error)
    ElMessage.error('加载成员列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    status: undefined,
    page: 1,
    limit: 20
  })
  pagination.page = 1
  loadData()
}

// 加载部门树
const loadDepartmentTree = async () => {
  try {
    const response = await getDepartmentTree()
    if (response.code === 200 && response.data) {
      // 转换部门树格式，用于 el-tree-select
      const convertToOptions = (nodes: any[]): any[] => {
        return nodes
          .filter((node: any) => node.type === 'department')
          .map((node: any) => ({
            id: node.id,
            name: node.name,
            children: node.children && node.children.length > 0 ? convertToOptions(node.children) : []
          }))
      }
      
      // 处理部门树，排除租户节点，只转换其子节点（根级部门）
      let options: any[] = []
      if (response.data.length > 0) {
        const tenantNode = response.data[0] as any
        if (tenantNode.type === 'company' && tenantNode.isTenant) {
          // 只转换租户节点的子节点（根级部门），不包含租户节点本身
          options = tenantNode.children ? convertToOptions(tenantNode.children) : []
        } else {
          // 如果没有租户节点，直接转换所有部门
          options = convertToOptions(response.data)
        }
      }
      
      departmentTreeOptions.value = options
    }
  } catch (error) {
    console.error('加载部门树失败:', error)
  }
}

// 加载角色列表
const loadRoleOptions = async () => {
  try {
    const response = await roleApi.getList({ limit: 1000 })
    if (response.code === 200 && response.data) {
      roleOptions.value = response.data.roles.filter((r: Role) => r.isActive)
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

const handleEdit = async (row: Member) => {
  dialogTitle.value = '编辑成员'
  currentMemberId.value = row.id
  
  // 加载成员的部门和角色信息
  let departmentIds: (string | number)[] = []
  let roleIds: (string | number)[] = []
  
  try {
    // 获取成员的部门列表
    if (row.departments && row.departments.length > 0) {
      departmentIds = row.departments.map((dept: any) => dept.id)
    } else {
      // 如果列表中没有部门信息，通过API获取
      const deptResponse = await getMemberDepartments(row.id)
      if (deptResponse.code === 200 && deptResponse.data) {
        departmentIds = deptResponse.data.map((dept: any) => dept.id)
      }
    }
    
    // 获取成员的角色列表
    if (row.memberRoles && row.memberRoles.length > 0) {
      roleIds = row.memberRoles.map((mr: any) => mr.role?.id || mr.roleId).filter((id: any) => id)
    }
  } catch (error) {
    console.error('加载成员部门/角色信息失败:', error)
  }
  
  Object.assign(formData, {
    id: row.user?.id,
    username: row.user?.username || '',
    phone: row.user?.phone || '',
    email: row.user?.email || '',
    departmentIds: departmentIds,
    roleIds: roleIds
  })
  dialogVisible.value = true
}

const handleDialogClose = () => {
  // 重置表单数据
  Object.assign(formData, {
    id: undefined,
    username: '',
    phone: '',
    email: '',
    departmentIds: [],
    roleIds: []
  })
  currentMemberId.value = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value && formData.id) {
      const { id, departmentIds, ...updateData } = formData
      
      // 1. 更新用户基本信息（包括角色）
      await userApi.update(String(id), updateData)
      
      // 2. 更新成员的部门
      if (currentMemberId.value) {
        // 获取成员当前的部门列表
        const currentDeptResponse = await getMemberDepartments(currentMemberId.value)
        const currentDepartmentIds = currentDeptResponse.code === 200 && currentDeptResponse.data
          ? currentDeptResponse.data.map((dept: any) => dept.id)
          : []
        
        const newDepartmentIds = departmentIds || []
        const currentDeptSet = new Set(currentDepartmentIds.map((id: any) => String(id)))
        const newDeptSet = new Set(newDepartmentIds.map((id: any) => String(id)))
        
        // 找出需要添加的部门
        const toAdd = newDepartmentIds.filter((id: any) => !currentDeptSet.has(String(id)))
        // 找出需要移除的部门
        const toRemove = currentDepartmentIds.filter((id: any) => !newDeptSet.has(String(id)))
        
        // 添加新部门
        for (const deptId of toAdd) {
          try {
            await addDepartmentMember(String(deptId), {
              memberId: String(currentMemberId.value)
            })
          } catch (error: any) {
            // 如果成员已在部门中，忽略错误
            if (!error.message?.includes('已在部门中')) {
              console.error(`添加部门 ${deptId} 失败:`, error)
            }
          }
        }
        
        // 移除旧部门
        for (const deptId of toRemove) {
          try {
            await removeDepartmentMember(String(deptId), String(currentMemberId.value))
          } catch (error) {
            console.error(`移除部门 ${deptId} 失败:`, error)
          }
        }
      }
      
      ElMessage.success('更新成员成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: Member) => {
  try {
    const currentStatus = row.user?.status || 'active'
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    await memberApi.updateStatus(row.user?.id || row.userId, newStatus)
    ElMessage.success(`${currentStatus === 'active' ? '禁用' : '启用'}成员成功`)
    loadData()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const handleDelete = async (row: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除成员 "${row.user?.username}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await memberApi.delete(row.user?.id || row.userId)
    ElMessage.success('删除成员成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除成员失败:', error)
    }
  }
}

const handleSelectionChange = (selection: Member[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个成员吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const deletePromises = selectedRows.value.map(row => 
      memberApi.delete(row.user?.id || row.userId)
    )
    await Promise.all(deletePromises)
    ElMessage.success('批量删除成员成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除成员失败:', error)
    }
  }
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusType = (status?: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'danger'
    case 'suspended':
      return 'warning'
    default:
      return 'info'
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'active':
      return '启用'
    case 'inactive':
      return '禁用'
    case 'suspended':
      return '暂停'
    default:
      return '未知'
  }
}

// 导入相关方法
const handleImport = () => {
  importDialogVisible.value = true
  importPreview.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 下载导入模板
const downloadTemplate = () => {
  const templateData = [
    {
      姓名: '张三',
      手机: '13800138000',
      邮箱: 'zhangsan@example.com',
      公司: '子公司A',
      部门: '销售部/华东区',
      角色: '销售经理、区域经理',
      是否部门负责人: '是'
    },
    {
      姓名: '李四',
      手机: '13800138001',
      邮箱: 'lisi@example.com',
      公司: '',
      部门: '技术部',
      角色: '开发工程师',
      是否部门负责人: '否'
    }
  ]

  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '成员导入模板')
  XLSX.writeFile(wb, '成员导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

// 处理文件选择
const handleFileChange = async (file: any) => {
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)

        // 验证和转换数据
        const preview: typeof importPreview.value = []
        const phoneSet = new Set<string>() // 用于检查手机号重复

        for (let index = 0; index < jsonData.length; index++) {
          const row = jsonData[index] as any
          const item: any = {
            username: row['姓名'] || row['username'] || '',
            phone: row['手机'] || row['phone'] || '',
            email: row['邮箱'] || row['email'] || '',
            company: row['公司'] || row['公司/租户'] || row['company'] || row['tenant'] || '',
            department: row['部门'] || row['department'] || '',
            role: row['角色'] || row['role'] || '',
            isManager: row['是否部门负责人'] || row['isManager'] || ''
          }

          const errors: string[] = []

          // 验证必填字段
          if (!item.username || !item.phone) {
            errors.push('姓名和手机为必填项')
          } else {
            // 验证手机号格式
            if (!/^1[3-9]\d{9}$/.test(item.phone)) {
              errors.push('手机号格式不正确')
            } else {
              // 检查手机号重复
              if (phoneSet.has(item.phone)) {
                errors.push('手机号重复')
              } else {
                phoneSet.add(item.phone)
              }
            }
          }

          // 验证邮箱格式
          if (item.email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(item.email)) {
            errors.push('邮箱格式不正确')
          }

          // 验证是否部门负责人字段
          if (item.isManager && item.isManager.trim()) {
            const isManagerValue = item.isManager.trim()
            if (isManagerValue !== '是' && isManagerValue !== '否' && isManagerValue !== 'Y' && isManagerValue !== 'N' && isManagerValue !== 'y' && isManagerValue !== 'n') {
              errors.push('是否部门负责人只能填写"是"或"否"')
            }
          }

          // 如果有错误，设置错误信息
          if (errors.length > 0) {
            item.error = errors.join('; ')
          }

          preview.push(item)
        }

        if (preview.length === 0) {
          ElMessage.warning('Excel文件中没有数据')
          return
        }

        importPreview.value = preview
        ElMessage.success(`成功解析 ${preview.length} 条数据`)
      } catch (error) {
        console.error('解析Excel失败:', error)
        ElMessage.error('解析Excel文件失败，请检查文件格式')
      }
    }
    reader.readAsArrayBuffer(file.raw)
  } catch (error) {
    console.error('读取文件失败:', error)
    ElMessage.error('读取文件失败')
  }
}

// 获取或创建租户
const getOrCreateTenant = async (tenantName: string): Promise<string | number | null> => {
  if (!tenantName || !tenantName.trim()) {
    // 如果没有指定租户，返回当前租户ID
    return authStore.currentTenant?.id || null
  }

  const trimmedName = tenantName.trim()
  const currentTenantId = authStore.currentTenant?.id

  try {
    // 1. 先查找是否存在同名租户（在当前租户的子租户中）
    const tenantListResponse = await tenantApi.getList({ search: trimmedName, limit: 100 })
    if (tenantListResponse.code === 200 && tenantListResponse.data.tenants) {
      // 查找当前租户的子租户中是否有同名租户
      const childTenant = tenantListResponse.data.tenants.find(
        (t: any) => t.name === trimmedName && t.parentId === currentTenantId
      )
      if (childTenant) {
        return childTenant.id
      }
    }

    // 2. 如果不存在且有权限，创建新租户（作为当前租户的子租户）
    if (currentTenantId) {
      const createResponse = await tenantApi.create({
        name: trimmedName,
        parentId: currentTenantId,
        description: `通过成员导入自动创建`
      })
      if (createResponse.code === 201 || createResponse.code === 200) {
        return createResponse.data.id
      }
    }
  } catch (error: any) {
    // 如果是因为租户已存在而失败，重新查找
    if (error.message && (error.message.includes('已存在') || error.message.includes('重复'))) {
      const tenantListResponse = await tenantApi.getList({ search: trimmedName, limit: 100 })
      if (tenantListResponse.code === 200 && tenantListResponse.data.tenants) {
        const childTenant = tenantListResponse.data.tenants.find(
          (t: any) => t.name === trimmedName && t.parentId === currentTenantId
        )
        if (childTenant) {
          return childTenant.id
        }
      }
    }
    console.error(`创建租户 "${tenantName}" 失败:`, error)
    throw error
  }

  return null
}

// 获取或创建部门（支持层级关系，支持指定租户）
const getOrCreateDepartment = async (departmentPath: string, targetTenantId?: string | number): Promise<string | null> => {
  if (!departmentPath || !departmentPath.trim()) {
    return null
  }

  const parts = departmentPath.split('/').map(p => p.trim()).filter(p => p)
  if (parts.length === 0) {
    return null
  }

  // 加载部门树（如果还没有加载）
  if (departmentMap.value.size === 0) {
    try {
      const response = await getDepartmentTree()
      if (response.code === 200 && response.data) {
        const buildMap = (nodes: any[], parentId: string | null = null) => {
          for (const node of nodes) {
            const key = parentId ? `${parentId}/${node.name}` : node.name
            departmentMap.value.set(key, node)
            if (node.children && node.children.length > 0) {
              buildMap(node.children, key)
            }
          }
        }
        buildMap(response.data)
      }
    } catch (error) {
      console.error('加载部门树失败:', error)
    }
  }

  let currentParentId: string | null = null
  let currentPath = ''

  // 查找部门的辅助函数
  const findDepartmentInTree = (nodes: any[], targetName: string, parentId: string | null): any => {
    for (const node of nodes) {
      if (node.name === targetName && String(node.parentId || '') === String(parentId || '')) {
        return node
      }
      if (node.children && node.children.length > 0) {
        const found = findDepartmentInTree(node.children, targetName, parentId)
        if (found) return found
      }
    }
    return null
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    currentPath = currentParentId ? `${currentParentId}/${part}` : part

    // 先检查缓存中是否已存在
    let department = departmentMap.value.get(currentPath)
    
    // 如果缓存中没有，尝试从部门树中查找
    if (!department) {
      const treeResponse = await getDepartmentTree()
      if (treeResponse.code === 200 && treeResponse.data) {
        // 更新缓存
        const buildMap = (nodes: any[], parentId: string | null = null) => {
          for (const node of nodes) {
            const key = parentId ? `${parentId}/${node.name}` : node.name
            departmentMap.value.set(key, node)
            if (node.children && node.children.length > 0) {
              buildMap(node.children, key)
            }
          }
        }
        buildMap(treeResponse.data)
        
        // 再次从缓存中查找
        department = departmentMap.value.get(currentPath)
      }
    }

    // 如果仍然找不到，尝试创建部门
    if (!department) {
      try {
        const createData: any = {
          name: part,
          parentId: currentParentId || undefined
        }
        const response = await createDepartment(createData)
        if (response.code === 200 || response.code === 201) {
          department = response.data
          departmentMap.value.set(currentPath, department)
        } else {
          throw new Error(response.message || '创建部门失败')
        }
      } catch (error: any) {
        // 如果是因为部门已存在而失败，重新加载部门树并查找
        if (error.message && (error.message.includes('已存在') || error.message.includes('重复'))) {
          const treeResponse = await getDepartmentTree()
          if (treeResponse.code === 200 && treeResponse.data) {
            // 更新缓存
            const buildMap = (nodes: any[], parentId: string | null = null) => {
              for (const node of nodes) {
                const key = parentId ? `${parentId}/${node.name}` : node.name
                departmentMap.value.set(key, node)
                if (node.children && node.children.length > 0) {
                  buildMap(node.children, key)
                }
              }
            }
            buildMap(treeResponse.data)
            
            // 从缓存中查找
            department = departmentMap.value.get(currentPath)
          }
        }
        
        // 如果仍然找不到，抛出错误
        if (!department) {
          throw new Error(`创建或查找部门 "${part}" 失败: ${error.message}`)
        }
      }
    }

    if (!department) {
      throw new Error(`创建部门 "${part}" 失败`)
    }

    currentParentId = String(department.id)
  }

  return currentParentId
}

// 获取或创建角色
const getOrCreateRole = async (roleName: string): Promise<string | null> => {
  if (!roleName || !roleName.trim()) {
    return null
  }

  try {
    // 先尝试查找角色
    const response = await roleApi.getList({ search: roleName.trim(), limit: 100 })
    if (response.code === 200 && response.data.roles) {
      const existingRole = response.data.roles.find((r: any) => r.name === roleName.trim())
      if (existingRole) {
        return String(existingRole.id)
      }
    }

    // 角色不存在，创建新角色
    const createData: CreateRoleDto = {
      name: roleName.trim(),
      description: `通过导入自动创建`,
      isActive: true
    }
    const createResponse = await roleApi.create(createData)
    if (createResponse.code === 200 || createResponse.code === 201) {
      return String(createResponse.data.id)
    }
  } catch (error: any) {
    // 如果是因为角色已存在而失败，尝试再次查找
    if (error.message && error.message.includes('已存在')) {
      const response = await roleApi.getList({ search: roleName.trim(), limit: 100 })
      if (response.code === 200 && response.data.roles) {
        const existingRole = response.data.roles.find((r: any) => r.name === roleName.trim())
        if (existingRole) {
          return String(existingRole.id)
        }
      }
    }
    console.error(`创建角色 "${roleName}" 失败:`, error)
    throw error
  }

  return null
}

// 提交导入
const handleImportSubmit = async () => {
  if (importPreview.value.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  if (importPreview.value.some(row => row.error)) {
    ElMessage.warning('请先修复错误数据')
    return
  }

  try {
    importLoading.value = true

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const item of importPreview.value) {
      try {
        // 1. 处理部门
        let departmentId: string | null = null
        if (item.department) {
          departmentId = await getOrCreateDepartment(item.department)
        }

        // 2. 处理角色
        const roleIds: string[] = []
        if (item.role) {
          const roleNames = item.role.split('、').map(r => r.trim()).filter(r => r)
          for (const roleName of roleNames) {
            const roleId = await getOrCreateRole(roleName)
            if (roleId) {
              roleIds.push(roleId)
            }
          }
        }

        // 1. 处理租户（如果指定了公司/租户）
        let targetTenantId: string | number = authStore.currentTenant?.id || ''
        if (item.company && item.company.trim()) {
          const tenantId = await getOrCreateTenant(item.company.trim())
          if (tenantId) {
            targetTenantId = tenantId
            item.tenantId = tenantId
          } else {
            throw new Error(`无法创建或找到租户: ${item.company}`)
          }
        }

        // 2. 处理部门（在指定租户下）
        let departmentId: string | null = null
        if (item.department) {
          departmentId = await getOrCreateDepartment(item.department, targetTenantId)
        }

        // 3. 创建用户和成员（不指定部门，稍后通过addDepartmentMember添加）
        const createUserData: CreateUserDto = {
          username: item.username,
          phone: item.phone,
          email: item.email || undefined,
          tenantId: String(targetTenantId),
          // 不在这里指定部门，稍后通过addDepartmentMember添加以支持isManager
          departmentId: undefined,
          roleIds: roleIds.length > 0 ? roleIds : undefined
        }

        const createUserResponse = await userApi.create(createUserData)
        
        // 4. 如果指定了部门，通过addDepartmentMember接口添加，并设置isManager
        if (departmentId && createUserResponse.data?.member?.id) {
          // 解析是否部门负责人字段
          const isManagerValue = item.isManager?.trim() || ''
          const isManager = isManagerValue === '是' || isManagerValue === 'Y' || isManagerValue === 'y'
          
          await addDepartmentMember(departmentId, {
            memberId: String(createUserResponse.data.member.id),
            isManager: isManager
          })
        } else if (departmentId) {
          // 如果没有member信息，尝试通过userId查找member
          const userMembersResponse = await userApi.getMembers(String(createUserResponse.data.id))
          if (userMembersResponse.code === 200 && userMembersResponse.data && userMembersResponse.data.length > 0) {
            const member = userMembersResponse.data[0]
            const isManagerValue = item.isManager?.trim() || ''
            const isManager = isManagerValue === '是' || isManagerValue === 'Y' || isManagerValue === 'y'
            
            await addDepartmentMember(departmentId, {
              memberId: String(member.id),
              isManager: isManager
            })
          }
        }
        
        successCount++
      } catch (error: any) {
        failCount++
        const errorMsg = error.response?.data?.message || error.message || '导入失败'
        errors.push(`${item.username}(${item.phone}): ${errorMsg}`)
        console.error(`导入成员失败:`, error)
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功导入 ${successCount} 条数据${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)
      if (errors.length > 0) {
        console.error('导入错误详情:', errors)
      }
      importDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(`导入失败，所有数据都无法导入`)
      if (errors.length > 0) {
        ElMessage.error(errors.join('\n'))
      }
    }
  } catch (error) {
    console.error('导入过程出错:', error)
    ElMessage.error('导入过程出错')
  } finally {
    importLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadData()
  loadDepartmentTree()
  loadRoleOptions()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.member-management {
  @extend .table-page;
}

.import-dialog-content {
  .import-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .import-preview {
    margin-top: 20px;

    h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
    }
  }
}
</style>


