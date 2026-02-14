"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function useProductNames() {
  const { user } = useAuth();
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setNames([]);
      setLoading(false);
      return;
    }

    const itemsRef = collection(db, "users", user.uid, "pantryItems");
    const q = query(itemsRef, orderBy("addedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allNames: string[] = [];
        const seen = new Set<string>();
        for (const docSnap of snapshot.docs) {
          const name = docSnap.data().name as string;
          if (!name) continue;
          const key = name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            allNames.push(name);
          }
        }
        setNames(allNames);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const productNames = useMemo(() => names, [names]);

  return { productNames, loading };
}
