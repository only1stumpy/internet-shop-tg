"use client";

import { useEffect, useState } from "react";
import type { ProductWithVariants, ProductVariant } from "@/types";
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
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    type: "product" | "variant";
  } | null>(null);

  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      // Ensure all products have variants array
      const productsWithVariants = data.map((p: any) => ({
        ...p,
        variants: p.variants || [],
      }));
      setProducts(productsWithVariants);
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

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleProductEdit = async (
    productId: string,
    field: string,
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
          prev.map((p) => (p.id === productId ? { ...p, ...updatedProduct } : p))
        );
        setEditingCell(null);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Ошибка при обновлении");
    }
  };

  const handleVariantEdit = async (
    variantId: string,
    field: string,
    value: string | number | boolean
  ) => {
    try {
      const res = await fetch(`/api/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        const updatedVariant = await res.json();
        setProducts((prev) =>
          prev.map((product) => ({
            ...product,
            variants: product.variants.map((v) => (v.id === variantId ? updatedVariant : v)),
          }))
        );
        setEditingCell(null);
      }
    } catch (error) {
      console.error("Error updating variant:", error);
      alert("Ошибка при обновлении варианта");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот товар?")) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert("Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Ошибка при удалении товара");
    }
  };

  const handleDeleteVariant = async (variantId: string, productId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот вариант?")) return;

    try {
      const res = await fetch(`/api/variants/${variantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants: product.variants.filter((v) => v.id !== variantId),
                }
              : product
          )
        );
      } else {
        alert("Ошибка при удалении варианта");
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert("Ошибка при удалении варианта");
    }
  };

  const EditableProductCell = ({
    product,
    field,
    type = "text",
  }: {
    product: ProductWithVariants;
    field: keyof ProductWithVariants;
    type?: "text" | "number" | "checkbox";
  }) => {
    const isEditing =
      editingCell?.id === product.id &&
      editingCell?.field === field &&
      editingCell?.type === "product";
    const [value, setValue] = useState(product[field]);

    const handleSave = () => {
      handleProductEdit(product.id, field, value);
    };

    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={product[field] as boolean}
          onChange={(e) => handleProductEdit(product.id, field, e.target.checked)}
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
        onClick={() => setEditingCell({ id: product.id, field, type: "product" })}
        className="cursor-pointer hover:bg-[--indigo-dye]/30 px-2 py-1 rounded transition-colors"
      >
        {product[field]?.toString() || "-"}
      </div>
    );
  };

  const EditableVariantCell = ({
    variant,
    field,
    type = "text",
  }: {
    variant: ProductVariant;
    field: keyof ProductVariant;
    type?: "text" | "number" | "checkbox";
  }) => {
    const isEditing =
      editingCell?.id === variant.id &&
      editingCell?.field === field &&
      editingCell?.type === "variant";
    const [value, setValue] = useState(variant[field]);

    const handleSave = () => {
      handleVariantEdit(variant.id, field, value);
    };

    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={variant[field] as boolean}
          onChange={(e) => handleVariantEdit(variant.id, field, e.target.checked)}
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
        onClick={() => setEditingCell({ id: variant.id, field, type: "variant" })}
        className="cursor-pointer hover:bg-[--indigo-dye]/30 px-2 py-1 rounded transition-colors"
      >
        {variant[field]?.toString() || "-"}
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
        <div className="mt-6 space-y-4">
          {/* Add Product Button */}
          <button
            onClick={() => setShowAddProductModal(true)}
            className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить товар
          </button>

          {products.map((product) => {
            const isExpanded = expandedProducts.has(product.id);

            return (
              <div key={product.id} className="bg-[--search] rounded-xl overflow-hidden">
                {/* Product Header */}
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="text-white cursor-pointer"
                    onClick={() => toggleProductExpand(product.id)}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </div>
                  <div
                    className="flex-1 grid grid-cols-4 gap-4 items-center cursor-pointer"
                    onClick={() => toggleProductExpand(product.id)}
                  >
                    <div className="text-white font-semibold">{product.name}</div>
                    <div className="text-gray-400 text-sm">{product.category}</div>
                    <div className="text-gray-400 text-sm">{product.variants.length} вариантов</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.isActive}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleProductEdit(product.id, "isActive", e.target.checked);
                        }}
                        className="w-5 h-5"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-gray-400 text-sm">Активен</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    className="text-red-500 hover:text-red-400 p-2"
                    title="Удалить товар"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Variants Table */}
                {isExpanded && (
                  <div className="border-t border-gray-700">
                    {/* Add Variant Button */}
                    <div className="p-4 border-b border-gray-700">
                      <button
                        onClick={() => setShowAddVariantModal(product.id)}
                        className="w-full bg-[--indigo-dye]/50 hover:bg-[--indigo-dye] text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Добавить вариант
                      </button>
                    </div>

                    {product.variants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[--header]">
                            <tr className="text-left">
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Название
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Базовая цена
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Текущая цена
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Скидка %
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Активен
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Порядок
                              </th>
                              <th className="p-3 text-white font-semibold whitespace-nowrap">
                                Действия
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((variant) => (
                              <tr
                                key={variant.id}
                                className="border-t border-gray-700 hover:bg-[--header]/50"
                              >
                                <td className="p-3 text-white">
                                  <EditableVariantCell variant={variant} field="name" />
                                </td>
                                <td className="p-3 text-white">
                                  <EditableVariantCell
                                    variant={variant}
                                    field="basePrice"
                                    type="number"
                                  />
                                </td>
                                <td className="p-3 text-white">
                                  <EditableVariantCell
                                    variant={variant}
                                    field="currentPrice"
                                    type="number"
                                  />
                                </td>
                                <td className="p-3 text-white">
                                  <EditableVariantCell
                                    variant={variant}
                                    field="discount"
                                    type="number"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <EditableVariantCell
                                    variant={variant}
                                    field="isActive"
                                    type="checkbox"
                                  />
                                </td>
                                <td className="p-3 text-white">
                                  <EditableVariantCell
                                    variant={variant}
                                    field="sortOrder"
                                    type="number"
                                  />
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => handleDeleteVariant(variant.id, product.id)}
                                    className="text-red-500 hover:text-red-400"
                                    title="Удалить вариант"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-400">У этого товара нет вариантов</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-gray-400 text-sm mt-4">
            💡 Нажмите на товар, чтобы раскрыть варианты. Нажмите на ячейку для редактирования.
            Enter - сохранить, Escape - отменить
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
                    <div className="text-white font-medium">
                      {order.product.name}
                      {order.variant && (
                        <span className="text-gray-400 text-sm ml-2">- {order.variant.name}</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">@{order.user.username || "Unknown"}</div>
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onSuccess={() => {
            setShowAddProductModal(false);
            fetchProducts();
          }}
        />
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && (
        <AddVariantModal
          productId={showAddVariantModal}
          onClose={() => setShowAddVariantModal(null)}
          onSuccess={() => {
            setShowAddVariantModal(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

// Add Product Modal
function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "GAME",
    image: "https://placehold.co/200x200/1a2444/fefcfb?text=Product",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json();
        console.error("Server error:", errorData);
        alert(
          `Ошибка при создании товара: ${errorData.details || errorData.error || "Неизвестная ошибка"}`
        );
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert(
        `Ошибка при создании товара: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="bg-[--header] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Добавить товар</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2 text-sm">Название</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                placeholder="Например: Mobile Legends"
              />
            </div>

            <div>
              <label className="block text-white mb-2 text-sm">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                placeholder="Описание товара"
              />
            </div>

            <div>
              <label className="block text-white mb-2 text-sm">Категория</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
              >
                <option value="GAME">Игра</option>
                <option value="SERVICE">Сервис</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2 text-sm">URL изображения</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                required
                className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="bg-[--indigo-dye]/20 rounded-xl p-3 text-sm">
              <p className="text-gray-300">📊 Порядок сортировки определяется автоматически</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              {loading ? "Создание..." : "Создать товар"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add Variant Modal
function AddVariantModal({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    basePrice: 0,
    currentPrice: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productId,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json();
        console.error("Server error:", errorData);
        alert(
          `Ошибка при создании варианта: ${errorData.details || errorData.error || "Неизвестная ошибка"}`
        );
      }
    } catch (error) {
      console.error("Error creating variant:", error);
      alert(
        `Ошибка при создании варианта: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="bg-[--header] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Добавить вариант</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2 text-sm">Название варианта</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                placeholder="Например: 100 + 10 алмазов 💎"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm">Базовая цена ₽</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
                  }
                  required
                  step="0.01"
                  min="0"
                  className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm">Текущая цена ₽</label>
                <input
                  type="number"
                  value={formData.currentPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })
                  }
                  required
                  step="0.01"
                  min="0"
                  className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                  placeholder="85"
                />
              </div>
            </div>

            <div className="bg-[--indigo-dye]/20 rounded-xl p-3 text-sm">
              <p className="text-gray-300">💡 Скидка рассчитывается автоматически</p>
              <p className="text-gray-300 mt-1">📊 Порядок сортировки определяется автоматически</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              {loading ? "Создание..." : "Создать вариант"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
