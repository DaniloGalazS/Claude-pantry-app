"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { DietaryProfile } from "@/types";

const DEFAULT_PROFILE: DietaryProfile = {
  dietType: null,
  allergies: [],
  avoidIngredients: [],
};

export function useDietaryProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DietaryProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "preferences", "dietary");

    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setProfile({ ...DEFAULT_PROFILE, ...snap.data() } as DietaryProfile);
      }
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async (updates: DietaryProfile) => {
    if (!user || !db) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid, "preferences", "dietary");
      await setDoc(ref, updates, { merge: true });
      setProfile(updates);
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, saveProfile };
}
