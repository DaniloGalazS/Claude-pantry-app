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
} from "lucide-react";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  onCook: (recipe: Recipe) => Promise<void>;
}

export function RecipeCard({ recipe, onCook }: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isCooking, setIsCooking] = useState(false);

  const difficultyLabels = {
    easy: "Facil",
    medium: "Media",
    hard: "Dificil",
  };

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
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

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetails(true)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{recipe.name}</CardTitle>
            <Badge
              variant="outline"
              className={difficultyColors[recipe.difficulty]}
            >
              {difficultyLabels[recipe.difficulty]}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.prepTime + recipe.cookTime} min
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipe.servings} porciones
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${recipe.availablePercentage}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium">
              {recipe.availablePercentage}%
            </span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {recipe.name}
            </DialogTitle>
            <DialogDescription>{recipe.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Prep: {recipe.prepTime} min
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Coccion: {recipe.cookTime} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {recipe.servings} porciones
              </div>
              {recipe.cuisine && (
                <Badge variant="secondary">{recipe.cuisine}</Badge>
              )}
            </div>

            {/* Tags */}
            {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Ingredients */}
            <div>
              <h4 className="font-medium mb-2">Ingredientes</h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => {
                  const isMissing = recipe.missingItems.some(
                    (m) => m.name.toLowerCase() === ing.name.toLowerCase()
                  );
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        isMissing ? "text-destructive" : ""
                      }`}
                    >
                      {isMissing ? (
                        <ShoppingCart className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      {ing.quantity} {ing.unit} de {ing.name}
                      {isMissing && (
                        <span className="text-xs">(falta)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Missing items summary */}
            {recipe.missingItems.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
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
              <h4 className="font-medium mb-2">Preparacion</h4>
              <ol className="space-y-2">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
              disabled={isCooking}
            >
              Cerrar
            </Button>
            <Button onClick={handleCook} disabled={isCooking}>
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
