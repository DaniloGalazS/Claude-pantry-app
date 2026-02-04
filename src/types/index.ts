import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Timestamp;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // "unidades", "kg", "L", "g", etc.
  expirationDate: Timestamp | null;
  addedAt: Timestamp;
  imageUrl?: string;
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
