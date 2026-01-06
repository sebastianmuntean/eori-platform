/**
 * Swagger UI configuration and constants
 */

export const SWAGGER_UI_VERSION = '5.17.14';
export const SWAGGER_UI_CDN_BASE = 'https://unpkg.com/swagger-ui-dist';

/**
 * Swagger UI configuration options
 */
export interface SwaggerUIConfig {
  url: string;
  deepLinking?: boolean;
  tryItOutEnabled?: boolean;
  docExpansion?: 'list' | 'full' | 'none';
  filter?: boolean;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
  supportedSubmitMethods?: string[];
  validatorUrl?: string | null;
}

/**
 * Default Swagger UI configuration
 */
export const DEFAULT_SWAGGER_UI_CONFIG: SwaggerUIConfig = {
  url: '/api/docs',
  deepLinking: true,
  tryItOutEnabled: true,
  docExpansion: 'list',
  filter: true,
  showExtensions: true,
  showCommonExtensions: true,
  supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
  validatorUrl: null,
};

/**
 * Get Swagger UI CSS URL
 */
export function getSwaggerUICssUrl(version: string = SWAGGER_UI_VERSION): string {
  return `${SWAGGER_UI_CDN_BASE}@${version}/swagger-ui.css`;
}

/**
 * Get Swagger UI Bundle JS URL
 */
export function getSwaggerUIBundleUrl(version: string = SWAGGER_UI_VERSION): string {
  return `${SWAGGER_UI_CDN_BASE}@${version}/swagger-ui-bundle.js`;
}

/**
 * Get Swagger UI Standalone Preset JS URL
 */
export function getSwaggerUIStandalonePresetUrl(
  version: string = SWAGGER_UI_VERSION
): string {
  return `${SWAGGER_UI_CDN_BASE}@${version}/swagger-ui-standalone-preset.js`;
}

/**
 * Generate Swagger UI initialization script
 */
export function generateSwaggerUIInitScript(config: SwaggerUIConfig): string {
  const configJson = JSON.stringify(config, null, 2);
  return `
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: ${JSON.stringify(config.url)},
        dom_id: '#swagger-ui',
        deepLinking: ${config.deepLinking ?? DEFAULT_SWAGGER_UI_CONFIG.deepLinking},
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: ${config.tryItOutEnabled ?? DEFAULT_SWAGGER_UI_CONFIG.tryItOutEnabled},
        supportedSubmitMethods: ${JSON.stringify(config.supportedSubmitMethods ?? DEFAULT_SWAGGER_UI_CONFIG.supportedSubmitMethods)},
        validatorUrl: ${config.validatorUrl === null ? 'null' : JSON.stringify(config.validatorUrl)},
        docExpansion: ${JSON.stringify(config.docExpansion ?? DEFAULT_SWAGGER_UI_CONFIG.docExpansion)},
        filter: ${config.filter ?? DEFAULT_SWAGGER_UI_CONFIG.filter},
        showExtensions: ${config.showExtensions ?? DEFAULT_SWAGGER_UI_CONFIG.showExtensions},
        showCommonExtensions: ${config.showCommonExtensions ?? DEFAULT_SWAGGER_UI_CONFIG.showCommonExtensions}
      });
    };
  `.trim();
}





