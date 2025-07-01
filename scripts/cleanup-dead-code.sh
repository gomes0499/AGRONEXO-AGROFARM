#!/bin/bash

# Script to clean up dead code from SR Consultoria project
# IMPORTANT: Run this script from the project root directory
# Make sure to commit your changes before running this script

echo "🧹 SR Consultoria - Dead Code Cleanup Script"
echo "============================================"
echo ""
echo "⚠️  WARNING: This script will delete files!"
echo "Make sure you have committed all changes before proceeding."
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Create backup branch
echo "📋 Creating backup branch..."
git checkout -b cleanup-backup-$(date +%Y%m%d-%H%M%S)
git checkout -

# Counter for deleted files
deleted_count=0

# Function to safely delete file
delete_file() {
    if [ -f "$1" ]; then
        echo "🗑️  Deleting: $1"
        rm "$1"
        ((deleted_count++))
    fi
}

# Function to safely delete directory
delete_dir() {
    if [ -d "$1" ]; then
        echo "🗑️  Deleting directory: $1"
        rm -rf "$1"
        ((deleted_count++))
    fi
}

echo ""
echo "🔍 Starting cleanup..."
echo ""

# 1. Remove all -refactored files
echo "📁 Removing refactored components..."
find . -name "*-refactored.tsx" -type f | while read file; do
    delete_file "$file"
done

# 2. Remove backup files
echo ""
echo "📁 Removing backup files..."
delete_file "components/production/stats/area-plantada-chart-old.tsx"
delete_file "components/projections/balanco/balanco-patrimonial-table.tsx.bak"
delete_file "supabase/migrations/20250627_create_projection_scenarios.sql.bak"

# 3. Remove empty API directories
echo ""
echo "📁 Removing empty API directories..."
delete_dir "app/api/chat-test"
delete_dir "app/api/chat-groq-test"
delete_dir "app/api/organization-stats"

# 4. Remove server components from _components directory
echo ""
echo "📁 Removing duplicate server components from _components..."
if [ -d "app/dashboard/_components" ]; then
    find app/dashboard/_components -name "*-server.tsx" -type f | while read file; do
        delete_file "$file"
    done
fi

# 5. List mobile components for manual review
echo ""
echo "📱 Mobile components found (review manually):"
find . -name "mobile-*.tsx" -type f | while read file; do
    echo "   - $file"
done
echo "   - components/financial/dividas-bancarias/dividas-bancarias-listing-mobile.tsx"
echo "   - components/production/planting-areas/planting-area-list-mobile.tsx"

# 6. List potentially unused components for manual review
echo ""
echo "🔍 Potentially unused components (review manually):"
echo "   - components/properties/document-upload.tsx"
echo "   - components/properties/property-form-simple.tsx"
echo "   - components/organization/organization/form/organization-form-modal.tsx"
echo "   - components/dashboard/market-ticker-client.tsx"
echo "   - components/dashboard/market-ticker-wrapper.tsx"
echo "   - components/dashboard/market-ticker-sse.tsx"
echo "   - components/projections/cash-flow/fluxo-caixa-client-wrapper.tsx"

# 7. Check for the docs_ directory
echo ""
if [ -d "docs_" ]; then
    echo "📚 Found old documentation directory: docs_"
    echo "   Review contents before deleting"
fi

echo ""
echo "✅ Cleanup completed!"
echo "📊 Total files/directories deleted: $deleted_count"
echo ""
echo "🔄 Next steps:"
echo "1. Review the changes with: git status"
echo "2. Test the application: npm run dev"
echo "3. Run build to check for errors: npm run build"
echo "4. If everything works, commit the changes"
echo "5. If something breaks, restore from backup branch"
echo ""
echo "💡 To restore from backup if needed:"
echo "   git checkout cleanup-backup-*"