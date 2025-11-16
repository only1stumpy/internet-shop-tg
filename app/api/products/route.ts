import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockProducts } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Try to use database first, fallback to mock data
    let products;
    try {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(category && { category: category as any }),
        },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    } catch (dbError) {
      console.warn("Database not available, using mock data");
      products = mockProducts.filter((p) => {
        if (category && p.category !== category) return false;
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
    console.log("📦 POST /api/products - Starting product creation");
    const body = await request.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Auto-calculate sortOrder (max + 1)
    const maxSortOrder = await prisma.product.aggregate({
      _max: {
        sortOrder: true,
      },
    });
    const sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;
    console.log("📦 Calculated sortOrder:", sortOrder);

    const productData = {
      name: body.name,
      description: body.description,
      category: body.category,
      gameType: body.gameType,
      image: body.image,
      currency: body.currency || "₽",
      sortOrder,
    };
    console.log("📦 Product data to create:", JSON.stringify(productData, null, 2));

    const product = await prisma.product.create({
      data: productData,
      include: {
        variants: true,
      },
    });

    console.log("✅ Product created successfully:", product.id);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({
      error: "Failed to create product",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
