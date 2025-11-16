import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderToAdmin } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        product: true,
        variant: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, variantId, paymentMethod, playerInfo, paymentScreenshot } = body;

    // Validate variant and get price
    if (!variantId) {
      return NextResponse.json({ error: "Variant ID is required" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    if (variant.productId !== productId) {
      return NextResponse.json({ error: "Variant does not belong to this product" }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        productId,
        variantId,
        paymentMethod,
        playerInfo,
        paymentScreenshot,
        amount: variant.currentPrice,
        status: "PENDING", // Всегда начинаем с PENDING, админ подтверждает
      },
      include: {
        product: true,
        variant: true,
        user: true,
      },
    });

    // Send notification to admin if screenshot provided
    if (paymentScreenshot) {
      await sendOrderToAdmin({
        orderId: order.id,
        orderNumber: order.orderNumber,
        username: order.user.username || "Unknown",
        productName: `${order.product.name} - ${variant.name}`,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        screenshotUrl: paymentScreenshot,
        playerInfo: order.playerInfo,
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
