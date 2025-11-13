"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import CategoryTabs from "@/components/CategoryTabs";
import type { Product } from "@prisma/client";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchProducts();
    }
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = category === "all" ? "/api/products" : `/api/products?category=${category}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Invalid products data:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const gameProducts = Array.isArray(products) ? products.filter((p) => p.category === "GAME") : [];
  const serviceProducts = Array.isArray(products) ? products.filter((p) => p.category === "SERVICE") : [];

  return (
    <div className="px-4 pt-4 min-h-screen">
      <CategoryTabs
        tabs={[
          { id: "all", label: "Все", icon: "🏠" },
          { id: "GAME", label: "Игры", icon: "🎮" },
          { id: "SERVICE", label: "Сервисы", icon: "⚙️" },
        ]}
        onTabChange={setCategory}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
        </div>
      ) : (
        <>
          {(category === "all" || category === "GAME") && gameProducts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-6 h-6 text-[--cerulean]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-white">Пополнение игр</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {gameProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {(category === "all" || category === "SERVICE") && serviceProducts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-6 h-6 text-[--cerulean]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-white">Пополнение сервисов</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {serviceProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-lg">Товары не найдены</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
