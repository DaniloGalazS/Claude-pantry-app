"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  ChefHat,
  Users,
  ShoppingCart,
  CheckCircle,
  Loader2,
  Flame,
  Bookmark,
  BookmarkCheck,
  Play,
  ExternalLink,
} from "lucide-react";
import { NutritionDisplay } from "@/components/recipes/NutritionDisplay";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  onCook: (recipe: Recipe) => Promise<void>;
  onSave?: (recipe: Recipe) => Promise<void>;
  onUnsave?: (recipe: Recipe) => Promise<void>;
  isSaved?: boolean;
}

export function RecipeCard({ recipe, onCook, onSave, onUnsave, isSaved }: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const difficultyLabels = {
    easy: "Facil",
    medium: "Media",
    hard: "Dificil",
  };

  const difficultyColors = {
    easy: "bg-accent text-accent-foreground",
    medium: "bg-warning/15 text-warning-foreground",
    hard: "bg-destructive/10 text-destructive",
  };

  const handleCook = async () => {
    setIsCooking(true);
    try {
      await onCook(recipe);
      setShowDetails(false);
    } finally {
      setIsCooking(false);
    }
  };

  const progressColor =
    recipe.availablePercentage >= 90
      ? "bg-accent-foreground"
      : recipe.availablePercentage >= 70
      ? "bg-primary"
      : "bg-warning";

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group border-border/60"
        onClick={() => setShowDetails(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
              {recipe.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={`${difficultyColors[recipe.difficulty]} border-0 shrink-0`}
            >
              {difficultyLabels[recipe.difficulty]}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 mt-1">
            {recipe.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{recipe.prepTime + recipe.cookTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} porciones</span>
            </div>
            {recipe.nutrition && (
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                <span>{recipe.nutrition.calories} kcal</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/40">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} rounded-full transition-all`}
                  style={{ width: `${recipe.availablePercentage}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {recipe.availablePercentage}%
            </span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <ChefHat className="h-6 w-6 text-primary" />
              {recipe.name}
            </DialogTitle>
            <DialogDescription className="text-base">{recipe.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Info pills */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Prep: {recipe.prepTime} min
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                <Flame className="h-4 w-4 text-muted-foreground" />
                Coccion: {recipe.cookTime} min
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                <Users className="h-4 w-4 text-muted-foreground" />
                {recipe.servings} porciones
              </div>
              {recipe.cuisine && (
                <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-sm font-normal">
                  {recipe.cuisine}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Ingredients */}
            <div>
              <h4 className="font-display text-lg mb-3">Ingredientes</h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => {
                  const isMissing = recipe.missingItems.some(
                    (m) => m.name.toLowerCase() === ing.name.toLowerCase()
                  );
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2.5 text-sm ${
                        isMissing ? "text-destructive" : ""
                      }`}
                    >
                      {isMissing ? (
                        <ShoppingCart className="h-4 w-4 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-accent-foreground shrink-0" />
                      )}
                      <span>
                        {ing.quantity} {ing.unit} de {ing.name}
                      </span>
                      {isMissing && (
                        <span className="text-xs text-destructive/70">(falta)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Missing items summary */}
            {recipe.missingItems.length > 0 && (
              <div className="p-4 bg-destructive/5 border border-destructive/15 rounded-xl">
                <p className="text-sm font-medium mb-1">
                  Ingredientes por comprar ({recipe.missingItems.length}):
                </p>
                <p className="text-sm text-muted-foreground">
                  {recipe.missingItems
                    .map((m) => `${m.quantity} ${m.unit} de ${m.name}`)
                    .join(", ")}
                </p>
              </div>
            )}

            {/* Steps */}
            <div>
              <h4 className="font-display text-lg mb-3">Preparacion</h4>
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Nutrition */}
            {recipe.nutrition && (
              <NutritionDisplay nutrition={recipe.nutrition} />
            )}

            {/* YouTube */}
            <div className="p-4 bg-muted/50 rounded-xl border border-border/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Play className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Ver video de la receta</p>
                    <p className="text-xs text-muted-foreground">Buscar en YouTube</p>
                  </div>
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`receta ${recipe.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Buscar
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {onSave && onUnsave && (
              <Button
                variant="ghost"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    if (isSaved) {
                      await onUnsave(recipe);
                    } else {
                      await onSave(recipe);
                    }
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isCooking}
                className="mr-auto"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isSaved ? (
                  <BookmarkCheck className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="mr-2 h-4 w-4" />
                )}
                {isSaved ? "Guardada" : "Guardar"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
              disabled={isCooking}
            >
              Cerrar
            </Button>
            <Button onClick={handleCook} disabled={isCooking} className="shadow-sm">
              {isCooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Cocinar esta receta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
