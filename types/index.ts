import { Product, ProductVariant, Order, User, Review, OrderStatus, PaymentMethod } from "@prisma/client";

export type { Product, ProductVariant, Order, User, Review, OrderStatus, PaymentMethod };

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface OrderWithDetails extends Order {
  user: User;
  product: Product;
  variant?: ProductVariant | null;
  review?: Review | null;
}

export interface ProductWithOrders extends Product {
  orders: Order[];
}

export interface UserWithOrders extends User {
  orders: OrderWithDetails[];
}

export interface CreateOrderInput {
  productId: string;
  variantId: string;
  paymentMethod: PaymentMethod;
  playerInfo?: Record<string, any>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateVariantInput {
  name?: string;
  description?: string;
  basePrice?: number;
  currentPrice?: number;
  discount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  totalRevenue: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: OrderWithDetails[];
}
