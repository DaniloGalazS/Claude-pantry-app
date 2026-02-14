"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { PantryItem } from "@/types";

export function usePantryItems(pantryId: string | null) {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db || !pantryId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    const q = query(
      itemsRef,
      where("pantryId", "==", pantryId),
      orderBy("addedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pantryItems: PantryItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PantryItem[];
        setItems(pantryItems);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, pantryId]);

  const addItem = async (
    item: Omit<PantryItem, "id" | "addedAt" | "pantryId">
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");
    if (!pantryId) throw new Error("No pantry selected");

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    const docRef = await addDoc(itemsRef, {
      ...item,
      pantryId,
      addedAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const updateItem = async (
    id: string,
    updates: Partial<Omit<PantryItem, "id">>
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const itemRef = doc(db, "users", user.uid, "pantryItems", id);
    await updateDoc(itemRef, updates);
  };

  const deleteItem = async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const itemRef = doc(db, "users", user.uid, "pantryItems", id);
    await deleteDoc(itemRef);
  };

  const addMultipleItems = async (
    newItems: Omit<PantryItem, "id" | "addedAt" | "pantryId">[]
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");
    if (!pantryId) throw new Error("No pantry selected");

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    await Promise.all(
      newItems.map((item) =>
        addDoc(itemsRef, {
          ...item,
          pantryId,
          addedAt: Timestamp.now(),
        })
      )
    );
  };

  const deleteMultipleItems = async (ids: string[]): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const database = db;
    await Promise.all(
      ids.map((id) =>
        deleteDoc(doc(database, "users", user.uid, "pantryItems", id))
      )
    );
  };

  const removeItems = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((item) => !idSet.has(item.id)));
  }, []);

  const deleteAllItems = async (): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const database = db;
    await Promise.all(
      items.map((item) =>
        deleteDoc(doc(database, "users", user.uid, "pantryItems", item.id))
      )
    );
  };

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    deleteMultipleItems,
    addMultipleItems,
    deleteAllItems,
    removeItems,
  };
}
