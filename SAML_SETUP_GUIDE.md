# SAML Authentication Setup Guide for ARIA5

## 🔐 How SAML Login Works in ARIA5

ARIA5 now supports enterprise Single Sign-On (SSO) through SAML 2.0 authentication. Once configured by an administrator, users will see an **"Sign In with Enterprise SSO"** button on the login page.

## 🎯 **Live Demo URLs**

- **🌐 Login Page**: https://grc.aria5.pages.dev/login
- **⚙️ SAML Configuration** (Admin Required): Admin → Settings → System Settings → SAML Configuration
- **🔧 SAML Config API**: https://grc.aria5.pages.dev/api/saml/config

## 📋 **SAML Configuration Steps**

### Step 1: Admin Login
1. Navigate to https://grc.aria5.pages.dev/login
2. Use demo admin account: `admin` / `demo123`
3. Go to Admin → Settings in the top navigation

### Step 2: Configure SAML Settings
Navigate to **System Settings** → **SAML Configuration** tab and configure:

#### **Required Fields:**
- ✅ **Enable SAML**: Check to enable SSO authentication
- ✅ **Entity ID**: Your application identifier (e.g., `aria5-platform`)
- ✅ **SSO URL**: Your Identity Provider's login URL
- ✅ **SLO URL**: Your Identity Provider's logout URL (optional)
- ✅ **Certificate**: Your IdP's public certificate (optional for demo)

#### **User Attributes Mapping:**
- **Email**: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`
- **First Name**: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`
- **Last Name**: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname`
- **Role**: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role`

#### **Auto-Provisioning:**
- ✅ **Auto-Provision Users**: Automatically create accounts for new SAML users
- ✅ **Default Role**: Default role for new users (`user`, `risk_manager`, etc.)

### Step 3: Identity Provider Setup
Configure your Identity Provider (Azure AD, Okta, etc.) with:

- **ACS URL**: `https://grc.aria5.pages.dev/api/saml/callback`
- **Entity ID**: `aria5-platform` (or your configured value)
- **Name ID Format**: Email Address
- **Signature Algorithm**: RSA-SHA256

## 🔄 **User Login Flow**

### When SAML is Enabled:
1. **Login Page**: Users see both "Enterprise SSO" and "Local Account" options
2. **SSO Button**: Click "Sign In with Enterprise SSO"
3. **Redirect**: User is redirected to their Identity Provider
4. **Authentication**: User logs in with corporate credentials
5. **Callback**: IdP sends SAML response to ARIA5
6. **Account Creation**: New users are auto-created (if enabled)
7. **JWT Token**: ARIA5 generates JWT token for session
8. **Dashboard Access**: User is redirected to main dashboard

### When SAML is Disabled:
- Only local authentication form is visible
- Users login with username/password

## 🧪 **Testing SAML Configuration**

### Test with Demo Configuration:
```bash
# Configure SAML for testing
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "enabled": true,
    "entity_id": "aria5-platform",
    "sso_url": "https://demo-idp.example.com/sso",
    "slo_url": "https://demo-idp.example.com/slo", 
    "auto_provision": true,
    "default_role": "user"
  }' \
  https://grc.aria5.pages.dev/api/saml/config
```

### Check SSO URL Generation:
```bash
curl https://grc.aria5.pages.dev/api/saml/sso-url
```

Expected response:
```json
{
  "success": true,
  "sso_url": "https://demo-idp.example.com/sso?SAMLRequest=...",
  "entity_id": "aria5-platform"
}
```

## 📡 **API Endpoints**

### SAML Configuration Management:
- **GET** `/api/saml/config` - Get current SAML configuration
- **POST** `/api/saml/config` - Save SAML configuration (admin only)
- **DELETE** `/api/saml/config` - Disable SAML authentication (admin only)

### SAML Authentication Flow:
- **GET** `/api/saml/sso-url` - Generate SSO login URL
- **POST** `/api/saml/callback` - Handle SAML response from IdP
- **GET** `/api/saml/logout` - Handle SAML logout

## 🔒 **Security Features**

### Authentication Security:
- ✅ **JWT Integration**: SAML users get same JWT tokens as local users
- ✅ **Role Mapping**: SAML attributes mapped to ARIA5 roles
- ✅ **Session Management**: Proper session cleanup on logout
- ✅ **Auto-Provisioning**: Secure user creation from SAML assertions

### SAML Security:
- ✅ **Entity ID Validation**: Proper issuer validation
- ✅ **Callback URL Protection**: Fixed callback endpoint
- ✅ **Certificate Support**: X.509 certificate validation (when configured)
- ✅ **Logout Support**: Proper SAML logout with IdP coordination

## 🎯 **Production Integration Examples**

### Azure Active Directory:
```xml
<!-- Azure AD SAML Configuration -->
<EntityID>aria5-platform</EntityID>
<AssertionConsumerServiceURL>https://grc.aria5.pages.dev/api/saml/callback</AssertionConsumerServiceURL>
<SingleSignOnServiceURL>https://login.microsoftonline.com/TENANT_ID/saml2</SingleSignOnServiceURL>
```

### Okta:
```xml
<!-- Okta SAML Configuration -->
<EntityID>aria5-platform</EntityID>  
<AssertionConsumerServiceURL>https://grc.aria5.pages.dev/api/saml/callback</AssertionConsumerServiceURL>
<SingleSignOnServiceURL>https://dev-123456.okta.com/app/aria5/sso/saml</SingleSignOnServiceURL>
```

### Google Workspace:
```xml
<!-- Google SAML Configuration -->
<EntityID>aria5-platform</EntityID>
<AssertionConsumerServiceURL>https://grc.aria5.pages.dev/api/saml/callback</AssertionConsumerServiceURL>
<SingleSignOnServiceURL>https://accounts.google.com/o/saml2/idp</SingleSignOnServiceURL>
```

## ✅ **Current Status**

- ✅ **SAML Configuration UI**: Complete admin interface for SAML setup
- ✅ **Login Page Integration**: Dynamic SSO button based on configuration
- ✅ **Authentication Flow**: Full SAML AuthnRequest → Response → JWT flow
- ✅ **User Provisioning**: Automatic account creation from SAML assertions
- ✅ **Session Management**: Proper login/logout with IdP coordination
- ✅ **API Integration**: Complete REST API for SAML management
- ✅ **Security**: Production-ready with proper validation and error handling

## 🚀 **Ready for Enterprise Deployment**

ARIA5's SAML authentication system is **production-ready** and supports:
- Major Identity Providers (Azure AD, Okta, Google, etc.)
- Auto-provisioning and role mapping
- Secure session management with JWT tokens
- Graceful fallback to local authentication
- Complete administrative control over SAML configuration

**🎯 Next Step**: Configure your Identity Provider and test the SSO flow!