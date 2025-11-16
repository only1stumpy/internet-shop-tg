import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("💎 POST /api/variants - Starting variant creation");
    const body = await request.json();
    console.log("💎 Request body:", JSON.stringify(body, null, 2));

    const { productId, name, basePrice, currentPrice } = body;

    if (!productId || !name || basePrice === undefined || currentPrice === undefined) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Auto-calculate discount
    const discount = basePrice > 0
      ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
      : 0;
    console.log("💎 Calculated discount:", discount, "%");

    // Auto-calculate sortOrder (max + 1 for this product)
    const maxSortOrder = await prisma.productVariant.aggregate({
      where: { productId },
      _max: {
        sortOrder: true,
      },
    });
    const sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;
    console.log("💎 Calculated sortOrder:", sortOrder);

    const variantData = {
      productId,
      name,
      basePrice,
      currentPrice,
      discount,
      sortOrder,
    };
    console.log("💎 Variant data to create:", JSON.stringify(variantData, null, 2));

    const variant = await prisma.productVariant.create({
      data: variantData,
    });

    console.log("✅ Variant created successfully:", variant.id);
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating variant:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({
      error: "Failed to create variant",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
