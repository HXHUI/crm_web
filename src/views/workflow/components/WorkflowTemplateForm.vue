<template>
  <el-dialog
    v-model="dialogVisible"
    :title="template ? '编辑审批流模板' : '新增审批流模板'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模板名称" />
      </el-form-item>

      <el-form-item label="业务类型" prop="businessType">
        <el-select v-model="formData.businessType" placeholder="请选择业务类型" style="width: 100%">
          <el-option label="报价" value="quote" />
          <el-option label="合同" value="contract" />
          <el-option label="订单" value="order" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </el-form-item>

      <el-form-item label="是否启用" prop="isActive">
        <el-switch v-model="formData.isActive" />
      </el-form-item>

      <el-form-item label="审批节点" prop="nodes">
        <div class="nodes-section">
          <div
            v-for="(node, index) in formData.nodes"
            :key="index"
            class="node-item"
          >
            <div class="node-header">
              <span class="node-order">节点 {{ index + 1 }}</span>
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="removeNode(index)"
                :disabled="formData.nodes.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-form
              :model="node"
              label-width="100px"
              class="node-form"
            >
              <el-form-item label="节点名称" :rules="[{ required: true, message: '请输入节点名称' }]">
                <el-input v-model="node.name" placeholder="请输入节点名称" />
              </el-form-item>

              <el-form-item label="节点类型" :rules="[{ required: true, message: '请选择节点类型' }]">
                <el-select
                  v-model="node.nodeType"
                  placeholder="请选择节点类型"
                  style="width: 100%"
                  @change="(val: string) => handleNodeTypeChange(node, val)"
                >
                  <el-option label="固定成员" value="fixed_member" />
                  <el-option label="角色" value="role" />
                  <el-option label="部门负责人" value="department_manager" />
                </el-select>
              </el-form-item>

              <el-form-item label="审批方式" :rules="[{ required: true, message: '请选择审批方式' }]">
                <el-select v-model="node.approvalMode" placeholder="请选择审批方式" style="width: 100%">
                  <el-option label="串行审批" value="sequential" />
                  <el-option label="并行审批（会签）" value="parallel" />
                </el-select>
              </el-form-item>

              <!-- 审批人配置 -->
              <el-form-item label="审批人配置">
                <div v-if="node.nodeType === 'fixed_member'">
                  <el-select
                    v-model="node.approverConfig.memberIds"
                    multiple
                    placeholder="请选择审批人"
                    style="width: 100%"
                    filterable
                    :loading="loadingData"
                  >
                    <el-option
                      v-for="member in memberList"
                      :key="member.id"
                      :label="member.name"
                      :value="Number(member.id)"
                    />
                  </el-select>
                </div>

                <div v-else-if="node.nodeType === 'role'">
                  <el-select
                    v-model="node.approverConfig.roleIds"
                    multiple
                    placeholder="请选择角色"
                    style="width: 100%"
                    filterable
                    :loading="loadingData"
                  >
                    <el-option
                      v-for="role in roleList"
                      :key="role.id"
                      :label="role.name"
                      :value="Number(role.id)"
                    />
                  </el-select>
                </div>

                <div v-else-if="node.nodeType === 'department_manager'">
                  <el-select
                    v-model="node.approverConfig.departmentIds"
                    multiple
                    placeholder="请选择部门"
                    style="width: 100%"
                    filterable
                    :loading="loadingData"
                  >
                    <el-option
                      v-for="dept in departmentList"
                      :key="dept.id"
                      :label="dept.name"
                      :value="Number(dept.id)"
                    />
                  </el-select>
                  <el-checkbox
                    v-model="node.approverConfig.includeParent"
                    style="margin-top: 10px"
                  >
                    包含上级部门负责人
                  </el-checkbox>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <el-button
            type="primary"
            :icon="Plus"
            @click="addNode"
            style="width: 100%; margin-top: 10px"
          >
            添加节点
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import {
  createWorkflowTemplate,
  updateWorkflowTemplate,
  type WorkflowTemplate,
  type CreateWorkflowTemplateDto,
} from '@/api/workflow'
import { roleApi } from '@/api/role'
import { getDepartmentTree } from '@/api/department'
import request from '@/utils/request'

