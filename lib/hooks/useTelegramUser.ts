"use client";

import { useState, useEffect } from "react";
import type { User } from "@prisma/client";

export function useTelegramUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
