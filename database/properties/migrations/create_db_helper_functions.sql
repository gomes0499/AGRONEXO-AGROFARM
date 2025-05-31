-- Funções utilitárias para gerenciamento da estrutura do banco
-- Isso inclui funções para verificar e modificar a estrutura das tabelas

-- Função para verificar se uma coluna existe em uma tabela
CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = column_exists.table_name
    AND column_name = column_exists.column_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para executar SQL raw (apenas para administradores)
CREATE OR REPLACE FUNCTION execute_sql(sql_command TEXT)
RETURNS VOID AS $$
BEGIN
  -- Note: Esta função é potencialmente perigosa pois permite executar
  -- qualquer comando SQL. Em um ambiente de produção, você deve
  -- implementar verificações de segurança adicionais.
  EXECUTE sql_command;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função específica para adicionar as colunas ausentes na tabela de propriedades
CREATE OR REPLACE FUNCTION add_missing_property_columns()
RETURNS BOOLEAN AS $$
DECLARE
  columns_added BOOLEAN := FALSE;
BEGIN
  -- Adicionar coluna imagem se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'imagem'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN imagem TEXT;
    columns_added := TRUE;
  END IF;
  
  -- Adicionar coluna cartorio_registro se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'cartorio_registro'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN cartorio_registro TEXT;
    columns_added := TRUE;
  END IF;
  
  -- Adicionar coluna numero_car se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'numero_car'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN numero_car TEXT;
    columns_added := TRUE;
  END IF;
  
  -- Adicionar coluna data_inicio se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'data_inicio'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN data_inicio TIMESTAMPTZ;
    columns_added := TRUE;
  END IF;
  
  -- Adicionar coluna data_termino se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'data_termino'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN data_termino TIMESTAMPTZ;
    columns_added := TRUE;
  END IF;
  
  -- Adicionar coluna tipo_anuencia se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'tipo_anuencia'
  ) THEN
    ALTER TABLE propriedades ADD COLUMN tipo_anuencia TEXT;
    columns_added := TRUE;
  END IF;
  
  RETURN columns_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;