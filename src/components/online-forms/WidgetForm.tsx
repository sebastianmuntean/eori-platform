'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

export interface FormFieldDefinition {
  id: string;
  fieldKey: string;
  fieldType: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'number' | 'file';
  label: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  validationRules: Record<string, any> | null;
  options: Array<{ value: string; label: string }> | null;
  orderIndex: number;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string | null;
  emailValidationMode: 'start' | 'end';
  submissionFlow: 'direct' | 'review';
  successMessage: string | null;
  errorMessage: string | null;
  fields: FormFieldDefinition[];
}

interface WidgetFormProps {
  widgetCode: string;
  apiBaseUrl?: string;
  onSubmitSuccess?: (submissionId: string) => void;
  onSubmitError?: (error: string) => void;
}

export function WidgetForm({
  widgetCode,
  apiBaseUrl = '',
  onSubmitSuccess,
  onSubmitError,
}: WidgetFormProps) {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailValidationMode, setEmailValidationMode] = useState<'start' | 'end' | null>(null);
  const [email, setEmail] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [showEmailValidation, setShowEmailValidation] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [widgetCode]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/public/online-forms/${widgetCode}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load form');
      }

      setForm(result.data);
      setEmailValidationMode(result.data.emailValidationMode);
      
      // If validation is at start, show email input immediately
      if (result.data.emailValidationMode === 'start') {
        setShowEmailValidation(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load form';
      setError(errorMessage);
      if (onSubmitError) {
        onSubmitError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // If validation is at start and email not validated yet
      if (emailValidationMode === 'start' && !submissionId) {
        if (!email) {
          setError('Email is required');
          setSubmitting(false);
          return;
        }
      }

      const submitData: any = {
        formData,
      };

      if (emailValidationMode === 'start' || (emailValidationMode === 'end' && email)) {
        submitData.email = email;
      }

      const response = await fetch(`${apiBaseUrl}/api/public/online-forms/${widgetCode}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setSubmissionId(result.data.submissionId);

      // If validation is at start, show validation code input
      if (result.data.requiresEmailValidation) {
        setShowEmailValidation(true);
      } else if (emailValidationMode === 'end') {
        // If validation is at end, show email input now
        setShowEmailValidation(true);
      } else {
        // No validation needed, show success
        setSuccess(true);
        if (onSubmitSuccess) {
          onSubmitSuccess(result.data.submissionId);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit form';
      setError(errorMessage);
      if (onSubmitError) {
        onSubmitError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateEmail = async () => {
    if (!submissionId || !email || !validationCode) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/online-forms/validate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          email,
          code: validationCode,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Invalid validation code');
      }

      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(submissionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid validation code';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!submissionId || !email) {
      setError('Email is required');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/online-forms/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          email,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend code');
      }

      alert('Validation code resent!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const value = formData[field.fieldKey] || '';

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            key={field.id}
            label={field.label}
            type={field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            placeholder={field.placeholder || ''}
            required={field.isRequired}
            disabled={submitting || success}
            helperText={field.helpText || undefined}
          />
        );

      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.isRequired && <span className="text-danger">*</span>}
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
              placeholder={field.placeholder || ''}
              required={field.isRequired}
              disabled={submitting || success}
              rows={4}
            />
            {field.helpText && (
              <p className="text-xs text-text-secondary mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <Select
            key={field.id}
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
            required={field.isRequired}
            disabled={submitting || success}
            helperText={field.helpText || undefined}
          />
        );

      case 'date':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            required={field.isRequired}
            disabled={submitting || success}
            helperText={field.helpText || undefined}
          />
        );

      case 'file':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.isRequired && <span className="text-danger">*</span>}
            </label>
            <input
              type="file"
              className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, [field.fieldKey]: file.name });
                }
              }}
              required={field.isRequired}
              disabled={submitting || success}
            />
            {field.helpText && (
              <p className="text-xs text-text-secondary mt-1">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">Loading form...</div>
        </CardBody>
      </Card>
    );
  }

  if (error && !form) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-danger">{error}</div>
        </CardBody>
      </Card>
    );
  }

  if (!form) {
    return null;
  }

  if (success) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="text-success text-lg font-semibold mb-2">
              {form.successMessage || 'Form submitted successfully!'}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const sortedFields = [...form.fields].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{form.name}</h3>
        {form.description && <p className="text-sm text-text-secondary">{form.description}</p>}
      </CardHeader>
      <CardBody>
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger">
            {form.errorMessage || error}
          </div>
        )}

        {showEmailValidation && !success ? (
          <div className="space-y-4">
            <h4 className="font-semibold">Email Validation</h4>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Validation Code"
              value={validationCode}
              onChange={(e) => setValidationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              disabled={submitting}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleValidateEmail}
                disabled={submitting || !email || !validationCode}
              >
                {submitting ? 'Validating...' : 'Validate'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={submitting || !email}
              >
                Resend Code
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {emailValidationMode === 'start' && (
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                helperText="We'll send you a validation code"
              />
            )}

            {sortedFields.map((field) => renderField(field))}

            {emailValidationMode === 'end' && (
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                helperText="We'll send you a validation code after submission"
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}


