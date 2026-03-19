/**
 * Environment Configuration
 * Centralized configuration for the application
 */

const environment = {
  // API Configuration
  api: {
    // Default to https as user mentioned https://localhost:7195
    // Can be overridden with NEXT_PUBLIC_API_BASE_URL environment variable
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yashangi.com/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || 'https://www.yashangi.com', 10),
  },

  // Application Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ECommerce Front',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableLogging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',
  },

  // External Services
  services: {
    paymentGateway: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL || '',
    cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  },
};

// Validate required environment variables
const validateEnvironment = () => {
  const required = [];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateEnvironment();
}

export default environment;

