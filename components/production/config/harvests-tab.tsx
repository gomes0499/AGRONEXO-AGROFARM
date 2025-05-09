"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Harvest, HarvestFormValues, harvestFormSchema } from "@/schemas/production";
import { createHarvest, updateHarvest, deleteHarvest } from "@/lib/actions/production-actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HarvestsTabProps {
  initialHarvests: Harvest[];
  organizationId: string;
}

export function HarvestsTab({ initialHarvests, organizationId }: HarvestsTabProps) {
  const [harvests, setHarvests] = useState<Harvest[]>(initialHarvests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestFormSchema),
    defaultValues: {
      nome: "",
      ano_inicio: new Date().getFullYear(),
      ano_fim: new Date().getFullYear() + 1,
    },
  });
  
  // Função para abrir o diálogo de edição
  const handleEdit = (harvest: Harvest) => {
    setEditingHarvest(harvest);
    form.reset({
      nome: harvest.nome,
      ano_inicio: harvest.ano_inicio,
      ano_fim: harvest.ano_fim,
    });
    setOpenDialog(true);
  };
  
  // Função para abrir o diálogo de criação
  const handleCreate = () => {
    setEditingHarvest(null);
    const currentYear = new Date().getFullYear();
    form.reset({
      nome: "",
      ano_inicio: currentYear,
      ano_fim: currentYear + 1,
    });
    setOpenDialog(true);
  };
  
  // Função para salvar (criar ou atualizar)
  const onSubmit = async (values: HarvestFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (editingHarvest) {
        // Atualizar safra existente
        const updated = await updateHarvest(editingHarvest.id!, values);
        setHarvests(harvests.map(h => h.id === editingHarvest.id ? updated : h));
        toast.success("Safra atualizada com sucesso!");
      } else {
        // Criar nova safra
        const created = await createHarvest(organizationId, values);
        setHarvests([...harvests, created]);
        toast.success("Safra criada com sucesso!");
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao salvar safra:", error);
      toast.error("Ocorreu um erro ao salvar a safra.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteHarvest(id);
      setHarvests(harvests.filter(h => h.id !== id));
      toast.success("Safra excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir safra:", error);
      toast.error("Ocorreu um erro ao excluir a safra.");
    }
  };
  
  // Monta o nome da safra automaticamente a partir dos anos
  const updateHarvestName = () => {
    const anoInicio = form.getValues("ano_inicio");
    const anoFim = form.getValues("ano_fim");
    
    if (anoInicio && anoFim) {
      const shortYearStart = String(anoInicio).slice(-2);
      const shortYearEnd = String(anoFim).slice(-2);
      form.setValue("nome", `${anoInicio}/${shortYearEnd}`);
    }
  };
  
  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Safras</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Safra
        </Button>
      </div>
      
      {harvests.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Nenhuma safra cadastrada. Clique em "Nova Safra" para adicionar.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ano Início</TableHead>
              <TableHead>Ano Fim</TableHead>
              <TableHead className="w-[150px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {harvests.map((harvest) => (
              <TableRow key={harvest.id}>
                <TableCell>{harvest.nome}</TableCell>
                <TableCell>{harvest.ano_inicio}</TableCell>
                <TableCell>{harvest.ano_fim}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(harvest)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Safra</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a safra "{harvest.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => handleDelete(harvest.id!)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHarvest ? "Editar Safra" : "Nova Safra"}
            </DialogTitle>
            <DialogDescription>
              {editingHarvest
                ? "Edite os detalhes da safra selecionada."
                : "Adicione uma nova safra agrícola."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ano_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Início</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={2000} 
                          max={2100} 
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value));
                            setTimeout(updateHarvestName, 0);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ano_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Fim</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={2000} 
                          max={2100} 
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value));
                            setTimeout(updateHarvestName, 0);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Safra</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2023/24" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome é gerado automaticamente a partir dos anos de início e fim, mas pode ser personalizado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingHarvest ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}