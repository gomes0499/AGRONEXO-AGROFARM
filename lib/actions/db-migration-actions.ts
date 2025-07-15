"use server";

import { createClient } from "@/lib/supabase/server";

export async function runPropertyMigration() {
  const supabase = await createClient();
  
  try {
    // Check if imagem column exists in propriedades table
    const { data: columnExists, error: checkError } = await supabase.rpc(
      'column_exists',
      { table_name: 'propriedades', column_name: 'imagem' }
    );

    if (checkError) {
      // RPC function might not exist, try alternative approach
      console.error("Error checking column existence:", checkError);
      
      // Add column directly
      const { error: addError } = await supabase.rpc(
        'execute_sql', 
        { sql_command: 'ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS imagem TEXT' }
      );
      
      if (addError) {
        console.error("Error adding imagem column:", addError);
        
        // Final approach: use execute_sql RPC function
        const { error: rawError } = await supabase.rpc(
          'execute_sql',
          { sql_command: 'ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS imagem TEXT' }
        );
        
        if (rawError) {
          console.error("Error with execute_sql to add column:", rawError);
          return { success: false, error: rawError.message };
        }
      }
    } else if (!columnExists) {
      // Column doesn't exist, add it
      const { error: addError } = await supabase.rpc(
        'execute_sql', 
        { sql_command: 'ALTER TABLE propriedades ADD COLUMN imagem TEXT' }
      );
      
      if (addError) {
        console.error("Error adding column via RPC:", addError);
        return { success: false, error: addError.message };
      }
    }
    
    // Add other columns that might be missing
    const additionalColumns = [
      { name: 'cartorio_registro', type: 'TEXT' },
      { name: 'numero_car', type: 'TEXT' },
      { name: 'data_inicio', type: 'TIMESTAMPTZ' },
      { name: 'data_termino', type: 'TIMESTAMPTZ' },
      { name: 'tipo_anuencia', type: 'TEXT' }
    ];
    
    for (const column of additionalColumns) {
      try {
        const { error } = await supabase.rpc(
          'execute_sql',
          { sql_command: `ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}` }
        );
        
        if (error) {
        }
      } catch (columnError) {
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in runPropertyMigration:", error);
    return { success: false, error: String(error) };
  }
}

// Helper function to check if a column exists
export async function checkColumnExists(tableName: string, columnName: string) {
  const supabase = await createClient();
  
  try {
    const { count, error } = await supabase
      .from('information_schema.columns')
      .select('column_name', { count: 'exact' })
      .eq('table_name', tableName)
      .eq('column_name', columnName);
    
    if (error) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
      return { exists: false, error: error.message };
    }
    
    return { exists: count && count > 0, error: null };
  } catch (error) {
    console.error(`Exception checking column ${columnName} in ${tableName}:`, error);
    return { exists: false, error: String(error) };
  }
}