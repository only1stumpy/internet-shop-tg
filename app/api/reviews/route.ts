import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewToChannel } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, rating, comment } = body;

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only review completed orders" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId,
        userId,
        rating,
        comment,
      },
    });

    // Send review to channel
    await sendReviewToChannel({
      username: order.user.username || "Аноним",
      orderDate: order.createdAt.toLocaleDateString("ru-RU"),
      productName: order.product.name,
      comment: comment || "",
      rating,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    let reviews: any[];
    try {
      reviews = await prisma.review.findMany({
        where: productId
          ? {
              order: {
                productId,
              },
            }
          : undefined,
        include: {
          user: true,
          order: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });
    } catch (dbError) {
      console.warn("Database not available for reviews, returning empty array");
      reviews = [];
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
