Descrição: Administra a comercialização de produtos agrícolas, registra preços de commodities, contratos de venda, estratégias comerciais e gestão da comercialização de sementes. Permite acompanhamento de cotações e análise de margens.

# MÓDULO COMERCIAL - TAREFAS (ORGANIZADO POR TABS) SEGUIR LAYOUT IGUAL DOS OUTROS MODULOS EX: MODULO DE PRODUÇÃO

## 1. Tab: Preços de Mercado (Dados da API)

- [x] Implementar conexão com APIs de mercado financeiro para obtenção automática de cotações (mockado temporariamente)
- [x] Criar interface de visualização de lista de cotações atuais com filtro por commodity
      Dólar Algodão
      Dólar Milho
      Dólar Soja
      Dólar Fechamento

      Algodão - Preços(USD/lb)
      R$/@ de pluma
      R$/ton de caroço
      R$/@ (caroço)
      R$/@ de algodão em capulho

      Milho	R$/Saca

      Soja	U$/Saca
      Soja	R$/Saca

      Milheto	R$/Saca
      Sorgo	R$/Saca

      Feijão Gurutuba	R$/Saca
      Feijão Carioca	R$/Saca

      Mamona	R$/Kg

      Sem. Pastagem 	R$/Kg

      Café	R$/Saca

      Trigo	R$/Saca

- [x] Implementar ferramenta de conversão entre moedas (BRL/USD)

## 2. Tab: Vendas de Sementes

- [X] Criar lista de visualização de registros da tabela vendas_sementes
- [X] Implementar formulário para adicionar nova venda de sementes com validação
- [X] Desenvolver formulário de edição de registros existentes
- [X] Adicionar exclusão 
- [X] Adicionar filtros por cultura, ano e valor

## 3. Tab: Vendas Pecuárias

- [ ] Criar lista de visualização de registros da tabela vendas_pecuaria
- [ ] Implementar formulário para adicionar nova venda pecuária com validação
- [ ] Desenvolver formulário de edição de registros existentes
- [ ] Adicionar filtros por ano, valor e tipo de venda
- [ ] Implementar visualização detalhada de registro específico
- [ ] Criar relatório de vendas por período
- [ ] Adicionar calculadora de margens para vendas pecuárias

## 4. Tab: Contratos de Venda

- [ ] Criar estrutura da tabela contratos_venda no banco de dados
- [ ] Implementar lista de visualização de contratos com status
- [ ] Desenvolver formulário para cadastro de novos contratos
- [ ] Adicionar funcionalidade de monitoramento de status do contrato
- [ ] Implementar alertas para vencimentos próximos
- [ ] Criar relatório de contratos por commodity e status
- [ ] Adicionar vinculação com estoques disponíveis

## 5. Tab: Estratégias Comerciais

- [ ] Criar estrutura da tabela estrategias_comerciais no banco de dados
- [ ] Implementar interface para cadastro de novas estratégias
- [ ] Desenvolver visualização de estratégias ativas e histórico
- [ ] Adicionar simulador de resultados baseado em preços das APIs
- [ ] Implementar sistema de notificações para preços-alvo atingidos
- [ ] Criar relatório de desempenho das estratégias

## 6. Tab: Gestão de Insumos

- [ ] Criar estrutura da tabela precos_insumos no banco de dados
- [ ] Implementar lista de visualização de preços por fornecedor
- [ ] Desenvolver formulário para cadastro de cotações
- [ ] Adicionar comparativo visual entre fornecedores
- [ ] Implementar histórico de preços por insumo
- [ ] Criar relatório de variação de preços por categoria de insumo

# PRÓXIMOS PASSOS

1. Implementar a tab de Vendas de Sementes

   - Criar componente de lista
   - Implementar formulário de criação/edição
   - Adicionar filtros e relatórios

2. Implementar a tab de Vendas Pecuárias

   - Criar componente de lista
   - Implementar formulário de criação/edição
   - Adicionar filtros e relatórios

3. Implementar sistema de alertas de preços

   - Criar componente para definição de alertas
   - Implementar notificações quando limites são atingidos

4. Criar script SQL para novas tabelas
   - Finalizar scripts de contratos_venda
   - Finalizar scripts de estrategias_comerciais
   - Finalizar scripts de precos_insumos

# DETALHES DAS OPERAÇÕES POR TAB

## Tab: Preços de Mercado

- Funcionalidade principal: Visualização de dados obtidos via API
- Interação: Consulta e exibição apenas (sem inserção de dados pelo usuário)
- Filtros: Por commodity, período e moeda
- Exibições: Tabelas, gráficos de linha e velas (candlestick)

## Tab: Vendas de Sementes

- Funcionalidade principal: CRUD na tabela vendas_sementes
- Campos do formulário:
  - Organização
  - Cultura
  - Ano
  - Receita operacional bruta
  - Impostos sobre vendas
  - Comissão sobre vendas
  - Logística e entregas
  - Custo mercadorias vendidas
  - Despesas gerais
  - Imposto de renda
- Validações: Todos os valores monetários devem ser positivos

## Tab: Vendas Pecuárias

