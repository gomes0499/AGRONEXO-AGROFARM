#!/bin/bash

echo "Applying ciclo_id migration to custos_producao table..."

# Run the migration using Supabase CLI
npx supabase migration up --db-url "$DATABASE_URL"

echo "Migration applied successfully!"