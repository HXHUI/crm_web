<template>
  <div class="approval-flow">
    <div class="flow-content" v-if="instance">
      <el-timeline>
        <!-- 提交节点 -->
        <el-timeline-item
          :timestamp="formatDate(instance.createdAt)"
          placement="top"
          :type="'primary'"
          :icon="'Document'"
        >
          <div class="timeline-item-content">
            <div class="timeline-title">
              <span class="title-text">提交审批</span>
              <el-tag size="small" type="info">已提交</el-tag>
            </div>
            <div class="timeline-details">
              <div class="detail-row">
                <span class="detail-label">提交人：</span>
                <span class="detail-value">{{ instance.initiator?.user?.username || instance.initiator?.nickname || '未知' }}</span>
              </div>
              <div class="detail-row" v-if="instance.submitComment">
                <span class="detail-label">提交说明：</span>
                <span class="detail-value">{{ instance.submitComment }}</span>
              </div>
            </div>
          </div>
        </el-timeline-item>

        <!-- 审批节点 -->
        <el-timeline-item
          v-for="node in sortedNodes"
          :key="node.id"
          :timestamp="getNodeTimestamp(node)"
          placement="top"
          :type="getNodeTimelineType(node)"
          :icon="getNodeIcon(node)"
        >
          <div class="timeline-item-content">
            <div class="timeline-title">
              <span class="title-text">{{ node.name }}</span>
              <el-tag size="small" :type="getNodeModeTag(node.approvalMode)">
                {{ node.approvalMode === 'sequential' ? '串行' : '并行' }}
              </el-tag>
            </div>
            <div class="timeline-details">
              <!-- 已处理的审批记录 -->
              <div
                v-for="record in getNodeRecords(node.id)"
                :key="record.id"
                class="approval-record"
                :class="{
                  'record-approved': record.action === 'approve',
                  'record-rejected': record.action === 'reject',
                }"
              >
                <div class="detail-row">
                  <span class="detail-label">审核人：</span>
                  <span class="detail-value">{{ record.approver?.user?.username || record.approver?.nickname || '未知' }}</span>
                  <el-tag size="small" :type="getActionTag(record.action)" style="margin-left: 10px">
                    {{ getActionName(record.action) }}
                  </el-tag>
                </div>
                <div class="detail-row" v-if="record.actionTime">
                  <span class="detail-label">审核时间：</span>
                  <span class="detail-value">{{ formatDate(record.actionTime) }}</span>
                </div>
                <div class="detail-row" v-if="record.comment">
                  <span class="detail-label">审核意见：</span>
                  <span class="detail-value">{{ record.comment }}</span>
                </div>
                <div class="detail-row" v-if="record.extraData">
                  <span class="detail-label" v-if="record.action === 'transfer'">转办信息：</span>
                  <span class="detail-label" v-if="record.action === 'add_sign'">加签信息：</span>
                  <span class="detail-value">
                    <span v-if="record.action === 'transfer'">
                      转办给: {{ getMemberName(record.extraData.transferredTo) }}
                    </span>
                    <span v-if="record.action === 'add_sign'">
                      加签: {{ record.extraData.addedApprovers?.map((id: number) => getMemberName(id)).join(', ') }}
                    </span>
                  </span>
                </div>
              </div>
              <!-- 待审批的记录 -->
              <div
                v-for="record in getPendingRecords(node.id)"
                :key="record.id"
                class="approval-record record-pending"
              >
                <div class="detail-row">
                  <span class="detail-label">待审核人：</span>
                  <span class="detail-value">{{ record.approver?.user?.username || record.approver?.nickname || '未知' }}</span>
                  <el-tag size="small" type="warning" style="margin-left: 10px">待审批</el-tag>
                </div>
              </div>
              <!-- 无记录 -->
              <div v-if="getNodeRecords(node.id).length === 0 && getPendingRecords(node.id).length === 0" class="no-records">
                等待审批...
              </div>
            </div>
          </div>
        </el-timeline-item>

        <!-- 结束节点 -->
        <el-timeline-item
          v-if="isWorkflowEnded"
          :timestamp="instance?.completedAt ? formatDate(instance.completedAt) : ''"
          placement="top"
          :type="getEndTimelineType()"
          :icon="getEndIcon()"
        >
          <div class="timeline-item-content">
            <div class="timeline-title">
              <span class="title-text">审批结束</span>
              <el-tag size="small" :type="getStatusTag(instance?.status)">
                {{ getStatusName(instance?.status) }}
              </el-tag>
            </div>
            <div class="timeline-details">
              <div class="detail-row">
                <span class="detail-label">审批结果：</span>
                <span class="detail-value">审批流程{{ getStatusName(instance?.status) }}</span>
              </div>
              <div class="detail-row" v-if="instance?.completedAt">
                <span class="detail-label">完成时间：</span>
                <span class="detail-value">{{ formatDate(instance.completedAt) }}</span>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="flow-footer" v-if="instance">
      <div class="flow-info">
        <span>发起人: {{ instance.initiator?.user?.username || instance.initiator?.nickname || '未知' }}</span>
        <span>提交时间: {{ formatDate(instance.createdAt) }}</span>
        <span v-if="instance.completedAt">完成时间: {{ formatDate(instance.completedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleClose, Clock, Check, Close } from '@element-plus/icons-vue'
import type { WorkflowInstance, WorkflowNode, WorkflowRecord } from '@/api/workflow'

interface Props {
  instance?: WorkflowInstance | null
}

const props = withDefaults(defineProps<Props>(), {
  instance: null,
})

// 排序后的节点列表
const sortedNodes = computed(() => {
  if (!props.instance?.template?.nodes) return []
  return [...props.instance.template.nodes].sort((a, b) => a.nodeOrder - b.nodeOrder)
})

// 获取节点的审批记录（已处理的）
const getNodeRecords = (nodeId: number): WorkflowRecord[] => {
  if (!props.instance?.records) return []
  return props.instance.records.filter((r) => r.nodeId === nodeId && r.action !== 'pending')
}

// 获取节点的待审批记录
const getPendingRecords = (nodeId: number): WorkflowRecord[] => {
  if (!props.instance?.records) return []
  return props.instance.records.filter((r) => r.nodeId === nodeId && r.action === 'pending')
}

// 判断是否为当前节点
const isCurrentNode = (node: WorkflowNode): boolean => {
  return props.instance?.currentNodeId === node.id
}

// 判断节点是否已完成
const isNodeCompleted = (node: WorkflowNode): boolean => {
  if (!props.instance) return false
  const currentOrder = props.instance.currentNodeOrder || 0
  return node.nodeOrder < currentOrder
}

// 判断节点是否待审批
const isNodePending = (node: WorkflowNode): boolean => {
  return isCurrentNode(node) && props.instance?.status === 'pending'
}

// 判断审批流程是否已结束
const isWorkflowEnded = computed(() => {
  if (!props.instance) return false
  return props.instance.status !== 'pending'
})

// 获取状态标签
const getStatusTag = (status?: string) => {
  const tagMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    returned: 'info',
    cancelled: 'default',
  }
  return tagMap[status || ''] || 'default'
}

// 获取状态名称
const getStatusName = (status?: string) => {
  const nameMap: Record<string, string> = {
    pending: '审批中',
    approved: '已通过',
    rejected: '已拒绝',
    returned: '已退回',
    cancelled: '已取消',
  }
  return nameMap[status || ''] || status || '未知'
}

// 获取节点审批方式标签
const getNodeModeTag = (mode: string) => {
  return mode === 'sequential' ? 'primary' : 'success'
}

// 获取动作标签
const getActionTag = (action: string) => {
  const tagMap: Record<string, string> = {
    approve: 'success',
    reject: 'danger',
    pending: 'warning',
    transfer: 'info',
    add_sign: 'primary',
    return: 'warning',
  }
  return tagMap[action] || 'default'
}

// 获取动作名称
const getActionName = (action: string) => {
  const nameMap: Record<string, string> = {
    approve: '通过',
    reject: '拒绝',
    pending: '待审批',
    transfer: '转办',
    add_sign: '加签',
    return: '退回',
  }
  return nameMap[action] || action
}

// 获取成员名称
const getMemberName = (memberId: number): string => {
  // TODO: 从成员列表获取
  return `成员${memberId}`
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取节点的时间戳（取最早或最晚的审批记录时间）
const getNodeTimestamp = (node: WorkflowNode): string => {
  if (!props.instance?.records) return ''
  const records = props.instance.records.filter((r) => r.nodeId === node.id && r.actionTime)
  if (records.length === 0) return ''
  // 取最早的时间
  const times = records.map((r) => new Date(r.actionTime).getTime())
  const earliestTime = Math.min(...times)
  return formatDate(new Date(earliestTime).toISOString())
}

// 获取节点的时间线类型
const getNodeTimelineType = (node: WorkflowNode): string => {
  if (isNodePending(node)) return 'warning'
  if (isNodeCompleted(node)) {
    // 检查是否有拒绝的记录
    const records = getNodeRecords(node.id)
    if (records.some((r) => r.action === 'reject')) return 'danger'
    return 'success'
  }
  return 'primary'
}

// 获取节点图标
const getNodeIcon = (node: WorkflowNode) => {
  if (isNodePending(node)) return Clock
  if (isNodeCompleted(node)) {
    const records = getNodeRecords(node.id)
    if (records.some((r) => r.action === 'reject')) return Close
    return Check
  }
  return Clock
}

// 获取结束节点的时间线类型
const getEndTimelineType = (): string => {
  if (!props.instance) return 'success'
  if (props.instance.status === 'approved') return 'success'
  if (props.instance.status === 'rejected') return 'danger'
  return 'info'
}

// 获取结束节点图标
const getEndIcon = () => {
  if (!props.instance) return CircleCheck
  if (props.instance.status === 'approved') return CircleCheck
  if (props.instance.status === 'rejected') return CircleClose
  return CircleCheck
}
</script>

<style scoped lang="scss">
.approval-flow {
  background: white;
  border-radius: 4px;

  .flow-content {
    :deep(.el-timeline) {
      padding-left: 0;
    }

    :deep(.el-timeline-item__timestamp) {
      color: #909399;
      font-size: 13px;
      line-height: 1.5;
    }

    :deep(.el-timeline-item__tail) {
      border-left-style: dashed;
      border-left-color: #dcdfe6;
    }

    .timeline-item-content {
      background: #f5f7fa;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 10px;

      .timeline-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e4e7ed;

        .title-text {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }

      .timeline-details {
        .approval-record {
          padding: 12px;
          margin-bottom: 10px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #dcdfe6;

          &.record-approved {
            border-left-color: #67c23a;
          }

          &.record-rejected {
            border-left-color: #f56c6c;
          }

          &.record-pending {
            border-left-color: #e6a23c;
            background: #fef0e6;
          }

          &:last-child {
            margin-bottom: 0;
          }

          .detail-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.6;

            &:last-child {
              margin-bottom: 0;
            }

            .detail-label {
              color: #909399;
              min-width: 80px;
              flex-shrink: 0;
            }

            .detail-value {
              color: #606266;
              flex: 1;
              word-break: break-word;
            }
          }
        }

        .no-records {
          padding: 12px;
          color: #909399;
          font-size: 14px;
          text-align: center;
          background: white;
          border-radius: 4px;
        }
      }
    }
  }

  .flow-footer {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #dcdfe6;

    .flow-info {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>

