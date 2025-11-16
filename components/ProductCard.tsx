import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/types";

interface ProductCardProps {
  product: ProductWithVariants;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Calculate min price and max discount from variants
  const variants = product.variants || [];

  const minPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.currentPrice))
    : 0;

  const maxDiscount = variants.length > 0
    ? Math.max(...variants.map(v => v.discount))
    : 0;

  const hasDiscount = maxDiscount > 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="block bg-gradient-to-br from-[#1a2444] to-[#0d1428] rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200"
    >
      <div className="relative">
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            до -{maxDiscount}%
          </div>
        )}
        <div className="p-4 flex items-center justify-center">
          <Image
            src={product.image}
            alt={product.name}
            width={120}
            height={120}
            className="object-contain"
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold mb-1">{product.name}</h3>
        <div className="flex items-center gap-2">
          {variants.length > 0 ? (
            <span className="text-white font-bold">
              от {minPrice} {product.currency}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Нет доступных вариантов</span>
          )}
        </div>
      </div>
    </Link>
  );
}
