"use client";

import { useTelegramUser } from "@/lib/hooks/useTelegramUser";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading } = useTelegramUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400 px-4">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <p className="text-lg">Необходимо войти</p>
      </div>
    );
  }

  const getInitials = () => {
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>

      <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {getInitials()}
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">
              {user.firstName || user.username || "Пользователь"}
            </h2>
            {user.username && (
              <p className="text-gray-400">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-t border-gray-700">
            <span className="text-gray-400">Telegram ID</span>
            <span className="text-white font-mono">{user.telegramId}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-gray-700">
            <span className="text-gray-400">Дата регистрации</span>
            <span className="text-white">
              {new Date(user.createdAt).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => router.push("/orders")}
          className="w-full bg-[--search] hover:bg-[--indigo-dye] text-white p-4 rounded-xl transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-semibold">Мои заказы</span>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-[--search] hover:bg-[--indigo-dye] text-white p-4 rounded-xl transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-semibold">Главная</span>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
