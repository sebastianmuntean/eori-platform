/**
 * Client-side utility functions for email templates
 * These functions can be used in client components
 */

/**
 * Extract variable names from template content (client-side)
 * Supports {{variableName}} and {{object.property}} syntax
 */
export function extractTemplateVariables(content: string): string[] {
  const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  const variables = new Set<string>();
  let match;
  
  while ((match = variablePattern.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}


