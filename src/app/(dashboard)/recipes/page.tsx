"use client";

import { useState } from "react";
import { usePantryItems } from "@/hooks/usePantryItems";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Loader2, Sparkles, Package } from "lucide-react";
import type { Recipe, RecipeFilters as Filters } from "@/types";

export default function RecipesPage() {
  const { items: pantryItems, loading: itemsLoading, updateItem } = usePantryItems();
  const { addCookedRecipe } = useCookedRecipes();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (pantryItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin ingredientes",
        description: "Agrega productos a tu despensa primero",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pantryItems,
          filters,
          maxMissingPercentage: 20,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecipes(data.recipes);
      setHasGenerated(true);
      toast({
        title: "Recetas generadas",
        description: `Se encontraron ${data.recipes.length} recetas`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron generar las recetas",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCook = async (recipe: Recipe) => {
    try {
      // Add to cooked recipes history
      await addCookedRecipe(recipe.name, recipe.ingredients);

      // Deduct ingredients from pantry
      for (const ingredient of recipe.ingredients) {
        const isMissing = recipe.missingItems.some(
          (m) => m.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        if (isMissing) continue;

        // Find matching pantry item
        const pantryItem = pantryItems.find(
          (p) => p.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        if (pantryItem) {
          const newQuantity = pantryItem.quantity - ingredient.quantity;
          if (newQuantity <= 0) {
            // Delete item if quantity reaches 0 or below
            await updateItem(pantryItem.id, { quantity: 0 });
          } else {
            await updateItem(pantryItem.id, { quantity: newQuantity });
          }
        }
      }

      toast({
        title: "Receta cocinada",
        description: "Los ingredientes se han descontado de tu despensa",
      });

      // Refresh recipes after cooking
      setHasGenerated(false);
      setRecipes([]);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la receta",
      });
    }
  };

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Generador de Recetas</h1>
          <p className="text-muted-foreground">
            Genera recetas basadas en los ingredientes de tu despensa
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar recetas
            </>
          )}
        </Button>
      </div>

      {pantryItems.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Despensa vacia</AlertTitle>
          <AlertDescription>
            Agrega productos a tu despensa para poder generar recetas
            personalizadas.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <RecipeFilters filters={filters} onChange={setFilters} />

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{pantryItems.length}</strong> ingredientes disponibles en
              tu despensa. Las recetas generadas utilizaran al menos el 80% de
              ingredientes disponibles.
            </p>
          </div>
        </>
      )}

      {!hasGenerated && pantryItems.length > 0 && (
        <div className="text-center py-12">
          <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            Listo para generar recetas
          </h3>
          <p className="text-muted-foreground mt-1">
            Haz clic en &quot;Generar recetas&quot; para obtener sugerencias
            basadas en tus ingredientes
          </p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onCook={handleCook} />
          ))}
        </div>
      )}
    </div>
  );
}
