import type { Improvement } from "@/schemas/properties";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Building } from "lucide-react";
import { ImprovementListActions } from "@/components/properties/improvement-list-actions";
import { ImprovementRowActions } from "@/components/properties/improvement-row-actions";

interface ImprovementListProps {
  improvements: Improvement[];
  propertyId: string;
  organizationId?: string;
}

export function ImprovementList({
  improvements,
  propertyId,
  organizationId,
}: ImprovementListProps) {
  const totalValue = improvements.reduce(
    (sum, imp) => sum + (imp.valor || 0),
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Benfeitorias</CardTitle>
          {improvements.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Valor total: {formatCurrency(totalValue)}
            </p>
          )}
        </div>
        {propertyId && (
          <ImprovementListActions
            propertyId={propertyId}
            organizationId={organizationId || ""}
            useModal={false}
          />
        )}
      </CardHeader>
      <CardContent>
        {improvements.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {improvements.map((improvement) => (
                <TableRow key={improvement.id}>
                  <TableCell className="font-medium">
                    {improvement.descricao}
                  </TableCell>
                  <TableCell>{improvement.dimensoes || "-"}</TableCell>
                  <TableCell>{formatCurrency(improvement.valor)}</TableCell>
                  <TableCell className="text-right">
                    <ImprovementRowActions
                      improvement={improvement}
                      propertyId={propertyId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma benfeitoria cadastrada"
            description="Cadastre benfeitorias e melhorias realizadas nesta propriedade."
            icon={<Building size={48} className="text-muted-foreground" />}
            action={
              propertyId && (
                <ImprovementListActions
                  propertyId={propertyId}
                  organizationId={organizationId || ""}
                  useModal={false}
                />
              )
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
