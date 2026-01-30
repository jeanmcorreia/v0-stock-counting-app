"use client";

import { useState, useMemo } from "react";
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
  Pencil,
  Trash2,
  Download,
  RefreshCcw,
  Plus,
  Package,
  Settings,
  ClipboardList,
  FolderUp,
  Loader2,
} from "lucide-react";

// Tabela fixa de produtos com conversão direta de pallet, lastro e caixa para inteiras
const PRODUCTS_TABLE: Record<
  string,
  { name: string; palletToInteiras: number; lastroToInteiras: number; caixaToInteiras: number }
> = {
  "0000982": { name: "SKOL 1/1", palletToInteiras: 84, lastroToInteiras: 14, caixaToInteiras: 2 },
  "0000002": { name: "Feijão Preto 1kg", palletToInteiras: 1200, lastroToInteiras: 120, caixaToInteiras: 12 },
  "0000003": { name: "Açúcar Cristal 5kg", palletToInteiras: 432, lastroToInteiras: 36, caixaToInteiras: 6 },
  "0000004": { name: "Óleo de Soja 900ml", palletToInteiras: 2400, lastroToInteiras: 240, caixaToInteiras: 20 },
  "0000005": { name: "Farinha de Trigo 1kg", palletToInteiras: 900, lastroToInteiras: 90, caixaToInteiras: 10 },
  "0000006": { name: "Macarrão Espaguete 500g", palletToInteiras: 3600, lastroToInteiras: 360, caixaToInteiras: 24 },
  "0000007": { name: "Sal Refinado 1kg", palletToInteiras: 1008, lastroToInteiras: 84, caixaToInteiras: 12 },
  "0000008": { name: "Leite UHT 1L", palletToInteiras: 1296, lastroToInteiras: 144, caixaToInteiras: 12 },
  "0000009": { name: "Café Torrado 500g", palletToInteiras: 600, lastroToInteiras: 60, caixaToInteiras: 10 },
  "0000010": { name: "Biscoito Cream Cracker 400g", palletToInteiras: 1728, lastroToInteiras: 144, caixaToInteiras: 18 },
};

const UNITS = [
  { code: "0001", name: "Disbec São Miguel" },
  { code: "0002", name: "Disbec Penedo" },
  { code: "0003", name: "Filial 02" },
  { code: "0004", name: "Filial 03" },
  { code: "0005", name: "Filial 04" },
];

interface CountConfig {
  unit: string;
  date: string;
  warehouse: string;
  deposit: string;
}

interface CountItem {
  id: string;
  itemCode: string;
  itemName: string;
  pallet: number;
  lastro: number;
  caixa: number;
  unidadeAvulsa: number;
}

function padLeft(value: number | string, length: number): string {
  return String(value).padStart(length, "0");
}

