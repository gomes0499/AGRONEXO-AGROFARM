-- Create precos table
CREATE TABLE IF NOT EXISTS precos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  safra_id uuid NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
  
  -- Dólar e conversões
  dolar_algodao numeric,
  dolar_milho numeric,
  dolar_soja numeric,
  dolar_fechamento numeric,
  
  -- Preços do algodão
  preco_algodao numeric, -- USD/lb
  preco_caroco_algodao numeric, -- R$/ton
  preco_unitario_caroco_algodao numeric, -- R$/@
  preco_algodao_bruto numeric, -- R$/@
  
  -- Preços de milho e soja
  preco_milho numeric, -- R$/saca
  preco_soja_usd numeric, -- U$/saca
  preco_soja_brl numeric, -- R$/saca
  
  -- Outros preços
  outros_precos jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Unique constraint
  CONSTRAINT unique_organizacao_safra_price UNIQUE (organizacao_id, safra_id)
);

-- Create indexes
CREATE INDEX idx_precos_organizacao ON precos(organizacao_id);
CREATE INDEX idx_precos_safra ON precos(safra_id);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_precos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_precos_updated_at
    BEFORE UPDATE ON precos
    FOR EACH ROW
    EXECUTE FUNCTION update_precos_updated_at();

-- Enable RLS
ALTER TABLE precos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view prices from their organization" ON precos
    FOR SELECT
    USING (organizacao_id IN (
        SELECT organizacao_id FROM membros WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create prices for their organization" ON precos
    FOR INSERT
    WITH CHECK (organizacao_id IN (
        SELECT organizacao_id FROM membros WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update prices from their organization" ON precos
    FOR UPDATE
    USING (organizacao_id IN (
        SELECT organizacao_id FROM membros WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete prices from their organization" ON precos
    FOR DELETE
    USING (organizacao_id IN (
        SELECT organizacao_id FROM membros WHERE user_id = auth.uid()
    ));