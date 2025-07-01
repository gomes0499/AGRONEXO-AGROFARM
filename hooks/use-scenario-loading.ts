"use client";

import { create } from "zustand";

interface ScenarioLoadingStore {
  isLoading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useScenarioLoading = create<ScenarioLoadingStore>((set) => ({
  isLoading: false,
  message: "Carregando cenário...",
  setLoading: (loading, message = "Carregando cenário...") => 
    set({ isLoading: loading, message }),
}));