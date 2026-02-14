"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { usePantryContext } from "@/contexts/PantryContext";
import type { PantryItem } from "@/types";

interface MoveToPantryDialogProps {
  items: PantryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (itemIds: string[], targetPantryId: string) => Promise<void>;
}

export function MoveToPantryDialog({
  items,
  open,
  onOpenChange,
  onMove,
}: MoveToPantryDialogProps) {
  const { pantries } = usePantryContext();
  const [targetPantryId, setTargetPantryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const availablePantries = pantries.filter((p) => p.id !== items[0]?.pantryId);

  const handleMove = async () => {
    if (items.length === 0 || !targetPantryId) return;

    setIsLoading(true);
    try {
      await onMove(items.map((i) => i.id), targetPantryId);
      onOpenChange(false);
      setTargetPantryId("");
    } finally {
      setIsLoading(false);
    }
  };

  const description =
    items.length === 1
      ? `Mover ${items[0]?.name} a otra despensa`
      : `Mover ${items.length} productos a otra despensa`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar despensa</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={targetPantryId} onValueChange={setTargetPantryId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una despensa" />
            </SelectTrigger>
            <SelectContent>
              {availablePantries.map((pantry) => (
                <SelectItem key={pantry.id} value={pantry.id}>
                  {pantry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={isLoading || !targetPantryId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moviendo...
              </>
            ) : (
              "Mover"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
