"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, SlidersHorizontal } from "lucide-react";
import type { RecipeFilters as Filters } from "@/types";

interface RecipeFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const CUISINES = [
  "Mexicana",
  "Italiana",
  "Espanola",
  "Asiatica",
  "Americana",
  "Mediterranea",
  "Francesa",
];

const DIETARY_TAGS = [
  "Vegetariano",
  "Vegano",
  "Sin gluten",
  "Sin lactosa",
  "Bajo en calorias",
  "Alto en proteinas",
];

export function RecipeFilters({ filters, onChange }: RecipeFiltersProps) {
  const hasFilters =
    filters.maxPrepTime ||
    filters.difficulty ||
    filters.cuisine ||
    (filters.dietaryTags && filters.dietaryTags.length > 0);

  const clearFilters = () => {
    onChange({});
  };

  const toggleDietaryTag = (tag: string) => {
    const currentTags = filters.dietaryTags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onChange({ ...filters, dietaryTags: newTags.length > 0 ? newTags : undefined });
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Filtros</h3>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiempo maximo</Label>
            <Select
              value={filters.maxPrepTime?.toString() || ""}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  maxPrepTime: value ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier tiempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dificultad</Label>
            <Select
              value={filters.difficulty || ""}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  difficulty: value as "easy" | "medium" | "hard" | undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier dificultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Facil</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="hard">Dificil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de cocina</Label>
            <Select
              value={filters.cuisine || ""}
              onValueChange={(value) =>
                onChange({ ...filters, cuisine: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier cocina" />
              </SelectTrigger>
              <SelectContent>
                {CUISINES.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Restricciones</Label>
            <Select
              value=""
              onValueChange={(value) => toggleDietaryTag(value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    filters.dietaryTags?.length
                      ? `${filters.dietaryTags.length} seleccionados`
                      : "Ninguna"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {DIETARY_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {filters.dietaryTags?.includes(tag) ? "✓ " : ""}{tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.dietaryTags && filters.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.dietaryTags.map((tag) => (
              <Button
                key={tag}
                variant="secondary"
                size="sm"
                onClick={() => toggleDietaryTag(tag)}
                className="rounded-full"
              >
                {tag}
                <X className="h-3 w-3 ml-1.5" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
