"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTelegramUser } from "@/lib/hooks/useTelegramUser";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useTelegramUser();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Необходимо войти");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.id,
          userId: user.id,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        router.push("/orders");
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка при создании отзыва");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Ошибка при создании отзыва");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Оставить отзыв</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-2xl p-6">
          <label className="block text-white mb-3 font-semibold">Оценка</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-12 h-12 transition-colors ${
                    star <= rating ? "text-yellow-400 fill-current" : "text-gray-600"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-2xl p-6">
          <label className="block text-white mb-3 font-semibold">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите о вашем опыте..."
            className="w-full bg-[--search] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--indigo-dye] min-h-[120px] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[--indigo-dye] hover:bg-[--cerulean] disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          {submitting ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
}
