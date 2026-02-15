"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { SavedRecipe, Recipe } from "@/types";

export function useSavedRecipes() {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setSavedRecipes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const recipesRef = collection(db, "users", user.uid, "savedRecipes");
    const q = query(recipesRef, orderBy("savedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (cancelled) return;
        const recipes: SavedRecipe[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as SavedRecipe[];
        setSavedRecipes(recipes);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      try { unsubscribe(); } catch { /* Firestore SDK internal assertion — safe to ignore */ }
    };
  }, [user]);

  const saveRecipe = async (recipe: Recipe): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const recipesRef = collection(db, "users", user.uid, "savedRecipes");
    const docRef = await addDoc(recipesRef, {
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      cuisine: recipe.cuisine || null,
      dietaryTags: recipe.dietaryTags || [],
      nutrition: recipe.nutrition || null,
      savedAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const removeSavedRecipe = async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const docRef = doc(db, "users", user.uid, "savedRecipes", id);
    await deleteDoc(docRef);
  };

  const isRecipeSaved = useCallback(
    (name: string): boolean => {
      return savedRecipes.some(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
    },
    [savedRecipes]
  );

  return {
    savedRecipes,
    loading,
    saveRecipe,
    removeSavedRecipe,
    isRecipeSaved,
  };
}
