"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  History,
  Download,
  Calendar,
  FileText,
  Target,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getRatingHistory, deleteRatingHistory, type RatingHistoryItem } from "@/lib/actions/rating-history-actions";
import { generateRatingPDFOnly } from "@/lib/actions/rating-pdf-export";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface RatingHistoryTabProps {
  organizationId: string;
}

export function RatingHistoryTab({ organizationId }: RatingHistoryTabProps) {
  const [history, setHistory] = useState<RatingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RatingHistoryItem | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadHistory();
  }, [organizationId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getRatingHistory(organizationId);
      setHistory(data);
    } catch (error) {
      console.error("Error loading rating history:", error);
      toast.error("Erro ao carregar histórico de ratings");
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      'AAA': '#00a86b',
      'AA': '#228b22',
      'A': '#32cd32',
      'BBB': '#ffd700',
      'BB': '#ff8c00',
      'B': '#ff6347',
      'CCC': '#dc143c',
      'CC': '#8b0000',
      'C': '#800000',
      'D': '#4b0000',
    };
    
    // Find the base rating (AAA, AA, A, etc)
    const baseRating = rating.replace(/[0-9]/g, '');
    return colors[baseRating] || '#666666';
  };

  const handleDownloadPDF = async (item: RatingHistoryItem) => {
    try {
      setDownloadingId(item.id!);
      // Fetch the rating calculation details
      const { data: calculation } = await supabase
        .from("rating_calculations")
        .select("*")
        .eq("id", item.rating_calculation_id)
        .single();
        
      if (!calculation) {
        toast.error("Erro ao buscar dados do rating");
        return;
      }
      
      // Generate the PDF without saving to history again
      const result = await generateRatingPDFOnly(calculation, item.organizacao?.nome || "Organização");
      
      if (result.success && result.data) {
        // Create a blob from the base64 data
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.pdf_file_name || `rating_${item.rating_letra}_${new Date(item.created_at!).toISOString().split('T')[0]}.pdf`;
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        toast.success("PDF baixado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Erro ao baixar PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setDeletingId(itemToDelete.id!);
      await deleteRatingHistory(itemToDelete.id!);
      toast.success("Rating excluído com sucesso!");
      await loadHistory(); // Reload the history
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Erro ao excluir rating");
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (item: RatingHistoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <History className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Histórico de Ratings
                </h3>
                <p className="text-sm text-white/80">
                  Consulte o histórico de classificações geradas
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum rating encontrado
              </h3>
              <p className="text-muted-foreground">
                O histórico de ratings aparecerá aqui após gerar sua primeira classificação
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-lg">
                      Data
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Rating
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Pontuação
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Safra
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Cenário
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Modelo
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-lg">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(item.created_at!).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at!), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{ 
                            color: getRatingColor(item.rating_letra),
                            borderColor: getRatingColor(item.rating_letra)
                          }}
                          className="font-bold text-lg px-3 py-1"
                        >
                          {item.rating_letra}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.pontuacao_total.toFixed(1)} pts
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.safra?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.scenario?.name || 'Base'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="text-sm">
                            {item.modelo?.nome || 'SR/Prime'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPDF(item)}
                            disabled={downloadingId === item.id}
                          >
                            {downloadingId === item.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Baixando...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(item)}
                            disabled={deletingId === item.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o rating{" "}
              <span className="font-semibold" style={{ color: itemToDelete ? getRatingColor(itemToDelete.rating_letra) : undefined }}>
                {itemToDelete?.rating_letra}
              </span>{" "}
              da safra {itemToDelete?.safra?.nome || ""}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingId === itemToDelete?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === itemToDelete?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}