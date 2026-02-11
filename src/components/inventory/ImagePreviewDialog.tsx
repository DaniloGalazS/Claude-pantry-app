"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewDialogProps {
  imageUrl: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreviewDialog({
  imageUrl,
  productName,
  open,
  onOpenChange,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={productName}
            className="max-h-[60vh] rounded-lg object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
