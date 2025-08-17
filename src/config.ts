// DMT Risk Assessment Platform - Application Configuration

export interface AppConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;
  
  // Keycloak Configuration
  keycloak: {
    baseUrl: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string;
  };
  
  // Database Configuration
  database: {
    url: string;
    maxConnections: number;
  };
  
  // JWT Configuration
  jwt: {
    secret: string;
    expiresIn: string;
  };
  
  // Session Configuration
  session: {
    secret: string;
    maxAge: number;
  };
  
  // CORS Configuration
  cors: {
    allowedOrigins: string[];
  };
  
  // Security Configuration
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

// Load configuration from environment variables
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'dmt-risk-platform',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'dmt-webapp',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'dmt-webapp-secret-key-2024',
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    scopes: 'openid profile email roles'
  },
  
  database: {
    url: process.env.DATABASE_URL || './database.sqlite',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dmt-platform-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'dmt-session-secret-key-2024',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000') // 24 hours
  },
  
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8080').split(',')
  },
  
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
};

// Configuration validation
export function validateConfig(): void {
  const requiredFields = [
    'keycloak.baseUrl',
    'keycloak.realm',
    'keycloak.clientId',
    'keycloak.clientSecret'
  ];
  
  for (const field of requiredFields) {
    const keys = field.split('.');
    let value: any = config;
    
    for (const key of keys) {
      value = value[key];
    }
    
    if (!value) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
  
  console.log('✅ Configuration validation passed');
}

// Development configuration logging
if (config.nodeEnv === 'development') {
  console.log('🔧 DMT Configuration Loaded:');
  console.log('  • Environment:', config.nodeEnv);
  console.log('  • Port:', config.port);
  console.log('  • Keycloak URL:', config.keycloak.baseUrl);
  console.log('  • Keycloak Realm:', config.keycloak.realm);
  console.log('  • Client ID:', config.keycloak.clientId);
  console.log('  • Redirect URI:', config.keycloak.redirectUri);
}