export function StockCount() {
  const [config, setConfig] = useState<CountConfig>({
    unit: "",
    date: new Date().toISOString().split("T")[0],
    warehouse: "",
    deposit: "",
  });

  const [currentItem, setCurrentItem] = useState({
    itemCode: "",
    pallet: "",
    lastro: "",
    caixa: "",
    unidadeAvulsa: "",
  });

  const [items, setItems] = useState<CountItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const productName = useMemo(() => {
    const code = currentItem.itemCode.padStart(7, "0");
    return PRODUCTS_TABLE[code]?.name || "";
  }, [currentItem.itemCode]);

  const handleAddItem = () => {
    const code = currentItem.itemCode.padStart(7, "0");
    const product = PRODUCTS_TABLE[code];

    if (!product) {
      alert("Código do item não encontrado na tabela de produtos!");
      return;
    }

    if (!config.warehouse || !config.deposit || !config.unit || !config.date) {
      alert("Por favor, preencha todas as configurações da contagem!");
      return;
    }

    const newItem: CountItem = {
      id: editingId || crypto.randomUUID(),
      itemCode: code,
      itemName: product.name,
      pallet: Number(currentItem.pallet) || 0,
      lastro: Number(currentItem.lastro) || 0,
      caixa: Number(currentItem.caixa) || 0,
      unidadeAvulsa: Number(currentItem.unidadeAvulsa) || 0,
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? newItem : item)));
      setEditingId(null);
    } else {
      setItems([...items, newItem]);
    }

    setCurrentItem({
      itemCode: "",
      pallet: "",
      lastro: "",
      caixa: "",
      unidadeAvulsa: "",
    });
  };

  const handleEdit = (item: CountItem) => {
    setEditingId(item.id);
    setCurrentItem({
      itemCode: item.itemCode,
      pallet: String(item.pallet),
      lastro: String(item.lastro),
      caixa: String(item.caixa),
      unidadeAvulsa: String(item.unidadeAvulsa),
    });
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
    setCurrentItem({
      itemCode: "",
      pallet: "",
      lastro: "",
      caixa: "",
      unidadeAvulsa: "",
    });
    setEditingId(null);
  };

  // Calcula o total de inteiras (pallet + lastro + caixa, cada um com seu próprio fator de conversão)
  const calculateTotalInteiras = (item: CountItem): number => {
    const product = PRODUCTS_TABLE[item.itemCode];
    if (!product) return item.caixa;

    // Cada unidade tem seu próprio fator de conversão para inteiras
    const inteirasFromPallet = item.pallet * product.palletToInteiras;
    const inteirasFromLastro = item.lastro * product.lastroToInteiras;
    const inteirasFromCaixa = item.caixa * product.caixaToInteiras;
    
    return inteirasFromPallet + inteirasFromLastro + inteirasFromCaixa;
  };

  const generateCSVContent = () => {
    const lines = items.map((item) => {
      const warehouseCode = padLeft(config.warehouse, 2);
      const depositCode = padLeft(config.deposit, 2);
      const itemCode = padLeft(item.itemCode, 7);
      const totalInteiras = calculateTotalInteiras(item);
      const quantidadeInteira = padLeft(totalInteiras, 7);
      const quantidadeAvulsa = padLeft(item.unidadeAvulsa, 2);

      return `${warehouseCode};${depositCode};${itemCode};${quantidadeInteira};${quantidadeAvulsa}`;
    });

    return lines.join("\n");
  };

  const getFileName = () => {
    const unitCode = config.unit;
    const dateFormatted = config.date.split("-").reverse().join("");
    return `CONTAGEM_ESTOQUE_${unitCode}_${dateFormatted}.csv`;
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert("Nenhum item para exportar!");
      return;
    }

    const csvContent = generateCSVContent();
    const fileName = getFileName();

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

  const handleSendToSharedFolder = async () => {
    if (items.length === 0) {
      alert("Nenhum item para enviar!");
      return;
    }

    setIsSending(true);

    try {
      const csvContent = generateCSVContent();
      const fileName = getFileName();

      const response = await fetch("/api/send-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          content: csvContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Arquivo ${fileName} enviado com sucesso para a pasta compartilhada!`);
      } else {
        alert(`Erro ao enviar arquivo: ${result.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      alert("Erro ao enviar arquivo para a pasta compartilhada. Verifique a conexão.");
    } finally {
      setIsSending(false);
    }
  };

  const totalItems = items.length;
  const totalInteirasGeral = items.reduce((acc, item) => acc + calculateTotalInteiras(item), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Contagem de Estoque</h1>
              <p className="text-sm text-muted-foreground">Sistema de inventário</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna da esquerda - Configurações e Item */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configurações da Contagem */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4 text-primary" />
                  Configurações da Contagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium">
                    Unidade
                  </Label>
                  <Select
                    value={config.unit}
                    onValueChange={(value) => setConfig({ ...config, unit: value })}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit.code} value={unit.code}>
                          {unit.name} ({unit.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={config.date}
                    onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse" className="text-sm font-medium">
                      Armazém
                    </Label>
                    <Input
                      id="warehouse"
                      type="number"
                      min="0"
                      max="99"
                      placeholder="00"
                      value={config.warehouse}
                      onChange={(e) => setConfig({ ...config, warehouse: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit" className="text-sm font-medium">
                      Depósito
                    </Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      max="99"
                      placeholder="00"
                      value={config.deposit}
                      onChange={(e) => setConfig({ ...config, deposit: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adicionar Item */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-primary" />
                  {editingId ? "Editar Item" : "Adicionar Item"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemCode" className="text-sm font-medium">
                    Código do Item
                  </Label>
                  <Input
                    id="itemCode"
                    type="text"
                    maxLength={7}
                    placeholder="0000001"
                    value={currentItem.itemCode}
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, itemCode: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Item</Label>
                  <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm min-h-[40px] flex items-center">
                    {productName || (
                      <span className="text-muted-foreground">
                        Digite o código para ver o nome
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pallet" className="text-sm font-medium">
                      Pallet
                    </Label>
                    <Input
                      id="pallet"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.pallet}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, pallet: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastro" className="text-sm font-medium">
                      Lastro
                    </Label>
                    <Input
                      id="lastro"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.lastro}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, lastro: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="caixa" className="text-sm font-medium">
                      Caixa
                    </Label>
                    <Input
                      id="caixa"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.caixa}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, caixa: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidadeAvulsa" className="text-sm font-medium">
                      Unidades Avulsas
                    </Label>
                    <Input
                      id="unidadeAvulsa"
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={currentItem.unidadeAvulsa}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, unidadeAvulsa: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleAddItem} className="w-full">
                  {editingId ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Atualizar Item
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Item
                    </>
                  )}
                </Button>

                {editingId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setCurrentItem({
                        itemCode: "",
                        pallet: "",
                        lastro: "",
                        caixa: "",
                        unidadeAvulsa: "",
                      });
                    }}
                    className="w-full"
                  >
                    Cancelar Edição
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna da direita - Itens Digitados */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Itens Digitados
                    <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {totalItems}
                    </span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={items.length === 0}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Limpar Tudo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja limpar todos os itens? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAll}>
                            Limpar Tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button size="sm" onClick={handleExportCSV} disabled={items.length === 0}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSendToSharedFolder}
                      disabled={items.length === 0 || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FolderUp className="mr-2 h-4 w-4" />
                      )}
                      {isSending ? "Enviando..." : "Enviar para Pasta"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum item adicionado ainda.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use o formulário ao lado para adicionar itens.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">Código</TableHead>
                              <TableHead className="font-semibold">Nome do Item</TableHead>
                              <TableHead className="text-center font-semibold">Pallet</TableHead>
                              <TableHead className="text-center font-semibold">Lastro</TableHead>
                              <TableHead className="text-center font-semibold">Caixa</TableHead>
                              <TableHead className="text-center font-semibold">Avulsa</TableHead>
                              <TableHead className="text-center font-semibold">Total Int.</TableHead>
                              <TableHead className="text-right font-semibold">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-sm">
                                  {item.itemCode}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={item.itemName}>
                                  {item.itemName}
                                </TableCell>
                                <TableCell className="text-center">{item.pallet}</TableCell>
                                <TableCell className="text-center">{item.lastro}</TableCell>
                                <TableCell className="text-center">{item.caixa}</TableCell>
                                <TableCell className="text-center">{item.unidadeAvulsa}</TableCell>
                                <TableCell className="text-center font-semibold text-primary">
                                  {calculateTotalInteiras(item)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(item)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Excluir</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir o item &quot;{item.itemName}&quot;?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDelete(item.id)}
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
                    <div className="mt-4 flex justify-end">
                      <div className="rounded-lg bg-muted px-4 py-2">
                        <span className="text-sm text-muted-foreground">Total de Inteiras: </span>
                        <span className="font-semibold text-foreground">{totalInteirasGeral}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
