-- Criação do bucket para armazenar arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sr-consultoria', 'sr-consultoria', false)
ON CONFLICT (id) DO NOTHING;

-- Habilita extensão para geração de UUID, se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Políticas para gerenciamento de arquivos no Storage

-- Policy 1: Política de leitura pública para arquivos específicos (opcional)
-- Esta política permite o acesso público a arquivos em pastas específicas
CREATE POLICY "Acesso público a arquivos públicos" ON storage.objects FOR SELECT
USING (
  bucket_id = 'sr-consultoria' AND 
  (
    -- Lista de diretórios com acesso público
    name LIKE 'public/%' OR 
    name LIKE 'logos/%' OR
    name LIKE 'organizations/%' OR
    name LIKE 'properties/%' OR
    name LIKE 'users/%'
  )
);

-- Policy 2: Política de inserção para usuários autenticados
-- Permite que usuários autenticados façam upload de arquivos
CREATE POLICY "Usuários podem fazer upload de arquivos" ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'sr-consultoria' AND
  auth.uid() IS NOT NULL
);

-- Policy 3: Política de leitura para usuários autenticados
-- Permite que usuários autenticados acessem todos os arquivos
CREATE POLICY "Usuários podem ler arquivos" ON storage.objects FOR SELECT 
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  auth.uid() IS NOT NULL
);

-- Policy 4: Política de atualização para proprietários de arquivos
-- Permite que usuários atualizem apenas seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus próprios arquivos" ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'sr-consultoria' AND
  auth.uid() = owner
);

-- Policy 5: Política de exclusão para proprietários de arquivos
-- Permite que usuários excluam apenas seus próprios arquivos
CREATE POLICY "Usuários podem excluir seus próprios arquivos" ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  auth.uid() = owner
);

-- Policy 6: Política de acesso a arquivos da organização
-- Permite que membros da organização acessem arquivos específicos da organização
CREATE POLICY "Membros da organização podem acessar arquivos da organização" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  EXISTS (
    SELECT 1 FROM associacoes a
    WHERE 
      a.usuario_id = auth.uid() AND
      a.organizacao_id::text = (string_to_array(name, '/'))[2]
  )
);

-- Policy 7: Política de modificação para arquivos da organização
-- Permite que membros da organização atualizem arquivos
CREATE POLICY "Membros da organização podem atualizar arquivos da organização" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  EXISTS (
    SELECT 1 FROM associacoes a
    WHERE 
      a.usuario_id = auth.uid() AND
      a.organizacao_id::text = (string_to_array(name, '/'))[2]
  )
)
WITH CHECK (
  bucket_id = 'sr-consultoria' AND
  EXISTS (
    SELECT 1 FROM associacoes a
    WHERE 
      a.usuario_id = auth.uid() AND
      a.organizacao_id::text = (string_to_array(name, '/'))[2]
  )
);

-- Policy 8: Política para administradores
-- Permite que administradores tenham acesso total a todos os arquivos
CREATE POLICY "Administradores podem gerenciar todos os arquivos" ON storage.objects 
TO authenticated
USING (
  bucket_id = 'sr-consultoria' AND
  EXISTS (
    SELECT 1 FROM associacoes a
    WHERE 
      a.usuario_id = auth.uid() AND
      a.funcao = 'ADMINISTRADOR'
  )
)
WITH CHECK (
  bucket_id = 'sr-consultoria' AND
  EXISTS (
    SELECT 1 FROM associacoes a
    WHERE 
      a.usuario_id = auth.uid() AND
      a.funcao = 'ADMINISTRADOR'
  )
);

-- Function para definir o proprietário automaticamente em novos uploads
CREATE OR REPLACE FUNCTION storage.set_file_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para definir o proprietário automaticamente em novos uploads
CREATE TRIGGER set_file_owner
BEFORE INSERT ON storage.objects
FOR EACH ROW
EXECUTE PROCEDURE storage.set_file_owner();

-- Função para obter organização de um arquivo com base no caminho
CREATE OR REPLACE FUNCTION storage.get_organization_from_name(name_value TEXT)
RETURNS UUID AS $$
DECLARE
  org_id TEXT;
BEGIN
  -- Extrai o ID da organização de um caminho como "organizations/org_id/file.jpg"
  IF name_value LIKE 'organizations/%' THEN
    org_id := split_part(name_value, '/', 2);
    RETURN org_id::UUID;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;