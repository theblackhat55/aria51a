import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createIntelligenceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main intelligence dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Intelligence',
        user,
        content: renderIntelligenceDashboard(user)
      })
    );
  });
  
  // Threat Analysis & Detection
  app.get('/threats', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Analysis',
        user,
        content: renderThreatsPage(user)
      })
    );
  });
  
  // IOC Management
  app.get('/ioc', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'IOC Management',
        user,
        content: renderIOCPage(user)
      })
    );
  });
  
  // Threat Hunting
  app.get('/hunting', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Hunting',
        user,
        content: renderThreatHuntingPage(user)
      })
    );
  });
  
  // Intelligence Feeds
  app.get('/feeds', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Intelligence Feeds',
        user,
        content: renderFeedsPage(user)
      })
    );
  });
  
  // Threat Reports
  app.get('/reports', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Reports',
        user,
        content: renderReportsPage(user)
      })
    );
  });
  
  // API Endpoints for dynamic data
  app.get('/api/threats/recent', async (c) => {
    const recentThreats = await getRecentThreats();
    return c.json(recentThreats);
  });
  
  app.get('/api/ioc/search', async (c) => {
    const query = c.req.query('q');
    const type = c.req.query('type');
    const iocs = await searchIOCs(query, type);
    return c.json(iocs);
  });
  
  app.post('/api/hunt/query', async (c) => {
    const { query, timeRange } = await c.req.json();
    const results = await executeHuntQuery(query, timeRange);
    return c.json(results);
  });
  
  app.get('/api/feeds/status', async (c) => {
    const feedsStatus = await getFeedsStatus();
    return c.json(feedsStatus);
  });
  
  app.post('/api/reports/generate', async (c) => {
    const { type, filters } = await c.req.json();
    const report = await generateThreatReport(type, filters);
    return c.json(report);
  });
  
  return app;
}

// Helper Functions and Data Management

// Get Recent Threats Data
async function getRecentThreats() {
  return {
    threats: [
      {
        id: "THREAT-001",
        name: "LokiBot Banking Campaign",
        severity: "critical",
        type: "malware",
        firstSeen: "2024-01-15",
        lastActivity: "2024-01-22",
        targetSectors: ["Financial", "Banking"],
        geography: "Global",
        confidence: 98,
        iocs: 234,
        description: "Advanced banking trojan targeting financial institutions with sophisticated credential theft capabilities."
      },
      {
        id: "THREAT-002", 
        name: "APT29 Cozy Bear Phishing",
        severity: "high",
        type: "apt",
        firstSeen: "2024-01-08",
        lastActivity: "2024-01-20",
        targetSectors: ["Government", "NGO"],
        geography: "North America, Europe",
        confidence: 87,
        iocs: 156,
        description: "Sophisticated spear-phishing campaign attributed to Russian intelligence services targeting government entities."
      },
      {
        id: "THREAT-003",
        name: "Ransomware Deployment Wave", 
        severity: "medium",
        type: "ransomware",
        firstSeen: "2024-01-20",
        lastActivity: "2024-01-22",
        targetSectors: ["Healthcare", "SMB"],
        geography: "North America",
        confidence: 76,
        iocs: 89,
        description: "Coordinated ransomware deployment targeting small to medium businesses across multiple verticals."
      }
    ],
    statistics: {
      totalThreats: 47,
      criticalThreats: 23,
      activeCampaigns: 12,
      newThisWeek: 8
    }
  };
}

// Search IOCs
async function searchIOCs(query?: string, type?: string) {
  const iocs = [
    {
      id: "IOC-001",
      value: "192.168.1.100",
      type: "ip",
      threatLevel: "critical",
      campaign: "LokiBot Banking",
      source: "Internal Detection",
      firstSeen: "2024-01-15T14:32:00Z",
      confidence: 95,
      tags: ["c2", "malware", "banking"]
    },
    {
      id: "IOC-002",
      value: "malicious-domain.com",
      type: "domain",
      threatLevel: "high", 
      campaign: "APT29 Phishing",
      source: "Commercial Feed",
      firstSeen: "2024-01-14T09:15:00Z",
      confidence: 87,
      tags: ["phishing", "apt", "government"]
    },
    {
      id: "IOC-003",
      value: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      type: "hash",
      threatLevel: "critical",
      campaign: "Ransomware Wave",
      source: "Partner Sharing",
      firstSeen: "2024-01-13T16:45:00Z",
      confidence: 92,
      tags: ["ransomware", "malware", "encryption"]
    }
  ];

  // Simple filtering logic
  let filtered = iocs;
  if (query) {
    filtered = filtered.filter(ioc => 
      ioc.value.toLowerCase().includes(query.toLowerCase()) ||
      ioc.campaign.toLowerCase().includes(query.toLowerCase())
    );
  }
  if (type && type !== 'all') {
    filtered = filtered.filter(ioc => ioc.type === type);
  }

  return {
    iocs: filtered,
    totalCount: 8741,
    filteredCount: filtered.length,
    statistics: {
      byType: {
        ip: 2341,
        domain: 1876, 
        hash: 3234,
        email: 1290
      },
      byThreatLevel: {
        critical: 234,
        high: 1456,
        medium: 3891,
        low: 2876,
        info: 284
      }
    }
  };
}

