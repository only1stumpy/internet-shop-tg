import type { Review, User } from "@prisma/client";

interface ReviewCardProps {
  review: Review & { user: User };
  orderDate?: string;
  productName?: string;
}

export default function ReviewCard({ review, orderDate, productName }: ReviewCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (username?: string, firstName?: string) => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "N";
  };

  return (
    <div className="bg-[--search] rounded-xl p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {getInitials(review.user.username || undefined, review.user.firstName || undefined)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[--cerulean] font-medium">
              {review.user.username || review.user.firstName || "Пользователь"}
            </span>
            <span className="text-gray-400 text-xs">{formatDate(review.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-600"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-white text-sm ml-1">{review.rating}.0 средний рейтинг</span>
          </div>
          <p className="text-white text-sm leading-relaxed">{review.comment}</p>
          {productName && (
            <div className="mt-2 flex items-center gap-2">
              <div className="bg-[--header] px-3 py-1 rounded-lg">
                <span className="text-gray-400 text-xs">{productName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
