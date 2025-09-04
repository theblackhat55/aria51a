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

  <script>
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
  </script>
</body>
</html>
`;