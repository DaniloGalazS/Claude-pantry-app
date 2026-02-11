"use client";

import { usePantryContext } from "@/contexts/PantryContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PantrySelector() {
  const { pantries, activePantryId, setActivePantryId } = usePantryContext();

  // Only show if there are 2+ pantries
  if (pantries.length < 2) return null;

  return (
    <div className="px-4 py-3">
      <label className="text-sidebar-muted uppercase text-xs font-medium tracking-wider mb-1.5 block">
        Despensa
      </label>
      <Select value={activePantryId || ""} onValueChange={setActivePantryId}>
        <SelectTrigger className="bg-white/10 border-white/15 text-white hover:bg-white/15 focus:ring-white/20 [&>svg]:text-white/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pantries.map((pantry) => (
            <SelectItem key={pantry.id} value={pantry.id}>
              {pantry.name}
              {pantry.isDefault ? " (Principal)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
