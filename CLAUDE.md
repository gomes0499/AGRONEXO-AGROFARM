SR-Consultoria é uma aplicação SaaS multitenant para consultoria agrícola e financeira, focada especialmente em produtores rurais, fazendas e gestão de propriedades agrícolas. O sistema deve ser construído com as seguintes tecnologias:

- Next.js 15+ com App Router e React Server Components
- TypeScript para tipagem estática
- Tailwind CSS 4.0 para estilização
- shadcn/ui para componentes de interface
- Supabase para banco de dados, autenticação e armazenamento
- Resend para envio de emails transacionais
- Zod para validação de dados
- React Query para gerenciamento de estado no cliente

O sistema deve seguir as melhores práticas:

- Arquitetura multitenant (cada organização/produtor = 1 tenant)
- Server Components para conteúdo estático e Server Actions para operações
- Client Components apenas onde interatividade é necessária
- Empty states para todas as listas e dashboards
- Skeletons durante carregamento
- Layout responsivo (mobile, tablet, desktop)
- Validação de dados no cliente e servidor
- SEO otimizado
- Autenticação segura com verificação de email

-- SCHEMA
1. Módulo de Usuários e Autenticação
   Usuário (Supabase + Metadados)
    - id: String (UUID)
    - nome: String
    - email: String
    - telefone: String?
    - imagem: String?
    - senha: String? (hash)
    - metadados: (
      funcao: Enum (PROPRIETARIO, ADMINISTRADOR, MEMBRO)
      cpf: String?
      rg: String? 
      orgaoEmissor: String?
      cep: String?
      endereco: String?
      numero: String?
      complemento: String?
      bairro: String?
      cidade: String?
      estado: String?
      celular: String?
      inscricaoProdutorRural: String?
      dataNascimento: String?
      naturalidade: String?
      estadoCivil: String?
      nomeConjuge: String?
      cpfConjuge: String?
      rgConjuge: String?
      orgaoEmissorConjuge: String?
      dataNascimentoConjuge: String?      
    )
      

2. Módulo de Organização
   Organização
    - id: String (UUID)
    - nome: String
    - slug: String (unique)
    - logo: String?
    - endereco: String?
    - telefone: String?
    - email: String?
    - website: String?
    - criadoEm: DateTime
    - cpf: String?
    - cnpj: String?
    - cep: String?
    - numero: String?
    - complemento: String?
    - bairro: String?
    - cidade: String?
    - estado: String?
    - inscricaoEstadual: String?
    - perfilLinkedIn: String?
    - perfilInstagram: String?
    - canalYouTube: String?
    - perfilX: String?
    - perfilTikTok: String?
    - paginaFacebook: String?
   

   Associacao
    - id: String (UUID)
    - usuarioId: String (relação com Usuário)
    - organizacaoId: String (relação com Organização)
    - funcao: Enum (PROPRIETARIO, ADMINISTRADOR, MEMBRO)
    - ehProprietario: Boolean
    - dataAdicao: DateTime
    - ultimoLogin: DateTime?
  
   Convite
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - email: String
    - token: String
    - funcao: Enum (PROPRIETARIO, ADMINISTRADOR, MEMBRO)
    - status: Enum (PENDENTE, ACEITO, RECUSADO, EXPIRADO)
    - ultimoEnvio: DateTime?
    - criadoEm: DateTime
  
3. Módulo de Propriedades e Terras
   Propriedade
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - nome: String (denominação do imóvel)
    - anoAquisicao: Int
    - proprietario: String
    - cidade: String
    - estado: String
    - numeroMatricula: String (matrícula)
    - areaTotal: Float (hectares)
    - areaCultivada: Float (hectares)
    - valorAtual: Float
    - onus: String?
    - avaliacaoBanco: Float?
    - tipo: Enum (PROPRIO, ARRENDADO)
  
   Arrendamento
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - propriedadeId: String (relação com Propriedade)
    - numeroArrendamento: String
    - areaFazenda: Float (hectares)
    - areaArrendada: Float (hectares)
    - nomeFazenda: String
    - arrendantes: String
    - dataInicio: DateTime
    - dataTermino: DateTime
    - custoHectare: Float (sacas)
    - custoAno: Float (sacas)
    - custosProjetadosAnuais: Json (array de valores anuais)

   Benfeitoria
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - descricao: String
    - propriedadeId: String (relação com Propriedade)
    - dimensoes: String
    - valor: Float
  
