"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  priority?: "high" | "medium" | "low"; // For mobile: high always shows, medium in expanded, low hidden
}

interface MobileTableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function MobileTable<T>({
  data,
  columns,
  renderMobileCard,
  keyExtractor,
  className,
  emptyMessage = "Nenhum item encontrado",
  onRowClick,
}: MobileTableProps<T>) {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  // Mobile card view
  if (isMobile) {
    if (renderMobileCard) {
      return (
        <div className="space-y-3">
          {data.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {emptyMessage}
            </Card>
          ) : (
            data.map((item, index) => renderMobileCard(item, index))
          )}
        </div>
      );
    }

    // Default mobile card view
    return (
      <div className="space-y-3">
        {data.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </Card>
        ) : (
          data.map((item, index) => {
            const key = keyExtractor(item, index);
            const isExpanded = expandedRows.has(key);
            const highPriorityColumns = columns.filter((col) => col.priority === "high" || !col.priority);
            const mediumPriorityColumns = columns.filter((col) => col.priority === "medium");

            return (
              <Card 
                key={key} 
                className={cn(
                  "transition-all",
                  onRowClick && "cursor-pointer hover:shadow-md"
                )}
                onClick={() => onRowClick?.(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      {highPriorityColumns.map((column) => (
                        <div key={column.key} className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground min-w-[80px]">
                            {column.header}:
                          </span>
                          <div className="flex-1 text-sm font-medium">
                            {column.accessor(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {mediumPriorityColumns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(key);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {isExpanded && mediumPriorityColumns.length > 0 && (
                  <CardContent className="pt-0 space-y-2 border-t">
                    {mediumPriorityColumns.map((column) => (
                      <div key={column.key} className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground min-w-[80px]">
                          {column.header}:
                        </span>
                        <div className="flex-1 text-sm">
                          {column.accessor(item)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left p-4 font-medium text-sm",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center p-8 text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className={cn(
                  "border-b transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("p-4 text-sm", column.className)}
                  >
                    {column.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}