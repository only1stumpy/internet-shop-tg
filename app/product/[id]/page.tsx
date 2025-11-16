"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { ProductWithVariants, ProductVariant } from "@/types";
import ReviewCard from "@/components/ReviewCard";
import { useTelegramUser } from "@/lib/hooks/useTelegramUser";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useTelegramUser();
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Order form state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"APB_TRANSFER" | "CARD_TRANSFER" | null>(null);
  const [playerInfo, setPlayerInfo] = useState({ playerId: "", server: "" });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

      // Ensure variants exists
      if (!data.variants) {
        data.variants = [];
      }

      setProduct(data);
      // Auto-select first variant
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleOrderClick = () => {
    if (!user) {
      alert("Необходимо войти через Telegram для оформления заказа");
      return;
    }
    if (!selectedVariant) {
      alert("Пожалуйста, выберите пакет");
      return;
    }
    if (!playerInfo.playerId) {
      alert("Пожалуйста, введите Player ID");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleSubmit = async () => {
    if (!screenshot || !paymentMethod || !selectedVariant || !user) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    if (!playerInfo.playerId) {
      alert("Пожалуйста, введите Player ID");
      return;
    }

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
          productId: product!.id,
          variantId: selectedVariant.id,
          paymentMethod,
          playerInfo,
          paymentScreenshot: url,
        }),
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setShowPaymentModal(false);
        router.push(`/orders/${orderData.id}`);
      } else {
        const error = await orderRes.json();
        alert(error.error || "Ошибка при создании заказа");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Ошибка при создании заказа");
    } finally {
      setUploading(false);
    }
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

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="min-h-screen pb-6">
      {/* Product Header */}
      <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] p-6">
        <div className="flex items-center justify-center mb-4">
          <Image src={product.image} alt={product.name} width={150} height={150} />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">{product.name}</h1>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-4 space-y-6">
        {/* Variant Selection */}
        <div>
          <label className="block text-white mb-3 text-sm font-semibold">
            Выберите пакет
          </label>
          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-2">
              {product.variants.map((variant) => {
                const hasDiscount = variant.discount > 0;
                const isSelected = selectedVariant?.id === variant.id;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`w-full text-left p-4 rounded-xl transition-all border-2 ${
                      isSelected
                        ? "bg-[--cerulean] border-white shadow-lg"
                        : "bg-[--search] border-transparent hover:bg-[--indigo-dye]/20 hover:border-[--indigo-dye]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{variant.name}</div>
                        {variant.description && (
                          <div className="text-gray-300 text-sm mt-1">
                            {variant.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {hasDiscount && (
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-gray-300 line-through text-sm">
                              {variant.basePrice} {product.currency}
                            </span>
                            <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                              -{variant.discount}%
                            </span>
                          </div>
                        )}
                        <div className="font-bold text-lg text-white">
                          {variant.currentPrice} {product.currency}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-[--search] rounded-xl p-6 text-center">
              <p className="text-gray-400">У этого товара пока нет доступных вариантов</p>
            </div>
          )}
        </div>

        {/* Player Info */}
        <div>
          <label className="block text-white mb-2 text-sm font-semibold">Player ID</label>
          <input
            type="text"
            value={playerInfo.playerId}
            onChange={(e) => setPlayerInfo({ ...playerInfo, playerId: e.target.value })}
            className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye]"
            placeholder="Введите ваш Player ID"
          />
        </div>

        {/* Order Button */}
        <button
          onClick={handleOrderClick}
          disabled={!selectedVariant || !playerInfo.playerId || !user}
          className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
        >
          {selectedVariant ? `Заказать за ${selectedVariant.currentPrice} ${product.currency}` : "Выберите пакет"}
        </button>

        {!user && (
          <p className="text-yellow-500 text-sm text-center">
            Необходимо войти через Telegram для оформления заказа
          </p>
        )}

        {/* Description Section */}
        <div className="bg-[--search] rounded-xl p-4 mt-6">
          <h2 className="text-white font-bold text-lg mb-3">Описание</h2>
          <p className="text-white leading-relaxed">{product.description}</p>

          <div className="mt-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Как заказать:</h3>
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                Выберите нужный пакет
              </h4>
              <p className="text-gray-300 text-sm ml-8">
                Выберите нужное количество {product.name}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                Введите Player ID
              </h4>
              <p className="text-gray-300 text-sm ml-8">
                Введите ваш Player ID из профиля в игре
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                Выберите способ оплаты
              </h4>
              <p className="text-gray-300 text-sm ml-8">
                Переводилка АПБ или перевод по номеру карты
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="bg-[--indigo-dye] w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  4
                </span>
                Загрузите скриншот оплаты
              </h4>
              <p className="text-gray-300 text-sm ml-8">
                Сделайте скриншот подтверждения оплаты и загрузите его
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-white font-bold text-lg mb-3">Отзывы</h2>
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
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="bg-[--indigo-dye] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[--indigo-dye] p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Оплата</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  Способ оплаты
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod("APB_TRANSFER")}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      paymentMethod === "APB_TRANSFER"
                        ? "bg-[--cerulean] ring-2 ring-white"
                        : "bg-[--search] hover:bg-[--cerulean]/20"
                    }`}
                  >
                    <div className="font-semibold text-white mb-1">Переводилка АПБ</div>
                    <div className="text-sm text-gray-400">Перевод через АПБ переводилку</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("CARD_TRANSFER")}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      paymentMethod === "CARD_TRANSFER"
                        ? "bg-[--cerulean] ring-2 ring-white"
                        : "bg-[--search] hover:bg-[--cerulean]/20"
                    }`}
                  >
                    <div className="font-semibold text-white mb-1">Перевод по карте</div>
                    <div className="text-sm text-gray-400">Перевод на номер карты</div>
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              {paymentMethod && (
                <div className="bg-[--cerulean]/30 rounded-xl p-4 border border-white/30">
                  <h3 className="text-white font-semibold mb-2">Данные для перевода:</h3>
                  {paymentMethod === "APB_TRANSFER" ? (
                    <div className="text-gray-300">
                      <p>
                        Номер переводилки:{" "}
                        <span className="text-white font-mono">+123456789</span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-300">
                      <p>
                        Номер карты:{" "}
                        <span className="text-white font-mono">1234 5678 9012 3456</span>
                      </p>
                      <p>
                        Имя: <span className="text-white">IVAN IVANOV</span>
                      </p>
                    </div>
                  )}
                  {selectedVariant && (
                    <p className="text-yellow-400 mt-2 font-semibold">
                      Сумма: {selectedVariant.currentPrice} {product.currency}
                    </p>
                  )}
                </div>
              )}

              {/* Screenshot Upload */}
              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  Скриншот оплаты
                </label>
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
                    className="flex items-center justify-center w-full bg-[--search] hover:bg-[--cerulean]/20 text-white p-6 rounded-xl cursor-pointer transition-colors border-2 border-dashed border-gray-600"
                  >
                    {screenshot ? (
                      <div className="text-center">
                        <svg
                          className="w-8 h-8 mx-auto mb-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm">{screenshot.name}</span>
                      </div>
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

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!screenshot || !paymentMethod || uploading}
                className="w-full bg-[--cerulean] hover:bg-white hover:text-[--indigo-dye] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
              >
                {uploading ? "Отправка..." : "Подтвердить заказ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
