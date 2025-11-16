"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "COMPLETED" | "REJECTED";
  totalAmount: number;
  paymentMethod: string;
  paymentScreenshot: string;
  playerInfo: any;
  createdAt: string;
  product: {
    id: string;
    name: string;
    image: string;
    currency: string;
  };
  variant: {
    id: string;
    name: string;
    currentPrice: number;
  };
  review?: {
    id: string;
  } | null;
}

const statusConfig = {
  PENDING: {
    label: "Ожидает оплаты",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: "⏳",
    description: "Ваш заказ создан и ожидает подтверждения оплаты",
  },
  PAID: {
    label: "Оплачен",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: "💳",
    description: "Оплата получена, заказ в обработке",
  },
  PROCESSING: {
    label: "В обработке",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    icon: "⚙️",
    description: "Ваш заказ обрабатывается",
  },
  COMPLETED: {
    label: "Выполнен",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: "✅",
    description: "Заказ успешно выполнен!",
  },
  REJECTED: {
    label: "Отклонен",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: "❌",
    description: "К сожалению, заказ был отклонен",
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();

      // Auto-refresh every 5 seconds to check for status updates
      const interval = setInterval(() => {
        fetchOrder();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        console.error("Order not found");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400 px-4">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg mb-4">Заказ не найден</p>
        <button
          onClick={() => router.push("/orders")}
          className="px-6 py-2 bg-[--indigo-dye] text-white rounded-xl hover:bg-[--cerulean] transition-colors"
        >
          К списку заказов
        </button>
      </div>
    );
  }

  const status = statusConfig[order.status];

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] p-6">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к заказам
        </button>
        <h1 className="text-xl font-bold text-white">Заказ #{order.orderNumber}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date(order.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Status Card */}
        <div className={`${status.bgColor} rounded-2xl p-6 text-center border-2 border-${status.color.replace('text-', '')}`}>
          <div className="text-6xl mb-3">{status.icon}</div>
          <h2 className={`text-3xl font-bold ${status.color} mb-2`}>
            {status.label}
          </h2>
          <p className="text-gray-300 text-lg">{status.description}</p>
        </div>

        {/* Thank you message and review button for completed orders */}
        {order.status === "COMPLETED" && (
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-2xl font-bold text-white text-center mb-3">
              Спасибо за ваш заказ! 🎉
            </h3>
            <p className="text-gray-300 text-center mb-4">
              Мы будем рады узнать ваше мнение о нашем сервисе
            </p>
            {!order.review ? (
              <button
                onClick={() => router.push(`/orders/${order.id}/review`)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-105"
              >
                ⭐ Оставить отзыв
              </button>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Отзыв оставлен</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Info */}
        <div className="bg-[--search] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Детали заказа</h3>
          <div className="flex items-center gap-4">
            <Image
              src={order.product.image}
              alt={order.product.name}
              width={80}
              height={80}
              className="rounded-lg"
            />
            <div className="flex-1">
              <h4 className="text-white font-semibold">{order.product.name}</h4>
              <p className="text-gray-400 text-sm">{order.variant.name}</p>
              <p className="text-[--cerulean] font-bold mt-1">
                {order.variant.currentPrice} {order.product.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-[--search] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Информация игрока</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Player ID:</span>
              <span className="text-white font-mono">{order.playerInfo.playerId}</span>
            </div>
            {order.playerInfo.server && (
              <div className="flex justify-between">
                <span className="text-gray-400">Сервер:</span>
                <span className="text-white">{order.playerInfo.server}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-[--search] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Информация об оплате</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Способ оплаты:</span>
              <span className="text-white">
                {order.paymentMethod === "APB_TRANSFER" ? "АПБ Переводилка" : "Перевод по карте"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Сумма:</span>
              <span className="text-white font-bold">
                {order.totalAmount} {order.product.currency}
              </span>
            </div>
          </div>
          {order.paymentScreenshot && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">Скриншот оплаты:</p>
              <Image
                src={order.paymentScreenshot}
                alt="Payment screenshot"
                width={300}
                height={200}
                className="rounded-lg w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
