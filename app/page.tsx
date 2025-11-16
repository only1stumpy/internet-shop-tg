"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import CategoryTabs from "@/components/CategoryTabs";
import type { ProductWithVariants } from "@/types";

export default function Home() {
  const [allProducts, setAllProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        // Ensure all products have variants array
        const productsWithVariants = data.map((p: any) => ({
          ...p,
          variants: p.variants || [],
        }));
        setAllProducts(productsWithVariants);
      } else {
        console.error("Invalid products data:", data);
        setAllProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected category
  const filteredProducts = category === "all"
    ? allProducts
    : allProducts.filter((p) => p.category === category);

  return (
    <div className="px-4 pt-4 min-h-screen pb-6">
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
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
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
    </div>
  );
}