- Funcionalidade principal: CRUD na tabela vendas_pecuaria
- Campos do formulário:
  - Organização
  - Ano
  - Receita operacional bruta
  - Impostos sobre vendas
  - Comissão sobre vendas
  - Logística e entregas
  - Custo mercadorias vendidas
  - Despesas gerais
  - Imposto de renda
- Validações: Todos os valores monetários devem ser positivos

# ESTRUTURAS DE NOVAS TABELAS

## Tabela: contratos_venda

```sql
CREATE TABLE public.contratos_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  commodity_tipo commodity_tipo NOT NULL,
  comprador VARCHAR(255) NOT NULL,
  quantidade DECIMAL(12, 2) NOT NULL,
  unidade VARCHAR(10) NOT NULL, -- sc, @, kg, ton
  preco_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  data_contrato DATE NOT NULL,
  data_entrega DATE NOT NULL,
  local_entrega VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- PENDENTE, PARCIAL, CONCLUIDO, CANCELADO
  porcentagem_executada DECIMAL(5, 2) DEFAULT 0,
  observacoes TEXT,
  safra_id UUID REFERENCES public.safras(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contratos_venda_organizacao_id ON public.contratos_venda(organizacao_id);
CREATE INDEX idx_contratos_venda_commodity_tipo ON public.contratos_venda(commodity_tipo);
CREATE INDEX idx_contratos_venda_status ON public.contratos_venda(status);
CREATE INDEX idx_contratos_venda_data_entrega ON public.contratos_venda(data_entrega);
CREATE INDEX idx_contratos_venda_safra_id ON public.contratos_venda(safra_id);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_timestamp_contratos_venda
BEFORE UPDATE ON public.contratos_venda
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para calcular o valor_total automaticamente
CREATE OR REPLACE FUNCTION public.calcular_valor_total_contrato()
RETURNS TRIGGER AS $$
BEGIN
  NEW.valor_total := NEW.quantidade * NEW.preco_unitario;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calcular_total_contrato_venda
BEFORE INSERT OR UPDATE ON public.contratos_venda
FOR EACH ROW EXECUTE FUNCTION public.calcular_valor_total_contrato();

-- Trigger para auditoria
CREATE TRIGGER audit_changes_contratos_venda
AFTER INSERT OR UPDATE OR DELETE ON public.contratos_venda
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
```

## Tabela: estrategias_comerciais

```sql
CREATE TABLE public.estrategias_comerciais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  commodity_tipo commodity_tipo NOT NULL,
  safra_id UUID REFERENCES public.safras(id) ON DELETE SET NULL,
  tipo_estrategia VARCHAR(50) NOT NULL, -- VENDA_FUTURA, HEDGE, SPOT, OPÇÃO, BALCÃO
  preco_alvo DECIMAL(10, 2),
  preco_gatilho DECIMAL(10, 2),
  quantidade_alvo DECIMAL(12, 2),
  unidade VARCHAR(10) NOT NULL, -- sc, @, kg, ton
  percentual_producao DECIMAL(5, 2),
  data_inicio DATE,
  data_limite DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'ATIVA', -- ATIVA, CONCLUIDA, CANCELADA
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estrategias_comerciais_organizacao_id ON public.estrategias_comerciais(organizacao_id);
CREATE INDEX idx_estrategias_comerciais_commodity_tipo ON public.estrategias_comerciais(commodity_tipo);
CREATE INDEX idx_estrategias_comerciais_safra_id ON public.estrategias_comerciais(safra_id);
CREATE INDEX idx_estrategias_comerciais_status ON public.estrategias_comerciais(status);

CREATE TRIGGER update_timestamp_estrategias_comerciais
BEFORE UPDATE ON public.estrategias_comerciais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_changes_estrategias_comerciais
AFTER INSERT OR UPDATE OR DELETE ON public.estrategias_comerciais
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
```

## Tabela: precos_insumos

```sql
CREATE TABLE public.precos_insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL, -- FERTILIZANTE, DEFENSIVO, SEMENTE, COMBUSTÍVEL, OUTROS
  fabricante VARCHAR(255),
  fornecedor VARCHAR(255) NOT NULL,
  preco_unitario DECIMAL(15, 2) NOT NULL,
  unidade VARCHAR(20) NOT NULL, -- kg, L, sc, ton
  data_cotacao DATE NOT NULL,
  data_validade_cotacao DATE,
  safra_id UUID REFERENCES public.safras(id) ON DELETE SET NULL,
  condicao_pagamento VARCHAR(255),
  prazo_entrega INT, -- em dias
  frete_incluso BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_precos_insumos_organizacao_id ON public.precos_insumos(organizacao_id);
CREATE INDEX idx_precos_insumos_categoria ON public.precos_insumos(categoria);
CREATE INDEX idx_precos_insumos_fornecedor ON public.precos_insumos(fornecedor);
CREATE INDEX idx_precos_insumos_data_cotacao ON public.precos_insumos(data_cotacao);
CREATE INDEX idx_precos_insumos_safra_id ON public.precos_insumos(safra_id);

CREATE TRIGGER update_timestamp_precos_insumos
BEFORE UPDATE ON public.precos_insumos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_changes_precos_insumos
AFTER INSERT OR UPDATE OR DELETE ON public.precos_insumos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
```