// Execute Hunt Query
async function executeHuntQuery(query: string, timeRange: string) {
  // Simulate hunt execution
  return {
    queryId: `HUNT-${Date.now()}`,
    status: "completed",
    executionTime: "2.3s",
    eventsAnalyzed: 2347832,
    hostsScanned: 247,
    findings: [
      {
        id: "FINDING-001",
        type: "suspicious_login",
        severity: "high",
        title: "Suspicious Login Pattern",
        description: "User: admin@company.com from 192.168.1.100",
        details: "15 failed attempts in 2 minutes",
        timestamp: new Date().toISOString(),
        confidence: 87
      },
      {
        id: "FINDING-002", 
        type: "network_anomaly",
        severity: "medium",
        title: "Abnormal Network Traffic",
        description: "Endpoint: WKS-001 → 185.234.72.45:443",
        details: "Continuous beaconing detected",
        timestamp: new Date().toISOString(),
        confidence: 73
      },
      {
        id: "FINDING-003",
        type: "powershell_execution",
        severity: "medium", 
        title: "PowerShell Execution",
        description: "Host: SRV-002, Encoded command detected",
        details: "Base64 encoded PowerShell script",
        timestamp: new Date().toISOString(),
        confidence: 82
      }
    ],
    timeline: [
      { time: "15:42", event: "Hunt Initiated", type: "info" },
      { time: "15:43", event: "Data Processing", type: "processing" },
      { time: "15:45", event: "Anomalies Detected", type: "findings" },
      { time: "15:46", event: "Hunt Completed", type: "success" }
    ]
  };
}

// Get Feeds Status
async function getFeedsStatus() {
  return {
    feeds: [
      {
        id: "FEED-001",
        name: "CrowdStrike Falcon Intel",
        type: "commercial",
        status: "active",
        lastUpdate: "5 minutes ago",
        nextUpdate: "in 10 minutes",
        records: 47234,
        reliability: 98
      },
      {
        id: "FEED-002",
        name: "CISA AIS",
        type: "government", 
        status: "active",
        lastUpdate: "15 minutes ago",
        nextUpdate: "in 45 minutes",
        records: 1247,
        reliability: 95
      },
      {
        id: "FEED-003",
        name: "ThreatFox",
        type: "open_source",
        status: "failed",
        lastUpdate: "2 hours ago", 
        nextUpdate: "retry pending",
        records: 0,
        reliability: 0,
        error: "API authentication failed"
      },
      {
        id: "FEED-004",
        name: "MISP Communities",
        type: "open_source",
        status: "active",
        lastUpdate: "18 minutes ago",
        nextUpdate: "in 42 minutes", 
        records: 12456,
        reliability: 89
      },
      {
        id: "FEED-005", 
        name: "AlienVault OTX",
        type: "open_source",
        status: "active",
        lastUpdate: "25 minutes ago",
        nextUpdate: "in 35 minutes",
        records: 34127,
        reliability: 91
      }
    ],
    statistics: {
      totalFeeds: 18,
      activeFeeds: 16,
      failedFeeds: 2,
      recordsToday: 847321,
      avgUpdateTime: "5 minutes"
    }
  };
}

// Generate Threat Report
async function generateThreatReport(type: string, filters: any) {
  const reportId = `RPT-${Date.now()}`;
  
  return {
    reportId,
    type,
    status: "generating",
    progress: 0,
    estimatedTime: "30 seconds",
    sections: [
      "Executive Summary",
      "Threat Landscape Overview", 
      "IOC Analysis",
      "Campaign Attribution",
      "MITRE ATT&CK Mapping",
      "Recommendations"
    ],
    metadata: {
      generatedBy: "ARIA5.1 Intelligence Engine",
      generatedAt: new Date().toISOString(),
      timeRange: filters.timeRange || "Last 30 Days",
      includedThreats: filters.threats || ["malware", "phishing"],
      format: filters.format || "pdf"
    }
  };
}

