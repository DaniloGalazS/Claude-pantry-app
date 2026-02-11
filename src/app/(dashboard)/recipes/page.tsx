"use client";

import { useState, useMemo } from "react";
import { usePantryItems } from "@/hooks/usePantryItems";
import { usePantryContext } from "@/contexts/PantryContext";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Loader2, Sparkles, Package, Bookmark } from "lucide-react";
import type { Recipe, RecipeFilters as Filters, RecipeIngredient, PantryItem } from "@/types";

function deductIngredients(
  recipe: Recipe,
  pantryItems: PantryItem[],
  updateItem: (id: string, data: Partial<PantryItem>) => Promise<void>
) {
  const promises: Promise<void>[] = [];
  for (const ingredient of recipe.ingredients) {
    const isMissing = recipe.missingItems.some(
      (m) => m.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    if (isMissing) continue;

    const pantryItem = pantryItems.find(
      (p) => p.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    if (pantryItem) {
      const newQuantity = pantryItem.quantity - ingredient.quantity;
      promises.push(
        updateItem(pantryItem.id, {
          quantity: newQuantity <= 0 ? 0 : newQuantity,
        })
      );
    }
  }
  return Promise.all(promises);
}

function calculateAvailability(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): { missingItems: RecipeIngredient[]; availablePercentage: number } {
  const missing: RecipeIngredient[] = [];
  for (const ing of ingredients) {
    const pantryItem = pantryItems.find(
      (p) => p.name.toLowerCase() === ing.name.toLowerCase()
    );
    if (!pantryItem || pantryItem.quantity < ing.quantity) {
      missing.push(ing);
    }
  }
  const total = ingredients.length;
  const available = total - missing.length;
  return {
    missingItems: missing,
    availablePercentage: total > 0 ? Math.round((available / total) * 100) : 0,
  };
}

export default function RecipesPage() {
  const { activePantryId, loading: pantryLoading } = usePantryContext();
  const { items: pantryItems, loading: itemsLoading, updateItem } = usePantryItems(activePantryId);
  const { addCookedRecipe } = useCookedRecipes();
  const {
    savedRecipes,
    loading: savedLoading,
    saveRecipe,
    removeSavedRecipe,
    isRecipeSaved,
  } = useSavedRecipes();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const savedRecipesAsRecipes = useMemo((): (Recipe & { savedId: string })[] => {
    return savedRecipes.map((saved) => {
      const { missingItems, availablePercentage } = calculateAvailability(
        saved.ingredients,
        pantryItems
      );
      return {
        id: saved.id,
        savedId: saved.id,
        name: saved.name,
        description: saved.description,
        ingredients: saved.ingredients,
        steps: saved.steps,
        prepTime: saved.prepTime,
        cookTime: saved.cookTime,
        difficulty: saved.difficulty,
        servings: saved.servings,
        cuisine: saved.cuisine,
        dietaryTags: saved.dietaryTags,
        missingItems,
        availablePercentage,
      };
    });
  }, [savedRecipes, pantryItems]);

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
      await addCookedRecipe(recipe.name, recipe.ingredients);
      await deductIngredients(recipe, pantryItems, updateItem);

      toast({
        title: "Receta cocinada",
        description: "Los ingredientes se han descontado de tu despensa",
      });

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

  const handleCookSaved = async (recipe: Recipe) => {
    try {
      await addCookedRecipe(recipe.name, recipe.ingredients);
      await deductIngredients(recipe, pantryItems, updateItem);

      toast({
        title: "Receta cocinada",
        description: "Los ingredientes se han descontado de tu despensa",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la receta",
      });
    }
  };

  const handleSave = async (recipe: Recipe) => {
    try {
      await saveRecipe(recipe);
      toast({
        title: "Receta guardada",
        description: `"${recipe.name}" se agrego a tus guardadas`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la receta",
      });
    }
  };

  const handleUnsave = async (recipe: Recipe) => {
    try {
      const saved = savedRecipes.find(
        (r) => r.name.toLowerCase() === recipe.name.toLowerCase()
      );
      if (saved) {
        await removeSavedRecipe(saved.id);
        toast({
          title: "Receta eliminada",
          description: `"${recipe.name}" se elimino de tus guardadas`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la receta",
      });
    }
  };

  if (pantryLoading || itemsLoading || savedLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-foreground">Recetas</h1>
        <p className="text-muted-foreground mt-1">
          Genera recetas con IA o consulta tus recetas guardadas
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Generar recetas
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            Guardadas ({savedRecipes.length})
          </TabsTrigger>
        </TabsList>

        {/* Generate tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-11 px-6 text-base font-medium shadow-sm"
            >
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
            <Alert className="border-border/60">
              <Package className="h-4 w-4" />
              <AlertTitle className="font-medium">Despensa vacia</AlertTitle>
              <AlertDescription>
                Agrega productos a tu despensa para poder generar recetas
                personalizadas.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <RecipeFilters filters={filters} onChange={setFilters} />

              <div className="p-4 bg-accent/50 rounded-xl border border-accent">
                <p className="text-sm text-accent-foreground">
                  <strong>{pantryItems.length}</strong> ingredientes disponibles en
                  tu despensa. Las recetas generadas utilizaran al menos el 80% de
                  ingredientes disponibles.
                </p>
              </div>
            </>
          )}

          {!hasGenerated && pantryItems.length > 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl">
                Listo para generar recetas
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Haz clic en &quot;Generar recetas&quot; para obtener sugerencias
                basadas en tus ingredientes
              </p>
            </div>
          )}

          {recipes.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onCook={handleCook}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  isSaved={isRecipeSaved(recipe.name)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved tab */}
        <TabsContent value="saved" className="space-y-6 mt-6">
          {savedRecipesAsRecipes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl">
                No tienes recetas guardadas
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Genera recetas y guarda tus favoritas para consultarlas despues
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {savedRecipesAsRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.savedId}
                  recipe={recipe}
                  onCook={handleCookSaved}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  isSaved={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
