import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import {
  handleApiRoute,
  createErrorResponse,
} from '@/lib/api-utils/error-handling';
import { parsePaginationParams } from '@/lib/api-utils/pagination';
import {
  listGeneralRegisterDocuments,
  createGeneralRegisterDocument,
  type DocumentType,
  type DocumentStatus,
} from '@/lib/services/general-register-service';
import { z } from 'zod';

const createDocumentSchema = z.object({
  registerConfigurationId: z.string().uuid('Invalid register configuration ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  subject: z.string().min(1, 'Subject is required').max(500),
  from: z.string().max(255).optional().nullable(),
  petitionerClientId: z.string().uuid().optional().nullable(),
  to: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
  status: z
    .enum(['draft', 'in_work', 'distributed', 'resolved', 'cancelled'])
    .optional()
    .default('draft'),
});

/**
 * GET /api/registry/general-register - List documents
 */
export async function GET(request: Request) {
  return handleApiRoute(
    async () => {
      await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

      const { searchParams } = new URL(request.url);
      const registerConfigId = searchParams.get('registerConfigurationId');

      if (!registerConfigId) {
        return createErrorResponse('registerConfigurationId is required', 400);
      }

      const yearParam = searchParams.get('year');
      const documentTypeParam = searchParams.get('documentType');
      const statusParam = searchParams.get('status');
      const search = searchParams.get('search') || undefined;

      const validTypes = ['incoming', 'outgoing', 'internal'] as const;
      const validStatuses = [
        'draft',
        'in_work',
        'distributed',
        'resolved',
        'cancelled',
      ] as const;

      const documentType =
        documentTypeParam &&
        (validTypes as readonly string[]).includes(documentTypeParam)
          ? (documentTypeParam as DocumentType)
          : undefined;

      const status =
        statusParam && (validStatuses as readonly string[]).includes(statusParam)
          ? (statusParam as DocumentStatus)
          : undefined;

      // Default pageSize 20 when neither limit nor pageSize is provided (preserves prior API default)
      if (!searchParams.has('limit') && !searchParams.has('pageSize')) {
        searchParams.set('pageSize', '20');
      }
      const { page, pageSize } = parsePaginationParams(searchParams);

      const result = await listGeneralRegisterDocuments(
        {
          registerConfigurationId: registerConfigId,
          year: yearParam ? parseInt(yearParam) : undefined,
          documentType,
          status,
          search,
        },
        { page, pageSize }
      );

      return NextResponse.json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    },
    { endpoint: '/api/registry/general-register', method: 'GET' }
  );
}

/**
 * POST /api/registry/general-register - Create new document
 */
export async function POST(request: Request) {
  return handleApiRoute(
    async () => {
      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_CREATE);

      const body = await request.json();
      const validation = createDocumentSchema.safeParse(body);

      if (!validation.success) {
        return createErrorResponse(validation.error.errors[0].message, 400);
      }

      const newDocument = await createGeneralRegisterDocument(validation.data, userId);

      return NextResponse.json(
        { success: true, data: newDocument },
        { status: 201 }
      );
    },
    { endpoint: '/api/registry/general-register', method: 'POST' }
  );
}
