"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Download,
  Filter,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import {
  PRODUCTS_TABLE,
  UNITS,
  calculateTotalInteiras,
  padLeft,
  type CountConfig,
  type CountItem,
} from "./stock-count";

interface SavedCount {
  id: string;
  config: CountConfig;
  items: CountItem[];
  savedAt: string;
}

export function AnalystPanel() {
  const [savedCounts, setSavedCounts] = useState<SavedCount[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    countId: string;
    item: CountItem;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    pallet: "",
    lastro: "",
    caixa: "",
    unidadeAvulsa: "",
  });

  // Filtros
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");

  useEffect(() => {
    loadSavedCounts();
  }, []);

  const loadSavedCounts = () => {
    const saved = localStorage.getItem("stockCounts");
    if (saved) {
      setSavedCounts(JSON.parse(saved));
    }
  };

  const filteredCounts = useMemo(() => {
    return savedCounts.filter((count) => {
      // Filtro por unidade
      if (filterUnit !== "all" && count.config.unit !== filterUnit) {
        return false;
      }

      // Filtro por data inicial
      if (filterDateFrom && count.config.date < filterDateFrom) {
        return false;
      }

      // Filtro por data final
      if (filterDateTo && count.config.date > filterDateTo) {
        return false;
      }

      // Filtro por busca (código ou nome do produto)
      if (filterSearch) {
        const searchLower = filterSearch.toLowerCase();
        const hasMatch = count.items.some(
          (item) =>
            item.itemCode.includes(filterSearch) ||
            item.itemName.toLowerCase().includes(searchLower)
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [savedCounts, filterUnit, filterDateFrom, filterDateTo, filterSearch]);

  const handleDeleteCount = (id: string) => {
    const updated = savedCounts.filter((c) => c.id !== id);
    setSavedCounts(updated);
    localStorage.setItem("stockCounts", JSON.stringify(updated));
  };

  const handleDeleteItem = (countId: string, itemId: string) => {
    const updated = savedCounts.map((count) => {
      if (count.id === countId) {
        return {
          ...count,
          items: count.items.filter((item) => item.id !== itemId),
        };
      }
      return count;
    });
    setSavedCounts(updated);
    localStorage.setItem("stockCounts", JSON.stringify(updated));
  };

  const handleEditItem = (countId: string, item: CountItem) => {
    setEditingItem({ countId, item });
    setEditForm({
      pallet: String(item.pallet),
      lastro: String(item.lastro),
      caixa: String(item.caixa),
      unidadeAvulsa: String(item.unidadeAvulsa),
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const updated = savedCounts.map((count) => {
      if (count.id === editingItem.countId) {
        return {
          ...count,
          items: count.items.map((item) => {
            if (item.id === editingItem.item.id) {
              return {
                ...item,
                pallet: Number(editForm.pallet) || 0,
                lastro: Number(editForm.lastro) || 0,
                caixa: Number(editForm.caixa) || 0,
                unidadeAvulsa: Number(editForm.unidadeAvulsa) || 0,
              };
            }
            return item;
          }),
        };
      }
      return count;
    });

    setSavedCounts(updated);
    localStorage.setItem("stockCounts", JSON.stringify(updated));
    setEditingItem(null);
  };

  const generateCSVContent = (count: SavedCount) => {
    const lines = count.items.map((item) => {
      const warehouseCode = padLeft(count.config.warehouse, 2);
      const depositCode = padLeft(count.config.deposit, 2);
      const itemCode = padLeft(item.itemCode, 7);
      const totalInteiras = calculateTotalInteiras(item);
      const quantidadeInteira = padLeft(totalInteiras, 7);
      const quantidadeAvulsa = padLeft(item.unidadeAvulsa, 2);

      return `${warehouseCode};${depositCode};${itemCode};${quantidadeInteira};${quantidadeAvulsa}`;
    });

    return lines.join("\n");
  };

  const handleExportCSV = (count: SavedCount) => {
    const csvContent = generateCSVContent(count);
    const dateFormatted = count.config.date.split("-").reverse().join("");
    const fileName = `CONTAGEM_ESTOQUE_${count.config.unit}_${dateFormatted}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    filteredCounts.forEach((count) => {
      handleExportCSV(count);
    });
  };

  const getUnitName = (code: string) => {
    return UNITS.find((u) => u.code === code)?.name || code;
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleString("pt-BR");
  };

  const clearFilters = () => {
    setFilterUnit("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSearch("");
  };

  // Estatísticas
  const totalContagens = filteredCounts.length;
  const totalItens = filteredCounts.reduce((acc, c) => acc + c.items.length, 0);
  const totalInteirasGeral = filteredCounts.reduce(
    (acc, c) => acc + c.items.reduce((sum, item) => sum + calculateTotalInteiras(item), 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <BarChart3 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Painel do Analista</h1>
              <p className="text-sm text-muted-foreground">Controle de Contagens</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{totalContagens}</div>
              <p className="text-sm text-muted-foreground">Contagens</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{totalItens}</div>
              <p className="text-sm text-muted-foreground">Itens Totais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{totalInteirasGeral.toLocaleString("pt-BR")}</div>
              <p className="text-sm text-muted-foreground">Total de Inteiras</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.code} value={unit.code}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Inicial</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Final</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar Produto</Label>
                <Input
                  placeholder="Código ou nome..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1 bg-transparent">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  onClick={handleExportAll}
                  disabled={filteredCounts.length === 0}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Todos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contagens */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              Contagens Salvas
              <Badge variant="secondary" className="ml-2">
                {filteredCounts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma contagem encontrada.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajuste os filtros ou aguarde novas contagens.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCounts.map((count) => (
                  <div key={count.id} className="border rounded-lg overflow-hidden">
                    {/* Header da Contagem */}
                    <div
                      className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedId(expandedId === count.id ? null : count.id)}
                    >
                      <div className="flex items-center gap-4">
                        {expandedId === count.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {getUnitName(count.config.unit)} - {formatDate(count.config.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Armazém: {count.config.warehouse} | Depósito: {count.config.deposit} |
                            Salvo em: {formatDateTime(count.savedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{count.items.length} itens</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCSV(count);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Exportar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Contagem</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta contagem inteira? Esta ação não
                                  pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCount(count.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Itens (expandida) */}
                    {expandedId === count.id && (
                      <div className="p-4 border-t">
                        <div className="rounded-md border overflow-hidden">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-semibold text-xs">Código</TableHead>
                                  <TableHead className="font-semibold text-xs">Nome</TableHead>
                                  <TableHead className="text-center font-semibold text-xs">
                                    Pallet
                                  </TableHead>
                                  <TableHead className="text-center font-semibold text-xs">
                                    Lastro
                                  </TableHead>
                                  <TableHead className="text-center font-semibold text-xs">
                                    Caixa
                                  </TableHead>
                                  <TableHead className="text-center font-semibold text-xs">
                                    Avulsa
                                  </TableHead>
                                  <TableHead className="text-center font-semibold text-xs">
                                    Total Int.
                                  </TableHead>
                                  <TableHead className="text-right font-semibold text-xs">
                                    Ações
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {count.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">
                                      {item.itemCode}
                                    </TableCell>
                                    <TableCell
                                      className="max-w-[150px] truncate text-xs"
                                      title={item.itemName}
                                    >
                                      {item.itemName}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">
                                      {item.pallet}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">
                                      {item.lastro}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">
                                      {item.caixa}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">
                                      {item.unidadeAvulsa}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-xs text-primary">
                                      {calculateTotalInteiras(item)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditItem(count.id, item)}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Pencil className="h-3 w-3" />
                                          <span className="sr-only">Editar</span>
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                              <span className="sr-only">Excluir</span>
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Tem certeza que deseja excluir o item &quot;
                                                {item.itemName}&quot;?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleDeleteItem(count.id, item.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Excluir
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <div className="rounded-lg bg-muted px-4 py-2">
                            <span className="text-sm text-muted-foreground">Total: </span>
                            <span className="font-semibold text-foreground">
                              {count.items
                                .reduce((sum, item) => sum + calculateTotalInteiras(item), 0)
                                .toLocaleString("pt-BR")}{" "}
                              inteiras
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de Edição */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              {editingItem && (
                <>
                  {editingItem.item.itemName} ({editingItem.item.itemCode})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pallet">Pallet</Label>
                <Input
                  id="edit-pallet"
                  type="number"
                  min="0"
                  value={editForm.pallet}
                  onChange={(e) => setEditForm({ ...editForm, pallet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastro">Lastro</Label>
                <Input
                  id="edit-lastro"
                  type="number"
                  min="0"
                  value={editForm.lastro}
                  onChange={(e) => setEditForm({ ...editForm, lastro: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-caixa">Caixa</Label>
                <Input
                  id="edit-caixa"
                  type="number"
                  min="0"
                  value={editForm.caixa}
                  onChange={(e) => setEditForm({ ...editForm, caixa: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-avulsa">Unidades Avulsas</Label>
                <Input
                  id="edit-avulsa"
                  type="number"
                  min="0"
                  max="99"
                  value={editForm.unidadeAvulsa}
                  onChange={(e) => setEditForm({ ...editForm, unidadeAvulsa: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
