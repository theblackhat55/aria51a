// Kong Gateway Configuration for Frontend
// This module handles Kong-specific configurations and API routing

window.KongConfig = {
    // API Base URLs - Kong Gateway routes everything through port 8000
    baseURL: window.location.hostname === 'localhost' || window.location.hostname.includes('e2b.dev') 
        ? 'http://localhost:8000'  // Development/sandbox
        : window.location.origin,   // Production (nginx proxy)
    
    // Kong-specific endpoints
    endpoints: {
        // API routes (proxied through Kong)
        api: '/api',
        health: '/api/health',
        auth: '/api/auth',
        risks: '/api/risks',
        services: '/api/services',
        
        // Kong management endpoints (development only)
        kongAdmin: 'http://localhost:8001',
        kongStatus: 'http://localhost:8001/status',
        kongServices: 'http://localhost:8001/services',
        kongRoutes: 'http://localhost:8001/routes',
        kongPlugins: 'http://localhost:8001/plugins',
        
        // Keycloak endpoints
        keycloak: 'http://localhost:8080',
        keycloakAuth: 'http://localhost:8080/auth/realms/risk-management/protocol/openid-connect',
        
        // Monitoring endpoints
        prometheus: 'http://localhost:9090',
        grafana: 'http://localhost:3001'
    },
    
    // Kong-aware request configuration
    requestConfig: {
        // Standard headers for Kong
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        
        // Request timeout (Kong has its own timeouts)
        timeout: 30000,
        
        // Enable credentials for CORS
        withCredentials: false
    },
    
    // Kong features detection
    features: {
        rateLimit: true,
        cors: true,
        jwt: true,
        logging: true,
        monitoring: true
    },
    
    // Development/debugging settings
    debug: window.location.hostname === 'localhost' || window.location.hostname.includes('e2b.dev'),
    
    // Kong consumer information (populated after authentication)
    consumer: {
        id: null,
        username: null,
        isAnonymous: true
    }
};

// Kong-aware API client
window.KongAPI = {
    // Make Kong-aware API requests
    async request(endpoint, options = {}) {
        const url = `${window.KongConfig.baseURL}${endpoint}`;
        const config = {
            ...window.KongConfig.requestConfig,
            ...options,
            headers: {
                ...window.KongConfig.requestConfig.headers,
                ...options.headers
            }
        };
        
        // Add authentication header if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add Kong request ID for tracing
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        
        if (window.KongConfig.debug) {
            console.log(`[Kong API] ${options.method || 'GET'} ${url}`, config);
        }
        
        try {
            const response = await fetch(url, config);
            
            // Extract Kong headers
            const kongHeaders = this.extractKongHeaders(response.headers);
            if (window.KongConfig.debug && Object.keys(kongHeaders).length > 0) {
                console.log('[Kong Headers]', kongHeaders);
            }
            
            // Handle Kong rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                
                console.warn(`[Kong] Rate limit exceeded. Retry after: ${retryAfter || rateLimitReset || 'unknown'}`);
                
                throw new Error(`Rate limit exceeded. Please try again later.`);
            }
            
            // Parse response
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`);
            }
            
            return {
                data,
                status: response.status,
                headers: kongHeaders,
                requestId: kongHeaders['x-kong-request-id'] || requestId
            };
            
        } catch (error) {
            if (window.KongConfig.debug) {
                console.error(`[Kong API Error] ${endpoint}:`, error);
            }
            throw error;
        }
    },
    
    // Convenience methods
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },
    
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
    
    // Extract Kong-specific headers
    extractKongHeaders(headers) {
        const kongHeaders = {};
        const kongHeaderPrefixes = ['x-kong-', 'x-ratelimit-', 'x-consumer-'];
        
        headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (kongHeaderPrefixes.some(prefix => lowerKey.startsWith(prefix))) {
                kongHeaders[lowerKey] = value;
            }
        });
        
        return kongHeaders;
    },
    
    // Generate request ID for tracing
    generateRequestId() {
        return `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    },
    
    // Kong health check
    async healthCheck() {
        try {
            const response = await this.get('/api/health');
            return {
                healthy: true,
                kong: response.data.kong || {},
                timestamp: response.data.timestamp
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    },
    
    // Get Kong metrics (admin only)
    async getKongMetrics() {
        try {
            const response = await this.get('/api/kong/metrics');
            return response.data;
        } catch (error) {
            console.warn('[Kong] Unable to fetch metrics:', error.message);
            return null;
        }
    }
};

// Kong authentication helper
window.KongAuth = {
    // Login with Kong-aware token handling
    async login(credentials) {
        try {
            const response = await window.KongAPI.post('/api/auth/login', credentials);
            
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                
                // Update Kong consumer information
                window.KongConfig.consumer = {
                    id: response.headers['x-consumer-id'] || response.data.user?.id,
                    username: response.headers['x-consumer-username'] || response.data.user?.username,
                    isAnonymous: false
                };
            }
            
            return response;
        } catch (error) {
            console.error('[Kong Auth] Login failed:', error);
            throw error;
        }
    },
    
    // Logout with Kong consumer cleanup
    logout() {
        localStorage.removeItem('authToken');
        window.KongConfig.consumer = {
            id: null,
            username: null,
            isAnonymous: true
        };
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },
    
    // Get current token
    getToken() {
        return localStorage.getItem('authToken');
    }
};

// Kong monitoring helper
window.KongMonitor = {
    // Monitor Kong health
    async startHealthMonitoring(interval = 30000) {
        setInterval(async () => {
            const health = await window.KongAPI.healthCheck();
            
            if (!health.healthy) {
                console.warn('[Kong Monitor] Health check failed:', health.error);
                this.showHealthAlert(health.error);
            } else if (window.KongConfig.debug) {
                console.log('[Kong Monitor] Health check passed');
            }
        }, interval);
    },
    
    // Show health alert
    showHealthAlert(error) {
        if (window.showNotification) {
            window.showNotification(`Kong Gateway issue: ${error}`, 'error');
        }
    },
    
    // Display Kong metrics in UI (if available)
    async displayMetrics() {
        const metrics = await window.KongAPI.getKongMetrics();
        if (metrics && window.KongConfig.debug) {
            console.log('[Kong Metrics]', metrics);
        }
        return metrics;
    }
};

// Initialize Kong configuration on load
document.addEventListener('DOMContentLoaded', function() {
    if (window.KongConfig.debug) {
        console.log('[Kong] Configuration initialized:', window.KongConfig);
        
        // Start health monitoring in development
        window.KongMonitor.startHealthMonitoring();
    }
    
    // Test Kong connectivity
    window.KongAPI.healthCheck().then(health => {
        if (health.healthy) {
            console.log('[Kong] Gateway is healthy');
        } else {
            console.warn('[Kong] Gateway health check failed:', health.error);
        }
    });
});