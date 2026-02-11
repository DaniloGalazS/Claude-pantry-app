"use client";

import { useState, useMemo } from "react";
import { usePantryItems } from "@/hooks/usePantryItems";
import { usePantryContext } from "@/contexts/PantryContext";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { EditItemDialog } from "@/components/inventory/EditItemDialog";
import { PantryItemCard } from "@/components/inventory/PantryItemCard";
import { PantryItemRow } from "@/components/inventory/PantryItemRow";
import { ScanProductButton } from "@/components/inventory/ScanProductButton";
import { ScanReceiptButton } from "@/components/inventory/ScanReceiptButton";
import { BulkUploadButton } from "@/components/inventory/BulkUploadButton";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, AlertTriangle, Loader2, LayoutGrid, List } from "lucide-react";
import type { PantryItem } from "@/types";

function getExpiringItemsCount(items: PantryItem[]): number {
  const now = new Date();
  return items.filter((item) => {
    if (!item.expirationDate) return false;
    const expDate = item.expirationDate.toDate();
    const diffDays = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 3;
  }).length;
}

function getExpiredItemsCount(items: PantryItem[]): number {
  const now = new Date();
  return items.filter((item) => {
    if (!item.expirationDate) return false;
    return item.expirationDate.toDate() < now;
  }).length;
}

export default function InventoryPage() {
  const { activePantryId, activePantry, loading: pantryLoading } = usePantryContext();
  const { items, loading, addItem, updateItem, deleteItem, addMultipleItems, deleteAllItems } =
    usePantryItems(activePantryId);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const { toast } = useToast();

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const expiringCount = useMemo(() => getExpiringItemsCount(items), [items]);
  const expiredCount = useMemo(() => getExpiredItemsCount(items), [items]);

  const handleAddItem = async (item: Omit<PantryItem, "id" | "addedAt" | "pantryId">) => {
    try {
      await addItem(item);
      toast({
        title: "Producto agregado",
        description: `${item.name} se ha agregado a tu despensa`,
      });
      return "";
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el producto",
      });
      throw new Error("Failed to add item");
    }
  };

  const handleAddMultipleItems = async (
    newItems: Omit<PantryItem, "id" | "addedAt" | "pantryId">[]
  ) => {
    await addMultipleItems(newItems);
  };

  const handleUpdateItem = async (
    id: string,
    updates: Partial<Omit<PantryItem, "id">>
  ) => {
    try {
      await updateItem(id, updates);
      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el producto",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado de tu despensa",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el producto",
      });
    }
  };

  if (pantryLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">{activePantry?.name || "Inventario"}</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} producto{items.length !== 1 ? "s" : ""} en inventario
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScanProductButton onAdd={handleAddItem} />
          <ScanReceiptButton onAddMultiple={handleAddMultipleItems} />
          <BulkUploadButton onAddMultiple={handleAddMultipleItems} onDeleteAll={deleteAllItems} />
          <AddItemDialog onAdd={handleAddItem} />
        </div>
      </div>

      {/* Expiration alert */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <Alert variant="warning" className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-foreground font-medium">Atencion</AlertTitle>
          <AlertDescription>
            {expiredCount > 0 && (
              <span>
                Tienes {expiredCount} producto{expiredCount > 1 ? "s" : ""}{" "}
                caducado{expiredCount > 1 ? "s" : ""}.{" "}
              </span>
            )}
            {expiringCount > 0 && (
              <span>
                {expiringCount} producto{expiringCount > 1 ? "s" : ""} por
                caducar pronto.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-card">
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items grid/list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-display text-xl">No hay productos</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No se encontraron productos con ese nombre"
              : "Comienza agregando productos a tu despensa"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {filteredItems.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          {filteredItems.map((item) => (
            <PantryItemRow
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleUpdateItem}
      />
    </div>
  );
}
