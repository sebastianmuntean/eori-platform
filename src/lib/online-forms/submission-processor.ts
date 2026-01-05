import { db } from '@/database/client';
import { onlineFormSubmissions, onlineFormFieldMappings, onlineForms, documentRegistry } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Process a form submission and create records in target module
 */
export async function processSubmission(
  submissionId: string,
  processedBy: string
): Promise<{ success: boolean; targetRecordId?: string; error?: string }> {
  console.log(`Step 1: Processing submission ${submissionId}`);

  // Get submission
  const [submission] = await db
    .select()
    .from(onlineFormSubmissions)
    .where(eq(onlineFormSubmissions.id, submissionId))
    .limit(1);

  if (!submission) {
    return { success: false, error: 'Submission not found' };
  }

  if (submission.status === 'completed' || submission.status === 'processing') {
    return { success: false, error: 'Submission already processed or in progress' };
  }

  // Get form
  const [form] = await db
    .select()
    .from(onlineForms)
    .where(eq(onlineForms.id, submission.formId))
    .limit(1);

  if (!form) {
    return { success: false, error: 'Form not found' };
  }

  // Update status to processing
  await db
    .update(onlineFormSubmissions)
    .set({ status: 'processing' })
    .where(eq(onlineFormSubmissions.id, submissionId));

  try {
    // Get field mappings
    const mappings = await db
      .select()
      .from(onlineFormFieldMappings)
      .where(eq(onlineFormFieldMappings.formId, form.id));

    // Process based on target module
    let targetRecordId: string | undefined;

    if (form.targetModule === 'registratura') {
      targetRecordId = await processRegistraturaSubmission(submission, form, mappings);
    } else if (form.targetModule === 'general_register') {
      // TODO: Implement general_register processing
      throw new Error('General register processing not yet implemented');
    } else if (form.targetModule === 'events') {
      // TODO: Implement events processing
      throw new Error('Events processing not yet implemented');
    } else if (form.targetModule === 'partners') {
      // TODO: Implement partners processing
      throw new Error('Partners processing not yet implemented');
    } else {
      throw new Error(`Unknown target module: ${form.targetModule}`);
    }

    // Update submission
    await db
      .update(onlineFormSubmissions)
      .set({
        status: 'completed',
        targetRecordId,
        processedAt: new Date(),
        processedBy,
      })
      .where(eq(onlineFormSubmissions.id, submissionId));

    console.log(`✓ Submission processed successfully: ${submissionId}, target record: ${targetRecordId}`);
    return { success: true, targetRecordId };
  } catch (error) {
    console.error(`❌ Error processing submission:`, error);
    
    // Update submission status to rejected
    await db
      .update(onlineFormSubmissions)
      .set({
        status: 'rejected',
        processedAt: new Date(),
        processedBy,
      })
      .where(eq(onlineFormSubmissions.id, submissionId));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process submission for registratura module
 */
async function processRegistraturaSubmission(
  submission: typeof onlineFormSubmissions.$inferSelect,
  form: typeof onlineForms.$inferSelect,
  mappings: (typeof onlineFormFieldMappings.$inferSelect)[]
): Promise<string> {
  console.log(`Step 2: Processing registratura submission`);

  const formData = submission.formData as Record<string, any>;

  // Build document data from mappings
  const documentData: Record<string, any> = {
    parishId: form.parishId,
    documentType: 'incoming', // Default to incoming
    status: 'draft',
    createdBy: form.createdBy,
  };

  // Map fields to document columns
  // Note: We trust the mappings configuration - validation should happen at mapping creation time
  for (const mapping of mappings) {
    const fieldValue = formData[mapping.fieldKey];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      let value = fieldValue;

      // Check if mapping has SQL query
      const transformation = mapping.transformation as any;
      if (transformation?.mappingType === 'sql' && transformation?.sqlQuery) {
        // SECURITY: SQL mapping execution is disabled due to SQL injection vulnerability
        // The previous implementation used string interpolation which is vulnerable to SQL injection
        // This feature should be re-implemented using proper parameterized queries or Drizzle ORM
        // For now, we skip SQL execution and use direct mapping
        console.warn('SQL mapping execution is disabled for security reasons. Using direct mapping instead.');
        // Fall back to direct mapping - value remains as fieldValue
      }

      // Apply transformation if needed
      if (transformation && transformation.mappingType !== 'sql') {
        // TODO: Implement transformation logic (e.g., concatenate, format, etc.)
      }

      // Map to document column (convert camelCase to snake_case if needed)
      const columnName = mapping.targetColumn;
      documentData[columnName] = value;
    }
  }

  // Ensure required fields have defaults
  if (!documentData.subject) {
    documentData.subject = `Formular: ${form.name}`;
  }

  // Create document
  const [document] = await db
    .insert(documentRegistry)
    .values(documentData as any)
    .returning();

  console.log(`✓ Document created: ${document.id}`);
  return document.id;
}