4. Módulo de Produção
   Cultura
    - id: String (UUID)
    - nome: String (SOJA, ALGODÃO, MILHO, etc.)
    - organizacaoId: String (relação com Organização)
  
   Sistema
    - id: String (UUID)
    - nome: String (SEQUEIRO, IRRIGADO)
    - organizacaoId: String (relação com Organização)
  
   Ciclo
    - id: String (UUID)
    - nome: String (1ª SAFRA, 2ª SAFRA, 3ª SAFRA)
    - organizacaoId: String (relação com Organização)
  
   Safra
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - nome: String (ex: "2023/24")
    - anoInicio: Int
    - anoFim: Int
  
   AreaPlantio
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - propriedadeId: String (relação com Propriedade)
    - culturaId: String (relação com Cultura)
    - sistemaId: String (relação com Sistema)
    - cicloId: String (relação com Ciclo)
    - safraId: String (relação com Safra)
    - area: Float (hectares)
  
   Produtividade
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - culturaId: String (relação com Cultura)
    - sistemaId: String (relação com Sistema)
    - safraId: String (relação com Safra)
    - produtividade: Float
    - unidade: String (sc/ha, @/ha, kg/ha)
  
   CustoProducao
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - culturaId: String (relação com Cultura)
    - sistemaId: String (relação com Sistema)
    - safraId: String (relação com Safra)
    - categoria: Enum (CALCARIO, FERTILIZANTE, SEMENTES, TRATAMENTO_SEMENTES, HERBICIDA, INSETICIDA, FUNGICIDA, OUTROS, BENEFICIAMENTO, SERVICOS, ADMINISTRATIVO)
    - valor: Float
  
   Rebanho
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - tipoAnimal: String
    - categoria: String (macho/fêmea por faixa etária)
    - quantidade: Int
    - precoUnitario: Float
    - propriedadeId: String (relação com Propriedade)
  
   OperacaoPecuaria
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - ciclo: Enum (CONFINAMENTO, etc.)
    - origem: Enum (PROPRIO, etc.)
    - propriedadeId: String (relação com Propriedade)
    - volumeAbatePorSafra: Json (volume de abate/ano por safra)

5. Módulo Comercial
   Preco
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - safraId: String (relação com Safra)
    - dolarAlgodao: Float?
    - dolarMilho: Float?
    - dolarSoja: Float?
    - dolarFechamento: Float?
    - precoAlgodao: Float? (USD/lb)
    - precoCarocoAlgodao: Float? (R$/ton)
    - precoUnitarioCarocoAlgodao: Float? (R$/@)
    - precoAlgodaoBruto: Float? (R$/@)
    - precoMilho: Float? (R$/saca)
    - precoSojaUSD: Float? (U$/saca)
    - precoSojaBRL: Float? (R$/saca)
    - outrosPrecos: Json? (preços de outras culturas)
  
   VendaSementes
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - culturaId: String (relação com Cultura)
    - ano: Int
    - receitaOperacionalBruta: Float
    - impostosVendas: Float
    - comissaoVendas: Float
    - logisticaEntregas: Float
    - custoMercadoriasVendidas: Float
    - despesasGerais: Float
    - impostoRenda: Float
  
   VendaPecuaria
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - ano: Int
    - receitaOperacionalBruta: Float
    - impostosVendas: Float
    - comissaoVendas: Float
    - logisticaEntregas: Float
    - custoMercadoriasVendidas: Float
    - despesasGerais: Float
    - impostoRenda: Float
  
