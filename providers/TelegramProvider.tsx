"use client";

import { useEffect, type ReactNode } from "react";

interface TelegramProviderProps {
  children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("🔍 TelegramProvider: Initializing...");
    console.log("🔍 Telegram available:", !!window.Telegram);
    console.log("🔍 WebApp available:", !!window.Telegram?.WebApp);

    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;

      // Initialize and expand the app
      webApp.ready();
      webApp.expand();

      console.log("🔍 InitData:", webApp.initData);
      console.log("🔍 InitDataUnsafe:", webApp.initDataUnsafe);
      console.log("🔍 User data:", webApp.initDataUnsafe?.user);

      // Try to get user from initDataUnsafe if initData is empty
      const user = webApp.initDataUnsafe?.user;
      if (user) {
        console.log("✅ User found in initDataUnsafe, creating session...");
        const mockUser = {
          id: `tg-${user.id}`,
          telegramId: user.id.toString(),
          username: user.username || "",
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("user", JSON.stringify(mockUser));
        console.log("✅ User saved to localStorage");
      } else {
        console.warn("⚠️ No user data available from Telegram");
      }

      // Also try the auth endpoint if we have initData
      const initData = webApp.initData;
      if (initData) {
        console.log("🔍 Attempting API authentication...");
        fetch("/api/auth/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("🔍 API auth response:", data);
            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
              console.log("✅ User saved from API");
            }
          })
          .catch((error) => {
            console.error("❌ Authentication error:", error);
          });
      }
    } else {
      console.warn("⚠️ Not running in Telegram WebApp");
    }
  }, []);

  return <>{children}</>;
}
