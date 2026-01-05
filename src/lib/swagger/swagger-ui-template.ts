/**
 * Swagger UI HTML template generator
 */

import {
  DEFAULT_SWAGGER_UI_CONFIG,
  SwaggerUIConfig,
  generateSwaggerUIInitScript,
  getSwaggerUICssUrl,
  getSwaggerUIBundleUrl,
  getSwaggerUIStandalonePresetUrl,
  SWAGGER_UI_VERSION,
} from './swagger-ui-config';

/**
 * Inline CSS for Swagger UI page
 */
const SWAGGER_UI_STYLES = `
  html {
    box-sizing: border-box;
    overflow: -moz-scrollbars-vertical;
    overflow-y: scroll;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  body {
    margin: 0;
    background: #fafafa;
  }
  .swagger-ui .topbar {
    display: none;
  }
`.trim();

/**
 * Generate complete Swagger UI HTML page
 */
export function generateSwaggerUIHTML(
  config: SwaggerUIConfig = DEFAULT_SWAGGER_UI_CONFIG,
  options: {
    title?: string;
    version?: string;
  } = {}
): string {
  const title = options.title || 'EORI Platform API Documentation';
  const version = options.version || SWAGGER_UI_VERSION;
  const initScript = generateSwaggerUIInitScript(config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" type="text/css" href="${getSwaggerUICssUrl(version)}" />
  <style>
${SWAGGER_UI_STYLES}
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${getSwaggerUIBundleUrl(version)}"></script>
  <script src="${getSwaggerUIStandalonePresetUrl(version)}"></script>
  <script>
${initScript}
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