6. Módulo Financeiro
   DividaBancaria
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - modalidade: Enum (CUSTEIO, INVESTIMENTOS)
    - instituicaoBancaria: String
    - anoContratacao: Int
    - indexador: String
    - taxaReal: Float
    - fluxoPagamentoAnual: Json (valores de 2021 a 2033)
    - moeda: Enum (BRL, USD)
  
   DividaTrading
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - modalidade: Enum (CUSTEIO, INVESTIMENTOS)
    - empresaTrading: String
    - indexador: String
    - taxaReal: Float
    - fluxoPagamentoAnual: Json (valores de 2021 a 2033)
    - moeda: Enum (BRL, USD)
  
   DividaImovel
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - propriedadeId: String (relação com Propriedade)
    - credor: String
    - dataAquisicao: DateTime
    - dataVencimento: DateTime
    - moeda: Enum (BRL, USD)
    - valorTotal: Float
    - fluxoPagamentoAnual: Json (valores de 2018 a 2038)
  
   Fornecedor
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - nome: String
    - moeda: Enum (BRL, USD)
    - valoresPorAno: Json (valores de 2025 a 2033)
  
   FatorLiquidez
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - tipo: Enum (CAIXA, BANCO, INVESTIMENTO)
    - valor: Float
  
   Estoque
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - tipo: Enum (FERTILIZANTES, DEFENSIVOS, ALMOXARIFADO)
    - valor: Float
  
   EstoqueCommodity
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - commodity: Enum (SOJA, ALGODAO, MILHO)
    - valor: Float
  
   ContratoRecebivel
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - fornecedor: String
    - valor: Float
    
   AdiantamentoFornecedor
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - valor: Float
  
   EmprestimoTerceiros
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - valor: Float
  
7. Módulo Patrimonial
   MaquinaEquipamento
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - descricao: String
    - ano: Int
    - marca: String
    - alienado: Boolean
    - numeroChassi: String
    - valorAquisicao: Float
  
   Investimento
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - categoria: Enum (EQUIPAMENTO, TRATOR_COLHEITADEIRA_PULVERIZADOR, AERONAVE, VEICULO, BENFEITORIA, INVESTIMENTO_SOLO)
    - ano: Int
    - quantidade: Int
    - valorUnitario: Float
    
   VendaAtivo
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - categoria: String
    - ano: Int
    - quantidade: Int
    - valorUnitario: Float
  
   PlanoInvestimento
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - categoria: String
    - ano: Int
    - quantidade: Int
    - valorUnitario: Float
  
   PlanoAquisicaoTerras
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - nomeFazenda: String
    - ano: Int
    - hectares: Float
    - sacas: Float
    - totalSacas: Float
    - valorTotal: Float
  
8. Módulo de Projeções
   ProjecaoCultura
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - culturaId: String (relação com Cultura)
    - cicloId: String (relação com Ciclo)
    - sistemaId: String (relação com Sistema)
    - safraId: String (relação com Safra)
    - area: Float (hectares)
    - produtividade: Float
    - unidade: String
    - preco: Float
    
   ProjecaoDivida
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - categoria: Enum (BANCOS, TERRAS, ARRENDAMENTO, FORNECEDORES, TRADINGS, OUTROS)
    - ano: Int
    - valor: Float
  
   ProjecaoCaixaDisponibilidades
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - ano: Int
    - caixaBancos: Float
    - clientes: Float
    - adiantamentosFornecedores: Float
    - emprestimosATerceiros: Float
    - estoqueDefensivos: Float
    - estoqueFertilizantes: Float
    - estoqueAlmoxarifado: Float
    - estoqueCommodities: Float
    - rebanho: Float
    - ativoBiologico: Float
  
   ProjecaoFluxoCaixa
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - ano: Int
    - outrasDespesas: Json (arrendamento, pró-labore, outras)
    - receitasAgricolas: Float
    - despesasAgricolas: Float
    - investimentos: Json (maquinários, outros)
    - custosFinanceiros: Json (serviço da dívida, pagamentos, refinanciamentos)
  
9. Módulo de Indicadores
   ConfiguracaoIndicador
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - limiaresLiquidez: Json
    - limiaresDividaEbitda: Json
    - limiaresDividaReceita: Json
    - limiaresDividaPatrimonio: Json
    - limiaresLtv: Json
  
   ParametroSensibilidade
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - variacoesCambio: Json
    - variacoesPrecosCommodities: Json
    - variacoesProdutividade: Json
  
   CenarioQuebraSafra
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - percentualReducaoProdutividade: Float
    - culturaAfetadaId: String (relação com Cultura)
    - safraAfetadaId: String (relação com Safra)
    - impactoProjetadoFluxoCaixa: Float
    - impactoIndicadoresDivida: Json
  
   Alerta
    - id: String (UUID)
    - organizacaoId: String (relação com Organização)
    - tipo: Enum (LIQUIDEZ, DIVIDA, FLUXO_CAIXA, etc.)
    - condicaoAtivacao: String
    - nivelUrgencia: Enum (BAIXO, MEDIO, ALTO, CRITICO)
    - destinatarios: String[]
    - frequenciaVerificacao: String
    - canalEnvio: Enum (EMAIL, SMS, SISTEMA)