"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTelegramUser } from "@/lib/hooks/useTelegramUser";
import type { Order, Product } from "@prisma/client";

interface OrderWithProduct extends Order {
  product: Product;
}

export default function OrdersPage() {
  const { user, loading: userLoading } = useTelegramUser();
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?userId=${user?.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500";
      case "PROCESSING":
        return "text-blue-500";
      case "REJECTED":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Ожидает";
      case "PAID":
        return "Оплачен";
      case "PROCESSING":
        return "В обработке";
      case "COMPLETED":
        return "Выполнен";
      case "REJECTED":
        return "Отклонен";
      default:
        return status;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-4 pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg mb-4">У вас пока нет заказов</p>
          <Link
            href="/"
            className="px-6 py-2 bg-[--indigo-dye] text-white rounded-xl hover:bg-[--cerulean] transition-colors"
          >
            Перейти к покупкам
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-2xl p-4"
            >
              <div className="flex items-start gap-4">
                <Image
                  src={order.product.image}
                  alt={order.product.name}
                  width={80}
                  height={80}
                  className="rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{order.product.name}</h3>
                      <p className="text-gray-400 text-sm">#{order.orderNumber}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-lg ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Дата:</span>
                      <span className="text-white">
                        {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Сумма:</span>
                      <span className="text-white font-semibold">
                        {order.amount} {order.product.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Способ оплаты:</span>
                      <span className="text-white">
                        {order.paymentMethod === "APB_TRANSFER" ? "АПБ" : "Карта"}
                      </span>
                    </div>
                  </div>

                  {order.status === "COMPLETED" && !order.review && (
                    <Link
                      href={`/orders/${order.id}/review`}
                      className="mt-3 w-full block text-center bg-[--indigo-dye] hover:bg-[--cerulean] text-white py-2 rounded-xl transition-colors text-sm"
                    >
                      Оставить отзыв
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
