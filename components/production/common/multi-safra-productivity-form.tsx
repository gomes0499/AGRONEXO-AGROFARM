'use client'

import { useState } from 'react'
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, TrendingUp, Calculator } from 'lucide-react'
import { toast } from 'sonner'

// Define unit type to ensure type safety
export type ProductivityUnit = 'sc/ha' | '@/ha' | 'kg/ha' | 'ton/ha';

const multiSafraProductivitySchema = z.object({
  propriedade_id: z.string().min(1, "Propriedade é obrigatória"),
  cultura_id: z.string().min(1, "Cultura é obrigatória"),
  sistema_id: z.string().min(1, "Sistema é obrigatório"),
  produtividades_por_safra: z.array(z.object({
    safra_id: z.string().min(1, "Safra é obrigatória"),
    produtividade: z.coerce.number().min(0, "Produtividade deve ser maior ou igual a 0"),
    unidade: z.enum(['sc/ha', '@/ha', 'kg/ha', 'ton/ha'] as const),
  })).min(1, "Adicione pelo menos uma produtividade por safra"),
})

type MultiSafraProductivityFormData = z.infer<typeof multiSafraProductivitySchema>

interface MultiSafraProductivityFormProps {
  properties: { id: string; nome: string }[]
  cultures: { id: string; nome: string }[]
  systems: { id: string; nome: string }[]
  safras: { id: string; nome: string }[]
  onSubmit: (data: MultiSafraProductivityFormData) => Promise<void>
  trigger?: React.ReactNode
}

// Unidade conversion factors to kg/ha
const UNIT_CONVERSIONS: Record<ProductivityUnit, number> = {
  'sc/ha': 60, // 1 saca = 60kg
  '@/ha': 15, // 1 arroba = 15kg
  'kg/ha': 1,
  'ton/ha': 1000,
}

const UNIT_LABELS: Record<ProductivityUnit, string> = {
  'sc/ha': 'Sacas por hectare',
  '@/ha': 'Arrobas por hectare',
  'kg/ha': 'Quilos por hectare',
  'ton/ha': 'Toneladas por hectare',
}

export function MultiSafraProductivityForm({
  properties,
  cultures,
  systems,
  safras,
  onSubmit,
  trigger
}: MultiSafraProductivityFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MultiSafraProductivityFormData>({
    resolver: zodResolver(multiSafraProductivitySchema),
    defaultValues: {
      propriedade_id: '',
      cultura_id: '',
      sistema_id: '',
      produtividades_por_safra: [{ safra_id: '', produtividade: 0, unidade: 'sc/ha' as ProductivityUnit }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'produtividades_por_safra',
  })

  const watchedProductivities = form.watch('produtividades_por_safra')

  const handleSubmit: SubmitHandler<MultiSafraProductivityFormData> = async (data) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success(`${data.produtividades_por_safra.length} produtividade(s) adicionada(s) com sucesso!`)
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao adicionar produtividades')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addProductivity = () => {
    append({ safra_id: '', produtividade: 0, unidade: 'sc/ha' as ProductivityUnit })
  }

  const removeProductivity = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  interface SafraProductivity {
    safra_id: string;
    produtividade: number;
    unidade: ProductivityUnit;
  }

  const getUsedSafras = () => {
    return watchedProductivities.map((p: SafraProductivity) => p.safra_id).filter(Boolean)
  }

  const getAvailableSafras = (currentIndex: number) => {
    const usedSafras = getUsedSafras()
    const currentSafra = watchedProductivities[currentIndex]?.safra_id
    return safras.filter(safra => {
      if (!safra.id) return false;
      return !usedSafras.includes(safra.id) || safra.id === currentSafra;
    })
  }

  const calculateEquivalence = (produtividade: number, unidade: ProductivityUnit, targetUnit: ProductivityUnit) => {
    if (!produtividade || produtividade === 0) return 0
    
    const kgPerHa = produtividade * UNIT_CONVERSIONS[unidade]
    const targetValue = kgPerHa / UNIT_CONVERSIONS[targetUnit]
    
    return Number(targetValue.toFixed(2))
  }

  const getAverageProductivity = () => {
    const validProductivities = watchedProductivities.filter((p: SafraProductivity) => p.produtividade > 0)
    if (validProductivities.length === 0) return 0

    // Convert all to kg/ha first, then calculate average
    const totalKgHa = validProductivities.reduce((sum, p: SafraProductivity) => {
      return sum + (p.produtividade * UNIT_CONVERSIONS[p.unidade])
    }, 0)

    return Number((totalKgHa / validProductivities.length).toFixed(0))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Múltiplas Produtividades
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Adicionar Produtividades por Safra
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Fixed Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração Base</CardTitle>
                <CardDescription>
                  Estas configurações serão aplicadas para todas as safras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="propriedade_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propriedade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a propriedade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cultura_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cultura</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cultura" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cultures.map((culture) => (
                              <SelectItem key={culture.id} value={culture.id}>
                                {culture.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sistema_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {systems.map((system) => (
                              <SelectItem key={system.id} value={system.id}>
                                {system.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Productivity Fields */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Produtividades por Safra</CardTitle>
                  <CardDescription>
                    Adicione as produtividades para cada safra desejada
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addProductivity}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const currentProductivity = watchedProductivities[index]
                  const availableSafras = getAvailableSafras(index)

                  return (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Produtividade #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductivity(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`produtividades_por_safra.${index}.safra_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Safra</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a safra" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableSafras.map((safra) => (
                                    <SelectItem key={safra.id} value={safra.id}>
                                      {safra.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`produtividades_por_safra.${index}.unidade`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidade</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(Object.entries(UNIT_LABELS) as [ProductivityUnit, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`produtividades_por_safra.${index}.produtividade`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Produtividade</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Unit Equivalences */}
                      {currentProductivity?.produtividade > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Equivalências</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(Object.entries(UNIT_LABELS) as [ProductivityUnit, string][]).map(([unit, label]) => {
                              if (unit === currentProductivity.unidade) return null
                              const equivalentValue = calculateEquivalence(
                                currentProductivity.produtividade, 
                                currentProductivity.unidade as ProductivityUnit, 
                                unit
                              )
                              return (
                                <Badge key={unit} variant="secondary" className="text-xs">
                                  {equivalentValue} {unit}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Summary */}
            {watchedProductivities.some((p: SafraProductivity) => p.produtividade > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {watchedProductivities.filter((p: SafraProductivity) => p.produtividade > 0).length}
                      </div>
                      <div className="text-sm text-green-700">Safras com produtividade</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {getAverageProductivity()}
                      </div>
                      <div className="text-sm text-blue-700">Média (kg/ha)</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {Number((getAverageProductivity() / 60).toFixed(1))}
                      </div>
                      <div className="text-sm text-amber-700">Média (sc/ha)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : `Salvar ${fields.length} Produtividade(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}