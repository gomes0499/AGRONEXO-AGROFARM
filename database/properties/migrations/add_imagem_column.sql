-- Migration script to add the 'imagem' column to the propriedades table
-- Fix for error: Could not find the 'imagem' column of 'propriedades' in the schema cache

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'imagem'
  ) THEN
    -- Add the column
    ALTER TABLE propriedades
    ADD COLUMN imagem TEXT;
    
    -- Add a comment on the column
    COMMENT ON COLUMN propriedades.imagem IS 'URL da imagem ou foto da propriedade';
    
    RAISE NOTICE 'Added imagem column to propriedades table';
  ELSE
    RAISE NOTICE 'Column imagem already exists in propriedades table';
  END IF;
  
  -- Also add the additional fields mentioned in the schema but not present in the table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'cartorio_registro'
  ) THEN
    ALTER TABLE propriedades
    ADD COLUMN cartorio_registro TEXT;
    
    COMMENT ON COLUMN propriedades.cartorio_registro IS 'Nome do cartório de registro de imóvel onde a propriedade está registrada';
    
    RAISE NOTICE 'Added cartorio_registro column to propriedades table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'numero_car'
  ) THEN
    ALTER TABLE propriedades
    ADD COLUMN numero_car TEXT;
    
    COMMENT ON COLUMN propriedades.numero_car IS 'Número do Cadastro Ambiental Rural (CAR)';
    
    RAISE NOTICE 'Added numero_car column to propriedades table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'data_inicio'
  ) THEN
    ALTER TABLE propriedades
    ADD COLUMN data_inicio TIMESTAMPTZ;
    
    COMMENT ON COLUMN propriedades.data_inicio IS 'Data de início do contrato (para propriedades arrendadas)';
    
    RAISE NOTICE 'Added data_inicio column to propriedades table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'data_termino'
  ) THEN
    ALTER TABLE propriedades
    ADD COLUMN data_termino TIMESTAMPTZ;
    
    COMMENT ON COLUMN propriedades.data_termino IS 'Data de término do contrato (para propriedades arrendadas)';
    
    RAISE NOTICE 'Added data_termino column to propriedades table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'propriedades'
    AND column_name = 'tipo_anuencia'
  ) THEN
    ALTER TABLE propriedades
    ADD COLUMN tipo_anuencia TEXT;
    
    COMMENT ON COLUMN propriedades.tipo_anuencia IS 'Tipo de anuência para propriedades arrendadas (COM_ANUENCIA, SEM_ANUENCIA)';
    
    RAISE NOTICE 'Added tipo_anuencia column to propriedades table';
  END IF;
END $$;