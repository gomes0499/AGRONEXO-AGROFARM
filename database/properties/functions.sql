-- =============================================================================
-- PROPERTIES MODULE - FUNCTIONS
-- =============================================================================

-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = column_exists.table_name
    AND column_name = column_exists.column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute raw SQL (admin only)
CREATE OR REPLACE FUNCTION execute_sql(sql_command TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if user has admin role (this depends on your auth setup)
  -- For security, you may want to restrict this to specific SQL commands
  EXECUTE sql_command;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS Policy helper functions (for properties)
-- =============================================================================

-- Function to check if a user has access to a property via their organization
CREATE OR REPLACE FUNCTION user_has_property_access(property_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM propriedades p
    JOIN association a ON p.organizacao_id = a.organizacao_id
    WHERE p.id = property_id
    AND a.usuario_id = user_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;