// Comprehensive Intelligence Dashboard
const renderIntelligenceDashboard = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Threat Intelligence Center</h1>
        <p class="mt-2 text-lg text-gray-600">Advanced threat detection, analysis, and response intelligence</p>
      </div>
      
      <!-- Real-time Intelligence Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100 text-sm">Critical Threats</p>
              <p class="text-3xl font-bold">23</p>
              <p class="text-red-200 text-xs mt-1">+5 in last 24h</p>
            </div>
            <i class="fas fa-exclamation-triangle text-4xl text-red-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Active Campaigns</p>
              <p class="text-3xl font-bold">12</p>
              <p class="text-orange-200 text-xs mt-1">3 new this week</p>
            </div>
            <i class="fas fa-crosshairs text-4xl text-orange-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">IOCs Tracked</p>
              <p class="text-3xl font-bold">8,741</p>
              <p class="text-blue-200 text-xs mt-1">+234 today</p>
            </div>
            <i class="fas fa-fingerprint text-4xl text-blue-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Intel Sources</p>
              <p class="text-3xl font-bold">18</p>
              <p class="text-purple-200 text-xs mt-1">16 active</p>
            </div>
            <i class="fas fa-satellite-dish text-4xl text-purple-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Detections</p>
              <p class="text-3xl font-bold">156</p>
              <p class="text-green-200 text-xs mt-1">Last 24 hours</p>
            </div>
            <i class="fas fa-shield-alt text-4xl text-green-200"></i>
          </div>
        </div>
      </div>
      
      <!-- Main Intelligence Modules -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        <!-- Live Threat Map -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Global Threat Map</h2>
            <span class="flex items-center text-green-600">
              <span class="flex h-2 w-2 relative mr-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </span>
          </div>
          <div class="p-6">
            <div class="relative bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div class="text-center">
                <i class="fas fa-globe-americas text-4xl text-gray-400 mb-3"></i>
                <p class="text-sm text-gray-600">Interactive threat geo-location map</p>
                <p class="text-xs text-gray-500 mt-1">Real-time attack origins and targets</p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-red-600">47</p>
                <p class="text-xs text-gray-500">Active Attacks</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-orange-600">23</p>
                <p class="text-xs text-gray-500">Countries</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-blue-600">92</p>
                <p class="text-xs text-gray-500">Blocked IPs</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Top Threats -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Top Active Threats</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div class="flex-shrink-0">
                  <i class="fas fa-virus text-red-600"></i>
                </div>
                <div class="ml-3 flex-1">
                  <p class="font-medium text-gray-900">LokiBot Campaign</p>
                  <p class="text-sm text-gray-600">Banking credential stealer</p>
                  <p class="text-xs text-red-600 font-medium">Critical • Active</p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-red-600">98%</span>
                  <p class="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
              
              <div class="flex items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div class="flex-shrink-0">
                  <i class="fas fa-user-secret text-orange-600"></i>
                </div>
                <div class="ml-3 flex-1">
                  <p class="font-medium text-gray-900">APT29 Phishing</p>
                  <p class="text-sm text-gray-600">Cozy Bear spear-phishing</p>
                  <p class="text-xs text-orange-600 font-medium">High • Ongoing</p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-orange-600">87%</span>
                  <p class="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
              
              <div class="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div class="flex-shrink-0">
                  <i class="fas fa-bug text-yellow-600"></i>
                </div>
                <div class="ml-3 flex-1">
                  <p class="font-medium text-gray-900">CVE-2024-0001</p>
                  <p class="text-sm text-gray-600">Zero-day RCE exploit</p>
                  <p class="text-xs text-yellow-600 font-medium">Medium • Patched</p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-yellow-600">76%</span>
                  <p class="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <a href="/intelligence/threats" class="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                View All Threats
              </a>
            </div>
          </div>
        </div>
        
        <!-- Intelligence Feed Status -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Intelligence Feeds</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div class="ml-3">
                    <p class="font-medium text-gray-900">MITRE ATT&CK</p>
                    <p class="text-sm text-gray-600">Updated 15m ago</p>
                  </div>
                </div>
                <i class="fas fa-check-circle text-green-500"></i>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div class="ml-3">
                    <p class="font-medium text-gray-900">CISA Alerts</p>
                    <p class="text-sm text-gray-600">Updated 32m ago</p>
                  </div>
                </div>
                <i class="fas fa-check-circle text-green-500"></i>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-3 w-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div class="ml-3">
                    <p class="font-medium text-gray-900">VirusTotal API</p>
                    <p class="text-sm text-gray-600">Updated 1h ago</p>
                  </div>
                </div>
                <i class="fas fa-sync-alt text-blue-500"></i>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-3 w-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div class="ml-3">
                    <p class="font-medium text-gray-900">ThreatFox</p>
                    <p class="text-sm text-gray-600">Error 2h ago</p>
                  </div>
                </div>
                <i class="fas fa-exclamation-triangle text-red-500"></i>
              </div>
            </div>
            <div class="mt-6">
              <a href="/intelligence/feeds" class="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                Manage Feeds
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Intelligence Operations -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Quick Hunt -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Quick Threat Hunt</h2>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Search IOCs</label>
              <div class="flex">
                <input type="text" placeholder="Enter IP, domain, hash, or email..." class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <select class="px-3 py-2 border-t border-b border-gray-300 text-sm">
                  <option>All Types</option>
                  <option>IP Address</option>
                  <option>Domain</option>
                  <option>Hash</option>
                  <option>Email</option>
                  <option>URL</option>
                </select>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-center text-sm">
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="font-semibold text-gray-900">8,741</p>
                <p class="text-gray-600">Total IOCs</p>
              </div>
              <div class="bg-red-50 p-3 rounded-lg">
                <p class="font-semibold text-red-600">234</p>
                <p class="text-gray-600">Malicious</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Detections -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Detections</h2>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div class="flex items-center">
                  <div class="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">192.168.1.100</p>
                    <p class="text-xs text-gray-500">C2 Communication</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500">2m ago</span>
              </div>
              
              <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div class="flex items-center">
                  <div class="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">malware.exe</p>
                    <p class="text-xs text-gray-500">Hash Match</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500">5m ago</span>
              </div>
              
              <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div class="flex items-center">
                  <div class="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">suspicious.com</p>
                    <p class="text-xs text-gray-500">Domain Reputation</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500">8m ago</span>
              </div>
            </div>
            <div class="mt-4">
              <a href="/intelligence/hunting" class="block w-full text-center text-blue-600 hover:text-blue-500 font-medium text-sm">
                Advanced Threat Hunting →
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Intelligence Actions -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Intelligence Operations</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <a href="/intelligence/threats" class="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group">
            <i class="fas fa-biohazard text-2xl text-red-600 mb-2 group-hover:text-red-700"></i>
            <span class="text-sm font-medium text-gray-900">Threat Analysis</span>
          </a>
          
          <a href="/intelligence/ioc" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
            <i class="fas fa-fingerprint text-2xl text-blue-600 mb-2 group-hover:text-blue-700"></i>
            <span class="text-sm font-medium text-gray-900">IOC Management</span>
          </a>
          
          <a href="/intelligence/hunting" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <i class="fas fa-search text-2xl text-green-600 mb-2 group-hover:text-green-700"></i>
            <span class="text-sm font-medium text-gray-900">Threat Hunting</span>
          </a>
          
          <a href="/intelligence/feeds" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
            <i class="fas fa-rss text-2xl text-purple-600 mb-2 group-hover:text-purple-700"></i>
            <span class="text-sm font-medium text-gray-900">Intel Feeds</span>
          </a>
          
          <a href="/intelligence/reports" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group">
            <i class="fas fa-chart-bar text-2xl text-orange-600 mb-2 group-hover:text-orange-700"></i>
            <span class="text-sm font-medium text-gray-900">Threat Reports</span>
          </a>
          
          <button onclick="showAlertModal()" class="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group">
            <i class="fas fa-bell text-2xl text-yellow-600 mb-2 group-hover:text-yellow-700"></i>
            <span class="text-sm font-medium text-gray-900">Set Alerts</span>
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// Comprehensive Threat Analysis Page
const renderThreatsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Threat Analysis & Detection</h1>
            <p class="mt-2 text-lg text-gray-600">Advanced threat intelligence analysis and attribution</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>New Analysis
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-download mr-2"></i>Export Report
            </button>
          </div>
        </div>
      </div>
      
      <!-- Threat Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100 text-sm">Active Threats</p>
              <p class="text-3xl font-bold">47</p>
            </div>
            <i class="fas fa-exclamation-triangle text-3xl text-red-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Campaigns Tracked</p>
              <p class="text-3xl font-bold">23</p>
            </div>
            <i class="fas fa-crosshairs text-3xl text-orange-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">TTPs Analyzed</p>
              <p class="text-3xl font-bold">156</p>
            </div>
            <i class="fas fa-chess-knight text-3xl text-purple-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Attribution Score</p>
              <p class="text-3xl font-bold">89%</p>
            </div>
            <i class="fas fa-fingerprint text-3xl text-blue-200"></i>
          </div>
        </div>
      </div>
      
      <!-- Threat Analysis Dashboard -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <!-- Active Threat Campaigns -->
        <div class="xl:col-span-2 bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Active Threat Campaigns</h2>
            <div class="flex items-center space-x-2">
              <select class="text-sm border border-gray-300 rounded px-2 py-1">
                <option>All Severities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
              <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="border border-red-200 rounded-lg p-4 bg-red-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <h3 class="font-semibold text-gray-900">LokiBot Banking Campaign</h3>
                      <span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
                      <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">APT Group</span>
                    </div>
                    <p class="text-gray-600 mb-3">Advanced banking trojan targeting financial institutions with sophisticated credential theft capabilities.</p>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p class="text-gray-500">First Seen</p>
                        <p class="font-medium">2024-01-15</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Targets</p>
                        <p class="font-medium">23 Organizations</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Geography</p>
                        <p class="font-medium">Global</p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col space-y-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                    <button class="text-green-600 hover:text-green-800 text-sm">IOCs</button>
                  </div>
                </div>
                
                <!-- MITRE ATT&CK Mapping -->
                <div class="mt-4 pt-4 border-t border-red-200">
                  <p class="text-sm font-medium text-gray-700 mb-2">MITRE ATT&CK Techniques</p>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1566.001 - Spear Phishing</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1055 - Process Injection</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1539 - Steal Web Session</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">+4 more</span>
                  </div>
                </div>
              </div>
              
              <div class="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <h3 class="font-semibold text-gray-900">APT29 Cozy Bear Phishing</h3>
                      <span class="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">High</span>
                      <span class="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Nation-State</span>
                    </div>
                    <p class="text-gray-600 mb-3">Sophisticated spear-phishing campaign attributed to Russian intelligence services targeting government entities.</p>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p class="text-gray-500">First Seen</p>
                        <p class="font-medium">2024-01-08</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Targets</p>
                        <p class="font-medium">Government, NGOs</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Attribution</p>
                        <p class="font-medium">87% Confidence</p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col space-y-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                    <button class="text-green-600 hover:text-green-800 text-sm">IOCs</button>
                  </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-orange-200">
                  <p class="text-sm font-medium text-gray-700 mb-2">MITRE ATT&CK Techniques</p>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1566.002 - Spear Phishing Link</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1204.002 - User Execution</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1071.001 - Web Protocols</span>
                  </div>
                </div>
              </div>
              
              <div class="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <h3 class="font-semibold text-gray-900">Ransomware Deployment Wave</h3>
                      <span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Medium</span>
                      <span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Ransomware</span>
                    </div>
                    <p class="text-gray-600 mb-3">Coordinated ransomware deployment targeting small to medium businesses across multiple verticals.</p>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p class="text-gray-500">First Seen</p>
                        <p class="font-medium">2024-01-20</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Targets</p>
                        <p class="font-medium">SMB, Healthcare</p>
                      </div>
                      <div>
                        <p class="text-gray-500">Variants</p>
                        <p class="font-medium">3 Detected</p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col space-y-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                    <button class="text-green-600 hover:text-green-800 text-sm">IOCs</button>
                  </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-yellow-200">
                  <p class="text-sm font-medium text-gray-700 mb-2">MITRE ATT&CK Techniques</p>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1486 - Data Encrypted for Impact</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">T1490 - Inhibit System Recovery</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-6 text-center">
              <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Load More Campaigns
              </button>
            </div>
          </div>
        </div>
        
        <!-- Threat Actor Intelligence -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Threat Actor Profiles</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="p-4 border border-red-200 rounded-lg bg-red-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-900">APT29 (Cozy Bear)</h3>
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Active</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">Russian intelligence service (SVR) linked advanced persistent threat group.</p>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Origin:</span>
                    <span class="font-medium">Russia (SVR)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Active Since:</span>
                    <span class="font-medium">2008</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Confidence:</span>
                    <span class="font-medium text-red-600">High</span>
                  </div>
                </div>
              </div>
              
              <div class="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-900">Lazarus Group</h3>
                  <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Monitoring</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">North Korean state-sponsored group known for financial crimes and espionage.</p>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Origin:</span>
                    <span class="font-medium">North Korea</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Active Since:</span>
                    <span class="font-medium">2009</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Confidence:</span>
                    <span class="font-medium text-orange-600">Medium</span>
                  </div>
                </div>
              </div>
              
              <div class="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-900">FIN7</h3>
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Tracked</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">Financially motivated threat group targeting retail and restaurant sectors.</p>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Origin:</span>
                    <span class="font-medium">Unknown</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Active Since:</span>
                    <span class="font-medium">2013</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Confidence:</span>
                    <span class="font-medium text-blue-600">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Threat Intelligence Analysis Tools -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- MITRE ATT&CK Matrix -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">MITRE ATT&CK Coverage</h2>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Technique Coverage</span>
                <span class="text-sm font-bold text-blue-600">73%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: 73%"></div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4 text-center mb-6">
              <div class="p-3 bg-red-50 rounded-lg">
                <p class="text-2xl font-bold text-red-600">14</p>
                <p class="text-sm text-gray-600">Tactics</p>
              </div>
              <div class="p-3 bg-blue-50 rounded-lg">
                <p class="text-2xl font-bold text-blue-600">188</p>
                <p class="text-sm text-gray-600">Techniques</p>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <p class="text-2xl font-bold text-green-600">379</p>
                <p class="text-sm text-gray-600">Sub-techniques</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-sm">Initial Access</span>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High Activity</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-sm">Persistence</span>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Medium Activity</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-sm">Defense Evasion</span>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High Activity</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Threat Timeline -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Threat Activity Timeline</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  14:32
                </div>
                <div class="flex-1 border-l-2 border-red-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-red-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Critical IOC Detected</span>
                  </div>
                  <p class="text-xs text-gray-600">Malicious IP 192.168.1.100 attempting C2 communication</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  13:45
                </div>
                <div class="flex-1 border-l-2 border-orange-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-orange-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Campaign Update</span>
                  </div>
                  <p class="text-xs text-gray-600">LokiBot campaign expanded to new geographic regions</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  12:18
                </div>
                <div class="flex-1 border-l-2 border-blue-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-blue-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Intelligence Update</span>
                  </div>
                  <p class="text-xs text-gray-600">New TTPs identified in APT29 toolset analysis</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  11:02
                </div>
                <div class="flex-1 border-l-2 border-green-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-green-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Threat Mitigated</span>
                  </div>
                  <p class="text-xs text-gray-600">Ransomware attempt blocked by behavioral analysis</p>
                </div>
              </div>
            </div>
            
            <div class="mt-6 text-center">
              <button class="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View Full Timeline →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// IOC Management Page
const renderIOCPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">IOC Management</h1>
            <p class="mt-2 text-lg text-gray-600">Indicators of Compromise database and analysis</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>Add IOC
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-upload mr-2"></i>Bulk Import
            </button>
            <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              <i class="fas fa-download mr-2"></i>Export IOCs
            </button>
          </div>
        </div>
      </div>
      
      <!-- IOC Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-fingerprint text-3xl text-blue-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">8,741</p>
          <p class="text-sm text-gray-500">Total IOCs</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-network-wired text-3xl text-green-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">2,341</p>
          <p class="text-sm text-gray-500">IP Addresses</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-globe text-3xl text-purple-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">1,876</p>
          <p class="text-sm text-gray-500">Domains</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-hashtag text-3xl text-orange-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">3,234</p>
          <p class="text-sm text-gray-500">File Hashes</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-envelope text-3xl text-red-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">1,290</p>
          <p class="text-sm text-gray-500">Email Addresses</p>
        </div>
      </div>
      
      <!-- IOC Search and Filters -->
      <div class="bg-white rounded-lg shadow-lg mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Search & Filter IOCs</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Search IOCs</label>
              <div class="flex">
                <input type="text" placeholder="Enter IP, domain, hash, email..." class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button class="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">IOC Type</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Types</option>
                <option>IP Address</option>
                <option>Domain</option>
                <option>URL</option>
                <option>File Hash</option>
                <option>Email</option>
                <option>Registry Key</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Threat Level</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Levels</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                <option>Info</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Sources</option>
                <option>Internal Detection</option>
                <option>Commercial Feed</option>
                <option>OSINT</option>
                <option>Partner Sharing</option>
                <option>Manual Entry</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Campaigns</option>
                <option>LokiBot Banking</option>
                <option>APT29 Phishing</option>
                <option>Ransomware Wave</option>
                <option>Uncategorized</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- IOC Database -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">IOC Database</h2>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">Showing 1-50 of 8,741 results</span>
            <div class="flex items-center space-x-2">
              <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-th-large"></i>
              </button>
              <button class="text-blue-600">
                <i class="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" class="rounded">
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOC Value</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat Level</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Seen</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" class="rounded">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-network-wired text-red-500 mr-2"></i>
                    <span class="font-mono text-sm">192.168.1.100</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">IP Address</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">LokiBot Banking</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Internal Detection</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15 14:32</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">View</button>
                  <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button class="text-red-600 hover:text-red-900">Block</button>
                </td>
              </tr>
              
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" class="rounded">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-globe text-orange-500 mr-2"></i>
                    <span class="font-mono text-sm">malicious-domain.com</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Domain</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">High</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">APT29 Phishing</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Commercial Feed</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-14 09:15</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">View</button>
                  <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button class="text-red-600 hover:text-red-900">Block</button>
                </td>
              </tr>
              
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" class="rounded">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-hashtag text-purple-500 mr-2"></i>
                    <span class="font-mono text-xs">a1b2c3d4e5f6...</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">SHA256</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Ransomware Wave</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Partner Sharing</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-13 16:45</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">View</button>
                  <button class="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button class="text-red-600 hover:text-red-900">Block</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <i class="fas fa-check mr-1"></i>Select All
            </button>
            <button class="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              <i class="fas fa-ban mr-1"></i>Block Selected
            </button>
            <button class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <i class="fas fa-download mr-1"></i>Export Selected
            </button>
          </div>
          
          <div class="flex items-center space-x-2">
            <button class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <span class="px-3 py-2 text-sm text-gray-700">Page 1 of 175</span>
            <button class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Threat Hunting Page
const renderThreatHuntingPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Threat Hunting</h1>
            <p class="mt-2 text-lg text-gray-600">Proactive threat detection and investigation platform</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>New Hunt
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-save mr-2"></i>Save Query
            </button>
          </div>
        </div>
      </div>
      
      <!-- Hunt Dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Active Hunts</p>
              <p class="text-3xl font-bold">7</p>
            </div>
            <i class="fas fa-search text-3xl text-blue-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Findings</p>
              <p class="text-3xl font-bold">23</p>
            </div>
            <i class="fas fa-crosshairs text-3xl text-green-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Data Sources</p>
              <p class="text-3xl font-bold">12</p>
            </div>
            <i class="fas fa-database text-3xl text-purple-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Success Rate</p>
              <p class="text-3xl font-bold">94%</p>
            </div>
            <i class="fas fa-trophy text-3xl text-orange-200"></i>
          </div>
        </div>
      </div>
      
      <!-- Hunt Query Builder -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div class="xl:col-span-2 bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Hunt Query Builder</h2>
            <div class="flex items-center space-x-2">
              <button class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">KQL</button>
              <button class="px-3 py-1 text-gray-500 rounded text-sm">SQL</button>
              <button class="px-3 py-1 text-gray-500 rounded text-sm">YARA</button>
            </div>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Hunt Query</label>
              <textarea class="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                        placeholder="SecurityEvent 
