"use client";
import { createContext, useContext } from "react";

export const UserCtx = createContext<{ user: any; refresh: () => void }>({ user: null, refresh: () => {} });

export function useUser() {
  return useContext(UserCtx);
}
