/**
 * Online Forms Widget - Standalone JavaScript Embed
 * 
 * Usage:
 * <div id="online-form-container"></div>
 * <script src="https://your-domain.com/widgets/online-forms.js" data-form="WIDGET_CODE" data-container="online-form-container"></script>
 */

(function() {
  'use strict';

  // Get widget configuration from script tag
  const script = document.currentScript || document.querySelector('script[data-form]');
  if (!script) {
    console.error('Online Forms Widget: Script tag not found or missing data-form attribute');
    return;
  }

  const widgetCode = script.getAttribute('data-form');
  const containerId = script.getAttribute('data-container') || 'online-form-widget';
  const apiBaseUrl = script.getAttribute('data-api-url') || '';

  if (!widgetCode) {
    console.error('Online Forms Widget: data-form attribute is required');
    return;
  }

  // Find or create container
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    script.parentNode.insertBefore(container, script);
  }

  // Widget state
  let formDefinition = null;
  let formData = {};
  let loading = true;
  let submitting = false;
  let error = null;
  let success = false;
  let emailValidationMode = null;
  let email = '';
  let validationCode = '';
  let submissionId = null;
  let showEmailValidation = false;

  // Load React and ReactDOM from CDN if not available
  function loadReact() {
    return new Promise((resolve) => {
      if (window.React && window.ReactDOM) {
        resolve();
        return;
      }

      const reactScript = document.createElement('script');
      reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
      reactScript.onload = () => {
        const reactDOMScript = document.createElement('script');
        reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
        reactDOMScript.onload = resolve;
        document.head.appendChild(reactDOMScript);
      };
      document.head.appendChild(reactScript);
    });
  }

  // Fetch form definition
  async function fetchForm() {
    try {
      loading = true;
      render();

      const response = await fetch(`${apiBaseUrl}/api/public/online-forms/${widgetCode}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load form');
      }

      formDefinition = result.data;
      emailValidationMode = result.data.emailValidationMode;

      if (result.data.emailValidationMode === 'start') {
        showEmailValidation = true;
      }
    } catch (err) {
      error = err.message || 'Failed to load form';
    } finally {
      loading = false;
      render();
    }
  }

  // Submit form
  async function submitForm(e) {
    if (e) e.preventDefault();
    error = null;
    submitting = true;
    render();

    try {
      if (emailValidationMode === 'start' && !submissionId) {
        if (!email) {
          error = 'Email is required';
          submitting = false;
          render();
          return;
        }
      }

      const submitData = {
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

      submissionId = result.data.submissionId;

      if (result.data.requiresEmailValidation) {
        showEmailValidation = true;
      } else if (emailValidationMode === 'end') {
        showEmailValidation = true;
      } else {
        success = true;
      }
    } catch (err) {
      error = err.message || 'Failed to submit form';
    } finally {
      submitting = false;
      render();
    }
  }

  // Validate email
  async function validateEmail() {
    if (!submissionId || !email || !validationCode) {
      error = 'Please fill in all fields';
      render();
      return;
    }

    submitting = true;
    error = null;
    render();

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

      success = true;
    } catch (err) {
      error = err.message || 'Invalid validation code';
    } finally {
      submitting = false;
      render();
    }
  }

  // Render form (simple DOM manipulation without React for standalone)
  function render() {
    if (loading) {
      container.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading form...</div>';
      return;
    }

    if (error && !formDefinition) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: red;">${error}</div>`;
      return;
    }

    if (!formDefinition) {
      return;
    }

    if (success) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <div style="color: green; font-weight: bold; margin-bottom: 1rem;">
            ${formDefinition.successMessage || 'Form submitted successfully!'}
          </div>
        </div>
      `;
      return;
    }

    let html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; background: white;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600;">${formDefinition.name}</h3>
        ${formDefinition.description ? `<p style="margin: 0 0 1.5rem 0; color: #666; font-size: 0.875rem;">${formDefinition.description}</p>` : ''}
    `;

    if (error) {
      html += `
        <div style="padding: 0.75rem; margin-bottom: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;">
          ${formDefinition.errorMessage || error}
        </div>
      `;
    }

    if (showEmailValidation && !success) {
      html += `
        <form onsubmit="event.preventDefault(); window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.validateEmail();">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
            <input type="email" value="${email}" onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setEmail(this.value)" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required />
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Validation Code</label>
            <input type="text" value="${validationCode}" onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setValidationCode(this.value)" 
                   placeholder="Enter 6-digit code" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required />
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" style="flex: 1; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              ${submitting ? 'Validating...' : 'Validate'}
            </button>
            <button type="button" onclick="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.resendCode()" 
                    style="padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Resend Code
            </button>
          </div>
        </form>
      `;
    } else {
      html += `<form onsubmit="event.preventDefault(); window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.submitForm(event);">`;

      if (emailValidationMode === 'start') {
        html += `
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email *</label>
            <input type="email" value="${email}" onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setEmail(this.value)" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required />
            <small style="color: #666; font-size: 0.875rem;">We'll send you a validation code</small>
          </div>
        `;
      }

      const sortedFields = [...formDefinition.fields].sort((a, b) => a.orderIndex - b.orderIndex);

      sortedFields.forEach((field) => {
        const fieldId = `field_${field.fieldKey}`;
        const value = formData[field.fieldKey] || '';

        switch (field.fieldType) {
          case 'text':
          case 'email':
          case 'number':
            html += `
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                  ${field.label} ${field.isRequired ? '<span style="color: red;">*</span>' : ''}
                </label>
                <input type="${field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}" 
                       id="${fieldId}" value="${value}" 
                       onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setFieldValue('${field.fieldKey}', this.value)"
                       placeholder="${field.placeholder || ''}" 
                       ${field.isRequired ? 'required' : ''}
                       style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" />
                ${field.helpText ? `<small style="color: #666; font-size: 0.875rem;">${field.helpText}</small>` : ''}
              </div>
            `;
            break;

          case 'textarea':
            html += `
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                  ${field.label} ${field.isRequired ? '<span style="color: red;">*</span>' : ''}
                </label>
                <textarea id="${fieldId}" 
                          onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setFieldValue('${field.fieldKey}', this.value)"
                          placeholder="${field.placeholder || ''}" 
                          ${field.isRequired ? 'required' : ''}
                          rows="4" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                ${field.helpText ? `<small style="color: #666; font-size: 0.875rem;">${field.helpText}</small>` : ''}
              </div>
            `;
            break;

          case 'select':
            const options = field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('') || '';
            html += `
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                  ${field.label} ${field.isRequired ? '<span style="color: red;">*</span>' : ''}
                </label>
                <select id="${fieldId}" 
                        onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setFieldValue('${field.fieldKey}', this.value)"
                        ${field.isRequired ? 'required' : ''}
                        style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">Select...</option>
                  ${options}
                </select>
                ${field.helpText ? `<small style="color: #666; font-size: 0.875rem;">${field.helpText}</small>` : ''}
              </div>
            `;
            break;

          case 'date':
            html += `
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                  ${field.label} ${field.isRequired ? '<span style="color: red;">*</span>' : ''}
                </label>
                <input type="date" id="${fieldId}" 
                       value="${value}"
                       onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setFieldValue('${field.fieldKey}', this.value)"
                       ${field.isRequired ? 'required' : ''}
                       style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" />
                ${field.helpText ? `<small style="color: #666; font-size: 0.875rem;">${field.helpText}</small>` : ''}
              </div>
            `;
            break;

          case 'file':
            html += `
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                  ${field.label} ${field.isRequired ? '<span style="color: red;">*</span>' : ''}
                </label>
                <input type="file" id="${fieldId}" 
                       onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setFieldValue('${field.fieldKey}', this.files[0]?.name || '')"
                       ${field.isRequired ? 'required' : ''}
                       style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" />
                ${field.helpText ? `<small style="color: #666; font-size: 0.875rem;">${field.helpText}</small>` : ''}
              </div>
            `;
            break;
        }
      });

      if (emailValidationMode === 'end') {
        html += `
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email *</label>
            <input type="email" value="${email}" onchange="window.onlineFormWidget_${widgetCode.replace(/-/g, '_')}.setEmail(this.value)" 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required />
            <small style="color: #666; font-size: 0.875rem;">We'll send you a validation code after submission</small>
          </div>
        `;
      }

      html += `
          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="submit" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              ${submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // Expose widget API
  const widgetApi = {
    setEmail: (value) => {
      email = value;
    },
    setValidationCode: (value) => {
      validationCode = value;
    },
    setFieldValue: (key, value) => {
      formData[key] = value;
    },
    submitForm: submitForm,
    validateEmail: validateEmail,
    resendCode: async () => {
      if (!submissionId || !email) {
        error = 'Email is required';
        render();
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/public/online-forms/resend-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, email }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }

        alert('Validation code resent!');
      } catch (err) {
        error = err.message || 'Failed to resend code';
        render();
      }
    },
  };

  // Store widget API globally for form handlers
  window[`onlineFormWidget_${widgetCode.replace(/-/g, '_')}`] = widgetApi;

  // Initialize
  fetchForm();
})();


