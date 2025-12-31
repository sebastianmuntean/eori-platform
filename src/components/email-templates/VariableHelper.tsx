'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

interface VariableHelperProps {
  variables: string[];
  category?: 'predefined' | 'custom';
}

const predefinedVariables: Record<string, string[]> = {
  welcome: ['user.name', 'user.email', 'link.confirmation', 'app.name'],
  'password-reset': ['user.name', 'user.email', 'link.reset', 'expiry.hours'],
  'account-approval': ['user.name', 'user.email', 'app.name'],
  'account-rejection': ['user.name', 'user.email', 'reason', 'app.name'],
};

export function VariableHelper({ variables, category = 'custom' }: VariableHelperProps) {
  console.log('Step 1: Rendering VariableHelper component');
  console.log(`  Variables: ${variables.join(', ')}`);
  console.log(`  Category: ${category}`);
  const t = useTranslations('common');

  const suggestedVariables = category === 'predefined' && variables.length === 0
    ? predefinedVariables.welcome
    : [];

  const allVariables = variables.length > 0 ? variables : suggestedVariables;

  if (allVariables.length === 0) {
    return null;
  }

  console.log('✓ Rendering variable helper');
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        {t('availableVariables')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {allVariables.map((variable) => (
          <Badge key={variable} variant="info" size="sm">
            {`{{${variable}}}`}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-text-secondary mt-3">
        {t('useSyntax')}
      </p>
    </Card>
  );
}

