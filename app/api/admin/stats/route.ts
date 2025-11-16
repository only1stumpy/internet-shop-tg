import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get total revenue (completed orders only)
    const revenueResult = await prisma.order.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      include: {
        user: true,
        product: true,
        variant: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenueResult._sum.amount || 0,
      ordersByStatus: statusCounts,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
