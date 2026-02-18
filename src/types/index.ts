import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Timestamp;
}

export interface Pantry {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Timestamp;
}

export const FOOD_CATEGORIES = [
  { value: "frutas", label: "Frutas" },
  { value: "verduras", label: "Verduras" },
  { value: "lacteos", label: "Lácteos" },
  { value: "carnes", label: "Carnes" },
  { value: "mariscos", label: "Mariscos" },
  { value: "granos", label: "Granos y cereales" },
  { value: "enlatados", label: "Enlatados" },
  { value: "condimentos", label: "Condimentos y salsas" },
  { value: "bebidas", label: "Bebidas" },
  { value: "snacks", label: "Snacks y dulces" },
  { value: "panaderia", label: "Panadería" },
  { value: "congelados", label: "Congelados" },
  { value: "huevos", label: "Huevos" },
  { value: "aceites", label: "Aceites y grasas" },
  { value: "otros", label: "Otros" },
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number]["value"];

export interface PantryItem {
  id: string;
  name: string;
  brand?: string;
  category?: FoodCategory;
  quantity: number;
  unit: string; // "unidades", "kg", "L", "g", etc.
  expirationDate: Timestamp | null;
  addedAt: Timestamp;
  imageUrl?: string;
  pantryId: string;
}

export interface CookedRecipe {
  id: string;
  recipeName: string;
  ingredients: RecipeIngredient[];
  cookedAt: Timestamp;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: {
    total: number;
    fiber: number;
    sugar: number;
  };
  fat: {
    total: number;
    saturated: number;
    unsaturated: number;
  };
  sodium: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  cuisine?: string;
  dietaryTags?: string[];
  missingItems: RecipeIngredient[];
  availablePercentage: number;
  nutrition?: NutritionalInfo;
}

export interface SavedRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  cuisine?: string;
  dietaryTags?: string[];
  nutrition?: NutritionalInfo;
  savedAt: Timestamp;
}

export interface RecipeFilters {
  maxPrepTime?: number;
  difficulty?: "easy" | "medium" | "hard";
  cuisine?: string;
  dietaryTags?: string[];
  maxMissingPercentage?: number;
}

export interface VisionIdentifyResponse {
  name: string;
  brand?: string;
  category?: FoodCategory;
  suggestedQuantity: number;
  suggestedUnit: string;
  confidence: number;
}

export interface ReceiptScanResponse {
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
}

export type MealType = "desayuno" | "almuerzo" | "once" | "cena" | "merienda";

export interface MealPlanConfig {
  startDate: string;       // ISO date string "YYYY-MM-DD"
  endDate: string;         // ISO date string "YYYY-MM-DD"
  mealTypes: MealType[];   // tipos de comida seleccionados
  servings: number;        // porciones por comida
}

export interface PlannedMeal {
  recipe: Recipe;
  mealType: MealType;
  date: string;            // ISO date string
}

export interface MealPlan {
  id: string;
  config: MealPlanConfig;
  meals: PlannedMeal[];
  shoppingList: ShoppingListItem[];
  generatedAt: Timestamp;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  available: number;
  toBuy: number;
}

export const DIET_TYPES = [
  { value: "omnivoro", label: "Omnívoro" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "keto", label: "Keto / Cetogénico" },
  { value: "paleo", label: "Paleo" },
  { value: "sinGluten", label: "Sin gluten" },
  { value: "sinLactosa", label: "Sin lactosa" },
] as const;

export const ALLERGY_OPTIONS = [
  { value: "nueces", label: "Frutos secos" },
  { value: "mariscos", label: "Mariscos y pescado" },
  { value: "gluten", label: "Gluten (trigo, cebada)" },
  { value: "lactosa", label: "Lácteos / Lactosa" },
  { value: "huevo", label: "Huevo" },
  { value: "mani", label: "Maní / Cacahuete" },
  { value: "soya", label: "Soya" },
] as const;

export interface DietaryProfile {
  dietType: string | null;
  allergies: string[];
  avoidIngredients: string[];
}
