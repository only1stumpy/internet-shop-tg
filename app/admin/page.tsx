"use client";

import { useEffect, useState } from "react";
import type { Product, Order } from "@prisma/client";
import CategoryTabs from "@/components/CategoryTabs";

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: any[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{
    productId: string;
    field: keyof Product;
  } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCellEdit = async (
    productId: string,
    field: keyof Product,
    value: string | number | boolean
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? updatedProduct : p))
        );
        setEditingCell(null);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Ошибка при обновлении");
    }
  };

  const EditableCell = ({
    product,
    field,
    type = "text",
  }: {
    product: Product;
    field: keyof Product;
    type?: "text" | "number" | "checkbox";
  }) => {
    const isEditing =
      editingCell?.productId === product.id && editingCell?.field === field;
    const [value, setValue] = useState(product[field]);

    const handleSave = () => {
      handleCellEdit(product.id, field, value);
    };

    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={product[field] as boolean}
          onChange={(e) => handleCellEdit(product.id, field, e.target.checked)}
          className="w-5 h-5"
        />
      );
    }

    if (isEditing) {
      return (
        <input
          type={type}
          value={value as string | number}
          onChange={(e) =>
            setValue(type === "number" ? parseFloat(e.target.value) : e.target.value)
          }
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditingCell(null);
          }}
          autoFocus
          className="w-full bg-[--indigo-dye] text-white px-2 py-1 rounded focus:outline-none"
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell({ productId: product.id, field })}
        className="cursor-pointer hover:bg-[--indigo-dye]/30 px-2 py-1 rounded transition-colors"
      >
        {product[field]?.toString() || "-"}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-4 pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Админ панель</h1>

      <CategoryTabs
        tabs={[
          { id: "products", label: "Товары", icon: "📦" },
          { id: "stats", label: "Статистика", icon: "📊" },
        ]}
        onTabChange={setActiveTab}
      />

      {activeTab === "products" && (
        <div className="mt-6 overflow-x-auto">
          <div className="bg-[--search] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[--header]">
                <tr className="text-left">
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Название</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Категория</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Базовая цена</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Текущая цена</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Скидка %</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Активен</th>
                  <th className="p-3 text-white font-semibold whitespace-nowrap">Сортировка</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-700 hover:bg-[--header]/50">
                    <td className="p-3 text-white">
                      <EditableCell product={product} field="name" />
                    </td>
                    <td className="p-3 text-white">
                      <div className="px-2 py-1">{product.category}</div>
                    </td>
                    <td className="p-3 text-white">
                      <EditableCell product={product} field="basePrice" type="number" />
                    </td>
                    <td className="p-3 text-white">
                      <EditableCell product={product} field="currentPrice" type="number" />
                    </td>
                    <td className="p-3 text-white">
                      <EditableCell product={product} field="discount" type="number" />
                    </td>
                    <td className="p-3 text-center">
                      <EditableCell product={product} field="isActive" type="checkbox" />
                    </td>
                    <td className="p-3 text-white">
                      <EditableCell product={product} field="sortOrder" type="number" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            💡 Нажмите на ячейку для редактирования. Enter - сохранить, Escape - отменить
          </p>
        </div>
      )}

      {activeTab === "stats" && stats && (
        <div className="mt-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Всего пользователей</div>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            </div>
            <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Всего заказов</div>
              <div className="text-3xl font-bold text-white">{stats.totalOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-xl p-4 col-span-2">
              <div className="text-gray-400 text-sm mb-1">Общая выручка</div>
              <div className="text-3xl font-bold text-green-500">
                {stats.totalRevenue.toFixed(2)} ₽
              </div>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-[--search] rounded-xl p-4">
            <h3 className="text-white font-semibold mb-4">Заказы по статусу</h3>
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-300">{status}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-[--search] rounded-xl p-4">
            <h3 className="text-white font-semibold mb-4">Последние заказы</h3>
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <div className="text-white font-medium">{order.product.name}</div>
                    <div className="text-gray-400 text-sm">
                      @{order.user.username || "Unknown"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{order.amount} ₽</div>
                    <div className="text-gray-400 text-sm">{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