interface Props {
  modelValue: boolean
  template?: WorkflowTemplate | null
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const formRef = ref()
const submitLoading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 表单数据
const formData = reactive<CreateWorkflowTemplateDto>({
  name: '',
  description: '',
  businessType: 'quote',
  isActive: true,
  nodes: [
    {
      name: '',
      nodeType: 'fixed_member',
      approvalMode: 'sequential',
      approverConfig: { memberIds: [] },
      nodeOrder: 1,
    },
  ],
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  nodes: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('至少需要一个审批节点'))
        } else {
          // 验证每个节点
          for (let i = 0; i < value.length; i++) {
            const node = value[i]
            if (!node.name) {
              callback(new Error(`节点 ${i + 1} 的名称不能为空`))
              return
            }
            if (!node.nodeType) {
              callback(new Error(`节点 ${i + 1} 的类型不能为空`))
              return
            }
            // 验证审批人配置
            if (node.nodeType === 'fixed_member' && (!node.approverConfig.memberIds || node.approverConfig.memberIds.length === 0)) {
              callback(new Error(`节点 ${i + 1} 的审批人不能为空`))
              return
            }
            if (node.nodeType === 'role' && (!node.approverConfig.roleIds || node.approverConfig.roleIds.length === 0)) {
              callback(new Error(`节点 ${i + 1} 的角色不能为空`))
              return
            }
            if (node.nodeType === 'department_manager' && (!node.approverConfig.departmentIds || node.approverConfig.departmentIds.length === 0)) {
              callback(new Error(`节点 ${i + 1} 的部门不能为空`))
              return
            }
          }
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 成员、角色、部门列表
const memberList = ref<any[]>([])
const roleList = ref<any[]>([])
const departmentList = ref<any[]>([])
const loadingData = ref(false)


// 监听模板变化，填充表单
watch(
  () => props.template,
  (template) => {
    if (template) {
      formData.name = template.name
      formData.description = template.description || ''
      formData.businessType = template.businessType
      formData.isActive = template.isActive
      if (template.nodes) {
        formData.nodes = template.nodes.map((node, index) => {
          // 确保 approverConfig 格式正确
          let approverConfig: any = {}
          if (node.nodeType === 'fixed_member') {
            approverConfig = {
              memberIds: node.approverConfig?.memberIds || []
            }
          } else if (node.nodeType === 'role') {
            approverConfig = {
              roleIds: node.approverConfig?.roleIds || []
            }
          } else if (node.nodeType === 'department_manager') {
            approverConfig = {
              departmentIds: node.approverConfig?.departmentIds || [],
              includeParent: node.approverConfig?.includeParent || false
            }
          } else {
            approverConfig = { ...node.approverConfig }
          }

          return {
            name: node.name,
            nodeType: node.nodeType,
            approvalMode: node.approvalMode,
            approverConfig,
            nodeOrder: index + 1,
          }
        })
      }
    } else {
      // 重置表单
      formData.name = ''
      formData.description = ''
      formData.businessType = 'quote'
      formData.isActive = true
      formData.nodes = [
        {
          name: '',
          nodeType: 'fixed_member',
          approvalMode: 'sequential',
          approverConfig: { memberIds: [] },
          nodeOrder: 1,
        },
      ]
    }
  },
  { immediate: true }
)

// 添加节点
const addNode = () => {
  formData.nodes.push({
    name: '',
    nodeType: 'fixed_member',
    approvalMode: 'sequential',
    approverConfig: { memberIds: [] },
    nodeOrder: formData.nodes.length + 1,
  })
}

// 处理节点类型变化
const handleNodeTypeChange = (node: any, nodeType: string) => {
  // 根据节点类型初始化审批人配置
  if (nodeType === 'fixed_member') {
    node.approverConfig = { memberIds: [] }
  } else if (nodeType === 'role') {
    node.approverConfig = { roleIds: [] }
  } else if (nodeType === 'department_manager') {
    node.approverConfig = { departmentIds: [], includeParent: false }
  }
}

// 删除节点
const removeNode = (index: number) => {
  formData.nodes.splice(index, 1)
  // 更新节点顺序
  formData.nodes.forEach((node, i) => {
    node.nodeOrder = i + 1
  })
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      submitLoading.value = true

      // 确保节点顺序正确，并确保 approverConfig 格式正确
      const submitData = {
        ...formData,
        nodes: formData.nodes.map((node, index) => {
          // 确保 approverConfig 是对象格式
          let approverConfig: any = {}
          if (node.nodeType === 'fixed_member') {
            approverConfig = {
              memberIds: Array.isArray(node.approverConfig?.memberIds)
                ? node.approverConfig.memberIds
                : (node.approverConfig?.memberIds ? [node.approverConfig.memberIds] : [])
            }
          } else if (node.nodeType === 'role') {
            approverConfig = {
              roleIds: Array.isArray(node.approverConfig?.roleIds)
                ? node.approverConfig.roleIds
                : (node.approverConfig?.roleIds ? [node.approverConfig.roleIds] : [])
            }
          } else if (node.nodeType === 'department_manager') {
            approverConfig = {
              departmentIds: Array.isArray(node.approverConfig?.departmentIds)
                ? node.approverConfig.departmentIds
                : (node.approverConfig?.departmentIds ? [node.approverConfig.departmentIds] : []),
              includeParent: node.approverConfig?.includeParent || false
            }
          } else {
            approverConfig = node.approverConfig || {}
          }

          return {
            name: node.name,
            nodeType: node.nodeType,
            approvalMode: node.approvalMode,
            approverConfig,
            nodeOrder: index + 1,
          }
        })
      }

      console.log('提交的审批流模板数据:', JSON.stringify(submitData, null, 2))

      if (props.template) {
        // 更新
        const response: any = await updateWorkflowTemplate(props.template.id, submitData)
        if (response.code === 200) {
          ElMessage.success('更新成功')
          emit('success')
        }
      } else {
        // 创建
        const response: any = await createWorkflowTemplate(submitData)
        if (response.code === 201) {
          ElMessage.success('创建成功')
          emit('success')
        }
      }
    } catch (error: any) {
      console.error('保存失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '保存失败'
      ElMessage.error(Array.isArray(errorMessage) ? errorMessage.join('; ') : errorMessage)
    } finally {
      submitLoading.value = false
    }
  })
}

