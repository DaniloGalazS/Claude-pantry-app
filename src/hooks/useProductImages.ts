"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface ProductImage {
  imageUrl: string;
  updatedAt: number;
}

export function useProductImages() {
  const { user } = useAuth();
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user || !db) return;

    const colRef = collection(db, "users", user.uid, "productImages");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const map = new Map<string, string>();
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as ProductImage;
        map.set(docSnap.id, data.imageUrl);
      }
      setImageMap(map);
    });

    return () => {
      try { unsubscribe(); } catch { /* safe to ignore */ }
    };
  }, [user]);

  const getImageForProduct = useCallback(
    (name: string): string | undefined => {
      return imageMap.get(name.toLowerCase().trim());
    },
    [imageMap]
  );

  const saveProductImage = useCallback(
    async (name: string, imageUrl: string) => {
      if (!user || !db) return;
      const key = name.toLowerCase().trim();
      const docRef = doc(db, "users", user.uid, "productImages", key);
      await setDoc(docRef, { imageUrl, updatedAt: Date.now() });
    },
    [user]
  );

  return { getImageForProduct, saveProductImage };
}
