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
    const { userId, productId, paymentMethod, playerInfo, paymentScreenshot } = body;

    // Get product to calculate amount
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        productId,
        paymentMethod,
        playerInfo,
        paymentScreenshot,
        amount: product.currentPrice,
        status: paymentScreenshot ? "PAID" : "PENDING",
      },
      include: {
        product: true,
        user: true,
      },
    });

    // Send notification to admin if screenshot provided
    if (paymentScreenshot) {
      await sendOrderToAdmin({
        orderId: order.id,
        orderNumber: order.orderNumber,
        username: order.user.username || "Unknown",
        productName: order.product.name,
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
