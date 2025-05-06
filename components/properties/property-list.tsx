"use client";

import { useState } from "react";
import { Property, PropertyType } from "@/schemas/properties";
import { PropertyCard } from "@/components/properties/property-card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusIcon, Search, XIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

interface PropertyListProps {
  properties: Property[];
}

export function PropertyList({ properties }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "ALL">("ALL");

  // Filtrar propriedades baseado no termo de busca e filtro de tipo
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.proprietario.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "ALL" || property.tipo === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Propriedades</h2>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Propriedade
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade ou proprietário..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Limpar busca</span>
            </Button>
          )}
        </div>
        <Select 
          value={typeFilter} 
          onValueChange={(value) => setTypeFilter(value as PropertyType | "ALL")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="PROPRIO">Próprias</SelectItem>
            <SelectItem value="ARRENDADO">Arrendadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(searchTerm || typeFilter !== "ALL") && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProperties.length} 
            {filteredProperties.length === 1 ? ' propriedade encontrada' : ' propriedades encontradas'}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma propriedade encontrada"
          description={
            searchTerm || typeFilter !== "ALL"
              ? "Tente ajustar seus filtros para encontrar o que está procurando."
              : "Comece cadastrando sua primeira propriedade."
          }
          icon={<Search size={48} className="text-muted-foreground" />}
          action={
            searchTerm || typeFilter !== "ALL" ? (
              <Button onClick={clearFilters}>Limpar filtros</Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/properties/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Propriedade
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}