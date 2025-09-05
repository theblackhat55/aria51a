import { html } from 'hono/html';

export const landingPage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARIA5.1 - AI Risk Intelligence Platform</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Awesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  
  <style>
    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .card-hover {
      transition: all 0.3s ease;
    }
    
    .card-hover:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    
    .animate-pulse-slow {
      animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .glass-effect {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
  
  <!-- Navigation Header -->
  <nav class="fixed w-full top-0 z-50 glass-effect">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <i class="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold gradient-text">ARIA5.1</h1>
              <p class="text-xs text-gray-600">Enterprise Edition</p>
            </div>
          </div>
        </div>
        
        <div class="hidden md:flex items-center space-x-6">
          <a href="#features" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
          <a href="#capabilities" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Capabilities</a>
          <a href="#security" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Security</a>
          <a href="#demo" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Demo</a>
        </div>
        
        <div class="flex items-center space-x-4">
          <a href="/login" class="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors">
            <i class="fas fa-sign-in-alt mr-2"></i>
            Sign In
          </a>
          <a href="#demo" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all">
            <i class="fas fa-play mr-2"></i>
            Live Demo
          </a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center">
        <!-- Animated Badge -->
        <div class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-8 animate-pulse-slow">
          <i class="fas fa-rocket text-blue-600 mr-2"></i>
          <span class="text-blue-800 font-semibold text-sm">Version 5.1 - Now with Advanced AI & RAG Analytics</span>
        </div>
        
        <!-- Main Headline -->
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI-Powered 
          <span class="gradient-text">Risk Intelligence</span>
          <br>Platform
        </h1>
        
        <!-- Subtitle -->
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Comprehensive enterprise security risk management with AI analytics, threat intelligence, 
          compliance automation, and real-time monitoring capabilities.
        </p>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
          <a href="#demo" 
             class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg">
            <i class="fas fa-play mr-3"></i>
            Try Live Demo
          </a>
          <a href="/login" 
             class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all">
            <i class="fas fa-sign-in-alt mr-3"></i>
            Access Platform
          </a>
        </div>
        
        <!-- Platform Preview -->
        <div class="relative max-w-5xl mx-auto">
          <div class="bg-white rounded-2xl shadow-2xl p-2 animate-float">
            <div class="bg-gray-900 rounded-xl overflow-hidden">
              <div class="flex items-center space-x-2 p-4 bg-gray-800">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <div class="ml-4 text-gray-300 text-sm font-mono">aria5-1.aria51-htmx.pages.dev</div>
              </div>
              <div class="h-96 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
                <div class="text-center text-white">
                  <i class="fas fa-shield-alt text-6xl mb-4 opacity-50"></i>
                  <h3 class="text-2xl font-bold mb-2">ARIA5.1 Dashboard</h3>
                  <p class="text-blue-200">Risk Intelligence • AI Analytics • Threat Detection</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Floating Feature Cards -->
          <div class="absolute -top-8 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float" style="animation-delay: 1s;">
            <div class="flex items-center space-x-2">
              <i class="fas fa-brain text-purple-500"></i>
              <span class="text-sm font-semibold text-gray-700">AI Analytics</span>
            </div>
          </div>
          
          <div class="absolute -top-8 -right-4 bg-white rounded-lg shadow-lg p-4 animate-float" style="animation-delay: 2s;">
            <div class="flex items-center space-x-2">
              <i class="fas fa-shield-virus text-red-500"></i>
              <span class="text-sm font-semibold text-gray-700">Threat Intel</span>
            </div>
          </div>
          
          <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 animate-float" style="animation-delay: 0.5s;">
            <div class="flex items-center space-x-2">
              <i class="fas fa-chart-line text-green-500"></i>
              <span class="text-sm font-semibold text-gray-700">Real-time Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Complete Risk Management Suite
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          ARIA5.1 provides comprehensive tools for enterprise security risk management, 
          powered by advanced AI and real-time intelligence.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- AI & RAG Analytics -->
        <div class="card-hover bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-100">
          <div class="h-12 w-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-brain text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">AI Analytics & RAG</h3>
          <p class="text-gray-600 mb-4">
            Advanced AI-powered analytics with Retrieval-Augmented Generation for intelligent 
            risk assessment and contextual insights across all platform data.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• Cloudflare Llama3 AI fallback</li>
            <li>• Platform data indexing & retrieval</li>
            <li>• Contextual ARIA chatbot</li>
            <li>• Real-time AI analytics dashboard</li>
          </ul>
        </div>
        
        <!-- Risk Management -->
        <div class="card-hover bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 border border-red-100">
          <div class="h-12 w-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-exclamation-triangle text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Risk Assessment</h3>
          <p class="text-gray-600 mb-4">
            Comprehensive risk identification, assessment, and mitigation tracking 
            with automated scoring and real-time monitoring.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• Dynamic risk scoring algorithms</li>
            <li>• Risk register management</li>
            <li>• Mitigation tracking</li>
            <li>• Impact & probability matrices</li>
          </ul>
        </div>
        
        <!-- Threat Intelligence -->
        <div class="card-hover bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-100">
          <div class="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-shield-virus text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Threat Intelligence</h3>
          <p class="text-gray-600 mb-4">
            Real-time threat detection and intelligence gathering with IOC management 
            and automated threat hunting capabilities.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• IOC & threat feed management</li>
            <li>• Campaign attribution tracking</li>
            <li>• Automated threat hunting</li>
            <li>• Intelligence report generation</li>
          </ul>
        </div>
        
        <!-- Operations Center -->
        <div class="card-hover bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border border-green-100">
          <div class="h-12 w-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-cogs text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Operations Center</h3>
          <p class="text-gray-600 mb-4">
            Centralized asset and service management with security classification 
            and operational status monitoring.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• Asset inventory & classification</li>
            <li>• Service management</li>
            <li>• Security controls tracking</li>
            <li>• Operational dashboards</li>
          </ul>
        </div>
        
        <!-- Compliance Framework -->
        <div class="card-hover bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
          <div class="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-clipboard-check text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Compliance Management</h3>
          <p class="text-gray-600 mb-4">
            Automated compliance monitoring and reporting for multiple frameworks 
            including SOC 2, ISO 27001, and custom standards.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• Multi-framework support</li>
            <li>• Automated evidence collection</li>
            <li>• Assessment scheduling</li>
            <li>• Compliance reporting</li>
          </ul>
        </div>
        
        <!-- Admin & Analytics -->
        <div class="card-hover bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-8 border border-yellow-100">
          <div class="h-12 w-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-6">
            <i class="fas fa-chart-bar text-white text-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Admin & Analytics</h3>
          <p class="text-gray-600 mb-4">
            Comprehensive administration tools with advanced analytics, 
            user management, and system configuration capabilities.
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• Optimized admin dashboard</li>
            <li>• AI provider management</li>
            <li>• Knowledge base management</li>
            <li>• System analytics & reports</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Demo Section -->
  <section id="demo" class="py-20 gradient-bg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center text-white">
        <h2 class="text-3xl md:text-4xl font-bold mb-8">
          Experience ARIA5.1 Live Demo
        </h2>
        <p class="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
          Try our full-featured demo environment with sample data and explore 
          all platform capabilities without any setup required.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Admin Demo -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <i class="fas fa-user-shield text-white text-xl"></i>
            </div>
            <h3 class="text-lg font-bold mb-2">Administrator</h3>
            <p class="text-blue-100 text-sm mb-4">Full system access with admin privileges</p>
            <button onclick="loginDemo('admin', 'demo123')" 
                    class="w-full bg-white text-blue-600 rounded-lg py-2 font-semibold hover:bg-blue-50 transition-colors">
              Login as Admin
            </button>
          </div>
          
          <!-- Risk Manager Demo -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <i class="fas fa-exclamation-triangle text-white text-xl"></i>
            </div>
            <h3 class="text-lg font-bold mb-2">Risk Manager</h3>
            <p class="text-blue-100 text-sm mb-4">Risk assessment and management tools</p>
            <button onclick="loginDemo('avi_security', 'demo123')" 
                    class="w-full bg-white text-blue-600 rounded-lg py-2 font-semibold hover:bg-blue-50 transition-colors">
              Login as Risk Manager
            </button>
          </div>
          
          <!-- Compliance Officer Demo -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <i class="fas fa-clipboard-check text-white text-xl"></i>
            </div>
            <h3 class="text-lg font-bold mb-3">Compliance Officer</h3>
            <p class="text-blue-100 text-sm mb-4">Compliance monitoring and reporting</p>
            <button onclick="loginDemo('sjohnson', 'demo123')" 
                    class="w-full bg-white text-blue-600 rounded-lg py-2 font-semibold hover:bg-blue-50 transition-colors">
              Login as Compliance Officer
            </button>
          </div>
        </div>
        
        <div class="text-center">
          <a href="/login" 
             class="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg">
            <i class="fas fa-sign-in-alt mr-3"></i>
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Security & Capabilities -->
  <section id="security" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Enterprise-Grade Security & Performance
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Built on Cloudflare's global edge network with enterprise security standards 
          and high-performance architecture.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div class="text-center">
          <div class="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <i class="fas fa-cloud text-blue-600 text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900 mb-2">Cloudflare Edge</h3>
          <p class="text-gray-600 text-sm">Global edge deployment for maximum performance</p>
        </div>
        
        <div class="text-center">
          <div class="h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <i class="fas fa-database text-green-600 text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900 mb-2">D1 Database</h3>
          <p class="text-gray-600 text-sm">Distributed SQLite with global replication</p>
        </div>
        
        <div class="text-center">
          <div class="h-16 w-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <i class="fas fa-shield-alt text-purple-600 text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900 mb-2">Enterprise Security</h3>
          <p class="text-gray-600 text-sm">SOC 2 compliant with advanced protection</p>
        </div>
        
        <div class="text-center">
          <div class="h-16 w-16 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <i class="fas fa-rocket text-red-600 text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900 mb-2">High Performance</h3>
          <p class="text-gray-600 text-sm">Sub-100ms response times globally</p>
        </div>
      </div>
      
      <!-- Tech Stack -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Technology Stack</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fab fa-js-square text-yellow-500 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">TypeScript</span>
          </div>
          
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fas fa-fire text-orange-500 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">Hono</span>
          </div>
          
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fas fa-bolt text-blue-500 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">HTMX</span>
          </div>
          
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fas fa-palette text-cyan-500 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">Tailwind CSS</span>
          </div>
          
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fas fa-database text-blue-600 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">Cloudflare D1</span>
          </div>
          
          <div class="text-center">
            <div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <i class="fas fa-brain text-purple-600 text-xl"></i>
            </div>
            <span class="text-sm font-medium text-gray-700">AI/RAG</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <i class="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold">ARIA5.1</h3>
              <p class="text-gray-400 text-sm">Enterprise Risk Intelligence Platform</p>
            </div>
          </div>
          <p class="text-gray-400 mb-4">
            Advanced AI-powered risk management and threat intelligence platform 
            designed for enterprise security operations.
          </p>
          <div class="flex space-x-4">
            <a href="/health" class="text-gray-400 hover:text-white transition-colors">
              <i class="fas fa-heartbeat"></i> Health Check
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <i class="fab fa-github"></i> GitHub
            </a>
          </div>
        </div>
        
        <div>
          <h4 class="font-bold mb-4">Platform</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
            <li><a href="#demo" class="hover:text-white transition-colors">Live Demo</a></li>
            <li><a href="/login" class="hover:text-white transition-colors">Login</a></li>
            <li><a href="/health" class="hover:text-white transition-colors">System Status</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-bold mb-4">Resources</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" class="hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Support</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Release Notes</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
        <p>&copy; 2024 ARIA5.1 Platform. Powered by Cloudflare Workers + Hono + HTMX.</p>
      </div>
    </div>
  </footer>

  <!-- Enhanced AI Assistant Chatbot Widget -->
  <div id="chatbot-widget" class="fixed bottom-6 right-6 z-50">
    <!-- Notification Badge -->
    <div id="chatbot-notification" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
      <span id="notification-count">1</span>
    </div>
    
    <!-- Chatbot Toggle Button -->
    <button id="chatbot-toggle" 
            class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
      <!-- Background Animation -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      
      <!-- Main Icon -->
      <i id="chatbot-icon" class="fas fa-robot text-xl group-hover:scale-110 transition-all duration-300 z-10"></i>
      
      <!-- Pulse Animation -->
      <div class="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-20"></div>
    </button>
    
    <!-- Enhanced Chatbot Panel -->
    <div id="chatbot-panel" 
         class="hidden absolute bottom-20 right-0 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
      
      <!-- Enhanced Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-sm"></i>
            </div>
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <span class="font-semibold text-sm">ARIA Assistant</span>
            <div class="flex items-center text-xs opacity-90">
              <span class="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              Online • Powered by AI
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Minimize Button -->
          <button id="chatbot-minimize" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Minimize">
            <i class="fas fa-minus text-xs"></i>
          </button>
          <!-- Close Button -->
          <button id="chatbot-close" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Close">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
      
      <!-- Quick Actions Bar -->
      <div id="quick-actions" class="bg-gray-50 p-3 border-b border-gray-200">
        <div class="flex space-x-2 overflow-x-auto">
          <button class="quick-action-btn" data-prompt="Tell me about ARIA5.1 platform features">
            <i class="fas fa-info-circle text-blue-500"></i>
            <span>Platform Info</span>
          </button>
          <button class="quick-action-btn" data-prompt="How do I get started with ARIA5.1?">
            <i class="fas fa-play text-green-500"></i>
            <span>Get Started</span>
          </button>
          <button class="quick-action-btn" data-prompt="What security features does ARIA5.1 have?">
            <i class="fas fa-shield-alt text-red-500"></i>
            <span>Security</span>
          </button>
          <button class="quick-action-btn" data-prompt="Show me a demo of the platform">
            <i class="fas fa-eye text-purple-500"></i>
            <span>Demo</span>
          </button>
        </div>
      </div>
      
      <!-- Messages Area -->
      <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <!-- Welcome Message -->
        <div class="message-container assistant-message">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-blue-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div class="flex items-center mb-2">
                  <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                  <span class="ml-2 text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed">
                  👋 Hello! I'm ARIA, your AI-powered risk intelligence assistant. Welcome to ARIA5.1!
                </p>
                <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-blue-50 p-2 rounded-lg">
                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                    <span class="text-blue-700">Platform Features</span>
                  </div>
                  <div class="bg-green-50 p-2 rounded-lg">
                    <i class="fas fa-play text-green-500 mr-1"></i>
                    <span class="text-green-700">Getting Started</span>
                  </div>
                  <div class="bg-red-50 p-2 rounded-lg">
                    <i class="fas fa-shield-alt text-red-500 mr-1"></i>
                    <span class="text-red-700">Security Info</span>
                  </div>
                  <div class="bg-purple-50 p-2 rounded-lg">
                    <i class="fas fa-eye text-purple-500 mr-1"></i>
                    <span class="text-purple-700">Live Demo</span>
                  </div>
                </div>
                <p class="text-gray-600 text-xs mt-3">
                  💡 Try the quick actions above or ask me anything about ARIA5.1!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Typing Indicator -->
      <div id="typing-indicator" class="hidden px-4 py-2">
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
          <div class="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
            <div class="flex items-center space-x-1">
              <span class="text-gray-500 text-sm">ARIA is typing</span>
              <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Input Area -->
      <div class="border-t border-gray-200 p-4 bg-white">
        <!-- Suggested Replies -->
        <div id="suggested-replies" class="hidden mb-3">
          <div class="flex flex-wrap gap-1">
            <!-- Dynamic suggestions will be added here -->
          </div>
        </div>
        
        <!-- Input Form -->
        <form id="chatbot-form" class="relative">
          <div class="flex items-end space-x-2">
            <div class="flex-1 relative">
              <textarea id="chatbot-input" 
                       placeholder="Ask ARIA about ARIA5.1 platform..." 
                       rows="1"
                       class="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                       style="max-height: 120px;"></textarea>
              
              <!-- Character Counter -->
              <div id="char-counter" class="absolute bottom-1 right-1 text-xs text-gray-400 hidden">
                <span id="char-count">0</span>/500
              </div>
            </div>
            
            <!-- Send Button -->
            <button type="submit" 
                    id="send-button"
                    disabled
                    class="bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed">
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
          
          <!-- Input Actions -->
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div class="flex items-center space-x-3">
              <button type="button" id="voice-input" class="hover:text-blue-500 transition-colors" title="Voice Input">
                <i class="fas fa-microphone"></i>
              </button>
              <button type="button" id="attach-file" class="hover:text-blue-500 transition-colors" title="Attach File">
                <i class="fas fa-paperclip"></i>
              </button>
              <button type="button" id="clear-chat" class="hover:text-red-500 transition-colors" title="Clear Chat">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="flex items-center space-x-1">
              <span>Press ⏎ to send</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>

  <style>
    /* Enhanced Chatbot Styles */
    .quick-action-btn {
      @apply flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 whitespace-nowrap cursor-pointer;
    }
    .quick-action-btn i {
      @apply text-xs;
    }
    
    /* Typing animation */
    .typing-dots {
      @apply flex items-center space-x-1;
    }
    .typing-dot {
      @apply w-2 h-2 bg-gray-400 rounded-full;
      animation: typing 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
    }
    
    /* Message animations */
    .message-container {
      animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Auto-resize textarea */
    #chatbot-input {
      transition: height 0.2s ease;
      min-height: 48px;
    }
    
    /* Enhanced panel animations */
    #chatbot-panel.show {
      display: flex !important;
      animation: chatbotSlideIn 0.3s ease-out forwards;
    }
    
    #chatbot-panel.hide {
      animation: chatbotSlideOut 0.2s ease-in forwards;
    }
    
    @keyframes chatbotSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes chatbotSlideOut {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
    }
  </style>

  <script>
    // Enhanced Chatbot Widget with Modern Features
    class EnhancedChatbot {
      constructor() {
        this.isOpen = false;
        this.conversationHistory = JSON.parse(localStorage.getItem('aria_chat_history') || '[]');
        this.currentContext = '';
        this.messageCount = 0;
        this.isTyping = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConversationHistory();
        this.initializeNotifications();
      }
      
      initializeElements() {
        this.toggle = document.getElementById('chatbot-toggle');
        this.panel = document.getElementById('chatbot-panel');
        this.close = document.getElementById('chatbot-close');
        this.minimize = document.getElementById('chatbot-minimize');
        this.form = document.getElementById('chatbot-form');
        this.input = document.getElementById('chatbot-input');
        this.messages = document.getElementById('chatbot-messages');
        this.sendButton = document.getElementById('send-button');
        this.charCounter = document.getElementById('char-counter');
        this.charCount = document.getElementById('char-count');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.notification = document.getElementById('chatbot-notification');
        this.notificationCount = document.getElementById('notification-count');
        
        console.log('🤖 Enhanced ARIA Chatbot initialized on landing page');
      }
      
      bindEvents() {
        if (!this.toggle) return; // Skip if elements not found
        
        // Toggle chatbot
        this.toggle.addEventListener('click', () => this.toggleChat());
        
        // Close chatbot
        if (this.close) this.close.addEventListener('click', () => this.closeChat());
        
        // Minimize chatbot
        if (this.minimize) this.minimize.addEventListener('click', () => this.minimizeChat());
        
        // Form submission
        if (this.form) this.form.addEventListener('submit', (e) => this.handleSubmission(e));
        
        // Input events
        if (this.input) {
          this.input.addEventListener('input', () => this.handleInputChange());
          this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
        
        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
          btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });
        
        // Additional action buttons
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        document.getElementById('voice-input')?.addEventListener('click', () => this.startVoiceInput());
        
        console.log('📱 Chatbot events bound successfully');
      }
      
      toggleChat() {
        if (this.isOpen) {
          this.closeChat();
        } else {
          this.openChat();
        }
      }
      
      openChat() {
        if (!this.panel) return;
        
        this.panel.classList.remove('hidden');
        this.panel.classList.add('show');
        this.panel.classList.remove('hide');
        this.isOpen = true;
        
        // Focus input after animation
        setTimeout(() => {
          if (this.input) this.input.focus();
          this.hideNotification();
        }, 100);
        
        // Update icon
        const icon = document.getElementById('chatbot-icon');
        if (icon) icon.className = 'fas fa-comment text-xl group-hover:scale-110 transition-all duration-300 z-10';
        
        console.log('💬 Chatbot opened on landing page');
      }
      
      closeChat() {
        if (!this.panel) return;
        
        this.panel.classList.add('hide');
        this.panel.classList.remove('show');
        
        setTimeout(() => {
          this.panel.classList.add('hidden');
          this.panel.classList.remove('hide');
        }, 200);
        
        this.isOpen = false;
        
        // Reset icon
        const icon = document.getElementById('chatbot-icon');
        if (icon) icon.className = 'fas fa-robot text-xl group-hover:scale-110 transition-all duration-300 z-10';
        
        console.log('❌ Chatbot closed');
      }
      
      minimizeChat() {
        this.closeChat();
        this.showNotification('Chat minimized');
      }
      
      async handleSubmission(e) {
        e.preventDefault();
        if (!this.input) return;
        
        const query = this.input.value.trim();
        if (!query || this.isTyping) return;
        
        // Add user message
        this.addMessage(query, 'user');
        this.updateContext(query);
        this.input.value = '';
        this.updateSendButton();
        this.updateCharCounter();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // For landing page, provide demo responses
        setTimeout(() => {
          this.hideTypingIndicator();
          
          let response = '';
          if (query.toLowerCase().includes('feature') || query.toLowerCase().includes('platform')) {
            response = 'ARIA5.1 is an enterprise-grade AI Risk Intelligence Platform with advanced features including:\\n\\n• AI Analytics & RAG\\n• Risk Assessment & Management\\n• Threat Intelligence\\n• Compliance Management\\n• Operations Center\\n• Admin & Analytics\\n\\nTry our live demo by clicking the demo buttons above!';
          } else if (query.toLowerCase().includes('start') || query.toLowerCase().includes('demo')) {
            response = 'To get started with ARIA5.1:\\n\\n1. Click one of the demo buttons above (Admin, Risk Manager, or Compliance Officer)\\n2. Or click "Go to Login Page" to access the full platform\\n3. Use credentials: admin/demo123 or try the other demo accounts\\n\\nThe platform includes comprehensive risk management, AI analytics, and enterprise security features!';
          } else if (query.toLowerCase().includes('security')) {
            response = 'ARIA5.1 includes enterprise-grade security features:\\n\\n🔐 JWT Authentication with PBKDF2\\n🛡️ One-way API Key Management\\n📊 Comprehensive Audit Logging\\n🚫 Rate Limiting & Account Protection\\n⚡ Sub-100ms Security Checks\\n🔒 Database-backed Sessions\\n\\nBuilt on Cloudflare Edge for maximum security and performance!';
          } else {
            response = 'Hello! I\\'m ARIA, your AI assistant for the ARIA5.1 platform. I can help you learn about our enterprise risk intelligence features, security capabilities, and how to get started.\\n\\nTry asking me about platform features, security, or how to access the demo!';
          }
          
          this.addMessage(response, 'assistant');
          this.saveConversation(query, response);
        }, 1000);
      }
      
      handleInputChange() {
        this.updateCharCounter();
        this.updateSendButton();
        this.autoResizeTextarea();
      }
      
      handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSubmission(e);
        }
      }
      
      handleQuickAction(e) {
        const button = e.currentTarget;
        const prompt = button.dataset.prompt;
        if (prompt && this.input) {
          this.input.value = prompt;
          this.updateSendButton();
          this.updateCharCounter();
          this.input.focus();
        }
      }
      
      addMessage(text, sender, isError = false) {
        if (!this.messages) return;
        
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const isUser = sender === 'user';
        const timestamp = new Date().toLocaleTimeString();
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container ' + (isUser ? 'user-message' : 'assistant-message');
        messageContainer.id = messageId;
        
        if (isUser) {
          messageContainer.innerHTML = \`
            <div class="flex items-start space-x-3 justify-end">
              <div class="flex-1 max-w-xs">
                <div class="bg-blue-600 text-white rounded-xl p-3 shadow-sm">
                  <p class="text-sm leading-relaxed">\${this.escapeHtml(text)}</p>
                  <div class="mt-1 text-xs opacity-75">\${timestamp}</div>
                </div>
              </div>
              <div class="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
            </div>
          \`;
        } else {
          const messageClass = isError ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100';
          const iconClass = isError ? 'text-red-500' : 'text-blue-600';
          const textClass = isError ? 'text-red-700' : 'text-gray-700';
          
          messageContainer.innerHTML = \`
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-robot \${iconClass} text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="\${messageClass} rounded-xl p-3 shadow-sm">
                  <div class="flex items-center mb-2">
                    <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                    <span class="ml-2 text-xs text-gray-500">\${timestamp}</span>
                  </div>
                  <div class="\${textClass} text-sm leading-relaxed">
                    \${this.formatMessage(text)}
                  </div>
                </div>
              </div>
            </div>
          \`;
        }
        
        this.messages.appendChild(messageContainer);
        this.scrollToBottom();
        this.messageCount++;
        
        // Show notification if chat is closed
        if (!this.isOpen && !isUser) {
          this.showNotification();
        }
        
        return messageId;
      }
      
      formatMessage(text) {
        // Enhanced message formatting
        let formatted = this.escapeHtml(text);
        
        // Convert line breaks
        formatted = formatted.replace(/\\\\n/g, '<br>');
        
        // Convert URLs to links
        formatted = formatted.replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
        
        // Highlight important terms
        formatted = formatted.replace(/\\b(HIGH|CRITICAL|URGENT)\\b/gi, '<span class="bg-red-100 text-red-800 px-1 rounded">$1</span>');
        formatted = formatted.replace(/\\b(LOW|INFORMATIONAL)\\b/gi, '<span class="bg-green-100 text-green-800 px-1 rounded">$1</span>');
        formatted = formatted.replace(/\\b(MEDIUM|WARNING)\\b/gi, '<span class="bg-yellow-100 text-yellow-800 px-1 rounded">$1</span>');
        
        return formatted;
      }
      
      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      showTypingIndicator() {
        if (!this.typingIndicator) return;
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
      }
      
      hideTypingIndicator() {
        if (!this.typingIndicator) return;
        this.isTyping = false;
        this.typingIndicator.classList.add('hidden');
      }
      
      updateSendButton() {
        if (!this.sendButton || !this.input) return;
        
        const hasText = this.input.value.trim().length > 0;
        const button = this.sendButton;
        
        if (hasText && !this.isTyping) {
          button.disabled = false;
          button.className = 'bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center';
        } else {
          button.disabled = true;
          button.className = 'bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed';
        }
      }
      
      updateCharCounter() {
        if (!this.charCounter || !this.charCount || !this.input) return;
        
        const length = this.input.value.length;
        this.charCount.textContent = length;
        
        if (length > 0) {
          this.charCounter.classList.remove('hidden');
        } else {
          this.charCounter.classList.add('hidden');
        }
        
        // Change color if approaching limit
        if (length > 400) {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-red-500';
        } else if (length > 300) {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-yellow-500';
        } else {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-gray-400';
        }
      }
      
      autoResizeTextarea() {
        if (!this.input) return;
        const textarea = this.input;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      }
      
      scrollToBottom() {
        if (!this.messages) return;
        setTimeout(() => {
          this.messages.scrollTop = this.messages.scrollHeight;
        }, 100);
      }
      
      updateContext(message) {
        // Simple context tracking
        this.currentContext = message.toLowerCase().includes('risk') ? 'risk_management' :
                             message.toLowerCase().includes('compliance') ? 'compliance' :
                             message.toLowerCase().includes('security') ? 'security' : 'general';
      }
      
      saveConversation(userMessage, aiResponse) {
        const conversation = {
          timestamp: Date.now(),
          user: userMessage,
          assistant: aiResponse,
          context: this.currentContext
        };
        
        this.conversationHistory.push(conversation);
        
        // Keep only last 50 conversations
        if (this.conversationHistory.length > 50) {
          this.conversationHistory = this.conversationHistory.slice(-50);
        }
        
        localStorage.setItem('aria_chat_history', JSON.stringify(this.conversationHistory));
      }
      
      loadConversationHistory() {
        // Load recent conversations on startup (skip for landing page to keep clean)
      }
      
      showNotification(message = 'New message') {
        if (!this.notification) return;
        this.notification.classList.remove('hidden');
      }
      
      hideNotification() {
        if (!this.notification) return;
        this.notification.classList.add('hidden');
      }
      
      initializeNotifications() {
        // Check if there are unread messages
        const lastRead = localStorage.getItem('aria_last_read') || '0';
        const unreadCount = this.conversationHistory.filter(conv => 
          conv.timestamp > parseInt(lastRead)
        ).length;
        
        if (unreadCount > 0 && this.notificationCount) {
          this.notificationCount.textContent = unreadCount;
          this.showNotification();
        }
      }
      
      clearChat() {
        if (!this.messages) return;
        
        if (confirm('Are you sure you want to clear the chat history?')) {
          this.messages.innerHTML = '';
          this.conversationHistory = [];
          localStorage.removeItem('aria_chat_history');
          localStorage.removeItem('aria_last_read');
          
          console.log('🗑️ Chat history cleared');
        }
      }
      
      startVoiceInput() {
        if (!this.input) return;
        
        if ('webkitSpeechRecognition' in window) {
          const recognition = new webkitSpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            const voiceBtn = document.getElementById('voice-input');
            if (voiceBtn) voiceBtn.innerHTML = '<i class="fas fa-stop text-red-500"></i>';
          };
          
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.input.value = transcript;
            this.updateSendButton();
            this.updateCharCounter();
          };
          
          recognition.onend = () => {
            const voiceBtn = document.getElementById('voice-input');
            if (voiceBtn) voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          };
          
          recognition.start();
        } else {
          alert('Voice input is not supported in your browser.');
        }
      }
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
    
    // Demo login function
    function loginDemo(username, password) {
      // Create form data for login
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      // Submit to login endpoint
      fetch('/auth/login', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (response.ok) {
          window.location.href = '/dashboard';
        } else {
          // Fallback: redirect to login page with prefilled credentials
          window.location.href = \`/login?demo=\${username}\`;
        }
      })
      .catch(() => {
        // Fallback: redirect to login page
        window.location.href = \`/login?demo=\${username}\`;
      });
    }
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
      const nav = document.querySelector('nav');
      if (window.scrollY > 100) {
        nav.classList.add('bg-white/80');
      } else {
        nav.classList.remove('bg-white/80');
      }
    });
    
    // Initialize Enhanced Chatbot on Landing Page
    document.addEventListener('DOMContentLoaded', function() {
      window.ariaChatbot = new EnhancedChatbot();
      console.log('🚀 Enhanced ARIA Chatbot ready on landing page');
    });
  </script>
</body>
</html>
`;