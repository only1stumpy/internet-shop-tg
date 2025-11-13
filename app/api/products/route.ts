import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockProducts } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const gameType = searchParams.get("gameType");

    // Try to use database first, fallback to mock data
    let products;
    try {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(category && { category: category as any }),
          ...(gameType && { gameType: gameType as any }),
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    } catch (dbError) {
      console.warn("Database not available, using mock data");
      products = mockProducts.filter((p) => {
        if (category && p.category !== category) return false;
        if (gameType && p.gameType !== gameType) return false;
        return p.isActive;
      });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        gameType: body.gameType,
        image: body.image,
        basePrice: body.basePrice,
        currentPrice: body.currentPrice,
        discount: body.discount || 0,
        currency: body.currency || "₽",
        sortOrder: body.sortOrder || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
