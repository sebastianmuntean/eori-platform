import { pgEnum } from 'drizzle-orm/pg-core';

// Document type enum: incoming, outgoing, internal
// Shared across general_register and document_registry
export const documentTypeEnum = pgEnum('document_type', ['incoming', 'outgoing', 'internal']);

// Document status enum for general_register: draft, registered, in_work, distributed, resolved, archived, cancelled
// Note: This is the more complete version used by general_register
// document_registry uses a subset of these values
export const documentStatusEnum = pgEnum('document_status', ['draft', 'registered', 'in_work', 'distributed', 'resolved', 'archived', 'cancelled']);

// Document priority enum: low, normal, high, urgent
// Used by document_registry
export const documentPriorityEnum = pgEnum('document_priority', ['low', 'normal', 'high', 'urgent']);

// Connection type enum: related, response, attachment, amendment
// Used by document_connections
export const connectionTypeEnum = pgEnum('connection_type', ['related', 'response', 'attachment', 'amendment']);

// Workflow action enum: sent, received, resolved, returned, approved, rejected
// Used by document_workflow
export const workflowActionEnum = pgEnum('workflow_action', ['sent', 'received', 'resolved', 'returned', 'approved', 'rejected']);

// General register workflow action enum: sent, forwarded, returned, approved, rejected, cancelled
// Used by general_register_workflow
export const generalRegisterWorkflowActionEnum = pgEnum('general_register_workflow_action', ['sent', 'forwarded', 'returned', 'approved', 'rejected', 'cancelled']);

// Step status enum: pending, completed
// Used by general_register_workflow
export const generalRegisterStepStatusEnum = pgEnum('general_register_step_status', ['pending', 'completed']);

// Resolution status enum: approved, rejected
// Used by general_register_workflow
export const generalRegisterResolutionStatusEnum = pgEnum('general_register_resolution_status', ['approved', 'rejected']);

