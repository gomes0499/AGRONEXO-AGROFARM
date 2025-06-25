-- Verificar se RLS está habilitado na tabela propriedades
DO $$
BEGIN
  -- Habilitar RLS se não estiver habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'propriedades' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE propriedades ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado para tabela propriedades';
  ELSE
    RAISE NOTICE 'RLS já está habilitado para tabela propriedades';
  END IF;
END $$;

-- Listar políticas existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'propriedades'
ORDER BY policyname;

-- Criar política SELECT se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'propriedades' 
    AND policyname = 'Usuarios podem ver propriedades de sua organizacao'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver propriedades de sua organizacao" 
    ON propriedades FOR SELECT 
    USING (
      organizacao_id IN (
        SELECT organizacao_id 
        FROM associacoes 
        WHERE usuario_id = auth.uid()
      )
    );
    RAISE NOTICE 'Política SELECT criada para propriedades';
  ELSE
    RAISE NOTICE 'Política SELECT já existe para propriedades';
  END IF;
END $$;

-- Criar política INSERT se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'propriedades' 
    AND policyname = 'Usuarios podem criar propriedades em sua organizacao'
    AND cmd = 'INSERT'
  ) THEN
    CREATE POLICY "Usuarios podem criar propriedades em sua organizacao" 
    ON propriedades FOR INSERT 
    WITH CHECK (
      organizacao_id IN (
        SELECT organizacao_id 
        FROM associacoes 
        WHERE usuario_id = auth.uid()
        AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
      )
    );
    RAISE NOTICE 'Política INSERT criada para propriedades';
  ELSE
    RAISE NOTICE 'Política INSERT já existe para propriedades';
  END IF;
END $$;

-- Criar política UPDATE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'propriedades' 
    AND policyname = 'Usuarios podem atualizar propriedades de sua organizacao'
    AND cmd = 'UPDATE'
  ) THEN
    CREATE POLICY "Usuarios podem atualizar propriedades de sua organizacao" 
    ON propriedades FOR UPDATE 
    USING (
      organizacao_id IN (
        SELECT organizacao_id 
        FROM associacoes 
        WHERE usuario_id = auth.uid()
        AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
      )
    )
    WITH CHECK (
      organizacao_id IN (
        SELECT organizacao_id 
        FROM associacoes 
        WHERE usuario_id = auth.uid()
        AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
      )
    );
    RAISE NOTICE 'Política UPDATE criada para propriedades';
  ELSE
    RAISE NOTICE 'Política UPDATE já existe para propriedades';
  END IF;
END $$;

-- Criar política DELETE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'propriedades' 
    AND policyname = 'Usuarios podem deletar propriedades de sua organizacao'
    AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Usuarios podem deletar propriedades de sua organizacao" 
    ON propriedades FOR DELETE 
    USING (
      organizacao_id IN (
        SELECT organizacao_id 
        FROM associacoes 
        WHERE usuario_id = auth.uid()
        AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
      )
    );
    RAISE NOTICE 'Política DELETE criada para propriedades';
  ELSE
    RAISE NOTICE 'Política DELETE já existe para propriedades';
  END IF;
END $$;

-- Verificar quantas propriedades existem no total
SELECT COUNT(*) as total_propriedades FROM propriedades;

-- Verificar se há propriedades órfãs
SELECT 
    COUNT(*) as propriedades_orfas,
    STRING_AGG(id::text, ', ') as ids_orfas
FROM propriedades 
WHERE organizacao_id IS NULL
OR organizacao_id NOT IN (SELECT id FROM organizacoes);

-- Listar primeiras 5 propriedades com suas organizações
SELECT 
    p.id,
    p.nome,
    p.organizacao_id,
    o.nome as organizacao_nome,
    p.tipo,
    p.area_total
FROM propriedades p
LEFT JOIN organizacoes o ON p.organizacao_id = o.id
ORDER BY p.criado_em DESC
LIMIT 5;