| where EventID == 4624
| where LogonType == 10
| where AccountName !contains '$'
| summarize count() by AccountName, IpAddress
| where count_ > 10
| order by count_ desc"></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Custom Range</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Sources</option>
                  <option>Windows Event Logs</option>
                  <option>Network Logs</option>
                  <option>Endpoint Detection</option>
                  <option>Proxy Logs</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hunt Type</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Anomaly Detection</option>
                  <option>IOC Hunting</option>
                  <option>Behavioral Analysis</option>
                  <option>Lateral Movement</option>
                </select>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  <i class="fas fa-play mr-2"></i>Execute Hunt
                </button>
                <button class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  <i class="fas fa-eye mr-2"></i>Preview
                </button>
                <button class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-history mr-1"></i>Query History
                </button>
              </div>
              
              <div class="text-sm text-gray-500">
                Est. execution time: ~2.3s
              </div>
            </div>
          </div>
        </div>
        
        <!-- Hunt Templates -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Hunt Templates</h2>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              <button class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="font-medium text-sm text-gray-900">Lateral Movement Detection</div>
                <div class="text-xs text-gray-500 mt-1">Detect unusual login patterns and privilege escalation</div>
              </button>
              
              <button class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="font-medium text-sm text-gray-900">C2 Communication Hunt</div>
                <div class="text-xs text-gray-500 mt-1">Identify potential command and control traffic</div>
              </button>
              
              <button class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="font-medium text-sm text-gray-900">Data Exfiltration</div>
                <div class="text-xs text-gray-500 mt-1">Hunt for abnormal data transfer patterns</div>
              </button>
              
              <button class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="font-medium text-sm text-gray-900">Living Off The Land</div>
                <div class="text-xs text-gray-500 mt-1">Detect abuse of legitimate system tools</div>
              </div>
              
              <button class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="font-medium text-sm text-gray-900">Persistence Mechanisms</div>
                <div class="text-xs text-gray-500 mt-1">Hunt for various persistence techniques</div>
              </button>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-200">
              <h3 class="font-medium text-gray-900 mb-3">Saved Hunts</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span class="text-sm text-gray-900">Suspicious PowerShell</span>
                  <button class="text-blue-600 hover:text-blue-800 text-sm">Load</button>
                </div>
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span class="text-sm text-gray-900">Beacon Analysis</span>
                  <button class="text-blue-600 hover:text-blue-800 text-sm">Load</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Hunt Results -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Results Table -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Hunt Results</h2>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">23 Findings</span>
              <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                <div class="flex-1">
                  <div class="flex items-center mb-1">
                    <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                    <span class="font-medium text-sm">Suspicious Login Pattern</span>
                    <span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High</span>
                  </div>
                  <p class="text-xs text-gray-600">User: admin@company.com from 192.168.1.100</p>
                  <p class="text-xs text-gray-500">15 failed attempts in 2 minutes</p>
                </div>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Investigate</button>
              </div>
              
              <div class="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div class="flex-1">
                  <div class="flex items-center mb-1">
                    <i class="fas fa-network-wired text-orange-600 mr-2"></i>
                    <span class="font-medium text-sm">Abnormal Network Traffic</span>
                    <span class="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Medium</span>
                  </div>
                  <p class="text-xs text-gray-600">Endpoint: WKS-001 → 185.234.72.45:443</p>
                  <p class="text-xs text-gray-500">Continuous beaconing detected</p>
                </div>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Investigate</button>
              </div>
              
              <div class="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <div class="flex-1">
                  <div class="flex items-center mb-1">
                    <i class="fas fa-terminal text-yellow-600 mr-2"></i>
                    <span class="font-medium text-sm">PowerShell Execution</span>
                    <span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Medium</span>
                  </div>
                  <p class="text-xs text-gray-600">Host: SRV-002, Encoded command detected</p>
                  <p class="text-xs text-gray-500">Base64 encoded PowerShell script</p>
                </div>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Investigate</button>
              </div>
            </div>
            
            <div class="mt-6 text-center">
              <button class="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View All Results (23) →
              </button>
            </div>
          </div>
        </div>
        
        <!-- Investigation Timeline -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Investigation Timeline</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  15:42
                </div>
                <div class="flex-1 border-l-2 border-red-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-red-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Hunt Initiated</span>
                  </div>
                  <p class="text-xs text-gray-600">Lateral movement detection hunt started</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  15:43
                </div>
                <div class="flex-1 border-l-2 border-blue-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-blue-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Data Processing</span>
                  </div>
                  <p class="text-xs text-gray-600">Analyzing 2.3M events across 247 hosts</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  15:45
                </div>
                <div class="flex-1 border-l-2 border-orange-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-orange-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Anomalies Detected</span>
                  </div>
                  <p class="text-xs text-gray-600">23 suspicious activities identified</p>
                </div>
              </div>
              
              <div class="flex">
                <div class="flex-shrink-0 w-16 text-xs text-gray-500 text-right pr-4 pt-1">
                  15:46
                </div>
                <div class="flex-1 border-l-2 border-green-500 pl-4 pb-4">
                  <div class="flex items-center mb-1">
                    <div class="h-2 w-2 bg-green-500 rounded-full mr-2 -ml-5"></div>
                    <span class="font-medium text-sm">Hunt Completed</span>
                  </div>
                  <p class="text-xs text-gray-600">Results available for investigation</p>
                </div>
              </div>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 class="font-medium text-blue-900 mb-2">Hunt Statistics</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-blue-700">Events Analyzed:</p>
                  <p class="font-bold text-blue-900">2,347,832</p>
                </div>
                <div>
                  <p class="text-blue-700">Execution Time:</p>
                  <p class="font-bold text-blue-900">2.3 seconds</p>
                </div>
                <div>
                  <p class="text-blue-700">Data Sources:</p>
                  <p class="font-bold text-blue-900">5 connected</p>
                </div>
                <div>
                  <p class="text-blue-700">Coverage:</p>
                  <p class="font-bold text-blue-900">247 hosts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Intelligence Feeds Management Page
const renderFeedsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Intelligence Feeds</h1>
            <p class="mt-2 text-lg text-gray-600">Threat intelligence data sources and feed management</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>Add Feed
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-sync-alt mr-2"></i>Sync All
            </button>
          </div>
        </div>
      </div>
      
      <!-- Feed Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-rss text-3xl text-blue-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">18</p>
          <p class="text-sm text-gray-500">Total Feeds</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-check-circle text-3xl text-green-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">16</p>
          <p class="text-sm text-gray-500">Active Feeds</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">2</p>
          <p class="text-sm text-gray-500">Failed Feeds</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-database text-3xl text-purple-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">847K</p>
          <p class="text-sm text-gray-500">Records Today</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-clock text-3xl text-orange-500 mb-3"></i>
          <p class="text-2xl font-bold text-gray-900">5m</p>
          <p class="text-sm text-gray-500">Avg Update Time</p>
        </div>
      </div>
      
      <!-- Feed Categories -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Commercial Feeds -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Commercial Feeds</h2>
            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">6/6 Active</span>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">CrowdStrike Falcon Intel</p>
                    <p class="text-xs text-gray-500">Updated 5m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">47K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">FireEye Threat Intel</p>
                    <p class="text-xs text-gray-500">Updated 12m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">23K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">Recorded Future</p>
                    <p class="text-xs text-gray-500">Updated 8m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">89K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Government Feeds -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Government Feeds</h2>
            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">5/5 Active</span>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">CISA AIS</p>
                    <p class="text-xs text-gray-500">Updated 15m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">1.2K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">US-CERT Alerts</p>
                    <p class="text-xs text-gray-500">Updated 32m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">487</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">FBI Flash Reports</p>
                    <p class="text-xs text-gray-500">Updated 1h ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">156</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Open Source Feeds -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Open Source Feeds</h2>
            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">5/7 Active</span>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">MISP Communities</p>
                    <p class="text-xs text-gray-500">Updated 18m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">12K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">AlienVault OTX</p>
                    <p class="text-xs text-gray-500">Updated 25m ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-green-600">34K</p>
                  <p class="text-xs text-gray-500">IOCs</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div class="flex items-center">
                  <div class="h-3 w-3 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <p class="font-medium text-sm">ThreatFox</p>
                    <p class="text-xs text-gray-500">Error 2h ago</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-red-600">Failed</p>
                  <p class="text-xs text-gray-500">API Error</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Feed Management -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Feed Management</h2>
          <div class="flex items-center space-x-2">
            <input type="search" placeholder="Search feeds..." class="px-3 py-1 border border-gray-300 rounded text-sm">
            <select class="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Failed</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Update</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
                    <div>
                      <p class="font-medium text-sm">CrowdStrike Falcon Intel</p>
                      <p class="text-xs text-gray-500">Premium commercial feed</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Commercial</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">47,234</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 min ago</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">in 10 min</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">Config</button>
                  <button class="text-green-600 hover:text-green-900">Sync</button>
                  <button class="text-red-600 hover:text-red-900">Disable</button>
                </td>
              </tr>
              
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-flag-usa text-red-500 mr-3"></i>
                    <div>
                      <p class="font-medium text-sm">CISA AIS</p>
                      <p class="text-xs text-gray-500">Government threat intelligence</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Government</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,247</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15 min ago</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">in 45 min</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">Config</button>
                  <button class="text-green-600 hover:text-green-900">Sync</button>
                  <button class="text-red-600 hover:text-red-900">Disable</button>
                </td>
              </tr>
              
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    <div>
                      <p class="font-medium text-sm">ThreatFox</p>
                      <p class="text-xs text-gray-500">IOC sharing platform</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Open Source</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Retry pending</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button class="text-blue-600 hover:text-blue-900">Config</button>
                  <button class="text-orange-600 hover:text-orange-900">Retry</button>
                  <button class="text-red-600 hover:text-red-900">Disable</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              <i class="fas fa-sync-alt mr-2"></i>Sync All Active
            </button>
            <button class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
              <i class="fas fa-redo mr-2"></i>Retry Failed
            </button>
          </div>
          
          <div class="text-sm text-gray-500">
            Next scheduled sync: 8 minutes
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Threat Reports Page  
const renderReportsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Threat Reports</h1>
            <p class="mt-2 text-lg text-gray-600">Automated threat intelligence reports and analysis</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>Generate Report
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-calendar mr-2"></i>Schedule Report
            </button>
          </div>
        </div>
      </div>
      
      <!-- Report Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Reports Generated</p>
              <p class="text-3xl font-bold">47</p>
            </div>
            <i class="fas fa-chart-bar text-3xl text-blue-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Automated Reports</p>
              <p class="text-3xl font-bold">23</p>
            </div>
            <i class="fas fa-robot text-3xl text-green-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Scheduled Reports</p>
              <p class="text-3xl font-bold">12</p>
            </div>
            <i class="fas fa-calendar-alt text-3xl text-purple-200"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Export Formats</p>
              <p class="text-3xl font-bold">5</p>
            </div>
            <i class="fas fa-file-export text-3xl text-orange-200"></i>
          </div>
        </div>
      </div>
      
      <!-- Report Generation -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Quick Report Generator -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Generate Threat Report</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Executive Summary</option>
                  <option>Technical Analysis</option>
                  <option>IOC Report</option>
                  <option>Campaign Analysis</option>
                  <option>Threat Landscape</option>
                  <option>Custom Report</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Custom Range</option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Threat Categories</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input type="checkbox" checked class="rounded border-gray-300">
                    <span class="ml-2 text-sm text-gray-700">Malware</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" checked class="rounded border-gray-300">
                    <span class="ml-2 text-sm text-gray-700">Phishing</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300">
                    <span class="ml-2 text-sm text-gray-700">Ransomware</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300">
                    <span class="ml-2 text-sm text-gray-700">APT Activity</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input type="radio" name="format" value="pdf" checked class="text-blue-600">
                    <span class="ml-2 text-sm text-gray-700">PDF Report</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="format" value="docx" class="text-blue-600">
                    <span class="ml-2 text-sm text-gray-700">Word Document</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="format" value="json" class="text-blue-600">
                    <span class="ml-2 text-sm text-gray-700">JSON Data</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="format" value="csv" class="text-blue-600">
                    <span class="ml-2 text-sm text-gray-700">CSV Export</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Additional Options</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="flex items-center">
                  <input type="checkbox" checked class="rounded border-gray-300">
                  <span class="ml-2 text-sm text-gray-700">Include IOCs</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" checked class="rounded border-gray-300">
                  <span class="ml-2 text-sm text-gray-700">Include MITRE ATT&CK</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300">
                  <span class="ml-2 text-sm text-gray-700">Include Attribution</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300">
                  <span class="ml-2 text-sm text-gray-700">Include Recommendations</span>
                </label>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                <i class="fas fa-chart-bar mr-2"></i>Generate Report
              </button>
              <div class="text-sm text-gray-500">
                Estimated generation time: ~30 seconds
              </div>
            </div>
          </div>
        </div>
        
        <!-- Report Templates -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Report Templates</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-sm text-gray-900">Executive Briefing</h3>
                  <i class="fas fa-user-tie text-blue-500"></i>
                </div>
                <p class="text-xs text-gray-600">High-level threat landscape summary for executives</p>
              </button>
              
              <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-sm text-gray-900">Technical Deep Dive</h3>
                  <i class="fas fa-microscope text-green-500"></i>
                </div>
                <p class="text-xs text-gray-600">Detailed technical analysis with IOCs and TTPs</p>
              </button>
              
              <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-sm text-gray-900">IOC Watchlist</h3>
                  <i class="fas fa-list-ul text-purple-500"></i>
                </div>
                <p class="text-xs text-gray-600">Comprehensive IOC list with threat context</p>
              </button>
              
              <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-sm text-gray-900">Incident Response</h3>
                  <i class="fas fa-fire-extinguisher text-red-500"></i>
                </div>
                <p class="text-xs text-gray-600">Actionable incident response playbook</p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Reports -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Recent Reports</h2>
          <div class="flex items-center space-x-2">
            <select class="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>All Reports</option>
              <option>Executive Summary</option>
              <option>Technical Analysis</option>
              <option>IOC Reports</option>
            </select>
            <button class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-filter"></i>
            </button>
          </div>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div class="p-6 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <i class="fas fa-file-pdf text-red-500 mr-3"></i>
                  <h3 class="font-semibold text-gray-900">Weekly Threat Intelligence Report</h3>
                  <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Executive</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Comprehensive analysis of threats observed during Jan 15-22, 2024</p>
                <div class="flex items-center text-sm text-gray-500 space-x-4">
                  <span><i class="fas fa-calendar mr-1"></i>Generated: Jan 22, 2024</span>
                  <span><i class="fas fa-download mr-1"></i>Downloaded: 23 times</span>
                  <span><i class="fas fa-file-alt mr-1"></i>47 pages</span>
                </div>
              </div>
              <div class="ml-6 flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded text-sm">
                  View
                </button>
                <button class="text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded text-sm">
                  Download
                </button>
              </div>
            </div>
          </div>
          
          <div class="p-6 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <i class="fas fa-file-alt text-blue-500 mr-3"></i>
                  <h3 class="font-semibold text-gray-900">LokiBot Campaign Analysis</h3>
                  <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Technical</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Deep dive analysis of the recent LokiBot banking malware campaign</p>
                <div class="flex items-center text-sm text-gray-500 space-x-4">
                  <span><i class="fas fa-calendar mr-1"></i>Generated: Jan 20, 2024</span>
                  <span><i class="fas fa-download mr-1"></i>Downloaded: 156 times</span>
                  <span><i class="fas fa-file-alt mr-1"></i>23 pages</span>
                </div>
              </div>
              <div class="ml-6 flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded text-sm">
                  View
                </button>
                <button class="text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded text-sm">
                  Download
                </button>
              </div>
            </div>
          </div>
          
          <div class="p-6 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <i class="fas fa-file-csv text-green-500 mr-3"></i>
                  <h3 class="font-semibold text-gray-900">January IOC Export</h3>
                  <span class="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">IOC Report</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Complete IOC database export for January 2024 - 8,741 indicators</p>
                <div class="flex items-center text-sm text-gray-500 space-x-4">
                  <span><i class="fas fa-calendar mr-1"></i>Generated: Jan 18, 2024</span>
                  <span><i class="fas fa-download mr-1"></i>Downloaded: 89 times</span>
                  <span><i class="fas fa-database mr-1"></i>8.7K records</span>
                </div>
              </div>
              <div class="ml-6 flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded text-sm">
                  View
                </button>
                <button class="text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded text-sm">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            Showing 3 of 47 reports
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <span class="px-3 py-2 text-sm text-gray-700">Page 1 of 16</span>
            <button class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;