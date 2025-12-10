import request from '@/utils/request';

// 审批流模板相关接口
export interface WorkflowTemplate {
  id: number;
  name: string;
  description?: string;
  businessType: 'quote' | 'contract' | 'order';
  isActive: boolean;
  version: number;
  tenantId: number;
  nodes?: WorkflowNode[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: number;
  name: string;
  nodeOrder: number;
  nodeType: 'fixed_member' | 'role' | 'department_manager';
  approvalMode: 'sequential' | 'parallel';
  approverConfig: Record<string, any>;
  templateId: number;
}

export interface CreateWorkflowTemplateDto {
  name: string;
  description?: string;
  businessType: 'quote' | 'contract' | 'order';
  isActive?: boolean;
  nodes: CreateWorkflowNodeDto[];
}

export interface CreateWorkflowNodeDto {
  name: string;
  nodeType: 'fixed_member' | 'role' | 'department_manager';
  approvalMode: 'sequential' | 'parallel';
  approverConfig: Record<string, any>;
  nodeOrder?: number;
}

// 审批实例相关接口
export interface WorkflowInstance {
  id: number;
  businessType: 'quote' | 'contract' | 'order';
  businessId: number;
  templateId: number;
  template?: WorkflowTemplate;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'returned';
  currentNodeId?: number;
  currentNodeOrder?: number;
  initiatorId: number;
  initiator?: any;
  submitComment?: string;
  completedAt?: string;
  tenantId: number;
  records?: WorkflowRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRecord {
  id: number;
  instanceId: number;
  nodeId?: number;
  node?: WorkflowNode;
  nodeOrder?: number;
  approverId: number;
  approver?: any;
  action: 'pending' | 'approve' | 'reject' | 'transfer' | 'add_sign' | 'return' | 'cancel';
  comment?: string;
  extraData?: Record<string, any>;
  actionTime: string;
  tenantId: number;
}

// 审批流模板API
export const createWorkflowTemplate = (data: CreateWorkflowTemplateDto) => {
  return request.post('/workflow/templates', data);
};

export const getWorkflowTemplates = (businessType?: string) => {
  return request.get('/workflow/templates', {
    params: { businessType },
  });
};

export const getWorkflowTemplateById = (id: number) => {
  return request.get(`/workflow/templates/${id}`);
};

export const updateWorkflowTemplate = (id: number, data: Partial<CreateWorkflowTemplateDto>) => {
  return request.patch(`/workflow/templates/${id}`, data);
};

export const deleteWorkflowTemplate = (id: number) => {
  return request.delete(`/workflow/templates/${id}`);
};

// 审批实例API
export const submitApproval = (data: {
  businessType: 'quote' | 'contract' | 'order';
  businessId: number;
  templateId: number;
  submitComment?: string;
}) => {
  return request.post('/workflow/instances/submit', data);
};

export const getMyPendingApprovals = (page = 1, limit = 20) => {
  return request.get('/workflow/instances', {
    params: { type: 'pending', page, limit },
  });
};

export const getMyApprovedList = (page = 1, limit = 20) => {
  return request.get('/workflow/instances', {
    params: { type: 'approved', page, limit },
  });
};

export const getWorkflowInstanceById = (id: number) => {
  return request.get(`/workflow/instances/${id}`);
};

// 审批操作API
export const approveWorkflow = (id: number, comment?: string) => {
  return request.post(`/workflow/instances/${id}/approve`, { comment });
};

export const rejectWorkflow = (id: number, comment?: string) => {
  return request.post(`/workflow/instances/${id}/reject`, { comment });
};

export const transferWorkflow = (id: number, data: { transferredTo: number; comment?: string }) => {
  return request.post(`/workflow/instances/${id}/transfer`, data);
};

export const addSignWorkflow = (id: number, data: { approverIds: number[]; comment?: string }) => {
  return request.post(`/workflow/instances/${id}/add-sign`, data);
};

export const returnWorkflow = (id: number, data: { returnToNodeOrder?: number; comment?: string }) => {
  return request.post(`/workflow/instances/${id}/return`, data);
};

// 业务对象审批API
export const submitQuoteApproval = (id: number, data: { templateId: number; submitComment?: string }) => {
  return request.post(`/quotes/${id}/submit-approval`, data);
};

export const getQuoteApprovalInstance = (id: number) => {
  return request.get(`/quotes/${id}/approval-instance`);
};

export const submitContractApproval = (id: number, data: { templateId: number; submitComment?: string }) => {
  return request.post(`/contracts/${id}/submit-approval`, data);
};

export const getContractApprovalInstance = (id: number) => {
  return request.get(`/contracts/${id}/approval-instance`);
};

export const submitOrderApproval = (id: number, data: { templateId: number; submitComment?: string }) => {
  return request.post(`/orders/${id}/submit-approval`, data);
};

export const getOrderApprovalInstance = (id: number) => {
  return request.get(`/orders/${id}/approval-instance`);
};

