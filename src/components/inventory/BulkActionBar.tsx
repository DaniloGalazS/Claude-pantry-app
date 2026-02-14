"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ArrowRightLeft, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMove?: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onMove,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
      <div className="flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-full shadow-lg">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <div className="h-4 w-px bg-background/20" />
        {onMove && (
          <Button
            variant="ghost"
            size="sm"
            className="text-background hover:bg-background/15 hover:text-background h-8 gap-1.5"
            onClick={onMove}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Mover
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:bg-red-500/15 hover:text-red-300 h-8 gap-1.5"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
        <div className="h-4 w-px bg-background/20" />
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-background/15 hover:text-background h-7 w-7"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
