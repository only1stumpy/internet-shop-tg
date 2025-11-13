"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Product } from "@prisma/client";
import CategoryTabs from "@/components/CategoryTabs";
import ReviewCard from "@/components/ReviewCard";
import { useTelegramUser } from "@/lib/hooks/useTelegramUser";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useTelegramUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchReviews();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${params.id}`);
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleOrder = () => {
    if (!user) {
      alert("Необходимо войти через Telegram");
      return;
    }
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--cerulean]"></div>
      </div>
    );
  }

  if (!product) {
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
        <p className="text-lg mb-4">Товар не найден</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[--indigo-dye] text-white rounded-xl hover:bg-[--cerulean] transition-colors"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  const hasDiscount = product.discount > 0;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="min-h-screen pb-24">
      {/* Product Header */}
      <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] p-6">
        <div className="flex items-center justify-center mb-4">
          <Image src={product.image} alt={product.name} width={200} height={200} />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">{product.name}</h1>
        {hasDiscount && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm font-bold">
              -{product.discount}%
            </span>
          </div>
        )}
        <div className="text-center">
          {hasDiscount && (
            <span className="text-gray-400 line-through mr-2">
              {product.basePrice} {product.currency}
            </span>
          )}
          <span className={`text-2xl font-bold ${hasDiscount ? "text-red-500" : "text-white"}`}>
            {product.currentPrice} {product.currency}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <CategoryTabs
          tabs={[
            { id: "description", label: "Описание" },
            { id: "instruction", label: "Инструкция" },
            { id: "reviews", label: "Отзывы" },
          ]}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {activeTab === "description" && (
          <div className="bg-[--search] rounded-xl p-4">
            <p className="text-white leading-relaxed">{product.description}</p>
          </div>
        )}

        {activeTab === "instruction" && (
          <div className="bg-[--search] rounded-xl p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    1
                  </span>
                  Выберите нужное количество
                </h3>
                <p className="text-gray-300 text-sm ml-8">
                  Выберите нужный пакет {product.name} для пополнения
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Введите Player ID
                </h3>
                <p className="text-gray-300 text-sm ml-8">
                  Введите ваш Player ID из профиля в игре
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    3
                  </span>
                  Выберите способ оплаты
                </h3>
                <p className="text-gray-300 text-sm ml-8">
                  Переводилка АПБ или перевод по номеру карты
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    4
                  </span>
                  Загрузите скриншот оплаты
                </h3>
                <p className="text-gray-300 text-sm ml-8">
                  Сделайте скриншот подтверждения оплаты и загрузите его
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <div className="flex items-center gap-4 mb-4 bg-[--search] rounded-xl p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{avgRating}</div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(parseFloat(avgRating))
                          ? "text-yellow-400 fill-current"
                          : "text-gray-600"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {reviews.length} {reviews.length === 1 ? "отзыв" : "отзывов"}
                </div>
              </div>
            </div>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  orderDate={new Date(review.order.createdAt).toLocaleDateString("ru-RU")}
                  productName={product.name}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>Пока нет отзывов</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[--header] p-4 border-t border-gray-800">
        <button
          onClick={handleOrder}
          className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] text-white font-semibold py-4 rounded-xl transition-colors"
        >
          Заказать за {product.currentPrice} {product.currency}
        </button>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <OrderModal
          product={product}
          user={user}
          onClose={() => setShowOrderModal(false)}
          onSuccess={() => {
            setShowOrderModal(false);
            router.push("/orders");
          }}
        />
      )}
    </div>
  );
}

// Order Modal Component
function OrderModal({
  product,
  user,
  onClose,
  onSuccess,
}: {
  product: Product;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"payment" | "upload">("payment");
  const [paymentMethod, setPaymentMethod] = useState<"APB_TRANSFER" | "CARD_TRANSFER" | null>(
    null
  );
  const [playerInfo, setPlayerInfo] = useState({ playerId: "", server: "" });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePaymentSelect = (method: "APB_TRANSFER" | "CARD_TRANSFER") => {
    setPaymentMethod(method);
    setStep("upload");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot || !paymentMethod) return;

    setUploading(true);
    try {
      // Upload screenshot
      const formData = new FormData();
      formData.append("file", screenshot);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await uploadRes.json();

      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          paymentMethod,
          playerInfo,
          paymentScreenshot: url,
        }),
      });

      if (orderRes.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Ошибка при создании заказа");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-[--header] rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Оформление заказа</h2>
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

          {step === "payment" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 text-sm">Player ID</label>
                <input
                  type="text"
                  value={playerInfo.playerId}
                  onChange={(e) => setPlayerInfo({ ...playerInfo, playerId: e.target.value })}
                  className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
                  placeholder="Введите ваш Player ID"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm">Способ оплаты</label>
                <div className="space-y-3">
                  <button
                    onClick={() => handlePaymentSelect("APB_TRANSFER")}
                    className="w-full bg-[--search] hover:bg-[--indigo-dye] text-white p-4 rounded-xl transition-colors text-left"
                  >
                    <div className="font-semibold mb-1">Переводилка АПБ</div>
                    <div className="text-sm text-gray-400">Перевод через АПБ переводилку</div>
                  </button>
                  <button
                    onClick={() => handlePaymentSelect("CARD_TRANSFER")}
                    className="w-full bg-[--search] hover:bg-[--indigo-dye] text-white p-4 rounded-xl transition-colors text-left"
                  >
                    <div className="font-semibold mb-1">Перевод по карте</div>
                    <div className="text-sm text-gray-400">Перевод на номер карты</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div className="bg-[--search] rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">Данные для перевода:</h3>
                {paymentMethod === "APB_TRANSFER" ? (
                  <div className="text-gray-300">
                    <p>Номер переводилки: <span className="text-white font-mono">+123456789</span></p>
                  </div>
                ) : (
                  <div className="text-gray-300">
                    <p>Номер карты: <span className="text-white font-mono">1234 5678 9012 3456</span></p>
                    <p>Имя: <span className="text-white">IVAN IVANOV</span></p>
                  </div>
                )}
                <p className="text-yellow-400 mt-2 text-sm">
                  Сумма: {product.currentPrice} {product.currency}
                </p>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm">Скриншот оплаты</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex items-center justify-center w-full bg-[--search] hover:bg-[--indigo-dye] text-white p-6 rounded-xl cursor-pointer transition-colors"
                  >
                    {screenshot ? (
                      <span>{screenshot.name}</span>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-gray-400">Нажмите для загрузки</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!screenshot || uploading}
                className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
              >
                {uploading ? "Отправка..." : "Подтвердить заказ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
