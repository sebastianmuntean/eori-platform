import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';

// Define available tables and columns for each module
const AVAILABLE_TABLES: Record<string, { name: string; columns: string[] }[]> = {
  registratura: [
    {
      name: 'document_registry',
      columns: [
        'subject',
        'content',
        'sender_name',
        'sender_doc_number',
        'sender_doc_date',
        'sender_partner_id',
        'recipient_name',
        'recipient_partner_id',
        'external_number',
        'external_date',
        'priority',
        'department_id',
        'assigned_to',
        'due_date',
        'registration_number',
        'registration_year',
        'registration_date',
        'document_type',
        'status',
        'file_index',
      ],
    },
    {
      name: 'document_attachments',
      columns: ['file_path', 'file_name', 'file_size', 'mime_type'],
    },
  ],
  general_register: [
    {
      name: 'general_register',
      columns: [
        'document_number',
        'year',
        'subject',
        'description',
        'from',
        'to',
        'date',
        'document_type',
        'status',
      ],
    },
  ],
  events: [
    {
      name: 'church_events',
      columns: [
        'type',
        'event_date',
        'location',
        'priest_name',
        'notes',
        'status',
      ],
    },
    {
      name: 'church_event_participants',
      columns: [
        'first_name',
        'last_name',
        'role',
        'birth_date',
        'cnp',
        'phone',
        'email',
      ],
    },
  ],
  partners: [
    {
      name: 'partners',
      columns: [
        'first_name',
        'last_name',
        'company_name',
        'type',
        'category',
        'cnp',
        'cui',
        'reg_com',
        'address',
        'city',
        'county',
        'postal_code',
        'phone',
        'email',
        'bank_name',
        'iban',
        'code',
      ],
    },
  ],
};

/**
 * GET /api/online-forms/mapping-datasets/available-tables - Get available tables and columns for a module
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetModule = searchParams.get('targetModule') as 'registratura' | 'general_register' | 'events' | 'partners' | null;

    if (!targetModule) {
      return NextResponse.json(
        { success: false, error: 'targetModule parameter is required' },
        { status: 400 }
      );
    }

    const tables = AVAILABLE_TABLES[targetModule] || [];

    return NextResponse.json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    logError('Error fetching available tables', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}




