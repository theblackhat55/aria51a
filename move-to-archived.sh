#!/bin/bash
# ARIA51 - Move unused files to Archived folder
# Safe archival with structure preservation

echo "🗂️  Moving unused files to Archived folder..."
echo ""

# Counter for moved files
moved_count=0

# Function to safely move file
move_file() {
    local src="$1"
    local dest_dir="$2"
    
    if [ -f "$src" ]; then
        mv "$src" "$dest_dir/"
        echo "✓ Moved: $src → $dest_dir/"
        ((moved_count++))
    fi
}

echo "📁 Moving Route Files..."
move_file "src/routes/auth-routes-cookie.ts" "Archived/routes"
move_file "src/routes/api-analytics.ts" "Archived/routes"
move_file "src/routes/api-incident-response.ts" "Archived/routes"
move_file "src/routes/api-key-routes.ts" "Archived/routes"
move_file "src/routes/api-routes.ts" "Archived/routes"
move_file "src/routes/api-service-criticality.ts" "Archived/routes"
move_file "src/routes/compliance-automation-api.ts" "Archived/routes"
move_file "src/routes/compliance-routes.ts" "Archived/routes"
move_file "src/routes/ai-compliance-api.ts" "Archived/routes"
move_file "src/routes/enhanced-risk-routes.ts" "Archived/routes"
move_file "src/routes/enterprise-multitenancy-api.ts" "Archived/routes"
move_file "src/routes/incident-response.ts" "Archived/routes"
move_file "src/routes/intelligence-settings.ts" "Archived/routes"
move_file "src/routes/ml-analytics.ts" "Archived/routes"
move_file "src/routes/policy-management-routes.ts" "Archived/routes"
move_file "src/routes/threat-intelligence.ts" "Archived/routes"

echo ""
echo "📁 Moving Static JavaScript Files..."
move_file "public/static/ai-assure-module.js" "Archived/static"
move_file "public/static/ai-grc-dashboard.js" "Archived/static"
move_file "public/static/app.js" "Archived/static"
move_file "public/static/aria-chat.js" "Archived/static"
move_file "public/static/asset-service-management.js" "Archived/static"
move_file "public/static/auth-debug.js" "Archived/static"
move_file "public/static/auth.js" "Archived/static"
move_file "public/static/chatbot-widget.js" "Archived/static"
move_file "public/static/conversational-assistant.js" "Archived/static"
move_file "public/static/dashboard.js" "Archived/static"
move_file "public/static/document-management.js" "Archived/static"
move_file "public/static/enhanced-compliance-dashboard.js" "Archived/static"
move_file "public/static/enhanced-settings.js" "Archived/static"
move_file "public/static/enterprise-modules.js" "Archived/static"
move_file "public/static/framework-management.js" "Archived/static"
move_file "public/static/helpers.js" "Archived/static"
move_file "public/static/incident-management-enhanced.js" "Archived/static"
move_file "public/static/integrated-risk-framework.js" "Archived/static"
move_file "public/static/kong-config.js" "Archived/static"
move_file "public/static/mobile-interface.js" "Archived/static"
move_file "public/static/modules.js" "Archived/static"
move_file "public/static/notifications.js" "Archived/static"
move_file "public/static/risk-enhancements.js" "Archived/static"
move_file "public/static/risk-management-enhanced.js" "Archived/static"
move_file "public/static/secure-aria.js" "Archived/static"
move_file "public/static/secure-key-manager.js" "Archived/static"
move_file "public/static/system-settings-integration.js" "Archived/static"

echo ""
echo "📁 Moving Migration Files..."
# 0002-0014 series
for file in migrations/0002*.sql migrations/0003*.sql migrations/0004*.sql \
            migrations/0005*.sql migrations/0006*.sql migrations/0007*.sql \
            migrations/0008*.sql migrations/0009*.sql migrations/0010*.sql \
            migrations/0011*.sql migrations/0012*.sql migrations/0013*.sql \
            migrations/0014*.sql; do
    if [ -f "$file" ]; then
        move_file "$file" "Archived/migrations"
    fi
done

# 0018-0022 series
for file in migrations/0018*.sql migrations/0019*.sql migrations/0020*.sql \
            migrations/0021*.sql migrations/0022*.sql; do
    if [ -f "$file" ]; then
        move_file "$file" "Archived/migrations"
    fi
done

# 0100-0112 series
for file in migrations/0100*.sql migrations/0101*.sql migrations/0102*.sql \
            migrations/0103*.sql migrations/0104*.sql migrations/0105*.sql \
            migrations/0106*.sql migrations/0107*.sql migrations/0108*.sql \
            migrations/0109*.sql migrations/0110*.sql migrations/0111*.sql \
            migrations/0112*.sql; do
    if [ -f "$file" ]; then
        move_file "$file" "Archived/migrations"
    fi
done

echo ""
echo "📁 Moving Root-Level SQL Files..."
for file in *.sql; do
    if [ -f "$file" ]; then
        move_file "$file" "Archived/root-sql"
    fi
done

echo ""
echo "📁 Moving Docs SQL Files..."
for file in docs/*.sql; do
    if [ -f "$file" ]; then
        move_file "$file" "Archived/docs"
    fi
done

echo ""
echo "📁 Moving Script Files..."
move_file "scripts/add-user-guide-to-rag.js" "Archived/scripts"
move_file "scripts/generate-pdf.js" "Archived/scripts"

echo ""
echo "📁 Moving Test Files..."
move_file "test-html-fix.js" "Archived/"

echo ""
echo "✅ Archive complete!"
echo "📊 Total files moved: $moved_count"
echo ""
echo "📂 Archived structure:"
tree -L 2 Archived/ 2>/dev/null || find Archived -type f | head -20

