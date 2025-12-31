import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Download Excel template for user import from API endpoint
 * Template includes: Email, Name, Role, Address, City, Phone
 * Role column has data validation (dropdown) with valid roles: episcop, vicar, paroh, secretar, contabil
 */
export async function downloadUserImportTemplate() {
  console.log('Step 1: Downloading user import template from API');
  
  try {
    console.log('Step 1.1: Calling /api/users/template endpoint');
    const response = await fetch('/api/users/template');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to download template');
    }
    
    console.log('Step 1.2: Response received, getting blob');
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `template-import-utilizatori-${new Date().toISOString().split('T')[0]}.xlsx`
      : `template-import-utilizatori-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    console.log(`Step 1.3: Creating download link for file: ${fileName}`);
    
    // Create download link and trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('✓ Template downloaded successfully');
  } catch (error) {
    console.error('❌ Error downloading template:', error);
    throw error;
  }
}