// 关闭
const handleClose = () => {
  dialogVisible.value = false
}

// 加载成员、角色、部门列表
const loadOptionsData = async () => {
  try {
    loadingData.value = true

    // 加载成员列表（使用 /tenants/members 端点获取当前租户成员）
    try {
      const response: any = await request.get('/tenants/members', {
        params: { page: 1, limit: 1000 }
      })
      if (response && response.code === 200 && response.data) {
        const members = response.data.members || response.data.items || []
        memberList.value = members.map((member: any) => ({
          id: member.id,
          name: member.user?.username || member.nickname || member.user?.realName || `成员${member.id}`,
          ...member
        }))
      } else {
        throw new Error(response?.message || '获取成员列表失败')
      }
    } catch (error: any) {
      console.error('加载成员列表失败:', error)
      const errorMessage = error?.response?.data?.message || error?.message || '加载成员列表失败'
      ElMessage.error(errorMessage)
      // 即使成员列表加载失败，也继续加载其他数据
    }

    // 加载角色列表
    try {
      const rolesResponse = await roleApi.getList({ page: 1, limit: 1000, isActive: true })
      if (rolesResponse.code === 200 && rolesResponse.data) {
        roleList.value = rolesResponse.data.roles || []
      }
    } catch (error: any) {
      console.error('加载角色列表失败:', error)
    }

    // 加载部门列表（树形结构，需要扁平化）
    try {
      const deptResponse = await getDepartmentTree()
      if (deptResponse.code === 200 && deptResponse.data) {
        const flattenDepartments = (depts: any[]): any[] => {
          const result: any[] = []
          depts.forEach((dept: any) => {
            // 跳过租户根节点
            if (dept.type === 'company' || dept.isTenant) {
              if (dept.children && dept.children.length > 0) {
                result.push(...flattenDepartments(dept.children))
              }
            } else {
              result.push({
                id: dept.id,
                name: dept.name,
                ...dept
              })
              if (dept.children && dept.children.length > 0) {
                result.push(...flattenDepartments(dept.children))
              }
            }
          })
          return result
        }
        departmentList.value = flattenDepartments(deptResponse.data)
      }
    } catch (error: any) {
      console.error('加载部门列表失败:', error)
    }
  } catch (error: any) {
    console.error('加载选项数据失败:', error)
    ElMessage.error('加载选项数据失败: ' + (error.message || '未知错误'))
  } finally {
    loadingData.value = false
  }
}

onMounted(() => {
  loadOptionsData()
})
</script>


<style scoped lang="scss">
.nodes-section {
  .node-item {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f5f7fa;

    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dcdfe6;

      .node-order {
        font-weight: bold;
        color: #409eff;
      }
    }

    .node-form {
      background: white;
      padding: 15px;
      border-radius: 4px;
    }
  }
}
</style>

