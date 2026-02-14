"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowRightLeft, AlertTriangle, Clock, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import type { PantryItem } from "@/types";

interface PantryItemRowProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
  onMove?: (item: PantryItem) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

function getExpirationStatus(expirationDate: Timestamp | null): {
  status: "ok" | "warning" | "expired" | "none";
  daysLeft: number | null;
} {
  if (!expirationDate) return { status: "none", daysLeft: null };

  const now = new Date();
  const expDate = expirationDate.toDate();
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: "expired", daysLeft: diffDays };
  if (diffDays <= 3) return { status: "warning", daysLeft: diffDays };
  return { status: "ok", daysLeft: diffDays };
}

export function PantryItemRow({ item, onEdit, onDelete, onMove, selected, onToggleSelect }: PantryItemRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const { status, daysLeft } = getExpirationStatus(item.expirationDate);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const bgClass =
    status === "expired"
      ? "bg-destructive/3"
      : status === "warning"
      ? "bg-warning/3"
      : "";

  return (
    <>
    <div
      className={`flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 hover:bg-muted/40 transition-colors group ${bgClass} ${selected ? "bg-primary/5" : ""}`}
    >
      {/* Checkbox */}
      {onToggleSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="shrink-0"
        />
      )}
      {/* Thumbnail */}
      {item.imageUrl ? (
        <button
          onClick={() => setShowImage(true)}
          className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-border/60 hover:ring-2 hover:ring-primary/30 transition-all"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Name and badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-medium truncate">{item.name}</span>
        {status === "expired" && (
          <Badge variant="destructive" className="text-xs shrink-0">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Caducado
          </Badge>
        )}
        {status === "warning" && (
          <Badge variant="warning" className="text-xs shrink-0">
            <Clock className="mr-1 h-3 w-3" />
            {daysLeft === 0
              ? "Hoy"
              : daysLeft === 1
              ? "Manana"
              : `${daysLeft}d`}
          </Badge>
        )}
      </div>

      {/* Quantity */}
      <div className="text-sm font-medium text-primary whitespace-nowrap w-24 text-right">
        {item.quantity} {item.unit}
      </div>

      {/* Expiration date */}
      <div className="text-sm text-muted-foreground whitespace-nowrap w-28 text-right hidden sm:block">
        {item.expirationDate ? formatDate(item.expirationDate) : "-"}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
          disabled={isDeleting}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {onMove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMove(item)}
            disabled={isDeleting}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    {item.imageUrl && (
      <ImagePreviewDialog
        imageUrl={item.imageUrl}
        productName={item.name}
        open={showImage}
        onOpenChange={setShowImage}
      />
    )}
    </>
  );
}
