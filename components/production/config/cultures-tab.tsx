"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Plus, Edit2Icon, Trash2, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Culture,
  CultureFormValues,
  cultureFormSchema,
} from "@/schemas/production";
import {
  createCulture,
  updateCulture,
  deleteCulture,
} from "@/lib/actions/production-actions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CulturesTabProps {
  initialCultures: Culture[];
  organizationId: string;
}

export const CulturesTab = forwardRef<any, CulturesTabProps>(function CulturesTab({
  initialCultures,
  organizationId,
}, ref) {
  const [cultures, setCultures] = useState<Culture[]>(initialCultures);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCulture, setEditingCulture] = useState<Culture | null>(null);

  const form = useForm<CultureFormValues>({
    resolver: zodResolver(cultureFormSchema),
    defaultValues: {
      nome: "",
    },
  });

  useImperativeHandle(ref, () => ({
    handleCreate,
  }));

  // Função para abrir o diálogo de edição
  const handleEdit = (culture: Culture) => {
    setEditingCulture(culture);
    form.reset({ nome: culture.nome });
    setOpenDialog(true);
  };

  // Função para abrir o diálogo de criação
  const handleCreate = () => {
    setEditingCulture(null);
    form.reset({ nome: "" });
    setOpenDialog(true);
  };

  // Função para salvar (criar ou atualizar)
  const onSubmit = async (values: CultureFormValues) => {
    try {
      setIsSubmitting(true);

      if (editingCulture) {
        // Atualizar cultura existente
        const updated = await updateCulture(editingCulture.id!, values);
        setCultures(
          cultures.map((c) => (c.id === editingCulture.id ? updated : c))
        );
        toast.success("Cultura atualizada com sucesso!");
      } else {
        // Criar nova cultura
        const created = await createCulture(organizationId, values);
        setCultures([...cultures, created]);
        toast.success("Cultura criada com sucesso!");
      }

      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao salvar cultura:", error);
      toast.error("Ocorreu um erro ao salvar a cultura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir
  const handleDelete = async (id: string) => {
    try {
      await deleteCulture(id);
      setCultures(cultures.filter((c) => c.id !== id));
      toast.success("Cultura excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir cultura:", error);
      toast.error("Ocorreu um erro ao excluir a cultura.");
    }
  };

  return (
    <div className="space-y-4">
      {cultures.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Nenhuma cultura cadastrada.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cultures.map((culture) => (
                <TableRow key={culture.id}>
                  <TableCell className="font-medium">{culture.nome}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(culture)}>
                          <Edit2Icon className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Cultura</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a cultura "
                                {culture.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => handleDelete(culture.id!)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCulture ? "Editar Cultura" : "Nova Cultura"}
            </DialogTitle>
            <DialogDescription>
              {editingCulture
                ? "Edite os detalhes da cultura selecionada."
                : "Adicione uma nova cultura ao sistema."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Cultura</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Soja, Milho, Algodão"
                        {...field}
                      />
                    </FormControl>
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
                  {editingCulture ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
});
