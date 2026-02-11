"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Pantry } from "@/types";

export function usePantries() {
  const { user } = useAuth();
  const [pantries, setPantries] = useState<Pantry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setPantries([]);
      setLoading(false);
      return;
    }

    const pantriesRef = collection(db, "users", user.uid, "pantries");
    const q = query(pantriesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Pantry[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Pantry[];
        setPantries(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addPantry = async (
    name: string,
    description?: string,
    isDefault = false
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const pantriesRef = collection(db, "users", user.uid, "pantries");
    const docRef = await addDoc(pantriesRef, {
      name,
      ...(description && { description }),
      isDefault,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const updatePantry = async (
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const pantryRef = doc(db, "users", user.uid, "pantries", id);
    await updateDoc(pantryRef, updates);
  };

  const deletePantry = async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const pantry = pantries.find((p) => p.id === id);
    if (pantry?.isDefault) {
      throw new Error("No se puede eliminar la despensa principal");
    }

    const pantryRef = doc(db, "users", user.uid, "pantries", id);
    await deleteDoc(pantryRef);
  };

  return {
    pantries,
    loading,
    addPantry,
    updatePantry,
    deletePantry,
  };
}
