import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/property-formatters";
import { cleanPropertyName } from "@/lib/utils/property-name-cleaner";
import { TrendingUp } from "lucide-react";

interface PropertyValueRankingProps {
  organizationId: string;
}


async function getPropertyRanking(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("propriedades")
    .select("id, nome, valor_atual")
    .eq("organizacao_id", organizationId)
    .not("valor_atual", "is", null)
    .order("valor_atual", { ascending: false });

  if (error) {
    console.error("Erro ao buscar ranking de propriedades:", error);
    return [];
  }

  return data || [];
}

async function PropertyValueRankingContent({
  organizationId,
}: PropertyValueRankingProps) {
  try {
    const properties = await getPropertyRanking(organizationId);

    if (properties.length === 0) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <div>
                <CardTitle className="text-base">
                  Valor por Propriedade
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Ranking patrimonial das propriedades por valor
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            Nenhuma propriedade com valor cadastrado
          </CardContent>
        </Card>
      );
    }

    const maxValue = Math.max(...properties.map((p) => p.valor_atual));
    const visibleProperties = properties.slice(0, 5);
    const otherProperties = properties.slice(5);
    const otherPropertiesValue = otherProperties.reduce(
      (acc, p) => acc + p.valor_atual,
      0
    );

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <div>
              <CardTitle className="text-base">
                Valor por Propriedade
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Ranking patrimonial das propriedades por valor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleProperties.map((property, index) => {
            const percentage = (property.valor_atual / maxValue) * 100;
            const barWidth = Math.max(percentage, 10); // Mínimo de 10% para visualização

            return (
              <div key={property.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1 mr-2">
                    {cleanPropertyName(property.nome).toUpperCase()}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(property.valor_atual)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}

          {/* Outras propriedades agrupadas */}
          {otherProperties.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  OUTRAS {otherProperties.length} FAZENDAS
                </span>
                <span className="font-semibold">
                  {formatCurrency(otherPropertiesValue)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(otherPropertiesValue / maxValue) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Resumo total */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              {formatCurrency(
                properties.reduce((acc, p) => acc + p.valor_atual, 0)
              )}
              em {properties.length}{" "}
              {properties.length === 1 ? "propriedade" : "propriedades"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Erro ao carregar ranking de propriedades:", error);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <div>
              <CardTitle className="text-base">
                Valor por Propriedade
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Ranking patrimonial das propriedades por valor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
              </div>
              <div className="h-2 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
}

export async function PropertyValueRanking({
  organizationId,
}: PropertyValueRankingProps) {
  return <PropertyValueRankingContent organizationId={organizationId} />;
}
