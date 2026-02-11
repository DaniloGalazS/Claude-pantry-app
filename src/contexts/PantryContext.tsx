"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { usePantries } from "@/hooks/usePantries";
import type { Pantry } from "@/types";

const ACTIVE_PANTRY_KEY = "despensa_active_pantry_id";

interface PantryContextType {
  pantries: Pantry[];
  activePantry: Pantry | undefined;
  activePantryId: string | null;
  setActivePantryId: (id: string) => void;
  loading: boolean;
  addPantry: (name: string, description?: string) => Promise<string>;
  updatePantry: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deletePantry: (id: string) => Promise<void>;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const {
    pantries,
    loading: pantriesLoading,
    addPantry: addPantryRaw,
    updatePantry,
    deletePantry: deletePantryRaw,
  } = usePantries();
  const [activePantryId, setActivePantryIdState] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const migrationDone = useRef(false);

  // Load active pantry from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_PANTRY_KEY);
    if (stored) {
      setActivePantryIdState(stored);
    }
  }, []);

  // Migration: create default pantry and assign pantryId to orphan items
  useEffect(() => {
    if (pantriesLoading || !user || !db || migrationDone.current) return;

    const database = db;

    const runMigration = async () => {
      if (pantries.length > 0) {
        // Pantries exist — just ensure activePantryId is valid
        const defaultPantry = pantries.find((p) => p.isDefault) || pantries[0];
        setActivePantryIdState((prev) => {
          const valid = pantries.some((p) => p.id === prev);
          if (!valid) {
            localStorage.setItem(ACTIVE_PANTRY_KEY, defaultPantry.id);
            return defaultPantry.id;
          }
          return prev;
        });

        // Migrate orphan items (items without pantryId)
        try {
          const itemsRef = collection(database, "users", user.uid, "pantryItems");
          const snapshot = await getDocs(itemsRef);
          const orphans = snapshot.docs.filter((d) => !d.data().pantryId);
          if (orphans.length > 0) {
            setMigrating(true);
            await Promise.all(
              orphans.map((d) =>
                updateDoc(doc(database, "users", user.uid, "pantryItems", d.id), {
                  pantryId: defaultPantry.id,
                })
              )
            );
            setMigrating(false);
          }
        } catch {
          setMigrating(false);
        }

        migrationDone.current = true;
        return;
      }

      // No pantries — create default
      setMigrating(true);
      try {
        const defaultId = await addPantryRaw("Mi Despensa", undefined, true);
        localStorage.setItem(ACTIVE_PANTRY_KEY, defaultId);
        setActivePantryIdState(defaultId);

        // Assign all existing items to the new default pantry
        const itemsRef = collection(database, "users", user.uid, "pantryItems");
        const snapshot = await getDocs(itemsRef);
        if (snapshot.docs.length > 0) {
          await Promise.all(
            snapshot.docs.map((d) =>
              updateDoc(doc(database, "users", user.uid, "pantryItems", d.id), {
                pantryId: defaultId,
              })
            )
          );
        }
      } catch {
        // Migration failed — will retry next session
      } finally {
        setMigrating(false);
        migrationDone.current = true;
      }
    };

    runMigration();
  }, [pantriesLoading, pantries, user, addPantryRaw]);

  const setActivePantryId = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_PANTRY_KEY, id);
    setActivePantryIdState(id);
  }, []);

  const activePantry = pantries.find((p) => p.id === activePantryId);

  const addPantry = useCallback(
    async (name: string, description?: string) => {
      return addPantryRaw(name, description, false);
    },
    [addPantryRaw]
  );

  const deletePantry = useCallback(
    async (id: string) => {
      if (!user || !db) throw new Error("Not authenticated");

      const database = db;
      const defaultPantry = pantries.find((p) => p.isDefault);
      if (!defaultPantry) throw new Error("No default pantry found");

      // Reassign items from deleted pantry to default
      const itemsRef = collection(database, "users", user.uid, "pantryItems");
      const snapshot = await getDocs(itemsRef);
      const itemsToMove = snapshot.docs.filter((d) => d.data().pantryId === id);
      if (itemsToMove.length > 0) {
        await Promise.all(
          itemsToMove.map((d) =>
            updateDoc(doc(database, "users", user.uid, "pantryItems", d.id), {
              pantryId: defaultPantry.id,
            })
          )
        );
      }

      await deletePantryRaw(id);

      // If the deleted pantry was active, switch to default
      if (activePantryId === id) {
        setActivePantryId(defaultPantry.id);
      }
    },
    [user, pantries, activePantryId, deletePantryRaw, setActivePantryId]
  );

  const loading = pantriesLoading || migrating;

  return (
    <PantryContext.Provider
      value={{
        pantries,
        activePantry,
        activePantryId,
        setActivePantryId,
        loading,
        addPantry,
        updatePantry,
        deletePantry,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
}

export function usePantryContext() {
  const context = useContext(PantryContext);
  if (context === undefined) {
    throw new Error("usePantryContext must be used within a PantryProvider");
  }
  return context;
}
