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
  setDefaultPantry: (id: string) => Promise<void>;
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
    setDefaultPantry: setDefaultPantryRaw,
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
    if (pantries.length > 0) {
      // Pantries already exist — migrate orphan items only
      const database = db;
      const defaultPantry = pantries.find((p) => p.isDefault) || pantries[0];
      migrationDone.current = true;

      const migrateOrphans = async () => {
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
      };

      migrateOrphans();
      return;
    }

    // No pantries — create default (set flag synchronously to prevent duplicate runs)
    migrationDone.current = true;
    const database = db;

    const createDefaultPantry = async () => {
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
        // Migration failed — allow retry next session
        migrationDone.current = false;
      } finally {
        setMigrating(false);
      }
    };

    createDefaultPantry();
  }, [pantriesLoading, pantries, user, addPantryRaw]);

  // Keep activePantryId valid when pantries change
  useEffect(() => {
    if (pantriesLoading || pantries.length === 0) return;

    setActivePantryIdState((prev) => {
      if (prev && pantries.some((p) => p.id === prev)) return prev;
      const defaultPantry = pantries.find((p) => p.isDefault) || pantries[0];
      localStorage.setItem(ACTIVE_PANTRY_KEY, defaultPantry.id);
      return defaultPantry.id;
    });
  }, [pantriesLoading, pantries]);

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
      if (pantries.length <= 1) throw new Error("No se puede eliminar la ultima despensa");

      const database = db;
      const pantryToDelete = pantries.find((p) => p.id === id);
      const isDeletingDefault = pantryToDelete?.isDefault;

      // Determine the target pantry for items and new default
      const targetPantry = isDeletingDefault
        ? pantries.find((p) => p.id !== id)!
        : pantries.find((p) => p.isDefault) || pantries.find((p) => p.id !== id)!;

      // If deleting the default, assign default to the target pantry first
      if (isDeletingDefault) {
        await setDefaultPantryRaw(targetPantry.id);
      }

      // Reassign items from deleted pantry to target
      const itemsRef = collection(database, "users", user.uid, "pantryItems");
      const snapshot = await getDocs(itemsRef);
      const itemsToMove = snapshot.docs.filter((d) => d.data().pantryId === id);
      if (itemsToMove.length > 0) {
        await Promise.all(
          itemsToMove.map((d) =>
            updateDoc(doc(database, "users", user.uid, "pantryItems", d.id), {
              pantryId: targetPantry.id,
            })
          )
        );
      }

      await deletePantryRaw(id);

      // If the deleted pantry was active, switch to target
      if (activePantryId === id) {
        setActivePantryId(targetPantry.id);
      }
    },
    [user, pantries, activePantryId, deletePantryRaw, setDefaultPantryRaw, setActivePantryId]
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
        setDefaultPantry: setDefaultPantryRaw,
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
