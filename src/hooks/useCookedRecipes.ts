"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { CookedRecipe, RecipeIngredient } from "@/types";

export function useCookedRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<CookedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const recipesRef = collection(db, "users", user.uid, "cookedRecipes");
    const q = query(recipesRef, orderBy("cookedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cookedRecipes: CookedRecipe[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as CookedRecipe[];
        setRecipes(cookedRecipes);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addCookedRecipe = async (
    recipeName: string,
    ingredients: RecipeIngredient[]
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const recipesRef = collection(db, "users", user.uid, "cookedRecipes");
    const docRef = await addDoc(recipesRef, {
      recipeName,
      ingredients,
      cookedAt: Timestamp.now(),
    });
    return docRef.id;
  };

  return {
    recipes,
    loading,
    addCookedRecipe,
  };
}
