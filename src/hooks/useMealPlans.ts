"use client";

import { useState, useEffect } from "react";
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
import type { MealPlan, MealPlanConfig, PlannedMeal, ShoppingListItem } from "@/types";

export function useMealPlans() {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setMealPlans([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const plansRef = collection(db, "users", user.uid, "mealPlans");
    const q = query(plansRef, orderBy("generatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (cancelled) return;
        const plans: MealPlan[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as MealPlan[];
        setMealPlans(plans);
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

  const saveMealPlan = async (
    config: MealPlanConfig,
    meals: PlannedMeal[],
    shoppingList: ShoppingListItem[]
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const plansRef = collection(db, "users", user.uid, "mealPlans");
    const docRef = await addDoc(plansRef, {
      config,
      meals,
      shoppingList,
      generatedAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const deleteMealPlan = async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const docRef = doc(db, "users", user.uid, "mealPlans", id);
    await deleteDoc(docRef);
  };

  return {
    mealPlans,
    loading: loading,
    saveMealPlan,
    deleteMealPlan,
  };
}
