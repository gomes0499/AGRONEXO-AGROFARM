# Exemplos de Uso do Componente UnderConstruction

O componente `UnderConstruction` é extremamente versátil e pode ser usado em diferentes contextos da aplicação quando uma funcionalidade não está pronta ou não pode ser exibida.

## Exemplo 1: Página completa em construção

```tsx
// app/dashboard/financial/page.tsx
import { UnderConstruction } from "@/components/ui/under-construction";

export default function FinancialPage() {
  return (
    <UnderConstruction 
      title="Módulo Financeiro em Desenvolvimento"
      message="O módulo financeiro estará disponível na próxima atualização."
      variant="coming-soon"
    />
  );
}
```

## Exemplo 2: Funcionalidade com dados insuficientes

```tsx
// app/dashboard/production/analysis/page.tsx
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProductionAnalysisPage() {
  // Verifique se existem dados suficientes
  const hasEnoughData = false; // Exemplo: verificar se existem pelo menos 2 safras de dados

  if (!hasEnoughData) {
    return (
      <UnderConstruction 
        variant="no-data"
        icon="database"
        message="Não há dados suficientes para gerar análises comparativas. É necessário ter pelo menos 2 safras registradas."
      />
    );
  }
  
  return (
    <div>
      {/* Conteúdo normal da página quando houver dados suficientes */}
    </div>
  );
}
```

## Exemplo 3: Componente dentro de um card ou seção da página

```tsx
// components/dashboard/weather-forecast-card.tsx
import { UnderConstruction } from "@/components/ui/under-construction";
import { Card, CardContent } from "@/components/ui/card";

export function WeatherForecastCard() {
  const forecastData = null; // Simulando ausência de dados
  
  return (
    <Card>
      <CardContent className="p-0">
        {forecastData ? (
          <div>{/* Conteúdo do gráfico de previsão */}</div>
        ) : (
          <UnderConstruction 
            variant="no-data"
            icon="database"
            className="py-0 px-0" // Ajuste para caber dentro do card
            showBackButton={false}
            title="Sem Dados de Previsão"
            message="Não há dados meteorológicos suficientes para esta região." 
          />
        )}
      </CardContent>
    </Card>
  );
}
```

## Variantes Disponíveis

- **default**: Página em construção genérica
- **no-data**: Indica que não há dados suficientes para mostrar a funcionalidade
- **coming-soon**: Funcionalidade que será lançada em breve
- **maintenance**: Funcionalidade temporariamente indisponível

## Ícones Disponíveis

- **code**: Ícone padrão (código em construção)
- **database**: Ícone para problemas de dados
- **wrench**: Ícone para manutenção
- **alert**: Ícone para alertas ou avisos

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| title | string | Varia conforme a variante | Título do aviso |
| message | string | Varia conforme a variante | Mensagem descritiva |
| variant | "default" \| "no-data" \| "coming-soon" \| "maintenance" | "default" | Tipo de aviso |
| icon | "code" \| "database" \| "wrench" \| "alert" | "code" | Ícone a ser exibido |
| showBackButton | boolean | true | Se deve mostrar o botão de voltar |
| className | string | - | Classes adicionais para o container |
| children | ReactNode | - | Conteúdo adicional a ser renderizado abaixo da mensagem |