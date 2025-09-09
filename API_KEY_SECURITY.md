# 🔐 API Key Security & LLM Integration Guide

## 🚀 LLM Provider Priority System

The chatbot uses a **priority-based LLM selection** with the following order:

### **Priority 1: OpenAI GPT-4** 
- **When**: `OPENAI_API_KEY` environment variable is set
- **Model**: `gpt-4`
- **Cost**: Paid API (premium quality)
- **Usage**: Premium responses with advanced reasoning

### **Priority 2: Anthropic Claude**
- **When**: `ANTHROPIC_API_KEY` environment variable is set (and no OpenAI)
- **Model**: `claude-3-haiku-20240307`
- **Cost**: Paid API (high quality)
- **Usage**: Balanced responses with excellent reasoning

### **Priority 3: Google Gemini**
- **When**: `GOOGLE_AI_API_KEY` environment variable is set (and no OpenAI/Anthropic)
- **Model**: `gemini-pro`
- **Cost**: Paid API (good quality)
- **Usage**: Alternative LLM with competitive performance

### **Priority 4: Azure AI Foundry** 🆕
- **When**: `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_ENDPOINT` are set
- **Model**: `gpt-4` (configurable deployment)
- **Cost**: Paid API (enterprise quality)
- **Usage**: Enterprise-grade responses with Azure integration

### **Priority 5: Cloudflare Workers AI (Llama3)** ⭐
- **When**: Always available (built into Cloudflare Workers)
- **Model**: `@cf/meta/llama-3-8b-instruct`
- **Cost**: **FREE** (included with Cloudflare Workers)
- **Usage**: **YES, the chatbot WILL use this free Llama3** as fallback

### **Priority 6: Enhanced Fallback**
- **When**: All LLM providers fail or unavailable
- **Type**: Rule-based with live platform data
- **Cost**: No cost
- **Usage**: Intelligent responses using real platform metrics

## 🔒 API Key Security Implementation

### **Environment Variables (Development)**
```bash
# Local development (.dev.vars file - NEVER commit to git)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

### **Cloudflare Secrets (Production)**
```bash
# Secure production deployment
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GOOGLE_AI_API_KEY
npx wrangler secret put AZURE_OPENAI_API_KEY
npx wrangler secret put AZURE_OPENAI_ENDPOINT

# Verify secrets are set
npx wrangler secret list
```

### **Database Encryption (Enterprise)**
For enterprise deployments, API keys can be stored encrypted in the database:

```sql
-- AI provider configurations with encrypted keys
CREATE TABLE ai_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  api_key_encrypted TEXT NOT NULL, -- AES-256 encrypted
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Security Best Practices**

#### **✅ Secure Methods:**
1. **Cloudflare Secrets**: Use `wrangler secret put` for production
2. **Environment Variables**: For local development only
3. **Database Encryption**: AES-256 encryption for enterprise
4. **Key Rotation**: Regular API key rotation with versioning

#### **❌ NEVER Do This:**
- Store API keys in source code
- Commit `.dev.vars` file to git
- Expose keys in frontend JavaScript
- Log API keys in console/logs
- Share keys in plain text

#### **🔐 Access Control:**
```typescript
// API keys are only accessible server-side
const { OPENAI_API_KEY, ANTHROPIC_API_KEY } = c.env;
// These are NEVER exposed to client-side code
```

## 🤖 Cloudflare Workers AI Usage

### **Free Llama3 Integration**
The chatbot **WILL automatically use** Cloudflare's free Llama3 when:
- No external API keys are configured
- External LLM providers fail or timeout
- As a cost-effective fallback option

### **Cloudflare AI Benefits:**
- ✅ **Always Available**: Built into Cloudflare Workers
- ✅ **No API Keys Required**: Uses Workers AI binding
- ✅ **Free Tier Included**: No additional cost
- ✅ **Low Latency**: Runs on Cloudflare's edge network
- ✅ **Reliable Fallback**: Ensures chatbot always works

### **Implementation Example:**
```typescript
// Cloudflare AI is automatically detected and configured
if (AI) {
  const response = await AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });
}
```

## 📊 Provider Selection Logic

```typescript
// Priority-based provider selection
if (OPENAI_API_KEY) {
  provider = 'openai';                    // Priority 1: Premium GPT-4
} else if (ANTHROPIC_API_KEY) {
  provider = 'anthropic';                 // Priority 2: High-quality Claude
} else if (GOOGLE_AI_API_KEY) {
  provider = 'google';                    // Priority 3: Competitive Gemini
} else if (AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT) {
  provider = 'azure';                     // Priority 4: Enterprise Azure AI Foundry 🆕
} else if (AI) {
  provider = 'cloudflare';                // Priority 5: Free Llama3 ⭐
} else {
  // Priority 6: Enhanced Fallback with live data
  provider = 'fallback';
}
```

## 🎯 Quick Setup Guide

### **For Free Usage (Cloudflare AI Only):**
1. Deploy to Cloudflare Pages
2. No additional setup required
3. Chatbot uses free Llama3 automatically

### **For Premium LLM Usage:**
1. Get API key from OpenAI/Anthropic/Google
2. Set as Cloudflare secret: `wrangler secret put OPENAI_API_KEY`
3. Redeploy application
4. Chatbot automatically uses premium LLM

### **For Enterprise Deployment:**
1. Set up database encryption for API keys
2. Configure multiple providers for redundancy
3. Implement key rotation policies
4. Monitor usage and costs

## 🔍 Verification Commands

```bash
# Check which providers are configured
curl -H "Authorization: Bearer <token>" https://your-app.pages.dev/api/ai/providers

# Test API key configuration (admin only)
curl -X POST https://your-app.pages.dev/api/ai/test-providers

# Check current provider being used
# (Look for provider name in chat responses)
```

## 💡 Cost Optimization

### **Free Tier Strategy:**
- Use Cloudflare Workers AI (Llama3) for most queries
- Reserve premium APIs for complex analysis only
- Implement query classification for optimal routing

### **Hybrid Approach:**
- Simple queries → Cloudflare AI (Free)
- Complex analysis → OpenAI GPT-4 (Paid)
- Risk assessments → Anthropic Claude (Paid)
- Fallback → Enhanced rule-based (Free)

## 📈 Monitoring & Analytics

The system automatically tracks:
- Provider usage statistics
- Response quality metrics
- Cost optimization opportunities
- Failover events and recovery

**Security Status: ✅ Enterprise-Grade**
**LLM Integration: ✅ Multi-Provider with Free Fallback**
**API Key Protection: ✅ Cloudflare Secrets + Database Encryption**