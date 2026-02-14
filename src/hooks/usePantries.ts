"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
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

  const addPantry = useCallback(async (
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
  }, [user]);

  const updatePantry = useCallback(async (
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const pantryRef = doc(db, "users", user.uid, "pantries", id);
    await updateDoc(pantryRef, updates);
  }, [user]);

  const deletePantry = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const pantryRef = doc(db, "users", user.uid, "pantries", id);
    await deleteDoc(pantryRef);
  }, [user]);

  const setDefaultPantry = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const currentDefault = pantries.find((p) => p.isDefault);
    if (currentDefault?.id === id) return;

    const batch = writeBatch(db);

    if (currentDefault) {
      const oldRef = doc(db, "users", user.uid, "pantries", currentDefault.id);
      batch.update(oldRef, { isDefault: false });
    }

    const newRef = doc(db, "users", user.uid, "pantries", id);
    batch.update(newRef, { isDefault: true });

    await batch.commit();
  }, [user, pantries]);

  return {
    pantries,
    loading,
    addPantry,
    updatePantry,
    deletePantry,
    setDefaultPantry,
  };
}
