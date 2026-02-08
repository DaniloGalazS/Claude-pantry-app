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
import type { PantryItem } from "@/types";

export function usePantryItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setItems([]);
      setLoading(false);
      return;
    }

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    const q = query(itemsRef, orderBy("addedAt", "desc"));

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
  }, [user]);

  const addItem = async (
    item: Omit<PantryItem, "id" | "addedAt">
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    const docRef = await addDoc(itemsRef, {
      ...item,
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
    newItems: Omit<PantryItem, "id" | "addedAt">[]
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Database not initialized");

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    await Promise.all(
      newItems.map((item) =>
        addDoc(itemsRef, {
          ...item,
          addedAt: Timestamp.now(),
        })
      )
    );
  };

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
    addMultipleItems,
    deleteAllItems,
  };
}
